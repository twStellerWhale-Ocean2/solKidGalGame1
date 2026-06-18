import {
  areaRegistry,
  defaultActiveCharacterId,
  difficultyConfig,
  normalizeFaceConfig,
  normalizeProfileColor,
  normalizeBackgroundPattern,
  outfitSlots,
  playableCharacterById,
  questTemplates,
  shopItems
} from "../data/game-data.js";
import { defaultState } from "./default-state.js";
import { accountStateKey, saveMarkerEnd, saveMarkerStart } from "./storage.js";
import { createAccount, getActiveAccountId, migrateLegacyAccount } from "./accounts.js";
import {
  clamp,
  hotspotById,
  itemById,
  nodeMapForArea,
  sceneConfigFor
} from "../core/lookups.js";
import { normalizePlayLimit } from "../system/play-clock.js";

const legacyAreaIds = Object.freeze({
  kingdom: "urban",
  suburb: "rural",
  forest: "wild"
});

const legacyNodeIds = Object.freeze({
  forestEdge: "castleRoom",
  suburbGate: "castleRoom",
  forestEntrance: "wildEntrance",
  forestExit: "wildExit",
  suburbEntrance: "ruralEntrance",
  suburbExit: "ruralExit"
});

const legacyItemIds = Object.freeze({
  pinkDress: "starterPajama",
  forestShorts: "wildShorts",
  forestBoots: "wildBoots",
  forestTiara: "wildTiara",
  forestTrailSet: "wildTrailSet"
});

const bakedBaseStarterHairIds = new Set(["softBrownHair", "yumiStarterHair", "solStarterHair", "rosaStarterHair"]);
const bakedBaseStarterDressIds = new Set(["starterPajama"]);

export function loadLocalState() {
  migrateLegacyAccount(); // 一次性將舊單一存檔遷移為首個帳號，保留既有玩家進度。
  const activeId = getActiveAccountId();
  if (!activeId) return freshState(); // 尚無使用中帳號：回傳乾淨佔位狀態，由 Account Select 把關後再載入。
  return loadAccountState(activeId);
}

// 載入指定帳號的進度（供切換帳號使用）；無存檔或解析失敗時回退乾淨初始狀態。
export function loadAccountState(accountId) {
  try {
    const saved = localStorage.getItem(accountStateKey(accountId));
    if (!saved) return freshState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return freshState();
  }
}

// 建立新帳號並寫入一份乾淨初始進度，回傳帳號資料（已設為使用中）。
export function createFreshAccount() {
  return createAccount({ initialStateJson: JSON.stringify(freshState()) });
}

export function persistState(state) {
  const activeId = getActiveAccountId();
  if (!activeId) return; // 無使用中帳號時不寫入（遊戲尚未真正開始）。
  try {
    localStorage.setItem(accountStateKey(activeId), JSON.stringify(state));
  } catch (error) {
    // 寫入失敗（例如多帳號使 localStorage 配額已滿）：不讓存檔錯誤中斷遊戲，記錄警告供診斷。
    console.warn("persistState failed", error);
  }
}

export function freshState() {
  const stateCopy = JSON.parse(JSON.stringify(defaultState));
  return stateCopy;
}

export const playerNameMaxLength = 16;

// 名字為玩家可自取的使用者設定，可能來自 UI 輸入或匯入的存檔。
// 去除會破壞 Markdown save 或排版的字元（表格分隔線、換行、Markdown 標記），並限制長度。
export function sanitizePlayerName(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[|#*`_~\[\]<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, playerNameMaxLength)
    .trim();
}

export function normalizeState(candidate = {}) {
  const base = freshState();
  const merged = { ...base, ...candidate };
  const activeCharacter = playableCharacterById(candidate.activeCharacterId);
  merged.activeCharacterId = activeCharacter?.id || defaultActiveCharacterId;
  merged.profileColor = normalizeProfileColor(candidate.profileColor, merged.activeCharacterId);
  merged.backgroundPattern = normalizeBackgroundPattern(candidate.backgroundPattern);
  merged.faceConfig = normalizeFaceConfig(candidate.faceConfig, merged.activeCharacterId);
  merged.playerName = sanitizePlayerName(candidate.playerName)
    || activeCharacter?.defaultName
    || base.playerName;
  merged.owned = Array.isArray(candidate.owned)
    ? [...new Set([...base.owned, ...candidate.owned.map(migrateLegacyItemId)])]
    : base.owned;
  const candidateOutfit = candidate.outfit || {};
  merged.outfit = normalizeOutfit(candidateOutfit, base.outfit);
  merged.diary = Array.isArray(candidate.diary) ? candidate.diary : [];
  merged.completedLessons = Array.isArray(candidate.completedLessons)
    ? candidate.completedLessons.map(migrateLegacyLessonId)
    : [];
  merged.metNpcs = Array.isArray(candidate.metNpcs) ? [...new Set(candidate.metNpcs)] : [];
  merged.learnedWords = Array.isArray(candidate.learnedWords) ? [...new Set(candidate.learnedWords)] : [];
  merged.badges = Array.isArray(candidate.badges) ? [...new Set(candidate.badges)] : [];
  merged.bundleUnlocks = normalizeBundleUnlocks(candidate.bundleUnlocks);
  merged.purchaseStoreIds = normalizePurchaseStoreIds(candidate.purchaseStoreIds);
  const candidateArea = migrateLegacyAreaId(candidate.area);
  const candidateNode = migrateLegacyNodeId(candidate.playerNode);
  merged.area = areaRegistry[candidateArea]?.enabled ? candidateArea : base.area;
  const nodes = nodeMapForArea(merged.area);
  merged.playerNode = nodes[candidateNode] ? candidateNode : areaRegistry[merged.area].defaultNode;
  merged.player = normalizePlayer(candidate.player, merged.playerNode, merged.area);
  merged.difficulty = Number(difficultyConfig[candidate.difficulty] ? candidate.difficulty : base.difficulty);
  merged.activeQuest = normalizeQuest(candidate.activeQuest || candidate.currentQuest);
  merged.playLimit = normalizePlayLimit(candidate.playLimit);
  delete merged.schedule;
  delete merged.currentQuest;
  delete merged.week;
  delete merged.dayIndex;
  // issue #100：清除舊存檔殘留的非金錢屬性欄位（reward 已收斂為僅 coins）。
  delete merged.vocab;
  delete merged.expression;
  delete merged.kindness;
  delete merged.mood;
  return merged;
}

function normalizeBundleUnlocks(candidate = {}) {
  if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") return {};
  return Object.fromEntries(Object.entries(candidate).flatMap(([bundleId, unlockIds]) => {
    const migratedBundleId = migrateLegacyItemId(bundleId);
    const bundle = itemById(migratedBundleId);
    if (bundle?.type !== "outfitSet" || !Array.isArray(unlockIds)) return [];
    const validUnlockIds = [...new Set(unlockIds)]
      .map(migrateLegacyItemId)
      .filter((itemId) => itemId !== migratedBundleId && Boolean(itemById(itemId)));
    return validUnlockIds.length ? [[migratedBundleId, validUnlockIds]] : [];
  }));
}

function normalizePurchaseStoreIds(candidate = {}) {
  if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") return {};
  return Object.fromEntries(Object.entries(candidate).flatMap(([itemId, storeId]) => {
    const item = itemById(migrateLegacyItemId(itemId));
    if (!item || typeof storeId !== "string" || !storeId.trim()) return [];
    return [[item.id, storeId]];
  }));
}

function normalizeOutfit(candidateOutfit = {}, baseOutfit = defaultState.outfit) {
  const outfit = { ...baseOutfit };
  outfitSlots.forEach((slot) => {
    if (candidateOutfit[slot]) outfit[slot] = migrateLegacyItemId(candidateOutfit[slot]);
  });
  const legacyDress = candidateOutfit.dress || candidateOutfit.outfit;
  if (legacyDress) outfit.dress = migrateLegacyItemId(legacyDress);
  if (candidateOutfit.shoes) outfit.shoes = migrateLegacyItemId(candidateOutfit.shoes);
  applyLegacyAccessory(outfit, candidateOutfit.accessory || candidateOutfit.hat || candidateOutfit.head);
  if (candidateOutfit.pants && !candidateOutfit.bottom) outfit.bottom = migrateLegacyItemId(candidateOutfit.pants);
  normalizeBakedBaseStarterOutfit(outfit);
  outfitSlots.forEach((slot) => {
    if (slot !== "room" && outfit[slot] !== "none" && !itemById(outfit[slot])) outfit[slot] = baseOutfit[slot] || "none";
  });
  if (outfit.dress !== "none") {
    outfit.top = "none";
    outfit.bottom = "none";
  } else if (outfit.top === "none" && outfit.bottom === "none") {
    outfit.dress = baseOutfit.dress;
  }
  return outfit;
}

function normalizeBakedBaseStarterOutfit(outfit) {
  if (bakedBaseStarterHairIds.has(outfit.hairstyle)) outfit.hairstyle = "none";
  if (bakedBaseStarterDressIds.has(outfit.dress)) outfit.dress = "none";
}

function applyLegacyAccessory(outfit, itemId) {
  const migrated = migrateLegacyItemId(itemId);
  if (!migrated || migrated === "none") return;
  const item = itemById(migrated);
  if (!item) return;
  outfit[item.type] = migrated;
}

function migrateLegacyItemId(itemId) {
  return legacyItemIds[itemId] || itemId || "none";
}

function migrateLegacyLessonId(lessonId) {
  if (typeof lessonId !== "string") return lessonId;
  if (lessonId.startsWith("kingdom-")) return lessonId.replace(/^kingdom-/, "urban-");
  if (lessonId.startsWith("suburb-")) return lessonId.replace(/^suburb-/, "rural-");
  if (lessonId.startsWith("forest-")) return lessonId.replace(/^forest-/, "wild-");
  return lessonId;
}

function migrateLegacyAreaId(areaId) {
  return legacyAreaIds[areaId] || areaId || "";
}

function migrateLegacyNodeId(nodeId) {
  return legacyNodeIds[nodeId] || nodeId || "";
}

export function normalizePlayer(player, nodeId, areaId = "urban") {
  if (player && typeof player.x === "number" && typeof player.y === "number") {
    return { x: clamp(player.x, 6, 94), y: clamp(player.y, 8, 92) };
  }
  const nodes = nodeMapForArea(areaId);
  const node = nodes[nodeId] || nodes[areaRegistry[areaId]?.defaultNode] || nodes.garden;
  return { x: node.x, y: node.y };
}

export function normalizeQuest(quest) {
  if (!quest || typeof quest !== "object") return null;
  const place = quest.place || quest.targetPlace;
  const template = questTemplates.find((item) => item.id === quest.templateId || item.place === place);
  if (!template) return null;
  const hotspot = hotspotById(template.place);
  const scene = sceneConfigFor(hotspot);
  return {
    id: quest.id || `${Date.now()}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    openingZh: template.openingZh,
    ending: template.ending,
    npc: scene.npc
  };
}

export function createRandomQuest(previousPlace) {
  const available = questTemplates.filter((quest) => quest.place !== previousPlace);
  const pool = available.length ? available : questTemplates;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return createQuestFromTemplate(template);
}

export function createQuestForPlace(place) {
  const template = questTemplates.find((quest) => quest.place === place) || questTemplates[0];
  return createQuestFromTemplate(template);
}

export function createQuestFromTemplate(template) {
  const hotspot = hotspotById(template.place);
  const scene = sceneConfigFor(hotspot);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    openingZh: template.openingZh,
    ending: template.ending,
    npc: scene.npc
  };
}

export function applyEffects(state, effects = {}) {
  state.coins = Math.max(0, state.coins + (effects.coins || 0));
  // energy 自 issue #6 起為「遊玩時間預算」顯示值，由 play-clock 依真實時間重算，不再由答題等 effects 變動。
  // issue #100：答題獎勵收斂為僅 coins，移除 vocab/expression/kindness/mood 等非金錢屬性加成。
}

export function effectText(effects = {}) {
  const parts = [];
  if (effects.coins) parts.push(`${effects.coins > 0 ? "+" : ""}${effects.coins} coins`);
  return parts.join(", ") || "No change";
}

export function addDiary(state, entry) {
  state.diary.unshift({ at: new Date().toLocaleString("en-US"), ...entry });
  state.diary = state.diary.slice(0, 80);
}

export function addUnique(state, listName, values) {
  values.forEach((value) => {
    if (value && !state[listName].includes(value)) state[listName].push(value);
  });
}

export function awardBadge(state, id) {
  if (!state.badges.includes(id)) state.badges.push(id);
}

export function updateProgressBadges(state) {
  if (state.completedLessons.length >= 1) awardBadge(state, "First Quest");
  if (state.completedLessons.length >= 5) awardBadge(state, "Kind Helper");
  if (state.learnedWords.length >= 5) awardBadge(state, "Word Finder");
  if (state.owned.length >= 4) awardBadge(state, "Doll Stylist");
}

export function outfitSummary(state) {
  const labels = [];
  ["hairstyle", "top", "bottom", "dress", "outer", "shoes", "headTop", "headSide", "faceEyes", "faceMask", "neck", "hand"].forEach((type) => {
    const item = itemById(state.outfit[type]);
    if (item) labels.push(item.name);
  });
  return labels.join(" / ") || "No outfit";
}

export function buildSaveMarkdown(state) {
  const questRows = state.diary.filter((entry) => entry.type === "quest");
  const exportState = JSON.parse(JSON.stringify(state));
  const rows = state.diary.length
    ? state.diary.map((entry) => `| ${entry.title} | ${entry.body.replaceAll("|", "/")} | ${entry.result || ""} |`).join("\n")
    : "| - | - | - |";
  const payload = JSON.stringify(exportState, null, 2);
  return `# solKidGalGame Save

- Saved at: ${new Date().toLocaleString("en-US")}
- Coins: ${state.coins}
- Name: ${state.playerName}
- Character: ${playableCharacterById(state.activeCharacterId)?.label || state.activeCharacterId}
- Profile color: ${state.profileColor}
- Skin tone: ${state.faceConfig?.skinTone || "-"}
- Hair color: ${state.faceConfig?.hairColor || "-"}
- Quests completed: ${questRows.length}
- Outfit: ${outfitSummary(state)}
- Learned words: ${state.learnedWords.join(", ") || "-"}
- Friends met: ${state.metNpcs.join(", ") || "-"}
- Badges: ${state.badges.join(", ") || "-"}

## Diary

| Title | Detail | Result |
| --- | --- | --- |
${rows}

${saveMarkerStart}
${payload}
${saveMarkerEnd}
`;
}
