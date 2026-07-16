// render/hud.js — 主渲染與 HUD：狀態列、人物資訊、日記／收藏／設定、識別色主題（issue #298 自 main.js 拆出，行為零變更）。
import {
  addDiary as addStateDiary,
  addUnique as addStateUnique,
  applyEffects as applyStateEffects,
  awardBadge as awardStateBadge,
  updateProgressBadges as updateStateProgressBadges
} from "../state/game-state.js";
import {
  areaRegistry,
  normalizeBackgroundPattern,
  normalizeProfileColor,
  playableCharacterById
} from "../data/game-data.js";
import { buildInfo, copyright, versionHistory } from "../build/version.js";
import { bustMarkupFor, paperDollRenderer, renderPaperDolls } from "../wardrobe/doll.js";
import { getActiveAccountId, updateAccountMeta } from "../state/accounts.js";
import { openArea, renderCastleMap, renderMap } from "../map/map-runtime.js";
import { renderWorldMap } from "../map/world-map.js";
import { renderAbout, renderBuildInfo } from "./settings.js";
import { renderPlayClock } from "../state/play-session.js";
import { effectivePlayLimit } from "../system/play-clock.js";
import { elements, session } from "../core/session.js";
import { cloud, cloudActive, syncRecentSummary } from "../system/cloud-sync.js";

function cloudUsername() { return cloud.username || ""; }
export function profileColorFor(characterId = session.state.activeCharacterId, color = session.state.profileColor) {
  return normalizeProfileColor(color, characterId);
}

// 單一頭胸 bust 渲染（issue #132，sysCase#5.2）：側欄、帳號卡與選角卡共用「同一個」頭胸渲染——
// 同一紙娃娃層合成（bustMarkupFor）＋同一 .bust-doll 裁切，不另維護第二套裁切邏輯。
export function renderBustInto(frameEl, characterId, outfitState, color, pattern = "none") {
  if (!frameEl) return;
  frameEl.innerHTML = `<span class="paper-doll bust-doll">${bustMarkupFor(characterId, outfitState)}</span>`;
  // issue #194：bust 改採與全身著裝相同之 layer 幾何後，帶 warp 的 wardrobe layer 須補套投影 matrix3d
  // （側欄 side-bust 由 renderPaperDolls 處理；此處 innerHTML 注入之帳號卡／選角卡 bust 另行套用）。
  paperDollRenderer.applyLayerTransforms(frameEl);
  if (color != null) {
    frameEl.style.setProperty("--active-profile-color", color);
    frameEl.style.setProperty("--profile-color", color);
  }
  // issue #131：背景花紋（spec#6）以 data-pattern 套用於識別卡半透明背版（CSS 圖樣，疊於識別色底色之上、bust 之下）。
  applyCardPattern(frameEl, pattern);
}

// 將背景花紋套用至卡片框（"none" 或未知則移除花紋）。
export function applyCardPattern(frameEl, pattern) {
  if (!frameEl) return;
  const normalized = normalizeBackgroundPattern(pattern);
  if (normalized === "none") frameEl.removeAttribute("data-pattern");
  else frameEl.dataset.pattern = normalized;
}

// 組裝「可玩時間額度」顯示（spec#9 / sysCase#7.5）：基礎分鐘數；生活聊天延長時把增加量以 +N😄 清楚標示。
export function updateProfileColorChrome() {
  const color = profileColorFor();
  document.documentElement.style.setProperty("--active-profile-color", color);
  // 資訊欄大頭照已改為即時穿搭紙娃娃 bust（由 renderPaperDolls 填層）；此處僅同步識別色與背景花紋。
  elements.sideProfileAvatar?.style.setProperty("--profile-color", color);
  applyCardPattern(elements.sideProfileFrame, session.state.backgroundPattern);
  // issue #161：地圖公主 token 已移除識別色橢圓背板，不再於地圖 token 注入 --profile-color（識別色僅用於資訊欄與帳號卡）。
}

export function syncActiveAccountMeta({ touched = false } = {}) {
  // issue #309：雲端模式下帳號摘要改寫入「最近帳號卡快取」（登入畫面離線可渲染），不再動本機帳號索引。
  if (cloudActive()) {
    if (touched) syncRecentSummary();
    return;
  }
  const activeAccountId = getActiveAccountId();
  if (!activeAccountId) return;
  updateAccountMeta(activeAccountId, {
    name: session.state.playerName,
    characterId: session.state.activeCharacterId,
    profileColor: profileColorFor(),
    lastPlayedAt: touched ? Date.now() : undefined
  });
}

export function applyEffects(effects = {}) {
  applyStateEffects(session.state, effects);
}

export function addDiary(entry) {
  addStateDiary(session.state, entry);
}

export function addUnique(listName, values) {
  addStateUnique(session.state, listName, values);
}

export function awardBadge(id) {
  awardStateBadge(session.state, id);
}

export function updateProgressBadges() {
  updateStateProgressBadges(session.state);
}

export function setExpressions(princess = "normal", npc = "normal") {
  session.princessExpression = princess;
  session.npcExpression = npc;
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.dataset.expression = session.princessExpression;
  });
  // issue#150：移除 NPC 角落心情表情徽章後，npc 表情不再寫入 DOM（保留參數與狀態以維持答題回饋 API 對稱）。
}

export function render() {
  renderStatus();
  renderIdentity();
  updateProfileColorChrome();
  renderAreaNav();
  renderPaperDolls();
  renderHome();
  renderCastleMap();
  renderWorldMap();
  renderMap();
  renderDiary();
  renderSettings();
  renderPlayClock();
}

export function renderStatus() {
  elements.coinValue.textContent = session.state.coins;
  // issue #286 spec#20：對話場景畫面內即時顯示金錢，與側欄同一資料來源（session.state.coins）。
  if (elements.advCoinValue) elements.advCoinValue.textContent = `🪙 ${session.state.coins}`;
}

// 玩家公主的名字為使用者設定；遊戲內稱呼一律取此值（世界觀／品牌名 Luminara 不在此列）。
export function princessName() {
  return session.state.playerName || playableCharacterById(session.state.activeCharacterId)?.defaultName || "Lumi";
}

// 課程題目原文以 "Lumi" 撰寫；顯示前統一替換為玩家名字。
// prompt／answer／choices／words 一致替換，確保 answerLesson 的 choice === answer 比對仍成立。
export function withPlayerName(text) {
  return typeof text === "string" ? text.replaceAll("Lumi", princessName()) : text;
}

// issue #149：題庫不再逐題手寫 words；缺 words 時由正解英文句導出（小寫、去標點、拆詞），供 learnedWords／日誌記錄。
export function deriveWordsFromAnswer(answer) {
  if (typeof answer !== "string") return [];
  return answer.toLowerCase().replace(/[^a-z'\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function localizeLesson(lesson) {
  if (!lesson) return lesson;
  return {
    ...lesson,
    prompt: withPlayerName(lesson.prompt),
    promptZh: withPlayerName(lesson.promptZh),
    answer: withPlayerName(lesson.answer),
    choices: Array.isArray(lesson.choices) ? lesson.choices.map(withPlayerName) : lesson.choices,
    choicesZh: Array.isArray(lesson.choicesZh) ? lesson.choicesZh.map(withPlayerName) : lesson.choicesZh,
    words: Array.isArray(lesson.words) && lesson.words.length
      ? lesson.words.map(withPlayerName)
      : deriveWordsFromAnswer(withPlayerName(lesson.answer))
  };
}

export function renderIdentity() {
  const name = princessName();
  // 資訊欄顯示玩家名字（去除「Princess」綴字，issue #132）；保留 sr-only h1 供文件結構與輔助科技。
  if (elements.princessNameTitle) elements.princessNameTitle.textContent = name;
  if (elements.playerNameValue) elements.playerNameValue.textContent = name;
  const sideDollLabel = `Princess ${name}`;
  document.querySelector(".adv-princess")?.setAttribute("aria-label", sideDollLabel);
  elements.castlePlayerToken?.setAttribute("aria-label", `Princess ${name} in the castle`);
  elements.playerToken?.setAttribute("aria-label", `Princess ${name}`);
  elements.worldPlayerToken?.setAttribute("aria-label", `Princess ${name}`);
  const diaryTitle = `${name} Diary`;
  const systemMenuTitleEl = document.getElementById("systemMenuTitle");
  if (systemMenuTitleEl) systemMenuTitleEl.textContent = diaryTitle;
  elements.systemMenuButton?.setAttribute("aria-label", `Open ${diaryTitle} and Settings`);
  elements.systemMenuClose?.setAttribute("aria-label", `Close ${diaryTitle}`);
}

export function renderHome() {
  renderCastleMap();
}

export function renderAreaNav() {
  if (!elements.areaNav) return;
  elements.areaNav.innerHTML = "";
  Object.values(areaRegistry).filter((area) => area.enabled).forEach((area) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `area-button${session.state.area === area.id ? " active" : ""}`;
    button.setAttribute("aria-current", session.state.area === area.id ? "page" : "false");
    button.innerHTML = `
      <span class="area-avatar" aria-hidden="true">
        <span class="paper-doll area-doll" data-doll="area-${area.id}"></span>
      </span>
      <span class="area-label">${area.label}</span>
    `;
    button.addEventListener("click", () => openArea(area.id));
    elements.areaNav.appendChild(button);
  });
  renderPaperDolls();
}


export function renderDiary() {
  renderCollectionSummary();
  elements.diaryList.innerHTML = "";
  if (!session.state.diary.length) {
    elements.diaryList.innerHTML = `<div class="diary-entry"><strong>No diary yet</strong><span>Finish quests or buy items to see records here.</span></div>`;
    return;
  }
  session.state.diary.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "diary-entry";
    row.innerHTML = `<strong>${entry.title}</strong><span>${entry.body}</span><span>${entry.result || ""}</span><small>${entry.at}</small>`;
    elements.diaryList.appendChild(row);
  });
}

export function renderCollectionSummary() {
  if (!elements.collectionSummary) return;
  const badgeText = session.state.badges.length ? session.state.badges.join(" / ") : "No badges yet";
  const npcText = session.state.metNpcs.length ? session.state.metNpcs.join(" / ") : "No friends met yet";
  const wordText = session.state.learnedWords.length ? session.state.learnedWords.slice(0, 12).join(" / ") : "No words yet";
  elements.collectionSummary.innerHTML = `
    <div><strong>${session.state.learnedWords.length}</strong><span>Words</span><small>${wordText}</small></div>
    <div><strong>${session.state.metNpcs.length}</strong><span>Friends</span><small>${npcText}</small></div>
    <div><strong>${session.state.badges.length}</strong><span>Badges</span><small>${badgeText}</small></div>
  `;
}

export function renderSettings() {
  elements.speakToggleButton.textContent = `Voice: ${session.state.speechEnabled ? "On" : "Off"}`;
  // issue #309（spec#8）：登入後於設定顯示目前帳號 username（帳號資訊呈現；本機模式隱藏）。
  if (elements.settingsAccountLine) {
    const username = cloudUsername();
    elements.settingsAccountLine.hidden = !username;
    if (username) elements.settingsAccountLine.textContent = `Signed in as: ${username}`;
  }
  if (elements.signOutButton) elements.signOutButton.hidden = !cloudUsername(); // #309 審查 C14：遊戲內登出入口

  // issue #310（spec#26／sysCase#16.1）：維護者鎖定時長時，欄位唯讀顯示強制值並明示由維護者管理；
  // 政策不回寫 state.playLimit（解除鎖定即回復玩家自調值）。
  const effLimit = effectivePlayLimit(session.state.playLimit);
  if (elements.playMinutesInput) {
    elements.playMinutesInput.value = String(effLimit.playMinutes);
    elements.playMinutesInput.disabled = effLimit.locked;
  }
  if (elements.restMinutesInput) {
    elements.restMinutesInput.value = String(effLimit.restMinutes);
    elements.restMinutesInput.disabled = effLimit.locked;
  }
  if (elements.playLimitManagedNote) elements.playLimitManagedNote.hidden = !effLimit.locked;
  const saveLimitButton = document.getElementById("savePlayLimitButton");
  if (saveLimitButton) saveLimitButton.disabled = effLimit.locked;
  renderBuildInfo(elements, buildInfo);
  renderAbout(elements, { copyright, versionHistory });
}

// issue #246：角色語音指定的設定 UI 已自玩家 Settings 移至管理設定工具的「聲音管理」頁籤（devtool/voice-tuner.js），
// 沿用 render/settings.js 的 renderVoiceSettings 與本檔 speechManager 同一套指定 store；遊戲端僅保留 Voice On/Off 開關，
// 不再於 Settings 渲染角色語音清單（公開遊玩端未指定者一律自動依性別與語言選用）。

