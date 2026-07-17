// app/select-screens.js — 帳號選擇與選角命名畫面（issue #298 自 main.js 拆出，行為零變更）。
import {
  backgroundPatternIds,
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  normalizeBackgroundPattern,
  playableCharacterById,
  profileColorPalette
} from "../data/game-data.js";
import {
  applyCardPattern,
  princessName,
  profileColorFor,
  render,
  renderBustInto,
  syncActiveAccountMeta
} from "../render/hud.js";
import { changeView, closeSystemMenu } from "./views.js";
import { clockNow, formatClock, hidePlayBreak, tickPlayClock } from "../state/play-session.js";
import {
  createFreshAccount,
  freshState,
  loadAccountState,
  sanitizePlayerName
} from "../state/game-state.js";
import { deleteAccount, getActiveAccountId, listAccounts, setActiveAccountId } from "../state/accounts.js";
import { itemById } from "../core/lookups.js";
import { CLOUD_MODE } from "./env.js";
import { flushCloudSave } from "../system/cloud-sync.js";
import { openLoginScreen } from "./login-screen.js";
import { persist } from "../system/persistence.js";
import { playStatus } from "../system/play-clock.js";
import { elements, session } from "../core/session.js";
export function returnToInitialSelect() {
  syncActiveAccountMeta({ touched: true });
  persist();
  hidePlayBreak();
  closeSystemMenu();
  // issue #309：雲端模式返回登入／帳號選擇畫面（返回前已保存並同步雲端；不重置進度、不解除休息鎖）。
  if (CLOUD_MODE) {
    void flushCloudSave();
    openLoginScreen({ mustChoose: true });
    return;
  }
  openAccountSelect({ mustChoose: false });
}

// 更新 HUD 的遊玩時間預算顯示，不套用狀態轉換；供 render() 呼叫。
export function openCharacterSelect({ forced = false, cancelable = false } = {}) {
  // issue #134 後續：選角為全幅覆蓋層，開啟前先關閉系統選單（含設定頁），避免設定選單殘留於背景。
  closeSystemMenu();
  session.pendingCharacterId = session.state.activeCharacterId;
  session.pendingProfileColor = profileColorFor(session.state.activeCharacterId, session.state.profileColor);
  session.pendingBackgroundPattern = normalizeBackgroundPattern(session.state.backgroundPattern);
  session.profileColorEdited = profileColorFor(session.state.activeCharacterId, session.state.profileColor) !== defaultProfileColorFor(session.state.activeCharacterId);
  // 既有的自訂名字（與目前角色預設名不同）視為玩家已輸入，切換外觀時不覆蓋。
  const activeDefaultName = playableCharacterById(session.state.activeCharacterId)?.defaultName;
  session.playerNameEdited = Boolean(session.state.playerName) && session.state.playerName !== activeDefaultName;
  buildCharacterCards();
  buildProfileColorChoices();
  buildBackgroundPatternChoices();
  elements.playerNameInput.value = session.state.playerName || playableCharacterById(session.pendingCharacterId)?.defaultName || "";
  // issue #153：真正首啟（forced 且不可取消）才鎖定不可取消；既有帳號下新增（cancelable）顯示返回鈕、可取消返回帳號選擇。
  elements.characterSelect.classList.toggle("first-run", forced && !cancelable);
  elements.characterSelect.classList.add("show");
  elements.characterSelect.setAttribute("aria-hidden", "false");
  document.body.classList.add("character-select-open");
  setTimeout(() => elements.characterSelectCard?.focus({ preventScroll: true }), 0);
}

export function closeCharacterSelect() {
  elements.characterSelect.classList.remove("show");
  elements.characterSelect.setAttribute("aria-hidden", "true");
  document.body.classList.remove("character-select-open");
}

export function buildCharacterCards() {
  elements.characterGrid.innerHTML = "";
  Object.values(characterRegistry).forEach((character) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    card.dataset.characterId = character.id;
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", String(character.id === session.pendingCharacterId));
    const portrait = document.createElement("span");
    portrait.className = "character-portrait";
    // 單一頭胸來源：選角卡與側欄／帳號卡 bust 一律以公主身上「即時穿搭」（session.state.outfit）渲染，
    // 不再另引用 defaultOutfit——杜絕第二套外觀來源，換髮型／衣物時所有頭胸照同步反映、永不分歧。
    renderBustInto(portrait, character.id, session.state.outfit, character.id === session.pendingCharacterId ? session.pendingProfileColor : character.defaultProfileColor, character.id === session.pendingCharacterId ? session.pendingBackgroundPattern : "none");
    portrait.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = character.label;
    card.append(portrait, label);
    card.addEventListener("click", () => selectPendingCharacter(character.id));
    elements.characterGrid.appendChild(card);
  });
}

export function selectPendingCharacter(characterId) {
  if (!characterRegistry[characterId]) return;
  session.pendingCharacterId = characterId;
  if (!session.profileColorEdited) session.pendingProfileColor = defaultProfileColorFor(characterId);
  [...elements.characterGrid.querySelectorAll(".character-card")].forEach((card) => {
    card.setAttribute("aria-checked", String(card.dataset.characterId === characterId));
    const portrait = card.querySelector(".character-portrait");
    const color = card.dataset.characterId === characterId ? session.pendingProfileColor : defaultProfileColorFor(card.dataset.characterId);
    // 切換選取只需更新識別底色與花紋；基本造型 bust 層不隨色變，毋須重渲染。
    portrait?.style.setProperty("--active-profile-color", color);
    portrait?.style.setProperty("--profile-color", color);
    applyCardPattern(portrait, card.dataset.characterId === characterId ? session.pendingBackgroundPattern : "none");
  });
  buildProfileColorChoices();
  buildBackgroundPatternChoices(); // #340：切換公主（未自訂色時重設預設色）花紋列同步換色
  if (!session.playerNameEdited) {
    elements.playerNameInput.value = playableCharacterById(characterId)?.defaultName || "";
  }
}

export function buildProfileColorChoices() {
  if (!elements.profileColorGrid) return;
  elements.profileColorGrid.innerHTML = "";
  profileColorPalette.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "profile-color-swatch";
    button.style.setProperty("--profile-color", color);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", `Use profile color ${color}`);
    button.setAttribute("aria-checked", String(color === session.pendingProfileColor));
    button.addEventListener("click", () => {
      session.pendingProfileColor = color;
      session.profileColorEdited = true;
      buildProfileColorChoices();
      buildBackgroundPatternChoices(); // #340：花紋 swatch 取建構時色值，變色必須連動重繪
      buildCharacterCards();
    });
    elements.profileColorGrid.appendChild(button);
  });
  // issue #131：調色器自訂色入口（spec#6）。色盤外的任一色由此設定，並標記為作用中。
  if (elements.profileColorPicker) {
    const customActive = !profileColorPalette.includes(session.pendingProfileColor);
    elements.profileColorPicker.value = /^#[0-9a-fA-F]{6}$/.test(session.pendingProfileColor) ? session.pendingProfileColor : defaultProfileColorFor(session.pendingCharacterId);
    elements.profileColorPicker.closest(".profile-color-custom")?.classList.toggle("is-active", customActive);
    elements.profileColorPicker.oninput = (event) => {
      session.pendingProfileColor = event.target.value;
      session.profileColorEdited = true;
      buildProfileColorChoices();
      buildBackgroundPatternChoices(); // #340：自訂色同規連動
      buildCharacterCards();
    };
  }
}

// issue #131：背景花紋選擇器（spec#6）。每個花紋一個預覽 swatch；選定即更新 session.pendingBackgroundPattern 並反映於選角卡。
export function buildBackgroundPatternChoices() {
  if (!elements.backgroundPatternGrid) return;
  elements.backgroundPatternGrid.innerHTML = "";
  backgroundPatternIds.forEach((pattern) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "background-pattern-swatch";
    if (pattern !== "none") button.dataset.pattern = pattern;
    button.style.setProperty("--active-profile-color", session.pendingProfileColor);
    button.style.setProperty("--profile-color", session.pendingProfileColor);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", pattern === "none" ? "No pattern" : `Use background pattern ${pattern}`);
    button.setAttribute("aria-checked", String(pattern === session.pendingBackgroundPattern));
    if (pattern === "none") button.textContent = "—";
    button.addEventListener("click", () => {
      session.pendingBackgroundPattern = pattern;
      buildBackgroundPatternChoices();
      buildCharacterCards();
    });
    elements.backgroundPatternGrid.appendChild(button);
  });
}

export function isStarterWardrobeItem(itemId, type) {
  const item = itemById(itemId);
  return item?.storeId === "starter" && (!type || item.type === type);
}

export function applyCharacterStarterOutfit(character) {
  const starterOutfit = character?.defaultOutfit || {};
  if (isStarterWardrobeItem(session.state.outfit.hairstyle, "hairstyle") && starterOutfit.hairstyle) {
    session.state.outfit.hairstyle = starterOutfit.hairstyle;
  }
  if (isStarterWardrobeItem(session.state.outfit.outfit, "outfit") && starterOutfit.outfit) {
    session.state.outfit.outfit = starterOutfit.outfit;
  }
}

export function confirmCharacterSelect() {
  const character = playableCharacterById(session.pendingCharacterId);
  session.state.activeCharacterId = character.id;
  applyCharacterStarterOutfit(character);
  session.state.profileColor = profileColorFor(character.id, session.pendingProfileColor);
  session.state.backgroundPattern = normalizeBackgroundPattern(session.pendingBackgroundPattern);
  session.state.playerName = sanitizePlayerName(elements.playerNameInput.value) || character.defaultName;
  persist();
  const activeAccountId = getActiveAccountId();
  if (activeAccountId) syncActiveAccountMeta({ touched: true });
  session.pendingNewAccount = null; // issue #153：已確認創角，此新帳號不再是可丟棄的待定帳號。
  closeCharacterSelect();
  render();
  elements.statusMessage.textContent = `${princessName()} is ready. Choose a place to start.`;
}

// issue #153：取消創角。若為「既有帳號下新增」之未確認新帳號，丟棄該空帳號並返回帳號選擇（還原先前使用中帳號）；
// 一般換角（changeCharacter）或無待定新帳號時，僅關閉覆蓋層。
export function cancelCharacterSelect() {
  if (session.pendingNewAccount) {
    const { id, prevActiveId, prevMustChoose } = session.pendingNewAccount;
    session.pendingNewAccount = null;
    deleteAccount(id); // 丟棄此新建空帳號（刪到使用中帳號會清空 activeId）。
    const restoreId = prevActiveId && listAccounts().some((account) => account.id === prevActiveId) ? prevActiveId : null;
    if (restoreId) {
      setActiveAccountId(restoreId);
      session.state = loadAccountState(restoreId);
    } else {
      session.state = freshState();
    }
    closeCharacterSelect();
    render();
    openAccountSelect({ mustChoose: prevMustChoose || !restoreId });
    return;
  }
  closeCharacterSelect();
}

// ---- 本機多帳號（issue #63）：每次進入先選玩家帳號，可新增與刪除，各帳號進度互不混用 ----
// mustChoose=true：啟動 gate，必須選擇或新增帳號才能進入（不可關閉、不顯示 Back）。
export function openAccountSelect({ mustChoose = false } = {}) {
  session.accountSelectMustChoose = mustChoose;
  buildAccountList();
  elements.accountSelect.classList.add("show");
  elements.accountSelect.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-select-open");
  startAccountStatusTicker();
  setTimeout(() => elements.accountSelectCard?.focus({ preventScroll: true }), 0);
}

export function closeAccountSelect() {
  // 啟動 gate 或尚無使用中帳號時不可關閉（必須先選或新增帳號）。
  if (session.accountSelectMustChoose || !getActiveAccountId()) return;
  stopAccountStatusTicker();
  elements.accountSelect.classList.remove("show");
  elements.accountSelect.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-select-open");
}

// issue #169：依現在時鐘重算各帳號卡狀態文字（休息倒數／Ready／Play），供開啟期間每秒刷新。
export function refreshAccountStatuses() {
  if (!elements.accountList) return;
  elements.accountList.querySelectorAll(".account-row").forEach((row) => {
    const accountId = row.querySelector(".account-pick")?.dataset.accountId;
    const statusEl = row.querySelector(".account-status");
    if (!accountId || !statusEl) return;
    statusEl.textContent = accountPlayStatusText(loadAccountState(accountId));
  });
}

export function startAccountStatusTicker() {
  if (session.accountStatusTimer) return;
  session.accountStatusTimer = window.setInterval(refreshAccountStatuses, 1000);
}

export function stopAccountStatusTicker() {
  if (!session.accountStatusTimer) return;
  window.clearInterval(session.accountStatusTimer);
  session.accountStatusTimer = null;
}

export function formatLastPlayed(timestamp) {
  if (!timestamp) return "Not played yet";
  const date = new Date(timestamp);
  return `Last played ${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function accountPlayStatusText(accountState) {
  const status = playStatus(accountState, clockNow());
  if (status.phase === "rest" && !status.restDone) return `Rest ${formatClock(status.restRemainingMs)}`;
  if (status.phase === "rest" && status.restDone) return "Ready";
  if (status.phase === "play") return `Play ${formatClock(status.playRemainingMs)}`;
  return "Ready";
}

export function accountSummary(account) {
  const accountState = loadAccountState(account.id);
  return {
    state: accountState,
    name: accountState.playerName || account.name || playableCharacterById(accountState.activeCharacterId)?.defaultName || "Princess",
    characterId: accountState.activeCharacterId || account.characterId || defaultActiveCharacterId,
    characterLabel: playableCharacterById(accountState.activeCharacterId || account.characterId)?.label || "Princess",
    color: profileColorFor(accountState.activeCharacterId, accountState.profileColor || account.profileColor),
    backgroundPattern: normalizeBackgroundPattern(accountState.backgroundPattern),
    coins: Math.max(0, Number(accountState.coins) || 0),
    lastPlayedAt: account.lastPlayedAt || account.createdAt || 0,
    playStatus: accountPlayStatusText(accountState)
  };
}

export function buildAccountList() {
  const accounts = listAccounts();
  const activeId = getActiveAccountId();
  elements.accountList.innerHTML = "";
  if (elements.accountEmpty) elements.accountEmpty.hidden = accounts.length > 0;
  if (elements.accountBack) elements.accountBack.hidden = session.accountSelectMustChoose || !activeId;
  accounts.forEach((account) => {
    const summary = accountSummary(account);
    const row = document.createElement("div");
    row.className = `account-row${account.id === activeId ? " active" : ""}`;
    row.setAttribute("role", "listitem");
    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "account-pick";
    pick.dataset.accountId = account.id;
    pick.style.setProperty("--profile-color", summary.color);
    const avatar = document.createElement("span");
    avatar.className = "account-avatar bust-frame";
    renderBustInto(avatar, summary.characterId, summary.state.outfit, summary.color, summary.backgroundPattern);
    const nameEl = document.createElement("strong");
    nameEl.textContent = summary.name;
    const charEl = document.createElement("small");
    charEl.textContent = summary.characterLabel;
    const metaEl = document.createElement("small");
    metaEl.className = "account-meta-line";
    metaEl.textContent = `${summary.coins} coins · ${formatLastPlayed(summary.lastPlayedAt)}`;
    const statusEl = document.createElement("span");
    statusEl.className = "account-status";
    statusEl.textContent = summary.playStatus;
    const text = document.createElement("span");
    text.className = "account-text";
    text.append(nameEl, charEl, metaEl);
    pick.append(avatar, text, statusEl);
    pick.addEventListener("click", () => selectAccount(account.id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "account-delete";
    remove.dataset.accountId = account.id;
    remove.setAttribute("aria-label", `Delete ${summary.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      handleDeleteAccount(account.id, summary.name);
    });
    row.append(pick, remove);
    elements.accountList.appendChild(row);
  });
}

export function selectAccount(accountId) {
  setActiveAccountId(accountId);
  session.state = loadAccountState(accountId);
  syncActiveAccountMeta({ touched: true });
  persist();
  session.accountSelectMustChoose = false; // 已完成本次進入的帳號選擇
  closeAccountSelect();
  render();
  changeView("home");
  if (!session.state.playerName) {
    openCharacterSelect({ forced: true });
    return;
  }
  elements.statusMessage.textContent = `Welcome back, ${princessName()}. Choose a place to start.`;
  tickPlayClock();
}

export function createNewAccount() {
  // issue #153：先前已有其他帳號時，本次新增之創角可取消返回帳號選擇；真正首啟（先前毫無帳號）則維持不可取消。
  const hadAccounts = listAccounts().length > 0;
  const prevActiveId = getActiveAccountId();
  const prevMustChoose = session.accountSelectMustChoose;
  const account = createFreshAccount();
  session.state = loadAccountState(account.id);
  syncActiveAccountMeta({ touched: true });
  session.accountSelectMustChoose = false;
  closeAccountSelect();
  render();
  changeView("home");
  session.pendingNewAccount = hadAccounts ? { id: account.id, prevActiveId, prevMustChoose } : null;
  openCharacterSelect({ forced: true, cancelable: hadAccounts });
}

export function handleDeleteAccount(accountId, label) {
  if (!window.confirm(`Delete player "${label}"? This removes that player's progress on this device.`)) return;
  const wasActive = getActiveAccountId() === accountId;
  deleteAccount(accountId);
  if (wasActive) session.state = freshState(); // 刪到使用中帳號：清掉當前狀態，交回帳號選擇。
  buildAccountList();
}

