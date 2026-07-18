// app/login-screen.js — 伺服器帳號登入／註冊畫面（issue #309 / spec#8、#23；[hmiIntf自訂登入註冊頁]）。
// #393 兩表單 canon（techApp ＜III.B＞）：本畫面＝帳號層唯一表單、僅未登入時出現——帳密登入＋註冊入口，
// 登入成功即保持登入並落選角色頁；無多帳號卡、無裝置卡管理（該反樣式已拆）。
import {
  PASSWORD_MIN_LENGTH,
  apiGetConfig,
  validatePasswordInput,
  validateUsernameInput
} from "../system/api-client.js";
import {
  adoptServerBase,
  cloud,
  cloudActive,
  cloudLogin,
  cloudRegister,
  cloudResume,
  flushCloudSave,
  syncRecentSummary
} from "../system/cloud-sync.js";
import {
  loadCachedSession,
  loadMigratedLocalIds,
  loadRecentAccounts,
  markLocalAccountMigrated
} from "../state/cloud-session.js";
import { freshState, loadAccountState, normalizeState } from "../state/game-state.js";
import { listAccounts } from "../state/accounts.js";
import { buildInfo } from "../build/version.js"; // #358：登入卡產品識別之版本值（VERSION SSOT 投影，不另存第二份）
import { BRAND_NAME } from "../data/brand.js"; // #358/#370：玩家端品牌名 SSOT（登入卡與遊戲內 wordmark 共用，不重複字面值）
import { render } from "../render/hud.js";
import { changeView } from "./views.js";
import { openCharacterSelect } from "./select-screens.js";
import { openCharacterHome } from "./character-home.js"; // #390：登入後家門口（兩表單 canon）
import { elements, session } from "../core/session.js";

let uiMode = "login"; // login | register（#393：帳號卡模式拆除）
let busy = false;

// issue #310（spec#26／sysCase#16.2）：伺服器公開設定（註冊開關＋新帳號預設時長）。
// 查詢失敗以註冊開放為預設（fail-open）、不阻斷登入動線。
let serverConfig = { registrationOpen: true, defaultPlayLimit: null };

async function refreshServerConfig() {
  try {
    const res = await apiGetConfig();
    if (res.status === 200 && res.body) {
      serverConfig = {
        registrationOpen: res.body.registrationOpen !== false,
        defaultPlayLimit: res.body.defaultPlayLimit || null
      };
    }
  } catch {
    serverConfig = { registrationOpen: true, defaultPlayLimit: serverConfig.defaultPlayLimit };
  }
  // 開關可能改變註冊入口呈現：畫面仍開著時重建。
  if (elements.accountSelect?.classList.contains("show")) buildLoginScreen();
}

function registrationClosedNotice() {
  const notice = document.createElement("p");
  notice.className = "login-hint login-registration-closed";
  notice.textContent = "This server is not taking new accounts right now. Please ask your grown-up to open it.";
  return notice;
}

function overlayEls() {
  return {
    overlay: elements.accountSelect,
    card: elements.accountSelectCard,
    title: document.getElementById("accountSelectTitle"),
    intro: document.querySelector("#accountSelect .account-select-header p"),
    list: elements.accountList,
    empty: elements.accountEmpty,
    back: elements.accountBack,
    newButton: elements.accountNewButton
  };
}

export function openLoginScreen({ mustChoose = true } = {}) {
  session.accountSelectMustChoose = mustChoose;
  uiMode = "login"; // #393：預設即登入表單（僅未登入時會走到本畫面）
  const els = overlayEls();
  // #358 產品識別：卡片頂端＝軟體名稱（品牌）；版本以小字置頁尾（見 buildLoginScreen）。
  // #359：副標精簡為一句——規則不前置攤開，改由 placeholder 與 #331 就地錯誤漸進揭露。
  if (els.title) els.title.textContent = BRAND_NAME;
  if (els.intro) els.intro.textContent = "Princess English Adventure — sign in to play. A parent can help type.";
  if (els.newButton) els.newButton.textContent = "Create new account";
  // #358 後標題＝品牌名，對話框 accessible name 由「用途」變「品牌」；以 describedby 指向副標補回用途（Q3 審查 F1）。
  els.card?.setAttribute("aria-describedby", "accountSelectIntro");
  void refreshServerConfig();
  buildLoginScreen();
  els.overlay.classList.add("show");
  els.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-select-open");
  setTimeout(() => els.card?.focus({ preventScroll: true }), 0);
}

export function closeLoginScreen() {
  const els = overlayEls();
  els.overlay.classList.remove("show");
  els.overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-select-open");
}

export function loginScreenSetMode(mode) {
  uiMode = mode;
  buildLoginScreen();
}

function errorLine(message = "") {
  const line = document.createElement("p");
  line.className = "login-error";
  line.setAttribute("role", "alert"); // 隱含 aria-live=assertive
  line.setAttribute("tabindex", "-1"); // 供 showError 聚焦報讀
  // 固定高度預留（#331）：不以 hidden 切換——空值時仍佔位（CSS min-height），
  // 錯誤出現不推擠送出鈕、手指已對準的位置不位移。
  line.textContent = message;
  return line;
}

// ── #331 錯誤回饋通則（design III.C.(C)）：任何送出被拒一律就地醒目呈現且保證在視野內──
// 錯誤行置於送出鈕上方（手機軟鍵盤展開時鈕下內容常在畫面外）、⚠ 前綴（非僅色彩）、
// 捲入視野＋聚焦報讀；格式類錯誤同時把肇事欄位標為 error 狀態（aria-invalid，輸入即清除）。
function showError(errorEl, message, field = null) {
  errorEl.textContent = `⚠ ${message}`;
  if (field) {
    field.classList.add("input-error");
    field.setAttribute("aria-invalid", "true");
    field.addEventListener("input", () => {
      field.classList.remove("input-error");
      field.removeAttribute("aria-invalid");
    }, { once: true });
  }
  errorEl.scrollIntoView({ block: "nearest" });
  errorEl.focus({ preventScroll: true });
}

// 送出中鈕面忙碌狀態（#331）：disabled＋進行中字樣，杜絕「按了沒反應」感受；回傳還原函式。
function buttonBusy(button, label) {
  if (!button) return () => {};
  const original = button.textContent;
  button.disabled = true;
  button.classList.add("is-busy");
  button.textContent = label;
  return () => {
    button.disabled = false;
    button.classList.remove("is-busy");
    button.textContent = original;
  };
}

// 429 訊息附可再試等待時間（#331）：以伺服器 retryAfterSeconds 組句，缺值退回泛句。
function rateLimitMessage(result) {
  const seconds = Number(result?.retryAfterSeconds) || 0;
  if (seconds > 90) return `Too many attempts. Please wait ${Math.ceil(seconds / 60)} minutes and try again.`;
  if (seconds > 0) return `Too many attempts. Please wait ${seconds} seconds and try again.`;
  return "Too many attempts. Please wait a moment and try again.";
}

function passwordField({ id, placeholder = "Password" }) {
  const wrap = document.createElement("div");
  wrap.className = "login-password-wrap";
  const input = document.createElement("input");
  input.type = "password";
  input.id = id;
  input.autocomplete = "off";
  input.placeholder = placeholder;
  input.className = "login-input";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "login-show-toggle";
  toggle.setAttribute("aria-label", "Show password");
  toggle.textContent = "👁";
  toggle.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
    toggle.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
  });
  wrap.append(input, toggle);
  return { wrap, input };
}

// 進入遊戲：serverState 為 null 時建立新局並首寫雲端（baseUpdatedAt=null）。
async function enterGame(serverState, { isNew = false } = {}) {
  session.state = serverState ? normalizeState(serverState) : freshState();
  if (!serverState && serverConfig.defaultPlayLimit) {
    // spec#26 (a)：新帳號初始遊玩／休息時長取執行期設定之預設值（缺值沿程式預設）。
    const defaults = serverConfig.defaultPlayLimit;
    const limit = session.state.playLimit;
    if (Number.isFinite(defaults.playMinutes)) limit.playMinutes = defaults.playMinutes;
    if (Number.isFinite(defaults.restMinutes)) limit.restMinutes = defaults.restMinutes;
    if (Number.isFinite(defaults.playMaxMinutes)) limit.playMaxMinutes = defaults.playMaxMinutes;
  }
  session.accountSelectMustChoose = false;
  if (!serverState) {
    adoptServerBase(null);
    await flushCloudSave();
  }
  syncRecentSummary();
  closeLoginScreen();
  render();
  changeView("home");
  // 新帳號一律先選角命名（沿 createNewAccount 慣例）；既有帳號僅在缺名時補選角。
  if (isNew || !session.state.playerName) {
    openCharacterSelect({ forced: true });
    return;
  }
  // #390 兩表單 canon：登入/續玩成功後落「選角色頁」（每次上線經過，在此回答「你是誰」）；
  // 歡迎訊息與遊玩時鐘改於選角色頁點角色進入時處理（character-home.enterAsCharacter）。
  openCharacterHome();
}

// #390 開機動線：先靜默續玩（帳號登入一次即保持登入），成功落選角色頁；
// 無裝置快取或 session 失效才顯示登入表單。離線時亦回登入表單（卡上 Continue 可重試）。
export async function bootCloudEntry() {
  if (loadCachedSession()) {
    try {
      const resumed = await cloudResume();
      if (resumed?.ok) {
        await enterGame(resumed.state);
        return;
      }
    } catch (error) {
      console.warn("silent resume failed", error);
    }
  }
  openLoginScreen({ mustChoose: true });
}

async function submitLogin(username, password, errorEl, button = null, usernameField = null) {
  if (busy) return;
  if (!validateUsernameInput(username)) {
    showError(errorEl, "Username: 3-16 lowercase letters and digits, with at least one letter.", usernameField);
    return;
  }
  busy = true;
  const restore = buttonBusy(button, "Signing in…");
  try {
    const result = await cloudLogin(username, password);
    if (!result.ok) {
      showError(errorEl, result.code === "rate-limited"
        ? rateLimitMessage(result)
        : "Username or password is incorrect.");
      return;
    }
    await enterGame(result.state);
  } catch (error) {
    showError(errorEl, "Cannot reach the server. Check the connection and try again.");
    console.warn("login failed", error);
  } finally {
    busy = false;
    restore();
  }
}

async function submitRegister(username, password, errorEl, button = null, usernameField = null, pwdInput = null) {
  if (busy) return;
  if (!validateUsernameInput(username)) {
    showError(errorEl, "Username: 3-16 lowercase letters and digits, with at least one letter.", usernameField);
    return;
  }
  const passwordError = validatePasswordInput(password);
  if (passwordError) {
    showError(errorEl, passwordError === "password-too-short"
      ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
      : passwordError === "password-needs-mix"
        ? "Password needs at least one number and one lowercase letter."
        : "Password is too long (max 72 characters).", pwdInput);
    return;
  }
  busy = true;
  const restore = buttonBusy(button, "Creating…");
  try {
    const result = await cloudRegister(username, password);
    if (!result.ok) {
      // 停留於註冊表單期間才被關閉、送出方知（sysCase#6.2）：同一句友善說明就地呈現。
      if (result.code === "registration-closed") {
        serverConfig.registrationOpen = false;
        showError(errorEl, "This server is not taking new accounts right now. Please ask your grown-up to open it.");
        return;
      }
      showError(errorEl, result.code === "username-taken"
        ? "This username is already taken. Try another one."
        : result.code === "rate-limited"
          ? rateLimitMessage(result)
          : "Could not create the account. Please check the inputs.");
      return;
    }
    await enterGame(null, { isNew: true });
  } catch (error) {
    showError(errorEl, "Cannot reach the server. Check the connection and try again.");
    console.warn("register failed", error);
  } finally {
    busy = false;
    restore();
  }
}

// 次要出口（#357）：auth 卡之慣例——一個主要動作＋一條次要連結（非並列大鈕）。
function secondaryLink(text, onClick) {
  const wrap = document.createElement("p");
  wrap.className = "login-secondary";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "login-link";
  button.textContent = text;
  button.addEventListener("click", onClick);
  wrap.appendChild(button);
  return wrap;
}

// #357/#393：登入表單＝預設態（帳號存伺服器，新裝置的既有玩家必須先能登入、而非被導去重建帳號）。
function buildLoginForm() {
  const form = document.createElement("div");
  form.className = "login-form";
  const heading = document.createElement("h3");
  heading.textContent = "Sign in";
  const userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "login-input";
  userInput.id = "loginOtherUsername";
  userInput.autocomplete = "off";
  userInput.placeholder = "Username (lowercase letters, digits)";
  // #393：帳號欄預填本裝置最近登入之帳號（保持登入的退階便利——session 失效時只需補密碼）。
  userInput.value = loadCachedSession()?.username || loadRecentAccounts()[0]?.username || "";
  const { wrap, input } = passwordField({ id: "loginOtherPassword" });
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.focus();
  });
  const error = errorLine();
  const enter = document.createElement("button");
  enter.type = "button";
  enter.className = "primary-button login-enter";
  enter.textContent = "Sign in";
  const submit = () => submitLogin(userInput.value.trim(), input.value, error, enter, userInput);
  enter.addEventListener("click", submit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submit();
  });
  form.append(heading, userInput, wrap, error, enter); // 錯誤行置送出鈕上方（#331）
  // #357：註冊降為次要出口（註冊關閉時不出現，spec#26 (c)）。
  if (serverConfig.registrationOpen) {
    form.appendChild(secondaryLink("First time here? Create an account", () => loginScreenSetMode("register")));
  }
  return form;
}

function buildRegisterForm() {
  const form = document.createElement("div");
  form.className = "login-form";
  const heading = document.createElement("h3");
  heading.textContent = "Create new account";
  // #359：規則不再前置攤開——欄位 placeholder 精簡提示、違規時走 #331 之 ⚠ 就地錯誤（精確訊息在那）。
  const userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "login-input";
  userInput.id = "registerUsername";
  userInput.autocomplete = "off";
  userInput.placeholder = "Username (e.g. mimi2018)";
  const { wrap, input } = passwordField({ id: "registerPassword", placeholder: "Password (8+, number + lowercase)" });
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.focus();
  });
  const error = errorLine();
  const create = document.createElement("button");
  create.type = "button";
  create.className = "primary-button login-enter";
  create.textContent = "Create and play";
  const submit = () => submitRegister(userInput.value.trim(), input.value, error, create, userInput, input);
  create.addEventListener("click", submit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submit();
  });
  form.append(heading, userInput, wrap, error, create); // 錯誤行置送出鈕上方（#331）
  // #357：註冊頁之次要出口＝回登入（新裝置的既有玩家誤入註冊時的退路）。
  form.appendChild(secondaryLink("Already have an account? Sign in", () => loginScreenSetMode("login")));
  return form;
}

// 本機舊帳號一鍵遷移入口（spec#24 (b)、intTest#74）：僅在偵測到未遷移之舊本機帳號時顯示。
function pendingLegacyAccounts() {
  const migrated = new Set(loadMigratedLocalIds());
  return listAccounts().filter((account) => !migrated.has(account.id));
}

function buildMigrationEntry() {
  const pending = pendingLegacyAccounts();
  if (!pending.length) return null;
  const wrap = document.createElement("div");
  wrap.className = "login-migrate";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "soft-button login-migrate-button";
  button.textContent = `✨ Import old local progress (${pending.length})`;
  button.addEventListener("click", () => buildMigrationList(wrap, pending));
  wrap.appendChild(button);
  return wrap;
}

function buildMigrationList(container, pending) {
  container.innerHTML = "";
  const hint = document.createElement("p");
  hint.className = "login-hint";
  hint.textContent = "Sign in (or create) the account that should receive the old progress first, then pick an old player below.";
  container.appendChild(hint);
  pending.forEach((account) => {
    const state = loadAccountState(account.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "soft-button login-migrate-item";
    button.textContent = `${state.playerName || account.name || "Princess"} — ${Math.max(0, Number(state.coins) || 0)} coins`;
    button.addEventListener("click", () => migrateLocalAccount(account.id, container));
    container.appendChild(button);
  });
}

// 遷移：需已登入承接帳號；承接帳號已有雲端進度時明確警示覆蓋方向並確認（sysCase#4.2）。
export async function migrateLocalAccount(localId, container) {
  if (!cloudActive()) {
    window.alert("Sign in to the server account that should receive this progress first.");
    return;
  }
  const localState = loadAccountState(localId);
  if (cloud.baseUpdatedAt !== null) {
    const ok = window.confirm(
      `This will OVERWRITE the cloud progress of "${cloud.username}" with the old local progress (${localState.playerName || "Princess"}). Continue?`
    );
    if (!ok) return;
  }
  session.state = normalizeState(localState);
  adoptServerBase(cloud.baseUpdatedAt); // 以現值為基準覆寫（使用者已明示）
  await flushCloudSave();
  if (cloud.status === "idle") {
    markLocalAccountMigrated(localId); // 先上傳成功、後標記（intTest#74）
    syncRecentSummary();
    window.alert("Old progress imported to this account.");
    render();
    if (container) buildLoginScreen();
  } else {
    window.alert("Import failed (server unreachable). Your old progress is untouched — try again later.");
  }
}

export function buildLoginScreen() {
  const els = overlayEls();
  if (!els.list) return;
  renderLoginVersion(); // #358
  els.list.innerHTML = "";
  // #393 兩表單 canon：本畫面僅未登入時出現、帳號層無回程——Back 恆隱藏；
  // 「Create new account」大鈕退場（註冊入口＝表單內次要連結，#357 收斂之完成式）。
  if (els.back) els.back.hidden = true;
  if (els.newButton) els.newButton.hidden = true;
  // `#accountEmpty` 元素保留供本機模式（select-screens openAccountSelect）使用，只關顯示、不刪 DOM。
  if (els.empty) els.empty.hidden = true;
  const registrationOpen = serverConfig.registrationOpen;
  // 註冊關閉（spec#26 (c)）：不渲染任何「建立新帳號」入口，改顯示友善說明；誤入 register 模式即收斂回 login。
  if (uiMode === "register" && !registrationOpen) uiMode = "login";
  if (uiMode === "register") {
    els.list.appendChild(buildRegisterForm()); // 回登入之次要出口已內建於表單（#357）
  } else {
    els.list.appendChild(buildLoginForm());
    if (!registrationOpen) els.list.appendChild(registrationClosedNotice());
  }
  // 本機舊帳號遷移入口（spec#24 (b)）：偵測到未遷移舊帳號時恆顯示（含 config 重繪，不因 rebuild 消失）。
  const migrate = buildMigrationEntry();
  if (migrate) els.list.appendChild(migrate);
}

// #358：登入卡頁尾版本（值取自 VERSION SSOT 之投影 buildInfo，不手寫第二份）。
function renderLoginVersion() {
  const card = document.querySelector(".account-select-card");
  if (!card) return;
  let footer = card.querySelector(".login-version");
  if (!footer) {
    footer = document.createElement("p");
    footer.className = "login-version";
    card.appendChild(footer);
  }
  footer.textContent = `${BRAND_NAME} v${buildInfo.version}`; // 玩家端品牌＋版本（design ＜命名層對照＞：codename solLingoWorld 不外露）
}
