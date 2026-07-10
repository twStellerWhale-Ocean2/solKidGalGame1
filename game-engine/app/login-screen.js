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
  loadCachedSession,
  loadMigratedLocalIds,
  loadRecentAccounts,
  markLocalAccountMigrated,
  removeRecentAccount
} from "../state/cloud-session.js";
import { freshState, loadAccountState, normalizeState } from "../state/game-state.js";
import { listAccounts } from "../state/accounts.js";
import { playableCharacterById, normalizeBackgroundPattern } from "../data/game-data.js";
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
  if (els.title) els.title.textContent = "Sign in to play";
  if (els.intro) els.intro.textContent = "Pick your card and type your password. Progress is saved on your family server.";
  if (els.newButton) els.newButton.textContent = "Create new account";
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
  line.setAttribute("role", "alert");
  line.textContent = message;
  line.hidden = !message;
  return line;
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

async function submitLogin(username, password, errorEl) {
  if (busy) return;
  if (!validateUsernameInput(username)) {
    errorEl.textContent = "Username: 3-16 lowercase letters and digits, starting with a letter.";
    errorEl.hidden = false;
    return;
  }
  busy = true;
  try {
    const result = await cloudLogin(username, password);
    if (!result.ok) {
      errorEl.textContent = result.code === "rate-limited"
        ? "Too many attempts. Please wait a moment and try again."
        : "Username or password is incorrect.";
      errorEl.hidden = false;
      return;
    }
    await enterGame(result.state);
  } catch (error) {
    errorEl.textContent = "Cannot reach the server. Check the connection and try again.";
    errorEl.hidden = false;
    console.warn("login failed", error);
  } finally {
    busy = false;
  }
}

async function submitRegister(username, password, errorEl) {
  if (busy) return;
  if (!validateUsernameInput(username)) {
    errorEl.textContent = "Username: 3-16 lowercase letters and digits, starting with a letter.";
    errorEl.hidden = false;
    return;
  }
  const passwordError = validatePasswordInput(password);
  if (passwordError) {
    errorEl.textContent = passwordError === "password-too-short"
      ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
      : "Password is too long (max 72 characters).";
    errorEl.hidden = false;
    return;
  }
  busy = true;
  try {
    const result = await cloudRegister(username, password);
    if (!result.ok) {
      // 停留於註冊表單期間才被關閉、送出方知（sysCase#6.2）：同一句友善說明就地呈現。
      if (result.code === "registration-closed") {
        serverConfig.registrationOpen = false;
        errorEl.textContent = "This server is not taking new accounts right now. Please ask your grown-up to open it.";
        errorEl.hidden = false;
        return;
      }
      errorEl.textContent = result.code === "username-taken"
        ? "This username is already taken. Try another one."
        : result.code === "rate-limited"
          ? "Too many attempts. Please wait a moment and try again."
          : "Could not create the account. Please check the inputs.";
      errorEl.hidden = false;
      return;
    }
    await enterGame(null, { isNew: true });
  } catch (error) {
    errorEl.textContent = "Cannot reach the server. Check the connection and try again.";
    errorEl.hidden = false;
    console.warn("register failed", error);
  } finally {
    busy = false;
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
        try {
          const resumed = await cloudResume();
          if (resumed?.ok) {
            await enterGame(resumed.state);
            return;
          }
          if (resumed?.offline) {
            error.textContent = "Cannot reach the server. Check the connection and try again.";
            error.hidden = false;
            return;
          }
          // session 已失效：改為輸入密碼
          expandedUsername = entry.username;
          buildLoginScreen();
        } finally {
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
      panel.append(continueBtn, logoutBtn, error);
    }
    if (!isResume || !loadCachedSession()) {
      const { wrap, input } = passwordField({ id: `loginPassword-${entry.username}` });
      const enter = document.createElement("button");
      enter.type = "button";
      enter.className = "primary-button login-enter";
      enter.textContent = "Enter";
      const submit = () => submitLogin(entry.username, input.value, error);
      enter.addEventListener("click", submit);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submit();
      });
      panel.append(wrap, enter, error);
      setTimeout(() => input.focus({ preventScroll: true }), 0);
    }
    // 自本裝置移除卡片（#317／spec#8）：僅清本機快取摘要、不動伺服器帳號與存檔（重新登入即重建）；
    // 防兒童誤觸採兩段確認；被維護者刪除之帳號其殘留卡亦由此移除（401 統一錯誤不可自動辨識，spec#23）。
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "soft-button login-remove-card";
    removeBtn.textContent = "Remove card from this device";
    removeBtn.addEventListener("click", async () => {
      if (!removeBtn.dataset.armed) {
        removeBtn.dataset.armed = "1";
        removeBtn.classList.add("is-armed");
        removeBtn.textContent = "Tap again to remove (progress stays on the server)";
        return;
      }
      if (isResume && loadCachedSession()) await cloudLogout().catch(() => {});
      removeRecentAccount(entry.username);
      expandedUsername = "";
      buildLoginScreen();
    });
    panel.appendChild(removeBtn);
    row.appendChild(panel);
  }
  return row;
}

function buildOtherLoginForm() {
  const form = document.createElement("div");
  form.className = "login-form";
  const heading = document.createElement("h3");
  heading.textContent = "Sign in with another account";
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
  enter.addEventListener("click", () => submitLogin(userInput.value.trim(), input.value, error));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitLogin(userInput.value.trim(), input.value, error);
  });
  const back = document.createElement("button");
  back.type = "button";
  back.className = "soft-button";
  back.textContent = "Back";
  back.addEventListener("click", () => loginScreenSetMode("cards"));
  form.append(heading, userInput, wrap, enter, error, back);
  return form;
}

function buildRegisterForm() {
  const form = document.createElement("div");
  form.className = "login-form";
  const heading = document.createElement("h3");
  heading.textContent = "Create new account";
  const hint = document.createElement("p");
  hint.className = "login-hint";
  hint.textContent = "Username: 3-16 lowercase letters/digits, starts with a letter. Password: at least 6 characters. A parent can help type.";
  const userInput = document.createElement("input");
  userInput.type = "text";
  userInput.className = "login-input";
  userInput.id = "registerUsername";
  userInput.autocomplete = "off";
  userInput.placeholder = "Username (e.g. mimi2018)";
  const { wrap, input } = passwordField({ id: "registerPassword", placeholder: "Password (6+ characters)" });
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.focus();
  });
  const error = errorLine();
  const create = document.createElement("button");
  create.type = "button";
  create.className = "primary-button login-enter";
  create.textContent = "Create and play";
  create.addEventListener("click", () => submitRegister(userInput.value.trim(), input.value, error));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitRegister(userInput.value.trim(), input.value, error);
  });
  const back = document.createElement("button");
  back.type = "button";
  back.className = "soft-button";
  back.textContent = "Back";
  back.addEventListener("click", () => loginScreenSetMode("cards"));
  form.append(heading, hint, userInput, wrap, create, error, back);
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
  els.list.innerHTML = "";
  if (els.back) els.back.hidden = true; // 登入 gate：不可關閉
  const cached = loadCachedSession();
  const recents = loadRecentAccounts();
  const registrationOpen = serverConfig.registrationOpen;
  // 註冊關閉（spec#26 (c)）：不渲染任何「建立新帳號」入口（含空狀態表單），改顯示友善說明。
  if (els.newButton) els.newButton.hidden = !registrationOpen || uiMode === "register" || (uiMode === "cards" && recents.length === 0);
  if (els.empty) {
    els.empty.hidden = recents.length > 0 || uiMode !== "cards";
    els.empty.textContent = registrationOpen
      ? "No players on this device yet. Create a new account to start your adventure!"
      : "No players on this device yet. Sign in with your account below.";
  }
  if (uiMode === "register" && !registrationOpen) uiMode = "cards";
  if (uiMode === "login") {
    els.list.appendChild(buildOtherLoginForm());
    return;
  }
  if (uiMode === "register") {
    els.list.appendChild(buildRegisterForm());
    if (recents.length === 0) {
      // 空狀態（#309 審查 C2）：register 模式仍保留「其他帳號登入」與遷移入口——
      // 含 config 查詢完成後之重建（#310），不因 rebuild 而消失。
      const emptyActions = document.createElement("div");
      emptyActions.className = "login-actions";
      const otherEntry = document.createElement("button");
      otherEntry.type = "button";
      otherEntry.className = "soft-button";
      otherEntry.textContent = "Other account";
      otherEntry.addEventListener("click", () => loginScreenSetMode("login"));
      emptyActions.appendChild(otherEntry);
      els.list.appendChild(emptyActions);
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
  if (recents.length === 0 && registrationOpen) loginScreenSetModeSilently();
}

// 空狀態（[hmiIntf自訂登入註冊頁] (a)）：無任何帳號卡時預設聚焦建立新帳號表單，
// 並保留「其他帳號登入」入口（此裝置沒卡片但伺服器可能已有帳號）。
function loginScreenSetModeSilently() {
  if (uiMode === "cards" && loadRecentAccounts().length === 0) {
    uiMode = "register";
    const els = overlayEls();
    els.list.innerHTML = "";
    if (els.empty) els.empty.hidden = false;
    els.list.appendChild(buildRegisterForm());
    const actions = document.createElement("div");
    actions.className = "login-actions";
    const other = document.createElement("button");
    other.type = "button";
    other.className = "soft-button";
    other.textContent = "Other account";
    other.addEventListener("click", () => loginScreenSetMode("login"));
    actions.appendChild(other);
    els.list.appendChild(actions);
    const migrate = buildMigrationEntry();
    if (migrate) els.list.appendChild(migrate);
  }
}

export function removeRecent(username) {
  removeRecentAccount(username);
  buildLoginScreen();
}
