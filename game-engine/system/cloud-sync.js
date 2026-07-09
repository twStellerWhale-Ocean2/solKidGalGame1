// system/cloud-sync.js — 雲端存檔同步核心（issue #309 / sysStory#4、spec#24）。
// persist() 在雲端模式改經本模組：leading-edge 立即寫＋trailing 節流合併（paramSaveDebounceMs），
// logout／pagehide flush；網路失敗記憶體續玩＋退避重試＋畫面提示；409 save-conflict 提示重載不靜默覆蓋。
import {
  ApiNetworkError,
  apiGetSave,
  apiLogin,
  apiLogout,
  apiPutSave,
  apiRegister
} from "./api-client.js";
import {
  clearCachedSession,
  loadCachedSession,
  saveCachedSession,
  upsertRecentAccount
} from "../state/cloud-session.js";
import { session } from "../core/session.js";

export const SAVE_DEBOUNCE_MS = 2000;
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60000;

export const cloud = {
  username: null,
  token: null,
  accountCreatedAt: 0,
  baseUpdatedAt: null,
  status: "idle", // idle | saving | offline | conflict | expired
  pending: false,
  inFlight: false,
  debounceTimer: 0,
  retryTimer: 0,
  retryDelayMs: RETRY_BASE_MS,
  onStatusChange: null, // (status, detail) => void — HUD 同步提示
  onSessionExpired: null, // () => void — 逾期導回登入畫面
  onConflict: null // (serverSave) => void — 409：提示重載
};

export function cloudActive() {
  return Boolean(cloud.token);
}

function setStatus(status, detail = "") {
  if (cloud.status === status) return;
  cloud.status = status;
  if (typeof cloud.onStatusChange === "function") cloud.onStatusChange(status, detail);
}

function applyServerTime(serverTime) {
  if (Number.isFinite(serverTime)) {
    // spec#24：以伺服器時間校正遊玩／休息計時（clockNow 加入此偏移）。
    session.serverClockOffsetMs = serverTime - Date.now();
  }
}

function adoptSession(username, token, account, save) {
  cloud.username = username;
  cloud.token = token;
  cloud.accountCreatedAt = Number(account?.createdAt) || 0;
  cloud.baseUpdatedAt = save && Number.isFinite(save.updatedAt) ? save.updatedAt : null;
  cloud.retryDelayMs = RETRY_BASE_MS;
  saveCachedSession(username, token);
  setStatus("idle");
}

// 登入（sysCase#6.1）：成功後取回雲端存檔（state 可為 null＝新局）。
export async function cloudLogin(username, password) {
  const res = await apiLogin(username, password);
  if (res.status !== 200) return { ok: false, status: res.status, code: res.body?.error?.code || "error" };
  const save = await apiGetSave(res.body.token);
  if (save.status !== 200) return { ok: false, status: save.status, code: save.body?.error?.code || "error" };
  applyServerTime(save.body.serverTime);
  adoptSession(username, res.body.token, res.body.account, save.body.updatedAt !== null ? { updatedAt: save.body.updatedAt } : null);
  return { ok: true, state: save.body.state };
}

// 註冊（sysCase#6.2）：成功即自動登入（無存檔、由呼叫端建立新局並首寫）。
export async function cloudRegister(username, password) {
  const res = await apiRegister(username, password);
  if (res.status !== 201) return { ok: false, status: res.status, code: res.body?.error?.code || "error" };
  adoptSession(username, res.body.token, res.body.account, null);
  return { ok: true, state: null };
}

// 以裝置快取 session 續玩（spec#23：僅最後登入帳號免密碼）；401 → 清快取回 null。
export async function cloudResume() {
  const cached = loadCachedSession();
  if (!cached) return null;
  let save;
  try {
    save = await apiGetSave(cached.token);
  } catch (error) {
    if (error instanceof ApiNetworkError) return { ok: false, offline: true, username: cached.username };
    throw error;
  }
  if (save.status !== 200) {
    clearCachedSession();
    return null;
  }
  applyServerTime(save.body.serverTime);
  adoptSession(cached.username, cached.token, { createdAt: 0 }, save.body.updatedAt !== null ? { updatedAt: save.body.updatedAt } : null);
  return { ok: true, username: cached.username, state: save.body.state };
}

// 登出（sysCase#6.3）：先 flush 一次即時保存，再撤銷 session、清 token 快取（保留最近帳號摘要）。
export async function cloudLogout() {
  if (!cloudActive()) return;
  try {
    await flushCloudSave();
    await apiLogout(cloud.token);
  } catch {
    // 離線登出：本地清除即可，伺服器端 session 到期自然失效。
  }
  cloud.username = null;
  cloud.token = null;
  cloud.baseUpdatedAt = null;
  cloud.pending = false;
  if (cloud.debounceTimer) { clearTimeout(cloud.debounceTimer); cloud.debounceTimer = 0; }
  if (cloud.retryTimer) { clearTimeout(cloud.retryTimer); cloud.retryTimer = 0; }
  clearCachedSession();
  setStatus("idle");
}

// persist() 雲端路徑：leading-edge（無進行中寫入且無待寫）立即寫，其餘 trailing 節流合併。
export function scheduleCloudSave() {
  if (!cloudActive()) return;
  if (!cloud.pending && !cloud.inFlight && !cloud.debounceTimer) {
    cloud.pending = true;
    void flushCloudSave();
    return;
  }
  cloud.pending = true;
  if (!cloud.debounceTimer) {
    cloud.debounceTimer = setTimeout(() => {
      cloud.debounceTimer = 0;
      if (cloud.pending) void flushCloudSave();
    }, SAVE_DEBOUNCE_MS);
  }
}

export async function flushCloudSave() {
  if (!cloudActive() || cloud.inFlight) return;
  if (!session.state) return;
  cloud.pending = false;
  cloud.inFlight = true;
  setStatus("saving");
  let result;
  try {
    result = await apiPutSave(cloud.token, {
      state: session.state,
      schemaVersion: "1",
      baseUpdatedAt: cloud.baseUpdatedAt
    });
  } catch (error) {
    cloud.inFlight = false;
    if (error instanceof ApiNetworkError) {
      scheduleRetry();
      return;
    }
    throw error;
  }
  cloud.inFlight = false;
  if (result.status === 200) {
    cloud.baseUpdatedAt = result.body.updatedAt;
    applyServerTime(result.body.serverTime);
    cloud.retryDelayMs = RETRY_BASE_MS;
    syncRecentSummary();
    setStatus("idle");
    if (cloud.pending) scheduleCloudSave();
    return;
  }
  if (result.status === 401) {
    setStatus("expired");
    if (typeof cloud.onSessionExpired === "function") cloud.onSessionExpired();
    return;
  }
  if (result.status === 409) {
    setStatus("conflict");
    const server = await apiGetSave(cloud.token).catch(() => null);
    if (typeof cloud.onConflict === "function") cloud.onConflict(server?.body || null);
    return;
  }
  // 其他伺服器錯誤：視同暫時失敗，退避重試。
  scheduleRetry();
}

function scheduleRetry() {
  cloud.pending = true;
  setStatus("offline");
  if (cloud.retryTimer) return;
  cloud.retryTimer = setTimeout(() => {
    cloud.retryTimer = 0;
    cloud.retryDelayMs = Math.min(cloud.retryDelayMs * 2, RETRY_MAX_MS);
    void flushCloudSave();
  }, cloud.retryDelayMs);
}

// 409 解法（spec#24）：呼叫端確認後，改以伺服器現值為基準覆寫（使用者明示）或改載入伺服器進度。
export function adoptServerBase(updatedAt) {
  cloud.baseUpdatedAt = Number.isFinite(updatedAt) ? updatedAt : null;
}

// 帳號卡摘要（sysCase#6.1）：每次成功保存時更新，使登入畫面離線亦可渲染。
export function syncRecentSummary() {
  if (!cloud.username || !session.state) return;
  upsertRecentAccount(cloud.username, {
    playerName: session.state.playerName,
    characterId: session.state.activeCharacterId,
    profileColor: session.state.profileColor,
    backgroundPattern: session.state.backgroundPattern,
    coins: session.state.coins,
    outfit: session.state.outfit,
    playLimit: session.state.playLimit,
    lastPlayedAt: Date.now()
  });
}

// pagehide／切離頁面時盡力 flush（fetch keepalive 不保證，但盡力而為）。
export function installCloudLifecycleFlush() {
  window.addEventListener("pagehide", () => {
    if (cloudActive() && cloud.pending) void flushCloudSave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && cloudActive() && cloud.pending) void flushCloudSave();
  });
}
