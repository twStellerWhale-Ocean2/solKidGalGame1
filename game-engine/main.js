import { buildInfo, copyright, versionHistory } from "./build/version.js";
import { $, $$, createElements } from "./app/elements.js";
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
  mapImageSize,
  mapNodes,
  paperDollBaseLayer,
  paperDollLayerOrder,
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
  DEFAULT_VOICE_PROFILE
} from "./data/game-data.js";
import { createAdvControls } from "./flow/adv-controls.js";
import { firstLayerActionsFor, sceneActionLabel } from "./flow/scene-actions.js";
import { FLOW_STAGE_LABELS } from "./flow/stages.js";
import { createMapActorRuntime, mapActorMotionTypes } from "./map/actors.js";
import { updateMarkerEdgeVisibility } from "./map/marker-visibility.js";
import { createAreaMapViewportController } from "./map/viewport.js";
import { renderItemDetailPanel } from "./render/item-panel.js";
import { createPaperDollRenderer } from "./render/paper-doll.js";
import { renderBuildInfo, renderAbout } from "./render/settings.js";
import { applyAdvSceneArt } from "./scene/scene-art.js";
import { saveMarkerEnd, saveMarkerStart } from "./state/storage.js";
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
import { installTestingHooks } from "./testing/selftests.js";
import { createSaveLoadController } from "./system/save-load.js";
import {
  MAX_LIMIT_MINUTES,
  MIN_LIMIT_MINUTES,
  extendSession,
  playStatus,
  recordAnswer as recordCycleAnswer,
  resumeFromRest,
  tick as tickPlayLimit
} from "./system/play-clock.js";

let state = loadLocalState();
let activeHotspot = null;
let activeLesson = null;
let advMode = "closed";
let advChineseUsed = false;   // issue #73：本題是否按過中文撥放（按過＝該題無獎勵）
let advWrongAttempts = 0;          // issue #73：本題答錯次數（0→全額、1→半額、≥2→無）
let activeOpeningZh = "";           // issue #73：本題題目（advLine）的中文，無則空字串
const CHINESE_AUDIO_LANG = "zh-TW";     // design paramChineseAudioLang
const REWARD_SECOND_TRY_RATIO = 0.5;    // design paramRewardSecondTryRatio
const SPEECH_RATE_SCALE = 0.8;          // issue #109 design paramSpeechRateScale：全域朗讀語速倍率（套用於所有發聲）
const SPEECH_QUEUE_MODE = "replace-last";
const SPEECH_DEBOUNCE_MS = 120;
const SPEECH_DIAGNOSTICS_MAX = 80;
let shopCategory = "dresses";
let activeShopHotspot = null;
let wardrobeCategory = "dresses";
let princessExpression = "normal";
let npcExpression = "normal";
let advFocusIndex = 0;
let advFocusTimer = 0;
let shopPreviewItemId = "";
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

function formatTimeOfDay(timestamp) {
  if (!timestamp) return "Not started";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function profileColorFor(characterId = state.activeCharacterId, color = state.profileColor) {
  return normalizeProfileColor(color, characterId);
}

function profileAvatarStyle(characterId, color) {
  const character = playableCharacterById(characterId);
  const portraitUrl = new URL(domAssetUrl(character.baseLayer), document.baseURI).href;
  return {
    character,
    color: profileColorFor(character.id, color),
    portrait: `url("${portraitUrl.replaceAll('"', "%22")}")`
  };
}

function applyProfileAvatar(element, characterId, color) {
  if (!element) return;
  const style = profileAvatarStyle(characterId, color);
  element.style.setProperty("--character-portrait", style.portrait);
  element.style.setProperty("--profile-color", style.color);
  element.setAttribute("aria-label", style.character.label);
}

function updateEnergyHud({ percent, label }) {
  const clamped = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
  state.energy = clamped;
  if (elements.energyValue) elements.energyValue.textContent = label || `${clamped}%`;
  if (elements.energyMeterFill) elements.energyMeterFill.style.width = `${clamped}%`;
}

function playClockHudText(status, now) {
  if (status.phase === "rest") return `Rest ${formatClock(status.restRemainingMs)}`;
  if (status.phase === "play") {
    const startedAt = Math.max(0, (state.playLimit?.sessionEndsAt || 0) - (state.playLimit?.playMinutes || 0) * 60000);
    return `${formatTimeOfDay(startedAt)} · ${formatClock(status.playRemainingMs)}`;
  }
  return `Ready ${formatTimeOfDay(now)}`;
}

function updateEnergyHudFromStatus(status, now = clockNow()) {
  updateEnergyHud({
    percent: status.phase === "rest" ? 0 : status.energyPercent,
    label: playClockHudText(status, now)
  });
}

function updateProfileColorChrome() {
  const color = profileColorFor();
  document.documentElement.style.setProperty("--active-profile-color", color);
  applyProfileAvatar(elements.sideProfileAvatar, state.activeCharacterId, color);
  [elements.castlePlayerToken, elements.playerToken, elements.worldPlayerToken].forEach((token) => {
    token?.style.setProperty("--profile-color", color);
  });
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
  elements.advNpcPortrait.dataset.expression = npcExpression;
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
  elements.outfitSummary.textContent = outfitSummary();
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

function localizeLesson(lesson) {
  if (!lesson) return lesson;
  return {
    ...lesson,
    prompt: withPlayerName(lesson.prompt),
    promptZh: withPlayerName(lesson.promptZh),
    answer: withPlayerName(lesson.answer),
    choices: Array.isArray(lesson.choices) ? lesson.choices.map(withPlayerName) : lesson.choices,
    choicesZh: Array.isArray(lesson.choicesZh) ? lesson.choicesZh.map(withPlayerName) : lesson.choicesZh,
    words: Array.isArray(lesson.words) ? lesson.words.map(withPlayerName) : lesson.words
  };
}

function renderIdentity() {
  const name = princessName();
  if (elements.princessNameTitle) elements.princessNameTitle.textContent = `Princess ${name}`;
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

function openCharacterSelect({ forced = false } = {}) {
  pendingCharacterId = state.activeCharacterId;
  pendingProfileColor = profileColorFor(state.activeCharacterId, state.profileColor);
  profileColorEdited = profileColorFor(state.activeCharacterId, state.profileColor) !== defaultProfileColorFor(state.activeCharacterId);
  // 既有的自訂名字（與目前角色預設名不同）視為玩家已輸入，切換外觀時不覆蓋。
  const activeDefaultName = playableCharacterById(state.activeCharacterId)?.defaultName;
  playerNameEdited = Boolean(state.playerName) && state.playerName !== activeDefaultName;
  buildCharacterCards();
  buildProfileColorChoices();
  elements.playerNameInput.value = state.playerName || playableCharacterById(pendingCharacterId)?.defaultName || "";
  elements.characterSelect.classList.toggle("first-run", forced);
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
    applyProfileAvatar(portrait, character.id, character.id === pendingCharacterId ? pendingProfileColor : character.defaultProfileColor);
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
    applyProfileAvatar(portrait, card.dataset.characterId, color);
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
  if (isStarterWardrobeItem(state.outfit.dress, "dress") && starterOutfit.dress) {
    state.outfit.dress = starterOutfit.dress;
  }
}

function confirmCharacterSelect() {
  const character = playableCharacterById(pendingCharacterId);
  state.activeCharacterId = character.id;
  applyCharacterStarterOutfit(character);
  state.profileColor = profileColorFor(character.id, pendingProfileColor);
  state.playerName = sanitizePlayerName(elements.playerNameInput.value) || character.defaultName;
  persist();
  const activeAccountId = getActiveAccountId();
  if (activeAccountId) syncActiveAccountMeta({ touched: true });
  closeCharacterSelect();
  render();
  elements.statusMessage.textContent = `${princessName()} is ready. Choose a place to start.`;
}

// ---- 本機多帳號（issue #63）：每次進入先選玩家帳號，可新增與刪除，各帳號進度互不混用 ----
// mustChoose=true：啟動 gate，必須選擇或新增帳號才能進入（不可關閉、不顯示 Back）。
let accountSelectMustChoose = false;
function openAccountSelect({ mustChoose = false } = {}) {
  accountSelectMustChoose = mustChoose;
  buildAccountList();
  elements.accountSelect.classList.add("show");
  elements.accountSelect.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-select-open");
  setTimeout(() => elements.accountSelectCard?.focus({ preventScroll: true }), 0);
}

function closeAccountSelect() {
  // 啟動 gate 或尚無使用中帳號時不可關閉（必須先選或新增帳號）。
  if (accountSelectMustChoose || !getActiveAccountId()) return;
  elements.accountSelect.classList.remove("show");
  elements.accountSelect.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-select-open");
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
    avatar.className = "profile-avatar account-avatar";
    applyProfileAvatar(avatar, summary.characterId, summary.color);
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
  const account = createFreshAccount();
  state = loadAccountState(account.id);
  syncActiveAccountMeta({ touched: true });
  accountSelectMustChoose = false;
  closeAccountSelect();
  render();
  changeView("home");
  openCharacterSelect({ forced: true });
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
  doll.dataset.top = outfitState.top || "none";
  doll.dataset.bottom = outfitState.bottom || "none";
  doll.dataset.dress = outfitState.dress || "none";
  doll.dataset.outer = outfitState.outer || "none";
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

function renderActiveTryOnDoll() {
  const item = activeTryOnItem();
  if (!item) {
    renderAdvDoll(state.outfit, false);
    return;
  }
  renderAdvDoll(tryOnOutfitFor(item), true);
}

function clearTryOnPreview({ renderDoll = true } = {}) {
  shopPreviewItemId = "";
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
  if (item.type === "outfitSet") {
    return Object.entries(item.equips || {}).every(([slot, itemId]) => outfit[slot] === itemId);
  }
  return outfit[item.type] === item.id;
}

function equipOutfitItem(item, outfit = state.outfit) {
  if (!item) return outfit;
  if (item.type === "room") {
    outfit.room = item.id;
    return outfit;
  }
  if (item.type === "outfitSet") {
    Object.entries(item.equips || {}).forEach(([slot, itemId]) => {
      const component = itemById(itemId);
      if (component) equipOutfitItem(component, outfit);
      else outfit[slot] = itemId;
    });
    return normalizeVisibleOutfit(outfit);
  }
  if (item.type === "dress") {
    outfit.top = "none";
    outfit.bottom = "none";
  }
  if (item.type === "top" || item.type === "bottom") {
    outfit.dress = "none";
  }
  outfit[item.type] = item.id;
  return normalizeVisibleOutfit(outfit);
}

function unequipOutfitItem(item, outfit = state.outfit) {
  if (!item || item.type === "room") return outfit;
  if (item.type === "outfitSet") {
    Object.keys(item.equips || {}).forEach((slot) => {
      outfit[slot] = "none";
    });
    return normalizeVisibleOutfit(outfit);
  }
  outfit[item.type] = "none";
  return normalizeVisibleOutfit(outfit);
}

function normalizeVisibleOutfit(outfit = state.outfit) {
  if (!outfit.hairstyle || outfit.hairstyle === "none") outfit.hairstyle = "softBrownHair";
  if (outfit.dress && outfit.dress !== "none") {
    outfit.top = "none";
    outfit.bottom = "none";
    return outfit;
  }
  if ((!outfit.top || outfit.top === "none") && (!outfit.bottom || outfit.bottom === "none")) {
    outfit.dress = "starterPajama";
  }
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
  elements.castleMarkerLayer.innerHTML = "";
  castleHotspots.forEach((hotspot) => {
    const node = castleMapNodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    const isPortal = hotspot.kind === "gate" || hotspot.markerStyle === "portal";
    marker.type = "button";
    marker.className = `map-marker hotspot castle-marker${activeCastleHotspot?.id === hotspot.id ? " nearby" : ""}${hotspot.kind === "future" ? " disabled" : ""}${isPortal ? " portal" : ""}`;
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
  const speed = options.speed || 1.45;
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
    speed: 1.35,
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
  const speed = 1.6;
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
    const isShop = hotspot.kind === "shop";
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
      <span class="destination-badge">${hasLessonsForPlace(hotspot.id) ? "Practice" : isShop ? "Shop" : "Visit"}</span>
    `;
    button.addEventListener("click", () => chooseDestination(hotspot.id));
    elements.destinationList.appendChild(button);
  });
}

function destinationActionText(hotspot) {
  if (hasLessonsForPlace(hotspot.id)) return `${sceneConfigFor(hotspot).npc} has a local English task.`;
  if (hotspot.kind === "shop") {
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
    marker.className = `map-marker hotspot${hotspot.kind === "shop" ? " shop" : ""}${isPortal ? " portal" : ""}`;
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
  if (hasLessonsForPlace(hotspot.id)) return "Practice";
  if (hotspot.kind === "shop") return "Shop";
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
  elements.advTitle.textContent = hotspot.label;
  const npcClass = scene.npcClass || (scene.npcImage ? "npc-image" : "npc-none");
  elements.advNpcPortrait.className = `portrait-card adv-npc ${npcClass}`;
  elements.advNpcPortrait.style.backgroundImage = scene.npcImage ? `url("${domAssetUrl(scene.npcImage)}")` : "";
  elements.advNpcPortrait.dataset.expression = npcExpression;
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
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const scene = sceneConfigFor(hotspot);
  elements.advLine.textContent = scene.travelLine || hotspot.hint;
  elements.advPrompt.textContent = "Choose what to do here.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-scene" });
}

function openRoomScene(hotspot = hotspotById("princessRoom")) {
  openAdvBase(hotspot, "scene");
  elements.advLine.textContent = `${princessName()} is in her room. What should we change today?`;
  elements.advPrompt.textContent = "Choose a room action.";
  renderFirstLayerSceneActions(hotspot);
  scheduleAdvFocus(0);
}

function renderFirstLayerSceneActions(hotspot) {
  firstLayerActionsFor(hotspot, { hasLessons: hasLessonsForPlace(hotspot?.id) }).forEach((action) => {
    addAdvOption(sceneActionLabel(action), () => handleFirstLayerSceneAction(action, hotspot), {
      leave: action.handlerKey === "leave",
      navigation: action.navigation && action.handlerKey !== "leave"
    });
  });
}

function handleFirstLayerSceneAction(action, hotspot) {
  switch (action.handlerKey) {
    case "wardrobe":
      openWardrobeDetail(action.category);
      return;
    case "practice":
      openPracticeAction(hotspot);
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
  if (hasLessonsForPlace(hotspot?.id)) {
    openQuestAdv(hotspot);
    return;
  }
  openHintAdv(hotspot, hotspot?.hint || "There is no English practice ready here.");
}

function leaveScene(hotspot) {
  closeAdv();
  if (hotspot?.kind === "room") openArea("castle");
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

function openQuestAdv(hotspot) {
  const lesson = pickLesson(hotspot.id);
  if (!lesson) {
    openHintAdv(hotspot, "No English task is ready for this place yet.");
    return;
  }
  const quest = createQuestForPlace(hotspot.id);
  state.activeQuest = quest;
  openAdvBase(hotspot, "quest");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  activeLesson = localizeLesson(lesson);
  advChineseUsed = false;
  advWrongAttempts = 0;
  activeOpeningZh = withPlayerName(quest.openingZh) || "";
  elements.advLine.textContent = quest.opening;
  elements.advPrompt.textContent = `${quest.title}: ${activeLesson.prompt}`;
  updatePromptAudioButtons();
  const zhByChoice = Array.isArray(activeLesson.choicesZh) ? activeLesson.choicesZh : [];
  const options = activeLesson.choices.map((choice, i) => ({ choice, zh: zhByChoice[i] || "" }));
  shuffled(options).forEach((option, index) => addChoiceRow(option.choice, option.zh, index + 1));
  addAdvOption("↩ Leave", closeAdv, { leave: true });
  scheduleAdvFocus(0);
  speak(quest.opening, npcVoiceFor(hotspot), { source: "npc-quest-opening" });
}

// issue #73：題目（advLine）的中文撥放鈕僅在有中文時顯示。
function updatePromptAudioButtons() {
  if (elements.speakPromptButtonZh) elements.speakPromptButtonZh.hidden = !activeOpeningZh;
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
  elements.advLine.textContent = line;
  elements.advPrompt.textContent = hasLessonsForPlace(hotspot?.id)
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
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "dresses";
  const stockedCategories = availableShopCategories(hotspot);
  shopCategory = stockedCategories.includes(shopCategory) ? shopCategory : stockedCategories[0] || firstCategory;
  clearTryOnPreview({ renderDoll: false });
  elements.advLine.textContent = shopGreeting(hotspot);
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
  elements.advLine.textContent = `${sceneConfigFor(hotspot).npc} can help return treasures from this shop.`;
  elements.advPrompt.textContent = "Tap an owned treasure, then Refund.";
  elements.shopArea.classList.remove("wardrobe-detail");
  elements.shopArea.classList.add("show", "refund-detail");
  renderRefundDetail();
  scheduleAdvFocus(0);
  speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-refund" });
}

function openWardrobeDetail(category = "dresses") {
  const hotspot = hotspotById("princessRoom");
  activeShopHotspot = hotspot;
  advMode = "wardrobe";
  shopCategory = category;
  clearTryOnPreview({ renderDoll: false });
  elements.advScene.dataset.mode = "wardrobe";
  elements.advLine.textContent = `Choose ${categoryLabel(category).toLowerCase()} for ${princessName()}.`;
  elements.advPrompt.textContent = "Tap to preview, then equip.";
  elements.shopArea.classList.remove("refund-detail");
  elements.shopArea.classList.add("show", "wardrobe-detail");
  renderWardrobeDetail();
}

function wardrobeEmptyText(category = shopCategory) {
  const messages = {
    accessories: "Buy accessories at the Accessory Atelier or Fairy Atelier first.",
    bottoms: "Buy bottoms at the Tailor Studio, Castle Seamstress, or Workwear Stall first.",
    dresses: "Buy dresses at the Dress Boutique or Fairy Atelier first.",
    hair: "Buy hairstyles at the Hair Salon first.",
    hats: "Buy hats at the Accessory Atelier, Royal Cloak Room, or Field Cobbler first.",
    outfitSets: "Buy outfit sets at the Dress Boutique first.",
    outerwear: "Buy outerwear at the Dress Boutique, Royal Cloak Room, or Dwarf Cottage first.",
    shoes: "Buy shoes at the Shoe Shop first.",
    tops: "Buy tops at the Tailor Studio, Castle Seamstress, or Workwear Stall first."
  };
  return messages[category] || `Buy ${categoryLabel(category).toLowerCase()} in the urban first.`;
}

function renderWardrobeDetail(preserveFocus = false) {
  const allCategories = categories.map((category) => category.id);
  if (!allCategories.includes(shopCategory)) shopCategory = "dresses";
  const categoryItems = shopItems.filter((item) => itemMatchesCategory(item, shopCategory) && state.owned.includes(item.id));
  if (shopPreviewItemId && !categoryItems.some((item) => item.id === shopPreviewItemId)) clearTryOnPreview({ renderDoll: false });
  const previewItem = categoryItems.find((item) => item.id === shopPreviewItemId) || null;
  renderCategoryTabs(elements.advShopTabs, shopCategory, (nextCategory) => {
    shopCategory = nextCategory;
    clearTryOnPreview({ renderDoll: false });
    elements.advFeedback.textContent = "";
    renderWardrobeDetail();
  }, false, allCategories);
  renderActiveTryOnDoll();
  const backButton = renderItemDetailPanel({
    actionForItem: wardrobePanelAction,
    categoryLabel,
    emptyText: wardrobeEmptyText(shopCategory),
    items: categoryItems,
    listElement: elements.advShopGrid,
    mode: "wardrobe",
    onAction: equipWardrobePreview,
    onBack: backToRoomScene,
    onPreview: previewWardrobeItem,
    previewStyleForItem: itemPreviewStyle,
    selectedItemId: shopPreviewItemId
  });
  renderItemPanelCommands(backButton);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  scheduleAdvFocus(focusIndex);
}

function previewWardrobeItem(item) {
  if (!item) return;
  shopPreviewItemId = item.id;
  elements.advFeedback.textContent = tryOnFeedbackText(item, "wardrobe");
  renderWardrobeDetail(true);
}

function wardrobeActionLabel(item) {
  if (!item) return "Pick a treasure";
  if (item.type === "room") return state.outfit.room === item.id ? "Placed" : "Place";
  return isItemEquipped(item) ? "Wearing" : "Equip";
}

function wardrobePanelAction(item) {
  const equipped = isItemEquipped(item);
  const label = wardrobeActionLabel(item);
  return {
    label,
    status: equipped ? label : "Owned",
    ariaLabel: equipped ? `${item.name} ${label}` : `${label} ${item.name}`,
    disabled: equipped
  };
}

function equipWardrobePreview(item) {
  if (!item) return;
  if (item.type === "room") {
    state.outfit.room = item.id;
    elements.advFeedback.textContent = `${item.name} is placed in ${princessName()}'s room.`;
  } else {
    equipOutfitItem(item);
    elements.advFeedback.textContent = `${item.name} equipped.`;
  }
  persist();
  render();
  renderWardrobeDetail(true);
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

function renderAdvShop(preserveFocus = false) {
  const allowed = allowedShopCategories();
  const stockedCategories = availableShopCategories();
  if (!stockedCategories.includes(shopCategory)) shopCategory = stockedCategories[0] || allowed[0] || "dresses";
  const categoryItems = unownedShopItemsFor(activeShopHotspot, shopCategory);
  if (!stockedCategories.length) {
    clearTryOnPreview({ renderDoll: false });
    renderCategoryTabs(elements.advShopTabs, shopCategory, () => {}, false, []);
    renderShopSoldOut();
    const backButton = renderItemDetailPanel({
      actionForItem: shopPanelAction,
      categoryLabel,
      emptyText: `You found all ${activeShopHotspot?.label || "shop"} treasures!`,
      items: [],
      listElement: elements.advShopGrid,
      mode: "shop",
      onAction: buyItemInAdv,
      onBack: backToStoreScene,
      onPreview: previewShopItem,
      previewStyleForItem: itemPreviewStyle,
      selectedItemId: shopPreviewItemId
    });
    renderItemPanelCommands(backButton);
    scheduleAdvFocus(0);
    return;
  }
  if (shopPreviewItemId && !categoryItems.some((item) => item.id === shopPreviewItemId)) clearTryOnPreview({ renderDoll: false });
  const previewItem = categoryItems.find((item) => item.id === shopPreviewItemId) || null;
  renderCategoryTabs(elements.advShopTabs, shopCategory, (category) => {
    shopCategory = category;
    clearTryOnPreview({ renderDoll: false });
    elements.advFeedback.textContent = "";
    renderAdvShop();
  }, false, stockedCategories);
  renderActiveTryOnDoll();
  const backButton = renderItemDetailPanel({
    actionForItem: shopPanelAction,
    categoryLabel,
    emptyText: `You found all ${activeShopHotspot?.label || "shop"} treasures!`,
    items: categoryItems,
    listElement: elements.advShopGrid,
    mode: "shop",
    onAction: buyItemInAdv,
    onBack: backToStoreScene,
    onPreview: previewShopItem,
    previewStyleForItem: itemPreviewStyle,
    selectedItemId: shopPreviewItemId
  });
  renderItemPanelCommands(backButton);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  scheduleAdvFocus(focusIndex);
}

function previewShopItem(item) {
  if (!item) return;
  shopPreviewItemId = item.id;
  elements.advFeedback.textContent = tryOnFeedbackText(item, "shop");
  renderAdvShop(true);
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
  const action = item.type === "outfitSet"
    ? source === "wardrobe" ? `Trying the full set on ${princessName()}` : "Trying the full set before buying"
    : source === "wardrobe" ? `Trying it on ${princessName()}` : `Trying it on ${princessName()} before buying`;
  return `${item.name}: ${action}. ${status}.`;
}

function renderShopSoldOut() {
  elements.shopArea.querySelector(".shop-feature")?.remove();
  renderPaperDolls();
  elements.advLine.textContent = "You found every treasure in this shop.";
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
  const unlockIds = purchaseUnlockIds(item);
  const newlyUnlockedIds = unlockIds.filter((itemId) => !state.owned.includes(itemId));
  unlockIds.forEach((itemId) => {
    if (!state.owned.includes(itemId)) state.owned.push(itemId);
  });
  recordPurchaseSources(item, newlyUnlockedIds);
  if (item.type === "outfitSet") {
    ensureBundleUnlocksState();
    state.bundleUnlocks[item.id] = newlyUnlockedIds.filter((itemId) => itemId !== item.id);
  }
  if (item.type !== "room") equipOutfitItem(item);
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  const feedbackText = item.type === "room" ? `${item.name} is in ${princessName()}'s room now.` : `${item.name} is on ${princessName()} now.`;
  elements.advLine.textContent = `${item.name} is yours now. It looks wonderful.`;
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  showRewardBurst(`${item.name} ✦`);
  persist();
  render();
  shopPreviewItemId = "";
  renderAdvShop(true);
}

function purchaseUnlockIds(item) {
  if (item?.type !== "outfitSet") return [item.id];
  return [item.id, ...Object.values(item.equips || {})].filter(Boolean);
}

function ensureBundleUnlocksState() {
  if (!state.bundleUnlocks || Array.isArray(state.bundleUnlocks) || typeof state.bundleUnlocks !== "object") {
    state.bundleUnlocks = {};
  }
}

function ensurePurchaseStoreIdsState() {
  if (!state.purchaseStoreIds || Array.isArray(state.purchaseStoreIds) || typeof state.purchaseStoreIds !== "object") {
    state.purchaseStoreIds = {};
  }
}

function recordPurchaseSources(item, newlyUnlockedIds) {
  ensurePurchaseStoreIdsState();
  state.purchaseStoreIds[item.id] = item.storeId;
  if (item.type !== "outfitSet") return;
  const bundleSource = bundlePurchaseSource(item.id);
  newlyUnlockedIds
    .filter((itemId) => itemId !== item.id)
    .forEach((itemId) => {
      state.purchaseStoreIds[itemId] = bundleSource;
    });
}

function bundlePurchaseSource(bundleId) {
  return `bundle:${bundleId}`;
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
  elements.advLine.textContent = feedbackText;
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Refund", body: `Refunded ${item.name}.`, result: `+${amount} coins` });
  persist();
  render();
  renderRefundDetail(true);
}

function refundRemovalIds(item) {
  ensurePurchaseStoreIdsState();
  if (item?.type !== "outfitSet") {
    delete state.purchaseStoreIds[item.id];
    return [item.id];
  }
  ensureBundleUnlocksState();
  const recordedUnlocks = Array.isArray(state.bundleUnlocks[item.id]) ? state.bundleUnlocks[item.id] : [];
  delete state.bundleUnlocks[item.id];
  delete state.purchaseStoreIds[item.id];
  const bundleSource = bundlePurchaseSource(item.id);
  recordedUnlocks.forEach((itemId) => {
    if (state.purchaseStoreIds[itemId] === bundleSource) delete state.purchaseStoreIds[itemId];
  });
  return [item.id, ...recordedUnlocks].filter(Boolean);
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

function closeAdvThenHome() {
  closeAdv();
  changeView("home");
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
function pickLesson(place) {
  const lesson = sceneConfigs[place]?.lesson;
  const questions = lesson?.questions;
  if (!Array.isArray(questions) || !questions.length) return null;
  const index = Math.floor(Math.random() * questions.length);
  return {
    ...questions[index],
    place,
    id: `${lesson.area}-${place}-${String(index + 1).padStart(2, "0")}`,
    vocabProfile: lesson.vocabProfile
  };
}

function hasLessonsForPlace(place) {
  return Boolean(place && sceneConfigs[place]?.lesson?.questions?.length);
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
  const baseCoins = activeLesson.reward.coins || 0;
  const rewardTier = helpRewardTier();   // issue #73 獎勵階梯：full／half／none
  const coins = rewardTier === "full"
    ? baseCoins
    : rewardTier === "half"
      ? Math.round(baseCoins * REWARD_SECOND_TRY_RATIO)
      : 0;
  const reward = { coins };
  applyEffects(reward);
  playTone("correct");
  addUnique("completedLessons", [activeLesson.id]);
  addUnique("learnedWords", activeLesson.words);
  addUnique("metNpcs", [sceneConfigFor(completedHotspot).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(coins > 0 ? `+${coins} coins` : "No coins this time");
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === activeLesson.answer) item.classList.add("correct");
  });
  addDiary({
    type: "quest",
    title: `${quest.title} at ${completedHotspot.label}`,
    body: `Sentence: "${activeLesson.answer}"`,
    result: effectText(reward),
    lessonId: activeLesson.id,
    words: activeLesson.words,
    vocabProfile: activeLesson.vocabProfile
  });
  elements.advLine.textContent = quest.ending;
  // issue #100：完成提示文案對齊實際可用動作（已移除「選擇獎勵」導購）——商店場景可逛商店，其餘場景僅返回／離開。
  elements.advPrompt.textContent = completedHotspot?.kind === "shop"
    ? `Practice complete. Visit the shop, or go back to ${princessName()}'s room.`
    : `Practice complete. Go back to ${princessName()}'s room, or leave.`;
  elements.advFeedback.textContent = coins > 0
    ? (rewardTier === "half" ? `${effectText(reward)}. Half coins for the second try.` : `${effectText(reward)}.`)
    : advChineseUsed
      ? "Nice learning with Chinese help! No coins this time."
      : "No coins this time — try to answer sooner next time.";
  state.activeQuest = null;
  activeLesson = null;
  advMode = "complete";
  elements.advScene.dataset.mode = "complete";
  elements.choiceList.innerHTML = "";
  elements.advActionFooter.innerHTML = "";
  // issue #100：答對一律直接發 coins（已於上方結算）；商店場景額外提供購物入口，移除「選擇獎勵」導購分支。
  if (completedHotspot?.kind === "shop") {
    addAdvOption("🎁 Shop", () => openShopDetail(completedHotspot));
  }
  addAdvOption("🏰 Back to Room", closeAdvThenHome, { navigation: true });
  addAdvOption("↩ Leave", closeAdv, { leave: true });
  elements.statusMessage.textContent = `Practice complete at ${completedHotspot.label}.`;
  persist();
  render();
  scheduleAdvFocus(0);
  // issue #93：公主以其音色朗讀所選正解，結束後再由 NPC 以其音色說結語。
  const endingLine = elements.advLine.textContent;
  speak(choice, playerVoiceProfile(), { source: "princess-answer-correct", then: () => speak(endingLine, npcVoiceFor(completedHotspot), { source: "npc-quest-ending" }) });
}

function closeAdv() {
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  advMode = "closed";
  elements.advScene.dataset.mode = "closed";
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
    refreshVoices();
    try {
      window.speechSynthesis?.addEventListener?.("voiceschanged", refreshVoices);
    } catch {}
  };

  const selectVoice = (profile) => {
    init();
    const available = voices.length ? voices : refreshVoices();
    const lang = profile.lang || "en-US";
    const target = normalizeLang(lang);
    const primary = primaryLang(lang);
    const hint = String(profile.voiceHint || "").toLowerCase();
    if (!available.length) {
      return { voice: null, fallbackReason: "voices-empty", voiceLoadState };
    }
    const langMatches = available.filter((voice) => normalizeLang(voice.lang) === target);
    const primaryMatches = available.filter((voice) => primaryLang(voice.lang) === primary);
    const defaultVoice = available.find((voice) => voice.default) || available[0] || null;
    const hintMatch = hint
      ? [...langMatches, ...primaryMatches].find((voice) => String(voice.name || "").toLowerCase().includes(hint))
      : null;
    if (hintMatch) return { voice: hintMatch, fallbackReason: "", voiceLoadState };
    if (langMatches[0]) return { voice: langMatches[0], fallbackReason: "", voiceLoadState };
    if (primaryMatches[0]) return { voice: primaryMatches[0], fallbackReason: `fallback-${primary}`, voiceLoadState };
    return { voice: defaultVoice, fallbackReason: "language-unavailable", voiceLoadState };
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
    const utterance = new SpeechSynthesisUtterance(text);
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
    diagnostics: () => speechDiagnostics.slice(),
    resetDiagnostics: () => { speechDiagnostics.length = 0; },
    voiceLoadState: () => voiceLoadState
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
  elements.characterCancel?.addEventListener("click", closeCharacterSelect);
  elements.characterSelect?.addEventListener("click", (event) => {
    if (event.target.matches("[data-character-cancel]") && !elements.characterSelect.classList.contains("first-run")) {
      closeCharacterSelect();
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
  elements.switchAccountButton?.addEventListener("click", () => {
    returnToInitialSelect();
  });
  elements.systemMenuClose.addEventListener("click", closeSystemMenu);
  elements.systemMenu.addEventListener("click", (event) => {
    if (event.target.matches("[data-system-close]")) closeSystemMenu();
  });
  elements.systemMenuTabs.forEach((tab) => tab.addEventListener("click", () => changeSystemPanel(tab.dataset.menuPanel)));
  elements.goMapButton?.addEventListener("click", openWorldMap);
  elements.returnHomeButton?.addEventListener("click", () => openArea("castle"));
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
    const key = event.key.toLowerCase();
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", -1);
    } else if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(1, 0);
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
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("world", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("world", -1);
    } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnWorldMap(0, -1);
    } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnWorldMap(0, 1);
    } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnWorldMap(-1, 0);
    } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnWorldMap(1, 0);
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
    const key = event.key.toLowerCase();
    const areaId = activeTravelMapArea();
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard(areaId, 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard(areaId, -1);
    } else if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(1, 0);
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
  window.addEventListener("keydown", (event) => {
    if (elements.characterSelect?.classList.contains("show")) {
      if (event.key === "Escape" && !elements.characterSelect.classList.contains("first-run")) {
        event.preventDefault();
        closeCharacterSelect();
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
  openAccountSelect,
  closeAccountSelect,
  returnToInitialSelect,
  profileColorPalette,
  defaultProfileColorFor,
  normalizeProfileColor,
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
    }
  },
  get shopPreviewItemId() { return shopPreviewItemId; },
  set shopPreviewItemId(nextItemId) { shopPreviewItemId = nextItemId; },
  get shopCategory() { return shopCategory; },
  set shopCategory(nextCategory) { shopCategory = nextCategory; },
  $$,
  areaForHotspot,
  areaRegistry,
  allowedShopCategories,
  answerLesson,
  openQuestAdv,
  getActiveLesson: () => activeLesson,
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
  persist,
  renderWorldMap,
  renderCastleMap,
  render,
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
  refreshSpeechVoices: () => speechManager.refreshVoices(),
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
