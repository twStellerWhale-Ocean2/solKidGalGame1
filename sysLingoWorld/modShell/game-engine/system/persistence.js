// system/persistence.js — 進度持久化與匯出／匯入／重置（issue #298 自 main.js 拆出，行為零變更）。
import { createSaveLoadController } from "./save-load.js";
import {
  buildSaveMarkdown as buildStateSaveMarkdown,
  characterSliceOf,
  freshState,
  newCharacterSaveId,
  normalizeState,
  persistState,
  reassembleEnvelope,
  rosterEnvelopeOf,
  ROSTER_CAP
} from "../state/game-state.js";
import { commitRoster, getActiveRoster } from "../app/select-screens.js"; // #380：roster 匯出/匯入（cyclic，runtime 呼叫安全）
import { render, syncActiveAccountMeta } from "../render/hud.js";
import { cloud, cloudActive, scheduleCloudSave } from "./cloud-sync.js";

function cloudBaseUpdatedAt() { return cloud.baseUpdatedAt; }
import { elements, session } from "../core/session.js";
export const saveLoadController = createSaveLoadController({
  buildSaveMarkdown,
  // issue #309：雲端帳號已有雲端進度時，匯入前明確警示覆蓋方向（Markdown 遷移路徑，spec#24 (a)）。
  confirmImport: () => !cloudActive() || cloudBaseUpdatedAt() === null
    || window.confirm("Importing this file will change this player's saved princesses. Continue?"), // #380：措辭中性（roster 可為 add 或 replace）
  elements,
  normalizeState,
  onStateLoaded(nextState) { session.state = nextState; },
  // #380：匯入之 payload 為 roster envelope 時，提示 ADD（保留現有公主）或 REPLACE（以檔案取代）。
  importRosterMode(envelope) {
    const n = Object.keys(envelope.characters || {}).length;
    return window.confirm(`This save file has ${n} princess${n === 1 ? "" : "es"}.\n\nOK: ADD ${n === 1 ? "her" : "them"} to this player (keep your current princesses).\nCancel: REPLACE this player's princesses with the file.`)
      ? "add"
      : "replace";
  },
  onRosterLoaded(envelope, mode) {
    if (mode === "add") importRosterAdd(envelope);
    else importRosterReplace(envelope);
  },
  persist,
  render
});

// #380：以檔案 roster 取代目前玩家之 roster（active＝檔案之 active）。
function importRosterReplace(imported) {
  const env = rosterEnvelopeOf(imported);
  session.state = normalizeState(env.characters[env.activeCharacterSaveId]);
  commitRoster(env);
}

// #380：把檔案之各公主加入目前玩家 roster（各配新 saveId、守上限）；目前 active 不變。
function importRosterAdd(imported) {
  const current = getActiveRoster();
  current.characters[current.activeCharacterSaveId] = characterSliceOf(session.state); // 保存目前 active 最新變動
  const importedEnv = rosterEnvelopeOf(imported);
  Object.values(importedEnv.characters).forEach((slice) => {
    if (Object.keys(current.characters).length >= ROSTER_CAP) return; // 守上限
    current.characters[newCharacterSaveId()] = characterSliceOf(slice);
  });
  commitRoster(current);
}

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
  // #380：匯出整個 roster envelope（併入 active 最新變動），使 .md 備份含所有公主。
  const envelope = reassembleEnvelope(session.state, getActiveRoster());
  return buildStateSaveMarkdown(session.state, envelope);
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

