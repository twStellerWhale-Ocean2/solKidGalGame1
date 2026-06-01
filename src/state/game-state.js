import { areaRegistry, difficultyConfig, questTemplates, shopItems } from "../data/game-data.js";
import { defaultState } from "./default-state.js";
import { openAISettingsKey, saveMarkerEnd, saveMarkerStart, storageKey } from "./storage.js";
import {
  clamp,
  hotspotById,
  itemById,
  nodeMapForArea,
  sceneConfigFor
} from "../core/lookups.js";

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
  stateCopy.activeQuest = createRandomQuest(null);
  return stateCopy;
}

export function normalizeState(candidate = {}) {
  const base = freshState();
  const merged = { ...base, ...candidate };
  merged.owned = Array.isArray(candidate.owned) ? [...new Set(["pinkDress", ...candidate.owned])] : base.owned;
  const candidateOutfit = candidate.outfit || {};
  merged.outfit = { ...base.outfit, ...candidateOutfit };
  if (candidateOutfit.dress && !candidateOutfit.outfit) merged.outfit.outfit = candidateOutfit.dress;
  delete merged.outfit.dress;
  delete merged.outfit.hat;
  delete merged.outfit.pants;
  delete merged.outfit.head;
  merged.diary = Array.isArray(candidate.diary) ? candidate.diary : [];
  merged.completedLessons = Array.isArray(candidate.completedLessons) ? candidate.completedLessons : [];
  merged.metNpcs = Array.isArray(candidate.metNpcs) ? [...new Set(candidate.metNpcs)] : [];
  merged.learnedWords = Array.isArray(candidate.learnedWords) ? [...new Set(candidate.learnedWords)] : [];
  merged.badges = Array.isArray(candidate.badges) ? [...new Set(candidate.badges)] : [];
  merged.area = areaRegistry[candidate.area]?.enabled ? candidate.area : base.area;
  const nodes = nodeMapForArea(merged.area);
  merged.playerNode = nodes[candidate.playerNode] ? candidate.playerNode : areaRegistry[merged.area].defaultNode;
  merged.player = normalizePlayer(candidate.player, merged.playerNode, merged.area);
  merged.difficulty = Number(difficultyConfig[candidate.difficulty] ? candidate.difficulty : base.difficulty);
  merged.activeQuest = normalizeQuest(candidate.activeQuest || candidate.currentQuest) || createRandomQuest(null);
  delete merged.schedule;
  delete merged.currentQuest;
  delete merged.week;
  delete merged.dayIndex;
  return merged;
}

export function normalizePlayer(player, nodeId, areaId = "kingdom") {
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
  ["outfit", "shoes", "accessory"].forEach((type) => {
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
- Difficulty: ${difficultyConfig[state.difficulty].label}
- Coins: ${state.coins}
- Energy: ${state.energy}
- Vocabulary: ${state.vocab}
- Expression: ${state.expression}
- Kindness: ${state.kindness}
- Mood: ${moodLabel(state.mood)}
- Quests completed: ${questRows.length}
- Outfit: ${outfitSummary(state)}
- Current quest: ${state.activeQuest.title}
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
