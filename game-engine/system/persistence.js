// system/persistence.js — 進度持久化與匯出／匯入／重置（issue #298 自 main.js 拆出，行為零變更）。
import { createSaveLoadController } from "./save-load.js";
import {
  buildSaveMarkdown as buildStateSaveMarkdown,
  freshState,
  normalizeState,
  persistState
} from "../state/game-state.js";
import { render, syncActiveAccountMeta } from "../render/hud.js";
import { elements, session } from "../core/session.js";
export const saveLoadController = createSaveLoadController({
  buildSaveMarkdown,
  elements,
  normalizeState,
  onStateLoaded(nextState) { session.state = nextState; },
  persist,
  render
});

export function persist() {
  persistState(session.state);
  syncActiveAccountMeta({ touched: true });
}

// ---- 遊玩時間限制與護眼休息（issue #6 / spec#9）：ticker、HUD 與結算／休息 overlay ----

export function buildSaveMarkdown() {
  return buildStateSaveMarkdown(session.state);
}

export async function saveMarkdown() {
  return saveLoadController.saveMarkdown();
}

export function loadMarkdownText(text) {
  return saveLoadController.loadMarkdownText(text);
}

export async function loadMarkdown() {
  return saveLoadController.loadMarkdown();
}

export function resetProgress() {
  session.state = freshState();
  persist();
  elements.statusMessage.textContent = "Progress reset. A new short talk is ready.";
  render();
}

