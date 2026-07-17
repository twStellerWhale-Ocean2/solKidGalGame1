import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import bcrypt from "bcryptjs";
import { generateToken, hashToken } from "./tokens";
import { createRateLimiter, type RateLimiter } from "./rate-limit";
import { validateRegistration, validateUsername, validatePassword, validateLoginPassword } from "./validation";
import { derivePlayStatus, resolveSettings, UNLOCKED_POLICY, validatePlayLimitInput, validateSettingsInput } from "./admin";
import type { AccountRecord, PlayLimitPolicy, Store } from "./store";

// [apiIntf自訂帳號存檔服務]＋[apiIntf自訂線上管理服務]：同站 `/api/*`／`/api/admin/*` HTTP JSON 介面
// ＋遊戲殼與 `/admin/` 管理頁靜態服務（design.md ＜II.D＞）。
// 錯誤體統一 {error:{code,message}}；登入失敗統一 invalid-credentials（不洩漏帳號存在性，spec#23）。
export const BCRYPT_COST = 10;
export const SAVE_SCHEMA_VERSION = "1";
const JSON_BODY_LIMIT = "1mb"; // 請求體大小上限（spec#24；normalized state 全量遠小於此）

export interface AppOptions {
  store: Store;
  sessionSecret: string;
  sessionTtlMs: number;
  staticRoot?: string | null;
  /** /admin/ 靜態根（#342）：預設 staticRoot/admin-console（image 佈局）；dev/e2e 源樹分 mod 時指向 modAdmin。 */
  adminRoot?: string | null;
  rateLimiter?: RateLimiter;
  now?: () => number;
  bcryptCost?: number;
  /** paramTrustProxy（#331）：Express trust proxy 跳數；預設 0＝直連不信任 XFF。 */
  trustProxy?: number;
}

interface AuthedRequest extends Request {
  account?: AccountRecord;
  tokenHash?: string;
}

export function createApp(options: AppOptions) {
  const {
    store,
    sessionSecret,
    sessionTtlMs,
    staticRoot = null,
    adminRoot = null,
    rateLimiter = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 }),
    now = Date.now,
    bcryptCost = BCRYPT_COST,
    trustProxy = 0
  } = options;

  const app = express();
  app.disable("x-powered-by");
  // paramTrustProxy（#331）：依實際代理跳數信任 XFF（僅 ingress=1、tunnel→ingress=2），限流以真實
  // client IP 計；預設 0＝不信任（可直連者偽造 XFF 不被採信）。公網部署應以 ingress 為唯一對外入口。
  if (trustProxy > 0) app.set("trust proxy", trustProxy);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  function fail(res: Response, status: number, code: string, message: string, extra?: Record<string, unknown>) {
    res.status(status).json({ error: { code, message, ...(extra || {}) } });
  }

  // 429 統一出口（#331）：附可再試等待秒數（前端據以顯示「幾分鐘後再試」）。
  function failRateLimited(res: Response, key: string) {
    const retryAfterSeconds = Math.max(1, Math.ceil(rateLimiter.retryAfterMs(key, now()) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return fail(res, 429, "rate-limited", "Too many attempts. Please wait and try again.", { retryAfterSeconds });
  }

  // liveness／readiness（techStackNodeSvr 健康檢查；不受保護）。
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true, serverTime: now() });
  });
  app.get("/readyz", async (_req, res) => {
    const dbOk = await store.ping();
    res.status(dbOk ? 200 : 503).json({ ok: dbOk, serverTime: now() });
  });

  async function issueSession(accountId: string): Promise<string> {
    const token = generateToken();
    await store.createSession(hashToken(token, sessionSecret), accountId, now() + sessionTtlMs);
    return token;
  }

  function accountPayload(account: AccountRecord) {
    return { id: account.accountId, username: account.username, role: account.role, createdAt: account.createdAt };
  }

  async function playLimitPolicyFor(accountId: string): Promise<PlayLimitPolicy> {
    return (await store.getPlayLimit(accountId)) || UNLOCKED_POLICY;
  }

  // 公開設定最小子集（spec#26／sysCase#4.4）：登入畫面之註冊開關＋新帳號預設時長；不含任何帳號資料。
  app.get("/api/config", async (_req, res, nextFn) => {
    try {
      const settings = resolveSettings(await store.getSettings());
      res.json({
        registrationOpen: settings.registrationOpen,
        defaultPlayLimit: {
          playMinutes: settings.defaultPlayMinutes,
          restMinutes: settings.defaultRestMinutes,
          playMaxMinutes: settings.defaultPlayMaxMinutes
        }
      });
    } catch (error) {
      nextFn(error);
    }
  });

  app.post("/api/auth/register", async (req, res, nextFn) => {
    try {
      // 限流 key 一律含嘗試帳號名（paramRateLimitKey，#331）：同名重試才累計——代理／NodePort SNAT／
      // 家庭 NAT 共用來源 IP 時，甲的失敗不再鎖死乙的註冊。
      const { username, password } = req.body || {};
      const usernameKey = validateUsername(username) ? username : "invalid";
      const limiterKey = `register:${req.ip || "unknown"}:${usernameKey}`;
      if (rateLimiter.isLimited(limiterKey, now())) {
        return failRateLimited(res, limiterKey);
      }
      const settings = resolveSettings(await store.getSettings());
      if (!settings.registrationOpen) {
        return fail(res, 403, "registration-closed", "This server is not accepting new accounts right now.");
      }
      const validationError = validateRegistration(username, password);
      if (validationError) {
        rateLimiter.recordFailure(limiterKey, now());
        return fail(res, 422, validationError, validationMessage(validationError));
      }
      const passwordHash = bcrypt.hashSync(password, bcryptCost);
      const account = await store.createAccount(username, passwordHash, now());
      if (account === "taken") {
        rateLimiter.recordFailure(limiterKey, now());
        return fail(res, 409, "username-taken", "This username is already taken.");
      }
      await store.touchLastLogin(account.accountId, now());
      const token = await issueSession(account.accountId);
      res.status(201).json({ token, account: accountPayload(account) });
    } catch (error) {
      nextFn(error);
    }
  });

  app.post("/api/auth/login", async (req, res, nextFn) => {
    try {
      const { username, password } = req.body || {};
      const usernameKey = validateUsername(username) ? username : "invalid";
      const limiterKey = `login:${req.ip || "unknown"}:${usernameKey}`;
      if (rateLimiter.isLimited(limiterKey, now())) {
        return failRateLimited(res, limiterKey);
      }
      // 登入失敗統一訊息與時序：帳號不存在時仍比對假雜湊，避免時間差洩漏帳號存在性。
      // 預檢用 validateLoginPassword（舊制下限 6–72，#330 相容鐵則）：新規僅適用建立密碼時點，
      // 既有 6–7 碼舊密碼仍可登入。
      const account = validateUsername(username) && validateLoginPassword(password)
        ? await store.getAccountByUsername(username)
        : null;
      const passwordOk = account
        ? bcrypt.compareSync(password, account.passwordHash)
        : (bcrypt.compareSync("invalid-password", FAKE_HASH), false);
      if (!account || !passwordOk) {
        // 速率限制僅累計失敗嘗試、成功即清零（#309 審查 A5：防第三者定向鎖死他人帳號）。
        rateLimiter.recordFailure(limiterKey, now());
        return fail(res, 401, "invalid-credentials", "Username or password is incorrect.");
      }
      rateLimiter.reset(limiterKey);
      await store.touchLastLogin(account.accountId, now());
      // 逾期／已撤銷 session 資料列惰性清理（#309 審查 A7：登入寫入時機順掃，不常駐排程）。
      await store.cleanupSessions(now());
      const token = await issueSession(account.accountId);
      res.json({ token, account: accountPayload(account) });
    } catch (error) {
      nextFn(error);
    }
  });

  // 受保護端點一律驗 session（未帶、偽造、逾期、已撤銷 → 401）。
  async function requireSession(req: AuthedRequest, res: Response, nextFn: NextFunction) {
    try {
      const header = req.get("authorization") || "";
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
      if (!token) return fail(res, 401, "unauthorized", "A valid session is required.");
      const tokenHash = hashToken(token, sessionSecret);
      const session = await store.getSession(tokenHash);
      if (!session || session.revokedAt !== null || session.expiresAt <= now()) {
        return fail(res, 401, "unauthorized", "A valid session is required.");
      }
      const account = await store.getAccountById(session.accountId);
      if (!account) return fail(res, 401, "unauthorized", "A valid session is required.");
      req.account = account;
      req.tokenHash = tokenHash;
      nextFn();
    } catch (error) {
      nextFn(error);
    }
  }

  // 管理 API 一律驗「有效 session 且 role=admin」（solCase#25.2）：玩家 session 一律 403。
  function requireAdmin(req: AuthedRequest, res: Response, nextFn: NextFunction) {
    if (req.account?.role !== "admin") {
      return fail(res, 403, "admin-only", "This endpoint requires an admin account.");
    }
    nextFn();
  }

  app.post("/api/auth/logout", requireSession, async (req: AuthedRequest, res, nextFn) => {
    try {
      await store.revokeSession(req.tokenHash as string, now());
      res.status(204).end();
    } catch (error) {
      nextFn(error);
    }
  });

  app.get("/api/save", requireSession, async (req: AuthedRequest, res, nextFn) => {
    try {
      const accountId = (req.account as AccountRecord).accountId;
      const save = await store.getSave(accountId);
      res.json({
        state: save ? save.state : null,
        schemaVersion: save ? save.schemaVersion : null,
        updatedAt: save ? save.updatedAt : null,
        serverTime: now(),
        playLimitPolicy: await playLimitPolicyFor(accountId)
      });
    } catch (error) {
      nextFn(error);
    }
  });

  app.put("/api/save", requireSession, async (req: AuthedRequest, res, nextFn) => {
    try {
      const accountId = (req.account as AccountRecord).accountId;
      const { state, schemaVersion, baseUpdatedAt } = req.body || {};
      const shapeError = validateStateShape(state);
      if (shapeError) return fail(res, 422, "invalid-state", shapeError);
      const base = baseUpdatedAt === null || baseUpdatedAt === undefined ? null : Number(baseUpdatedAt);
      if (base !== null && !Number.isFinite(base)) {
        return fail(res, 422, "invalid-state", "baseUpdatedAt must be a number or null.");
      }
      const result = await store.putSave(
        accountId,
        state,
        typeof schemaVersion === "string" && schemaVersion ? schemaVersion : SAVE_SCHEMA_VERSION,
        base,
        now()
      );
      if (!result.ok) {
        return fail(res, 409, "save-conflict", "A newer save exists. Reload before saving again.");
      }
      // 保存回應搭載最新政策（sysCase#2.2）：admin 變更對遊玩中裝置隨下一次保存即時生效。
      res.json({ updatedAt: result.updatedAt, serverTime: now(), playLimitPolicy: await playLimitPolicyFor(accountId) });
    } catch (error) {
      nextFn(error);
    }
  });

  // ── [apiIntf自訂線上管理服務] `/api/admin/*`（sysStory#4）──
  app.get("/api/admin/accounts", requireSession, requireAdmin, async (_req, res, nextFn) => {
    try {
      const accounts = await store.listAccounts();
      res.json({
        accounts: accounts.map((row) => ({
          id: row.accountId,
          username: row.username,
          role: row.role,
          createdAt: row.createdAt,
          lastLoginAt: row.lastLoginAt,
          saveUpdatedAt: row.saveUpdatedAt,
          playLimitPolicy: row.playLimit,
          // 鎖定帳號之休息窗以政策 restMinutes 推導（與遊戲端 effectivePlayLimit 同語意）。
          playStatus: derivePlayStatus(
            row.savePlayLimit && row.playLimit.locked && row.playLimit.restMinutes !== null
              ? { ...row.savePlayLimit, restMinutes: row.playLimit.restMinutes }
              : row.savePlayLimit,
            now()
          )
        }))
      });
    } catch (error) {
      nextFn(error);
    }
  });

  app.post("/api/admin/accounts/:id/reset-password", requireSession, requireAdmin, async (req: AuthedRequest, res, nextFn) => {
    try {
      const { newPassword } = req.body || {};
      const passwordError = validatePassword(newPassword);
      if (passwordError) return fail(res, 422, passwordError, validationMessage(passwordError));
      const target = await store.getAccountById(req.params.id);
      if (!target) return fail(res, 404, "not-found", "Account not found.");
      await store.updatePasswordById(target.accountId, bcrypt.hashSync(newPassword, bcryptCost));
      // 撤銷全部既有 session；操作者重設自身密碼時保留當前管理 session（sysCase#4.2）。
      const self = target.accountId === (req.account as AccountRecord).accountId;
      await store.revokeAccountSessions(target.accountId, now(), self ? (req.tokenHash as string) : null);
      res.status(204).end();
    } catch (error) {
      nextFn(error);
    }
  });

  app.post("/api/admin/accounts/:id/revoke-sessions", requireSession, requireAdmin, async (req, res, nextFn) => {
    try {
      const target = await store.getAccountById(req.params.id);
      if (!target) return fail(res, 404, "not-found", "Account not found.");
      await store.revokeAccountSessions(target.accountId, now());
      res.status(204).end();
    } catch (error) {
      nextFn(error);
    }
  });

  app.delete("/api/admin/accounts/:id", requireSession, requireAdmin, async (req: AuthedRequest, res, nextFn) => {
    try {
      if (req.params.id === (req.account as AccountRecord).accountId) {
        return fail(res, 409, "cannot-delete-self", "Admins cannot delete their own account.");
      }
      const deleted = await store.deleteAccount(req.params.id);
      if (!deleted) return fail(res, 404, "not-found", "Account not found.");
      res.status(204).end();
    } catch (error) {
      nextFn(error);
    }
  });

  app.put("/api/admin/accounts/:id/play-limit", requireSession, requireAdmin, async (req, res, nextFn) => {
    try {
      const validated = validatePlayLimitInput(req.body);
      if (!validated.ok) return fail(res, 422, "invalid-play-limit", validated.message);
      const updated = await store.setPlayLimit(req.params.id, validated.value);
      if (!updated) return fail(res, 404, "not-found", "Account not found.");
      res.json({ playLimitPolicy: validated.value });
    } catch (error) {
      nextFn(error);
    }
  });

  app.get("/api/admin/settings", requireSession, requireAdmin, async (_req, res, nextFn) => {
    try {
      res.json(resolveSettings(await store.getSettings()));
    } catch (error) {
      nextFn(error);
    }
  });

  app.put("/api/admin/settings", requireSession, requireAdmin, async (req, res, nextFn) => {
    try {
      const validated = validateSettingsInput(req.body);
      if (!validated.ok) return fail(res, 422, "invalid-settings", validated.message);
      // 單一 admin 情境：寫入採後寫勝、不設基準比對（sysCase#4.3）；寫入即生效。
      await store.putSettings(validated.value, now());
      res.json(resolveSettings(validated.value));
    } catch (error) {
      nextFn(error);
    }
  });

  app.all("/api/*", (_req, res) => fail(res, 404, "not-found", "Unknown API endpoint."));

  if (staticRoot) {
    // 遊戲殼同站服務（sysCase#3.1）——**allowlist 靜態子樹**：只對外提供遊戲殼所需資產與 `/admin/` 管理頁，
    // 內部文件（docs/、deploy/、contract-*、scripts/、devtool/、server.mjs、sysApi/ 原始碼樹等）一律不服務
    // （#309 業界審查 B1：正式自架端不得外洩原始碼樹與維護工具頁）。
    const GAME_SHELL_DIRS = ["game-engine", "content-package", "content-base", "styles"];
    const indexFile = path.resolve(staticRoot, "index.html");
    app.get(["/", "/index.html"], (_req, res) => res.sendFile(indexFile, (error) => {
      if (error) fail(res, 404, "not-found", "Game shell not found.");
    }));
    GAME_SHELL_DIRS.forEach((dir) => {
      app.use(`/${dir}`, express.static(path.resolve(staticRoot, dir)));
    });
    // `/admin/` 線上管理頁（spec#25；頁面本身可公開取得、資料一律經受 admin 保護之 `/api/admin/*`）。
    app.use("/admin", express.static(adminRoot ? path.resolve(adminRoot) : path.resolve(staticRoot, "admin-console")));
    app.use((_req, res) => fail(res, 404, "not-found", "Not served."));
  }

  // 統一錯誤處理：JSON 解析失敗／payload 超限 → 4xx；其餘 → 500（不外洩內部細節）。
  app.use((error: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (error.type === "entity.too.large") return fail(res, 413, "payload-too-large", "Request body exceeds the limit.");
    if (error.status === 400 && error.type === "entity.parse.failed") return fail(res, 400, "invalid-json", "Request body must be valid JSON.");
    console.error("sysApi error:", error.message);
    fail(res, 500, "internal", "Internal server error.");
  });

  return app;
}

const FAKE_HASH = bcrypt.hashSync("timing-equalizer", BCRYPT_COST);

// 存檔形狀校驗（#309 審查 B9／sysCase#2.1）：頂層須為 JSON 物件、已知欄位存在時型別須合法；非法即 422 不落庫。
function validateStateShape(state: unknown): string | null {
  if (!state || typeof state !== "object" || Array.isArray(state)) return "Save state must be a JSON object.";
  const record = state as Record<string, unknown>;
  if (record.coins !== undefined && !Number.isFinite(Number(record.coins))) return "Save state field 'coins' must be a number.";
  if (record.playerName !== undefined && typeof record.playerName !== "string") return "Save state field 'playerName' must be a string.";
  if (record.playLimit !== undefined && (typeof record.playLimit !== "object" || record.playLimit === null || Array.isArray(record.playLimit))) {
    return "Save state field 'playLimit' must be an object.";
  }
  if (record.outfit !== undefined && (typeof record.outfit !== "object" || record.outfit === null || Array.isArray(record.outfit))) {
    return "Save state field 'outfit' must be an object.";
  }
  return null;
}

function validationMessage(code: string): string {
  switch (code) {
    case "invalid-username":
      return "Username must be 3-16 characters: lowercase letters and digits, with at least one letter.";
    case "password-too-short":
      return "Password must be at least 8 characters.";
    case "password-too-long":
      return "Password must be at most 72 characters.";
    case "password-needs-mix":
      return "Password needs at least one number and one lowercase letter.";
    default:
      return "Invalid input.";
  }
}
