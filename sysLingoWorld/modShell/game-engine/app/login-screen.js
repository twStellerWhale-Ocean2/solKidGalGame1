// app/login-screen.js — 伺服器帳號登入／註冊畫面（issue #309 / spec#8、#23；[hmiIntf自訂登入註冊頁]）。
// 沿用 #accountSelect overlay 骨架與帳號卡視覺；雲端模式下取代本機帳號選擇（select-screens 保留為 selftest 測試替身）。
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
  cloudLogout,
  cloudRegister,
  cloudResume,
  flushCloudSave,
  syncRecentSummary
} from "../system/cloud-sync.js";
import {
  clearCachedSession,
  loadCachedSession,
  loadMigratedLocalIds,
  loadRecentAccounts,
  markLocalAccountMigrated,
  removeRecentAccount
} from "../state/cloud-session.js";
import { apiLogout } from "../system/api-client.js";
import { freshState, loadAccountState, normalizeState } from "../state/game-state.js";
import { getActiveAccountId, listAccounts } from "../state/accounts.js";
import { playableCharacterById, normalizeBackgroundPattern } from "../data/game-data.js";
import { buildInfo } from "../build/version.js"; // #358：登入卡產品識別之版本值（VERSION SSOT 投影，不另存第二份）
import { princessName, profileColorFor, render, renderBustInto } from "../render/hud.js";
import { changeView } from "./views.js";
import { clockNow, formatClock, tickPlayClock } from "../state/play-session.js";
import { playStatus } from "../system/play-clock.js";
import { openCharacterSelect } from "./select-screens.js";
import { elements, session } from "../core/session.js";

let uiMode = "cards"; // cards | login | register
let expandedUsername = "";
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
  uiMode = "cards";
  expandedUsername = "";
  const els = overlayEls();
  // #358 產品識別：卡片頂端＝軟體名稱（品牌）；版本以小字置頁尾（見 buildLoginScreen）。
  // #359：副標精簡為一句——規則不前置攤開，改由 placeholder 與 #331 就地錯誤漸進揭露。
  if (els.title) els.title.textContent = "Luminara";
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

function statusTextFor(entry) {
  if (!entry.playLimit) return "Ready";
  const status = playStatus({ playLimit: entry.playLimit }, clockNow());
  if (status.phase === "rest" && !status.restDone) return `Rest ${formatClock(status.restRemainingMs)}`;
  if (status.phase === "play") return `Play ${formatClock(status.playRemainingMs)}`;
  return "Ready";
}

function formatLastPlayed(timestamp) {
  if (!timestamp) return "Not played yet";
  const date = new Date(timestamp);
  return `Last played ${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
  elements.statusMessage.textContent = `Welcome back, ${princessName()}. Choose a place to start.`;
  tickPlayClock();
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

function buildAccountCard(entry, cachedUsername) {
  const row = document.createElement("div");
  row.className = "account-row login-card";
  row.setAttribute("role", "listitem");
  const pick = document.createElement("button");
  pick.type = "button";
  pick.className = "account-pick";
  pick.dataset.username = entry.username;
  const color = profileColorFor(entry.characterId, entry.profileColor);
  pick.style.setProperty("--profile-color", color);
  const avatar = document.createElement("span");
  avatar.className = "account-avatar bust-frame";
  if (entry.outfit) {
    renderBustInto(avatar, entry.characterId, entry.outfit, color, normalizeBackgroundPattern(entry.backgroundPattern));
  }
  const nameEl = document.createElement("strong");
  nameEl.textContent = entry.playerName || playableCharacterById(entry.characterId)?.defaultName || entry.username;
  const userEl = document.createElement("small");
  userEl.textContent = entry.username; // 副標 username（重名可辨，spec#8）
  const metaEl = document.createElement("small");
  metaEl.className = "account-meta-line";
  metaEl.textContent = `${entry.coins} coins · ${formatLastPlayed(entry.lastPlayedAt)}`;
  const statusEl = document.createElement("span");
  statusEl.className = "account-status";
  statusEl.textContent = statusTextFor(entry);
  const text = document.createElement("span");
  text.className = "account-text";
  text.append(nameEl, userEl, metaEl);
  pick.append(avatar, text, statusEl);
  row.appendChild(pick);

  const isResume = cachedUsername === entry.username;
  pick.addEventListener("click", () => {
    expandedUsername = expandedUsername === entry.username ? "" : entry.username;
    buildLoginScreen();
  });

  if (expandedUsername === entry.username) {
    const panel = document.createElement("div");
    panel.className = "login-expand";
    const error = errorLine();
    if (isResume) {
      // 最後登入帳號＋有效 session：免密碼續玩（spec#23）；另提供登出。
      const continueBtn = document.createElement("button");
      continueBtn.type = "button";
      continueBtn.className = "primary-button login-continue";
      continueBtn.textContent = `Continue as ${entry.playerName || entry.username}`;
      continueBtn.addEventListener("click", async () => {
        if (busy) return;
        busy = true;
        const restore = buttonBusy(continueBtn, "Signing in…"); // 忙碌視覺與登入/註冊鈕同規（#336 B-1）
        try {
          const resumed = await cloudResume();
          if (resumed?.ok) {
            await enterGame(resumed.state);
            return;
          }
          if (resumed?.offline) {
            showError(error, "Cannot reach the server. Check the connection and try again.");
            return;
          }
          // session 已失效：改為輸入密碼
          expandedUsername = entry.username;
          buildLoginScreen();
        } finally {
          restore();
          busy = false;
        }
      });
      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "soft-button login-logout";
      logoutBtn.textContent = "Log out";
      logoutBtn.addEventListener("click", async () => {
        await cloudLogout();
        buildLoginScreen();
      });
      panel.append(error, continueBtn, logoutBtn); // 錯誤行置鈕上方（#331）
    }
    if (!isResume || !loadCachedSession()) {
      const { wrap, input } = passwordField({ id: `loginPassword-${entry.username}` });
      const enter = document.createElement("button");
      enter.type = "button";
      enter.className = "primary-button login-enter";
      enter.textContent = "Enter";
      const submit = () => submitLogin(entry.username, input.value, error, enter);
      enter.addEventListener("click", submit);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submit();
      });
      panel.append(wrap, error, enter); // 錯誤行置送出鈕上方（#331）
      setTimeout(() => input.focus({ preventScroll: true }), 0);
    }
    // 自本裝置移除卡片（#317／spec#8）：僅清本機快取摘要、不動伺服器帳號與存檔（重新登入即重建）；
    // 防兒童誤觸採兩段確認；被維護者刪除之帳號其殘留卡亦由此移除（401 統一錯誤不可自動辨識，spec#23）。
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "soft-button login-remove-card";
    removeBtn.textContent = "Remove card from this device";
    let disarmTimer = 0;
    removeBtn.addEventListener("click", async () => {
      if (!removeBtn.dataset.armed) {
        removeBtn.dataset.armed = "1";
        removeBtn.classList.add("is-armed");
        removeBtn.textContent = "Tap again to remove (progress stays on the server)";
        // 防兒童連點誤觸（#317 審查）：armed 後短暫停用吃掉 double-tap，閒置未確認則自動撤防。
        removeBtn.disabled = true;
        setTimeout(() => { removeBtn.disabled = false; }, 700);
        disarmTimer = setTimeout(() => {
          delete removeBtn.dataset.armed;
          removeBtn.classList.remove("is-armed");
          removeBtn.textContent = "Remove card from this device";
        }, 5000);
        return;
      }
      clearTimeout(disarmTimer);
      // 係本裝置最後登入帳號時：活躍 session（自遊戲返回選單）走正規登出；非活躍（重整後直落登入畫面）
      // cloudLogout 為 no-op——改本地清快取＋盡力撤銷伺服器 session（#317 審查 must-fix：快取不得殘留）。
      const cached = loadCachedSession();
      if (cached?.username === entry.username) {
        await cloudLogout().catch(() => {});
        if (loadCachedSession()?.username === entry.username) {
          apiLogout(cached.token).catch(() => {});
          clearCachedSession();
        }
      }
      removeRecentAccount(entry.username);
      expandedUsername = "";
      buildLoginScreen();
    });
    panel.appendChild(removeBtn);
    row.appendChild(panel);
  }
  return row;
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

// #357：登入表單＝預設態（帳號存伺服器，新裝置的既有玩家必須先能登入、而非被導去重建帳號）。
function buildOtherLoginForm() {
  const hasCards = loadRecentAccounts().length > 0;
  const form = document.createElement("div");
  form.className = "login-form";
  const heading = document.createElement("h3");
  heading.textContent = hasCards ? "Sign in with another account" : "Sign in";
  const userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "login-input";
  userInput.id = "loginOtherUsername";
  userInput.autocomplete = "off";
  userInput.placeholder = "Username (lowercase letters, digits)";
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
  // #357：Back 只在真有上一步（此裝置有帳號卡）時出現——空狀態的 root auth 畫面無處可回、不放返回。
  if (hasCards) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "soft-button";
    back.textContent = "Back";
    back.addEventListener("click", () => loginScreenSetMode("cards"));
    form.appendChild(back);
  }
  // #357：註冊降為次要出口（註冊關閉時不出現，spec#26 (c)）。
  if (serverConfig.registrationOpen) {
    form.appendChild(secondaryLink("First time here? Create an account", () => loginScreenSetMode("register")));
  }
  return form;
}

function buildRegisterForm() {
  const hasCards = loadRecentAccounts().length > 0;
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
  if (hasCards) { // #357：同上，有卡片才有「回卡片列表」這個上一步
    const back = document.createElement("button");
    back.type = "button";
    back.className = "soft-button";
    back.textContent = "Back";
    back.addEventListener("click", () => loginScreenSetMode("cards"));
    form.appendChild(back);
  }
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
  // #372：Back 顯示與否比照本機模式（select-screens buildAccountList L314）——
  // 由「進行中遊戲」按 ⟳Switch player 進入時（有使用中帳號、非啟動 gate）提供回程；
  // 啟動登入 gate（mustChoose，或尚無使用中帳號，如 main.js bootstrap）仍不可關閉（#309 不可繞過）。
  if (els.back) els.back.hidden = session.accountSelectMustChoose || !getActiveAccountId();
  const cached = loadCachedSession();
  const recents = loadRecentAccounts();
  const registrationOpen = serverConfig.registrationOpen;
  // #357：無帳號卡＝預設登入表單。**須在算 newButton／empty 之前收斂 uiMode**——否則首繪（config 未回時）
  // 與「移除最後一張卡」路徑會以 cards 模式算出可見的大鈕、與 Sign in 表單並列（註冊與登入同權復活），
  // 且後者無後續重繪可救＝永久殘留（Q3 審查 M2）。
  // 順序有意義：「無卡 ⟹ login」是 #357 的不變式，**必須是最後一道收斂**——
  // 若先跑它、再由 register→cards 降級，降級產出的 cards 就無人收斂，空狀態會落入
  // 「0 張卡又沒有登入表單」的死角（Q3 二審 N1：註冊關閉＋config RTT 窗內點註冊連結即可達）。
  if (uiMode === "register" && !registrationOpen) uiMode = "cards";
  if (uiMode === "cards" && recents.length === 0) uiMode = "login";
  // 註冊關閉（spec#26 (c)）：不渲染任何「建立新帳號」入口（含空狀態表單），改顯示友善說明。
  // #357：「Create new account」大鈕只留在卡片列表（＝家庭新增另一位玩家之主要動作）；
  // 登入／註冊表單模式下改由表單內之次要連結出入，不並列第二顆主要鈕（否則註冊仍與登入同權，改了等於沒改）。
  if (els.newButton) els.newButton.hidden = !registrationOpen || uiMode !== "cards";
  // #357（Q3 二審 N2）：登入畫面不再需要「此裝置尚無玩家」旁白——收斂後「無卡」必為 login 模式，
  // 登入表單本身就是空狀態的答案（#359 亦要求少字）。此處恆隱藏；`#accountEmpty` 元素保留供本機模式
  // （select-screens 之 openAccountSelect）使用，故只關顯示、不刪 DOM。
  if (els.empty) els.empty.hidden = true;
  if (uiMode === "login") {
    els.list.appendChild(buildOtherLoginForm());
    // spec#26 (c)：註冊關閉之友善說明——#357 後 login 為空狀態預設模式，此分支亦須呈現
    // （config 非同步回來後之重繪走這裡，漏了就只剩登入表單、說明消失）。
    if (!registrationOpen) els.list.appendChild(registrationClosedNotice());
    if (recents.length === 0) {
      const emptyMigrate = buildMigrationEntry();
      if (emptyMigrate) els.list.appendChild(emptyMigrate);
    }
    return;
  }
  if (uiMode === "register") {
    els.list.appendChild(buildRegisterForm()); // 回登入之次要出口已內建於表單（#357）
    if (recents.length === 0) {
      // 空狀態（#309 審查 C2）：保留遷移入口——含 config 查詢完成後之重建（#310），不因 rebuild 而消失。
      const emptyMigrate = buildMigrationEntry();
      if (emptyMigrate) els.list.appendChild(emptyMigrate);
    }
    return;
  }
  recents.forEach((entry) => els.list.appendChild(buildAccountCard(entry, cached?.username || "")));
  const actions = document.createElement("div");
  actions.className = "login-actions";
  const other = document.createElement("button");
  other.type = "button";
  other.className = "soft-button";
  other.textContent = "Other account";
  other.addEventListener("click", () => loginScreenSetMode("login"));
  actions.appendChild(other);
  els.list.appendChild(actions);
  if (!registrationOpen) els.list.appendChild(registrationClosedNotice());
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
  footer.textContent = `Luminara v${buildInfo.version}`; // 玩家端品牌＋版本（design ＜命名層對照＞：codename solLingoWorld 不外露）
}

export function removeRecent(username) {
  removeRecentAccount(username);
  buildLoginScreen();
}
