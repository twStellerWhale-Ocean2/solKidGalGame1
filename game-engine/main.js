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
  buildSaveMarkdown,
  loadMarkdown,
  loadMarkdownText,
  persist,
  resetProgress,
  saveMarkdown
} from "./system/persistence.js";
import {
  applyPlayLimitSettings,
  clockNow,
  resumePlayFromBreak,
  startPlayClock
} from "./state/play-session.js";
import {
  addDiary,
  addUnique,
  applyEffects,
  awardBadge,
  localizeLesson,
  princessName,
  render,
  renderAreaNav,
  renderHome,
  renderSettings,
  setExpressions,
  syncActiveAccountMeta,
  updateProgressBadges,
  withPlayerName
} from "./render/hud.js";
import { activeViewName, changeSystemPanel, changeView, closeSystemMenu, isSystemMenuOpen, openSystemMenu } from "./app/views.js";
import {
  buildAccountList,
  cancelCharacterSelect,
  closeAccountSelect,
  confirmCharacterSelect,
  createNewAccount,
  handleDeleteAccount,
  openAccountSelect,
  openCharacterSelect,
  refreshAccountStatuses,
  returnToInitialSelect
} from "./app/select-screens.js";
import {
  answerLesson,
  backToSceneMenu,
  closeAdv,
  confirmAdvFocus,
  handleFirstLayerSceneAction,
  hasChatForPlace,
  hasLessonsForPlace,
  jobAvailableForPlace,
  moveAdvFocus,
  openAdvBase,
  openHintAdv,
  openQuestAdv,
  openRoomScene,
  openSceneAdv,
  scheduleAdvFocus,
  setAdvLine,
  showRewardBurst
} from "./scene/adv-flow.js";
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
  applyEffects,
  clockNow,
  localizeLesson,
  setExpressions,
  withPlayerName,
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
