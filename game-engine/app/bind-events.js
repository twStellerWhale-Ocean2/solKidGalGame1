// app/bind-events.js — 全域事件接線：按鍵、點擊、拖曳與表單（issue #298 自 main.js 拆出，行為零變更）。
import { CLOUD_MODE } from "./env.js";
import { loginScreenSetMode } from "./login-screen.js";
import { CHINESE_AUDIO_LANG, playLessonAudio, speechManager } from "../scene/speech.js";
import { WARDROBE_TUNER_DEV_PATH, isLocalDevEnv } from "./env.js";
import { _positionAdjustBtn, buyItemInAdv, patchWardrobeItem } from "../wardrobe/shop-panel.js";
import { activePaperDollCharacter, paperDollRenderer } from "../wardrobe/doll.js";
import {
  activeTravelMapArea,
  interactCastleHotspot,
  interactNearby,
  mapWalkController,
  moveOnCastleMap,
  moveOnMap,
  openArea,
  openWorldMap,
  renderCastleMap,
  renderMap,
  zoomAreaMapFromKeyboard
} from "../map/map-runtime.js";
import {
  activeWorldDestination,
  moveOnWorldMap,
  nearbyWorldDestination,
  openWorldDestination,
  renderWorldMap
} from "../map/world-map.js";
import {
  beginCastleMapDrag,
  beginMapDrag,
  beginWorldMapDrag,
  finishCastleMapDrag,
  finishMapDrag,
  finishWorldMapDrag,
  moveCastleMapDrag,
  moveMapDrag,
  moveWorldMapDrag
} from "../map/map-gestures.js";
import { applyPlayLimitSettings, resumePlayFromBreak } from "../state/play-session.js";
import {
  buildSaveMarkdown,
  loadMarkdown,
  loadMarkdownText,
  persist,
  resetProgress,
  saveMarkdown
} from "../system/persistence.js";
import {
  cancelCharacterSelect,
  closeAccountSelect,
  confirmCharacterSelect,
  createNewAccount,
  openCharacterSelect,
  returnToInitialSelect
} from "./select-screens.js";
import {
  changeSystemPanel,
  changeView,
  closeSystemMenu,
  isSystemMenuOpen,
  openSystemMenu
} from "./views.js";
import { closeAdv, confirmAdvFocus, moveAdvFocus } from "../scene/adv-flow.js";
import { directionForKey } from "../map/keyboard-walk.js";
import { itemById } from "../core/lookups.js";
import { openAdjustOverlay } from "../render/adjust-overlay.js";
import { saveMarkerEnd, saveMarkerStart } from "../state/storage.js";
import { princessName, render, renderSettings } from "../render/hud.js";
import { elements, session } from "../core/session.js";
export function bindEvents() {
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
  // issue #309：雲端模式下「建立新帳號」走登入畫面之註冊表單；本機模式（selftest 替身）維持原新增帳號。
  elements.accountNewButton?.addEventListener("click", () => {
    if (CLOUD_MODE) {
      loginScreenSetMode("register");
      return;
    }
    createNewAccount();
  });
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


