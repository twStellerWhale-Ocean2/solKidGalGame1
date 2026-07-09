import { $$ } from "./app/elements.js";
import { CLOUD_MODE, isLocalDevEnv, isLocalDevHost, WARDROBE_TUNER_DEV_PATH } from "./app/env.js";
import { setApiFetch, USERNAME_PATTERN, PASSWORD_MIN_LENGTH, validateUsernameInput, validatePasswordInput } from "./system/api-client.js";
import { adoptServerBase, cloud, cloudActive, cloudLogin, cloudLogout, cloudRegister, cloudResume, flushCloudSave, installCloudLifecycleFlush, scheduleCloudSave, syncRecentSummary } from "./system/cloud-sync.js";
import { buildLoginScreen, loginScreenSetMode, migrateLocalAccount, openLoginScreen } from "./app/login-screen.js";
import { loadCachedSession, loadMigratedLocalIds, loadRecentAccounts, MIGRATED_FLAG_KEY, RECENT_ACCOUNTS_KEY, SESSION_CACHE_KEY, upsertRecentAccount } from "./state/cloud-session.js";
import { areaForHotspot, categoryForType, itemMatchesCategory, hotspotById, itemById, nodeMapForArea, sceneConfigFor } from "./core/lookups.js";
import { areaRegistry, castleMapNodes, categories, characterScaleContract, characterRegistry, defaultActiveCharacterId, defaultProfileColorFor, difficultyConfig, playableCharacterById, normalizeProfileColor, randomProfileColor, backgroundPatternIds, normalizeBackgroundPattern, randomBackgroundPattern, mapNodes, paperDollBaseLayer, wardrobeLayerBoundsByType, wardrobeLayerBoundsForType, playableVoiceById, profileColorPalette, shopItems, worldMap, composeVoiceProfile, resolveVoiceProfile, DEFAULT_VOICE_PROFILE, recommendedVoiceNamesForGender, usedVoiceBuckets } from "./data/game-data.js";
import { firstLayerActionsFor } from "./flow/scene-actions.js";
import { mapActorMotionTypes } from "./map/actors.js";
import { renderVoiceSettings } from "./render/settings.js";
import { VOICE_ASSIGNMENT_KEY } from "./state/voice-assignments.js";
import { createQuestForPlace, createRandomQuest, createFreshAccount, freshState, loadAccountState, normalizeState } from "./state/game-state.js";
import { deleteAccount, getActiveAccountId, listAccounts, setActiveAccountId } from "./state/accounts.js";
import { installTestingHooks } from "./testing/selftests.js?v=20260703-issue298-split-monolith";
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
// 伺服器帳號登入 gate（issue #309 / spec#8、#23）：每次進入先到登入畫面（帳號卡＋密碼；最後登入帳號有有效 session 可免密續玩）。
// selftest 模式沿用本機帳號後端為測試替身、不開登入 gate（?selftest=auth 以注入 fake fetch 驗雲端路徑）。
if (CLOUD_MODE) {
  cloud.onStatusChange = (status) => {
    document.body.classList.toggle("cloud-offline", status === "offline");
    if (status === "offline") {
      elements.statusMessage.textContent = "Cloud sync is offline — you can keep playing, we will retry saving.";
    } else if (status === "idle" && document.body.dataset.cloudWasOffline === "1") {
      elements.statusMessage.textContent = "Progress synced to the server.";
    }
    document.body.dataset.cloudWasOffline = status === "offline" ? "1" : "0";
  };
  cloud.onSessionExpired = () => {
    elements.statusMessage.textContent = "Your sign-in expired. Please sign in again to keep saving.";
    openLoginScreen({ mustChoose: true });
  };
  cloud.onConflict = (serverSave) => {
    // spec#24 並發保護：他裝置有較新進度時提示重載，不靜默覆蓋。
    const loadNewer = window.confirm("A newer save from another device was found. Load it now? (Cancel keeps this device's progress and overwrites the server.)");
    if (serverSave && loadNewer && serverSave.state) {
      session.state = normalizeState(serverSave.state);
      adoptServerBase(serverSave.updatedAt);
      render();
      elements.statusMessage.textContent = "Loaded the newer save from the server.";
      return;
    }
    if (serverSave) {
      adoptServerBase(serverSave.updatedAt);
      scheduleCloudSave(); // 使用者明示以本機進度覆蓋
    }
  };
  installCloudLifecycleFlush();
  openLoginScreen({ mustChoose: true });
}
if (!hasSelftest) startPlayClock(); // selftest 模式由測試以注入時鐘自行驅動，不啟動真實 ticker。

installTestingHooks({
  get state() { return session.state; },
  set state(nextState) { session.state = nextState; },
  // issue #309：雲端帳號／存檔測試介面（?selftest=auth 以 setApiFetch 注入 in-memory fake server 驗雲端路徑）。
  cloudAuth: {
    setApiFetch,
    usernamePattern: USERNAME_PATTERN,
    passwordMinLength: PASSWORD_MIN_LENGTH,
    validateUsernameInput,
    validatePasswordInput,
    login: cloudLogin,
    register: cloudRegister,
    logout: cloudLogout,
    resume: cloudResume,
    scheduleSave: scheduleCloudSave,
    flushSave: flushCloudSave,
    adoptServerBase,
    syncRecentSummary,
    migrateLocalAccount,
    openLoginScreen,
    buildLoginScreen,
    setLoginMode: loginScreenSetMode,
    isActive: cloudActive,
    get cloud() { return cloud; },
    sessionCacheKey: SESSION_CACHE_KEY,
    recentAccountsKey: RECENT_ACCOUNTS_KEY,
    migratedFlagKey: MIGRATED_FLAG_KEY,
    loadCachedSession,
    loadRecentAccounts,
    loadMigratedLocalIds,
    upsertRecentAccount
  },
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
