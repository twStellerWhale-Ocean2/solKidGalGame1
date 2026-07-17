// system/persistence.js — 進度持久化與匯出／匯入／重置（issue #298 自 main.js 拆出，行為零變更）。
import { createSaveLoadController } from "./save-load.js";
import {
  buildSaveMarkdown as buildStateSaveMarkdown,
  freshState,
  normalizeState,
  persistState
} from "../state/game-state.js";
import { render, syncActiveAccountMeta } from "../render/hud.js";
import { cloud, cloudActive, scheduleCloudSave } from "./cloud-sync.js";

function cloudBaseUpdatedAt() { return cloud.baseUpdatedAt; }
import { elements, session } from "../core/session.js";
export const saveLoadController = createSaveLoadController({
  buildSaveMarkdown,
  // issue #309：雲端帳號已有雲端進度時，匯入前明確警示覆蓋方向（Markdown 遷移路徑，spec#24 (a)）。
  confirmImport: () => !cloudActive() || cloudBaseUpdatedAt() === null
    || window.confirm("Importing will OVERWRITE this account's cloud progress with the file. Continue?"),
  elements,
  normalizeState,
  onStateLoaded(nextState) { session.state = nextState; },
  persist,
  render
});

export function persist() {
  // issue #309（spec#24）：雲端模式（已登入伺服器帳號）進度寫往 sysApi 雲端存檔（leading＋trailing 節流）；
  // 本機 localStorage 僅於本機模式（selftest 測試替身／未登入）寫入，正式遊玩不再為進度寫入目標。
  if (cloudActive()) {
    scheduleCloudSave();
    syncActiveAccountMeta({ touched: true });
    return;
  }
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

