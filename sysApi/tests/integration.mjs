// sysApi 整合測試（intTest#01/#03 部署、#13–#15、#70–#72 之 API 面；對真 Postgres＋運行中服務執行）。
// 前置：deploy/compose.yaml 之 db 已啟動（docker compose -f ../deploy/compose.yaml up -d）；已 npm run build。
// 用法：node tests/integration.mjs   （環境變數可覆寫 DATABASE_URL / TEST_PORT）
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sysApiRoot = path.resolve(here, "..");
const repoRoot = path.resolve(sysApiRoot, "..");
const PORT = Number(process.env.TEST_PORT) || 4181;
const BASE = `http://127.0.0.1:${PORT}`;
const DATABASE_URL = process.env.DATABASE_URL || "postgres://luminara:luminara@127.0.0.1:5433/luminara_test";
const SESSION_SECRET = "integration-test-pepper";
const suffix = Date.now().toString(36); // 唯一後綴使套件可重複執行
const userA = `ita${suffix}`;
const userB = `itb${suffix}`;
const adminUser = `adm${suffix}`;
const ADMIN_PASSWORD = "adminpw9";
const DEFAULT_SETTINGS = { registrationOpen: true, defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 };

let failures = 0;
function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  PASS ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204 等無 body */ }
  return { status: res.status, body: json };
}

async function waitForHealthz(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function main() {
  console.log(`sysApi integration @ ${BASE} (db: ${DATABASE_URL.replace(/:[^:@/]+@/, ":***@")})`);
  const server = spawn(process.execPath, [path.join(sysApiRoot, "dist", "server.js")], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DATABASE_URL,
      SESSION_SECRET,
      STATIC_ROOT: repoRoot,
      RATE_LIMIT_MAX: "5",
      RATE_LIMIT_WINDOW_MS: "60000",
      ADMIN_USERNAME: adminUser,
      ADMIN_PASSWORD
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

  try {
    check("server becomes healthy (/healthz 200)", await waitForHealthz());
    const ready = await fetch(`${BASE}/readyz`);
    check("readiness with real Postgres (/readyz 200)", ready.status === 200);

    // 靜態遊戲殼同站服務（intTest#01）
    const index = await fetch(`${BASE}/`);
    const indexHtml = await index.text();
    check("game shell served at / (index.html)", index.status === 200 && indexHtml.includes("game-engine/main.js"));
    const engine = await fetch(`${BASE}/game-engine/main.js`);
    check("ES modules served without 404", engine.status === 200);
    const blocked = await fetch(`${BASE}/sysApi/package.json`);
    check("sysApi source tree not served", blocked.status === 404);
    // #309 業界審查 B1：allowlist 靜態子樹——內部文件與維護工具頁不對外
    for (const forbidden of ["/docs/design.md", "/server.mjs", "/deploy/compose.yaml", "/tool/wardrobe-tuner.html", "/AGENTS.md"]) {
      const res = await fetch(`${BASE}${forbidden}`);
      check(`internal path not served: ${forbidden}`, res.status === 404);
    }
    const noSession = await api("/api/save");
    check("protected endpoint without session → 401", noSession.status === 401);

    // 註冊規則（intTest#14 後端層）
    check("register rejects invalid username (422)", (await api("/api/auth/register", { method: "POST", body: { username: "BAD", password: "secret66" } })).status === 422);
    check("register rejects short password (422)", (await api("/api/auth/register", { method: "POST", body: { username: userA, password: "123" } })).status === 422);
    const regA = await api("/api/auth/register", { method: "POST", body: { username: userA, password: "secret66" } });
    check("register succeeds (201 + token)", regA.status === 201 && /^[0-9a-f]{64}$/.test(regA.body?.token || ""));
    check("duplicate username rejected (409)", (await api("/api/auth/register", { method: "POST", body: { username: userA, password: "secret66" } })).status === 409);

    // 登入與帳號存在性遮蔽（intTest#13/#72）
    const wrongPw = await api("/api/auth/login", { method: "POST", body: { username: userA, password: "wrong66" } });
    const noUser = await api("/api/auth/login", { method: "POST", body: { username: `zz${suffix}`, password: "wrong66" } });
    check("wrong password → 401 invalid-credentials", wrongPw.status === 401 && wrongPw.body?.error?.code === "invalid-credentials");
    check("unknown user → identical 401 body", noUser.status === 401 && JSON.stringify(noUser.body) === JSON.stringify(wrongPw.body));

    // 雲端存檔 round-trip 與樂觀鎖（intTest#11/#71）
    const tokenA = regA.body.token;
    const empty = await api("/api/save", { token: tokenA });
    check("no save yet → state null + serverTime", empty.status === 200 && empty.body.state === null && Number.isFinite(empty.body.serverTime));
    const statePayload = { coins: 42, playerName: "Mimi", activeCharacterId: "lumi", outfit: { outfit: "castlePearlWhiteBallGown" } };
    const put1 = await api("/api/save", { method: "PUT", token: tokenA, body: { state: statePayload, schemaVersion: "1", baseUpdatedAt: null } });
    check("first save upsert (200 + updatedAt)", put1.status === 200 && Number.isFinite(put1.body.updatedAt));
    const readBack = await api("/api/save", { token: tokenA });
    check("cross-device read-back sees full state", readBack.body?.state?.coins === 42 && readBack.body?.state?.outfit?.outfit === "castlePearlWhiteBallGown");
    const put2 = await api("/api/save", { method: "PUT", token: tokenA, body: { state: { ...statePayload, coins: 50 }, baseUpdatedAt: put1.body.updatedAt } });
    check("subsequent save with fresh base (200)", put2.status === 200);
    const stale = await api("/api/save", { method: "PUT", token: tokenA, body: { state: { ...statePayload, coins: 1 }, baseUpdatedAt: put1.body.updatedAt } });
    check("stale base rejected (409 save-conflict)", stale.status === 409 && stale.body?.error?.code === "save-conflict");
    const afterStale = await api("/api/save", { token: tokenA });
    check("newer save not overwritten by stale writer", afterStale.body?.state?.coins === 50);

    // 跨帳號隔離（intTest#71）
    const regB = await api("/api/auth/register", { method: "POST", body: { username: userB, password: "secret66" } });
    const emptyB = await api("/api/save", { token: regB.body.token });
    check("accounts isolated (B sees no save)", emptyB.body.state === null);

    // SQL 注入字串（intTest#72）
    const inject = await api("/api/auth/login", { method: "POST", body: { username: "' OR 1=1--", password: "secret66" } });
    check("SQL-injection-looking username handled safely (401, no 500)", inject.status === 401);

    // 登出撤銷（intTest#15/#70）
    const logout = await api("/api/auth/logout", { method: "POST", token: tokenA });
    check("logout → 204", logout.status === 204);
    check("revoked token rejected (401)", (await api("/api/save", { token: tokenA })).status === 401);
    check("forged token rejected (401)", (await api("/api/save", { token: "f".repeat(64) })).status === 401);

    // 速率限制（intTest#72 步驟5；RATE_LIMIT_MAX=5）
    const limitedUser = `itl${suffix}`;
    await api("/api/auth/register", { method: "POST", body: { username: limitedUser, password: "secret66" } });
    let rateLimited = false;
    for (let i = 0; i < 7; i += 1) {
      const attempt = await api("/api/auth/login", { method: "POST", body: { username: limitedUser, password: "wrong66" } });
      if (attempt.status === 429) { rateLimited = true; break; }
    }
    check("repeated login failures hit 429 rate limit", rateLimited);

    // 密碼雜湊與維護者重設（intTest#72 步驟1、密碼重設過渡程序）
    const reset = spawnSync(process.execPath, [path.join(sysApiRoot, "dist", "cli-reset-password.js"), userB, "newpass6"], {
      env: { ...process.env, DATABASE_URL, SESSION_SECRET }
    });
    check("reset-password CLI exits 0", reset.status === 0, String(reset.stderr));
    const reLogin = await api("/api/auth/login", { method: "POST", body: { username: userB, password: "newpass6" } });
    check("login works with reset password", reLogin.status === 200);
    const oldLogin = await api("/api/auth/login", { method: "POST", body: { username: userB, password: "secret66" } });
    check("old password no longer accepted", oldLogin.status === 401);

    // ── issue #310：維護者線上管理（intTest#75/#76 之 API 面）──
    const adminPage = await fetch(`${BASE}/admin/`);
    const adminHtml = await adminPage.text();
    check("admin console served at /admin/", adminPage.status === 200 && adminHtml.includes("Luminara 管理"));
    const adminLogin = await api("/api/auth/login", { method: "POST", body: { username: adminUser, password: ADMIN_PASSWORD } });
    check("admin bootstrap account can log in (role=admin)", adminLogin.status === 200 && adminLogin.body?.account?.role === "admin");
    const adminToken = adminLogin.body.token;
    // 以預設值歸零 settings（防前次中斷殘留），並驗 GET/PUT 往返。
    const settingsReset = await api("/api/admin/settings", { method: "PUT", token: adminToken, body: DEFAULT_SETTINGS });
    check("admin settings PUT roundtrip", settingsReset.status === 200 && settingsReset.body.registrationOpen === true);

    // 權限負向（solCase#25.2）：無 token 401、玩家 session 403。
    const playerToken = reLogin.body.token;
    check("admin endpoint without token → 401", (await api("/api/admin/accounts")).status === 401);
    const asPlayer = await api("/api/admin/accounts", { token: playerToken });
    check("admin endpoint with player session → 403 admin-only", asPlayer.status === 403 && asPlayer.body?.error?.code === "admin-only");

    // 帳號清單（sysCase#4.2）
    const list = await api("/api/admin/accounts", { token: adminToken });
    const rowB = list.body?.accounts?.find((row) => row.username === userB);
    check("admin account list includes fields", list.status === 200 && rowB && rowB.role === "player" && Number.isFinite(rowB.lastLoginAt) && typeof rowB.playStatus === "string");
    check("admin list has no passwordHash", !JSON.stringify(list.body).includes("passwordHash"));

    // 線上重設密碼（spec#25）：舊密碼失效、新密碼可登入、既有 session 撤銷。
    const resetB = await api(`/api/admin/accounts/${rowB.id}/reset-password`, { method: "POST", token: adminToken, body: { newPassword: "online66" } });
    check("admin reset-password → 204", resetB.status === 204);
    check("old session revoked after reset", (await api("/api/save", { token: playerToken })).status === 401);
    check("new password works after reset", (await api("/api/auth/login", { method: "POST", body: { username: userB, password: "online66" } })).status === 200);
    // admin 自身變更密碼：保留當前 session。
    const selfRow = list.body.accounts.find((row) => row.username === adminUser);
    const selfReset = await api(`/api/admin/accounts/${selfRow.id}/reset-password`, { method: "POST", token: adminToken, body: { newPassword: "rotated9" } });
    check("admin self reset keeps current session", selfReset.status === 204 && (await api("/api/admin/accounts", { token: adminToken })).status === 200);

    // 時長政策（spec#26）：鎖定→save 回應搭載；非法值 422；解除回復。
    const lock = await api(`/api/admin/accounts/${rowB.id}/play-limit`, { method: "PUT", token: adminToken, body: { locked: true, playMinutes: 10, restMinutes: 20, playMaxMinutes: 12 } });
    check("play-limit lock → 200", lock.status === 200 && lock.body.playLimitPolicy.locked === true);
    const tokenB2 = (await api("/api/auth/login", { method: "POST", body: { username: userB, password: "online66" } })).body.token;
    const savePolicy = await api("/api/save", { token: tokenB2 });
    check("GET /api/save carries playLimitPolicy", savePolicy.body?.playLimitPolicy?.locked === true && savePolicy.body.playLimitPolicy.playMinutes === 10);
    const badLimit = await api(`/api/admin/accounts/${rowB.id}/play-limit`, { method: "PUT", token: adminToken, body: { locked: true, playMinutes: 30, restMinutes: 15, playMaxMinutes: 20 } });
    check("play>max rejected (422)", badLimit.status === 422);
    const unlock = await api(`/api/admin/accounts/${rowB.id}/play-limit`, { method: "PUT", token: adminToken, body: { locked: false } });
    check("play-limit unlock → 200", unlock.status === 200 && unlock.body.playLimitPolicy.locked === false);

    // 註冊開關（spec#26 (c)）：關閉→register 403＋/api/config 反映；既有帳號登入不受影響；復原。
    await api("/api/admin/settings", { method: "PUT", token: adminToken, body: { ...DEFAULT_SETTINGS, registrationOpen: false } });
    const closedReg = await api("/api/auth/register", { method: "POST", body: { username: `itc${suffix}`, password: "secret66" } });
    check("registration closed → 403 registration-closed", closedReg.status === 403 && closedReg.body?.error?.code === "registration-closed");
    const config = await api("/api/config");
    check("GET /api/config mirrors registrationOpen=false", config.status === 200 && config.body.registrationOpen === false && config.body.defaultPlayLimit.playMinutes === 15);
    check("existing login unaffected while closed", (await api("/api/auth/login", { method: "POST", body: { username: userB, password: "online66" } })).status === 200);
    await api("/api/admin/settings", { method: "PUT", token: adminToken, body: DEFAULT_SETTINGS });
    check("registration reopened", (await api("/api/config")).body.registrationOpen === true);

    // 刪除帳號（spec#25）：自刪 409；刪除後帳號/存檔/登入一併失效。
    const selfDelete = await api(`/api/admin/accounts/${selfRow.id}`, { method: "DELETE", token: adminToken });
    check("admin self-delete rejected (409)", selfDelete.status === 409 && selfDelete.body?.error?.code === "cannot-delete-self");
    const disposable = `itd${suffix}`;
    const regD = await api("/api/auth/register", { method: "POST", body: { username: disposable, password: "secret66" } });
    await api("/api/save", { method: "PUT", token: regD.body.token, body: { state: { coins: 9 }, baseUpdatedAt: null } });
    const rowD = (await api("/api/admin/accounts", { token: adminToken })).body.accounts.find((row) => row.username === disposable);
    const del = await api(`/api/admin/accounts/${rowD.id}`, { method: "DELETE", token: adminToken });
    check("delete account → 204", del.status === 204);
    check("deleted account cannot log in", (await api("/api/auth/login", { method: "POST", body: { username: disposable, password: "secret66" } })).status === 401);
    check("deleted account session revoked", (await api("/api/save", { token: regD.body.token })).status === 401);

    // B9 存檔形狀校驗（#309 審查）：非法頂層型別 422、不落庫。
    const badState = await api("/api/save", { method: "PUT", token: tokenB2, body: { state: { coins: "lots" }, baseUpdatedAt: null } });
    check("malformed state rejected (422 invalid-state)", badState.status === 422 && badState.body?.error?.code === "invalid-state");
  } finally {
    server.kill();
  }

  console.log(failures === 0 ? "INTEGRATION PASS" : `INTEGRATION FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("integration crashed:", error);
  process.exit(1);
});
