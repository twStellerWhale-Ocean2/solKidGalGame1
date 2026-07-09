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
const DATABASE_URL = process.env.DATABASE_URL || "postgres://luminara:luminara@127.0.0.1:5433/luminara";
const SESSION_SECRET = "integration-test-pepper";
const suffix = Date.now().toString(36); // 唯一後綴使套件可重複執行
const userA = `ita${suffix}`;
const userB = `itb${suffix}`;

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
      RATE_LIMIT_WINDOW_MS: "60000"
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
    const noSession = await api("/api/save");
    check("protected endpoint without session → 401", noSession.status === 401);

    // 註冊規則（intTest#14 後端層）
    check("register rejects invalid username (422)", (await api("/api/auth/register", { method: "POST", body: { username: "BAD", password: "secret6" } })).status === 422);
    check("register rejects short password (422)", (await api("/api/auth/register", { method: "POST", body: { username: userA, password: "123" } })).status === 422);
    const regA = await api("/api/auth/register", { method: "POST", body: { username: userA, password: "secret6" } });
    check("register succeeds (201 + token)", regA.status === 201 && /^[0-9a-f]{64}$/.test(regA.body?.token || ""));
    check("duplicate username rejected (409)", (await api("/api/auth/register", { method: "POST", body: { username: userA, password: "secret6" } })).status === 409);

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
    const regB = await api("/api/auth/register", { method: "POST", body: { username: userB, password: "secret6" } });
    const emptyB = await api("/api/save", { token: regB.body.token });
    check("accounts isolated (B sees no save)", emptyB.body.state === null);

    // SQL 注入字串（intTest#72）
    const inject = await api("/api/auth/login", { method: "POST", body: { username: "' OR 1=1--", password: "secret6" } });
    check("SQL-injection-looking username handled safely (401, no 500)", inject.status === 401);

    // 登出撤銷（intTest#15/#70）
    const logout = await api("/api/auth/logout", { method: "POST", token: tokenA });
    check("logout → 204", logout.status === 204);
    check("revoked token rejected (401)", (await api("/api/save", { token: tokenA })).status === 401);
    check("forged token rejected (401)", (await api("/api/save", { token: "f".repeat(64) })).status === 401);

    // 速率限制（intTest#72 步驟5；RATE_LIMIT_MAX=5）
    const limitedUser = `itl${suffix}`;
    await api("/api/auth/register", { method: "POST", body: { username: limitedUser, password: "secret6" } });
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
    const oldLogin = await api("/api/auth/login", { method: "POST", body: { username: userB, password: "secret6" } });
    check("old password no longer accepted", oldLogin.status === 401);
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
