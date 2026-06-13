export const storageKey = "luminara-princess-english-adv";
export const openAISettingsKey = "luminara-openai-help-settings";
export const saveMarkerStart = "<!-- LUMINARA_SAVE_JSON";
export const saveMarkerEnd = "LUMINARA_SAVE_JSON -->";

// 本機多帳號（issue #63）：帳號索引鍵與每帳號進度鍵。帳號僅存在本瀏覽器，不含網路登入／雲端同步。
export const accountIndexKey = "luminara-princess-english-accounts";
export function accountStateKey(accountId) {
  return `${storageKey}:${accountId}`;
}
