import { accountIndexKey, accountStateKey, storageKey } from "./storage.js";

// 本機多帳號（issue #63）：同一瀏覽器內以多份存檔分離不同玩家進度。
// 帳號索引結構：{ accounts: [{ id, name, characterId, profileColor, createdAt, lastPlayedAt }], activeId }
// 每個帳號的完整遊戲進度另存於 accountStateKey(id)。本模組僅依賴 storage.js（避免與 game-state.js 循環相依）。

function newAccountId() {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function emptyIndex() {
  return { accounts: [], activeId: null };
}

export function loadAccountIndex() {
  try {
    const raw = localStorage.getItem(accountIndexKey);
    if (!raw) return emptyIndex();
    const parsed = JSON.parse(raw);
    const accounts = Array.isArray(parsed?.accounts)
      ? parsed.accounts
        .filter((account) => account && typeof account.id === "string")
        .map((account) => ({
          id: account.id,
          name: typeof account.name === "string" ? account.name : "",
          characterId: typeof account.characterId === "string" ? account.characterId : "",
          profileColor: typeof account.profileColor === "string" ? account.profileColor : "",
          createdAt: Number(account.createdAt) || 0,
          lastPlayedAt: Number(account.lastPlayedAt) || 0
        }))
      : [];
    const activeId = accounts.some((account) => account.id === parsed?.activeId) ? parsed.activeId : null;
    return { accounts, activeId };
  } catch {
    return emptyIndex();
  }
}

export function persistAccountIndex(index) {
  try {
    localStorage.setItem(accountIndexKey, JSON.stringify({
      accounts: index.accounts,
      activeId: index.activeId
    }));
  } catch (error) {
    // 寫入失敗（例如配額已滿）：不讓帳號索引更新中斷流程，記錄警告供診斷。
    console.warn("persistAccountIndex failed", error);
  }
}

export function listAccounts() {
  return loadAccountIndex().accounts;
}

export function getActiveAccountId() {
  return loadAccountIndex().activeId;
}

export function setActiveAccountId(id) {
  const index = loadAccountIndex();
  if (!index.accounts.some((account) => account.id === id)) return index;
  index.activeId = id;
  persistAccountIndex(index);
  return index;
}

// 建立新帳號：寫入一份初始進度字串到該帳號鍵，登錄索引並設為使用中。
// initialStateJson 由呼叫端（game-state）提供 freshState 序列化結果，避免本模組相依 game-state。
export function createAccount({ name = "", characterId = "", initialStateJson } = {}) {
  const index = loadAccountIndex();
  const id = newAccountId();
  if (typeof initialStateJson === "string") {
    localStorage.setItem(accountStateKey(id), initialStateJson);
  }
  index.accounts.push({ id, name, characterId, profileColor: "", createdAt: Date.now(), lastPlayedAt: 0 });
  index.activeId = id;
  persistAccountIndex(index);
  return { id, name, characterId };
}

export function updateAccountMeta(id, { name, characterId, profileColor, lastPlayedAt } = {}) {
  const index = loadAccountIndex();
  const account = index.accounts.find((item) => item.id === id);
  if (!account) return;
  if (typeof name === "string") account.name = name;
  if (typeof characterId === "string") account.characterId = characterId;
  if (typeof profileColor === "string") account.profileColor = profileColor;
  if (typeof lastPlayedAt === "number" && Number.isFinite(lastPlayedAt)) account.lastPlayedAt = lastPlayedAt;
  persistAccountIndex(index);
}

// 刪除帳號：移除其進度鍵與索引項；刪到使用中帳號時清除 activeId（交回帳號選擇）。
export function deleteAccount(id) {
  const index = loadAccountIndex();
  if (!index.accounts.some((account) => account.id === id)) return index;
  localStorage.removeItem(accountStateKey(id));
  index.accounts = index.accounts.filter((account) => account.id !== id);
  if (index.activeId === id) index.activeId = null;
  persistAccountIndex(index);
  return index;
}

// 將舊版單一存檔（storageKey）一次性遷移為「首個帳號」，避免既有玩家進度遺失。
// 僅在尚無任何帳號且存在舊存檔時執行，且具冪等性（遷移後移除舊鍵，再次呼叫即略過）。
export function migrateLegacyAccount() {
  const index = loadAccountIndex();
  if (index.accounts.length > 0) return index;
  const legacy = localStorage.getItem(storageKey);
  if (!legacy) return index;
  let name = "";
  let characterId = "";
  try {
    const parsed = JSON.parse(legacy);
    name = typeof parsed.playerName === "string" ? parsed.playerName : "";
    characterId = typeof parsed.activeCharacterId === "string" ? parsed.activeCharacterId : "";
  } catch {
    // 舊存檔毀損也照樣建立帳號，由 normalizeState 於載入時修復欄位。
  }
  const id = newAccountId();
  localStorage.setItem(accountStateKey(id), legacy);
  localStorage.removeItem(storageKey);
  const migrated = { accounts: [{ id, name, characterId, profileColor: "", createdAt: Date.now(), lastPlayedAt: 0 }], activeId: id };
  persistAccountIndex(migrated);
  return migrated;
}
