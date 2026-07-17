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

const server = spawn(process.execPath, [path.join(repoRoot, "sysLingoWorld", "modApi", "dist", "server.js")], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DATABASE_URL: process.env.DATABASE_URL || "postgres://luminara:luminara@127.0.0.1:5433/luminara_test",
    SESSION_SECRET: "e2e-pepper",
    STATIC_ROOT: path.join(repoRoot, "sysLingoWorld", "modShell"),
    ADMIN_ROOT: path.join(repoRoot, "sysLingoWorld", "modAdmin")
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
  // 空狀態（#357）：無帳號卡 → 預設**登入表單**（帳號存伺服器、新裝置的既有玩家先能登入）；註冊為次要連結。
  await pageA.waitForSelector("#loginOtherUsername", { timeout: 10000 });
  check("#357 新裝置空狀態預設為登入表單（非註冊）", !(await pageA.$("#registerUsername")));
  check("#357 空狀態無 Back 鈕（root auth 無上一步）", await pageA.evaluate(() => ![...document.querySelectorAll("#accountList button")].some((b) => b.textContent.trim() === "Back")));
  check("#357 空狀態不出現「Create new account」大鈕（首繪即不得閃現）", await pageA.evaluate(() => document.getElementById("accountNewButton")?.hidden === true));
  check("#358 登入卡顯示產品名＋版本（值＝buildInfo，無第二份）", await pageA.evaluate(async () => {
    const v = (await import("/game-engine/build/version.js")).buildInfo.version;
    const foot = document.querySelector(".login-version")?.textContent || "";
    // 玩家端只露品牌（design ＜命名層對照＞）：codename solLingoWorld 不得出現於遊戲畫面
    return /Luminara/.test(document.querySelector("#accountSelectTitle")?.textContent || "")
      && foot.includes(v) && /Luminara/.test(foot) && !/solLingoWorld/i.test(foot);
  }));
  await pageA.screenshot({ path: path.join(SHOTS, "issue357-01-signin-default.png") }); // GATE ＜2.5節＞ 證據：登入預設態（**須在點連結前拍**）
  await pageA.click(".login-link"); // #357 次要出口：First time here? Create an account
  await pageA.waitForSelector("#registerUsername", { timeout: 10000 });
  await pageA.screenshot({ path: path.join(SHOTS, "issue357-02-register-secondary.png") }); // GATE ＜2.5節＞ 證據（次要出口後之註冊表單）
  check("#359 註冊表單不再前置攤開帳密規則長句", await pageA.evaluate(() => !/3-16 lowercase/.test(document.querySelector(".login-form")?.textContent || "")));
  check("#357 註冊表單有回登入之次要出口", await pageA.evaluate(() => /Already have an account/i.test(document.querySelector(".login-link")?.textContent || "")));
  check("#357 註冊模式亦不出現大鈕", await pageA.evaluate(() => document.getElementById("accountNewButton")?.hidden === true));

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

  // ── issue #352：first-run 初始設定期間背景立繪留空（側欄頭胸照＋地圖棋子 hidden；卡內預覽照常） ──
  const emptyStage = await pageA.evaluate(() => ({
    flag: document.body.classList.contains("first-run-select"),
    side: getComputedStyle(document.querySelector("#sideProfileAvatar")).visibility,
    cardPreviews: document.querySelectorAll("#characterSelect .character-portrait .paper-doll-stage").length
  }));
  check("first-run empty stage: sidebar bust hidden (#352)", emptyStage.flag && emptyStage.side === "hidden", JSON.stringify(emptyStage));
  check("select-card previews unaffected (#352)", emptyStage.cardPreviews === 3, String(emptyStage.cardPreviews));

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
  // #352：Start 確認後所選公主即登場（旗標移除、側欄頭胸照恢復可見）。
  const stageAfter = await pageA.evaluate(() => ({
    flag: document.body.classList.contains("first-run-select"),
    side: getComputedStyle(document.querySelector("#sideProfileAvatar")).visibility
  }));
  check("princess appears after Start (#352)", stageAfter.flag === false && stageAfter.side === "visible", JSON.stringify(stageAfter));
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
  await pageB.waitForSelector("#loginOtherUsername", { timeout: 15000 }); // #357：空狀態預設即登入表單（毋須再點 Other account）


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
  check("#357 有帳號卡＝cards 模式，大鈕（新增玩家）可見", await pageB.evaluate(() => document.getElementById("accountNewButton")?.hidden === false));
  await pageB.click(".login-actions .soft-button"); // Other account
  await pageB.waitForSelector("#loginOtherUsername", { timeout: 8000 });
  check("#357 有上一步時 Back 出現（自子表單回卡片列表）", await pageB.evaluate(() => [...document.querySelectorAll("#accountList button")].some((b) => b.textContent.trim() === "Back")));
  check("#357 子表單模式下大鈕收起（不與登入同權）", await pageB.evaluate(() => document.getElementById("accountNewButton")?.hidden === true));
  await pageB.click("#accountList button:has-text('Back')");
  await pageB.waitForSelector(`#accountList .account-pick[data-username="${username}"]`, { timeout: 8000 });
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
