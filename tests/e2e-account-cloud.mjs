// issue #309 端對端驗證（e2eTest#03/#04/#24 之機器面）＋ README 證據截圖（GATE ＜2.5節＞）。
// 前置：deploy/compose.yaml 之 db 已啟動；sysApi 已 build；本腳本自行 spawn sysApi 於 :4182。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const pkg = await import("file:///C:/Users/User/Documents/Github/solKidGalGame1/.codex/tools/pw/node_modules/playwright-core/index.js");
const { chromium } = pkg.default || pkg;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // 本檔位於 tests/，repo 根在上一層
const PORT = 4182;
const BASE = `http://127.0.0.2:${PORT}`; // 127.0.0.2：非 dev-host 白名單，證據截圖不混入 dev-only 管理工具鈕（#309 審查 B2）
const SHOTS = path.join(repoRoot, "docs", "manual-assets");
fs.mkdirSync(SHOTS, { recursive: true });
const suffix = Date.now().toString(36);
const username = `mimi${suffix}`.slice(0, 16);
const password = "secret66";

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

const server = spawn(process.execPath, [path.join(repoRoot, "sysApi", "dist", "server.js")], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DATABASE_URL: process.env.DATABASE_URL || "postgres://luminara:luminara@127.0.0.1:5433/luminara_test",
    SESSION_SECRET: "e2e-pepper",
    STATIC_ROOT: repoRoot
  },
  stdio: ["ignore", "pipe", "pipe"]
});
server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  check("sysApi healthy", await waitHealthy());

  // ── 裝置 A：首次進入 → 空狀態註冊 → 選角 → 遊玩 → 雲端保存 ──
  const deviceA = await browser.newContext({ viewport: { width: 412, height: 880 } });
  const pageA = await deviceA.newPage();
  const consoleErrors = [];
  pageA.on("pageerror", (e) => consoleErrors.push(e.message));
  await pageA.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pageA.waitForSelector("#accountSelect.show", { timeout: 15000 });
  check("first visit shows sign-in gate", await pageA.isVisible("#accountSelect.show"));
  // 空狀態：無帳號卡 → 直接呈現建立新帳號表單（[hmiIntf自訂登入註冊頁] (a)）
  await pageA.waitForSelector("#registerUsername", { timeout: 10000 });
  await pageA.screenshot({ path: path.join(SHOTS, "issue309-01-register-empty-state.png") });
  await pageA.fill("#registerUsername", username);
  await pageA.fill("#registerPassword", password);
  // 顯示密碼切換
  await pageA.click(".login-show-toggle");
  const revealed = await pageA.getAttribute("#registerPassword", "type");
  check("password show toggle reveals input", revealed === "text");
  await pageA.click(".login-show-toggle");
  await pageA.screenshot({ path: path.join(SHOTS, "issue309-02-register-filled.png") });
  await pageA.click(".login-enter"); // Create and play
  await pageA.waitForSelector("#characterSelect.show", { timeout: 15000 });
  check("register auto-signs-in and opens character select", true);
  await pageA.screenshot({ path: path.join(SHOTS, "issue309-03-character-select.png") });

  // ── issue #340：Profile color 變更 → Background pattern chips 即時連動（花紋選擇保留、只換色） ──
  await pageA.click('.background-pattern-swatch[data-pattern]'); // 先選一個非 none 花紋
  const beforeColor = await pageA.evaluate(() => document.querySelector(".background-pattern-swatch").style.getPropertyValue("--profile-color"));
  // 挑「非目前選中」的色票：初始色隨機（randomizeTheme），固定第 n 格有 1/8 撞色＝假紅（Q3 審查抓出）。
  await pageA.click('.profile-color-swatch:not([aria-checked="true"])');
  const sync = await pageA.evaluate(() => {
    const chosen = document.querySelector('.profile-color-swatch[aria-checked="true"]').style.getPropertyValue("--profile-color");
    const chips = [...document.querySelectorAll(".background-pattern-swatch")].map((el) => el.style.getPropertyValue("--profile-color"));
    const kept = document.querySelector('.background-pattern-swatch[aria-checked="true"]');
    return { chosen, allSynced: chips.every((c) => c === chosen), patternKept: Boolean(kept?.dataset.pattern) };
  });
  check("pattern chips re-tint live on profile color change (#340)", sync.allSynced && sync.chosen !== beforeColor, JSON.stringify({ beforeColor, ...sync }));
  check("selected pattern survives color change (#340)", sync.patternKept);
  await pageA.screenshot({ path: path.join(SHOTS, "issue340-01-color-pattern-sync.png") }); // GATE ＜2.5節＞ 證據

  await pageA.fill("#playerNameInput", "Mimi");
  await pageA.click("#characterConfirm");
  await pageA.waitForTimeout(500);
  // 遊玩：以測試 hook 改變狀態並保存（等值於答題得幣後 persist）
  await pageA.evaluate(() => window.LuminaraTest.setCoins(777));
  await pageA.waitForTimeout(2600); // 節流窗口
  await pageA.evaluate(() => window.LuminaraTest.cloudAuth.flushSave());
  await pageA.waitForTimeout(400);
  const statusA = await pageA.evaluate(() => window.LuminaraTest.cloudAuth.cloud.status);
  check("cloud save flushed (status idle)", statusA === "idle", statusA);
  // 設定顯示目前帳號
  await pageA.evaluate(() => window.LuminaraTest.openSettings());
  await pageA.waitForTimeout(300);
  const accountLine = await pageA.textContent("#settingsAccountLine").catch(() => "");
  check("settings shows signed-in username", (accountLine || "").includes(username), accountLine || "(missing)");
  await pageA.screenshot({ path: path.join(SHOTS, "issue309-04-settings-account.png") });

  // ── 裝置 B（全新 context）：其他帳號登入 → 跨裝置還原 ──
  const deviceB = await browser.newContext({ viewport: { width: 412, height: 880 } });
  const pageB = await deviceB.newPage();
  await pageB.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pageB.waitForSelector("#registerUsername", { timeout: 15000 }); // 空狀態（此裝置無帳號卡）
  await pageB.click(".login-actions .soft-button"); // Other account（空狀態亦提供）
  await pageB.waitForSelector("#loginOtherUsername", { timeout: 10000 });
  await pageB.fill("#loginOtherUsername", username);
  await pageB.fill("#loginOtherPassword", "wrong66");
  await pageB.click(".login-enter");
  // #331 後錯誤行常駐佔位（固定高度、不再以 hidden 切換）：等「非空」而非「非 hidden」。
  await pageB.waitForSelector(".login-error:not(:empty)", { timeout: 10000 });
  const errText = await pageB.textContent(".login-error");
  check("wrong password shows unified inline error", /incorrect/i.test(errText || ""), errText || "");
  check("inline error carries non-color cue (⚠ prefix, #331)", /^⚠/.test((errText || "").trim()), errText || "");
  await pageB.screenshot({ path: path.join(SHOTS, "issue309-05-login-error.png") });
  await pageB.fill("#loginOtherPassword", password);
  await pageB.click(".login-enter");
  await pageB.waitForFunction(() => !document.querySelector("#accountSelect.show"), { timeout: 15000 });
  const coinsB = await pageB.evaluate(() => window.LuminaraTest.getCoins());
  check("cross-device login restores cloud state (coins 777)", coinsB === 777, String(coinsB));
  await pageB.screenshot({ path: path.join(SHOTS, "issue309-06-cross-device-restored.png") });

  // ── 裝置 B 再次進入：帳號卡＋免密續玩（session 快取） ──
  await pageB.reload({ waitUntil: "networkidle" });
  await pageB.waitForSelector("#accountSelect.show", { timeout: 15000 });
  await pageB.waitForSelector(`#accountList .account-pick[data-username="${username}"]`, { timeout: 10000 });
  await pageB.screenshot({ path: path.join(SHOTS, "issue309-07-login-cards.png") });
  await pageB.click(`#accountList .account-pick[data-username="${username}"]`);
  await pageB.waitForSelector(".login-continue", { timeout: 10000 });
  await pageB.screenshot({ path: path.join(SHOTS, "issue309-08-continue-session.png") });
  await pageB.click(".login-continue");
  await pageB.waitForFunction(() => !document.querySelector("#accountSelect.show"), { timeout: 15000 });
  const coinsB2 = await pageB.evaluate(() => window.LuminaraTest.getCoins());
  check("session cache continue (no password) restores state", coinsB2 === 777, String(coinsB2));

  check("no page errors on either device", consoleErrors.length === 0, consoleErrors[0] || "");
} finally {
  await browser.close();
  server.kill();
}
console.log(failures === 0 ? "E2E PASS" : `E2E FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
