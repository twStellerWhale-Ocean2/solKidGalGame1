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

// issue #178：鍵盤地圖走動參數——自管連續移動迴圈的步進間隔與各面移速，取代倚賴 OS 按鍵自動重複（消除起步停頓、加快移速）。
const MAP_WALK_STEP_MS = 33;   // 連續走動步進間隔（≈30 步/秒）；首步即時、之後每 33ms 推進，免 OS 自動重複初始延遲。
const MAP_WALK_SPEED = Object.freeze({ area: 2.0, castle: 1.9, world: 2.2 });   // 每步位移量（座標域 0–100；較前 1.45/1.35/1.6 提速約 ⅓）。
const mapWalkController = createKeyboardWalkController({ stepMs: MAP_WALK_STEP_MS });

let state = loadLocalState();
let activeHotspot = null;
let activeLesson = null;
let activeLessonMode = "job";   // issue #135：本次題目所屬互動模式 "job"（打工→coins）/"chat"（聊天→心情＋延長時間）
let advMode = "closed";
let advChineseUsed = false;   // issue #73：本題是否按過中文撥放（按過＝該題無獎勵）
let advWrongAttempts = 0;          // issue #73：本題答錯次數（0→全額、1→半額、≥2→無）
let activeOpeningZh = "";           // issue #73：本題題目（advLine）的中文，無則空字串
const CHINESE_AUDIO_LANG = "zh-TW";     // design paramChineseAudioLang
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
const SPEECH_RATE_SCALE = 0.9;          // issue #109 design paramSpeechRateScale：全域朗讀語速倍率（套用於所有發聲）；issue #149 調整 0.8→0.9
const SPEECH_QUEUE_MODE = "replace-last";
const SPEECH_DEBOUNCE_MS = 120;
const SPEECH_LEADING_PAD = "　　　　　　　　"; // issue #134 design paramSpeechLeadingPad：送入 utterance 前於開頭加入前置留白，延後首字、改善開頭清楚度（8 個全形空白 U+3000）
// issue #134/#246 design paramVoiceAssignmentKey：角色語音指定之全機（device-wide）儲存鍵與讀寫邏輯移入 state/voice-assignments.js（遊戲與管理工具共用單一來源）。
const SPEECH_DIAGNOSTICS_MAX = 80;
let shopCategory = "outfit";
let activeShopHotspot = null;
// issue #164：本次場景造訪已播歡迎詞之 hotspot id。同一造訪內返回第一層場景選單不重播歡迎詞，
// 離場（closeAdv／openArea 場景切換）清空，使下次造訪重新播放一次。為暫態、不持久化存檔。
let sceneVisitWelcomeId = "";
let wardrobeCategory = "outfit";
let princessExpression = "normal";
let npcExpression = "normal";
let advFocusIndex = 0;
let advFocusTimer = 0;
let shopPreviewItemId = "";
// 商店多件同時試穿：累加試穿中的商品 id（沿用同一個試穿娃娃，依各自部位疊穿）。
let shopTryOnIds = [];
// issue #272：面板目前聚焦的單品（商店或衣櫃），用以驅動公主右上角「調整」浮動按鈕。
let panelFocusItem = null;
const mapZoomLimits = { min: 1, max: 2.2, mobileBaseScale: 1.06 };
const areaMapIds = ["castle", "urban", "rural", "wild", "world"];
let mapGesture = null;
let pendingMapPositionFrame = 0;
let pendingMapRefreshArea = "";
let systemMenuPanel = "diary";
let activeCastleHotspot = null;
let activeWorldDestinationId = "castle";
// issue #99：世界地圖「點選地點 → 公主走到再進入」進行中的目的地與計時器（null＝未在移動）。
let worldTravelTargetId = null;
let worldTravelTimer = null;
const WORLD_TRAVEL_MS = 620; // 走到目的地時長；與 .world-player.traveling 之 CSS transition 對齊
let pendingCharacterId = state.activeCharacterId;
let pendingProfileColor = state.profileColor || defaultProfileColorFor(state.activeCharacterId);
// issue #131：選角流程進行中的背景花紋（per-account 視覺主題，spec#6）。
let pendingBackgroundPattern = normalizeBackgroundPattern(state.backgroundPattern);
let playerNameEdited = false;
let profileColorEdited = false;
let testClockOffset = 0;   // 測試用合成時鐘偏移（ms）；正式遊玩恆為 0，由 selftest hook 注入。
let playClockTimer = 0;     // setInterval id（0 = 未啟動）
let playBreakShown = false; // 結算／休息 overlay 是否顯示中

const elements = createElements();
const areaMapViewportController = createAreaMapViewportController({
  areaIds: areaMapIds,
  clamp,
  getImageSize: areaMapImageSize,
  getStage: areaMapStage,
  isMobile: isMobileTravelMap,
  zoomLimits: mapZoomLimits
});
const paperDollRenderer = createPaperDollRenderer({
  baseLayer: paperDollBaseLayer,
  getCharacter: activePaperDollCharacter,
  itemById,
  layerOrder: paperDollLayerOrder
});
const advControls = createAdvControls({
  elements,
  getFocusIndex: () => advFocusIndex,
  getMode: () => advMode,
  setFocusIndex: (nextIndex) => { advFocusIndex = nextIndex; }
});
const mapActorRuntime = createMapActorRuntime({
  assetUrl: domAssetUrl,
  layer: elements.mapLifeLayer,
  pointToStage: mapPointToStage
});
const saveLoadController = createSaveLoadController({
  buildSaveMarkdown,
  elements,
  normalizeState,
  onStateLoaded(nextState) { state = nextState; },
  persist,
  render
});

function persist() {
  persistState(state);
  syncActiveAccountMeta({ touched: true });
}

// ---- 遊玩時間限制與護眼休息（issue #6 / spec#9）：ticker、HUD 與結算／休息 overlay ----

function clockNow() {
  return Date.now() + testClockOffset;
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

function profileColorFor(characterId = state.activeCharacterId, color = state.profileColor) {
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
  const { baseMinutes, bonusMinutes } = playAllowance(state);
  elements.playTimeValue.innerHTML = bonusMinutes > 0
    ? `${baseMinutes} <span class="play-time-bonus">+${bonusMinutes}😄</span> min`
    : `${baseMinutes} min`;
}

// 更新人物資訊欄時間顯示：可玩時間額度 + 剩餘可玩時間（不以百分比為主，sysCase#7.5）。
// 接受 playStatus() 或 tick() 之結果（兩者皆帶 phase/energyPercent/playRemainingMs/restRemainingMs）。
function updateEnergyHudFromStatus(status, now = clockNow()) {
  state.energy = status.phase === "rest" ? 0 : Math.min(100, Math.max(0, Math.round(Number(status.energyPercent) || 0)));
  renderPlayTimeAllowance();
  if (!elements.timeLeftValue) return;
  if (status.phase === "rest") {
    elements.timeLeftValue.textContent = `Rest ${formatClock(status.restRemainingMs)}`;
  } else if (status.phase === "play") {
    elements.timeLeftValue.textContent = formatClock(status.playRemainingMs);
  } else {
    elements.timeLeftValue.textContent = formatClock((state.playLimit?.playMinutes || 15) * 60000);
  }
}

function updateProfileColorChrome() {
  const color = profileColorFor();
  document.documentElement.style.setProperty("--active-profile-color", color);
  // 資訊欄大頭照已改為即時穿搭紙娃娃 bust（由 renderPaperDolls 填層）；此處僅同步識別色與背景花紋。
  elements.sideProfileAvatar?.style.setProperty("--profile-color", color);
  applyCardPattern(elements.sideProfileFrame, state.backgroundPattern);
  // issue #161：地圖公主 token 已移除識別色橢圓背板，不再於地圖 token 注入 --profile-color（識別色僅用於資訊欄與帳號卡）。
}

function syncActiveAccountMeta({ touched = false } = {}) {
  const activeAccountId = getActiveAccountId();
  if (!activeAccountId) return;
  updateAccountMeta(activeAccountId, {
    name: state.playerName,
    characterId: state.activeCharacterId,
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
  const status = playStatus(state, now);
  updateEnergyHudFromStatus(status, now);
}

// 每秒一拍：依真實時間推進，時間到顯示結算並進入休息，休息屆滿開放續玩。
function tickPlayClock() {
  if (!playClockActive()) return;
  const now = clockNow();
  const ev = tickPlayLimit(state, now);
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
  if (playClockTimer) return;
  tickPlayClock();
  playClockTimer = window.setInterval(tickPlayClock, 1000);
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
  if (!playBreakShown) {
    elements.playBreak?.classList.add("show");
    elements.playBreak?.setAttribute("aria-hidden", "false");
    document.body.classList.add("play-break-open");
    playBreakShown = true;
    elements.playBreak?.querySelector(".play-break-card")?.focus({ preventScroll: true });
  }
  // 休息屆滿、續玩鈕由禁用轉為可用時，移焦點到續玩鈕（鍵盤可直接續玩、不卡關）。
  if (restDone && resumeWasDisabled) elements.playBreakResume?.focus({ preventScroll: true });
}

function hidePlayBreak() {
  if (!playBreakShown) return;
  elements.playBreak?.classList.remove("show");
  elements.playBreak?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("play-break-open");
  playBreakShown = false;
}

// 休息屆滿後按「Play again」續玩；休息未滿則不動作（不可繞過休息）。
function resumePlayFromBreak() {
  if (!resumeFromRest(state, clockNow())) return;
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
  state.playLimit.playMinutes = toMinutes(elements.playMinutesInput?.value);
  state.playLimit.restMinutes = toMinutes(elements.restMinutesInput?.value);
  persist();
  renderSettings();
  elements.statusMessage.textContent = `Play ${state.playLimit.playMinutes} min, rest ${state.playLimit.restMinutes} min.`;
}

function ensureUrbanPosition() {
  if (mapNodes[state.playerNode]) return;
  const node = mapNodes[areaRegistry.urban.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function ensureCastlePosition() {
  if (castleMapNodes[state.playerNode]) return;
  const node = castleMapNodes[areaRegistry.castle.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function ensureAreaPosition(areaId = state.area) {
  if (areaId === "castle") {
    ensureCastlePosition();
    return;
  }
  if (areaId === "urban") {
    ensureUrbanPosition();
    return;
  }
  const area = areaRegistry[areaId];
  const nodes = area?.nodes || {};
  if (nodes[state.playerNode]) return;
  const node = nodes[area?.defaultNode] || Object.values(nodes)[0];
  if (!node) return;
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function worldDestinationById(destinationId) {
  return worldMap.destinations.find((destination) => destination.id === destinationId) || null;
}

function worldDestinationForArea(areaId) {
  return worldMap.destinations.find((destination) => destination.area === areaId) || null;
}

function enabledWorldDestinations() {
  return worldMap.destinations.filter((destination) => destination.enabled);
}

function activeWorldDestination() {
  return worldDestinationById(activeWorldDestinationId) || worldDestinationForArea(state.area) || enabledWorldDestinations()[0] || worldMap.destinations[0] || null;
}

function openArea(areaId) {
  const area = areaRegistry[areaId];
  if (!area?.enabled) {
    elements.statusMessage.textContent = `${area?.label || "This area"} is not open yet.`;
    return;
  }
  // issue #164：場景切換亦結束本次造訪——清空歡迎詞旗標，使進入新區地點時重新播放一次歡迎詞。
  sceneVisitWelcomeId = "";
  state.area = areaId;
  ensureAreaPosition(areaId);
  areaMapViewportController.requestCenter(areaId);
  persist();
  changeView(area.view);
  renderAreaNav();
}

function openWorldMap() {
  activeHotspot = null;
  activeCastleHotspot = null;
  activeWorldDestinationId = worldDestinationForArea(state.area)?.id || activeWorldDestinationId || "castle";
  areaMapViewportController.requestCenter("world");
  elements.statusMessage.textContent = "Choose a kingdom area.";
  changeView("world");
}

function changeView(viewName) {
  mapWalkController.clear();   // issue #178：切換畫面即停走動，避免按住狀態跨畫面殘留卡走
  if (["diary", "settings", "english", "save"].includes(viewName)) {
    openSystemMenu(viewName);
    return;
  }
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  if (viewName === "home") {
    state.area = "castle";
    ensureCastlePosition();
  } else if (viewName === "map") {
    if (state.area === "castle" || !areaRegistry[state.area]?.enabled) state.area = "urban";
    ensureAreaPosition(state.area);
  } else if (viewName === "world") {
    activeWorldDestinationId = worldDestinationForArea(state.area)?.id || activeWorldDestinationId || "castle";
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
  systemMenuPanel = panel;
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
  applyStateEffects(state, effects);
}

function addDiary(entry) {
  addStateDiary(state, entry);
}

function addUnique(listName, values) {
  addStateUnique(state, listName, values);
}

function awardBadge(id) {
  awardStateBadge(state, id);
}

function updateProgressBadges() {
  updateStateProgressBadges(state);
}

function setExpressions(princess = "normal", npc = "normal") {
  princessExpression = princess;
  npcExpression = npc;
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.dataset.expression = princessExpression;
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
  elements.coinValue.textContent = state.coins;
}

// 玩家公主的名字為使用者設定；遊戲內稱呼一律取此值（世界觀／品牌名 Luminara 不在此列）。
function princessName() {
  return state.playerName || playableCharacterById(state.activeCharacterId)?.defaultName || "Lumi";
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
  pendingCharacterId = state.activeCharacterId;
  pendingProfileColor = profileColorFor(state.activeCharacterId, state.profileColor);
  pendingBackgroundPattern = normalizeBackgroundPattern(state.backgroundPattern);
  profileColorEdited = profileColorFor(state.activeCharacterId, state.profileColor) !== defaultProfileColorFor(state.activeCharacterId);
  // 既有的自訂名字（與目前角色預設名不同）視為玩家已輸入，切換外觀時不覆蓋。
  const activeDefaultName = playableCharacterById(state.activeCharacterId)?.defaultName;
  playerNameEdited = Boolean(state.playerName) && state.playerName !== activeDefaultName;
  buildCharacterCards();
  buildProfileColorChoices();
  buildBackgroundPatternChoices();
  elements.playerNameInput.value = state.playerName || playableCharacterById(pendingCharacterId)?.defaultName || "";
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
    card.setAttribute("aria-checked", String(character.id === pendingCharacterId));
    const portrait = document.createElement("span");
    portrait.className = "character-portrait";
    // 單一頭胸來源：選角卡與側欄／帳號卡 bust 一律以公主身上「即時穿搭」（state.outfit）渲染，
    // 不再另引用 defaultOutfit——杜絕第二套外觀來源，換髮型／衣物時所有頭胸照同步反映、永不分歧。
    renderBustInto(portrait, character.id, state.outfit, character.id === pendingCharacterId ? pendingProfileColor : character.defaultProfileColor, character.id === pendingCharacterId ? pendingBackgroundPattern : "none");
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
  pendingCharacterId = characterId;
  if (!profileColorEdited) pendingProfileColor = defaultProfileColorFor(characterId);
  [...elements.characterGrid.querySelectorAll(".character-card")].forEach((card) => {
    card.setAttribute("aria-checked", String(card.dataset.characterId === characterId));
    const portrait = card.querySelector(".character-portrait");
    const color = card.dataset.characterId === characterId ? pendingProfileColor : defaultProfileColorFor(card.dataset.characterId);
    // 切換選取只需更新識別底色與花紋；基本造型 bust 層不隨色變，毋須重渲染。
    portrait?.style.setProperty("--active-profile-color", color);
    portrait?.style.setProperty("--profile-color", color);
    applyCardPattern(portrait, card.dataset.characterId === characterId ? pendingBackgroundPattern : "none");
  });
  buildProfileColorChoices();
  if (!playerNameEdited) {
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
    button.setAttribute("aria-checked", String(color === pendingProfileColor));
    button.addEventListener("click", () => {
      pendingProfileColor = color;
      profileColorEdited = true;
      buildProfileColorChoices();
      buildCharacterCards();
    });
    elements.profileColorGrid.appendChild(button);
  });
  // issue #131：調色器自訂色入口（spec#6）。色盤外的任一色由此設定，並標記為作用中。
  if (elements.profileColorPicker) {
    const customActive = !profileColorPalette.includes(pendingProfileColor);
    elements.profileColorPicker.value = /^#[0-9a-fA-F]{6}$/.test(pendingProfileColor) ? pendingProfileColor : defaultProfileColorFor(pendingCharacterId);
    elements.profileColorPicker.closest(".profile-color-custom")?.classList.toggle("is-active", customActive);
    elements.profileColorPicker.oninput = (event) => {
      pendingProfileColor = event.target.value;
      profileColorEdited = true;
      buildProfileColorChoices();
      buildCharacterCards();
    };
  }
}

// issue #131：背景花紋選擇器（spec#6）。每個花紋一個預覽 swatch；選定即更新 pendingBackgroundPattern 並反映於選角卡。
function buildBackgroundPatternChoices() {
  if (!elements.backgroundPatternGrid) return;
  elements.backgroundPatternGrid.innerHTML = "";
  backgroundPatternIds.forEach((pattern) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "background-pattern-swatch";
    if (pattern !== "none") button.dataset.pattern = pattern;
    button.style.setProperty("--active-profile-color", pendingProfileColor);
    button.style.setProperty("--profile-color", pendingProfileColor);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", pattern === "none" ? "No pattern" : `Use background pattern ${pattern}`);
    button.setAttribute("aria-checked", String(pattern === pendingBackgroundPattern));
    if (pattern === "none") button.textContent = "—";
    button.addEventListener("click", () => {
      pendingBackgroundPattern = pattern;
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
  if (isStarterWardrobeItem(state.outfit.hairstyle, "hairstyle") && starterOutfit.hairstyle) {
    state.outfit.hairstyle = starterOutfit.hairstyle;
  }
  if (isStarterWardrobeItem(state.outfit.outfit, "outfit") && starterOutfit.outfit) {
    state.outfit.outfit = starterOutfit.outfit;
  }
}

function confirmCharacterSelect() {
  const character = playableCharacterById(pendingCharacterId);
  state.activeCharacterId = character.id;
  applyCharacterStarterOutfit(character);
  state.profileColor = profileColorFor(character.id, pendingProfileColor);
  state.backgroundPattern = normalizeBackgroundPattern(pendingBackgroundPattern);
  state.playerName = sanitizePlayerName(elements.playerNameInput.value) || character.defaultName;
  persist();
  const activeAccountId = getActiveAccountId();
  if (activeAccountId) syncActiveAccountMeta({ touched: true });
  pendingNewAccount = null; // issue #153：已確認創角，此新帳號不再是可丟棄的待定帳號。
  closeCharacterSelect();
  render();
  elements.statusMessage.textContent = `${princessName()} is ready. Choose a place to start.`;
}

// issue #153：取消創角。若為「既有帳號下新增」之未確認新帳號，丟棄該空帳號並返回帳號選擇（還原先前使用中帳號）；
// 一般換角（changeCharacter）或無待定新帳號時，僅關閉覆蓋層。
function cancelCharacterSelect() {
  if (pendingNewAccount) {
    const { id, prevActiveId, prevMustChoose } = pendingNewAccount;
    pendingNewAccount = null;
    deleteAccount(id); // 丟棄此新建空帳號（刪到使用中帳號會清空 activeId）。
    const restoreId = prevActiveId && listAccounts().some((account) => account.id === prevActiveId) ? prevActiveId : null;
    if (restoreId) {
      setActiveAccountId(restoreId);
      state = loadAccountState(restoreId);
    } else {
      state = freshState();
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
let accountSelectMustChoose = false;
// issue #153：自帳號選擇「新增」進入創角時，於既有帳號情境下記下待定新帳號（含先前使用中帳號與帳號選擇模式），供取消時丟棄並返回。
let pendingNewAccount = null;
// issue #169：帳號選擇開啟期間每秒重算各帳號卡狀態，使休息倒數實際遞減、休息屆滿即時轉 Ready（非開啟當下的凍結快照）。
let accountStatusTimer = null;
function openAccountSelect({ mustChoose = false } = {}) {
  accountSelectMustChoose = mustChoose;
  buildAccountList();
  elements.accountSelect.classList.add("show");
  elements.accountSelect.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-select-open");
  startAccountStatusTicker();
  setTimeout(() => elements.accountSelectCard?.focus({ preventScroll: true }), 0);
}

function closeAccountSelect() {
  // 啟動 gate 或尚無使用中帳號時不可關閉（必須先選或新增帳號）。
  if (accountSelectMustChoose || !getActiveAccountId()) return;
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
  if (accountStatusTimer) return;
  accountStatusTimer = window.setInterval(refreshAccountStatuses, 1000);
}

function stopAccountStatusTicker() {
  if (!accountStatusTimer) return;
  window.clearInterval(accountStatusTimer);
  accountStatusTimer = null;
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
  if (elements.accountBack) elements.accountBack.hidden = accountSelectMustChoose || !activeId;
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
  state = loadAccountState(accountId);
  syncActiveAccountMeta({ touched: true });
  persist();
  accountSelectMustChoose = false; // 已完成本次進入的帳號選擇
  closeAccountSelect();
  render();
  changeView("home");
  if (!state.playerName) {
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
  const prevMustChoose = accountSelectMustChoose;
  const account = createFreshAccount();
  state = loadAccountState(account.id);
  syncActiveAccountMeta({ touched: true });
  accountSelectMustChoose = false;
  closeAccountSelect();
  render();
  changeView("home");
  pendingNewAccount = hadAccounts ? { id: account.id, prevActiveId, prevMustChoose } : null;
  openCharacterSelect({ forced: true, cancelable: hadAccounts });
}

function handleDeleteAccount(accountId, label) {
  if (!window.confirm(`Delete player "${label}"? This removes that player's progress on this device.`)) return;
  const wasActive = getActiveAccountId() === accountId;
  deleteAccount(accountId);
  if (wasActive) state = freshState(); // 刪到使用中帳號：清掉當前狀態，交回帳號選擇。
  buildAccountList();
}

function outfitSummary() {
  return stateOutfitSummary(state);
}

function renderPaperDolls() {
  paperDollRenderer.renderPaperDolls(state.outfit, princessExpression, activePaperDollCharacter());
  renderActiveTryOnDoll();
}

function avatarMarkup(surface, outfitState = state.outfit) {
  return paperDollRenderer.avatarMarkup(surface, outfitState, activePaperDollCharacter());
}

// 頭胸 bust 紙娃娃層（issue #132）：供帳號卡以各帳號自己的角色＋穿搭渲染即時衣著（資訊欄則由 renderPaperDolls 以使用中狀態填層）。
function bustMarkupFor(characterId, outfitState) {
  return paperDollRenderer.avatarMarkup("side-bust", outfitState || {}, playableCharacterById(characterId));
}

function activePaperDollCharacter() {
  return playableCharacterById(state.activeCharacterId);
}

function tryOnOutfitFor(item) {
  const previewOutfit = { ...state.outfit };
  if (isWearableItem(item)) equipOutfitItem(item, previewOutfit);
  return previewOutfit;
}

function renderAdvDoll(outfitState, isTryOn = false) {
  const doll = elements.advScene?.querySelector('[data-doll="adv"]');
  if (!doll) return;
  doll.innerHTML = avatarMarkup("adv", outfitState);
  doll.dataset.hairstyle = outfitState.hairstyle || "none";
  doll.dataset.outfit = outfitState.outfit || "none";
  doll.dataset.shoes = outfitState.shoes || "none";
  doll.dataset.headTop = outfitState.headTop || "none";
  doll.dataset.headSide = outfitState.headSide || "none";
  doll.dataset.faceEyes = outfitState.faceEyes || "none";
  doll.dataset.faceMask = outfitState.faceMask || "none";
  doll.dataset.neck = outfitState.neck || "none";
  doll.dataset.hand = outfitState.hand || "none";
  doll.dataset.expression = princessExpression;
  doll.classList.toggle("try-on-active", isTryOn);
}

function activeTryOnItem() {
  if (advMode !== "shop" && advMode !== "wardrobe" && advMode !== "refund") return null;
  const item = itemById(shopPreviewItemId);
  return item && item.type !== "room" ? item : null;
}

function shopTryOnItems() {
  return shopTryOnIds.map((id) => itemById(id)).filter((item) => item && item.type !== "room");
}

function tryOnOutfitForItems(items) {
  const previewOutfit = { ...state.outfit };
  items.forEach((item) => {
    if (isWearableItem(item)) equipOutfitItem(item, previewOutfit);
  });
  return previewOutfit;
}

function renderActiveTryOnDoll() {
  // 商店：以累加的試穿清單疊穿多件；其餘模式（衣櫥／退款）維持單件預覽。
  if (advMode === "shop") {
    const items = shopTryOnItems();
    renderAdvDoll(items.length ? tryOnOutfitForItems(items) : state.outfit, items.length > 0);
    return;
  }
  const item = activeTryOnItem();
  if (!item) {
    renderAdvDoll(state.outfit, false);
    return;
  }
  renderAdvDoll(tryOnOutfitFor(item), true);
}

function clearTryOnPreview({ renderDoll = true } = {}) {
  shopPreviewItemId = "";
  updateAdvAdjustBtn(null);
  if (renderDoll) renderPaperDolls();
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
    button.className = `area-button${state.area === area.id ? " active" : ""}`;
    button.setAttribute("aria-current", state.area === area.id ? "page" : "false");
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

function renderWardrobeTabs() {
  elements.wardrobeTabs.innerHTML = "";
  categories.forEach((category) => {
    const ownedCount = shopItems.filter((item) => itemMatchesCategory(item, category.id) && state.owned.includes(item.id)).length;
    if (!ownedCount) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab wardrobe-accordion-tab${wardrobeCategory === category.id ? " active" : ""}`;
    button.textContent = `${category.label} ${ownedCount}`;
    button.addEventListener("click", () => {
      wardrobeCategory = wardrobeCategory === category.id ? "" : category.id;
      renderHome();
    });
    elements.wardrobeTabs.appendChild(button);
  });
}

function renderCategoryTabs(container, active, onClick, includeOwnedOnly = false, allowedCategories = null) {
  container.innerHTML = "";
  categories.forEach((category) => {
    if (allowedCategories && !allowedCategories.includes(category.id)) return;
    if (includeOwnedOnly && !shopItems.some((item) => itemMatchesCategory(item, category.id) && state.owned.includes(item.id))) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${active === category.id ? " active" : ""}`;
    button.textContent = category.label;
    button.addEventListener("click", () => onClick(category.id));
    container.appendChild(button);
  });
}

function renderWardrobe() {
  renderWardrobeTabs();
  elements.wardrobeGrid.innerHTML = "";
  const ownedGroups = categories.map((category) => ({
    category,
    items: shopItems.filter((item) => itemMatchesCategory(item, category.id) && state.owned.includes(item.id))
  })).filter((group) => group.items.length);

  if (!ownedGroups.length) {
    elements.wardrobeGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in town.</div>`;
    return;
  }

  ownedGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "wardrobe-section";
    section.innerHTML = `
      <div class="wardrobe-section-title">
        <strong>${group.category.label}</strong>
        <span>${group.items.length}</span>
      </div>
      <div class="wardrobe-section-items"></div>
    `;
    const list = section.querySelector(".wardrobe-section-items");
    group.items.forEach((item) => {
      list.appendChild(createItemCard(item, {
        mode: "wardrobe",
        action: () => toggleEquip(item)
      }));
    });
    elements.wardrobeGrid.appendChild(section);
  });
}

function createItemCard(item, options = {}) {
  const owned = state.owned.includes(item.id);
  const equipped = isItemEquipped(item);
  const affordable = state.coins >= item.cost;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-card ${item.type}${options.mode ? ` ${options.mode}-item-card` : ""}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!owned && !affordable ? " locked" : ""}${options.selected ? " selected" : ""}`;
  button.dataset.itemId = item.id;
  const previewStyle = itemPreviewStyle(item);
  button.innerHTML = `
    <span class="item-preview item-art item-image" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span class="item-state">${owned ? equipped ? "Equipped" : "Owned" : `${item.cost} coins`}</span>
    <small class="item-category">${categoryLabel(item.type)}</small>
  `;
  button.addEventListener("click", options.action || (() => {}));
  return button;
}

function itemPreviewStyle(item) {
  return `--item-img:url('${cssAssetUrl(item.image)}')`;
}

function cssAssetUrl(src) {
  const path = src?.startsWith("content-package/") || src?.startsWith("content-base/") ? `../${src}` : src;
  return path?.replaceAll("'", "%27");
}

function domAssetUrl(src) {
  return (src || "").replaceAll('"', "%22");
}

function isWearableItem(item) {
  return item && item.type !== "room";
}

function isItemEquipped(item, outfit = state.outfit) {
  if (!item) return false;
  if (item.type === "room") return outfit.room === item.id;
  return outfit[item.type] === item.id;
}

function equipOutfitItem(item, outfit = state.outfit) {
  if (!item) return outfit;
  if (item.type === "room") {
    outfit.room = item.id;
    return outfit;
  }
  outfit[item.type] = item.id;
  return normalizeVisibleOutfit(outfit);
}

function unequipOutfitItem(item, outfit = state.outfit) {
  if (!item || item.type === "room") return outfit;
  outfit[item.type] = "none";
  return normalizeVisibleOutfit(outfit);
}

function normalizeVisibleOutfit(outfit = state.outfit) {
  if (!outfit.hairstyle || outfit.hairstyle === "none") outfit.hairstyle = "softBrownHair";
  // #251：身上恆有整件 outfit（無分件上下身）；空 outfit 退回 starter 整件，避免下半身裸露。
  if (!outfit.outfit || outfit.outfit === "none") outfit.outfit = "starterPajama";
  return outfit;
}

function toggleEquip(item) {
  if (item.type === "room") {
    state.outfit.room = item.id;
    elements.statusMessage.textContent = `${item.name} is placed in ${princessName()}'s room.`;
    persist();
    render();
    return;
  }
  if (isItemEquipped(item)) {
    unequipOutfitItem(item);
    elements.statusMessage.textContent = `${item.name} removed.`;
  } else {
    equipOutfitItem(item);
    elements.statusMessage.textContent = `${item.name} equipped.`;
  }
  persist();
  render();
}

function areaMapStage(areaId) {
  if (areaId === "world") return elements.worldStage;
  return areaId === "castle" ? elements.castleStage : elements.mapStage;
}

function areaMapImageSize(areaId) {
  if (areaId === "world") return worldMap.imageSize;
  return areaRegistry[areaId]?.imageSize || mapImageSize;
}

function areaMapViewport(areaId) {
  return areaMapViewportController.viewport(areaId);
}

function activeTravelMapArea() {
  return state.area !== "castle" && areaRegistry[state.area]?.enabled ? state.area : "urban";
}

function baseAreaMapDisplay(areaId, rect) {
  return areaMapViewportController.baseDisplay(areaId, rect);
}

function clampAreaMapViewport(areaId, viewport, rect = null) {
  return areaMapViewportController.clampViewport(areaId, viewport, rect);
}

function areaMapMetrics(areaId, viewportOverride = null) {
  return areaMapViewportController.metrics(areaId, viewportOverride);
}

function syncAreaMapStyles(areaId, metrics = areaMapMetrics(areaId)) {
  areaMapViewportController.syncStyles(areaId, metrics);
}

function centerAreaMapOnPoint(areaId, x, y) {
  areaMapViewportController.centerOnPoint(areaId, x, y);
}

function zoomAreaMapAtStagePoint(areaId, stageX, stageY, zoomFactor) {
  areaMapViewportController.zoomAtStagePoint(areaId, stageX, stageY, zoomFactor);
  refreshAreaMapPositions(areaId);
}

function zoomAreaMapFromKeyboard(areaId, direction) {
  areaMapViewportController.zoomFromKeyboard(areaId, direction);
  refreshAreaMapPositions(areaId);
}

function centerAreaMapOnCurrentPlayer(areaId) {
  const point = currentPlayerPoint(areaId);
  if (!point) return;
  centerAreaMapOnPoint(areaId, point.x, point.y);
}

function centerAreaMapIfRequested(areaId) {
  areaMapViewportController.centerIfRequested(areaId, currentPlayerPoint(areaId));
}

function castleCoverMetrics() {
  return areaMapMetrics("castle");
}

function castlePointToStage(x, y, metrics = castleCoverMetrics()) {
  return areaMapViewportController.pointToStage(x, y, metrics);
}

function positionCastleElement(element, x, y, metrics = castleCoverMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

function currentPlayerPoint(areaId) {
  if (areaId === "world") {
    if (typeof state.world?.x === "number" && typeof state.world?.y === "number") return state.world;
    const destination = activeWorldDestination();
    return destination ? { x: destination.x, y: destination.y } : null;
  }
  const nodes = nodeMapForArea(areaId);
  const fallback = nodes[state.playerNode] || nodes[areaRegistry[areaId]?.defaultNode];
  if (
    state.area === areaId &&
    typeof state.player?.x === "number" &&
    typeof state.player?.y === "number"
  ) {
    return state.player;
  }
  return fallback || null;
}

function nearbyAreaHotspot(areaId, defaultRadius = 6.8) {
  const nodes = nodeMapForArea(areaId);
  const player = currentPlayerPoint(areaId);
  if (!player) return null;
  const candidates = (areaRegistry[areaId]?.locations || []).map((hotspot) => {
    const node = nodes[hotspot.node];
    if (!node) return null;
    const radius = hotspot.focusRadius || defaultRadius;
    const distance = Math.hypot(node.x - player.x, (node.y - player.y) * 1.18);
    const score = distance / radius;
    return { hotspot, distance, score, radius };
  }).filter((candidate) => candidate && candidate.distance <= candidate.radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
  return candidates[0].hotspot;
}

function renderCastleMap() {
  if (!elements.castleStage || !elements.castleMarkerLayer) return;
  if (elements.castleStage.offsetParent === null && activeViewName() !== "home") return;
  centerAreaMapIfRequested("castle");
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  // issue #226：城堡固定比例地圖之視口 letterbox 留白模糊鋪底來源（同地圖機制 --map-backdrop-image）。
  if (areaRegistry.castle?.mapImage) {
    elements.castleStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(areaRegistry.castle.mapImage)}")`);
  }
  elements.castleMarkerLayer.innerHTML = "";
  castleHotspots.forEach((hotspot) => {
    const node = castleMapNodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    const isPortal = hotspot.kind === "gate" || hotspot.markerStyle === "portal";
    marker.type = "button";
    marker.className = `map-marker hotspot castle-marker${isShopHotspot(hotspot) ? " shop" : ""}${activeCastleHotspot?.id === hotspot.id ? " nearby" : ""}${hotspot.kind === "future" ? " disabled" : ""}${isPortal ? " portal" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot)}.`);
    positionCastleElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleCastleHotspotClick(hotspot.id);
    });
    elements.castleMarkerLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.castleStage);
  });
  updateCastlePlayerPosition(metrics);
  updateNearbyCastleHotspot();
}

function focusCastleHotspot(hotspotId, rerender = true) {
  activeCastleHotspot = castleHotspots.find((hotspot) => hotspot.id === hotspotId) || castleHotspots[0];
  const node = castleMapNodes[activeCastleHotspot?.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
    centerAreaMapOnPoint("castle", node.x, node.y);
    persist();
  }
  if (rerender) renderCastleMap();
  elements.castleStage.focus({ preventScroll: true });
}

function handleCastleHotspotClick(hotspotId) {
  if (activeCastleHotspot?.id === hotspotId) {
    interactCastleHotspot();
    return;
  }
  focusCastleHotspot(hotspotId);
}

function updateCastlePlayerPosition(metrics = castleCoverMetrics()) {
  if (!elements.castlePlayerToken) return;
  const point = currentPlayerPoint("castle");
  if (!point) return;
  positionCastleElement(elements.castlePlayerToken, point.x, point.y, metrics);
}

function refreshCastleMapPositions() {
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  castleHotspots.forEach((hotspot) => {
    const marker = elements.castleMarkerLayer?.querySelector(`[data-hotspot-id="${hotspot.id}"]`);
    const node = castleMapNodes[hotspot.node];
    if (marker && node) {
      positionCastleElement(marker, node.x, node.y, metrics);
      updateMarkerEdgeVisibility(marker, elements.castleStage);
    }
  });
  updateCastlePlayerPosition(metrics);
  updateCastleHotspotFocus();
}

function interactCastleHotspot() {
  const hotspot = activeCastleHotspot || nearbyCastleHotspot();
  if (!hotspot) return;
  activeCastleHotspot = hotspot;
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openSceneAdv(hotspot);
}

function updateNearbyCastleHotspot() {
  activeCastleHotspot = nearbyCastleHotspot();
  updateCastleHotspotFocus();
}

function updateCastleHotspotFocus() {
  elements.castleMarkerLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeCastleHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyCastleHotspot() {
  return nearbyAreaHotspot("castle", 5.8);
}

function moveOnAreaMap(areaId, dx, dy, options = {}) {
  const speed = options.speed || MAP_WALK_SPEED.area;
  const token = options.token || elements.playerToken;
  const current = currentPlayerPoint(areaId) || nodeMapForArea(areaId)[areaRegistry[areaId]?.defaultNode];
  if (!current) return;
  const next = {
    x: clamp(current.x + dx * speed, 0, 100),
    y: clamp(current.y + dy * speed, 0, 100)
  };
  state.area = areaId;
  state.player = next;
  state.playerNode = closestNodeFromLegacy(state.player, areaId);
  const nearby = nearbyAreaHotspot(areaId, options.nearbyRadius || 6.8);
  if (nearby) {
    elements.statusMessage.textContent = `${nearby.label}: ${travelActionLabel(nearby)}.`;
  }
  options.onNearby?.(nearby);
  token?.classList.add("walking");
  window.setTimeout(() => token?.classList.remove("walking"), 180);
  persist();
  options.render?.();
}

function moveOnCastleMap(dx, dy) {
  moveOnAreaMap("castle", dx, dy, {
    speed: MAP_WALK_SPEED.castle,
    nearbyRadius: 5.8,
    token: elements.castlePlayerToken,
    onNearby: (hotspot) => { activeCastleHotspot = hotspot; },
    render: renderCastleMap
  });
}

function worldMapMetrics() {
  return areaMapMetrics("world");
}

function positionWorldElement(element, x, y, metrics = worldMapMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

function renderWorldMap() {
  if (!elements.worldStage || !elements.worldMarkerLayer) return;
  if (elements.worldStage.offsetParent === null && activeViewName() !== "world") return;
  activeWorldDestinationId = activeWorldDestination()?.id || "castle";
  centerAreaMapIfRequested("world");
  const metrics = worldMapMetrics();
  syncAreaMapStyles("world", metrics);
  elements.worldStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(worldMap.mapImage)}")`);
  if (elements.worldImage && worldMap.mapImage && !elements.worldImage.src.endsWith(worldMap.mapImage)) {
    elements.worldImage.src = domAssetUrl(worldMap.mapImage);
    elements.worldImage.alt = worldMap.label;
  }
  elements.worldMarkerLayer.innerHTML = "";
  worldMap.destinations.forEach((destination) => {
    const marker = document.createElement("button");
    const active = destination.id === activeWorldDestinationId;
    marker.type = "button";
    marker.className = `map-marker hotspot world-marker portal${active ? " nearby" : ""}${destination.enabled ? "" : " disabled"}`;
    marker.dataset.destinationId = destination.id;
    marker.dataset.label = destination.label;
    marker.disabled = !destination.enabled;
    marker.setAttribute("aria-label", destination.enabled ? `${destination.label}. Enter area.` : `${destination.label}. Not open yet.`);
    marker.setAttribute("aria-current", active ? "location" : "false");
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${destination.icon}</span>`;
    positionWorldElement(marker, destination.x, destination.y, metrics);
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      requestWorldTravel(destination.id);
    });
    elements.worldMarkerLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.worldStage);
  });
  updateWorldPlayerPosition(metrics);
  renderWorldDestinationList();
}

function renderWorldDestinationList() {
  if (!elements.worldDestinationList) return;
  const active = activeWorldDestination();
  elements.worldDestinationHint.textContent = active?.hint || "Choose an area.";
  if (elements.worldDestinationPanel) elements.worldDestinationPanel.hidden = true;
  elements.worldDestinationList.innerHTML = "";
  elements.worldDestinationList.hidden = true;
}

function focusWorldDestination(destinationId, rerender = true) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  activeWorldDestinationId = destination.id;
  centerAreaMapOnPoint("world", destination.x, destination.y);
  if (rerender) renderWorldMap();
  elements.worldStage?.focus({ preventScroll: true });
}

function updateWorldPlayerPosition(metrics = worldMapMetrics()) {
  if (!elements.worldPlayerToken) return;
  const point = currentPlayerPoint("world");
  if (!point) return;
  positionWorldElement(elements.worldPlayerToken, point.x, point.y, metrics);
}

// issue #99：世界地圖鄰近目的地偵測（比照地區地圖 nearbyAreaHotspot），供鍵盤走近後 Enter 進入與狀態提示。
function nearbyWorldDestination(radius = 9) {
  const player = currentPlayerPoint("world");
  if (!player) return null;
  const candidates = worldMap.destinations
    .map((destination) => ({
      destination,
      distance: Math.hypot(destination.x - player.x, (destination.y - player.y) * 1.18)
    }))
    .filter((candidate) => candidate.distance <= radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].destination;
}

// issue #99：世界地圖鍵盤自由走動（比照地區地圖 moveOnAreaMap）。
function moveOnWorldMap(dx, dy) {
  const speed = MAP_WALK_SPEED.world;
  const current = currentPlayerPoint("world") || { x: 51, y: 32 };
  state.world = {
    x: clamp(current.x + dx * speed, 0, 100),
    y: clamp(current.y + dy * speed, 0, 100)
  };
  const nearby = nearbyWorldDestination();
  if (nearby) {
    activeWorldDestinationId = nearby.id;
    elements.statusMessage.textContent = nearby.enabled
      ? `${nearby.label}: press Enter to visit.`
      : `${nearby.label} is not open yet.`;
  }
  elements.worldPlayerToken?.classList.add("walking");
  window.setTimeout(() => elements.worldPlayerToken?.classList.remove("walking"), 180);
  persist();
  renderWorldMap();
}

// issue #99：點選目的地 → 公主先走到該座標再進入；移動途中再次點選即略過、立即進入。
function requestWorldTravel(destinationId) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  if (!destination.enabled) {
    openWorldDestination(destination.id);
    return;
  }
  if (worldTravelTargetId) {
    finishWorldTravel();
    return;
  }
  activeWorldDestinationId = destination.id;
  worldTravelTargetId = destination.id;
  state.world = { x: destination.x, y: destination.y };
  elements.worldPlayerToken?.classList.add("traveling");
  persist();
  renderWorldMap();
  worldTravelTimer = window.setTimeout(finishWorldTravel, WORLD_TRAVEL_MS);
}

function finishWorldTravel() {
  if (worldTravelTimer) {
    window.clearTimeout(worldTravelTimer);
    worldTravelTimer = null;
  }
  elements.worldPlayerToken?.classList.remove("traveling");
  const id = worldTravelTargetId;
  worldTravelTargetId = null;
  if (id) openWorldDestination(id);
}

function openWorldDestination(destinationId = activeWorldDestinationId) {
  const destination = worldDestinationById(destinationId);
  if (!destination) return;
  // 取消任何進行中的「走到再進入」，避免計時器於已進入後再次觸發（issue #99）。
  if (worldTravelTimer) {
    window.clearTimeout(worldTravelTimer);
    worldTravelTimer = null;
  }
  worldTravelTargetId = null;
  elements.worldPlayerToken?.classList.remove("traveling");
  if (!destination.enabled) {
    elements.statusMessage.textContent = `${destination.label} is not open yet.`;
    activeWorldDestinationId = destination.id;
    renderWorldMap();
    return;
  }
  const targetArea = areaRegistry[destination.area];
  const targetNode = targetArea?.nodes?.[destination.entryNode] || targetArea?.nodes?.[targetArea.defaultNode] || Object.values(targetArea?.nodes || {})[0];
  if (!targetArea?.enabled || !targetNode) {
    elements.statusMessage.textContent = `${destination.label} is not open yet.`;
    return;
  }
  state.area = targetArea.id;
  state.playerNode = targetNode.id;
  state.player = { x: targetNode.x, y: targetNode.y };
  activeWorldDestinationId = destination.id;
  state.world = { x: destination.x, y: destination.y };
  activeHotspot = targetArea.id === "castle" ? null : locationsForArea(targetArea.id).find((item) => item.node === targetNode.id) || null;
  activeCastleHotspot = targetArea.id === "castle" ? locationsForArea("castle").find((item) => item.node === targetNode.id) || null : null;
  elements.statusMessage.textContent = `${destination.label} area opened.`;
  persist();
  openArea(targetArea.id);
}

function renderMap() {
  if (!elements.mapStage || (elements.mapStage.offsetParent === null && activeViewName() !== "map")) return;
  const areaId = activeTravelMapArea();
  ensureAreaPosition(areaId);
  centerAreaMapIfRequested(areaId);
  if (elements.destinationHint) elements.destinationHint.textContent = "Choose any place to help.";
  const area = areaRegistry[areaId];
  elements.mapStage.style.setProperty("--map-backdrop-image", `url("${cssAssetUrl(area?.mapImage || "")}")`);
  if (elements.mapImage && area?.mapImage && !elements.mapImage.src.endsWith(area.mapImage)) {
    elements.mapImage.src = area.mapImage;
    elements.mapImage.alt = `${area.label} travel map`;
  }
  if (elements.mapTitle) elements.mapTitle.textContent = `${area?.label || "Area"} Map`;
  elements.mapStage.setAttribute("aria-label", `${area?.label || "Area"} travel map. Drag to look around, tap a place, or use keyboard arrows.`);
  elements.routeLayer.innerHTML = "";
  elements.nodeLayer.innerHTML = "";
  const metrics = mapCoverMetrics(areaId);
  syncMapPanStyles(metrics, areaId);
  renderMapActors(metrics, areaId);
  renderHotspots(metrics, areaId);
  updatePlayerPosition(metrics, areaId);
  updateNearbyHotspot();
  startMapLife();
}

function renderDestinationPicker() {
  if (!elements.destinationList) return;
  const areaId = activeTravelMapArea();
  elements.destinationList.innerHTML = "";
  locationsForArea(areaId).filter((hotspot) => hotspot.kind !== "room").forEach((hotspot) => {
    const isShop = isShopHotspot(hotspot);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `destination-card${isShop ? " shop" : ""}`;
    button.dataset.destinationId = hotspot.id;
    button.innerHTML = `
      <span class="destination-icon" aria-hidden="true">${hotspot.icon}</span>
      <span class="destination-copy">
        <strong>${hotspot.label}</strong>
        <small>${destinationActionText(hotspot)}</small>
      </span>
      <span class="destination-badge">${jobAvailableForPlace(hotspot.id) ? "Practice" : isShop ? "Shop" : "Visit"}</span>
    `;
    button.addEventListener("click", () => chooseDestination(hotspot.id));
    elements.destinationList.appendChild(button);
  });
}

function destinationActionText(hotspot) {
  if (jobAvailableForPlace(hotspot.id)) return `${sceneConfigFor(hotspot).npc} has a local English task.`;
  if (isShopHotspot(hotspot)) {
    const categoriesText = allowedShopCategories(hotspot).map(categoryLabel).join(" / ");
    return `Try ${categoriesText.toLowerCase()} rewards.`;
  }
  return hotspot.hint;
}

function chooseDestination(hotspotId) {
  const areaId = activeTravelMapArea();
  const hotspot = locationsForArea(areaId).find((item) => item.id === hotspotId);
  if (!hotspot) return;
  const node = nodeMapForArea(areaId)[hotspot.node];
  if (node) {
    state.area = areaId;
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
  }
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  openSceneAdv(hotspot);
}

function focusTravelHotspot(hotspotId, areaId = activeTravelMapArea()) {
  const hotspot = locationsForArea(areaId).find((item) => item.id === hotspotId);
  const node = nodeMapForArea(areaId)[hotspot?.node];
  if (!hotspot || !node) return;
  state.area = areaId;
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
  activeHotspot = hotspot;
  centerAreaMapOnPoint(areaId, node.x, node.y);
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  elements.mapStage.focus({ preventScroll: true });
}

function handleTravelHotspotClick(hotspotId) {
  if (activeHotspot?.id === hotspotId) {
    interactNearby();
    return;
  }
  focusTravelHotspot(hotspotId);
}

function isMobileTravelMap() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function syncMapPanStyles(metrics = mapCoverMetrics()) {
  syncAreaMapStyles(activeTravelMapArea(), metrics);
}

function mapCoverMetrics(areaId = activeTravelMapArea()) {
  return areaMapMetrics(areaId);
}

function mapPointToStage(x, y, metrics = mapCoverMetrics()) {
  return areaMapViewportController.pointToStage(x, y, metrics);
}

function positionMapElement(element, x, y, metrics = mapCoverMetrics()) {
  areaMapViewportController.positionElement(element, x, y, metrics);
}

function renderMapActors(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  mapActorRuntime.render(areaRegistry[areaId]?.actors || [], metrics);
}

function startMapLife() {
  mapActorRuntime.start();
}

function renderRoutes() {
  const drawn = new Set();
  const nodes = nodeMapForArea(activeTravelMapArea());
  elements.routeLayer.innerHTML = "";
  Object.values(nodes).forEach((node) => {
    (node.links || []).forEach((linkId) => {
      const key = [node.id, linkId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);
      const other = nodes[linkId];
      if (!other) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", node.x);
      line.setAttribute("y1", node.y);
      line.setAttribute("x2", other.x);
      line.setAttribute("y2", other.y);
      elements.routeLayer.appendChild(line);
    });
  });
}

function renderNodes() {
  const areaId = activeTravelMapArea();
  const nodes = nodeMapForArea(areaId);
  const metrics = mapCoverMetrics();
  elements.nodeLayer.innerHTML = "";
  Object.values(nodes).forEach((node) => {
    const marker = document.createElement("div");
    const currentLinks = nodes[state.playerNode]?.links || [];
    marker.className = `road-node${node.id === state.playerNode ? " current" : ""}${currentLinks.includes(node.id) ? " reachable" : ""}`;
    positionMapElement(marker, node.x, node.y, metrics);
    elements.nodeLayer.appendChild(marker);
  });
}

function renderHotspots(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  const nodes = nodeMapForArea(areaId);
  elements.hotspotLayer.innerHTML = "";
  locationsForArea(areaId).forEach((hotspot) => {
    const node = nodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    const isPortal = hotspot.kind === "gate" || hotspot.markerStyle === "portal";
    marker.type = "button";
    marker.className = `map-marker hotspot${isShopHotspot(hotspot) ? " shop" : ""}${isPortal ? " portal" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot)}.`);
    positionMapElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleTravelHotspotClick(hotspot.id);
    });
    elements.hotspotLayer.appendChild(marker);
    updateMarkerEdgeVisibility(marker, elements.mapStage);
  });
}

function updatePlayerPosition(metrics = mapCoverMetrics(), areaId = activeTravelMapArea()) {
  const point = currentPlayerPoint(areaId);
  if (!point) return;
  positionMapElement(elements.playerToken, point.x, point.y, metrics);
}

function refreshMapPositions() {
  const areaId = activeTravelMapArea();
  const metrics = mapCoverMetrics(areaId);
  syncMapPanStyles(metrics);
  renderMapActors(metrics, areaId);
  renderHotspots(metrics, areaId);
  updatePlayerPosition(metrics, areaId);
  updateHotspotFocus();
}

function travelActionLabel(hotspot) {
  if (!hotspot) return "Visit";
  if (hotspot.kind === "room") return "Enter";
  if (hotspot.kind === "gate") {
    return sceneConfigFor(hotspot).travelAction || "World Map";
  }
  if (hotspot.kind === "future") return "Soon";
  if (jobAvailableForPlace(hotspot.id)) return "Practice";
  if (isShopHotspot(hotspot)) return "Shop";
  return sceneConfigFor(hotspot).travelAction || "Visit";
}

function updateNearbyHotspot() {
  activeHotspot = nearbyHotspot();
  updateHotspotFocus();
}

function updateHotspotFocus() {
  elements.hotspotLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyHotspot() {
  return nearbyAreaHotspot(activeTravelMapArea(), 6.8);
}

function moveOnMap(dx, dy) {
  const areaId = activeTravelMapArea();
  moveOnAreaMap(areaId, dx, dy, {
    token: elements.playerToken,
    onNearby: (hotspot) => { activeHotspot = hotspot; },
    render: renderMap
  });
}

function isWalkable(x, y) {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

function interactNearby() {
  const hotspot = activeHotspot || nearbyHotspot();
  if (!hotspot) return;
  activeHotspot = hotspot;
  if (hotspot.kind === "gate") {
    enterTravelGate(hotspot);
    return;
  }
  openSceneAdv(hotspot);
}

function interactCurrentLocation() {
  if (activeViewName() === "home") {
    interactCastleHotspot();
    return;
  }
  if (activeViewName() === "world") {
    openWorldDestination(activeWorldDestinationId);
    return;
  }
  interactNearby();
}

function enterTravelGate(hotspot) {
  activeWorldDestinationId = worldDestinationForArea(areaForHotspot(hotspot))?.id || activeWorldDestinationId;
  openWorldMap();
}

function openAdvBase(hotspot, mode) {
  const areaId = areaForHotspot(hotspot);
  state.area = areaId;
  changeView(areaRegistry[areaId]?.view || "map");
  clearRewardBursts();
  const scene = sceneConfigFor(hotspot);
  advMode = mode;
  activeLesson = null;
  activeShopHotspot = null;
  clearTryOnPreview({ renderDoll: false });
  shopTryOnIds = [];
  advFocusIndex = 0;
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
    elements.advModal.classList.toggle("show", advMode !== "closed");
    elements.advModal.setAttribute("aria-hidden", advMode === "closed" ? "true" : "false");
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
  if (sceneVisitWelcomeId !== hotspot.id) {
    sceneVisitWelcomeId = hotspot.id;
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
  firstLayerActionsFor(hotspot, { hasLessons: hasLessonsForPlace(hotspot?.id), hasChat: hasChatForPlace(hotspot?.id), jobDoneThisCycle: isJobDone(state, hotspot?.id) }).forEach((action) => {
    addAdvOption(sceneActionLabel(action), () => handleFirstLayerSceneAction(action, hotspot), {
      leave: action.handlerKey === "leave",
      navigation: action.navigation && action.handlerKey !== "leave"
    });
  });
}

// issue #164：場景內第一↔二層切換之共同收束——進入第二層子互動或返回第一層場景選單時即時停止前段語音、
// 改接當下話題（沿用 #156 之即時 cancel() 降級：Web Speech API 無法對進行中語句音量淡出，僅 cancel() 可停）。
// 冪等：無語音播放時不動作、不記診斷；收束於當下情境 speak() 之前完成，不誤殺當下話題語音。
function cutSceneVoiceOnSwitch() {
  if (speechManager.isSpeaking()) speechManager.stop("scene-switch");
}

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
  const doneThisCycle = hasLessonsForPlace(hotspot?.id) && isJobDone(state, hotspot?.id);
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
// （沿用舊 closeAdv 清理語意），避免未作答即返回時 state.activeQuest／activeLesson 殘留被持久化或匯出存檔。
function backToSceneMenu(hotspot) {
  state.activeQuest = null;
  activeLesson = null;
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
  if (advFocusTimer) window.clearTimeout(advFocusTimer);
  advFocusTimer = window.setTimeout(() => {
    advFocusTimer = 0;
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
  state.activeQuest = quest;
  activeLessonMode = mode;
  openAdvBase(hotspot, "quest");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  activeLesson = localizeLesson(lesson);
  advChineseUsed = false;
  advWrongAttempts = 0;
  // issue #149：移除題組 opening 旁白；角色第一人稱台詞即 prompt——以 advLine 呈現、由 NPC 音色朗讀，中文鈕播 promptZh。
  setAdvLine(activeLesson.prompt, activeLesson.promptZh);
  elements.advPrompt.textContent = quest.title;
  const zhByChoice = Array.isArray(activeLesson.choicesZh) ? activeLesson.choicesZh : [];
  const allOptions = activeLesson.choices.map((choice, i) => ({ choice, zh: zhByChoice[i] || "" }));
  // issue #138：依互動模式裁切選項數（生活聊天＝2 輕鬆、打工任務＝4），永遠保留正解。
  const optionCount = activeLessonMode === "chat" ? CHAT_CHOICE_COUNT : JOB_CHOICE_COUNT;
  const options = limitChoiceOptions(allOptions, activeLesson.answer, optionCount);
  shuffled(options).forEach((option, index) => addChoiceRow(option.choice, option.zh, index + 1));
  // issue #143：第二層答題（聊天／打工）離開統一為 Back 回第一層場景選單，不直接跳出場景。
  addAdvOption("↩ Back", () => backToSceneMenu(hotspot), { navigation: true });
  scheduleAdvFocus(0);
  speak(activeLesson.prompt, npcVoiceFor(hotspot), { source: "npc-quest-prompt" });
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
  if (elements.speakPromptButtonZh) elements.speakPromptButtonZh.hidden = !activeOpeningZh;
}

// issue #149：集中設定 advLine 文字與其對應中文（中文協助鈕播此中文）；無中文者一律清空，
// 避免切換 ADV 模式（場景／商店／退款／衣櫥／提示／完成）時殘留前一畫面的中文（Codex P2）。
function setAdvLine(text, zh = "") {
  elements.advLine.textContent = text;
  activeOpeningZh = zh ? (withPlayerName(zh) || "") : "";
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
  if (advChineseUsed) return "none";
  if (advWrongAttempts === 0) return "full";
  if (advWrongAttempts === 1) return "half";
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

function openShopAdv(hotspot) {
  openSceneAdv(hotspot);
}

function openShopDetail(hotspot) {
  openAdvBase(hotspot, "shop");
  activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "outfit";
  const stockedCategories = availableShopCategories(hotspot);
  shopCategory = stockedCategories.includes(shopCategory) ? shopCategory : stockedCategories[0] || firstCategory;
  clearTryOnPreview({ renderDoll: false });
  // issue #149：商店招呼由店家第一人稱發話，並支援中文協助（中文鈕播 shopGreetingZh）。
  setAdvLine(shopGreeting(hotspot), sceneConfigFor(hotspot).shopGreetingZh);
  elements.advPrompt.textContent = "Tap to preview. BUY to keep.";
  elements.shopArea.classList.remove("wardrobe-detail", "refund-detail");
  elements.shopArea.classList.add("show");
  renderAdvShop();
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-shop" });
}

function openRefundDetail(hotspot) {
  openAdvBase(hotspot, "refund");
  activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  clearTryOnPreview({ renderDoll: false });
  setAdvLine(`${sceneConfigFor(hotspot).npc} can help return treasures from this shop.`);
  elements.advPrompt.textContent = "Tap an owned treasure, then Refund.";
  elements.shopArea.classList.remove("wardrobe-detail");
  elements.shopArea.classList.add("show", "refund-detail");
  renderRefundDetail();
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-refund" });
}

function openWardrobeDetail(category = "outfit") {
  const hotspot = hotspotById("princessRoom");
  activeShopHotspot = hotspot;
  advMode = "wardrobe";
  shopCategory = category;
  clearTryOnPreview({ renderDoll: false });
  // issue #244：公主房衣櫃與商店逛店共用同一套版面——以 data-mode="shop" 直接套用商店多欄貨架 CSS（消除舊
  // wardrobe 單欄版型分岔），另加 .adv-closet 標記僅承載 wear-only 差異（深粉紅穿脫鈕）。advMode 維持 "wardrobe"
  // 以走無試穿之焦點與行為（不誤觸購買）。.adv-closet 於 openAdvBase 重設 className 時自動清除、closeAdv 亦清除。
  elements.advScene.dataset.mode = "shop";
  elements.advScene.classList.add("adv-closet");
  setAdvLine(`Pick what ${princessName()} will wear today.`);
  elements.advPrompt.textContent = "Tap to wear; tap again to take off.";
  elements.shopArea.classList.remove("refund-detail");
  elements.shopArea.classList.add("show", "wardrobe-detail");
  renderWardrobeDetail();
}

// issue #244：公主房衣櫃改沿用商店同一多欄貨架面板（closet 模式），不再另維護單類別分頁版型。
function renderWardrobeDetail(preserveFocus = false) {
  renderAdvShop(preserveFocus, { closet: true });
}

// issue #244：衣櫃單品於方塊只顯示狀態（Owned／Wearing），右側不渲染 BUY 鈕（noButton）；
// 穿上／脫下一律由左側那顆 try-on 鈕（shopTryOnState／toggleShopTryOn 單一來源）負責，與商店同一套。
function closetItemStatus(item) {
  return {
    label: "",
    status: isItemEquipped(item) ? "Wearing" : "Owned",
    ariaLabel: "",
    noButton: true
  };
}

// issue #272：overlay 儲存後動態更新 shopItems 中的 live 項目，再重繪紙娃娃與衣櫃。
function patchWardrobeItem(itemId, newTargetBox, rotation) {
  const live = itemById(itemId);
  if (!live?.layers?.length) return;
  const layer = live.layers[0];
  layer.bounds = { ...layer.bounds, targetBox: { ...newTargetBox } };
  if (Number.isFinite(rotation) && rotation !== 0) {
    layer.rotation = rotation;
    live.rotation = rotation;
  } else {
    delete layer.rotation;
    delete live.rotation;
  }
  renderPaperDolls();
  renderWardrobeDetail(true);
}

// issue #272：更新浮動「調整」鈕——item 有 pack/asset 則顯示並定位，否則隱藏。
function updateAdvAdjustBtn(item) {
  panelFocusItem = item || null;
  const btn = elements.advAdjustBtn;
  if (!btn) return;
  const shouldShow = !!(item && item.pack && item.asset);
  btn.hidden = !shouldShow;
  if (shouldShow) requestAnimationFrame(_positionAdjustBtn);
}

// 把「調整」鈕定位到公主和衣櫃面板正中間、與面板上緣對齊。
function _positionAdjustBtn() {
  const btn = elements.advAdjustBtn;
  const scene = elements.advScene;
  if (!btn || !scene || btn.hidden) return;
  const advBox = scene.querySelector(".adv-box");
  if (!advBox) return;
  const sceneRect = scene.getBoundingClientRect();
  const boxRect = advBox.getBoundingClientRect();
  const princess = scene.querySelector(".adv-princess");
  const princessRect = princess ? princess.getBoundingClientRect() : sceneRect;
  const gapStart = princessRect.right - sceneRect.left;
  const gapEnd = boxRect.left - sceneRect.left;
  const cx = (gapStart + gapEnd) / 2;
  btn.style.left = Math.max(0, cx - btn.offsetWidth / 2) + "px";
  btn.style.top = (boxRect.top - sceneRect.top) + "px";
}

function allowedShopCategories(hotspot = activeShopHotspot) {
  return allowedShopCategoriesFor(hotspot);
}

function unownedShopItemsFor(hotspot = activeShopHotspot, category = shopCategory) {
  const allowed = allowedShopCategories(hotspot);
  return shopItems.filter((item) => (
    item.storeId === hotspot?.id &&
    itemMatchesCategory(item, category) &&
    allowed.some((allowedCategory) => itemMatchesCategory(item, allowedCategory)) &&
    !state.owned.includes(item.id)
  ));
}

// issue #244：公主房衣櫃 = 玩家已擁有之衣物（跨店、依類別分欄），供 renderAdvShop closet 模式列欄。
function ownedWardrobeItemsFor(category) {
  // issue #244：排除 starter 內建預設外觀（storeId="starter"、layers:[]、image 為 paper-doll 底圖佔位）——
  // 它們是 per-character head 已烘入之預設髮／playwear、非真正可收藏單品，無單品素材，不應列入衣櫃。
  return shopItems.filter((item) => (
    itemMatchesCategory(item, category) &&
    state.owned.includes(item.id) &&
    item.storeId !== "starter"
  ));
}

function ownedWardrobeCategories() {
  return categories.map((category) => category.id).filter((id) => ownedWardrobeItemsFor(id).length);
}

function refundableItemsFor(hotspot = activeShopHotspot) {
  return shopItems.filter((item) => (
    item.storeId === hotspot?.id &&
    item.cost > 0 &&
    state.owned.includes(item.id) &&
    purchaseSourceFor(item) === hotspot?.id
  ));
}

function purchaseSourceFor(item) {
  ensurePurchaseStoreIdsState();
  return state.purchaseStoreIds[item.id] || item.storeId;
}

function availableShopCategories(hotspot = activeShopHotspot) {
  return allowedShopCategories(hotspot).filter((category) => unownedShopItemsFor(hotspot, category).length);
}

function firstUnownedShopItem(hotspot = activeShopHotspot) {
  const category = availableShopCategories(hotspot)[0];
  return category ? unownedShopItemsFor(hotspot, category)[0] : null;
}

function shopGreeting(hotspot) {
  return sceneConfigFor(hotspot).shopGreeting || "Welcome, Princess. Pick a lovely item.";
}

// issue #244：公主房衣櫃與商店逛店共用同一套多欄貨架面板（單一機制、非兩套）。
// closet=true（公主房衣櫃）：列出已擁有衣物、動作鈕為 wear-only 穿脫切換（深粉紅）、無試穿與購買、Back 回房間；
// closet=false（商店逛店）：列未擁有商品、試穿＋購買、Back 回店家。僅以參數區分。
function renderAdvShop(preserveFocus = false, { closet = false } = {}) {
  const stockedCategories = closet ? ownedWardrobeCategories() : availableShopCategories();
  if (!closet && !stockedCategories.includes(shopCategory)) {
    shopCategory = stockedCategories[0] || allowedShopCategories()[0] || "outfit";
  }
  elements.advShopTabs.innerHTML = ""; // 多欄貨架已含類別標題，不再需要上方類別分頁。
  // issue #244：商店與衣櫃為單一機制——穿脫互動一律走同一來源 shopTryOnState／toggleShopTryOn／updateShopTileStates
  // （內部依 advMode 區分：衣櫃持久穿戴、商店暫時試穿）。穿脫鈕＝同一顆左側 try-on 鈕。差異僅：衣櫃不渲染右側 BUY
  // 鈕（actionForItem 回 noButton 之狀態）、不需 onAction、Back 回房間。mode 一律 "shop" 使元件類別與版面完全一致。
  const panel = {
    actionForItem: closet ? closetItemStatus : shopPanelAction,
    categoryLabel,
    emptyText: closet ? "Buy treasures in town first, then dress up here." : `You found all ${activeShopHotspot?.label || "shop"} treasures!`,
    isSelected: shopItemTriedOn,
    items: [],
    listElement: elements.advShopGrid,
    mode: "shop",
    onAction: closet ? undefined : buyItemInAdv,
    onBack: closet ? backToRoomScene : backToStoreScene,
    onPreview: toggleShopTryOn,
    onTryOn: toggleShopTryOn,
    previewStyleForItem: itemPreviewStyle,
    tryOnForItem: shopTryOnState
  };
  if (!stockedCategories.length) {
    clearTryOnPreview({ renderDoll: false });
    if (!closet) renderShopSoldOut();
    const backButton = renderItemDetailPanel({ ...panel, items: [] });
    renderItemPanelCommands(backButton);
    scheduleAdvFocus(0);
    return;
  }
  renderActiveTryOnDoll();
  // 每個類別一欄：衣櫃列已擁有、商店列未擁有。
  const columns = stockedCategories.map((category) => ({
    label: categoryLabel(category),
    items: closet ? ownedWardrobeItemsFor(category) : unownedShopItemsFor(activeShopHotspot, category)
  }));
  const backButton = renderItemDetailPanel({ ...panel, columns });
  renderItemPanelCommands(backButton);
  scheduleAdvFocus(preserveFocus ? advFocusIndex : 0);
}

function shopItemTriedOn(item) {
  // issue #244：衣櫃以「是否穿戴」為選取態，商店以「是否試穿中」；共用此單一判定。
  return advMode === "wardrobe" ? isItemEquipped(item) : shopTryOnIds.includes(item.id);
}

function shopTryOnState(item) {
  if (!isWearableItem(item)) return null; // 房間擺設不能穿在身上，不給穿脫鈕。
  // issue #244：衣櫃＝持久穿脫（Wear／Take Off，依 isItemEquipped）；商店＝暫時試穿（Try on／✓ On）。同一顆左側鈕、同一來源。
  if (advMode === "wardrobe") {
    const equipped = isItemEquipped(item);
    return {
      active: equipped,
      label: equipped ? "Take Off" : "Wear",
      ariaLabel: equipped ? `Take off ${item.name}` : `Wear ${item.name}`
    };
  }
  const active = shopTryOnIds.includes(item.id);
  return {
    active,
    label: active ? "✓ On" : "Try on",
    ariaLabel: active ? `Stop trying on ${item.name}` : `Try on ${item.name}`
  };
}

function toggleShopTryOn(item) {
  if (!item || !isWearableItem(item)) return;
  updateAdvAdjustBtn(item); // issue #272：每次點選面板單品即更新浮動調整按鈕
  // issue #244：公主房衣櫃（advMode==="wardrobe"）與商店逛店共用此單一穿脫來源。
  // 衣櫃＝已擁有衣物之持久穿脫：直接 equip/unequip 至 state.outfit 並 persist，再以同一套就地更新
  // （renderActiveTryOnDoll＋updateShopTileStates，不重建貨架）反映，故面板不跑、與商店行為一致。
  if (advMode === "wardrobe") {
    if (isItemEquipped(item)) unequipOutfitItem(item); else equipOutfitItem(item);
    persist();
    // 與商店 try-on 同一套就地更新：只更新 ADV 娃娃與各方塊狀態，不重建貨架（面板不跑）。
    renderActiveTryOnDoll();
    updateShopTileStates();
    return;
  }
  shopPreviewItemId = item.id; // 記住最後操作的單品，供鍵盤「b」購買。
  const idx = shopTryOnIds.indexOf(item.id);
  if (idx >= 0) {
    shopTryOnIds.splice(idx, 1);
  } else {
    // 維持試穿清單同部位互斥，與 equipOutfitItem 的穿戴規則一致（同 type、洋裝↔上下身）。
    shopTryOnIds = shopTryOnIds.filter((id) => {
      const other = itemById(id);
      if (!other) return false;
      if (other.type === item.type) return false;
      return true;
    });
    shopTryOnIds.push(item.id);
  }
  elements.advFeedback.textContent = "";
  // 只更新試穿娃娃與各方塊狀態（就地更新、不重建貨架），保留水平拖曳位置與焦點。
  renderActiveTryOnDoll();
  updateShopTileStates();
}

function updateShopTileStates() {
  if (!elements.advShopGrid) return;
  // issue #244：商店試穿與衣櫃穿脫共用此就地更新——衣櫃以 isItemEquipped 為態（並更新所有方塊以反映同槽互斥），
  // 商店以 shopTryOnIds 為態；不重建貨架，故面板不跑。
  const closet = advMode === "wardrobe";
  elements.advShopGrid.querySelectorAll(".item-panel-row").forEach((row) => {
    const card = row.querySelector(".item-panel-card");
    const id = card?.dataset.itemId;
    if (!id) return;
    const item = itemById(id);
    const active = closet ? Boolean(item && isItemEquipped(item)) : shopTryOnIds.includes(id);
    card.classList.toggle("selected", active);
    const button = row.querySelector(".item-panel-tryon");
    if (!button) return;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.textContent = closet ? (active ? "Take Off" : "Wear") : (active ? "✓ On" : "Try on");
    if (item) button.setAttribute("aria-label", closet
      ? (active ? `Take off ${item.name}` : `Wear ${item.name}`)
      : (active ? `Stop trying on ${item.name}` : `Try on ${item.name}`));
  });
}

function shopPanelAction(item) {
  const affordable = state.coins >= item.cost;
  const label = affordable ? "BUY" : `Need ${item.cost - state.coins}`;
  return {
    label,
    status: `${item.cost} coins`,
    ariaLabel: affordable ? `BUY ${item.name} for ${item.cost} coins` : `Need ${item.cost - state.coins} more coins for ${item.name}`,
    disabled: false
  };
}

function renderItemPanelCommands(backButton) {
  elements.choiceList.innerHTML = "";
  elements.choiceList.classList.remove("shop-command-list");
  elements.advActionFooter.innerHTML = "";
  elements.advActionFooter.appendChild(backButton);
}

function backToStoreScene() {
  const hotspot = activeShopHotspot;
  clearTryOnPreview({ renderDoll: false });
  if (hotspot) {
    openSceneAdv(hotspot);
  } else {
    closeAdv();
  }
}

function backToRoomScene() {
  clearTryOnPreview({ renderDoll: false });
  openRoomScene(hotspotById("princessRoom"));
}

function shopActionLabel(item) {
  if (!item) return "Pick a treasure";
  if (state.owned.includes(item.id)) {
    return item.type === "room" ? `Already in ${princessName()}'s room` : "Already in wardrobe";
  }
  if (state.coins < item.cost) return `Need ${item.cost - state.coins} more coins`;
  return `BUY ${item.cost} coins`;
}

function tryOnFeedbackText(item, source) {
  const owned = state.owned.includes(item.id);
  const equipped = isItemEquipped(item);
  const affordable = state.coins >= item.cost;
  const status = owned ? equipped ? "Equipped now" : "Owned treasure" : affordable ? "Ready to buy" : `Need ${item.cost - state.coins} more coins`;
  if (item.type === "room") return `${item.name}: ${status}.`;
  const action = source === "wardrobe" ? `Trying it on ${princessName()}` : `Trying it on ${princessName()} before buying`;
  return `${item.name}: ${action}. ${status}.`;
}

function renderShopSoldOut() {
  elements.shopArea.querySelector(".shop-feature")?.remove();
  renderPaperDolls();
  setAdvLine("You found every treasure in this shop.");
  elements.advPrompt.textContent = "Visit the wardrobe to wear owned treasures.";
  elements.advFeedback.textContent = `${sceneConfigFor(activeShopHotspot).npc} smiles. ${princessName()} can wear owned treasures from the wardrobe.`;
}

function buyItemInAdv(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) {
    elements.advFeedback.textContent = item.type === "room"
      ? `${item.name} is already in ${princessName()}'s room.`
      : `${item.name} is already in the wardrobe.`;
    shopPreviewItemId = "";
    renderAdvShop(true);
    scheduleAdvFocus(advFocusIndex);
    return;
  }
  if (state.coins < item.cost) {
    elements.advFeedback.textContent = `Not enough coins. Need ${item.cost - state.coins} more.`;
    playTone("wrong");
    speak("Not enough coins.", "en-US", { source: "system-feedback" });
    return;
  }
  state.coins -= item.cost;
  playTone("buy");
  state.owned.push(item.id);
  recordPurchaseSources(item);
  if (item.type !== "room") equipOutfitItem(item);
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  const feedbackText = item.type === "room" ? `${item.name} is in ${princessName()}'s room now.` : `${item.name} is on ${princessName()} now.`;
  setAdvLine(`${item.name} is yours now. It looks wonderful.`);
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  showRewardBurst(`${item.name} ✦`);
  persist();
  render();
  shopPreviewItemId = "";
  // 已買下＝實際穿上，從試穿清單移除（其餘試穿維持）。
  shopTryOnIds = shopTryOnIds.filter((id) => id !== item.id);
  renderAdvShop(true);
}

function ensurePurchaseStoreIdsState() {
  if (!state.purchaseStoreIds || Array.isArray(state.purchaseStoreIds) || typeof state.purchaseStoreIds !== "object") {
    state.purchaseStoreIds = {};
  }
}

function recordPurchaseSources(item) {
  ensurePurchaseStoreIdsState();
  state.purchaseStoreIds[item.id] = item.storeId;
}

function renderRefundDetail(preserveFocus = false) {
  const refundableItems = refundableItemsFor(activeShopHotspot);
  if (shopPreviewItemId && !refundableItems.some((item) => item.id === shopPreviewItemId)) clearTryOnPreview({ renderDoll: false });
  renderCategoryTabs(elements.advShopTabs, shopCategory, () => {}, false, []);
  renderActiveTryOnDoll();
  const backButton = renderItemDetailPanel({
    actionForItem: refundPanelAction,
    categoryLabel,
    emptyText: `No ${activeShopHotspot?.label || "shop"} treasures to refund.`,
    items: refundableItems,
    listElement: elements.advShopGrid,
    mode: "refund",
    onAction: refundItemInAdv,
    onBack: backToStoreScene,
    onPreview: previewRefundItem,
    previewStyleForItem: itemPreviewStyle,
    selectedItemId: shopPreviewItemId
  });
  renderItemPanelCommands(backButton);
  const focusIndex = preserveFocus ? Math.max(0, refundableItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  scheduleAdvFocus(focusIndex);
}

function previewRefundItem(item) {
  if (!item) return;
  shopPreviewItemId = item.id;
  elements.advFeedback.textContent = `${item.name}: Refund for ${refundAmount(item)} coins.`;
  renderRefundDetail(true);
}

function refundPanelAction(item) {
  const amount = refundAmount(item);
  return {
    label: `Refund ${amount}`,
    status: "Owned",
    ariaLabel: `Refund ${item.name} for ${amount} coins`,
    disabled: false
  };
}

function refundAmount(item) {
  return Math.floor((item?.cost || 0) / 2);
}

function refundItemInAdv(item) {
  if (!item || item.storeId !== activeShopHotspot?.id || item.cost <= 0 || !state.owned.includes(item.id)) return;
  const amount = refundAmount(item);
  const removedOwnedIds = refundRemovalIds(item);
  state.coins += amount;
  state.owned = state.owned.filter((ownedId) => !removedOwnedIds.includes(ownedId));
  clearRemovedEquippedItems(removedOwnedIds);
  shopPreviewItemId = "";
  const feedbackText = `Refunded ${item.name} for ${amount} coins.`;
  setAdvLine(feedbackText);
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Refund", body: `Refunded ${item.name}.`, result: `+${amount} coins` });
  persist();
  render();
  renderRefundDetail(true);
}

function refundRemovalIds(item) {
  ensurePurchaseStoreIdsState();
  delete state.purchaseStoreIds[item.id];
  return [item.id];
}

function clearRemovedEquippedItems(itemIds) {
  const removed = new Set(itemIds);
  let changed = false;
  Object.entries(state.outfit).forEach(([slot, itemId]) => {
    if (!removed.has(itemId)) return;
    state.outfit[slot] = fallbackOwnedItemForSlot(slot);
    changed = true;
  });
  if (changed) normalizeVisibleOutfit();
}

function fallbackOwnedItemForSlot(type) {
  const ownedItems = shopItems.filter((item) => item.type === type && state.owned.includes(item.id));
  return ownedItems.find((item) => item.cost === 0)?.id || ownedItems[0]?.id || "none";
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
  return hasLessonsForPlace(place) && !isJobDone(state, place);
}

function hasChatForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.chatLesson?.questions?.length);
}

function answerLesson(button, choice) {
  if (!activeLesson || advMode !== "quest") return;
  const correct = choice === activeLesson.answer;
  recordCycleAnswer(state, correct); // 本回合答題統計（spec#9 結算用）：每次嘗試計入，答對另計。
  if (!correct) {
    advWrongAttempts += 1;
    button.classList.add("wrong");
    button.disabled = true;
    setExpressions("thinking", "surprised");
    elements.advFeedback.textContent = "Try again.";
    playTone("wrong");
    speak(choice, playerVoiceProfile(), { source: "princess-answer-wrong" }); // issue #93：公主以其音色朗讀玩家所選選項
    return;
  }

  const quest = state.activeQuest || createQuestForPlace(activeLesson.place);
  const completedHotspot = hotspotById(activeLesson.place);
  // issue #135：獎勵分流——生活聊天(chat) 加心情並在護眼上限內延長遊玩時間、不發 coins；打工(job) 沿用既有 coins 獎勵階梯。
  const isChat = activeLessonMode === "chat";
  let coins = 0;
  let burstText;
  let feedbackText;
  let diaryType = "quest";
  if (isChat) {
    state.mood = (Number(state.mood) || 0) + CHAT_MOOD_REWARD;
    // issue #165：聊天延長遊玩時間仍生效（其延長量改由 HUD Play time 欄位呈現，sysCase#7.5），
    // 完成回饋僅顯示心情加值、不再帶 "Nice chat!" 招呼語與遊玩時間提示。
    extendSession(state, clockNow(), CHAT_MOOD_REWARD * MOOD_MINUTES_PER_POINT);
    burstText = `+${CHAT_MOOD_REWARD} mood`;
    feedbackText = `+${CHAT_MOOD_REWARD} mood`;
    diaryType = "chat";
    playTone("correct");
  } else {
    const baseCoins = activeLesson.reward.coins || 0;
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
      : advChineseUsed
        ? "Nice learning with Chinese help! No coins this time."
        : "No coins this time — try to answer sooner next time.";
    // issue #177：打工答對 → 標記本場景打工於本遊玩週期已完成（下架，不可再作答），下一週期重置；
    // 僅打工計入（在此 job 分支內），聊天不計（spec#11 反洗 coins）。
    // issue #205：改以「本次實得 coins（>0）」為下架條件——答對但 0 coins（中文協助／第三次以上 none 階）
    // 不下架、本週期仍可在該場景再作答賺取 coins；full／half（coins>0）一如既往下架。
    if (coins > 0) markJobDone(state, activeLesson.place);
  }
  addUnique("completedLessons", [activeLesson.id]);
  addUnique("learnedWords", activeLesson.words);
  addUnique("metNpcs", [sceneConfigFor(completedHotspot).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(burstText);
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === activeLesson.answer) item.classList.add("correct");
  });
  addDiary({
    type: diaryType,
    title: `${quest.title} at ${completedHotspot.label}`,
    body: `Sentence: "${activeLesson.answer}"`,
    result: feedbackText,
    lessonId: activeLesson.id,
    words: activeLesson.words,
    vocabProfile: activeLesson.vocabProfile
  });
  // issue #149：完成時由角色說一句自然收尾（聊天=道別、打工=稱讚＋道謝），隨機選一句並附中文（NPC 音色朗讀）。
  const closing = pickEnding(isChat);
  setAdvLine(quest.ending || closing.en, quest.ending ? "" : closing.zh);
  // issue #143：完成後一律 Back 回第一層場景選單，提示文案對齊（不再分商店／非商店或提示 room／leave）。
  elements.advPrompt.textContent = "Go back to choose what to do next here.";
  elements.advFeedback.textContent = feedbackText;
  state.activeQuest = null;
  activeLesson = null;
  activeLessonMode = "job";
  advMode = "complete";
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
  sceneVisitWelcomeId = "";
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  advMode = "closed";
  elements.advScene.dataset.mode = "closed";
  elements.advScene.classList.remove("adv-closet"); // issue #244：清除衣櫃 closet 標記
  state.activeQuest = null;
  activeLesson = null;
  activeShopHotspot = null;
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
  if (!state.diary.length) {
    elements.diaryList.innerHTML = `<div class="diary-entry"><strong>No diary yet</strong><span>Finish quests or buy items to see records here.</span></div>`;
    return;
  }
  state.diary.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "diary-entry";
    row.innerHTML = `<strong>${entry.title}</strong><span>${entry.body}</span><span>${entry.result || ""}</span><small>${entry.at}</small>`;
    elements.diaryList.appendChild(row);
  });
}

function renderCollectionSummary() {
  if (!elements.collectionSummary) return;
  const badgeText = state.badges.length ? state.badges.join(" / ") : "No badges yet";
  const npcText = state.metNpcs.length ? state.metNpcs.join(" / ") : "No friends met yet";
  const wordText = state.learnedWords.length ? state.learnedWords.slice(0, 12).join(" / ") : "No words yet";
  elements.collectionSummary.innerHTML = `
    <div><strong>${state.learnedWords.length}</strong><span>Words</span><small>${wordText}</small></div>
    <div><strong>${state.metNpcs.length}</strong><span>Friends</span><small>${npcText}</small></div>
    <div><strong>${state.badges.length}</strong><span>Badges</span><small>${badgeText}</small></div>
  `;
}

function renderSettings() {
  elements.speakToggleButton.textContent = `Voice: ${state.speechEnabled ? "On" : "Off"}`;
  if (elements.playMinutesInput) elements.playMinutesInput.value = String(state.playLimit.playMinutes);
  if (elements.restMinutesInput) elements.restMinutesInput.value = String(state.playLimit.restMinutes);
  renderBuildInfo(elements, buildInfo);
  renderAbout(elements, { copyright, versionHistory });
}

// issue #246：角色語音指定的設定 UI 已自玩家 Settings 移至管理設定工具的「聲音管理」頁籤（tool/voice-tuner.js），
// 沿用 render/settings.js 的 renderVoiceSettings 與本檔 speechManager 同一套指定 store；遊戲端僅保留 Voice On/Off 開關，
// 不再於 Settings 渲染角色語音清單（公開遊玩端未指定者一律自動依性別與語言選用）。

const speechDiagnostics = [];
const speechManager = createSpeechManager();

// issue #109：全域朗讀語速倍率——所有發聲（角色配音／公主朗讀／中文協助）最終語速＝音色 rate × SPEECH_RATE_SCALE，
// 於發聲端套用（不改 composeVoiceProfile 合成層，保留角色相對快慢；rate 缺漏時以基準 0.86 再縮放）。
function effectiveSpeechRate(rate) {
  const base = typeof rate === "number" ? rate : DEFAULT_VOICE_PROFILE.rate;
  return Math.round(base * SPEECH_RATE_SCALE * 100) / 100;
}

function textSample(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function normalizeLang(lang) {
  return String(lang || "en-US").toLowerCase();
}

function primaryLang(lang) {
  return normalizeLang(lang).split("-")[0];
}

function recordSpeechDiagnostic(entry) {
  const diagnostic = {
    id: `speech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: entry.source || "unknown",
    textSample: textSample(entry.text),
    lang: entry.lang || "en-US",
    requestedVoiceHint: entry.voiceHint || "",
    actualVoiceName: entry.actualVoiceName || "",
    actualVoiceLang: entry.actualVoiceLang || "",
    pitch: entry.pitch,
    rate: entry.rate,
    volume: entry.volume,
    queueAction: entry.queueAction || "enqueue",
    cancelCalled: Boolean(entry.cancelCalled),
    fallbackReason: entry.fallbackReason || "",
    errorCode: "",
    voiceLoadState: entry.voiceLoadState || "unknown",
    events: [],
    startedAt: Date.now()
  };
  speechDiagnostics.push(diagnostic);
  if (speechDiagnostics.length > SPEECH_DIAGNOSTICS_MAX) speechDiagnostics.splice(0, speechDiagnostics.length - SPEECH_DIAGNOSTICS_MAX);
  return diagnostic;
}

function speechEventElapsed(diagnostic) {
  return Date.now() - diagnostic.startedAt;
}

function addSpeechDiagnosticEvent(diagnostic, eventType, event = {}) {
  diagnostic.events.push({
    eventType,
    elapsedMs: speechEventElapsed(diagnostic),
    charIndex: typeof event.charIndex === "number" ? event.charIndex : null
  });
}

function createSpeechManager() {
  let voices = [];
  let voiceLoadState = "not-supported";
  let initialized = false;
  let lastReplayKey = "";
  // issue #156：管理器自身追蹤之發聲狀態，供離場收束判斷（headless 測試 mock speak 時瀏覽器 speaking getter 不可靠）。
  let speaking = false;
  // issue #134/#246：角色語音指定（覆蓋層）共用儲存。鍵為 `${gender}:${personality}`，性別預設桶為 `${gender}:`；
  // 全機（非帳號）儲存，與管理工具聲音管理頁籤共用同一 store（state/voice-assignments.js）。
  const voiceStore = createVoiceAssignmentStore();
  // issue #134：voice 清單（getVoices 初次常為空）於 voiceschanged 載入後，通知 UI 重渲染語音設定。
  const voicesChangedHandlers = [];
  // 解析某 (gender×personality) 桶指定的 voice name：先取該桶，缺則繼承性別預設桶。
  const assignedVoiceName = (gender, personality) => voiceStore.resolve(gender, personality);

  const hasSynth = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

  const refreshVoices = () => {
    if (!hasSynth() || typeof window.speechSynthesis.getVoices !== "function") {
      voices = [];
      voiceLoadState = "not-supported";
      return voices;
    }
    try {
      voices = window.speechSynthesis.getVoices() || [];
      voiceLoadState = voices.length ? "ready" : "empty";
    } catch {
      voices = [];
      voiceLoadState = "error";
    }
    return voices;
  };

  const init = () => {
    if (initialized) return;
    initialized = true;
    voiceStore.load();
    refreshVoices();
    try {
      window.speechSynthesis?.addEventListener?.("voiceschanged", () => {
        refreshVoices();
        for (const handler of voicesChangedHandlers) { try { handler(); } catch {} }
      });
    } catch {}
  };

  const selectVoice = (profile) => {
    init();
    const available = voices.length ? voices : refreshVoices();
    const lang = profile.lang || "en-US";
    const target = normalizeLang(lang);
    const primary = primaryLang(lang);
    if (!available.length) {
      return { voice: null, fallbackReason: "voices-empty", voiceLoadState };
    }
    // issue #134：使用者語音指定（覆蓋層）最高優先——依 (gender×personality) 桶、缺則繼承性別桶；
    // 指定 voice 於本機存在即採用並記 user-assigned；不存在則記 assigned-voice-missing，續走語言優先 fallback。
    const wantName = assignedVoiceName(profile.gender, profile.personality);
    let assignedMissing = false;
    if (wantName) {
      const want = String(wantName).toLowerCase();
      const assignedVoice = available.find((voice) => String(voice.name || "").toLowerCase() === want);
      if (assignedVoice) return { voice: assignedVoice, fallbackReason: "user-assigned", voiceLoadState };
      assignedMissing = true;
    }
    const missTag = assignedMissing ? "assigned-voice-missing" : "";
    const langMatches = available.filter((voice) => normalizeLang(voice.lang) === target);
    const primaryMatches = available.filter((voice) => primaryLang(voice.lang) === primary);
    const defaultVoice = available.find((voice) => voice.default) || available[0] || null;
    // issue #209：使用者未指定時，依角色性別自動挑「裝置上存在的同性別具名 voice」（語言優先：先 en-US 再泛 en）。
    // 取代舊有以 voiceHint 字串比對 voice 名稱之失效邏輯（瀏覽器 voice 名稱鮮少含 "female"／"male"，幾乎恆落空）。
    const genderVoice = pickVoiceByGender(profile.gender, langMatches)
      || pickVoiceByGender(profile.gender, primaryMatches);
    if (genderVoice) return { voice: genderVoice, fallbackReason: missTag || "gender-default", voiceLoadState };
    if (langMatches[0]) return { voice: langMatches[0], fallbackReason: missTag, voiceLoadState };
    if (primaryMatches[0]) return { voice: primaryMatches[0], fallbackReason: missTag || `fallback-${primary}`, voiceLoadState };
    return { voice: defaultVoice, fallbackReason: missTag || "language-unavailable", voiceLoadState };
  };

  const buildProfile = (voiceOrLang) => typeof voiceOrLang === "string"
    ? { lang: voiceOrLang, pitch: DEFAULT_VOICE_PROFILE.pitch, rate: DEFAULT_VOICE_PROFILE.rate, voiceHint: "" }
    : { ...DEFAULT_VOICE_PROFILE, ...(voiceOrLang || {}) };

  const stop = (reason = "stop") => {
    if (!hasSynth()) return false;
    try {
      window.speechSynthesis.cancel();
      recordSpeechDiagnostic({
        source: reason,
        text: "",
        lang: "",
        queueAction: "stop",
        cancelCalled: true,
        fallbackReason: reason,
        voiceLoadState
      });
      lastReplayKey = "";
      speaking = false;
      return true;
    } catch {
      return false;
    }
  };

  const speak = (text, voiceOrLang = "en-US", options = {}) => {
    const profile = buildProfile(voiceOrLang);
    const done = typeof options.then === "function" ? options.then : null;
    const replayKey = options.replayKey || `${options.source || "speech"}:${profile.lang || "en-US"}:${textSample(text)}`;
    if (!state.speechEnabled || !hasSynth()) {
      recordSpeechDiagnostic({
        source: options.source || "speech-disabled",
        text,
        lang: profile.lang || "en-US",
        pitch: profile.pitch,
        rate: effectiveSpeechRate(profile.rate),
        volume: 1,
        queueAction: "skip",
        cancelCalled: false,
        fallbackReason: state.speechEnabled ? "speechSynthesis-unavailable" : "voice-off",
        voiceLoadState
      });
      if (done) done();
      return;
    }

    init();
    let cancelCalled = false;
    let queueAction = "enqueue";
    if (SPEECH_QUEUE_MODE === "replace-last" && replayKey === lastReplayKey) {
      try {
        window.speechSynthesis.cancel();
        cancelCalled = true;
        queueAction = "replace-last";
      } catch {}
    }
    lastReplayKey = replayKey;

    const selection = selectVoice(profile);
    // issue #134：送入 utterance 前於開頭加入前置留白延後首字（畫面顯示與診斷紀錄仍用原文）。
    const utterance = new SpeechSynthesisUtterance(SPEECH_LEADING_PAD + text);
    utterance.lang = profile.lang || "en-US";
    utterance.pitch = typeof profile.pitch === "number" ? profile.pitch : 1;
    utterance.rate = effectiveSpeechRate(profile.rate);
    utterance.volume = typeof profile.volume === "number" ? profile.volume : 1;
    let voiceAssignmentFailed = false;
    if (selection.voice) {
      try {
        utterance.voice = selection.voice;
      } catch {
        voiceAssignmentFailed = true;
      }
    }

    const diagnostic = recordSpeechDiagnostic({
      source: options.source || "speech",
      text,
      lang: utterance.lang,
      voiceHint: profile.voiceHint,
      actualVoiceName: selection.voice?.name || "",
      actualVoiceLang: selection.voice?.lang || "",
      pitch: utterance.pitch,
      rate: utterance.rate,
      volume: utterance.volume,
      queueAction,
      cancelCalled,
      fallbackReason: selection.fallbackReason || (voiceAssignmentFailed ? "voice-assignment-failed" : ""),
      voiceLoadState: selection.voiceLoadState
    });

    let fired = false;
    const fireThen = () => {
      if (fired) return;
      fired = true;
      speaking = false;
      if (done) done();
    };
    utterance.addEventListener("start", (event) => addSpeechDiagnosticEvent(diagnostic, "start", event));
    utterance.addEventListener("boundary", (event) => addSpeechDiagnosticEvent(diagnostic, "boundary", event));
    utterance.addEventListener("end", (event) => {
      addSpeechDiagnosticEvent(diagnostic, "end", event);
      fireThen();
    });
    utterance.addEventListener("error", (event) => {
      diagnostic.errorCode = event.error || "synthesis-failed";
      diagnostic.fallbackReason = diagnostic.fallbackReason || diagnostic.errorCode;
      addSpeechDiagnosticEvent(diagnostic, "error", event);
      fireThen();
    });

    try {
      speaking = true;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      diagnostic.errorCode = error?.name === "NotAllowedError" ? "not-allowed" : "synthesis-failed";
      diagnostic.fallbackReason = diagnostic.errorCode;
      addSpeechDiagnosticEvent(diagnostic, "error");
      fireThen();
    }
  };

  return {
    init,
    refreshVoices,
    selectVoice,
    speak,
    stop,
    // issue #156：是否有語音正在播放或排隊（內部旗標 OR 瀏覽器狀態），供離場收束判斷。
    isSpeaking: () => speaking || (hasSynth() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)),
    diagnostics: () => speechDiagnostics.slice(),
    resetDiagnostics: () => { speechDiagnostics.length = 0; },
    voiceLoadState: () => voiceLoadState,
    // issue #134：使用者語音指定（覆蓋層）對外介面，供設定 UI 與 selftest 使用。
    listVoices: () => (voices.length ? voices : refreshVoices()).map((voice) => ({
      name: voice.name || "",
      lang: voice.lang || "",
      default: Boolean(voice.default)
    })),
    getVoiceAssignments: () => voiceStore.getAll(),
    setVoiceAssignment: (gender, personality, voiceName) => voiceStore.set(gender, personality, voiceName),
    clearVoiceAssignments: () => voiceStore.clear(),
    onVoicesChanged: (handler) => { if (typeof handler === "function") voicesChangedHandlers.push(handler); }
  };
}

// issue #93：speak 第二參數相容 lang 字串（中文協助沿用）與音色 profile 物件（角色配音）；
// 第三參數 then 於語音自然結束後回呼，供「公主朗讀作答 → NPC 結語」串接，避免彼此 cancel。
function speak(text, voiceOrLang = "en-US", options = {}) {
  speechManager.speak(text, voiceOrLang, { ...options, source: options.source || "game-speech" });
}

// issue #93：依場景人物／玩家公主的特性宣告解析音色（缺宣告自動降級 default）。
function npcVoiceFor(hotspot) {
  return voiceProfileForNpcName(sceneConfigFor(hotspot)?.npc);
}
function playerVoiceProfile() {
  return voiceProfileForCharacterId(state.activeCharacterId);
}

// issue #73 中文協助：撥放題目／選項語音。按中文（zh-TW）即標記本題已用中文協助，影響獎勵階梯。
function playLessonAudio(text, lang = "en-US") {
  if (!text) return;
  if (lang === CHINESE_AUDIO_LANG) advChineseUsed = true;
  speak(text, lang, { source: lang === CHINESE_AUDIO_LANG ? "lesson-zh" : "lesson-en", replayKey: `lesson:${lang}:${textSample(text)}` });
}

function playTone(kind) {
  try {
    if (new URLSearchParams(location.search).has("selftest")) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { correct: 660, wrong: 180, buy: 820 };
    oscillator.frequency.value = frequencies[kind] || 440;
    oscillator.type = "sine";
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
  } catch {}
}

function buildSaveMarkdown() {
  return buildStateSaveMarkdown(state);
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
  state = freshState();
  persist();
  elements.statusMessage.textContent = "Progress reset. A new short talk is ready.";
  render();
}

function relativeStagePoint(stage, pointer) {
  const rect = stage.getBoundingClientRect();
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top
  };
}

function pointerDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function pointerCenter(a, b) {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
  };
}

function resetMapGestureStart() {
  if (!mapGesture) return;
  const viewport = areaMapViewport(mapGesture.areaId);
  const metrics = areaMapMetrics(mapGesture.areaId);
  const pointers = [...mapGesture.pointers.values()];
  mapGesture.startPan = { ...viewport.pan };
  mapGesture.startZoom = viewport.zoom;
  mapGesture.startPoints = pointers.map((pointer) => ({ ...pointer }));
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(mapGesture.stage, center);
    mapGesture.startDistance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    mapGesture.startCenterStage = centerStage;
    mapGesture.startMapFocus = {
      x: clamp((centerStage.x - metrics.offsetX) / metrics.displayWidth, 0, 1),
      y: clamp((centerStage.y - metrics.offsetY) / metrics.displayHeight, 0, 1)
    };
  } else if (pointers.length === 1) {
    mapGesture.startCenterStage = relativeStagePoint(mapGesture.stage, pointers[0]);
  }
}

function applyAreaMapViewport(areaId, viewport) {
  areaMapViewportController.applyViewport(areaId, viewport);
}

function refreshAreaMapPositions(areaId) {
  if (areaId === "castle") {
    refreshCastleMapPositions();
  } else if (areaId === "world") {
    renderWorldMap();
  } else {
    refreshMapPositions();
  }
}

function scheduleAreaMapPositionRefresh(areaId) {
  pendingMapRefreshArea = areaId;
  if (pendingMapPositionFrame) return;
  pendingMapPositionFrame = requestAnimationFrame(() => {
    const areaToRefresh = pendingMapRefreshArea || state.area || "urban";
    pendingMapPositionFrame = 0;
    pendingMapRefreshArea = "";
    refreshAreaMapPositions(areaToRefresh);
  });
}

function mapGestureBlocked(event) {
  return Boolean(event.target.closest("button, .nearby-card, .destination-panel, .area-nav"));
}

function beginAreaMapGesture(areaId, event) {
  if (!isMobileTravelMap()) return;
  if (mapGestureBlocked(event)) return;
  const stage = areaMapStage(areaId);
  if (!mapGesture || mapGesture.areaId !== areaId) {
    mapGesture = {
      areaId,
      stage,
      pointers: new Map(),
      moved: false
    };
  }
  mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  resetMapGestureStart();
  stage.classList.add("is-dragging");
  stage.setPointerCapture?.(event.pointerId);
}

function moveAreaMapGesture(areaId, event) {
  if (!mapGesture || mapGesture.areaId !== areaId || !mapGesture.pointers.has(event.pointerId)) return;
  mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  const pointers = [...mapGesture.pointers.values()];
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(mapGesture.stage, center);
    const distance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    const zoom = clamp(
      mapGesture.startZoom * (distance / mapGesture.startDistance),
      areaMapViewportController.zoomLimits.min,
      areaMapViewportController.zoomLimits.max
    );
    const stageRect = mapGesture.stage.getBoundingClientRect();
    const baseDisplay = baseAreaMapDisplay(areaId, stageRect);
    const displayWidth = baseDisplay.width * zoom;
    const displayHeight = baseDisplay.height * zoom;
    const pan = {
      x: centerStage.x - mapGesture.startMapFocus.x * displayWidth - (stageRect.width - displayWidth) / 2,
      y: centerStage.y - mapGesture.startMapFocus.y * displayHeight - (stageRect.height - displayHeight) / 2
    };
    applyAreaMapViewport(areaId, { pan, zoom });
  } else if (pointers.length === 1) {
    const pointer = pointers[0];
    const startPoint = mapGesture.startPoints[0];
    const dx = pointer.clientX - startPoint.clientX;
    const dy = pointer.clientY - startPoint.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 4) mapGesture.moved = true;
    applyAreaMapViewport(areaId, {
      pan: { x: mapGesture.startPan.x + dx, y: mapGesture.startPan.y + dy },
      zoom: mapGesture.startZoom
    });
  }
  event.preventDefault();
  scheduleAreaMapPositionRefresh(areaId);
}

function finishAreaMapGesture(areaId, event) {
  if (!mapGesture || mapGesture.areaId !== areaId || !mapGesture.pointers.has(event.pointerId)) return;
  const stage = areaMapStage(areaId);
  mapGesture.pointers.delete(event.pointerId);
  stage.releasePointerCapture?.(event.pointerId);
  if (mapGesture.pointers.size) {
    resetMapGestureStart();
    return;
  }
  stage.classList.remove("is-dragging");
  mapGesture = null;
}

function beginMapDrag(event) {
  beginAreaMapGesture(activeTravelMapArea(), event);
}

function moveMapDrag(event) {
  moveAreaMapGesture(activeTravelMapArea(), event);
}

function finishMapDrag(event) {
  finishAreaMapGesture(activeTravelMapArea(), event);
}

function beginCastleMapDrag(event) {
  beginAreaMapGesture("castle", event);
}

function moveCastleMapDrag(event) {
  moveAreaMapGesture("castle", event);
}

function finishCastleMapDrag(event) {
  finishAreaMapGesture("castle", event);
}

function beginWorldMapDrag(event) {
  beginAreaMapGesture("world", event);
}

function moveWorldMapDrag(event) {
  moveAreaMapGesture("world", event);
}

function finishWorldMapDrag(event) {
  finishAreaMapGesture("world", event);
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => changeView(tab.dataset.view)));
  window.addEventListener("hashchange", () => changeView(location.hash ? location.hash.slice(1) : "home"));
  elements.systemMenuButton.addEventListener("click", () => openSystemMenu(systemMenuPanel || "diary"));
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
  elements.playerNameInput?.addEventListener("input", () => { playerNameEdited = true; });
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
    if (!panelFocusItem) return;
    openAdjustOverlay({
      item: panelFocusItem,
      outfit: { ...state.outfit },
      renderer: paperDollRenderer,
      getCharacter: activePaperDollCharacter,
      onSave: patchWardrobeItem
    });
  });
  window.addEventListener("resize", _positionAdjustBtn, { passive: true });
  elements.speakPromptButton.addEventListener("click", () => playLessonAudio(elements.advLine.textContent, "en-US"));
  elements.speakPromptButtonZh?.addEventListener("click", () => playLessonAudio(activeOpeningZh, CHINESE_AUDIO_LANG));
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
    state.speechEnabled = !state.speechEnabled;
    if (!state.speechEnabled) speechManager.stop("voice-off");
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
    state.diary = [];
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
    } else if ((event.key === "Enter" || event.key === " ") && activeCastleHotspot) {
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
    } else if ((event.key === "Enter" || event.key === " ") && activeHotspot) {
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
        activeHotspot
      ) {
        event.preventDefault();
        interactNearby();
        return;
      }
      if (
        (event.key === "Enter" || event.key === " ") &&
        elements.worldStage?.offsetParent !== null &&
        activeWorldDestinationId
      ) {
        event.preventDefault();
        openWorldDestination(activeWorldDestinationId);
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
      if (!confirmAdvFocus() && advMode === "complete") closeAdv();
      return;
    }
    if ((event.key === "b" || event.key === "B") && advMode === "shop") {
      event.preventDefault();
      buyItemInAdv(itemById(shopPreviewItemId));
      return;
    }
    if (/^[1-9]$/.test(event.key) && advMode === "quest") {
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
        activeCharacterId: state.activeCharacterId,
        playerName: state.playerName,
        coins: state.coins,
        energy: state.energy,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
      };
      const markdown = buildSaveMarkdown();
      const hasMarkers = markdown.includes(saveMarkerStart) && markdown.includes(saveMarkerEnd);
      loadMarkdownText(markdown);
      const after = {
        activeCharacterId: state.activeCharacterId,
        playerName: state.playerName,
        coins: state.coins,
        energy: state.energy,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
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

const hasSelftest = new URLSearchParams(location.search).has("selftest");
bindEvents();
render();
changeView(location.hash ? location.hash.slice(1) : "home");
// 本機多帳號 gate（issue #63 / spec#8）：每次進入都先選帳號，即使已有使用中帳號亦不自動沿用（共用裝置須每次選玩家）。
if (!hasSelftest) openAccountSelect({ mustChoose: true });
if (!hasSelftest) startPlayClock(); // selftest 模式由測試以注入時鐘自行驅動，不啟動真實 ticker。

installTestingHooks({
  get state() { return state; },
  set state(nextState) { state = nextState; },
  accounts: {
    list: listAccounts,
    activeId: getActiveAccountId,
    create: () => {
      const account = createFreshAccount();
      state = loadAccountState(account.id);
      return account;
    },
    select: (accountId) => {
      setActiveAccountId(accountId);
      state = loadAccountState(accountId);
      persist();
      render();
      return accountId;
    },
    remove: (accountId) => {
      const wasActive = getActiveAccountId() === accountId;
      deleteAccount(accountId);
      if (wasActive) state = freshState();
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
    setOffset: (ms) => { testClockOffset = Number(ms) || 0; },
    advance: (ms) => { testClockOffset += Number(ms) || 0; return clockNow(); },
    tick: () => tickPlayLimit(state, clockNow()),
    status: () => playStatus(state, clockNow()),
    resume: () => resumeFromRest(state, clockNow()),
    recordAnswer: (correct) => recordCycleAnswer(state, correct),
    extend: (minutes) => extendSession(state, clockNow(), minutes),
    get limit() { return state.playLimit; },
    setDurations: (playMinutes, restMinutes) => {
      state.playLimit.playMinutes = playMinutes;
      state.playLimit.restMinutes = restMinutes;
    },
    // issue #177：每場景打工每遊玩週期限答對一次測試介面。
    markJobDone: (place) => markJobDone(state, place),
    isJobDone: (place) => isJobDone(state, place),
    normalizeLimit: (candidate) => normalizePlayLimit(candidate)
  },
  get shopPreviewItemId() { return shopPreviewItemId; },
  set shopPreviewItemId(nextItemId) { shopPreviewItemId = nextItemId; },
  tryOnShopItem: (item) => toggleShopTryOn(typeof item === "string" ? itemById(item) : item),
  get shopCategory() { return shopCategory; },
  set shopCategory(nextCategory) { shopCategory = nextCategory; },
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
      jobDoneThisCycle: isJobDone(state, hotspot?.id)
    }).map((action) => action.handlerKey);
  },
  backToSceneMenu,
  getActiveLesson: () => activeLesson,
  getAdvMode: () => advMode,
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
  focusWorld: (destination = activeWorldDestinationId) => {
    const target = worldDestinationById(destination) || worldDestinationForArea(destination);
    if (!target) throw new Error("Unknown world destination");
    openWorldMap();
    focusWorldDestination(target.id);
  },
  freshState,
  getMapMetrics: (areaId = state.area) => {
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
