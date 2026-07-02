import { $$ } from "./app/elements.js";
import { isLocalDevEnv, isLocalDevHost, WARDROBE_TUNER_DEV_PATH } from "./app/env.js";
import { areaForHotspot, categoryForType, itemMatchesCategory, hotspotById, itemById, nodeMapForArea, sceneConfigFor } from "./core/lookups.js";
import { areaRegistry, castleMapNodes, categories, characterScaleContract, characterRegistry, defaultActiveCharacterId, defaultProfileColorFor, difficultyConfig, playableCharacterById, normalizeProfileColor, randomProfileColor, backgroundPatternIds, normalizeBackgroundPattern, randomBackgroundPattern, mapNodes, paperDollBaseLayer, wardrobeLayerBoundsByType, wardrobeLayerBoundsForType, playableVoiceById, profileColorPalette, shopItems, worldMap, composeVoiceProfile, resolveVoiceProfile, DEFAULT_VOICE_PROFILE, recommendedVoiceNamesForGender, usedVoiceBuckets } from "./data/game-data.js";
import { firstLayerActionsFor } from "./flow/scene-actions.js";
import { mapActorMotionTypes } from "./map/actors.js";
import { renderVoiceSettings } from "./render/settings.js";
import { VOICE_ASSIGNMENT_KEY } from "./state/voice-assignments.js";
import { createQuestForPlace, createRandomQuest, createFreshAccount, freshState, loadAccountState, normalizeState } from "./state/game-state.js";
import { deleteAccount, getActiveAccountId, listAccounts, setActiveAccountId } from "./state/accounts.js";
import { installTestingHooks } from "./testing/selftests.js?v=20260626-issue267-wardrobe-ssot";
import { elements, session } from "./core/session.js";
import { bindEvents } from "./app/bind-events.js";
import { buildSaveMarkdown, loadMarkdownText, persist } from "./system/persistence.js";
import { clockNow, startPlayClock } from "./state/play-session.js";
import { render, renderSettings, syncActiveAccountMeta } from "./render/hud.js";
import { changeView, closeSystemMenu, openSystemMenu } from "./app/views.js";
import { buildAccountList, cancelCharacterSelect, closeAccountSelect, createNewAccount, openAccountSelect, openCharacterSelect, refreshAccountStatuses, returnToInitialSelect } from "./app/select-screens.js";
import { answerLesson, backToSceneMenu, closeAdv, handleFirstLayerSceneAction, hasChatForPlace, hasLessonsForPlace, openHintAdv, openQuestAdv, openRoomScene, openSceneAdv } from "./scene/adv-flow.js";
import { equipOutfitItem, toggleEquip } from "./wardrobe/doll.js";
import { allowedShopCategories, buyItemInAdv, openRefundDetail, openShopDetail, openWardrobeDetail, refundItemInAdv, renderAdvShop, renderRefundDetail, renderWardrobeDetail, toggleShopTryOn } from "./wardrobe/shop-panel.js";
import { areaMapMetrics, currentPlayerPoint, focusCastleHotspot, focusTravelHotspot, interactCurrentLocation, isWalkable, mapActorRuntime, moveOnCastleMap, moveOnMap, openArea, openWorldMap, renderCastleMap, renderMap } from "./map/map-runtime.js";
import { finishWorldTravel, focusWorldDestination, moveOnWorldMap, nearbyWorldDestination, openWorldDestination, renderWorldMap, requestWorldTravel, worldDestinationById, worldDestinationForArea } from "./map/world-map.js";
import { applyAreaMapViewport, refreshAreaMapPositions } from "./map/map-gestures.js";
import { SPEECH_DEBOUNCE_MS, SPEECH_LEADING_PAD, SPEECH_QUEUE_MODE, SPEECH_RATE_SCALE, effectiveSpeechRate, npcVoiceFor, playerVoiceProfile, speechManager } from "./scene/speech.js";
import { extendSession, isJobDone, markJobDone, normalizePlayLimit, playStatus, recordAnswer as recordCycleAnswer, resumeFromRest, tick as tickPlayLimit } from "./system/play-clock.js";

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
