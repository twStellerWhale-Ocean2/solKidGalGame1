import {
  areaRegistry,
  defaultActiveCharacterId,
  difficultyConfig,
  outfitSlots,
  playableCharacterById,
  questTemplates,
  shopItems
} from "../data/game-data.js";
import { defaultState } from "./default-state.js";
import { openAISettingsKey, saveMarkerEnd, saveMarkerStart, storageKey } from "./storage.js";
import {
  clamp,
  hotspotById,
  itemById,
  nodeMapForArea,
  sceneConfigFor
} from "../core/lookups.js";

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

export function loadLocalState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return freshState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return freshState();
  }
}

export function loadOpenAISettings() {
  try {
    const saved = localStorage.getItem(openAISettingsKey);
    if (!saved) return { orgId: "", apiKey: "" };
    const parsed = JSON.parse(saved);
    return {
      orgId: typeof parsed.orgId === "string" ? parsed.orgId : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : ""
    };
  } catch {
    return { orgId: "", apiKey: "" };
  }
}

export function persistOpenAISettings(openAISettings) {
  localStorage.setItem(openAISettingsKey, JSON.stringify(openAISettings));
}

export function persistState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function freshState() {
  const stateCopy = JSON.parse(JSON.stringify(defaultState));
  return stateCopy;
}

export function normalizeState(candidate = {}) {
  const base = freshState();
  const merged = { ...base, ...candidate };
  merged.activeCharacterId = playableCharacterById(candidate.activeCharacterId)?.id || defaultActiveCharacterId;
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
  delete merged.schedule;
  delete merged.currentQuest;
  delete merged.week;
  delete merged.dayIndex;
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
    ending: template.ending,
    npc: scene.npc
  };
}

export function applyEffects(state, effects = {}) {
  state.coins = Math.max(0, state.coins + (effects.coins || 0));
  state.energy = clamp(state.energy + (effects.energy || 0), 0, 100);
  state.vocab += effects.vocab || 0;
  state.expression += effects.expression || 0;
  state.kindness += effects.kindness || 0;
  state.mood = clamp(state.mood + (effects.mood || 0), 0, 100);
}

export function effectText(effects = {}) {
  const parts = [];
  if (effects.coins) parts.push(`${effects.coins > 0 ? "+" : ""}${effects.coins} coins`);
  if (effects.energy) parts.push(`${effects.energy > 0 ? "+" : ""}${effects.energy} energy`);
  if (effects.vocab) parts.push(`+${effects.vocab} words`);
  if (effects.expression) parts.push(`+${effects.expression} talk`);
  if (effects.kindness) parts.push(`+${effects.kindness} kind`);
  if (effects.mood) parts.push(`${effects.mood > 0 ? "+" : ""}${effects.mood} mood`);
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

export function moodLabel(mood) {
  if (mood >= 82) return "Happy";
  if (mood >= 56) return "OK";
  if (mood >= 30) return "Tired";
  return "Sad";
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
  delete exportState.openaiApiKey;
  const rows = state.diary.length
    ? state.diary.map((entry) => `| ${entry.title} | ${entry.body.replaceAll("|", "/")} | ${entry.result || ""} |`).join("\n")
    : "| - | - | - |";
  const payload = JSON.stringify(exportState, null, 2);
  return `# solKidGalGame Save

- Saved at: ${new Date().toLocaleString("en-US")}
- Coins: ${state.coins}
- Vocabulary: ${state.vocab}
- Expression: ${state.expression}
- Kindness: ${state.kindness}
- Mood: ${moodLabel(state.mood)}
- Character: ${state.activeCharacterId}
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
