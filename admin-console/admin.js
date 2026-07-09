// [hmiIntf自訂線上管理頁] 前端（issue #310，spec#25／spec#26）：原生 ES module、無框架。
// 資料一律經 [apiIntf自訂線上管理服務] /api/admin/*（Bearer admin session）；401 一律回登入頁。
import { versionHistory } from "/game-engine/build/version.js";

const TOKEN_KEY = "luminara-admin-session";

// 開關視覺以 class 同步：class 直接掛在 track 元素本身——
// `:checked + sibling` 與後代 class 選擇器於 <dialog> top layer 內均有樣式不重算問題（Chromium）。
function bindSwitchVisual(input) {
  const wrap = input.closest(".switch");
  const track = wrap?.querySelector(".switch-track");
  if (!wrap || !track) return;
  const sync = () => {
    wrap.classList.toggle("is-on", input.checked);
    track.classList.toggle("is-on", input.checked);
  };
  input.addEventListener("change", sync);
  sync();
}

const $ = (id) => document.getElementById(id);
const els = {
  viewLogin: $("viewLogin"),
  viewApp: $("viewApp"),
  topbarAccount: $("topbarAccount"),
  topbarUsername: $("topbarUsername"),
  logoutButton: $("logoutButton"),
  loginForm: $("loginForm"),
  loginUsername: $("loginUsername"),
  loginPassword: $("loginPassword"),
  loginPasswordToggle: $("loginPasswordToggle"),
  loginError: $("loginError"),
  tabAccounts: $("tabAccounts"),
  tabSettings: $("tabSettings"),
  panelAccounts: $("panelAccounts"),
  panelSettings: $("panelSettings"),
  accountsTitle: $("accountsTitle"),
  accountsList: $("accountsList"),
  settingsForm: $("settingsForm"),
  settingRegistrationOpen: $("settingRegistrationOpen"),
  settingPlayMinutes: $("settingPlayMinutes"),
  settingRestMinutes: $("settingRestMinutes"),
  settingPlayMaxMinutes: $("settingPlayMaxMinutes"),
  settingsError: $("settingsError"),
  dialog: $("dialog"),
  snackbar: $("snackbar"),
  footerVersion: $("footerVersion")
};

// 憑證與身分一併存放（#310 審查：重整後不得以「清單第一個 admin」推斷自身，多 admin 時會誤判）。
function loadStoredSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOKEN_KEY) || "");
    if (parsed && typeof parsed.token === "string" && parsed.id && parsed.username) return parsed;
  } catch { /* 舊格式或無值 */ }
  return null;
}

const stored = loadStoredSession();
const state = {
  token: stored?.token || "",
  me: stored ? { id: stored.id, username: stored.username, role: "admin" } : null,
  settingsDirty: false,
  snackbarTimer: 0
};

// ── API ──
class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code || `HTTP ${status}`);
    this.status = status;
    this.code = code;
  }
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error?.code, data?.error?.message);
  return data;
}

// ── snackbar（成功自動消散、失敗持留可關） ──
function snackbar(message, { sticky = false } = {}) {
  window.clearTimeout(state.snackbarTimer);
  els.snackbar.innerHTML = "";
  els.snackbar.append(message);
  if (sticky) {
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "關閉";
    close.addEventListener("click", () => { els.snackbar.hidden = true; });
    els.snackbar.append(close);
  }
  els.snackbar.hidden = false;
  if (!sticky) state.snackbarTimer = window.setTimeout(() => { els.snackbar.hidden = true; }, 3200);
}

// ── dialog 建構 ──
function openDialog(build) {
  els.dialog.innerHTML = "";
  build(els.dialog);
  els.dialog.showModal();
}

function dialogActions(...buttons) {
  const wrap = document.createElement("div");
  wrap.className = "dialog-actions";
  wrap.append(...buttons);
  return wrap;
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn ${className}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

// ── 檢視切換 ──
function showLogin({ clearSession = true } = {}) {
  if (clearSession) {
    state.token = "";
    state.me = null;
    localStorage.removeItem(TOKEN_KEY);
  }
  els.viewApp.hidden = true;
  els.topbarAccount.hidden = true;
  els.viewLogin.hidden = false;
  els.loginError.hidden = true;
  els.loginForm.reset();
}

function showApp() {
  els.viewLogin.hidden = true;
  els.viewApp.hidden = false;
  els.topbarAccount.hidden = false;
  els.topbarUsername.textContent = `${state.me.username}（admin）`;
  selectTab("accounts");
}

function selectTab(name) {
  if (name === "settings" && state.settingsDirty === false) loadSettings();
  const accounts = name === "accounts";
  els.tabAccounts.setAttribute("aria-selected", String(accounts));
  els.tabSettings.setAttribute("aria-selected", String(!accounts));
  els.panelAccounts.hidden = !accounts;
  els.panelSettings.hidden = accounts;
  if (accounts) loadAccounts();
}

// 分頁切換前的未儲存變更防護（dirty guard，沿 spec#22 慣例）。
function guardDirty() {
  if (!state.settingsDirty) return true;
  return window.confirm("設定尚未儲存，確定要離開嗎？未儲存的變更會遺失。");
}

// ── 登入／登出 ──
async function handleLogin(event) {
  event.preventDefault();
  els.loginError.hidden = true;
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { username: els.loginUsername.value.trim(), password: els.loginPassword.value }
    });
    if (data.account.role !== "admin") {
      // 玩家帳號：明示無管理權限、不進入管理內容（順手撤銷剛核發的 session）。
      state.token = data.token;
      await api("/api/auth/logout", { method: "POST" }).catch(() => {});
      state.token = "";
      els.loginError.textContent = "此帳號無管理權限";
      els.loginError.hidden = false;
      return;
    }
    state.token = data.token;
    state.me = data.account;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token, id: data.account.id, username: data.account.username }));
    showApp();
  } catch (error) {
    els.loginError.textContent = error.code === "rate-limited"
      ? "嘗試次數過多，請稍後再試"
      : "帳號或密碼不正確";
    els.loginError.hidden = false;
  }
}

async function handleLogout() {
  if (!guardDirty()) return;
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    /* 已失效亦視為登出 */
  }
  state.settingsDirty = false;
  showLogin();
}

// ── 帳號分頁 ──
const dateFormat = new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
function formatTime(ms) {
  return ms ? dateFormat.format(new Date(ms)) : "－";
}

function policyChip(policy) {
  const chip = document.createElement("span");
  chip.className = "policy-chip";
  if (policy?.locked) {
    chip.classList.add("is-locked");
    chip.textContent = `鎖定 玩${policy.playMinutes}/休${policy.restMinutes}/上限${policy.playMaxMinutes}`;
  } else {
    chip.textContent = "玩家自調";
  }
  return chip;
}

const PLAY_STATUS_LABEL = { play: "遊玩中", rest: "休息中", idle: "可玩" };

function closeRowMenus() {
  document.querySelectorAll(".row-menu").forEach((menu) => menu.remove());
  document.querySelectorAll(".menu-button[aria-expanded='true']").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

async function loadAccounts() {
  try {
    const data = await api("/api/admin/accounts");
    renderAccounts(data.accounts);
  } catch (error) {
    if (error.status === 401) return showLogin();
    snackbar(`帳號清單載入失敗：${error.message}`, { sticky: true });
  }
}

function renderAccounts(accounts) {
  const players = accounts.filter((account) => account.role === "player").length;
  els.accountsTitle.textContent = `全部帳號（玩家 ${players}・維護者 ${accounts.length - players}）`;
  els.accountsList.innerHTML = "";
  const header = document.createElement("div");
  header.className = "accounts-header";
  ["帳號", "建立", "最近登入", "存檔更新", "時長政策", "操作"].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });
  els.accountsList.append(header);
  accounts.forEach((account) => els.accountsList.append(renderAccountRow(account)));
}

function renderAccountRow(account) {
  const row = document.createElement("div");
  row.className = "account-row";
  row.dataset.username = account.username;

  const name = document.createElement("div");
  name.className = "account-name";
  const username = document.createElement("span");
  username.className = "account-username";
  username.textContent = account.username;
  // 徽章固定第二行（不隨帳號名長度 flex-wrap 參差）。
  const badges = document.createElement("span");
  badges.className = "account-badges";
  const badge = document.createElement("span");
  badge.className = `role-badge${account.role === "admin" ? " is-admin" : ""}`;
  badge.textContent = account.role;
  badges.append(badge);
  if (account.role === "player") {
    const status = document.createElement("span");
    status.className = "status-chip";
    status.textContent = PLAY_STATUS_LABEL[account.playStatus] || "可玩";
    badges.append(status);
  }
  name.append(username, badges);

  const created = cell("建立", formatTime(account.createdAt));
  const lastLogin = cell("最近登入", formatTime(account.lastLoginAt));
  const saveUpdated = cell("存檔更新", formatTime(account.saveUpdatedAt));
  const policy = document.createElement("div");
  policy.className = "account-cell";
  const policyLabel = document.createElement("b");
  policyLabel.textContent = "時長政策";
  policy.append(policyLabel, policyChip(account.playLimitPolicy));

  const actions = document.createElement("div");
  actions.className = "account-actions";
  const reset = makeButton("重設密碼", "btn-tonal", () => openResetPasswordDialog(account));
  actions.append(reset);
  if (account.id !== state.me.id) {
    // 每列主操作＋⋮ 溢出選單（MD3 列操作慣例）；admin 自身列僅主操作。
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "menu-button";
    menuButton.setAttribute("aria-label", `${account.username} 更多操作`);
    menuButton.setAttribute("aria-haspopup", "menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "⋮";
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const existing = actions.querySelector(".row-menu");
      closeRowMenus();
      if (existing) return;
      actions.append(renderRowMenu(account));
      menuButton.setAttribute("aria-expanded", "true");
    });
    actions.append(menuButton);
  }

  row.append(name, created, lastLogin, saveUpdated, policy, actions);
  return row;
}

function cell(label, value) {
  const div = document.createElement("div");
  div.className = "account-cell";
  const b = document.createElement("b");
  b.textContent = label;
  div.append(b, value);
  return div;
}

function renderRowMenu(account) {
  const menu = document.createElement("div");
  menu.className = "row-menu";
  const limit = document.createElement("button");
  limit.type = "button";
  limit.textContent = "時長覆寫與鎖定…";
  limit.addEventListener("click", () => { closeRowMenus(); openPlayLimitDialog(account); });
  const revoke = document.createElement("button");
  revoke.type = "button";
  revoke.textContent = "撤銷所有登入…";
  revoke.addEventListener("click", () => { closeRowMenus(); openRevokeDialog(account); });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "is-danger";
  remove.textContent = "刪除帳號…";
  remove.addEventListener("click", () => { closeRowMenus(); openDeleteDialog(account); });
  menu.append(limit, revoke, remove);
  return menu;
}

// ── 帳號操作 dialog ──
function fieldInput(labelText, options = {}) {
  const label = document.createElement("label");
  label.className = "field";
  const span = document.createElement("span");
  span.textContent = labelText;
  const input = document.createElement("input");
  Object.assign(input, options);
  label.append(span, input);
  return { label, input };
}

function dialogError() {
  const p = document.createElement("p");
  p.className = "field-error";
  p.setAttribute("role", "alert");
  p.hidden = true;
  return p;
}

function openResetPasswordDialog(account) {
  const self = account.id === state.me.id;
  openDialog((dialog) => {
    const title = document.createElement("h3");
    title.textContent = self ? "變更我的密碼" : `重設 ${account.username} 的密碼`;
    const note = document.createElement("p");
    note.textContent = self
      ? "變更後其他裝置會被登出，這台裝置維持登入。"
      : "重設後這個帳號的所有裝置都要用新密碼重新登入。";
    const { label, input } = fieldInput("新密碼（至少 6 個字元）", { type: "password", minLength: 6, maxLength: 72 });
    // 顯示／隱藏切換（替孩子設新密碼須可目視驗證，避免打錯字把孩子鎖在門外）。
    const passwordWrap = document.createElement("span");
    passwordWrap.className = "password-wrap";
    input.replaceWith(passwordWrap);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "password-toggle";
    toggle.textContent = "顯示";
    toggle.setAttribute("aria-pressed", "false");
    toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "隱藏" : "顯示";
      toggle.setAttribute("aria-pressed", String(show));
    });
    passwordWrap.append(input, toggle);
    const error = dialogError();
    const cancel = makeButton("取消", "btn-outlined", () => els.dialog.close());
    const submit = makeButton("重設密碼", "btn-filled", async () => {
      if (input.value.length < 6) {
        error.textContent = "密碼至少要 6 個字元";
        error.hidden = false;
        return;
      }
      try {
        await api(`/api/admin/accounts/${account.id}/reset-password`, { method: "POST", body: { newPassword: input.value } });
        els.dialog.close();
        snackbar(self ? "已變更密碼，其他裝置已登出" : `已重設 ${account.username} 的密碼`);
        loadAccounts();
      } catch (apiError) {
        if (apiError.status === 401) return showLogin();
        error.textContent = apiError.message;
        error.hidden = false;
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submit.click();
    });
    dialog.append(title, note, label, error, dialogActions(cancel, submit));
    input.focus();
  });
}

function openPlayLimitDialog(account) {
  const policy = account.playLimitPolicy || { locked: false };
  openDialog((dialog) => {
    const title = document.createElement("h3");
    title.textContent = `${account.username} 的遊玩時長`;
    const note = document.createElement("p");
    note.textContent = "鎖定後孩子端的時長設定會變成唯讀（由維護者管理），下一次自動存檔即套用；解除鎖定即恢復孩子自調。";
    const lockRow = document.createElement("label");
    lockRow.className = "card-row";
    lockRow.style.marginBottom = "12px";
    const lockText = document.createElement("span");
    lockText.textContent = "鎖定時長";
    const lockWrap = document.createElement("span");
    lockWrap.className = "switch";
    const lockInput = document.createElement("input");
    lockInput.type = "checkbox";
    lockInput.checked = Boolean(policy.locked);
    const lockTrack = document.createElement("span");
    lockTrack.className = "switch-track";
    lockWrap.append(lockInput, lockTrack);
    lockRow.append(lockText, lockWrap);
    bindSwitchVisual(lockInput);
    const play = fieldInput("每次遊玩（分鐘，1–120）", { type: "number", min: 1, max: 120, value: policy.playMinutes ?? 15 });
    const rest = fieldInput("每次休息（分鐘，1–120）", { type: "number", min: 1, max: 120, value: policy.restMinutes ?? 15 });
    const max = fieldInput("單回合上限（分鐘，1–120）", { type: "number", min: 1, max: 120, value: policy.playMaxMinutes ?? 20 });
    const error = dialogError();
    function syncMinuteFields() {
      [play.input, rest.input, max.input].forEach((input) => { input.disabled = !lockInput.checked; });
    }
    lockInput.addEventListener("change", syncMinuteFields);
    syncMinuteFields();
    [play.input, rest.input, max.input].forEach((minuteInput) => {
      minuteInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submit.click();
      });
    });
    const cancel = makeButton("取消", "btn-outlined", () => els.dialog.close());
    const submit = makeButton("套用", "btn-filled", async () => {
      const body = lockInput.checked
        ? {
            locked: true,
            playMinutes: Number(play.input.value),
            restMinutes: Number(rest.input.value),
            playMaxMinutes: Number(max.input.value)
          }
        : { locked: false };
      try {
        await api(`/api/admin/accounts/${account.id}/play-limit`, { method: "PUT", body });
        els.dialog.close();
        snackbar(body.locked ? `已鎖定 ${account.username} 的遊玩時長` : `已解除 ${account.username} 的時長鎖定`);
        loadAccounts();
      } catch (apiError) {
        if (apiError.status === 401) return showLogin();
        error.textContent = apiError.code === "invalid-play-limit"
          ? "分鐘值需為 1–120 的整數，且遊玩時長不可大於單回合上限"
          : apiError.message;
        error.hidden = false;
      }
    });
    dialog.append(title, note, lockRow, play.label, rest.label, max.label, error, dialogActions(cancel, submit));
  });
}

function openRevokeDialog(account) {
  openDialog((dialog) => {
    const title = document.createElement("h3");
    title.textContent = `撤銷 ${account.username} 的所有登入？`;
    const note = document.createElement("p");
    note.textContent = "這個帳號的所有裝置會立刻登出，之後要重新輸入密碼。";
    const cancel = makeButton("取消", "btn-outlined", () => els.dialog.close());
    const submit = makeButton("撤銷登入", "btn-filled", async () => {
      try {
        await api(`/api/admin/accounts/${account.id}/revoke-sessions`, { method: "POST" });
        els.dialog.close();
        snackbar(`已撤銷 ${account.username} 的所有登入`);
      } catch (apiError) {
        if (apiError.status === 401) return showLogin();
        els.dialog.close();
        snackbar(`撤銷失敗：${apiError.message}`, { sticky: true });
      }
    });
    dialog.append(title, note, dialogActions(cancel, submit));
  });
}

function openDeleteDialog(account) {
  openDialog((dialog) => {
    const title = document.createElement("h3");
    title.className = "is-danger";
    title.textContent = `刪除帳號 ${account.username}？`;
    const note = document.createElement("p");
    note.textContent = "帳號、存檔與登入狀態將一併刪除，此操作無法復原。";
    const cancel = makeButton("取消", "btn-outlined", () => els.dialog.close());
    const submit = makeButton("確認刪除", "btn-danger", async () => {
      try {
        await api(`/api/admin/accounts/${account.id}`, { method: "DELETE" });
        els.dialog.close();
        snackbar(`已刪除帳號 ${account.username}`);
        loadAccounts();
      } catch (apiError) {
        if (apiError.status === 401) return showLogin();
        els.dialog.close();
        snackbar(`刪除失敗：${apiError.message}`, { sticky: true });
      }
    });
    dialog.append(title, note, dialogActions(cancel, submit));
  });
}

// ── 設定分頁（整頁表單統一「儲存設定」；dirty guard） ──
async function loadSettings() {
  try {
    const settings = await api("/api/admin/settings");
    els.settingRegistrationOpen.checked = settings.registrationOpen;
    els.settingRegistrationOpen.dispatchEvent(new Event("change")); // 同步開關視覺 class（程式設值不觸發 change）
    els.settingPlayMinutes.value = settings.defaultPlayMinutes;
    els.settingRestMinutes.value = settings.defaultRestMinutes;
    els.settingPlayMaxMinutes.value = settings.defaultPlayMaxMinutes;
    state.settingsDirty = false;
    els.settingsError.hidden = true;
  } catch (error) {
    if (error.status === 401) return showLogin();
    snackbar(`設定載入失敗：${error.message}`, { sticky: true });
  }
}

async function handleSettingsSubmit(event) {
  event.preventDefault();
  els.settingsError.hidden = true;
  const body = {
    registrationOpen: els.settingRegistrationOpen.checked,
    defaultPlayMinutes: Number(els.settingPlayMinutes.value),
    defaultRestMinutes: Number(els.settingRestMinutes.value),
    defaultPlayMaxMinutes: Number(els.settingPlayMaxMinutes.value)
  };
  try {
    await api("/api/admin/settings", { method: "PUT", body });
    state.settingsDirty = false;
    snackbar("✓ 已儲存，設定即時生效");
  } catch (error) {
    if (error.status === 401) return showLogin();
    els.settingsError.textContent = error.code === "invalid-settings"
      ? "分鐘值需為 1–120 的整數，且遊玩時長不可大於單回合上限"
      : error.message;
    els.settingsError.hidden = false;
  }
}

// ── 啟動 ──
async function boot() {
  els.footerVersion.textContent = `Luminara v${versionHistory[0]?.version || "?"}`;
  els.loginForm.addEventListener("submit", handleLogin);
  els.loginPasswordToggle.addEventListener("click", () => {
    const show = els.loginPassword.type === "password";
    els.loginPassword.type = show ? "text" : "password";
    els.loginPasswordToggle.textContent = show ? "隱藏" : "顯示";
    els.loginPasswordToggle.setAttribute("aria-pressed", String(show));
  });
  els.logoutButton.addEventListener("click", handleLogout);
  els.tabAccounts.addEventListener("click", () => selectTab("accounts") );
  els.tabSettings.addEventListener("click", () => selectTab("settings"));
  els.tabAccounts.addEventListener("click", closeRowMenus);
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(".account-actions")) closeRowMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeRowMenus();
  });
  bindSwitchVisual(els.settingRegistrationOpen);
  els.settingsForm.addEventListener("input", () => { state.settingsDirty = true; });
  els.settingsForm.addEventListener("submit", handleSettingsSubmit);
  window.addEventListener("beforeunload", (event) => {
    if (!state.settingsDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  if (!state.token || !state.me) return showLogin();
  try {
    // 驗 session 仍有效（身分以登入時儲存之 {id, username} 為準，不自清單推斷）。
    await api("/api/admin/accounts");
    showApp();
  } catch (error) {
    if (error instanceof ApiError) return showLogin(); // 401/403：憑證失效，清除重登
    // 網路暫斷：保留憑證，提示重試（不逼重輸密碼）。
    showLogin({ clearSession: false });
    snackbar("無法連線到伺服器，請確認連線後重新整理", { sticky: true });
  }
}

// 分頁切換的 dirty guard：以捕捉階段攔下切走設定分頁。
[els.tabAccounts, els.logoutButton].forEach((el) => {
  el.addEventListener("click", (event) => {
    if (el === els.tabAccounts && !els.panelSettings.hidden && !guardDirty()) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, { capture: true });
});

boot();
