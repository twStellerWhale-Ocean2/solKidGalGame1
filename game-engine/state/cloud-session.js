// state/cloud-session.js — 裝置端 session 快取與最近帳號卡摘要（issue #309 / spec#23、#24）。
// paramSessionCacheKey：僅綁定本裝置「最後登入」帳號之 token（點其他帳號卡一律要密碼）。
// paramRecentAccountsKey：帳號卡摘要快取（頭胸照所需 outfit／識別色／花紋／coins／playLimit 快照），離線亦可渲染登入畫面。
export const SESSION_CACHE_KEY = "luminara-princess-english-session";
export const RECENT_ACCOUNTS_KEY = "luminara-princess-english-recent";
export const MIGRATED_FLAG_KEY = "luminara-princess-english-migrated";
const RECENT_LIMIT = 8;

export function loadCachedSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_CACHE_KEY) || "null");
    if (parsed && typeof parsed.username === "string" && typeof parsed.token === "string") return parsed;
  } catch { /* 快取毀損視同無 session */ }
  return null;
}

export function saveCachedSession(username, token) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ username, token }));
  } catch (error) {
    console.warn("saveCachedSession failed", error);
  }
}

export function clearCachedSession() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch { /* no-op */ }
}

export function loadRecentAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_ACCOUNTS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.username === "string");
  } catch {
    return [];
  }
}

// 每次登入／保存時 upsert 該帳號卡摘要（最新者排最前）。
export function upsertRecentAccount(username, summary = {}) {
  const rest = loadRecentAccounts().filter((entry) => entry.username !== username);
  const entry = {
    username,
    playerName: typeof summary.playerName === "string" ? summary.playerName : "",
    characterId: typeof summary.characterId === "string" ? summary.characterId : "",
    profileColor: typeof summary.profileColor === "string" ? summary.profileColor : "",
    backgroundPattern: typeof summary.backgroundPattern === "string" ? summary.backgroundPattern : "none",
    coins: Math.max(0, Number(summary.coins) || 0),
    outfit: summary.outfit && typeof summary.outfit === "object" ? summary.outfit : null,
    playLimit: summary.playLimit && typeof summary.playLimit === "object" ? summary.playLimit : null,
    lastPlayedAt: Number(summary.lastPlayedAt) || Date.now()
  };
  try {
    localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify([entry, ...rest].slice(0, RECENT_LIMIT)));
  } catch (error) {
    console.warn("upsertRecentAccount failed", error);
  }
}

export function removeRecentAccount(username) {
  try {
    localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify(loadRecentAccounts().filter((entry) => entry.username !== username)));
  } catch { /* no-op */ }
}

// 本機舊帳號一鍵遷移（intTest#74）：已遷移之本機帳號 id 名單（成功上傳後才標記、可重試不重複）。
export function loadMigratedLocalIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MIGRATED_FLAG_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markLocalAccountMigrated(localId) {
  const ids = new Set(loadMigratedLocalIds());
  ids.add(localId);
  try {
    localStorage.setItem(MIGRATED_FLAG_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.warn("markLocalAccountMigrated failed", error);
  }
}
