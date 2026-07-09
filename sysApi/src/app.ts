import express, { type NextFunction, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken, hashToken } from "./tokens";
import { createRateLimiter, type RateLimiter } from "./rate-limit";
import { validateRegistration, validateUsername, validatePassword } from "./validation";
import type { Store } from "./store";

// [apiIntf自訂帳號存檔服務]：同站 `/api/*` HTTP JSON 介面＋遊戲殼靜態服務（design.md ＜II.D＞）。
// 錯誤體統一 {error:{code,message}}；登入失敗統一 invalid-credentials（不洩漏帳號存在性，spec#23）。
export const BCRYPT_COST = 10;
export const SAVE_SCHEMA_VERSION = "1";
const JSON_BODY_LIMIT = "1mb"; // 請求體大小上限（spec#24；normalized state 全量遠小於此）

export interface AppOptions {
  store: Store;
  sessionSecret: string;
  sessionTtlMs: number;
  staticRoot?: string | null;
  rateLimiter?: RateLimiter;
  now?: () => number;
  bcryptCost?: number;
}

interface AuthedRequest extends Request {
  accountId?: string;
  tokenHash?: string;
}

export function createApp(options: AppOptions) {
  const {
    store,
    sessionSecret,
    sessionTtlMs,
    staticRoot = null,
    rateLimiter = createRateLimiter({ max: 10, windowMs: 10 * 60 * 1000 }),
    now = Date.now,
    bcryptCost = BCRYPT_COST
  } = options;

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  function fail(res: Response, status: number, code: string, message: string) {
    res.status(status).json({ error: { code, message } });
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

  function accountPayload(username: string, createdAt: number) {
    return { username, createdAt };
  }

  app.post("/api/auth/register", async (req, res, nextFn) => {
    try {
      const ip = req.ip || "unknown";
      if (rateLimiter.isLimited(`register:${ip}`, now())) {
        return fail(res, 429, "rate-limited", "Too many attempts. Please wait and try again.");
      }
      const { username, password } = req.body || {};
      const validationError = validateRegistration(username, password);
      if (validationError) {
        rateLimiter.recordFailure(`register:${ip}`, now());
        return fail(res, 422, validationError, validationMessage(validationError));
      }
      const passwordHash = bcrypt.hashSync(password, bcryptCost);
      const account = await store.createAccount(username, passwordHash, now());
      if (account === "taken") {
        rateLimiter.recordFailure(`register:${ip}`, now());
        return fail(res, 409, "username-taken", "This username is already taken.");
      }
      const token = await issueSession(account.accountId);
      res.status(201).json({ token, account: accountPayload(account.username, account.createdAt) });
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
        return fail(res, 429, "rate-limited", "Too many attempts. Please wait and try again.");
      }
      // 登入失敗統一訊息與時序：帳號不存在時仍比對假雜湊，避免時間差洩漏帳號存在性。
      const account = validateUsername(username) && validatePassword(password) === null
        ? await store.getAccountByUsername(username)
        : null;
      const passwordOk = account
        ? bcrypt.compareSync(password, account.passwordHash)
        : (bcrypt.compareSync("invalid-password", FAKE_HASH), false);
      if (!account || !passwordOk) {
        rateLimiter.recordFailure(limiterKey, now());
        return fail(res, 401, "invalid-credentials", "Username or password is incorrect.");
      }
      rateLimiter.reset(limiterKey);
      const token = await issueSession(account.accountId);
      res.json({ token, account: accountPayload(account.username, account.createdAt) });
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
      req.accountId = session.accountId;
      req.tokenHash = tokenHash;
      nextFn();
    } catch (error) {
      nextFn(error);
    }
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
      const save = await store.getSave(req.accountId as string);
      res.json({
        state: save ? save.state : null,
        schemaVersion: save ? save.schemaVersion : null,
        updatedAt: save ? save.updatedAt : null,
        serverTime: now()
      });
    } catch (error) {
      nextFn(error);
    }
  });

  app.put("/api/save", requireSession, async (req: AuthedRequest, res, nextFn) => {
    try {
      const { state, schemaVersion, baseUpdatedAt } = req.body || {};
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        return fail(res, 422, "invalid-state", "Save state must be a JSON object.");
      }
      const base = baseUpdatedAt === null || baseUpdatedAt === undefined ? null : Number(baseUpdatedAt);
      if (base !== null && !Number.isFinite(base)) {
        return fail(res, 422, "invalid-state", "baseUpdatedAt must be a number or null.");
      }
      const result = await store.putSave(
        req.accountId as string,
        state,
        typeof schemaVersion === "string" && schemaVersion ? schemaVersion : SAVE_SCHEMA_VERSION,
        base,
        now()
      );
      if (!result.ok) {
        return fail(res, 409, "save-conflict", "A newer save exists. Reload before saving again.");
      }
      res.json({ updatedAt: result.updatedAt, serverTime: now() });
    } catch (error) {
      nextFn(error);
    }
  });

  app.all("/api/*", (_req, res) => fail(res, 404, "not-found", "Unknown API endpoint."));

  if (staticRoot) {
    // 遊戲殼同站服務（sysCase#3.1）；sysApi 原始碼樹不對外（.env 等；express.static 亦預設忽略 dotfiles）。
    app.use("/sysApi", (_req, res) => fail(res, 404, "not-found", "Not served."));
    app.use(express.static(staticRoot, { index: "index.html" }));
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

function validationMessage(code: string): string {
  switch (code) {
    case "invalid-username":
      return "Username must be 3-16 characters: lowercase letters and digits, starting with a letter.";
    case "password-too-short":
      return "Password must be at least 6 characters.";
    case "password-too-long":
      return "Password must be at most 72 characters.";
    default:
      return "Invalid input.";
  }
}
