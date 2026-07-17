// issue #310 端對端驗證（e2eTest#25/#26 之機器面）＋ README 證據截圖（GATE ＜2.5節＞）。
// 前置：deploy/compose.yaml 之 db 已啟動；sysApi 已 build；本腳本自行 spawn sysApi 於 :4183。
// BASE 用 127.0.0.2（非 dev-host 白名單）：證據截圖不混入 dev-only 管理工具鈕（#309 審查 B2 慣例）。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const pkg = await import("file:///C:/Users/User/Documents/Github/solKidGalGame1/.codex/tools/pw/node_modules/playwright-core/index.js");
const { chromium } = pkg.default || pkg;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4183;
const BASE = `http://127.0.0.2:${PORT}`;
const SHOTS = path.join(repoRoot, "docs", "manual-assets");
fs.mkdirSync(SHOTS, { recursive: true });
const suffix = Date.now().toString(36);
const adminUser = `mom${suffix}`.slice(0, 16);
const adminPassword = "adminpw9";
const kidUser = `kid${suffix}`.slice(0, 16);
const kidPassword = "secret66";
const disposableUser = `old${suffix}`.slice(0, 16);

let failures = 0;
function check(name, condition, detail = "") {
  console.log(`  ${condition ? "PASS" : "FAIL"} ${name}${condition || !detail ? "" : ` — ${detail}`}`);
  if (!condition) failures += 1;
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
  try { json = await res.json(); } catch { /* 204 */ }
  return { status: res.status, body: json };
}

// 截圖前隱藏殘留 snackbar（證據衛生：不讓上一動作的回饋疊在不同主題的證據上）。
async function hideSnackbar(page) {
  await page.evaluate(() => { const bar = document.getElementById("snackbar"); if (bar) bar.hidden = true; });
}

// headless 無渲染幀時 CSS transition 凍在起始值（動畫時鐘隨幀推進）：
// 截圖前催兩幀＋等過 transition 時長，確保證據呈現最終視覺狀態。
async function settleFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(250);
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
    SESSION_SECRET: "e2e-admin-pepper",
    STATIC_ROOT: path.join(repoRoot, "sysLingoWorld", "modShell"),
    ADMIN_ROOT: path.join(repoRoot, "sysLingoWorld", "modAdmin"),
    ADMIN_USERNAME: adminUser,
    ADMIN_PASSWORD: adminPassword
  },
  stdio: ["ignore", "pipe", "pipe"]
});
server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

const browser = await chromium.launch({ headless: true, channel: "chrome" });
let adminToken = "";
try {
  check("sysApi healthy", await waitHealthy());

  // 前置資料：孩子帳號（有存檔）與待刪帳號（fetch 建立；管理操作本身走 UI）。
  const kidReg = await api("/api/auth/register", { method: "POST", body: { username: kidUser, password: kidPassword } });
  check("kid account registered", kidReg.status === 201);
  await api("/api/save", { method: "PUT", token: kidReg.body.token, body: { state: { coins: 88, playerName: "Kiki", activeCharacterId: "lumi" }, baseUpdatedAt: null } });
  const dispReg = await api("/api/auth/register", { method: "POST", body: { username: disposableUser, password: kidPassword } });
  check("disposable account registered", dispReg.status === 201);

  // ── 管理端（桌機）：登入 → 帳號管理 ──
  const adminCtx = await browser.newContext({ viewport: { width: 1180, height: 800 } });
  const admin = await adminCtx.newPage();
  const adminErrors = [];
  admin.on("pageerror", (e) => adminErrors.push(e.message));
  await admin.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
  check("admin login page shown", await admin.isVisible("#viewLogin"));
  check("logout button hidden while signed out", !(await admin.isVisible("#topbarAccount")));
  await admin.screenshot({ path: path.join(SHOTS, "issue310-01-admin-login.png") });

  // 玩家帳號登入管理頁 → 明示無管理權限（solCase#25.2 UI 面）
  await admin.fill("#loginUsername", kidUser);
  await admin.fill("#loginPassword", kidPassword);
  await admin.click("#loginSubmit");
  await admin.waitForSelector("#loginError:not([hidden])", { timeout: 8000 });
  const playerDenied = await admin.textContent("#loginError");
  check("player account denied with explicit message", (playerDenied || "").includes("無管理權限"), playerDenied || "");

  await admin.fill("#loginUsername", adminUser);
  await admin.fill("#loginPassword", adminPassword);
  await admin.click("#loginSubmit");
  await admin.waitForSelector("#viewApp:not([hidden])", { timeout: 8000 });
  await admin.waitForSelector(`.account-row[data-username="${kidUser}"]`, { timeout: 8000 });
  check("admin sees account list with kid row", true);
  const kidRowText = await admin.textContent(`.account-row[data-username="${kidUser}"]`);
  check("kid row shows player role and policy chip", (kidRowText || "").includes("player") && (kidRowText || "").includes("玩家自調"));
  await admin.screenshot({ path: path.join(SHOTS, "issue310-02-admin-accounts.png") });

  // 線上重設密碼（spec#25）：走 UI dialog。
  await admin.click(`.account-row[data-username="${kidUser}"] .account-actions .btn`);
  await admin.waitForSelector("#dialog[open] input", { timeout: 5000 });
  await admin.fill("#dialog input", "fresh6678");
  await hideSnackbar(admin);
  await admin.screenshot({ path: path.join(SHOTS, "issue310-03-admin-reset-password.png") });
  await admin.click("#dialog .btn-filled");
  await admin.waitForSelector("#snackbar:not([hidden])", { timeout: 5000 });
  check("reset password: old rejected", (await api("/api/auth/login", { method: "POST", body: { username: kidUser, password: kidPassword } })).status === 401);
  check("reset password: new accepted", (await api("/api/auth/login", { method: "POST", body: { username: kidUser, password: "fresh6678" } })).status === 200);

  // 時長覆寫與鎖定（spec#26 (b)）：⋮ → dialog → 鎖定 10/20/12。
  await admin.click(`.account-row[data-username="${kidUser}"] .menu-button`);
  await admin.waitForSelector(".row-menu", { timeout: 5000 });
  await admin.click(".row-menu button:has-text('時長覆寫與鎖定')");
  await admin.waitForSelector("#dialog[open] .switch input", { timeout: 5000 });
  await admin.check("#dialog .switch input");
  const minuteInputs = admin.locator("#dialog input[type=number]");
  await minuteInputs.nth(0).fill("10");
  await minuteInputs.nth(1).fill("20");
  await minuteInputs.nth(2).fill("12");
  // 開關視覺須反映鎖定狀態（#310 審查：dialog 內 :checked 樣式失效改以 class 驅動）。
  const switchOn = await admin.evaluate(() => document.querySelector("#dialog .switch")?.classList.contains("is-on"));
  check("play-limit dialog switch shows ON state", switchOn === true);
  await hideSnackbar(admin);
  await settleFrames(admin);
  const switchBg = await admin.evaluate(() => getComputedStyle(document.querySelector("#dialog .switch-track")).backgroundColor);
  check("switch track visually reflects ON (primary color)", switchBg === "rgb(107, 95, 181)", switchBg);
  await admin.screenshot({ path: path.join(SHOTS, "issue310-04-admin-play-limit.png") });
  await admin.click("#dialog .btn-filled");
  await admin.waitForSelector(`.account-row[data-username="${kidUser}"] .policy-chip.is-locked`, { timeout: 8000 });
  const chipText = await admin.textContent(`.account-row[data-username="${kidUser}"] .policy-chip`);
  check("policy chip shows locked minutes", (chipText || "").includes("玩10") && (chipText || "").includes("休20"), chipText || "");
  await hideSnackbar(admin);
  await admin.screenshot({ path: path.join(SHOTS, "issue310-10-admin-locked-chip.png") });

  // ── 孩子端（手機直向）：登入 → 設定時長唯讀＋提示（sysCase#16.1） ──
  const kidCtx = await browser.newContext({ viewport: { width: 412, height: 880 } });
  const kid = await kidCtx.newPage();
  await kid.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await kid.waitForSelector("#accountSelect.show", { timeout: 15000 });
  await kid.click("text=Other account");
  await kid.waitForSelector("#loginOtherUsername", { timeout: 8000 });
  await kid.fill("#loginOtherUsername", kidUser);
  await kid.fill("#loginOtherPassword", "fresh6678");
  await kid.click(".login-enter");
  await kid.waitForSelector("#accountSelect.show", { state: "detached", timeout: 15000 }).catch(() => {});
  await kid.waitForTimeout(800);
  await kid.evaluate(() => window.LuminaraTest.openSettings());
  await kid.waitForTimeout(400);
  const playDisabled = await kid.getAttribute("#playMinutesInput", "disabled");
  const noteHidden = await kid.evaluate(() => document.getElementById("playLimitManagedNote")?.hidden);
  const playValue = await kid.inputValue("#playMinutesInput");
  check("kid play-minutes input readonly under lock", playDisabled !== null);
  check("managed-by-guardian note visible", noteHidden === false);
  check("kid settings show enforced minutes (10)", playValue === "10", playValue);
  // 讓「唯讀時長欄位＋提示」主體入鏡（證據主張要看得到）。
  await kid.evaluate(() => document.getElementById("playLimitManagedNote")?.scrollIntoView({ block: "center" }));
  await kid.waitForTimeout(200);
  await kid.screenshot({ path: path.join(SHOTS, "issue310-05-kid-locked-settings.png") });

  // ── 管理端：設定分頁 → 關閉註冊（spec#26 (c)、儲存即生效） ──
  await admin.click("#tabSettings");
  await admin.waitForSelector("#panelSettings:not([hidden])", { timeout: 5000 });
  await admin.waitForTimeout(400);
  await admin.evaluate(() => { document.getElementById("snackbar").hidden = true; }); // 清掉前一操作殘留，避免等到舊 snackbar
  await admin.uncheck("#settingRegistrationOpen");
  await admin.click("#settingsSave");
  await admin.waitForSelector("#snackbar:has-text('已儲存')", { timeout: 5000 });
  await admin.screenshot({ path: path.join(SHOTS, "issue310-06-admin-settings.png") });
  const configClosed = await api("/api/config");
  check("registration closed takes effect immediately", configClosed.body.registrationOpen === false);

  // ── #317：dirty guard MD3 dialog（切分頁與登出皆攔、原生 confirm 歸零）＋ tabs 鍵盤導覽 ──
  const nativeDialogs = [];
  admin.on("dialog", (d) => { nativeDialogs.push(d.type()); d.dismiss().catch(() => {}); });
  await admin.fill("#settingPlayMinutes", "14"); // 弄髒表單（不儲存）
  await admin.click("#tabAccounts");
  await admin.waitForSelector("#dialog[open]", { timeout: 5000 });
  check("dirty guard shows MD3 dialog on tab switch", true);
  await hideSnackbar(admin);
  await settleFrames(admin);
  await admin.screenshot({ path: path.join(SHOTS, "issue317-01-dirty-dialog.png") });
  await admin.click("#dialog button:has-text('留在此頁')");
  await admin.waitForTimeout(250);
  check("stay keeps settings panel", await admin.evaluate(() => !document.getElementById("panelSettings").hidden));
  await admin.click("#logoutButton");
  await admin.waitForSelector("#dialog[open]", { timeout: 5000 });
  check("dirty guard intercepts logout too (#310 gap fixed)", true);
  await admin.click("#dialog button:has-text('留在此頁')");
  await admin.waitForTimeout(250);
  check("still logged in after staying", await admin.evaluate(() => !document.getElementById("viewApp").hidden));
  await admin.click("#tabAccounts");
  await admin.waitForSelector("#dialog[open]", { timeout: 5000 });
  await admin.click("#dialog button:has-text('放棄變更')");
  await admin.waitForSelector("#panelAccounts:not([hidden])", { timeout: 5000 });
  check("discard switches to accounts tab", true);
  check("no native confirm used (MD3 only)", nativeDialogs.length === 0);
  await admin.focus("#tabAccounts");
  await admin.keyboard.press("ArrowRight");
  await admin.waitForSelector("#panelSettings:not([hidden])", { timeout: 5000 });
  check("arrow key switches tab (accounts→settings)", true);
  check("roving tabindex follows selection", await admin.evaluate(() =>
    document.getElementById("tabSettings").tabIndex === 0 && document.getElementById("tabAccounts").tabIndex === -1));
  await admin.keyboard.press("ArrowLeft");
  await admin.waitForSelector("#panelAccounts:not([hidden])", { timeout: 5000 });
  check("arrow key switches back (settings→accounts)", true);

  // 新裝置登入畫面：無「建立新帳號」、顯示友善說明（sysCase#16.2）。
  const freshCtx = await browser.newContext({ viewport: { width: 412, height: 880 } });
  const fresh = await freshCtx.newPage();
  await fresh.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await fresh.waitForSelector("#accountSelect.show", { timeout: 15000 });
  await fresh.waitForSelector(".login-registration-closed", { timeout: 8000 });
  const newButtonHidden = await fresh.evaluate(() => document.getElementById("accountNewButton")?.hidden !== false);
  const registerFormAbsent = await fresh.evaluate(() => !document.getElementById("registerUsername"));
  check("no create-account entry while closed", newButtonHidden);
  check("no register form while closed (empty state)", registerFormAbsent);
  check("registration closed API rejects", (await api("/api/auth/register", { method: "POST", body: { username: `new${suffix}`.slice(0, 16), password: "secret66" } })).status === 403);
  await fresh.screenshot({ path: path.join(SHOTS, "issue310-07-registration-closed.png") });

  // ── 管理端：刪除帳號（二次確認、error 色） ──
  await admin.click("#tabAccounts");
  await admin.waitForSelector(`.account-row[data-username="${disposableUser}"]`, { timeout: 8000 });
  await admin.click(`.account-row[data-username="${disposableUser}"] .menu-button`);
  await admin.waitForSelector(".row-menu", { timeout: 5000 });
  await admin.click(".row-menu button:has-text('刪除帳號')");
  await admin.waitForSelector("#dialog[open] .btn-danger", { timeout: 5000 });
  await hideSnackbar(admin);
  await admin.screenshot({ path: path.join(SHOTS, "issue310-08-admin-delete-confirm.png") });
  await admin.click("#dialog .btn-danger");
  await admin.waitForSelector(`.account-row[data-username="${disposableUser}"]`, { state: "detached", timeout: 8000 });
  check("deleted row removed from list", true);
  check("deleted account cannot log in", (await api("/api/auth/login", { method: "POST", body: { username: disposableUser, password: kidPassword } })).status === 401);

  // 管理頁窄視口（手機直向）卡片列走查證據。
  const adminMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const adminMobile = await adminMobileCtx.newPage();
  await adminMobile.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
  await adminMobile.fill("#loginUsername", adminUser);
  await adminMobile.fill("#loginPassword", adminPassword);
  await adminMobile.click("#loginSubmit");
  await adminMobile.waitForSelector(`.account-row[data-username="${kidUser}"]`, { timeout: 8000 });
  await adminMobile.screenshot({ path: path.join(SHOTS, "issue310-09-admin-mobile-cards.png") });
  check("admin console usable on mobile viewport", true);
  // 重整後身分以登入時儲存為準（#310 審查 must-fix：不得自清單推斷第一個 admin）。
  await adminMobile.reload({ waitUntil: "networkidle" });
  await adminMobile.waitForSelector("#topbarUsername", { timeout: 8000 });
  const topbarName = await adminMobile.textContent("#topbarUsername");
  check("identity preserved across reload", (topbarName || "").includes(adminUser), topbarName || "");
  // #317 審查補：無未儲存變更時登出須成功回登入頁（原 handleLogout 殘留 guardDirty 呼叫曾使登出整路失效，
  // 而全套測試從未走過一次成功登出——此檢核堵住該缺口）。
  await adminMobile.click("#logoutButton");
  await adminMobile.waitForSelector("#viewLogin:not([hidden])", { timeout: 5000 });
  check("logout completes when not dirty (#317 must-fix regression)", true);

  // ── #317：登入卡「自本裝置移除」（兩段確認）——用 kid 裝置脈絡（其 localStorage 已有帳號卡）。
  const kidLogin2 = await kidCtx.newPage();
  await kidLogin2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await kidLogin2.waitForSelector("#accountSelect.show", { timeout: 15000 });
  await kidLogin2.click(`.account-pick[data-username="${kidUser}"]`);
  await kidLogin2.waitForSelector(".login-remove-card", { timeout: 8000 });
  await kidLogin2.click(".login-remove-card");
  const armed = await kidLogin2.evaluate(() => document.querySelector(".login-remove-card")?.classList.contains("is-armed") === true);
  const cardStillThere = await kidLogin2.evaluate((u) => !!document.querySelector(`.account-pick[data-username="${u}"]`), kidUser);
  check("remove-card single tap only arms (two-step confirm)", armed && cardStillThere);
  await kidLogin2.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await kidLogin2.waitForTimeout(250);
  await kidLogin2.screenshot({ path: path.join(SHOTS, "issue317-02-login-remove-card.png") });
  await kidLogin2.click(".login-remove-card");
  await kidLogin2.waitForSelector(`.account-pick[data-username="${kidUser}"]`, { state: "detached", timeout: 8000 });
  check("armed tap removes card from device", true);
  const kidStillOnServer = await api("/api/auth/login", { method: "POST", body: { username: kidUser, password: "fresh6678" } }); // 密碼已於前段線上重設
  check("server account untouched after card removal", kidStillOnServer.status === 200, `status=${kidStillOnServer.status}`);
  const sessionCleared = await kidLogin2.evaluate(() => !localStorage.getItem("luminara-princess-english-session"));
  check("device session cache cleared on card removal (#317 must-fix)", sessionCleared);

  check("no admin page errors", adminErrors.length === 0, adminErrors.join(" | "));

  // 收拾：重開註冊、解除鎖定（共用 compose DB，不留營運足跡）。
  const adminLogin = await api("/api/auth/login", { method: "POST", body: { username: adminUser, password: adminPassword } });
  adminToken = adminLogin.body.token;
  await api("/api/admin/settings", { method: "PUT", token: adminToken, body: { registrationOpen: true, defaultPlayMinutes: 15, defaultRestMinutes: 15, defaultPlayMaxMinutes: 20 } });
  check("cleanup: registration reopened", (await api("/api/config")).body.registrationOpen === true);
} catch (error) {
  failures += 1;
  console.error("e2e crashed:", error);
} finally {
  await browser.close();
  server.kill();
}
console.log(failures === 0 ? "E2E-ADMIN PASS" : `E2E-ADMIN FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
