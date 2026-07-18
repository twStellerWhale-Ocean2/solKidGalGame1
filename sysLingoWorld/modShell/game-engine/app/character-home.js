// app/character-home.js — 選角色頁（登入後家門口；#390／techApp遊戲webApp ＜III.B＞ 兩表單 canon）。
// 帳號層只答一次（登入即保持登入），「你是誰」在本頁回答：頂＝帳號資訊＋登出、
// 中＝角色清單（點列進入遊戲）、底＝新增角色；⟳ 自遊戲返回本頁（單一切換路徑）。
// 家門口不可回退：無 backdrop 關閉、無 Back——離開途徑只有「選角色進遊戲」或「Log out」。
import { normalizeBackgroundPattern, playableCharacterById } from "../data/game-data.js";
import { princessName, profileColorFor, render, renderBustInto } from "../render/hud.js";
import { changeView, closeSystemMenu } from "./views.js";
import { tickPlayClock } from "../state/play-session.js";
import { accountPlayStatusText, deleteCharacter, listAccountCharacters, rosterAtCap, startAddCharacter, switchToCharacter } from "./select-screens.js";
import { cloud, cloudActive, cloudLogout } from "../system/cloud-sync.js";
import { clearCachedSession } from "../state/cloud-session.js";
import { hashCharacterPin } from "../state/game-state.js";
import { openLoginScreen } from "./login-screen.js";
import { elements, session } from "../core/session.js";

// #391：待驗證角色（點到有密碼的角色列時展開就地驗證面板）；開頁時重置。
let pendingPinSaveId = "";
// #392：展開中的資訊/刪除面板；三面板互斥、開頁時重置。
let pendingInfoSaveId = "";
let pendingDeleteSaveId = "";

function resetPanels() {
  pendingPinSaveId = "";
  pendingInfoSaveId = "";
  pendingDeleteSaveId = "";
}

export function openCharacterHome() {
  closeSystemMenu();
  resetPanels();
  buildCharacterHome();
  elements.characterHome.classList.add("show");
  elements.characterHome.setAttribute("aria-hidden", "false");
  document.body.classList.add("character-home-open");
  setTimeout(() => elements.characterHomeCard?.focus({ preventScroll: true }), 0);
}

export function closeCharacterHome() {
  elements.characterHome.classList.remove("show");
  elements.characterHome.setAttribute("aria-hidden", "true");
  document.body.classList.remove("character-home-open");
}

export function buildCharacterHome() {
  const characters = listAccountCharacters();
  if (elements.characterHomeAccountLine) {
    // 帳號行＝帳號層唯一露出處（名稱＋角色數＋帳號時鐘狀態——休息鎖 account-scoped，於此讓家長看懂）。
    const account = cloudActive() ? cloud.username : "";
    const countText = `${characters.length} ${characters.length === 1 ? "princess" : "princesses"}`;
    const status = accountPlayStatusText(session.state);
    elements.characterHomeAccountLine.textContent = account ? `Account ${account} · ${countText} · ${status}` : `${countText} · ${status}`;
  }
  if (elements.characterHomeLogout) elements.characterHomeLogout.hidden = !cloudActive();
  const list = elements.characterHomeList;
  list.innerHTML = "";
  characters.forEach((entry) => {
    const character = playableCharacterById(entry.characterId);
    const row = document.createElement("div");
    row.className = `account-row${entry.active ? " active" : ""}`;
    row.setAttribute("role", "listitem");
    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "account-pick";
    pick.dataset.saveId = entry.saveId;
    const color = profileColorFor(entry.characterId, entry.profileColor);
    pick.style.setProperty("--profile-color", color);
    const avatar = document.createElement("span");
    avatar.className = "account-avatar bust-frame";
    renderBustInto(avatar, entry.characterId, entry.outfit, color, normalizeBackgroundPattern(entry.backgroundPattern));
    const nameEl = document.createElement("strong");
    nameEl.textContent = entry.playerName || character?.defaultName || "Princess";
    const charEl = document.createElement("small");
    charEl.textContent = character?.label || "Princess";
    const metaEl = document.createElement("small");
    metaEl.className = "account-meta-line";
    metaEl.textContent = `${Math.max(0, Number(entry.coins) || 0)} coins`;
    const text = document.createElement("span");
    text.className = "account-text";
    text.append(nameEl, charEl, metaEl);
    const statusEl = document.createElement("span");
    statusEl.className = "account-status";
    statusEl.textContent = "Play";
    pick.append(avatar, text, statusEl);
    pick.addEventListener("click", () => enterAsCharacter(entry.saveId));
    row.append(pick);
    // #392：檢視資訊（每列）＋刪除（roster >1 才顯示＝守最後一員）。
    const displayName = entry.playerName || character?.defaultName || "Princess";
    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "account-info";
    infoBtn.dataset.saveId = entry.saveId;
    infoBtn.setAttribute("aria-label", `About ${displayName}`);
    infoBtn.textContent = "ⓘ";
    infoBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = pendingInfoSaveId === entry.saveId;
      resetPanels();
      pendingInfoSaveId = open ? "" : entry.saveId;
      buildCharacterHome();
    });
    row.append(infoBtn);
    if (characters.length > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "account-delete";
      removeBtn.dataset.saveId = entry.saveId;
      removeBtn.setAttribute("aria-label", `Delete ${displayName}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = pendingDeleteSaveId === entry.saveId;
        resetPanels();
        pendingDeleteSaveId = open ? "" : entry.saveId;
        buildCharacterHome();
      });
      row.append(removeBtn);
    }
    // #391/#392：三就地面板互斥——pin 驗證／資訊／刪除確認。
    if (entry.pinHash && entry.saveId === pendingPinSaveId) row.append(buildPinPanel(entry));
    if (entry.saveId === pendingInfoSaveId) row.append(buildInfoPanel(entry, displayName, character));
    if (entry.saveId === pendingDeleteSaveId) row.append(buildDeletePanel(entry, displayName));
    list.appendChild(row);
  });
  if (elements.characterHomeAdd) elements.characterHomeAdd.disabled = rosterAtCap();
}

// #392：檢視資訊面板（唯讀）。
function buildInfoPanel(entry, displayName, character) {
  const panel = document.createElement("div");
  panel.className = "login-expand character-info-panel";
  const stats = entry.stats || {};
  const lines = [
    ["Name", displayName],
    ["Princess", character?.label || "Princess"],
    ["Coins", String(Math.max(0, Number(entry.coins) || 0))],
    ["Wardrobe items", String(stats.wardrobe || 0)],
    ["Words learned", String(stats.words || 0)],
    ["Diary pages", String(stats.diary || 0)],
    ["Badges", String(stats.badges || 0)],
    ["Password", entry.pinHash ? "Set" : "Not set"]
  ];
  const dl = document.createElement("dl");
  dl.className = "character-info-list";
  lines.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    dl.append(dt, dd);
  });
  panel.append(dl);
  return panel;
}

// #392：刪除確認面板——有 pin 須驗證；無 pin 兩段防呆（點 × 第一段、Yes 第二段）。
function buildDeletePanel(entry, displayName) {
  const panel = document.createElement("div");
  panel.className = "login-expand character-delete-panel";
  const warn = document.createElement("p");
  warn.className = "character-delete-warning";
  warn.textContent = `Delete ${displayName}? Her coins, diary and dress-up will be gone. Progress of other princesses stays.`;
  panel.append(warn);
  const error = document.createElement("p");
  error.className = "login-error";
  error.setAttribute("role", "alert");
  let pinInput = null;
  if (entry.pinHash) {
    pinInput = document.createElement("input");
    pinInput.type = "password";
    pinInput.maxLength = 12;
    pinInput.autocomplete = "off";
    pinInput.placeholder = "Secret password";
    pinInput.className = "login-input";
    panel.append(pinInput);
  }
  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "danger-button character-delete-confirm";
  confirmBtn.textContent = entry.pinHash ? "Delete" : "Yes, delete";
  confirmBtn.addEventListener("click", () => {
    if (entry.pinHash && hashCharacterPin(pinInput?.value || "") !== entry.pinHash) {
      error.textContent = "⚠ Wrong password. Ask a grown-up if you forgot.";
      if (pinInput) { pinInput.value = ""; pinInput.focus({ preventScroll: true }); }
      return;
    }
    resetPanels();
    deleteCharacter(entry.saveId);
    openCharacterHome(); // 刪後留頁（rebuild 清單與帳號行）
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "soft-button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    resetPanels();
    buildCharacterHome();
  });
  panel.append(error, confirmBtn, cancelBtn);
  return panel;
}

// #391：角色密碼就地驗證面板——密碼欄＋Enter＋錯誤行。
function buildPinPanel(entry) {
  const panel = document.createElement("div");
  panel.className = "login-expand character-pin-panel";
  const input = document.createElement("input");
  input.type = "password";
  input.maxLength = 12;
  input.autocomplete = "off";
  input.placeholder = "Secret password";
  input.className = "login-input";
  const error = document.createElement("p");
  error.className = "login-error";
  error.setAttribute("role", "alert");
  const enter = document.createElement("button");
  enter.type = "button";
  enter.className = "primary-button";
  enter.textContent = "Enter";
  const submit = () => {
    if (hashCharacterPin(input.value) !== entry.pinHash) {
      error.textContent = "⚠ Wrong password. Ask a grown-up if you forgot.";
      input.value = "";
      input.focus({ preventScroll: true });
      return;
    }
    pendingPinSaveId = "";
    proceedEnter(entry.saveId);
  };
  enter.addEventListener("click", submit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submit();
  });
  panel.append(input, error, enter);
  setTimeout(() => input.focus({ preventScroll: true }), 0);
  return panel;
}

// 點角色列＝進入遊戲：無密碼直接進；有密碼（#391）展開驗證面板（再點列收合）。
function enterAsCharacter(saveId) {
  const target = listAccountCharacters().find((entry) => entry.saveId === saveId);
  if (!target) return;
  if (target.pinHash) {
    const open = pendingPinSaveId === saveId;
    resetPanels(); // #392：三面板互斥
    pendingPinSaveId = open ? "" : saveId;
    buildCharacterHome();
    return;
  }
  resetPanels();
  proceedEnter(saveId);
}

// 進入遊戲：active 直接進；非 active 先非破壞切換（#378，帳號時鐘不重置）再進。
function proceedEnter(saveId) {
  const target = listAccountCharacters().find((entry) => entry.saveId === saveId);
  if (!target) return;
  if (!target.active) switchToCharacter(saveId);
  closeCharacterHome();
  render();
  changeView("home");
  elements.statusMessage.textContent = `${princessName()} is ready. Choose a place to start.`;
  tickPlayClock();
}

// 底部「Add princess」：關本頁開選角外觀表單（confirm 以新角色直接進遊戲；cancel 返回本頁）。
export function addCharacterFromHome() {
  if (rosterAtCap()) return;
  closeCharacterHome();
  startAddCharacter();
}

// 頂部「Log out」＝帳號層唯一登出處：撤銷 session＋清本機快取，回登入表單。
export async function logoutFromHome() {
  await cloudLogout().catch(() => {});
  clearCachedSession();
  closeCharacterHome();
  openLoginScreen({ mustChoose: true });
}
