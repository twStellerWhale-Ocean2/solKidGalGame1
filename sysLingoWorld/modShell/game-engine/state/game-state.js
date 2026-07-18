import {
  areaRegistry,
  defaultActiveCharacterId,
  difficultyConfig,
  normalizeProfileColor,
  normalizeBackgroundPattern,
  outfitSlots,
  playableCharacterById,
  questTemplates,
  randomProfileColor,
  randomBackgroundPattern,
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
const bakedBaseStarterOutfitIds = new Set(["starterPajama"]);

// ── issue #376：多角色 roster envelope（Option A：additive active-mirror；Increment 1／基礎，無 UI）──
// 本機每帳號 blob 由「單一角色 state」升為 envelope：
//   { schema:"2", activeCharacterSaveId, characters:{ <characterSaveId>:<characterState> }, …root mirror=active }
// root 恆鏡射 active 角色（＋envelope meta），使舊讀取者（雲端 admin 摘要／validateStateShape／rollback 舊 image）不受影響。
// Increment 1：roster 恆 size==1、使用者無感；新增/切換/刪除 UI 於 #378/#379、雲端於 #377、spec 於 #381。
export const ROSTER_META_KEYS = Object.freeze(["schema", "activeCharacterSaveId", "characters"]);
export const ROSTER_CAP = 6; // #379：每帳號角色上限（配合 1MB 存檔上傳與 UI 版面）

export function newCharacterSaveId() {
  return `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 唯一判別＝有 characters 物件（idempotent wrap 之守衛）。
function isRosterEnvelope(obj) {
  return Boolean(obj) && typeof obj === "object" && Boolean(obj.characters) && typeof obj.characters === "object" && !Array.isArray(obj.characters);
}

// 取角色 state 之 clean 切片（去 envelope meta，避免存進 characters slice 後再讀汙染）。
export function characterSliceOf(obj) {
  const slice = { ...obj };
  ROSTER_META_KEYS.forEach((key) => delete slice[key]);
  return slice;
}

// #378：帳號時鐘 account-scoped——切換/新增角色時由現行 active 攜帶時鐘欄位，切角色不重置休息鎖（防孩子繞過）；
// playMinutes/restMinutes（可調設定值）留各角色自身。
const ACCOUNT_CLOCK_KEYS = Object.freeze(["sessionEndsAt", "restEndsAt", "sessionMaxEndsAt", "cycle"]);
export function carryAccountClock(fromState, toState) {
  if (fromState && fromState.playLimit && toState && toState.playLimit) {
    ACCOUNT_CLOCK_KEYS.forEach((key) => { toState.playLimit[key] = fromState.playLimit[key]; });
  }
  return toState;
}

// #378：寫整個 roster envelope 至本機 active 帳號 blob（含所有角色；供新增/切換角色寫全 roster，非只 active）。
export function writeRosterEnvelope(accountId, envelope) {
  if (!accountId) return;
  const activeSlice = envelope.characters[envelope.activeCharacterSaveId] || freshState();
  try {
    localStorage.setItem(accountStateKey(accountId), JSON.stringify(reassembleEnvelope(activeSlice, envelope)));
  } catch (error) {
    console.warn("writeRosterEnvelope failed", error);
  }
}

// 乾淨一員 roster（新帳號用）。
export function freshRoster() {
  const saveId = newCharacterSaveId();
  return { schema: "2", activeCharacterSaveId: saveId, characters: { [saveId]: freshState() } };
}

// pure core：由已解析物件（或 null）得正規化 envelope（wrap legacy／idempotent：已是 envelope 不再包）。
// 本機（readRosterEnvelope）與雲端（#377 cloud-sync）共用同一 wrap/unwrap 規則。
export function rosterEnvelopeOf(parsed) {
  if (isRosterEnvelope(parsed)) {
    const characters = { ...parsed.characters };
    let activeId = parsed.activeCharacterSaveId;
    if (!characters[activeId]) activeId = Object.keys(characters)[0];
    if (!activeId) return freshRoster(); // characters 空：退乾淨一員
    return { schema: "2", activeCharacterSaveId: activeId, characters };
  }
  // legacy 單角色（或無存檔）：wrap 成一員。
  const bare = parsed && typeof parsed === "object" ? characterSliceOf(parsed) : freshState();
  const saveId = newCharacterSaveId();
  return { schema: "2", activeCharacterSaveId: saveId, characters: { [saveId]: bare } };
}

// active 角色之 raw 切片（未 normalize）；供雲端 unwrap（serverSave.state → active 角色）。
export function activeCharacterStateOf(candidate) {
  const env = rosterEnvelopeOf(candidate);
  return env.characters[env.activeCharacterSaveId];
}

// 讀回某帳號之本機 roster envelope（legacy blob／空值 wrap 成一員）。
export function readRosterEnvelope(accountId) {
  let parsed = null;
  try {
    const saved = localStorage.getItem(accountStateKey(accountId));
    if (saved) parsed = JSON.parse(saved);
  } catch {
    parsed = null;
  }
  return rosterEnvelopeOf(parsed);
}

// 以 active 角色 state 回組 envelope（root mirror＝active 欄位＋meta；characters 存 clean 切片）。供本機與雲端 #377 共用。
export function reassembleEnvelope(activeState, envelope) {
  const cleanActive = characterSliceOf(activeState);
  const characters = { ...envelope.characters, [envelope.activeCharacterSaveId]: cleanActive };
  return { ...cleanActive, schema: "2", activeCharacterSaveId: envelope.activeCharacterSaveId, characters };
}

export function loadLocalState() {
  migrateLegacyAccount(); // 一次性將舊單一存檔遷移為首個帳號，保留既有玩家進度。
  const activeId = getActiveAccountId();
  if (!activeId) return freshState(); // 尚無使用中帳號：回傳乾淨佔位狀態，由 Account Select 把關後再載入。
  return loadAccountState(activeId);
}

// 載入指定帳號的進度（供切換帳號使用）；無存檔或解析失敗時回退乾淨初始狀態。
// #376：讀回 envelope 之 active 角色切片。**保持 pure（不動 session）**——本函式亦被他帳號摘要
// （accountSummary／status ticker／登入卡）呼叫，回傳單一角色 state、行為與現況一致（讀到 active 角色）。
export function loadAccountState(accountId) {
  const envelope = readRosterEnvelope(accountId);
  return normalizeState(envelope.characters[envelope.activeCharacterSaveId]);
}

// 建立新帳號並寫入一份乾淨初始進度，回傳帳號資料（已設為使用中）。
export function createFreshAccount() {
  return createAccount({ initialStateJson: JSON.stringify(freshState()) });
}

export function persistState(state) {
  const activeId = getActiveAccountId();
  if (!activeId) return; // 無使用中帳號時不寫入（遊戲尚未真正開始）。
  try {
    // #376：read-modify-write envelope——只更新 active 角色切片，自 storage 讀回其餘 slice，
    // 使「寫 active 角色」永不覆蓋其他角色（Increment 1 免把 roster 穿線進 session）。
    const envelope = readRosterEnvelope(activeId);
    localStorage.setItem(accountStateKey(activeId), JSON.stringify(reassembleEnvelope(state, envelope)));
  } catch (error) {
    // 寫入失敗（例如多帳號使 localStorage 配額已滿）：不讓存檔錯誤中斷遊戲，記錄警告供診斷。
    console.warn("persistState failed", error);
  }
}

export function freshState({ randomizeTheme = true } = {}) {
  const stateCopy = JSON.parse(JSON.stringify(defaultState));
  if (randomizeTheme) {
    stateCopy.profileColor = randomProfileColor();
    stateCopy.backgroundPattern = randomBackgroundPattern();
  }
  return stateCopy;
}

export const playerNameMaxLength = 16;

// #391：角色密碼單向雜湊（cyrb53 變體）。同步、免 secure context——內網 HTTP（展測/家用）無
// crypto.subtle 可用；定位＝家庭內防呆（防手足互玩，canon ＜III.B＞），非防駭防線，故不採 bcrypt 級。
export function hashCharacterPin(pin) {
  const str = `luminara-pin:${String(pin)}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

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
  const base = freshState({ randomizeTheme: false });
  const merged = { ...base, ...candidate };
  const activeCharacter = playableCharacterById(candidate.activeCharacterId);
  merged.activeCharacterId = activeCharacter?.id || defaultActiveCharacterId;
  merged.profileColor = typeof candidate.profileColor === "string" && candidate.profileColor.trim()
    ? normalizeProfileColor(candidate.profileColor, merged.activeCharacterId)
    : randomProfileColor();
  merged.backgroundPattern = typeof candidate.backgroundPattern === "string" && candidate.backgroundPattern.trim()
    ? normalizeBackgroundPattern(candidate.backgroundPattern)
    : randomBackgroundPattern();
  merged.playerName = sanitizePlayerName(candidate.playerName)
    || activeCharacter?.defaultName
    || base.playerName;
  merged.owned = Array.isArray(candidate.owned)
    ? [...new Set([...base.owned, ...candidate.owned.map(migrateLegacyItemId)])].filter((id) => Boolean(itemById(id)))
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
  delete merged.bundleUnlocks; // #195：移除 outfitSet bundle 機制，丟棄舊存檔殘留的 bundleUnlocks。
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
  // #391：角色密碼（選配）——單向雜湊字串；非法/空值一律移除（legacy 無 pin 角色不受影響）。
  if (typeof candidate.pinHash === "string" && candidate.pinHash.trim()) merged.pinHash = candidate.pinHash.trim();
  else delete merged.pinHash;
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

function normalizePurchaseStoreIds(candidate = {}) {
  if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") return {};
  return Object.fromEntries(Object.entries(candidate).flatMap(([itemId, storeId]) => {
    const item = itemById(migrateLegacyItemId(itemId));
    // #195：丟棄舊存檔殘留的 outfitSet bundle 來源（bundle:<id>），使該單品退回以自身 storeId 退款。
    if (!item || typeof storeId !== "string" || !storeId.trim() || storeId.startsWith("bundle:")) return [];
    return [[item.id, storeId]];
  }));
}

function normalizeOutfit(candidateOutfit = {}, baseOutfit = defaultState.outfit) {
  const outfit = { ...baseOutfit };
  outfitSlots.forEach((slot) => {
    if (candidateOutfit[slot]) outfit[slot] = migrateLegacyItemId(candidateOutfit[slot]);
  });
  // #251：分件上下身（top/bottom）退場、整件 dress 改名 outfit。舊存檔之 dress 鍵改讀為 outfit；
  // 僅穿過 top/bottom（無 dress/outfit）之舊存檔退回預設 outfit，top/bottom 鍵不再保留。
  const legacyOutfit = candidateOutfit.outfit || candidateOutfit.dress;
  if (legacyOutfit) outfit.outfit = migrateLegacyItemId(legacyOutfit);
  if (candidateOutfit.shoes) outfit.shoes = migrateLegacyItemId(candidateOutfit.shoes);
  applyLegacyAccessory(outfit, candidateOutfit.accessory || candidateOutfit.hat || candidateOutfit.head);
  normalizeBakedBaseStarterOutfit(outfit);
  outfitSlots.forEach((slot) => {
    if (slot !== "room" && outfit[slot] !== "none" && !itemById(outfit[slot])) outfit[slot] = baseOutfit[slot] || "none";
  });
  return outfit;
}

function normalizeBakedBaseStarterOutfit(outfit) {
  if (bakedBaseStarterHairIds.has(outfit.hairstyle)) outfit.hairstyle = "none";
  if (bakedBaseStarterOutfitIds.has(outfit.outfit)) outfit.outfit = "none";
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
  ["hairstyle", "outfit", "shoes", "headTop", "headSide", "faceEyes", "faceMask", "neck", "hand"].forEach((type) => {
    const item = itemById(state.outfit[type]);
    if (item) labels.push(item.name);
  });
  return labels.join(" / ") || "No outfit";
}

export function buildSaveMarkdown(state, envelope = null) {
  const questRows = state.diary.filter((entry) => entry.type === "quest");
  // #380：給 roster envelope 則匯出整個 roster（備份含所有公主）；否則單一 state（相容）。標頭仍取 active 角色。
  const exportState = JSON.parse(JSON.stringify(envelope || state));
  const rows = state.diary.length
    ? state.diary.map((entry) => `| ${entry.title} | ${entry.body.replaceAll("|", "/")} | ${entry.result || ""} |`).join("\n")
    : "| - | - | - |";
  const payload = JSON.stringify(exportState, null, 2);
  return `# solLingoWorld Save

- Saved at: ${new Date().toLocaleString("en-US")}
- Coins: ${state.coins}
- Name: ${state.playerName}
- Character: ${playableCharacterById(state.activeCharacterId)?.label || state.activeCharacterId}
- Profile color: ${state.profileColor}
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
