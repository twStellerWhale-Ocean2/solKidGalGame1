import { buildInfo, copyright, versionHistory } from "./build/version.js";
import { $, $$, createElements } from "./app/elements.js";
import { isLocalDevEnv, isLocalDevHost, WARDROBE_TUNER_DEV_PATH } from "./app/env.js";
import {
  areaForHotspot,
  allowedShopCategoriesFor,
  categoryForType,
  categoryLabel,
  itemMatchesCategory,
  clamp,
  closestNodeFromLegacy,
  hotspotById,
  hotspotByNode,
  locationsForArea,
  itemById,
  nodeMapForArea,
  sceneConfigFor
} from "./core/lookups.js";
import {
  areaRegistry,
  castleHotspots,
  castleMapImageSize,
  castleMapNodes,
  categories,
  characterScaleContract,
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  difficultyConfig,
  playableCharacterById,
  normalizeProfileColor,
  randomProfileColor,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomBackgroundPattern,
  mapImageSize,
  mapNodes,
  paperDollBaseLayer,
  paperDollLayerOrder,
  wardrobeLayerBoundsByType,
  wardrobeLayerBoundsForType,
  playableVoiceById,
  profileColorPalette,
  questTemplates,
  sceneConfigs,
  shopItems,
  worldMap,
  voiceProfileForNpcName,
  voiceProfileForCharacterId,
  composeVoiceProfile,
  resolveVoiceProfile,
  DEFAULT_VOICE_PROFILE,
  pickVoiceByGender,
  recommendedVoiceNamesForGender,
  usedVoiceBuckets
} from "./data/game-data.js";
import { createAdvControls } from "./flow/adv-controls.js";
import { firstLayerActionsFor, sceneActionLabel, isShopHotspot } from "./flow/scene-actions.js";
import { FLOW_STAGE_LABELS } from "./flow/stages.js";
import { createMapActorRuntime, mapActorMotionTypes } from "./map/actors.js";
import { updateMarkerEdgeVisibility } from "./map/marker-visibility.js";
import { createAreaMapViewportController } from "./map/viewport.js";
import { createKeyboardWalkController, directionForKey } from "./map/keyboard-walk.js";
import { renderItemDetailPanel } from "./render/item-panel.js";
import { openAdjustOverlay } from "./render/adjust-overlay.js";
import { createPaperDollRenderer } from "./render/paper-doll.js";
import { renderBuildInfo, renderAbout, renderVoiceSettings } from "./render/settings.js";
import { applyAdvSceneArt } from "./scene/scene-art.js";
import { saveMarkerEnd, saveMarkerStart } from "./state/storage.js";
import { VOICE_ASSIGNMENT_KEY, createVoiceAssignmentStore } from "./state/voice-assignments.js";
import {
  addDiary as addStateDiary,
  addUnique as addStateUnique,
  applyEffects as applyStateEffects,
  awardBadge as awardStateBadge,
  buildSaveMarkdown as buildStateSaveMarkdown,
  createQuestForPlace,
  createRandomQuest,
  effectText,
  createFreshAccount,
  freshState,
  loadAccountState,
  loadLocalState,
  normalizeState,
  outfitSummary as stateOutfitSummary,
  persistState,
  sanitizePlayerName,
  updateProgressBadges as updateStateProgressBadges
} from "./state/game-state.js";
import {
  deleteAccount,
  getActiveAccountId,
  listAccounts,
  setActiveAccountId,
  updateAccountMeta
} from "./state/accounts.js";
import { installTestingHooks } from "./testing/selftests.js?v=20260626-issue267-wardrobe-ssot";
import { createSaveLoadController } from "./system/save-load.js";
import { elements, session } from "./core/session.js";
import { hub } from "./core/hub.js";
import {
  activePaperDollCharacter,
  bustMarkupFor,
  clearTryOnPreview,
  equipOutfitItem,
  paperDollRenderer,
  renderPaperDolls,
  toggleEquip
} from "./wardrobe/doll.js";
import {
  _positionAdjustBtn,
  allowedShopCategories,
  buyItemInAdv,
  openRefundDetail,
  openShopDetail,
  openWardrobeDetail,
  patchWardrobeItem,
  refundItemInAdv,
  renderAdvShop,
  renderRefundDetail,
  renderWardrobeDetail,
  toggleShopTryOn
} from "./wardrobe/shop-panel.js";
import {
  activeTravelMapArea,
  areaMapMetrics,
  areaMapViewportController,
  currentPlayerPoint,
  ensureAreaPosition,
  ensureCastlePosition,
  focusCastleHotspot,
  focusTravelHotspot,
  interactCastleHotspot,
  interactCurrentLocation,
  interactNearby,
  isWalkable,
  mapActorRuntime,
  mapWalkController,
  moveOnCastleMap,
  moveOnMap,
  openArea,
  openWorldMap,
  renderCastleMap,
  renderMap,
  zoomAreaMapFromKeyboard
} from "./map/map-runtime.js";
import {
  activeWorldDestination,
  finishWorldTravel,
  focusWorldDestination,
  moveOnWorldMap,
  nearbyWorldDestination,
  openWorldDestination,
  renderWorldMap,
  requestWorldTravel,
  worldDestinationById,
  worldDestinationForArea
} from "./map/world-map.js";
import {
  applyAreaMapViewport,
  beginAreaMapGesture,
  beginCastleMapDrag,
  beginMapDrag,
  beginWorldMapDrag,
  finishCastleMapDrag,
  finishMapDrag,
  finishWorldMapDrag,
  moveCastleMapDrag,
  moveMapDrag,
  moveWorldMapDrag,
  refreshAreaMapPositions
} from "./map/map-gestures.js";
import { cssAssetUrl, domAssetUrl } from "./core/asset-url.js";
import {
  CHINESE_AUDIO_LANG,
  SPEECH_DEBOUNCE_MS,
  SPEECH_LEADING_PAD,
  SPEECH_QUEUE_MODE,
  SPEECH_RATE_SCALE,
  cutSceneVoiceOnSwitch,
  effectiveSpeechRate,
  npcVoiceFor,
  playLessonAudio,
  playTone,
  playerVoiceProfile,
  speak,
  speechManager
} from "./scene/speech.js";
import {
  MAX_LIMIT_MINUTES,
  MIN_LIMIT_MINUTES,
  extendSession,
  isJobDone,
  markJobDone,
  normalizePlayLimit,
  playAllowance,
  playStatus,
  recordAnswer as recordCycleAnswer,
  resumeFromRest,
  tick as tickPlayLimit
} from "./system/play-clock.js";


const REWARD_SECOND_TRY_RATIO = 0.5;    // design paramRewardSecondTryRatio
const CHAT_MOOD_REWARD = 1;             // issue #135 design paramChatMoodReward：每次生活聊天答對增加的心情值
const MOOD_MINUTES_PER_POINT = 1;       // issue #135 design paramMoodMinutesPerPoint：每點心情換算延長的遊玩分鐘數
const CHAT_CHOICE_COUNT = 2;            // issue #138 design paramChatChoiceCount：生活聊天每題呈現選項數（輕鬆寒暄）
const JOB_CHOICE_COUNT = 3;             // issue #149 design paramJobChoiceCount：打工任務每題呈現選項數（#138 為 4、#149 收斂為 3）
// issue #149：題組不再帶 ending 旁白；完成時由角色說一句自然收尾（聊天＝道別、打工＝稱讚＋道謝），隨機選一句並附中文、由 NPC 音色朗讀，取代固定的 "Nice chat!"／"Great work!"。
const CHAT_ENDINGS = [
  { en: "See you soon, Princess!", zh: "待會見，公主！" },
  { en: "Take care, Princess!", zh: "公主，保重喔！" },
  { en: "Come and chat again soon!", zh: "要再來聊天喔！" },
  { en: "Bye for now, Princess!", zh: "先這樣囉，公主，再見！" },
  { en: "It was lovely talking with you.", zh: "和你聊天真開心。" },
  { en: "Thanks for stopping by, Princess!", zh: "謝謝你過來，公主！" },
  { en: "Have a wonderful day!", zh: "祝你有美好的一天！" },
  { en: "See you next time!", zh: "下次見！" },
  { en: "I always enjoy our chats.", zh: "我每次都很喜歡和你聊天。" },
  { en: "Take good care, and come back soon!", zh: "好好保重，要再來喔！" }
];
const WORK_ENDINGS = [
  { en: "Good job! Thank you, Princess.", zh: "做得好！謝謝你，公主。" },
  { en: "Great work! Thank you so much.", zh: "做得很棒！非常謝謝你。" },
  { en: "Well done! Thank you for your help.", zh: "太好了！謝謝你的幫忙。" },
  { en: "Wonderful! You helped me a lot.", zh: "太棒了！你幫了我大忙。" },
  { en: "Perfect! I could not have done it without you.", zh: "完美！沒有你我做不到。" },
  { en: "Amazing work, Princess! Thank you!", zh: "公主，做得太厲害了！謝謝你！" },
  { en: "You did it! Thank you, Princess.", zh: "你做到了！謝謝你，公主。" },
  { en: "Such a big help! Thank you!", zh: "真是幫了大忙！謝謝你！" },
  { en: "Nicely done! I really appreciate it.", zh: "做得真好！我真的很感謝。" },
  { en: "Brilliant! You are a great helper.", zh: "太棒了！你是很棒的小幫手。" }
];
function pickEnding(isChat) {
  const pool = isChat ? CHAT_ENDINGS : WORK_ENDINGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const advControls = createAdvControls({
  elements,
  getFocusIndex: () => session.advFocusIndex,
  getMode: () => session.advMode,
  setFocusIndex: (nextIndex) => { session.advFocusIndex = nextIndex; }
});
const saveLoadController = createSaveLoadController({
  buildSaveMarkdown,
  elements,
  normalizeState,
  onStateLoaded(nextState) { session.state = nextState; },
  persist,
  render
});

function persist() {
  persistState(session.state);
  syncActiveAccountMeta({ touched: true });
}

// ---- 遊玩時間限制與護眼休息（issue #6 / spec#9）：ticker、HUD 與結算／休息 overlay ----

function clockNow() {
  return Date.now() + session.testClockOffset;
}

// 僅在已選定帳號且帳號／選角 overlay 未開啟時計時（共用裝置以各帳號各自計算）。
function playClockActive() {
  return Boolean(getActiveAccountId())
    && !elements.accountSelect?.classList.contains("show")
    && !elements.characterSelect?.classList.contains("show");
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function profileColorFor(characterId = session.state.activeCharacterId, color = session.state.profileColor) {
  return normalizeProfileColor(color, characterId);
}

// 單一頭胸 bust 渲染（issue #132，sysCase#5.2）：側欄、帳號卡與選角卡共用「同一個」頭胸渲染——
// 同一紙娃娃層合成（bustMarkupFor）＋同一 .bust-doll 裁切，不另維護第二套裁切邏輯。
function renderBustInto(frameEl, characterId, outfitState, color, pattern = "none") {
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
function applyCardPattern(frameEl, pattern) {
  if (!frameEl) return;
  const normalized = normalizeBackgroundPattern(pattern);
  if (normalized === "none") frameEl.removeAttribute("data-pattern");
  else frameEl.dataset.pattern = normalized;
}

// 組裝「可玩時間額度」顯示（spec#9 / sysCase#7.5）：基礎分鐘數；生活聊天延長時把增加量以 +N😄 清楚標示。
function renderPlayTimeAllowance() {
  if (!elements.playTimeValue) return;
  const { baseMinutes, bonusMinutes } = playAllowance(session.state);
  elements.playTimeValue.innerHTML = bonusMinutes > 0
    ? `${baseMinutes} <span class="play-time-bonus">+${bonusMinutes}😄</span> min`
    : `${baseMinutes} min`;
}

// 更新人物資訊欄時間顯示：可玩時間額度 + 剩餘可玩時間（不以百分比為主，sysCase#7.5）。
// 接受 playStatus() 或 tick() 之結果（兩者皆帶 phase/energyPercent/playRemainingMs/restRemainingMs）。
function updateEnergyHudFromStatus(status, now = clockNow()) {
  session.state.energy = status.phase === "rest" ? 0 : Math.min(100, Math.max(0, Math.round(Number(status.energyPercent) || 0)));
  renderPlayTimeAllowance();
  if (!elements.timeLeftValue) return;
  if (status.phase === "rest") {
    elements.timeLeftValue.textContent = `Rest ${formatClock(status.restRemainingMs)}`;
  } else if (status.phase === "play") {
    elements.timeLeftValue.textContent = formatClock(status.playRemainingMs);
  } else {
    elements.timeLeftValue.textContent = formatClock((session.state.playLimit?.playMinutes || 15) * 60000);
  }
}

function updateProfileColorChrome() {
  const color = profileColorFor();
  document.documentElement.style.setProperty("--active-profile-color", color);
  // 資訊欄大頭照已改為即時穿搭紙娃娃 bust（由 renderPaperDolls 填層）；此處僅同步識別色與背景花紋。
  elements.sideProfileAvatar?.style.setProperty("--profile-color", color);
  applyCardPattern(elements.sideProfileFrame, session.state.backgroundPattern);
  // issue #161：地圖公主 token 已移除識別色橢圓背板，不再於地圖 token 注入 --profile-color（識別色僅用於資訊欄與帳號卡）。
}

function syncActiveAccountMeta({ touched = false } = {}) {
  const activeAccountId = getActiveAccountId();
  if (!activeAccountId) return;
  updateAccountMeta(activeAccountId, {
    name: session.state.playerName,
    characterId: session.state.activeCharacterId,
    profileColor: profileColorFor(),
    lastPlayedAt: touched ? Date.now() : undefined
  });
}

function returnToInitialSelect() {
  syncActiveAccountMeta({ touched: true });
  persist();
  hidePlayBreak();
  closeSystemMenu();
  openAccountSelect({ mustChoose: false });
}

// 更新 HUD 的遊玩時間預算顯示，不套用狀態轉換；供 render() 呼叫。
function renderPlayClock() {
  const now = clockNow();
  const status = playStatus(session.state, now);
  updateEnergyHudFromStatus(status, now);
}

// 每秒一拍：依真實時間推進，時間到顯示結算並進入休息，休息屆滿開放續玩。
function tickPlayClock() {
  if (!playClockActive()) return;
  const now = clockNow();
  const ev = tickPlayLimit(session.state, now);
  updateEnergyHudFromStatus(ev, now);
  if (ev.justExpired) {
    showPlayBreak(ev.settlement, ev.restRemainingMs, false);
    persist();
  } else if (ev.phase === "rest") {
    showPlayBreak(null, ev.restRemainingMs, Boolean(ev.restDone));
  } else {
    if (ev.justStarted) persist();
    hidePlayBreak();
  }
}

function startPlayClock() {
  if (session.playClockTimer) return;
  tickPlayClock();
  session.playClockTimer = window.setInterval(tickPlayClock, 1000);
}

function renderPlayBreakStats(settlement) {
  if (!settlement || !elements.playBreakStats) return;
  const rows = [
    ["Coins this round", `+${settlement.coinsGained}`],
    ["Questions", String(settlement.answered)],
    ["Correct", String(settlement.correct)],
    ["Accuracy", `${settlement.accuracy}%`]
  ];
  elements.playBreakStats.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = "play-break-stat";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    row.append(labelEl, valueEl);
    return row;
  }));
}

// 顯示結算＋休息 overlay：settlement 僅於時間到當下提供，其後休息拍只更新倒數與續玩鈕狀態。
function showPlayBreak(settlement, restRemainingMs, restDone) {
  renderPlayBreakStats(settlement);
  if (elements.playBreakCountdown) {
    elements.playBreakCountdown.textContent = restDone
      ? "Eyes rested! You can play again."
      : `Resting… ${formatClock(restRemainingMs)} left`;
  }
  const resumeWasDisabled = elements.playBreakResume?.disabled !== false;
  if (elements.playBreakResume) elements.playBreakResume.disabled = !restDone;
  if (!session.playBreakShown) {
    elements.playBreak?.classList.add("show");
    elements.playBreak?.setAttribute("aria-hidden", "false");
    document.body.classList.add("play-break-open");
    session.playBreakShown = true;
    elements.playBreak?.querySelector(".play-break-card")?.focus({ preventScroll: true });
  }
  // 休息屆滿、續玩鈕由禁用轉為可用時，移焦點到續玩鈕（鍵盤可直接續玩、不卡關）。
  if (restDone && resumeWasDisabled) elements.playBreakResume?.focus({ preventScroll: true });
}

function hidePlayBreak() {
  if (!session.playBreakShown) return;
  elements.playBreak?.classList.remove("show");
  elements.playBreak?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("play-break-open");
  session.playBreakShown = false;
}

// 休息屆滿後按「Play again」續玩；休息未滿則不動作（不可繞過休息）。
function resumePlayFromBreak() {
  if (!resumeFromRest(session.state, clockNow())) return;
  persist();
  hidePlayBreak();
  tickPlayClock();
}

function applyPlayLimitSettings() {
  const toMinutes = (value) => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return MIN_LIMIT_MINUTES;
    return Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, n));
  };
  session.state.playLimit.playMinutes = toMinutes(elements.playMinutesInput?.value);
  session.state.playLimit.restMinutes = toMinutes(elements.restMinutesInput?.value);
  persist();
  renderSettings();
  elements.statusMessage.textContent = `Play ${session.state.playLimit.playMinutes} min, rest ${session.state.playLimit.restMinutes} min.`;
}

function changeView(viewName) {
  mapWalkController.clear();   // issue #178：切換畫面即停走動，避免按住狀態跨畫面殘留卡走
  if (["diary", "settings", "english", "save"].includes(viewName)) {
    openSystemMenu(viewName);
    return;
  }
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  if (viewName === "home") {
    session.state.area = "castle";
    ensureCastlePosition();
  } else if (viewName === "map") {
    if (session.state.area === "castle" || !areaRegistry[session.state.area]?.enabled) session.state.area = "urban";
    ensureAreaPosition(session.state.area);
  } else if (viewName === "world") {
    session.activeWorldDestinationId = worldDestinationForArea(session.state.area)?.id || session.activeWorldDestinationId || "castle";
    areaMapViewportController.requestCenter("world");
  }
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  if (location.hash.slice(1) !== viewName) {
    history.replaceState(null, "", `#${viewName}`);
  }
  if (viewName === "map") {
    setTimeout(() => {
      renderMap();
      elements.mapStage.focus({ preventScroll: true });
    }, 0);
  } else if (viewName === "world") {
    setTimeout(() => {
      renderWorldMap();
      elements.worldStage?.focus({ preventScroll: true });
    }, 0);
  } else if (viewName === "home") {
    setTimeout(() => {
      renderCastleMap();
      elements.castleStage?.focus({ preventScroll: true });
    }, 0);
  }
  renderAreaNav();
}

function activeViewName() {
  const active = elements.views.find((view) => view.classList.contains("active"));
  return active?.id?.replace(/View$/, "") || "home";
}

function isSystemMenuOpen() {
  return elements.systemMenu?.classList.contains("show");
}

function openSystemMenu(panel = "diary") {
  changeSystemPanel(panel);
  elements.systemMenu.classList.add("show");
  elements.systemMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("system-menu-open");
  if (location.hash.slice(1) !== panel) history.replaceState(null, "", `#${panel}`);
  setTimeout(() => {
    elements.systemMenuBook?.focus({ preventScroll: true });
  }, 0);
}

function closeSystemMenu() {
  if (!isSystemMenuOpen()) return;
  elements.systemMenu.classList.remove("show");
  elements.systemMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("system-menu-open");
  const viewName = activeViewName();
  if (["diary", "settings", "english", "save", "about"].includes(location.hash.slice(1))) {
    history.replaceState(null, "", `#${viewName}`);
  }
  elements.systemMenuButton?.focus({ preventScroll: true });
}

function changeSystemPanel(panel = "diary") {
  if (!["diary", "settings", "english", "save", "about"].includes(panel)) panel = "diary";
  session.systemMenuPanel = panel;
  elements.systemMenuTabs.forEach((tab) => {
    const isActive = tab.dataset.menuPanel === panel;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  elements.systemPanels.forEach((item) => {
    const isActive = item.dataset.menuPanel === panel;
    item.classList.toggle("active", isActive);
    item.hidden = !isActive;
  });
  if (isSystemMenuOpen() && location.hash.slice(1) !== panel) {
    history.replaceState(null, "", `#${panel}`);
  }
}

function applyEffects(effects = {}) {
  applyStateEffects(session.state, effects);
}

function addDiary(entry) {
  addStateDiary(session.state, entry);
}

function addUnique(listName, values) {
  addStateUnique(session.state, listName, values);
}

function awardBadge(id) {
  awardStateBadge(session.state, id);
}

function updateProgressBadges() {
  updateStateProgressBadges(session.state);
}

function setExpressions(princess = "normal", npc = "normal") {
  session.princessExpression = princess;
  session.npcExpression = npc;
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.dataset.expression = session.princessExpression;
  });
  // issue#150：移除 NPC 角落心情表情徽章後，npc 表情不再寫入 DOM（保留參數與狀態以維持答題回饋 API 對稱）。
}

function render() {
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

function renderStatus() {
  elements.coinValue.textContent = session.state.coins;
  // issue #286 spec#20：對話場景畫面內即時顯示金錢，與側欄同一資料來源（session.state.coins）。
  if (elements.advCoinValue) elements.advCoinValue.textContent = `🪙 ${session.state.coins}`;
}

// 玩家公主的名字為使用者設定；遊戲內稱呼一律取此值（世界觀／品牌名 Luminara 不在此列）。
function princessName() {
  return session.state.playerName || playableCharacterById(session.state.activeCharacterId)?.defaultName || "Lumi";
}

// 課程題目原文以 "Lumi" 撰寫；顯示前統一替換為玩家名字。
// prompt／answer／choices／words 一致替換，確保 answerLesson 的 choice === answer 比對仍成立。
function withPlayerName(text) {
  return typeof text === "string" ? text.replaceAll("Lumi", princessName()) : text;
}

// issue #149：題庫不再逐題手寫 words；缺 words 時由正解英文句導出（小寫、去標點、拆詞），供 learnedWords／日誌記錄。
function deriveWordsFromAnswer(answer) {
  if (typeof answer !== "string") return [];
  return answer.toLowerCase().replace(/[^a-z'\s]/g, " ").split(/\s+/).filter(Boolean);
}

function localizeLesson(lesson) {
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

function renderIdentity() {
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

function openCharacterSelect({ forced = false, cancelable = false } = {}) {
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

function closeCharacterSelect() {
  elements.characterSelect.classList.remove("show");
  elements.characterSelect.setAttribute("aria-hidden", "true");
  document.body.classList.remove("character-select-open");
}

function buildCharacterCards() {
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

function selectPendingCharacter(characterId) {
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
  if (!session.playerNameEdited) {
    elements.playerNameInput.value = playableCharacterById(characterId)?.defaultName || "";
  }
}

function buildProfileColorChoices() {
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
      buildCharacterCards();
    };
  }
}

// issue #131：背景花紋選擇器（spec#6）。每個花紋一個預覽 swatch；選定即更新 session.pendingBackgroundPattern 並反映於選角卡。
function buildBackgroundPatternChoices() {
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

function isStarterWardrobeItem(itemId, type) {
  const item = itemById(itemId);
  return item?.storeId === "starter" && (!type || item.type === type);
}

function applyCharacterStarterOutfit(character) {
  const starterOutfit = character?.defaultOutfit || {};
  if (isStarterWardrobeItem(session.state.outfit.hairstyle, "hairstyle") && starterOutfit.hairstyle) {
    session.state.outfit.hairstyle = starterOutfit.hairstyle;
  }
  if (isStarterWardrobeItem(session.state.outfit.outfit, "outfit") && starterOutfit.outfit) {
    session.state.outfit.outfit = starterOutfit.outfit;
  }
}

function confirmCharacterSelect() {
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
function cancelCharacterSelect() {
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
function openAccountSelect({ mustChoose = false } = {}) {
  session.accountSelectMustChoose = mustChoose;
  buildAccountList();
  elements.accountSelect.classList.add("show");
  elements.accountSelect.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-select-open");
  startAccountStatusTicker();
  setTimeout(() => elements.accountSelectCard?.focus({ preventScroll: true }), 0);
}

function closeAccountSelect() {
  // 啟動 gate 或尚無使用中帳號時不可關閉（必須先選或新增帳號）。
  if (session.accountSelectMustChoose || !getActiveAccountId()) return;
  stopAccountStatusTicker();
  elements.accountSelect.classList.remove("show");
  elements.accountSelect.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-select-open");
}

// issue #169：依現在時鐘重算各帳號卡狀態文字（休息倒數／Ready／Play），供開啟期間每秒刷新。
function refreshAccountStatuses() {
  if (!elements.accountList) return;
  elements.accountList.querySelectorAll(".account-row").forEach((row) => {
    const accountId = row.querySelector(".account-pick")?.dataset.accountId;
    const statusEl = row.querySelector(".account-status");
    if (!accountId || !statusEl) return;
    statusEl.textContent = accountPlayStatusText(loadAccountState(accountId));
  });
}

function startAccountStatusTicker() {
  if (session.accountStatusTimer) return;
  session.accountStatusTimer = window.setInterval(refreshAccountStatuses, 1000);
}

function stopAccountStatusTicker() {
  if (!session.accountStatusTimer) return;
  window.clearInterval(session.accountStatusTimer);
  session.accountStatusTimer = null;
}

function formatLastPlayed(timestamp) {
  if (!timestamp) return "Not played yet";
  const date = new Date(timestamp);
  return `Last played ${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function accountPlayStatusText(accountState) {
  const status = playStatus(accountState, clockNow());
  if (status.phase === "rest" && !status.restDone) return `Rest ${formatClock(status.restRemainingMs)}`;
  if (status.phase === "rest" && status.restDone) return "Ready";
  if (status.phase === "play") return `Play ${formatClock(status.playRemainingMs)}`;
  return "Ready";
}

function accountSummary(account) {
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

function buildAccountList() {
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

function selectAccount(accountId) {
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

function createNewAccount() {
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

function handleDeleteAccount(accountId, label) {
  if (!window.confirm(`Delete player "${label}"? This removes that player's progress on this device.`)) return;
  const wasActive = getActiveAccountId() === accountId;
  deleteAccount(accountId);
  if (wasActive) session.state = freshState(); // 刪到使用中帳號：清掉當前狀態，交回帳號選擇。
  buildAccountList();
}

function renderHome() {
  renderCastleMap();
}

function renderAreaNav() {
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

function openAdvBase(hotspot, mode) {
  const areaId = areaForHotspot(hotspot);
  session.state.area = areaId;
  changeView(areaRegistry[areaId]?.view || "map");
  clearRewardBursts();
  const scene = sceneConfigFor(hotspot);
  session.advMode = mode;
  session.activeLesson = null;
  session.activeShopHotspot = null;
  clearTryOnPreview({ renderDoll: false });
  session.shopTryOnIds = [];
  session.advFocusIndex = 0;
  setExpressions("normal", "normal");
  elements.advScene.dataset.mode = mode;
  elements.shopArea.before(elements.choiceList);
  elements.choiceList.classList.remove("shop-command-list");
  elements.advActionFooter.innerHTML = "";
  elements.advModal.classList.add("show");
  elements.advModal.setAttribute("aria-hidden", "false");
  elements.advScene.className = `adv-scene ${scene.scene || ""}`;
  elements.advScene.style.setProperty("--lumi-stage-scale", String(activePaperDollCharacter().stageScale || characterScaleContract.lumiStageScale));
  applyAdvSceneArt(elements.advScene, scene.sceneArt, { assetUrl: domAssetUrl });
  // issue #226：ADV 場景面板外之視口留白以該場景背景之模糊放大版鋪底（無 sceneArt 時 fallback 深色 backdrop）。
  elements.advModal.style.setProperty(
    "--adv-backdrop-image",
    scene.sceneArt?.src ? `url("${cssAssetUrl(scene.sceneArt.src)}")` : ""
  );
  // issue#150：場景角落標示——左上公主名、右上地點＋場景角色名。
  // 場景角色即公主本人（如公主房）或無對話對象時，次行留空（CSS :empty 隱藏），避免與左上公主名重複。
  elements.advTitle.textContent = hotspot.label;
  elements.advPlayerName.textContent = princessName();
  elements.advNpcName.textContent = scene.npc && scene.npc !== princessName() ? scene.npc : "";
  const npcClass = scene.npcClass || (scene.npcImage ? "npc-image" : "npc-none");
  elements.advNpcPortrait.className = `portrait-card adv-npc ${npcClass}`;
  elements.advNpcPortrait.style.backgroundImage = scene.npcImage ? `url("${domAssetUrl(scene.npcImage)}")` : "";
  elements.advSpeaker.textContent = scene.npc;
  elements.choiceList.innerHTML = "";
  elements.advShopGrid.innerHTML = "";
  elements.shopArea.classList.remove("show", "wardrobe-detail", "refund-detail");
  elements.advFeedback.textContent = "";
  renderPaperDolls();
  requestAnimationFrame(() => {
    elements.advModal.classList.toggle("show", session.advMode !== "closed");
    elements.advModal.setAttribute("aria-hidden", session.advMode === "closed" ? "true" : "false");
  });
}

function openSceneAdv(hotspot) {
  if (!hotspot) return;
  // issue #164：回到第一層場景選單（自第二層返回之共同收口）時即時收束前段語音、改接當下話題；
  // 初次進場時無語音播放、為冪等 no-op，不影響隨後之歡迎詞播放。
  cutSceneVoiceOnSwitch();
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const scene = sceneConfigFor(hotspot);
  // issue #149：歡迎詞由角色第一人稱發話，並支援中文協助（中文鈕播 travelLineZh）。
  setAdvLine(scene.travelLine || hotspot.hint, scene.travelLineZh);
  elements.advPrompt.textContent = "Choose what to do here.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
  // issue #164：同一場景每次造訪只播一次歡迎詞——首次進場播放並記旗標，造訪內返回第一層不重播（旗標於離場清空）。
  if (session.sceneVisitWelcomeId !== hotspot.id) {
    session.sceneVisitWelcomeId = hotspot.id;
    speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-scene" });
  }
}

function openRoomScene(hotspot = hotspotById("princessRoom")) {
  openAdvBase(hotspot, "scene");
  setAdvLine(`${princessName()} is in her room. What should we change today?`);
  elements.advPrompt.textContent = "Choose a room action.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
}

function renderFirstLayerSceneActions(hotspot) {
  firstLayerActionsFor(hotspot, { hasLessons: hasLessonsForPlace(hotspot?.id), hasChat: hasChatForPlace(hotspot?.id), jobDoneThisCycle: isJobDone(session.state, hotspot?.id) }).forEach((action) => {
    addAdvOption(sceneActionLabel(action), () => handleFirstLayerSceneAction(action, hotspot), {
      leave: action.handlerKey === "leave",
      navigation: action.navigation && action.handlerKey !== "leave"
    });
  });
}

// issue #164：場景內第一↔二層切換之共同收束——進入第二層子互動或返回第一層場景選單時即時停止前段語音、
// 改接當下話題（沿用 #156 之即時 cancel() 降級：Web Speech API 無法對進行中語句音量淡出，僅 cancel() 可停）。
// 冪等：無語音播放時不動作、不記診斷；收束於當下情境 speak() 之前完成，不誤殺當下話題語音。
function handleFirstLayerSceneAction(action, hotspot) {
  // issue #164：進入第二層子互動前先收束第一層前段語音、改接當下話題；離場（leave）由 closeAdv 以 scene-leave 收束、不在此重複。
  if (action.handlerKey !== "leave") cutSceneVoiceOnSwitch();
  switch (action.handlerKey) {
    case "wardrobe":
      openWardrobeDetail(action.category);
      return;
    case "practice":
      openPracticeAction(hotspot);
      return;
    case "chat":
      openChatAction(hotspot);
      return;
    case "shop":
      openShopDetail(hotspot);
      return;
    case "refund":
      openRefundDetail(hotspot);
      return;
    case "leave":
      leaveScene(hotspot);
      return;
    default:
      openHintAdv(hotspot);
  }
}

function openPracticeAction(hotspot) {
  if (jobAvailableForPlace(hotspot?.id)) {
    openQuestAdv(hotspot);
    return;
  }
  // issue #177：本週期已答對此場景打工 → 已下架，提示休息後再來；否則沿用「此處無打工」提示。
  const doneThisCycle = hasLessonsForPlace(hotspot?.id) && isJobDone(session.state, hotspot?.id);
  openHintAdv(hotspot, doneThisCycle
    ? "You've already finished this place's work this playtime. Take a rest and come back!"
    : (hotspot?.hint || "There is no English practice ready here."));
}

// issue #135：生活聊天入口——以 chatLesson 開啟對話題，答對加心情並在護眼上限內延長遊玩時間（不發 coins）。
function openChatAction(hotspot) {
  if (hasChatForPlace(hotspot?.id)) {
    openQuestAdv(hotspot, { bankKey: "chatLesson", mode: "chat" });
    return;
  }
  openHintAdv(hotspot, hotspot?.hint || "There is no chat ready here.");
}

function leaveScene(hotspot) {
  closeAdv();
  if (hotspot?.kind === "room") openArea("castle");
}

// issue #143：自第二層答題（聊天／打工）或答題完成畫面 Back 回第一層場景選單前，先清除暫態任務狀態
// （沿用舊 closeAdv 清理語意），避免未作答即返回時 session.state.activeQuest／session.activeLesson 殘留被持久化或匯出存檔。
function backToSceneMenu(hotspot) {
  session.state.activeQuest = null;
  session.activeLesson = null;
  persist();
  openSceneAdv(hotspot);
}

function addAdvOption(label, onClick, options = {}) {
  return advControls.addOption(label, onClick, options);
}

function advFocusableButtons() {
  return advControls.focusableButtons();
}

function setAdvFocus(index = 0) {
  advControls.setFocus(index);
}

function scheduleAdvFocus(index = 0) {
  if (session.advFocusTimer) window.clearTimeout(session.advFocusTimer);
  session.advFocusTimer = window.setTimeout(() => {
    session.advFocusTimer = 0;
    setAdvFocus(index);
  }, 0);
}

function moveAdvFocus(delta) {
  advControls.moveFocus(delta);
}

function confirmAdvFocus() {
  return advControls.confirmFocus();
}

// issue #135：openQuestAdv 服務兩種互動——options.mode="job"（預設，題庫 lesson、答對發 coins）
// 與 mode="chat"（題庫 chatLesson、答對加心情並延長遊玩時間、不發 coins）。無 options 時行為與既往相同。
function createChatQuest(hotspot) {
  const bank = sceneConfigs[hotspot.id]?.chatLesson || {};
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${hotspot.id}Chat`,
    place: hotspot.id,
    title: bank.title || "Chat",
    opening: bank.opening || "",
    openingZh: bank.openingZh || "",
    ending: bank.ending || "",
    npc: sceneConfigFor(hotspot).npc
  };
}

function openQuestAdv(hotspot, opts = {}) {
  const bankKey = opts.bankKey || "lesson";
  const mode = opts.mode || "job";
  const lesson = pickLesson(hotspot.id, bankKey);
  if (!lesson) {
    openHintAdv(hotspot, "No English task is ready for this place yet.");
    return;
  }
  const quest = mode === "chat" ? createChatQuest(hotspot) : createQuestForPlace(hotspot.id);
  session.state.activeQuest = quest;
  session.activeLessonMode = mode;
  openAdvBase(hotspot, "quest");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  session.activeLesson = localizeLesson(lesson);
  session.advChineseUsed = false;
  session.advWrongAttempts = 0;
  // issue #149：移除題組 opening 旁白；角色第一人稱台詞即 prompt——以 advLine 呈現、由 NPC 音色朗讀，中文鈕播 promptZh。
  setAdvLine(session.activeLesson.prompt, session.activeLesson.promptZh);
  elements.advPrompt.textContent = quest.title;
  const zhByChoice = Array.isArray(session.activeLesson.choicesZh) ? session.activeLesson.choicesZh : [];
  const allOptions = session.activeLesson.choices.map((choice, i) => ({ choice, zh: zhByChoice[i] || "" }));
  // issue #138：依互動模式裁切選項數（生活聊天＝2 輕鬆、打工任務＝4），永遠保留正解。
  const optionCount = session.activeLessonMode === "chat" ? CHAT_CHOICE_COUNT : JOB_CHOICE_COUNT;
  const options = limitChoiceOptions(allOptions, session.activeLesson.answer, optionCount);
  shuffled(options).forEach((option, index) => addChoiceRow(option.choice, option.zh, index + 1));
  // issue #143：第二層答題（聊天／打工）離開統一為 Back 回第一層場景選單，不直接跳出場景。
  addAdvOption("↩ Back", () => backToSceneMenu(hotspot), { navigation: true });
  scheduleAdvFocus(0);
  speak(session.activeLesson.prompt, npcVoiceFor(hotspot), { source: "npc-quest-prompt" });
}

// issue #138：依互動模式裁切選項數，永遠保留正解；選項數不足時原樣返回。
function limitChoiceOptions(options, answer, count) {
  if (!Number.isInteger(count) || count <= 0 || options.length <= count) return options;
  const answerOption = options.find((option) => option.choice === answer);
  const distractors = options.filter((option) => option.choice !== answer);
  const kept = answerOption ? [answerOption, ...distractors] : distractors;
  return kept.slice(0, count);
}

// issue #73：題目（advLine）的中文撥放鈕僅在有中文時顯示。
function updatePromptAudioButtons() {
  if (elements.speakPromptButtonZh) elements.speakPromptButtonZh.hidden = !session.activeOpeningZh;
}

// issue #149：集中設定 advLine 文字與其對應中文（中文協助鈕播此中文）；無中文者一律清空，
// 避免切換 ADV 模式（場景／商店／退款／衣櫥／提示／完成）時殘留前一畫面的中文（Codex P2）。
function setAdvLine(text, zh = "") {
  elements.advLine.textContent = text;
  session.activeOpeningZh = zh ? (withPlayerName(zh) || "") : "";
  updatePromptAudioButtons();
}

// issue #73：一列選項＝可作答的選項鈕＋英文撥放鈕＋（有中文時）中文撥放鈕。
function addChoiceRow(choice, zh, number) {
  const row = document.createElement("div");
  row.className = "choice-row";
  const answer = document.createElement("button");
  answer.className = "choice-button";
  answer.type = "button";
  answer.textContent = number ? `${number}. ${choice}` : choice;
  answer.setAttribute("aria-label", choice);
  answer.dataset.choice = choice;
  answer.addEventListener("click", () => answerLesson(answer, choice));
  row.appendChild(answer);
  const audio = document.createElement("div");
  audio.className = "choice-audio";
  audio.appendChild(makeAudioButton("En", `Read "${choice}" in English`, () => playLessonAudio(choice, "en-US")));
  if (zh) {
    const zhBtn = makeAudioButton("中", `用中文唸「${choice}」`, () => playLessonAudio(zh, CHINESE_AUDIO_LANG));
    zhBtn.classList.add("zh");
    audio.appendChild(zhBtn);
  }
  row.appendChild(audio);
  elements.choiceList.appendChild(row);
  return answer;
}

function makeAudioButton(label, ariaLabel, onClick) {
  const button = document.createElement("button");
  button.className = "choice-audio-button";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

// issue #73 獎勵階梯（按送出次數計）：未用中文且第一次答對＝full、第二次＝half、第三次起或用過中文＝none。
function helpRewardTier() {
  if (session.advChineseUsed) return "none";
  if (session.advWrongAttempts === 0) return "full";
  if (session.advWrongAttempts === 1) return "half";
  return "none";
}

function openHintAdv(hotspot, line = hotspot.hint) {
  openAdvBase(hotspot, "hint");
  setExpressions("thinking", "normal");
  setAdvLine(line);
  elements.advPrompt.textContent = jobAvailableForPlace(hotspot?.id)
    ? "Choose Practice to start this place's English."
    : "This place is for travel or story only.";
  elements.advFeedback.textContent = "";
  addAdvOption("↩ Back", () => openSceneAdv(hotspot), { navigation: true });
  scheduleAdvFocus(0);
}

function showRewardBurst(text) {
  clearRewardBursts();
  const burst = document.createElement("div");
  burst.className = "reward-burst";
  burst.textContent = text;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1400);
}

function clearRewardBursts() {
  document.querySelectorAll(".reward-burst").forEach((item) => item.remove());
}

// issue #96：題庫改為「場景自帶、進場才取」——直接讀該場景物件的 lesson.questions，
// 不再過濾全域 lessons 註冊表。回傳帶 place，並由地區常數導出 lessonId 與 vocabProfile，
// 供 completedLessons 進度、徽章與日誌沿用（id 格式同重構前 `${area}-${place}-NN`）。
// issue #135：bankKey 讓同一取題機制服務「打工(lesson)」與「生活聊天(chatLesson)」兩種題庫；預設 "lesson" 維持相容。
function pickLesson(place, bankKey = "lesson") {
  const lesson = sceneConfigs[place]?.[bankKey];
  const questions = lesson?.questions;
  if (!Array.isArray(questions) || !questions.length) return null;
  const index = Math.floor(Math.random() * questions.length);
  const idPrefix = bankKey === "chatLesson" ? `${lesson.area}-${place}-chat` : `${lesson.area}-${place}`;
  return {
    ...questions[index],
    place,
    id: `${idPrefix}-${String(index + 1).padStart(2, "0")}`,
    vocabProfile: lesson.vocabProfile
  };
}

function hasLessonsForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.lesson?.questions?.length);
}

// issue #177：場景打工於「本遊玩週期尚未答對」時才視為可作答（答對後下架、下一週期重置）；
// 供場景選單、地圖目的地卡與提示文案一致判斷「是否仍提供此打工」。
function jobAvailableForPlace(place) {
  return hasLessonsForPlace(place) && !isJobDone(session.state, place);
}

function hasChatForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.chatLesson?.questions?.length);
}

function answerLesson(button, choice) {
  if (!session.activeLesson || session.advMode !== "quest") return;
  const correct = choice === session.activeLesson.answer;
  recordCycleAnswer(session.state, correct); // 本回合答題統計（spec#9 結算用）：每次嘗試計入，答對另計。
  if (!correct) {
    session.advWrongAttempts += 1;
    button.classList.add("wrong");
    button.disabled = true;
    setExpressions("thinking", "surprised");
    elements.advFeedback.textContent = "Try again.";
    playTone("wrong");
    speak(choice, playerVoiceProfile(), { source: "princess-answer-wrong" }); // issue #93：公主以其音色朗讀玩家所選選項
    return;
  }

  const quest = session.state.activeQuest || createQuestForPlace(session.activeLesson.place);
  const completedHotspot = hotspotById(session.activeLesson.place);
  // issue #135：獎勵分流——生活聊天(chat) 加心情並在護眼上限內延長遊玩時間、不發 coins；打工(job) 沿用既有 coins 獎勵階梯。
  const isChat = session.activeLessonMode === "chat";
  let coins = 0;
  let burstText;
  let feedbackText;
  let diaryType = "quest";
  if (isChat) {
    session.state.mood = (Number(session.state.mood) || 0) + CHAT_MOOD_REWARD;
    // issue #165：聊天延長遊玩時間仍生效（其延長量改由 HUD Play time 欄位呈現，sysCase#7.5），
    // 完成回饋僅顯示心情加值、不再帶 "Nice chat!" 招呼語與遊玩時間提示。
    extendSession(session.state, clockNow(), CHAT_MOOD_REWARD * MOOD_MINUTES_PER_POINT);
    burstText = `+${CHAT_MOOD_REWARD} mood`;
    feedbackText = `+${CHAT_MOOD_REWARD} mood`;
    diaryType = "chat";
    playTone("correct");
  } else {
    const baseCoins = session.activeLesson.reward.coins || 0;
    const rewardTier = helpRewardTier();   // issue #73 獎勵階梯：full／half／none
    coins = rewardTier === "full"
      ? baseCoins
      : rewardTier === "half"
        ? Math.round(baseCoins * REWARD_SECOND_TRY_RATIO)
        : 0;
    applyEffects({ coins });
    playTone("correct");
    burstText = coins > 0 ? `+${coins} coins` : "No coins this time";
    feedbackText = coins > 0
      ? (rewardTier === "half" ? `${effectText({ coins })}. Half coins for the second try.` : `${effectText({ coins })}.`)
      : session.advChineseUsed
        ? "Nice learning with Chinese help! No coins this time."
        : "No coins this time — try to answer sooner next time.";
    // issue #177：打工答對 → 標記本場景打工於本遊玩週期已完成（下架，不可再作答），下一週期重置；
    // 僅打工計入（在此 job 分支內），聊天不計（spec#11 反洗 coins）。
    // issue #205：改以「本次實得 coins（>0）」為下架條件——答對但 0 coins（中文協助／第三次以上 none 階）
    // 不下架、本週期仍可在該場景再作答賺取 coins；full／half（coins>0）一如既往下架。
    if (coins > 0) markJobDone(session.state, session.activeLesson.place);
  }
  addUnique("completedLessons", [session.activeLesson.id]);
  addUnique("learnedWords", session.activeLesson.words);
  addUnique("metNpcs", [sceneConfigFor(completedHotspot).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(burstText);
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === session.activeLesson.answer) item.classList.add("correct");
  });
  addDiary({
    type: diaryType,
    title: `${quest.title} at ${completedHotspot.label}`,
    body: `Sentence: "${session.activeLesson.answer}"`,
    result: feedbackText,
    lessonId: session.activeLesson.id,
    words: session.activeLesson.words,
    vocabProfile: session.activeLesson.vocabProfile
  });
  // issue #149：完成時由角色說一句自然收尾（聊天=道別、打工=稱讚＋道謝），隨機選一句並附中文（NPC 音色朗讀）。
  const closing = pickEnding(isChat);
  setAdvLine(quest.ending || closing.en, quest.ending ? "" : closing.zh);
  // issue #143：完成後一律 Back 回第一層場景選單，提示文案對齊（不再分商店／非商店或提示 room／leave）。
  elements.advPrompt.textContent = "Go back to choose what to do next here.";
  elements.advFeedback.textContent = feedbackText;
  session.state.activeQuest = null;
  session.activeLesson = null;
  session.activeLessonMode = "job";
  session.advMode = "complete";
  elements.advScene.dataset.mode = "complete";
  elements.choiceList.innerHTML = "";
  elements.advActionFooter.innerHTML = "";
  // issue #143：答題完成統一 Back 回第一層場景選單；自第一層可續選 Shop／再聊／Work，於第一層 Leave 才退出場景。
  // 移除 #100/#138 完成畫面條件式「🎁 Shop」與「🏰 Back to Room」捷徑——兩層導覽一致後不再需要。
  addAdvOption("↩ Back", () => backToSceneMenu(completedHotspot), { navigation: true });
  elements.statusMessage.textContent = `Practice complete at ${completedHotspot.label}.`;
  persist();
  render();
  scheduleAdvFocus(0);
  // issue #93：公主以其音色朗讀所選正解，結束後再由 NPC 以其音色說結語。
  const endingLine = elements.advLine.textContent;
  speak(choice, playerVoiceProfile(), { source: "princess-answer-correct", then: () => speak(endingLine, npcVoiceFor(completedHotspot), { source: "npc-quest-ending" }) });
}

function closeAdv() {
  // issue #156：離開場景（關閉場景對話、切換場景或返回地圖之共同收口）即時收束正在播放之語音，
  // 避免語音殘留跨場景。Web Speech API 無法對進行中語句音量淡出（utterance.volume 於 speak() 固定、
  // 僅 cancel() 可停），故以即時 stop() 作為「約 1 秒淡出」目標聽感之明確降級。
  if (speechManager.isSpeaking()) speechManager.stop("scene-leave");
  // issue #164：離場結束本次造訪——清空歡迎詞旗標，使下次進入該場景重新播放一次歡迎詞。
  session.sceneVisitWelcomeId = "";
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  session.advMode = "closed";
  elements.advScene.dataset.mode = "closed";
  elements.advScene.classList.remove("adv-closet"); // issue #244：清除衣櫃 closet 標記
  session.state.activeQuest = null;
  session.activeLesson = null;
  session.activeShopHotspot = null;
  clearTryOnPreview({ renderDoll: false });
  setExpressions("normal", "normal");
  renderPaperDolls();
  persist();
  const focusTarget = activeViewName() === "home" ? elements.castleStage : activeViewName() === "world" ? elements.worldStage : elements.mapStage;
  focusTarget?.focus({ preventScroll: true });
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderDiary() {
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

function renderCollectionSummary() {
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

function renderSettings() {
  elements.speakToggleButton.textContent = `Voice: ${session.state.speechEnabled ? "On" : "Off"}`;
  if (elements.playMinutesInput) elements.playMinutesInput.value = String(session.state.playLimit.playMinutes);
  if (elements.restMinutesInput) elements.restMinutesInput.value = String(session.state.playLimit.restMinutes);
  renderBuildInfo(elements, buildInfo);
  renderAbout(elements, { copyright, versionHistory });
}

// issue #246：角色語音指定的設定 UI 已自玩家 Settings 移至管理設定工具的「聲音管理」頁籤（tool/voice-tuner.js），
// 沿用 render/settings.js 的 renderVoiceSettings 與本檔 speechManager 同一套指定 store；遊戲端僅保留 Voice On/Off 開關，
// 不再於 Settings 渲染角色語音清單（公開遊玩端未指定者一律自動依性別與語言選用）。

function buildSaveMarkdown() {
  return buildStateSaveMarkdown(session.state);
}

async function saveMarkdown() {
  return saveLoadController.saveMarkdown();
}

function loadMarkdownText(text) {
  return saveLoadController.loadMarkdownText(text);
}

async function loadMarkdown() {
  return saveLoadController.loadMarkdown();
}

function resetProgress() {
  session.state = freshState();
  persist();
  elements.statusMessage.textContent = "Progress reset. A new short talk is ready.";
  render();
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => changeView(tab.dataset.view)));
  window.addEventListener("hashchange", () => changeView(location.hash ? location.hash.slice(1) : "home"));
  elements.systemMenuButton.addEventListener("click", () => openSystemMenu(session.systemMenuPanel || "diary"));
  elements.switchPlayerQuickButton?.addEventListener("click", returnToInitialSelect);
  elements.changeCharacterButton?.addEventListener("click", () => openCharacterSelect({ forced: false }));
  elements.characterConfirm?.addEventListener("click", confirmCharacterSelect);
  elements.characterCancel?.addEventListener("click", cancelCharacterSelect);
  // issue #212：本機開發環境才揭示「衣物調整工具」dev 入口；正式發佈站保持 hidden、不接線。
  // 兩處入口（選公主、選帳號）共用同一閘門與導向，避免條件分歧。
  if (isLocalDevEnv()) {
    [elements.wardrobeTunerDevButton, elements.wardrobeTunerDevButtonAccount].forEach((button) => {
      if (!button) return;
      button.removeAttribute("hidden");
      button.addEventListener("click", () => {
        window.location.assign(WARDROBE_TUNER_DEV_PATH);
      });
    });
  }
  elements.characterSelect?.addEventListener("click", (event) => {
    if (event.target.matches("[data-character-cancel]") && !elements.characterSelect.classList.contains("first-run")) {
      cancelCharacterSelect();
    }
  });
  elements.playerNameInput?.addEventListener("input", () => { session.playerNameEdited = true; });
  elements.characterNameForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    confirmCharacterSelect();
  });
  elements.accountNewButton?.addEventListener("click", createNewAccount);
  elements.accountBack?.addEventListener("click", closeAccountSelect);
  elements.accountSelect?.addEventListener("click", (event) => {
    if (event.target.matches("[data-account-cancel]")) closeAccountSelect();
  });
  elements.systemMenuClose.addEventListener("click", closeSystemMenu);
  elements.systemMenu.addEventListener("click", (event) => {
    if (event.target.matches("[data-system-close]")) closeSystemMenu();
  });
  elements.systemMenuTabs.forEach((tab) => tab.addEventListener("click", () => changeSystemPanel(tab.dataset.menuPanel)));
  elements.goMapButton?.addEventListener("click", openWorldMap);
  elements.returnHomeButton?.addEventListener("click", () => openArea("castle"));
  elements.advAdjustBtn?.addEventListener("click", () => {
    if (!session.panelFocusItem) return;
    openAdjustOverlay({
      item: session.panelFocusItem,
      outfit: { ...session.state.outfit },
      renderer: paperDollRenderer,
      getCharacter: activePaperDollCharacter,
      onSave: patchWardrobeItem
    });
  });
  window.addEventListener("resize", _positionAdjustBtn, { passive: true });
  elements.speakPromptButton.addEventListener("click", () => playLessonAudio(elements.advLine.textContent, "en-US"));
  elements.speakPromptButtonZh?.addEventListener("click", () => playLessonAudio(session.activeOpeningZh, CHINESE_AUDIO_LANG));
  elements.saveButton.addEventListener("click", saveMarkdown);
  elements.loadButton.addEventListener("click", loadMarkdown);
  elements.loadFileInput.addEventListener("change", async () => {
    const file = elements.loadFileInput.files[0];
    if (!file) return;
    try {
      loadMarkdownText(await file.text());
    } catch (error) {
      elements.statusMessage.textContent = `Load failed: ${error.message}`;
    } finally {
      elements.loadFileInput.value = "";
    }
  });
  elements.speakToggleButton.addEventListener("click", () => {
    session.state.speechEnabled = !session.state.speechEnabled;
    if (!session.state.speechEnabled) speechManager.stop("voice-off");
    persist();
    renderSettings();
  });
  elements.playBreakResume?.addEventListener("click", resumePlayFromBreak);
  elements.playBreakMenuButton?.addEventListener("click", returnToInitialSelect);
  elements.playLimitForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyPlayLimitSettings();
  });
  elements.clearDiaryButton.addEventListener("click", () => {
    if (!window.confirm(`Clear ${princessName()}'s diary pages?`)) return;
    session.state.diary = [];
    persist();
    render();
  });
  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm(`Reset ${princessName()}'s coins, clothes, quests, and diary?`)) return;
    resetProgress();
  });
  window.addEventListener("resize", () => {
    if (elements.mapStage?.offsetParent !== null) renderMap();
    if (elements.worldStage?.offsetParent !== null) renderWorldMap();
    if (elements.castleStage?.offsetParent !== null) renderCastleMap();
  });
  elements.castleStage?.addEventListener("keydown", (event) => {
    const walkDirection = directionForKey(event.key);
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", -1);
    } else if (walkDirection) {
      // issue #178：自管連續走動（按住即時起步、免 OS 自動重複初始延遲）；同向重複 keydown 由控制器忽略。
      event.preventDefault();
      event.stopPropagation();
      mapWalkController.press(walkDirection, moveOnCastleMap);
    } else if ((event.key === "Enter" || event.key === " ") && session.activeCastleHotspot) {
      event.preventDefault();
      event.stopPropagation();
      interactCastleHotspot();
    }
  });
  elements.castleStage?.addEventListener("pointerdown", beginCastleMapDrag);
  elements.castleStage?.addEventListener("pointermove", moveCastleMapDrag);
  elements.castleStage?.addEventListener("pointerup", finishCastleMapDrag);
  elements.castleStage?.addEventListener("pointercancel", finishCastleMapDrag);
  elements.worldStage?.addEventListener("keydown", (event) => {
    const walkDirection = directionForKey(event.key);
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("world", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("world", -1);
    } else if (walkDirection) {
      // issue #178：自管連續走動（按住即時起步、免 OS 自動重複初始延遲）。
      event.preventDefault();
      event.stopPropagation();
      mapWalkController.press(walkDirection, moveOnWorldMap);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      openWorldDestination((nearbyWorldDestination() || activeWorldDestination())?.id);
    }
  });
  elements.worldStage?.addEventListener("pointerdown", beginWorldMapDrag);
  elements.worldStage?.addEventListener("pointermove", moveWorldMapDrag);
  elements.worldStage?.addEventListener("pointerup", finishWorldMapDrag);
  elements.worldStage?.addEventListener("pointercancel", finishWorldMapDrag);
  elements.mapStage.addEventListener("keydown", (event) => {
    const walkDirection = directionForKey(event.key);
    const areaId = activeTravelMapArea();
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard(areaId, 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard(areaId, -1);
    } else if (walkDirection) {
      // issue #178：自管連續走動（按住即時起步、免 OS 自動重複初始延遲）。
      event.preventDefault();
      event.stopPropagation();
      mapWalkController.press(walkDirection, moveOnMap);
    } else if ((event.key === "Enter" || event.key === " ") && session.activeHotspot) {
      event.preventDefault();
      event.stopPropagation();
      interactNearby();
    }
  });
  elements.mapStage.addEventListener("pointerdown", beginMapDrag);
  elements.mapStage.addEventListener("pointermove", moveMapDrag);
  elements.mapStage.addEventListener("pointerup", finishMapDrag);
  elements.mapStage.addEventListener("pointercancel", finishMapDrag);
  // issue #178：放開方向鍵／視窗失焦／分頁隱藏時清掉走動控制器的按住狀態，避免「鬆鍵仍續走」之卡走。
  window.addEventListener("keyup", (event) => {
    const walkDirection = directionForKey(event.key);
    if (walkDirection) mapWalkController.release(walkDirection);
  });
  window.addEventListener("blur", () => mapWalkController.clear());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) mapWalkController.clear();
  });
  window.addEventListener("keydown", (event) => {
    if (elements.characterSelect?.classList.contains("show")) {
      if (event.key === "Escape" && !elements.characterSelect.classList.contains("first-run")) {
        event.preventDefault();
        cancelCharacterSelect();
      }
      return;
    }
    if (isSystemMenuOpen()) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSystemMenu();
      }
      return;
    }
    if (!elements.advModal.classList.contains("show")) {
      if (
        (event.key === "Enter" || event.key === " ") &&
        elements.mapStage?.offsetParent !== null &&
        session.activeHotspot
      ) {
        event.preventDefault();
        interactNearby();
        return;
      }
      if (
        (event.key === "Enter" || event.key === " ") &&
        elements.worldStage?.offsetParent !== null &&
        session.activeWorldDestinationId
      ) {
        event.preventDefault();
        openWorldDestination(session.activeWorldDestinationId);
        return;
      }
      if ((event.key === "g" || event.key === "G") && elements.homeView?.classList.contains("active")) {
        event.preventDefault();
        openWorldMap();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeAdv();
      return;
    }
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      event.preventDefault();
      moveAdvFocus(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      moveAdvFocus(1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!confirmAdvFocus() && session.advMode === "complete") closeAdv();
      return;
    }
    if ((event.key === "b" || event.key === "B") && session.advMode === "shop") {
      event.preventDefault();
      buyItemInAdv(itemById(session.shopPreviewItemId));
      return;
    }
    if (/^[1-9]$/.test(event.key) && session.advMode === "quest") {
      const answerButtons = [...elements.choiceList.querySelectorAll("button[data-choice]")];
      const button = answerButtons[Number(event.key) - 1];
      if (button && !button.disabled) {
        event.preventDefault();
        button.click();
      }
    }
  });
}

Object.defineProperty(window, "__luminaraTest", {
  value: {
    saveRoundtrip() {
      const before = {
        activeCharacterId: session.state.activeCharacterId,
        playerName: session.state.playerName,
        coins: session.state.coins,
        energy: session.state.energy,
        difficulty: session.state.difficulty,
        outfit: { ...session.state.outfit },
        owned: [...session.state.owned],
        activeQuest: session.state.activeQuest?.id || ""
      };
      const markdown = buildSaveMarkdown();
      const hasMarkers = markdown.includes(saveMarkerStart) && markdown.includes(saveMarkerEnd);
      loadMarkdownText(markdown);
      const after = {
        activeCharacterId: session.state.activeCharacterId,
        playerName: session.state.playerName,
        coins: session.state.coins,
        energy: session.state.energy,
        difficulty: session.state.difficulty,
        outfit: { ...session.state.outfit },
        owned: [...session.state.owned],
        activeQuest: session.state.activeQuest?.id || ""
      };
      return {
        hasMarkers,
        roundtripSame: JSON.stringify(before) === JSON.stringify(after),
        before,
        after
      };
    }
  }
});


// issue #298 過渡：向 hub 註冊仍居 main 之跨模組函式（bootstrap 前；拆解完成後應清空改直接 import）。
Object.assign(hub, {
  activeViewName,
  allowedShopCategories,
  addDiary,
  addUnique,
  awardBadge,
  changeView,
  closeAdv,
  jobAvailableForPlace,
  openAdvBase,
  openRoomScene,
  openSceneAdv,
  persist,
  princessName,
  render,
  renderAreaNav,
  renderHome,
  scheduleAdvFocus,
  setAdvLine,
  showRewardBurst,
  updateProgressBadges
});

const hasSelftest = new URLSearchParams(location.search).has("selftest");
bindEvents();
render();
changeView(location.hash ? location.hash.slice(1) : "home");
// 本機多帳號 gate（issue #63 / spec#8）：每次進入都先選帳號，即使已有使用中帳號亦不自動沿用（共用裝置須每次選玩家）。
if (!hasSelftest) openAccountSelect({ mustChoose: true });
if (!hasSelftest) startPlayClock(); // selftest 模式由測試以注入時鐘自行驅動，不啟動真實 ticker。

installTestingHooks({
  get state() { return session.state; },
  set state(nextState) { session.state = nextState; },
  accounts: {
    list: listAccounts,
    activeId: getActiveAccountId,
    create: () => {
      const account = createFreshAccount();
      session.state = loadAccountState(account.id);
      return account;
    },
    select: (accountId) => {
      setActiveAccountId(accountId);
      session.state = loadAccountState(accountId);
      persist();
      render();
      return accountId;
    },
    remove: (accountId) => {
      const wasActive = getActiveAccountId() === accountId;
      deleteAccount(accountId);
      if (wasActive) session.state = freshState();
      return listAccounts().length;
    },
    loadState: (accountId) => loadAccountState(accountId)
  },
  syncActiveAccountMeta,
  openCharacterSelect,
  createNewAccount,
  cancelCharacterSelect,
  openAccountSelect,
  closeAccountSelect,
  returnToInitialSelect,
  profileColorPalette,
  defaultProfileColorFor,
  normalizeProfileColor,
  randomProfileColor,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomBackgroundPattern,
  // 遊玩時間限制與護眼休息（issue #6 / spec#9）測試介面：以注入時鐘驅動，不需真實等待。
  playClock: {
    now: () => clockNow(),
    setOffset: (ms) => { session.testClockOffset = Number(ms) || 0; },
    advance: (ms) => { session.testClockOffset += Number(ms) || 0; return clockNow(); },
    tick: () => tickPlayLimit(session.state, clockNow()),
    status: () => playStatus(session.state, clockNow()),
    resume: () => resumeFromRest(session.state, clockNow()),
    recordAnswer: (correct) => recordCycleAnswer(session.state, correct),
    extend: (minutes) => extendSession(session.state, clockNow(), minutes),
    get limit() { return session.state.playLimit; },
    setDurations: (playMinutes, restMinutes) => {
      session.state.playLimit.playMinutes = playMinutes;
      session.state.playLimit.restMinutes = restMinutes;
    },
    // issue #177：每場景打工每遊玩週期限答對一次測試介面。
    markJobDone: (place) => markJobDone(session.state, place),
    isJobDone: (place) => isJobDone(session.state, place),
    normalizeLimit: (candidate) => normalizePlayLimit(candidate)
  },
  get shopPreviewItemId() { return session.shopPreviewItemId; },
  set shopPreviewItemId(nextItemId) { session.shopPreviewItemId = nextItemId; },
  tryOnShopItem: (item) => toggleShopTryOn(typeof item === "string" ? itemById(item) : item),
  get shopCategory() { return session.shopCategory; },
  set shopCategory(nextCategory) { session.shopCategory = nextCategory; },
  $$,
  areaForHotspot,
  areaRegistry,
  allowedShopCategories,
  answerLesson,
  openQuestAdv,
  handleFirstLayerSceneAction,
  // issue #177：回傳場景第一層動作 handlerKey 清單（含本週期打工下架判斷），供 selftest 驗證「答對後 practice 下架」。
  firstLayerActionKeys: (place) => {
    const hotspot = hotspotById(place);
    return firstLayerActionsFor(hotspot, {
      hasLessons: hasLessonsForPlace(hotspot?.id),
      hasChat: hasChatForPlace(hotspot?.id),
      jobDoneThisCycle: isJobDone(session.state, hotspot?.id)
    }).map((action) => action.handlerKey);
  },
  backToSceneMenu,
  getActiveLesson: () => session.activeLesson,
  getAdvMode: () => session.advMode,
  buildAccountList,
  refreshAccountStatuses,
  buildSaveMarkdown,
  buyItemInAdv,
  castleMapNodes,
  characterScaleContract,
  characterRegistry,
  defaultActiveCharacterId,
  changeView,
  closeAdv,
  closeSystemMenu,
  createQuestForPlace,
  createRandomQuest,
  difficultyConfig,
  elements,
  // issue #212：dev-tooling 閘門，供 dev-tools selftest 純函式斷言與按鈕揭示驗證。
  isLocalDevHost,
  isLocalDevEnv,
  wardrobeTunerDevPath: WARDROBE_TUNER_DEV_PATH,
  equipOutfitItem,
  focusCastle: (place = "princessRoom") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "castle") throw new Error("Unknown castle hotspot");
    openArea("castle");
    focusCastleHotspot(hotspot.id);
  },
  focusUrban: (place = "garden") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "urban") throw new Error("Unknown urban hotspot");
    openArea("urban");
    focusTravelHotspot(hotspot.id, "urban");
  },
  focusRural: (place = "farm") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "rural") throw new Error("Unknown rural hotspot");
    openArea("rural");
    focusTravelHotspot(hotspot.id, "rural");
  },
  focusWild: (place = "elfGlade") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "wild") throw new Error("Unknown wild hotspot");
    openArea("wild");
    focusTravelHotspot(hotspot.id, "wild");
  },
  focusWorld: (destination = session.activeWorldDestinationId) => {
    const target = worldDestinationById(destination) || worldDestinationForArea(destination);
    if (!target) throw new Error("Unknown world destination");
    openWorldMap();
    focusWorldDestination(target.id);
  },
  freshState,
  getMapMetrics: (areaId = session.state.area) => {
    if (areaId !== "world" && !areaRegistry[areaId]) throw new Error("Unknown area");
    return areaMapMetrics(areaId);
  },
  hotspotById,
  interactNearby: interactCurrentLocation,
  categoryForType,
  categories,
  itemMatchesCategory,
  isWalkable,
  itemById,
  loadMarkdownText,
  mapActorMotionTypes,
  mapActorSnapshot: () => mapActorRuntime.snapshot(),
  mapNodes,
  moveOnMap,
  nodeMapForArea,
  normalizeState,
  openArea,
  openWorldDestination,
  openWorldMap,
  currentPlayerPoint,
  moveOnWorldMap,
  requestWorldTravel,
  finishWorldTravel,
  nearbyWorldDestination,
  openHintAdv,
  openQuestAdv,
  openRefundDetail,
  openRoomScene,
  openSceneAdv,
  openShopDetail,
  openSystemMenu,
  openWardrobeDetail,
  playableCharacterById,
  playableVoiceById,
  paperDollBaseLayer,
  wardrobeLayerBoundsByType,
  wardrobeLayerBoundsForType,
  persist,
  moveOnCastleMap,
  renderWorldMap,
  renderCastleMap,
  render,
  renderSettings,
  renderAdvShop,
  renderWardrobeDetail,
  renderRefundDetail,
  renderMap,
  refundItemInAdv,
  sceneConfigFor,
  composeVoiceProfile,
  resolveVoiceProfile,
  effectiveSpeechRate,
  speechRateScale: SPEECH_RATE_SCALE,
  speechQueueMode: SPEECH_QUEUE_MODE,
  speechDebounceMs: SPEECH_DEBOUNCE_MS,
  speakForTest: (text, voiceOrLang, options = {}) => speechManager.speak(text, voiceOrLang, { ...options, source: options.source || "selftest" }),
  selectSpeechVoice: (profile) => speechManager.selectVoice(profile || DEFAULT_VOICE_PROFILE),
  getSpeechDiagnostics: () => speechManager.diagnostics(),
  resetSpeechDiagnostics: () => speechManager.resetDiagnostics(),
  isSpeaking: () => speechManager.isSpeaking(),
  refreshSpeechVoices: () => speechManager.refreshVoices(),
  speechLeadingPad: SPEECH_LEADING_PAD,
  voiceAssignmentKey: VOICE_ASSIGNMENT_KEY,
  listSpeechVoices: () => speechManager.listVoices(),
  getVoiceAssignments: () => speechManager.getVoiceAssignments(),
  setVoiceAssignment: (gender, personality, voiceName) => speechManager.setVoiceAssignment(gender, personality, voiceName),
  clearVoiceAssignments: () => speechManager.clearVoiceAssignments(),
  usedVoiceBuckets,
  recommendedVoiceNamesForGender,
  renderVoiceSettings,
  npcVoiceFor,
  playerVoiceProfile,
  setMapViewport: (areaId, viewport = {}) => {
    if (areaId !== "world" && !areaRegistry[areaId]) throw new Error("Unknown area");
    applyAreaMapViewport(areaId, {
      pan: viewport.pan || { x: Number(viewport.x) || 0, y: Number(viewport.y) || 0 },
      zoom: Number(viewport.zoom) || 1
    });
    refreshAreaMapPositions(areaId);
  },
  shopItems,
  toggleEquip,
  worldMap
});
