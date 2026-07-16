// issue #331 客戶模擬拓撲 e2e（intTest#13）：
//   A. API 層——TRUST_PROXY=2 兩跳 XFF 鏈解真實 client IP、限流 key 含帳號名（甲失敗不鎖乙）、429 附等待秒數。
//   B. 瀏覽器層（手機視口 375×812）——送出被拒時錯誤訊息於視野內可見（⚠ 前綴、欄位級 error）、送出中鈕面忙碌狀態。
// 前置：deploy/compose.yaml 之 db 已啟動；sysApi 已 build；本腳本自行 spawn sysApi（TRUST_PROXY=2）。
// 埠可參數化（E2E_PORT，預設 4187）；起服務後先驗服務身分（healthz）再開跑（GATE ＜2節＞ 埠隔離）。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const pkg = await import("file:///C:/Users/User/Documents/Github/solKidGalGame1/.codex/tools/pw/node_modules/playwright-core/index.js");
const { chromium } = pkg.default || pkg;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(repoRoot, "docs", "manual-assets");
fs.mkdirSync(SHOTS, { recursive: true });
const PORT = Number(process.env.E2E_PORT) || 4187;
const BASE = `http://127.0.0.2:${PORT}`; // 127.0.0.2：非 dev-host 白名單、不混入 dev-only 工具鈕
const suffix = Date.now().toString(36);

let failures = 0;
function check(name, condition, detail = "") {
  console.log(`  ${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
}

async function waitHealthy() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return true;
    } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

// 限流窗口縮短（10 秒）：測試不等 10 分鐘、可重複執行。
const server = spawn(process.execPath, [path.join(repoRoot, "sysApi", "dist", "server.js")], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DATABASE_URL: process.env.DATABASE_URL || "postgres://luminara:luminara@127.0.0.1:5433/luminara_test",
    SESSION_SECRET: "e2e-pepper-topology",
    STATIC_ROOT: repoRoot,
    TRUST_PROXY: "2",
    RATE_LIMIT_MAX: "3",
    RATE_LIMIT_WINDOW_MS: "10000"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

// 兩跳 XFF：client → cloudflared(tunnel) → ingress → app；TRUST_PROXY=2 應解出最左之真實 client。
function viaProxy(clientIp, body) {
  return fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `${clientIp}, 10.0.0.1` },
    body: JSON.stringify(body)
  });
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  check("sysApi healthy (service identity)", await waitHealthy());

  // ── A. API 層：限流 key 含帳號名＋兩跳 XFF 真實 IP 隔離＋429 等待秒數 ──
  const taken = `taken${suffix}`.slice(0, 16);
  const first = await viaProxy("203.0.113.7", { username: taken, password: "secret6" });
  check("register succeeds via two-hop proxy (201)", first.status === 201, String(first.status));
  for (let i = 0; i < 3; i += 1) {
    await viaProxy("203.0.113.7", { username: taken, password: "secret6" }); // 同 client 同名重複撞名（409 記失敗）
  }
  const sameClientSameName = await viaProxy("203.0.113.7", { username: taken, password: "secret6" });
  check("same client + same username hits 429", sameClientSameName.status === 429, String(sameClientSameName.status));
  const limitedBody = await sameClientSameName.json();
  check("429 body carries retryAfterSeconds > 0", Number(limitedBody?.error?.retryAfterSeconds) > 0, JSON.stringify(limitedBody));
  check("429 sets Retry-After header", Number(sameClientSameName.headers.get("retry-after")) > 0);
  const otherClientSameName = await viaProxy("198.51.100.9", { username: taken, password: "secret6" });
  check("different real client (XFF) not locked by neighbour (409, not 429)", otherClientSameName.status === 409, String(otherClientSameName.status));
  const sameClientOtherName = await viaProxy("203.0.113.7", { username: `kid${suffix}`.slice(0, 16), password: "secret6" });
  check("same client + different username not locked (201)", sameClientOtherName.status === 201, String(sameClientOtherName.status));

  // ── B. 瀏覽器層（手機視口）：錯誤於視野內可見＋欄位級 error＋忙碌狀態 ──
  const phone = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await phone.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#registerUsername", { timeout: 15000 }); // 空狀態直落註冊表單
  await page.fill("#registerUsername", "123kid"); // 數字開頭：被帳號規則擋（#330 另案調規則；此處驗回饋）
  await page.fill("#registerPassword", "secret6");
  await page.click(".login-enter"); // Create and play
  await page.waitForSelector(".login-error:not(:empty)", { timeout: 5000 });
  const errText = (await page.textContent(".login-error")) || "";
  check("rejected submit shows inline error", errText.length > 0, errText);
  check("error carries non-color cue (⚠ prefix)", /^⚠/.test(errText.trim()), errText);
  const inViewport = await page.evaluate(() => {
    const el = document.querySelector(".login-error");
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 0;
  });
  check("error message is inside the mobile viewport (375x812)", inViewport);
  await page.screenshot({ path: path.join(SHOTS, "issue331-01-register-error-mobile.png") }); // GATE ＜2.5節＞ 證據
  const buttonBelowError = await page.evaluate(() => {
    const err = document.querySelector(".login-error").getBoundingClientRect();
    const btn = document.querySelector(".login-enter").getBoundingClientRect();
    return err.top < btn.top; // 錯誤行在送出鈕上方（軟鍵盤展開時仍可見）
  });
  check("error line sits above the submit button", buttonBelowError);
  check("offending field marked aria-invalid", (await page.getAttribute("#registerUsername", "aria-invalid")) === "true");
  await page.fill("#registerUsername", `mimi${suffix}`.slice(0, 16));
  check("aria-invalid cleared on input", (await page.getAttribute("#registerUsername", "aria-invalid")) === null);

  // 忙碌狀態：攔截註冊請求延遲 600ms，送出瞬間鈕面應 disabled＋進行中字樣。
  await page.route("**/api/auth/register", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await page.click(".login-enter");
  await page.waitForTimeout(150);
  const busyState = await page.evaluate(() => {
    const btn = document.querySelector(".login-enter");
    return { disabled: btn.disabled, text: btn.textContent };
  });
  check("submit button shows busy state while pending", busyState.disabled === true && /creating/i.test(busyState.text), JSON.stringify(busyState));
  await page.waitForSelector("#characterSelect.show", { timeout: 15000 });
  check("valid register still enters character select", true);

  check("no page errors", pageErrors.length === 0, pageErrors[0] || "");
} finally {
  await browser.close();
  server.kill();
}
console.log(failures === 0 ? "E2E PASS" : `E2E FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
