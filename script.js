const storageKey = "luminara-princess-english-adv";
const openAISettingsKey = "luminara-openai-help-settings";
const saveMarkerStart = "<!-- LUMINARA_SAVE_JSON";
const saveMarkerEnd = "LUMINARA_SAVE_JSON -->";

const difficultyConfig = {
  100: { label: "Common English 100 words", reward: 1, maxTier: 100 },
  250: { label: "Common English 250 words", reward: 1.15, maxTier: 250 },
  500: { label: "Common English 500 words", reward: 1.35, maxTier: 500 },
  750: { label: "Common English 750 words", reward: 1.55, maxTier: 750 },
  1000: { label: "Common English 1000 words", reward: 1.8, maxTier: 1000 }
};

const categories = [
  { id: "dress", label: "Dresses" },
  { id: "shoes", label: "Shoes" },
  { id: "hat", label: "Hats" },
  { id: "accessory", label: "Accessories" },
  { id: "room", label: "Room" }
];

const shopItems = [
  { id: "pinkDress", type: "dress", name: "Pink academy dress", cost: 0, colors: ["#f6a1bf", "#ffd8e8"], shape: "dress-ball" },
  { id: "blueDress", type: "dress", name: "Blue harbor dress", cost: 100, colors: ["#82b9dc", "#d8f0ff"], shape: "dress-sailor" },
  { id: "roseDress", type: "dress", name: "Rose festival dress", cost: 200, colors: ["#cf5d89", "#ffc1d7"], shape: "dress-rose" },
  { id: "snowDress", type: "dress", name: "Snowflake gown", cost: 260, colors: ["#bde9ff", "#ffffff"], shape: "dress-snow" },
  { id: "maryJanes", type: "shoes", name: "Brown Mary Janes", cost: 80, colors: ["#7b4a38", "#f4d5bd"], shape: "shoes-round" },
  { id: "blueBoots", type: "shoes", name: "Blue winter boots", cost: 130, colors: ["#4b668c", "#b8d9ef"], shape: "shoes-boots" },
  { id: "goldCrown", type: "hat", name: "Gold crown", cost: 160, colors: ["#d7a64b", "#fff0a8"], shape: "crown" },
  { id: "silkRibbon", type: "hat", name: "Silk ribbon", cost: 120, colors: ["#c98dd6", "#ffe1fb"], shape: "ribbon" },
  { id: "pearlBag", type: "accessory", name: "Pearl shoulder bag", cost: 140, colors: ["#fff0f5", "#d7a64b"], shape: "bag" },
  { id: "starCape", type: "accessory", name: "Starry cape", cost: 180, colors: ["#5b6fa6", "#f8e7a0"], shape: "cape" },
  { id: "studyDesk", type: "room", name: "New study desk", cost: 180, colors: ["#b98963", "#f2c083"], shape: "desk" },
  { id: "seaLamp", type: "room", name: "Sea glass lamp", cost: 220, colors: ["#70bfc9", "#e0fbff"], shape: "lamp" }
];

const hotspots = [
  { id: "castleRoom", node: "castle", label: "Princess Room", icon: "🏰", npcClass: "npc-garden", npc: "Lumi", scene: "scene-garden", kind: "room", hint: "The castle room is nearby. Press Enter to go back and dress Lumi." },
  { id: "garden", node: "garden", label: "Castle Garden", icon: "🌷", npcClass: "npc-garden", npc: "Mira", scene: "scene-garden", hint: "The garden is quiet. A small cat may be hiding near the roses." },
  { id: "market", node: "market", label: "Market Square", icon: "🥖", npcClass: "npc-market", npc: "Auntie Pom", scene: "scene-market", hint: "The bakery smells sweet. Auntie Pom often needs help." },
  { id: "harbor", node: "harbor", label: "Harbor Dock", icon: "🐟", npcClass: "npc-harbor", npc: "Nami", scene: "scene-harbor", hint: "It seems the harbor sells fish. Lumi can buy one for dinner." },
  { id: "boutique", node: "boutique", label: "Dress Boutique", icon: "🎀", npcClass: "npc-boutique", npc: "Rena", scene: "scene-boutique", kind: "shop", shopCategories: ["dress", "room"], defaultCategory: "dress", hint: "Rena's boutique has dresses and room treasures." },
  { id: "shoeShop", node: "shoeShop", label: "Shoe Shop", icon: "👞", npcClass: "npc-shoes", npc: "Mina", scene: "scene-shoes", kind: "shop", shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina fits soft shoes for long walks." },
  { id: "accessoryShop", node: "accessoryShop", label: "Accessory Shop", icon: "💎", npcClass: "npc-accessory", npc: "Lili", scene: "scene-accessory", kind: "shop", shopCategories: ["hat", "accessory"], defaultCategory: "hat", hint: "Lili sells crowns, ribbons, bags, and capes." },
  { id: "farm", node: "farm", label: "Sunny Farm", icon: "🐄", npcClass: "npc-farm", npc: "Theo", scene: "scene-farm", hint: "The farm is busy. Theo is brushing the big cow." },
  { id: "lighthouse", node: "lighthouse", label: "Lighthouse", icon: "⛵", npcClass: "npc-lighthouse", npc: "Captain Sol", scene: "scene-lighthouse", hint: "The lighthouse watches the sea before ships sail." }
];

const mapNodes = {
  castle: { id: "castle", label: "Castle Gate", x: 48, y: 35, links: ["garden", "market", "farm"] },
  garden: { id: "garden", label: "Castle Garden", x: 45, y: 43, links: ["castle", "market"] },
  market: { id: "market", label: "Market Square", x: 52, y: 59, links: ["garden", "boutique", "shoeShop", "harbor"] },
  boutique: { id: "boutique", label: "Dress Boutique", x: 63, y: 56, links: ["market", "shoeShop", "accessoryShop", "farm"] },
  shoeShop: { id: "shoeShop", label: "Shoe Shop", x: 58, y: 66, links: ["market", "harbor", "boutique"] },
  accessoryShop: { id: "accessoryShop", label: "Accessory Shop", x: 68, y: 50, links: ["boutique", "farm"] },
  farm: { id: "farm", label: "Sunny Farm", x: 75, y: 24, links: ["castle", "accessoryShop", "boutique"] },
  harbor: { id: "harbor", label: "Harbor Dock", x: 42, y: 74, links: ["market", "shoeShop", "lighthouse"] },
  lighthouse: { id: "lighthouse", label: "Lighthouse", x: 70, y: 76, links: ["harbor"] }
};

const questTemplates = [
  { id: "harborFish", place: "harbor", title: "Buy a fish at the harbor", opening: "Good morning, Princess! We have fresh fish today.", ending: "Thank you, Princess. Dinner will be delicious tonight." },
  { id: "bakeryHelp", place: "market", title: "Help Auntie Pom at the bakery", opening: "Hello, Princess! The apples are red and sweet.", ending: "Thank you, dear. The bakery is bright and happy again." },
  { id: "gardenCat", place: "garden", title: "Find the garden cat", opening: "Look! A small cat is under the rose.", ending: "You found the cat. The garden feels peaceful again." },
  { id: "boutiqueDress", place: "boutique", title: "Choose a blue dress", opening: "Welcome, Princess! This dress is blue.", ending: "This dress looks lovely on you, Princess." },
  { id: "shoeFitting", place: "shoeShop", title: "Find shoes for a long walk", opening: "Hello, Princess! These shoes are soft.", ending: "Now your feet are ready for the long road." },
  { id: "ribbonGift", place: "accessoryShop", title: "Pick a ribbon for the party", opening: "Good day, Princess! The ribbon is pink.", ending: "The ribbon shines softly. The party will be sweet." },
  { id: "farmCow", place: "farm", title: "Help at Sunny Farm", opening: "Good afternoon! The cow is big and kind.", ending: "The animals are calm now. Thank you for helping." },
  { id: "seaWeather", place: "lighthouse", title: "Check the sea weather", opening: "Hello, Princess! It is sunny by the sea.", ending: "Now the ships can sail safely. Well done." }
];

const lessons = [
  { id: "harbor-fish-100", place: "harbor", tier: 100, prompt: "Pick the sentence that buys one fish.", answer: "I want a fish.", choices: ["I want a fish.", "I want a book.", "I want a dress.", "I want a flower."], words: ["want", "fish"], reward: { vocab: 1, expression: 1 } },
  { id: "market-apple-100", place: "market", tier: 100, prompt: "Pick the sentence that buys an apple.", answer: "I want an apple.", choices: ["I want an apple.", "I want a fish.", "I see a cat.", "It is sunny."], words: ["apple", "want"], reward: { vocab: 1, expression: 1 } },
  { id: "garden-cat-100", place: "garden", tier: 100, prompt: "Pick what Lumi sees.", answer: "I see a cat.", choices: ["I see a cat.", "I eat bread.", "I need shoes.", "I ride a boat."], words: ["see", "cat"], reward: { vocab: 1, kindness: 1 } },
  { id: "boutique-color-100", place: "boutique", tier: 100, prompt: "Pick the sentence about the blue dress.", answer: "The dress is blue.", choices: ["The dress is blue.", "The fish is blue.", "The cat is hungry.", "I want an apple."], words: ["dress", "blue"], reward: { vocab: 1, expression: 1 } },
  { id: "shoe-soft-100", place: "shoeShop", tier: 100, prompt: "Pick the sentence about the shoes.", answer: "The shoes are soft.", choices: ["The shoes are soft.", "The fish is soft.", "The cat is blue.", "I want bread."], words: ["shoes", "soft"], reward: { vocab: 1, expression: 1 } },
  { id: "accessory-ribbon-100", place: "accessoryShop", tier: 100, prompt: "Pick the sentence about the ribbon.", answer: "The ribbon is pink.", choices: ["The ribbon is pink.", "The cow is pink.", "I eat shoes.", "The sea is bread."], words: ["ribbon", "pink"], reward: { vocab: 1, expression: 1 } },
  { id: "farm-cow-100", place: "farm", tier: 100, prompt: "Pick the sentence about the cow.", answer: "The cow is big.", choices: ["The cow is big.", "The fish is small.", "I want a dress.", "It is sunny."], words: ["cow", "big"], reward: { vocab: 1, kindness: 1 } },
  { id: "lighthouse-sunny-100", place: "lighthouse", tier: 100, prompt: "Pick the sentence about the weather.", answer: "It is sunny.", choices: ["It is sunny.", "I want a fish.", "The dress is blue.", "The cow is big."], words: ["sunny", "sea"], reward: { vocab: 1, expression: 1 } },
  { id: "boutique-dress-250", place: "boutique", tier: 250, prompt: "Pick the sentence that asks the price.", answer: "How much is the blue dress?", choices: ["How much is the blue dress?", "Where is the blue fish?", "The dress is eating bread.", "I cannot see the garden."], words: ["blue", "dress", "much"], reward: { expression: 2 } },
  { id: "shoe-price-250", place: "shoeShop", tier: 250, prompt: "Pick the polite question for shoes.", answer: "May I try these shoes?", choices: ["May I try these shoes?", "May I eat these shoes?", "The shoes try the princess.", "The ribbon sails away."], words: ["try", "shoes", "may"], reward: { expression: 2 } },
  { id: "accessory-gift-250", place: "accessoryShop", tier: 250, prompt: "Pick the sentence about a gift.", answer: "This ribbon is a gift.", choices: ["This ribbon is a gift.", "This fish is a crown.", "The gift is under the sea.", "The cow wears a ship."], words: ["ribbon", "gift", "this"], reward: { vocab: 2, kindness: 1 } },
  { id: "farm-rabbit-250", place: "farm", tier: 250, prompt: "Pick the sentence about the rabbit.", answer: "The rabbit likes carrots.", choices: ["The rabbit likes carrots.", "The rabbit drives a ship.", "The carrot likes rabbits.", "The farm is a dress."], words: ["rabbit", "carrot", "like"], reward: { vocab: 2, kindness: 1 } },
  { id: "lighthouse-weather-500", place: "lighthouse", tier: 500, prompt: "Pick the sentence about the sky and sea.", answer: "It is cloudy, and the sea is calm.", choices: ["It is cloudy, and the sea is calm.", "It is sunny, and the sea is loud.", "The lighthouse is eating clouds.", "The dress is calm and cloudy."], words: ["cloudy", "sea", "calm"], reward: { vocab: 2, expression: 2 } },
  { id: "market-polite-500", place: "market", tier: 500, prompt: "Pick the polite sentence for buying bread.", answer: "May I have some bread, please?", choices: ["May I have some bread, please?", "Give me the bread now.", "The bread has a garden.", "Please have some cloudy fish."], words: ["may", "bread", "please"], reward: { expression: 2, kindness: 1 } },
  { id: "garden-direction-750", place: "garden", tier: 750, prompt: "Pick the sentence that asks about the fountain.", answer: "Where is the fountain?", choices: ["Where is the fountain?", "When is the fountain hungry?", "Why does the queen sell fish?", "Which rabbit is cloudy today?"], words: ["where", "fountain", "near"], reward: { expression: 3 } },
  { id: "harbor-compare-750", place: "harbor", tier: 750, prompt: "Pick the sentence that compares the boats.", answer: "This boat is bigger than that boat.", choices: ["This boat is bigger than that boat.", "This boat is the smallest apple.", "That fish is bigger than the sky.", "The boat wants a dress."], words: ["boat", "bigger", "than"], reward: { vocab: 2, expression: 2 } },
  { id: "lighthouse-safety-1000", place: "lighthouse", tier: 1000, prompt: "Pick what we should do before sailing.", answer: "We should check the weather report before we sail.", choices: ["We should check the weather report before we sail.", "We should sail before the weather can read.", "The report should wear a blue dress.", "The lighthouse buys bread because it is cloudy."], words: ["should", "weather", "before", "sail"], reward: { vocab: 3, expression: 3 } }
];

const defaultState = {
  coins: 100,
  energy: 84,
  vocab: 0,
  expression: 0,
  kindness: 0,
  mood: 72,
  difficulty: 100,
  speechEnabled: true,
  owned: ["pinkDress"],
  outfit: { dress: "pinkDress", shoes: "none", hat: "none", accessory: "none", room: "none" },
  diary: [],
  completedLessons: [],
  metNpcs: [],
  learnedWords: [],
  badges: [],
  activeQuest: null,
  player: { x: 48, y: 43 },
  playerNode: "castle"
};

let state = loadLocalState();
let openAISettings = loadOpenAISettings();
let activeHotspot = null;
let activeLesson = null;
let advMode = "closed";
let shopCategory = "dress";
let activeShopHotspot = null;
let wardrobeCategory = "dress";
let princessExpression = "normal";
let npcExpression = "normal";
let advFocusIndex = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  tabs: $$(".tab-button"),
  views: $$(".view"),
  homeView: $("#homeView"),
  saveButton: $("#saveButton"),
  loadButton: $("#loadButton"),
  loadFileInput: $("#loadFileInput"),
  coinValue: $("#coinValue"),
  energyValue: $("#energyValue"),
  vocabValue: $("#vocabValue"),
  expressionValue: $("#expressionValue"),
  kindnessValue: $("#kindnessValue"),
  moodValue: $("#moodValue"),
  outfitSummary: $("#outfitSummary"),
  statusMessage: $("#statusMessage"),
  goMapButton: $("#goMapButton"),
  wardrobeCount: $("#wardrobeCount"),
  wardrobeTabs: $("#wardrobeTabs"),
  wardrobeGrid: $("#wardrobeGrid"),
  mapStage: $("#mapStage"),
  playerToken: $("#playerToken"),
  hotspotLayer: $("#hotspotLayer"),
  nodeLayer: $("#nodeLayer"),
  routeLayer: $("#routeLayer"),
  nearbyCard: $("#nearbyCard"),
  nearbyName: $("#nearbyName"),
  nearbyHint: $("#nearbyHint"),
  interactButton: $("#interactButton"),
  returnHomeButton: $("#returnHomeButton"),
  mapObjective: $("#mapObjective"),
  advModal: $("#advModal"),
  advScene: $("#advScene"),
  advTitle: $("#advTitle"),
  advNpcPortrait: $("#advNpcPortrait"),
  advSpeaker: $("#advSpeaker"),
  advLine: $("#advLine"),
  advPrompt: $("#advPrompt"),
  choiceList: $("#choiceList"),
  shopArea: $("#shopArea"),
  advShopTabs: $("#advShopTabs"),
  advShopGrid: $("#advShopGrid"),
  advFeedback: $("#advFeedback"),
  keyboardHint: $("#keyboardHint"),
  speakPromptButton: $("#speakPromptButton"),
  helpButton: $("#helpButton"),
  advCloseButton: $("#advCloseButton"),
  collectionSummary: $("#collectionSummary"),
  diaryList: $("#diaryList"),
  clearDiaryButton: $("#clearDiaryButton"),
  difficultySelect: $("#difficultySelect"),
  speakToggleButton: $("#speakToggleButton"),
  resetButton: $("#resetButton"),
  openaiOrgInput: $("#openaiOrgInput"),
  openaiKeyInput: $("#openaiKeyInput"),
  saveOpenAIButton: $("#saveOpenAIButton"),
  clearOpenAIButton: $("#clearOpenAIButton"),
  aiStatus: $("#aiStatus"),
  roomPropDesk: $("#roomPropDesk"),
  roomPropLamp: $("#roomPropLamp")
};

function loadLocalState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return freshState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return freshState();
  }
}

function loadOpenAISettings() {
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

function persistOpenAISettings() {
  localStorage.setItem(openAISettingsKey, JSON.stringify(openAISettings));
}

function freshState() {
  const stateCopy = JSON.parse(JSON.stringify(defaultState));
  stateCopy.activeQuest = createRandomQuest(null);
  return stateCopy;
}

function normalizeState(candidate = {}) {
  const base = freshState();
  const merged = { ...base, ...candidate };
  merged.owned = Array.isArray(candidate.owned) ? [...new Set(["pinkDress", ...candidate.owned])] : base.owned;
  merged.outfit = { ...base.outfit, ...(candidate.outfit || {}) };
  if (merged.outfit.pants && !candidate.outfit?.shoes) merged.outfit.shoes = "none";
  merged.diary = Array.isArray(candidate.diary) ? candidate.diary : [];
  merged.completedLessons = Array.isArray(candidate.completedLessons) ? candidate.completedLessons : [];
  merged.metNpcs = Array.isArray(candidate.metNpcs) ? [...new Set(candidate.metNpcs)] : [];
  merged.learnedWords = Array.isArray(candidate.learnedWords) ? [...new Set(candidate.learnedWords)] : [];
  merged.badges = Array.isArray(candidate.badges) ? [...new Set(candidate.badges)] : [];
  merged.player = normalizePlayer(candidate.player, candidate.playerNode);
  merged.playerNode = mapNodes[candidate.playerNode] ? candidate.playerNode : closestNodeFromLegacy(candidate.player);
  merged.difficulty = Number(difficultyConfig[candidate.difficulty] ? candidate.difficulty : base.difficulty);
  merged.activeQuest = normalizeQuest(candidate.activeQuest || candidate.currentQuest) || createRandomQuest(null);
  delete merged.schedule;
  delete merged.currentQuest;
  delete merged.week;
  delete merged.dayIndex;
  return merged;
}

function normalizePlayer(player, nodeId) {
  if (player && typeof player.x === "number" && typeof player.y === "number") {
    return { x: clamp(player.x, 6, 94), y: clamp(player.y, 8, 92) };
  }
  const node = mapNodes[nodeId] || mapNodes.castle;
  return { x: node.x, y: node.y };
}

function closestNodeFromLegacy(player) {
  if (!player || typeof player.x !== "number") return "castle";
  let best = "castle";
  let bestDistance = Infinity;
  Object.values(mapNodes).forEach((node) => {
    const distance = Math.hypot(node.x - player.x, node.y - player.y);
    if (distance < bestDistance) {
      best = node.id;
      bestDistance = distance;
    }
  });
  return best;
}

function normalizeQuest(quest) {
  if (!quest || typeof quest !== "object") return null;
  const place = quest.place || quest.targetPlace;
  const template = questTemplates.find((item) => item.id === quest.templateId || item.place === place);
  if (!template) return null;
  const hotspot = hotspotById(template.place);
  return {
    id: quest.id || `${Date.now()}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    ending: template.ending,
    npc: hotspot.npc
  };
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hotspotById(id) {
  return hotspots.find((hotspot) => hotspot.id === id);
}

function hotspotByNode(nodeId) {
  return hotspots.find((hotspot) => hotspot.node === nodeId) || null;
}

function itemById(id) {
  return shopItems.find((item) => item.id === id) || null;
}

function createRandomQuest(previousPlace) {
  const available = questTemplates.filter((quest) => quest.place !== previousPlace);
  const pool = available.length ? available : questTemplates;
  const template = pool[Math.floor(Math.random() * pool.length)];
  const hotspot = hotspotById(template.place);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}-${template.id}`,
    templateId: template.id,
    place: template.place,
    title: template.title,
    opening: template.opening,
    ending: template.ending,
    npc: hotspot.npc
  };
}

function changeView(viewName) {
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  if (location.hash.slice(1) !== viewName) {
    history.replaceState(null, "", `#${viewName}`);
  }
  if (viewName === "map") setTimeout(() => elements.mapStage.focus({ preventScroll: true }), 0);
}

function applyEffects(effects = {}) {
  state.coins = Math.max(0, state.coins + (effects.coins || 0));
  state.energy = clamp(state.energy + (effects.energy || 0), 0, 100);
  state.vocab += effects.vocab || 0;
  state.expression += effects.expression || 0;
  state.kindness += effects.kindness || 0;
  state.mood = clamp(state.mood + (effects.mood || 0), 0, 100);
}

function effectText(effects = {}) {
  const parts = [];
  if (effects.coins) parts.push(`${effects.coins > 0 ? "+" : ""}${effects.coins} coins`);
  if (effects.energy) parts.push(`${effects.energy > 0 ? "+" : ""}${effects.energy} energy`);
  if (effects.vocab) parts.push(`+${effects.vocab} words`);
  if (effects.expression) parts.push(`+${effects.expression} talk`);
  if (effects.kindness) parts.push(`+${effects.kindness} kind`);
  if (effects.mood) parts.push(`${effects.mood > 0 ? "+" : ""}${effects.mood} mood`);
  return parts.join(", ") || "No change";
}

function addDiary(entry) {
  state.diary.unshift({ at: new Date().toLocaleString("en-US"), ...entry });
  state.diary = state.diary.slice(0, 80);
}

function addUnique(listName, values) {
  values.forEach((value) => {
    if (value && !state[listName].includes(value)) state[listName].push(value);
  });
}

function awardBadge(id) {
  if (!state.badges.includes(id)) state.badges.push(id);
}

function updateProgressBadges() {
  if (state.completedLessons.length >= 1) awardBadge("First Quest");
  if (state.completedLessons.length >= 5) awardBadge("Kind Helper");
  if (state.learnedWords.length >= 5) awardBadge("Word Finder");
  if (state.owned.length >= 4) awardBadge("Doll Stylist");
}

function setExpressions(princess = "normal", npc = "normal") {
  princessExpression = princess;
  npcExpression = npc;
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.dataset.expression = princessExpression;
  });
  elements.advNpcPortrait.dataset.expression = npcExpression;
}

function render() {
  renderStatus();
  renderPaperDolls();
  renderHome();
  renderMap();
  renderDiary();
  renderSettings();
}

function renderStatus() {
  elements.coinValue.textContent = state.coins;
  elements.energyValue.textContent = state.energy;
  elements.vocabValue.textContent = state.vocab;
  elements.expressionValue.textContent = state.expression;
  elements.kindnessValue.textContent = state.kindness;
  elements.moodValue.textContent = moodLabel(state.mood);
  elements.outfitSummary.textContent = outfitSummary();
}

function moodLabel(mood) {
  if (mood >= 82) return "Happy";
  if (mood >= 56) return "OK";
  if (mood >= 30) return "Tired";
  return "Sad";
}

function outfitSummary() {
  const labels = [];
  ["dress", "shoes", "hat", "accessory", "room"].forEach((type) => {
    const item = itemById(state.outfit[type]);
    if (item) labels.push(item.name);
  });
  return labels.join(" / ") || "No outfit";
}

function renderPaperDolls() {
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.innerHTML = avatarMarkup(doll.dataset.doll || "side");
    doll.dataset.dress = state.outfit.dress || "none";
    doll.dataset.shoes = state.outfit.shoes || "none";
    doll.dataset.hat = state.outfit.hat || "none";
    doll.dataset.accessory = state.outfit.accessory || "none";
    doll.dataset.expression = princessExpression;
  });
}

function avatarMarkup(surface) {
  const pose = avatarPoseFor(surface);
  return `
    <div class="avatar-shadow"></div>
    <img class="avatar-base" src="assets/characters/princess-${pose}.png" alt="" />
    <span class="avatar-layer avatar-dress" aria-hidden="true"></span>
    <span class="avatar-layer avatar-shoes" aria-hidden="true"></span>
    <span class="avatar-layer avatar-hat" aria-hidden="true"></span>
    <span class="avatar-layer avatar-accessory" aria-hidden="true"></span>
  `;
}

function avatarPoseFor(surface) {
  if (surface === "map") return "happy";
  if (princessExpression === "happy") return "cheer";
  if (princessExpression === "thinking") return "thinking";
  return "happy";
}

function renderHome() {
  elements.wardrobeCount.textContent = `${state.owned.length} owned`;
  elements.roomPropDesk.classList.toggle("show", state.owned.includes("studyDesk"));
  elements.roomPropLamp.classList.toggle("show", state.owned.includes("seaLamp"));
  renderCategoryTabs(elements.wardrobeTabs, wardrobeCategory, (category) => {
    wardrobeCategory = category;
    renderWardrobe();
  }, true);
  renderWardrobe();
}

function renderCategoryTabs(container, active, onClick, includeOwnedOnly = false, allowedCategories = null) {
  container.innerHTML = "";
  categories.forEach((category) => {
    if (allowedCategories && !allowedCategories.includes(category.id)) return;
    if (includeOwnedOnly && !shopItems.some((item) => item.type === category.id && state.owned.includes(item.id))) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${active === category.id ? " active" : ""}`;
    button.textContent = category.label;
    button.addEventListener("click", () => onClick(category.id));
    container.appendChild(button);
  });
}

function renderWardrobe() {
  if (!shopItems.some((item) => item.type === wardrobeCategory && state.owned.includes(item.id))) {
    wardrobeCategory = state.owned.map((id) => itemById(id)).find(Boolean)?.type || "dress";
  }
  elements.wardrobeGrid.innerHTML = "";
  shopItems.filter((item) => item.type === wardrobeCategory && state.owned.includes(item.id)).forEach((item) => {
    elements.wardrobeGrid.appendChild(createItemCard(item, {
      mode: "wardrobe",
      action: () => toggleEquip(item)
    }));
  });
}

function createItemCard(item, options = {}) {
  const owned = state.owned.includes(item.id);
  const equipped = state.outfit[item.type] === item.id;
  const affordable = state.coins >= item.cost;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-card ${item.type}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!owned && !affordable ? " locked" : ""}`;
  button.innerHTML = `
    <span class="item-preview ${item.shape}" style="--c1:${item.colors[0]};--c2:${item.colors[1]}"></span>
    <strong>${item.name}</strong>
    <span>${owned ? equipped ? "Equipped" : "Owned" : `${item.cost} coins`}</span>
    <small>${item.type}</small>
  `;
  button.addEventListener("click", options.action || (() => {}));
  return button;
}

function toggleEquip(item) {
  state.outfit[item.type] = state.outfit[item.type] === item.id ? "none" : item.id;
  elements.statusMessage.textContent = state.outfit[item.type] === item.id ? `${item.name} equipped.` : `${item.name} removed.`;
  persist();
  render();
}

function renderMap() {
  const target = hotspotById(state.activeQuest.place);
  elements.mapObjective.textContent = `Current quest: ${state.activeQuest.title}. Target: ${target.icon} ${target.label}.`;
  elements.routeLayer.innerHTML = "";
  elements.nodeLayer.innerHTML = "";
  renderHotspots();
  updatePlayerPosition();
  updateNearbyHotspot();
}

function renderRoutes() {
  const drawn = new Set();
  elements.routeLayer.innerHTML = "";
  Object.values(mapNodes).forEach((node) => {
    node.links.forEach((linkId) => {
      const key = [node.id, linkId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);
      const other = mapNodes[linkId];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", node.x);
      line.setAttribute("y1", node.y);
      line.setAttribute("x2", other.x);
      line.setAttribute("y2", other.y);
      elements.routeLayer.appendChild(line);
    });
  });
}

function renderNodes() {
  elements.nodeLayer.innerHTML = "";
  Object.values(mapNodes).forEach((node) => {
    const marker = document.createElement("div");
    marker.className = `road-node${node.id === state.playerNode ? " current" : ""}${mapNodes[state.playerNode].links.includes(node.id) ? " reachable" : ""}`;
    marker.style.left = `${node.x}%`;
    marker.style.top = `${node.y}%`;
    elements.nodeLayer.appendChild(marker);
  });
}

function renderHotspots() {
  elements.hotspotLayer.innerHTML = "";
  hotspots.forEach((hotspot) => {
    const node = mapNodes[hotspot.node];
    const marker = document.createElement("div");
    const isTarget = state.activeQuest.place === hotspot.id;
    marker.className = `map-marker hotspot ${hotspot.npcClass}${isTarget ? " target" : ""}${hotspot.kind === "shop" ? " shop" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.style.left = `${node.x}%`;
    marker.style.top = `${node.y}%`;
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    elements.hotspotLayer.appendChild(marker);
  });
}

function updatePlayerPosition() {
  elements.playerToken.style.left = `${state.player.x}%`;
  elements.playerToken.style.top = `${state.player.y}%`;
}

function updateNearbyHotspot() {
  activeHotspot = nearbyHotspot();
  elements.nearbyCard.classList.remove("show");
  updateHotspotFocus();
  if (!activeHotspot) {
    const target = hotspotById(state.activeQuest.place);
    elements.mapObjective.textContent = `Current quest: ${state.activeQuest.title}. Target: ${target.icon} ${target.label}.`;
    return;
  }
  const isTarget = activeHotspot.id === state.activeQuest.place;
  elements.nearbyName.textContent = activeHotspot.label;
  if (activeHotspot.kind === "shop") {
    elements.nearbyHint.textContent = isTarget ? `${activeHotspot.npc} has today's quest and the shop is open.` : activeHotspot.hint;
    elements.interactButton.textContent = isTarget ? "Talk" : "Shop";
  } else if (isTarget) {
    elements.nearbyHint.textContent = `${activeHotspot.npc} is waiting for Lumi.`;
    elements.interactButton.textContent = "Talk";
  } else {
    elements.nearbyHint.textContent = `${activeHotspot.hint} It seems ${hotspotById(state.activeQuest.place).label} needs Lumi next.`;
    elements.interactButton.textContent = "Talk";
  }
  if (activeHotspot.kind === "room") {
    elements.mapObjective.textContent = "Princess Room: Press Enter to go inside.";
  } else if (isTarget) {
    elements.mapObjective.textContent = `${activeHotspot.icon} ${activeHotspot.label}: Press Enter to start Lumi's task.`;
  } else if (activeHotspot.kind === "shop") {
    elements.mapObjective.textContent = `${activeHotspot.icon} ${activeHotspot.label}: Press Enter to shop.`;
  } else {
    elements.mapObjective.textContent = `${activeHotspot.icon} ${activeHotspot.label}: ${activeHotspot.hint}`;
  }
}

function updateHotspotFocus() {
  document.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyHotspot() {
  let best = null;
  let bestDistance = Infinity;
  hotspots.forEach((hotspot) => {
    const node = mapNodes[hotspot.node];
    const distance = Math.hypot(node.x - state.player.x, (node.y - state.player.y) * 1.25);
    if (distance < bestDistance) {
      best = hotspot;
      bestDistance = distance;
    }
  });
  return bestDistance <= 10.5 ? best : null;
}

function moveOnMap(dx, dy) {
  const speed = 1.45;
  const next = {
    x: clamp(state.player.x + dx * speed, 6, 94),
    y: clamp(state.player.y + dy * speed, 8, 92)
  };
  if (!isWalkable(next.x, next.y)) {
    elements.statusMessage.textContent = "Lumi should stay on safe paths.";
    return;
  }
  state.player = next;
  state.playerNode = closestNodeFromLegacy(state.player);
  elements.playerToken.classList.add("walking");
  window.setTimeout(() => elements.playerToken.classList.remove("walking"), 180);
  persist();
  renderMap();
}

function isWalkable(x, y) {
  if (y > 78 && (x < 28 || x > 76)) return false;
  if (y > 70 && x > 77) return false;
  if (x < 16 && y < 24) return false;
  if (x > 84 && y < 17) return false;
  const zones = [
    [58, 51, 34, 30],
    [55, 68, 32, 16],
    [70, 35, 18, 23],
    [48, 43, 16, 11],
    [52, 59, 25, 14],
    [42, 74, 19, 9],
    [70, 76, 10, 8],
    [75, 24, 20, 12],
    [63, 56, 15, 11],
    [58, 66, 16, 9],
    [68, 50, 16, 10],
    [30, 52, 18, 12],
    [38, 61, 17, 11]
  ];
  return zones.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
}

function interactNearby() {
  if (!activeHotspot) return;
  if (activeHotspot.kind === "room") {
    changeView("home");
    return;
  }
  if (activeHotspot.kind === "shop" && activeHotspot.id !== state.activeQuest.place) {
    openShopAdv(activeHotspot);
    return;
  }
  if (activeHotspot.id === state.activeQuest.place) {
    openQuestAdv(activeHotspot);
    return;
  }
  openHintAdv(activeHotspot);
}

function openAdvBase(hotspot, mode) {
  advMode = mode;
  activeLesson = null;
  activeShopHotspot = null;
  advFocusIndex = 0;
  setExpressions("normal", "normal");
  elements.advModal.classList.add("show");
  elements.advModal.setAttribute("aria-hidden", "false");
  elements.advScene.className = `adv-scene ${hotspot.scene}`;
  elements.advTitle.textContent = hotspot.label;
  elements.advNpcPortrait.className = `portrait-card adv-npc ${hotspot.npcClass}`;
  elements.advNpcPortrait.dataset.expression = npcExpression;
  elements.advSpeaker.textContent = hotspot.npc;
  elements.choiceList.innerHTML = "";
  elements.advShopGrid.innerHTML = "";
  elements.shopArea.classList.remove("show");
  elements.advFeedback.textContent = "";
  elements.advCloseButton.textContent = "Leave";
  elements.keyboardHint.textContent = "↑↓ Select / Enter Confirm / 1-4 Quick Pick / Esc Leave";
  renderPaperDolls();
}

function addAdvOption(label, onClick, options = {}) {
  const button = document.createElement("button");
  button.className = `choice-button${options.leave ? " leave-choice" : ""}`;
  button.type = "button";
  button.textContent = options.number ? `${options.number}. ${label}` : label;
  if (options.choice) button.dataset.choice = options.choice;
  button.addEventListener("click", onClick);
  elements.choiceList.appendChild(button);
  return button;
}

function advFocusableButtons() {
  if (!elements.advModal.classList.contains("show")) return [];
  const selectors = [
    "#choiceList .choice-button:not(:disabled)",
    "#advShopGrid .item-card:not(:disabled)",
    "#advShopGrid .shop-leave-button:not(:disabled)",
    "#advCloseButton:not(:disabled)"
  ];
  return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).filter((button) => button.offsetParent !== null);
}

function setAdvFocus(index = 0) {
  const buttons = advFocusableButtons();
  document.querySelectorAll(".adv-focus").forEach((button) => button.classList.remove("adv-focus"));
  if (!buttons.length) return;
  advFocusIndex = (index + buttons.length) % buttons.length;
  const button = buttons[advFocusIndex];
  button.classList.add("adv-focus");
  button.focus({ preventScroll: true });
}

function moveAdvFocus(delta) {
  const buttons = advFocusableButtons();
  if (!buttons.length) return;
  setAdvFocus(advFocusIndex + delta);
}

function confirmAdvFocus() {
  const buttons = advFocusableButtons();
  if (!buttons.length) return false;
  buttons[advFocusIndex]?.click();
  return true;
}

function openQuestAdv(hotspot) {
  const lesson = pickLesson(hotspot.id);
  if (!lesson) {
    openHintAdv(hotspot, `No task for ${state.difficulty} words here. Try another word level.`);
    return;
  }
  openAdvBase(hotspot, "quest");
  addUnique("metNpcs", [hotspot.npc]);
  activeLesson = lesson;
  elements.advLine.textContent = state.activeQuest.opening;
  elements.advPrompt.textContent = `${state.activeQuest.title}: ${lesson.prompt}`;
  shuffled(lesson.choices).forEach((choice, index) => {
    let button;
    button = addAdvOption(choice, () => answerLesson(button, choice), { number: index + 1, choice });
  });
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(state.activeQuest.opening);
}

function openHintAdv(hotspot, line = hotspot.hint) {
  openAdvBase(hotspot, "hint");
  setExpressions("thinking", "normal");
  elements.advLine.textContent = line;
  elements.advPrompt.textContent = `Hint: today's quest is at ${hotspotById(state.activeQuest.place).label}.`;
  elements.advFeedback.textContent = "Choose Leave to return to the map.";
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
}

function openShopAdv(hotspot) {
  openAdvBase(hotspot, "shop");
  activeShopHotspot = hotspot;
  addUnique("metNpcs", [hotspot.npc]);
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "dress";
  shopCategory = allowedShopCategories(hotspot).includes(shopCategory) ? shopCategory : firstCategory;
  elements.advLine.textContent = shopGreeting(hotspot);
  elements.advPrompt.textContent = "Choose a treasure, try it on, then buy it for Lumi.";
  elements.shopArea.classList.add("show");
  renderAdvShop();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function allowedShopCategories(hotspot = activeShopHotspot) {
  return hotspot?.shopCategories?.length ? hotspot.shopCategories : categories.map((category) => category.id);
}

function shopGreeting(hotspot) {
  const greetings = {
    boutique: "Welcome, Princess. Dresses are ready for a bright day.",
    shoeShop: "Hello, Princess. Try shoes for the road.",
    accessoryShop: "Good day, Princess. Pick a ribbon, crown, bag, or cape."
  };
  return greetings[hotspot.id] || "Welcome, Princess. Pick a lovely item.";
}

function renderAdvShop() {
  const allowed = allowedShopCategories();
  if (!allowed.includes(shopCategory)) shopCategory = allowed[0] || "dress";
  renderCategoryTabs(elements.advShopTabs, shopCategory, (category) => {
    shopCategory = category;
    renderAdvShop();
  }, false, allowed);
  elements.advShopGrid.innerHTML = "";
  shopItems.filter((item) => item.type === shopCategory && allowed.includes(item.type)).forEach((item) => {
    elements.advShopGrid.appendChild(createItemCard(item, {
      mode: "shop",
      action: () => buyItemInAdv(item)
    }));
  });
  const leave = document.createElement("button");
  leave.type = "button";
  leave.className = "shop-leave-button";
  leave.textContent = "Leave";
  leave.addEventListener("click", closeAdv);
  elements.advShopGrid.appendChild(leave);
  window.setTimeout(() => setAdvFocus(0), 0);
}

function buyItemInAdv(item) {
  if (state.owned.includes(item.id)) {
    if (item.type !== "room") toggleEquip(item);
    renderAdvShop();
    window.setTimeout(() => setAdvFocus(advFocusIndex), 0);
    return;
  }
  if (state.coins < item.cost) {
    elements.advFeedback.textContent = `Not enough coins. Need ${item.cost - state.coins} more.`;
    playTone("wrong");
    speak("Not enough coins.");
    return;
  }
  state.coins -= item.cost;
  playTone("buy");
  state.owned.push(item.id);
  state.outfit[item.type] = item.id;
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  elements.advLine.textContent = `${item.name} is yours now. It looks wonderful.`;
  elements.advFeedback.textContent = `${item.name} bought and equipped.`;
  elements.statusMessage.textContent = `${item.name} bought.`;
  persist();
  render();
  renderAdvShop();
}

function pickLesson(place) {
  const maxTier = difficultyConfig[state.difficulty].maxTier;
  const pool = lessons.filter((lesson) => lesson.place === place && lesson.tier <= maxTier);
  if (!pool.length) return null;
  const unfinished = pool.filter((lesson) => !state.completedLessons.includes(lesson.id));
  const candidates = unfinished.length ? unfinished : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function answerLesson(button, choice) {
  if (!activeLesson || advMode !== "quest") return;
  const correct = choice === activeLesson.answer;
  if (!correct) {
    button.classList.add("wrong");
    setExpressions("thinking", "surprised");
    elements.advFeedback.textContent = `Try again: ${activeLesson.prompt}`;
    playTone("wrong");
    speak("Try again.");
    return;
  }

  const multiplier = difficultyConfig[state.difficulty].reward;
  const reward = {
    coins: 100,
    vocab: Math.max(1, Math.round((activeLesson.reward.vocab || 0) * multiplier)),
    expression: Math.max(0, Math.round((activeLesson.reward.expression || 0) * multiplier)),
    kindness: Math.max(0, Math.round((activeLesson.reward.kindness || 0) * multiplier)),
    energy: -3,
    mood: 2
  };
  applyEffects(reward);
  playTone("correct");
  addUnique("completedLessons", [activeLesson.id]);
  addUnique("learnedWords", activeLesson.words);
  addUnique("metNpcs", [hotspotById(state.activeQuest.place).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  elements.choiceList.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    if (item.dataset.choice === activeLesson.answer) item.classList.add("correct");
  });
  addDiary({
    type: "quest",
    title: `${state.activeQuest.title} at ${hotspotById(state.activeQuest.place).label}`,
    body: `Sentence: "${activeLesson.answer}"`,
    result: effectText(reward),
    lessonId: activeLesson.id,
    words: activeLesson.words,
    difficulty: state.difficulty
  });
  const oldPlace = state.activeQuest.place;
  const completedHotspot = hotspotById(oldPlace);
  elements.advLine.textContent = state.activeQuest.ending;
  elements.advPrompt.textContent = "Quest complete. Lumi earned 100 coins.";
  elements.advFeedback.textContent = `${effectText(reward)}.`;
  elements.advCloseButton.textContent = "Leave";
  state.activeQuest = createRandomQuest(oldPlace);
  activeLesson = null;
  advMode = "complete";
  elements.choiceList.innerHTML = "";
  if (completedHotspot?.kind === "shop") {
    addAdvOption("Shop", () => openShopAdv(completedHotspot));
    addAdvOption("Leave", closeAdv, { leave: true });
  } else {
    addAdvOption("Continue", closeAdv);
  }
  elements.statusMessage.textContent = `Quest complete. New target: ${hotspotById(state.activeQuest.place).label}.`;
  persist();
  render();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function closeAdv() {
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  advMode = "closed";
  activeLesson = null;
  activeShopHotspot = null;
  setExpressions("normal", "normal");
  elements.mapStage.focus({ preventScroll: true });
}

async function showHelp() {
  if (advMode === "closed") return;
  const line = elements.advLine.textContent;
  const prompt = activeLesson?.prompt || elements.advPrompt.textContent;
  elements.advFeedback.textContent = "Help teacher is thinking...";
  try {
    const choices = [...elements.choiceList.querySelectorAll("button")].map((button) => button.dataset.choice || button.textContent);
    const proxyResponse = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line, prompt, choices })
    });
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      elements.advFeedback.textContent = data.text || localHelpText(line, prompt);
      return;
    }
    if (!openAISettings.apiKey) {
      elements.advFeedback.textContent = localHelpText(line, prompt);
      return;
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAISettings.apiKey}`,
        ...(openAISettings.orgId ? { "OpenAI-Organization": openAISettings.orgId } : {})
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "You are a kind English helper for a young child. Give one short hint. Do not directly reveal the answer."
          },
          {
            role: "user",
            content: `NPC line: ${line}\nTask: ${prompt}\nChoices: ${choices.join(" | ")}`
          }
        ],
        max_output_tokens: 90
      })
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = await response.json();
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join(" ");
    elements.advFeedback.textContent = text || localHelpText(line, prompt);
  } catch (error) {
    elements.advFeedback.textContent = `${localHelpText(line, prompt)} Help API was not available: ${error.message}`;
  }
}

function localHelpText(line, prompt) {
  return `Hint: "${line}" is the clue. ${prompt} Look for the main word in the choices.`;
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderDiary() {
  renderCollectionSummary();
  elements.diaryList.innerHTML = "";
  if (!state.diary.length) {
    elements.diaryList.innerHTML = `<div class="diary-entry"><strong>No diary yet</strong><span>Finish quests or buy items to see records here.</span></div>`;
    return;
  }
  state.diary.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "diary-entry";
    row.innerHTML = `<strong>${entry.title}</strong><span>${entry.body}</span><span>${entry.result || ""}</span><small>${entry.at}</small>`;
    elements.diaryList.appendChild(row);
  });
}

function renderCollectionSummary() {
  if (!elements.collectionSummary) return;
  const badgeText = state.badges.length ? state.badges.join(" / ") : "No badges yet";
  const npcText = state.metNpcs.length ? state.metNpcs.join(" / ") : "No friends met yet";
  const wordText = state.learnedWords.length ? state.learnedWords.slice(0, 12).join(" / ") : "No words yet";
  elements.collectionSummary.innerHTML = `
    <div><strong>${state.learnedWords.length}</strong><span>Words</span><small>${wordText}</small></div>
    <div><strong>${state.metNpcs.length}</strong><span>Friends</span><small>${npcText}</small></div>
    <div><strong>${state.badges.length}</strong><span>Badges</span><small>${badgeText}</small></div>
  `;
}

function renderSettings() {
  elements.difficultySelect.value = String(state.difficulty);
  elements.speakToggleButton.textContent = `Voice: ${state.speechEnabled ? "On" : "Off"}`;
  elements.openaiOrgInput.value = openAISettings.orgId;
  elements.openaiKeyInput.value = openAISettings.apiKey ? "••••••••" : "";
  elements.aiStatus.textContent = openAISettings.apiKey
    ? "Help key saved locally in this browser. Save MD will not export it."
    : "No help key saved. The ? button will use local hints.";
}

function speak(text) {
  if (!state.speechEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
}

function playTone(kind) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { correct: 660, wrong: 180, buy: 820 };
    oscillator.frequency.value = frequencies[kind] || 440;
    oscillator.type = "sine";
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
  } catch {}
}

function buildSaveMarkdown() {
  const questRows = state.diary.filter((entry) => entry.type === "quest");
  const exportState = JSON.parse(JSON.stringify(state));
  delete exportState.openaiApiKey;
  const rows = state.diary.length
    ? state.diary.map((entry) => `| ${entry.title} | ${entry.body.replaceAll("|", "/")} | ${entry.result || ""} |`).join("\n")
    : "| - | - | - |";
  const payload = JSON.stringify(exportState, null, 2);
  return `# Luminara Princess Map ADV Save

- Saved at: ${new Date().toLocaleString("en-US")}
- Difficulty: ${difficultyConfig[state.difficulty].label}
- Coins: ${state.coins}
- Energy: ${state.energy}
- Vocabulary: ${state.vocab}
- Expression: ${state.expression}
- Kindness: ${state.kindness}
- Mood: ${moodLabel(state.mood)}
- Quests completed: ${questRows.length}
- Outfit: ${outfitSummary()}
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

async function saveMarkdown() {
  const markdown = buildSaveMarkdown();
  const filename = "luminara-map-adv-save.md";
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(markdown);
      await writable.close();
      elements.statusMessage.textContent = "Save complete.";
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  elements.statusMessage.textContent = "Markdown save downloaded.";
}

function loadMarkdownText(text) {
  const start = text.indexOf(saveMarkerStart);
  const end = text.indexOf(saveMarkerEnd);
  if (start === -1 || end === -1 || end <= start) throw new Error("Luminara save data block was not found.");
  const json = text.slice(start + saveMarkerStart.length, end).trim();
  state = normalizeState(JSON.parse(json));
  persist();
  elements.statusMessage.textContent = "Load complete. Progress restored.";
  render();
}

async function loadMarkdown() {
  if ("showOpenFilePicker" in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "Markdown Save", accept: { "text/markdown": [".md"], "text/plain": [".md", ".txt"] } }]
      });
      const file = await handle.getFile();
      loadMarkdownText(await file.text());
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  elements.loadFileInput.click();
}

function resetProgress() {
  state = freshState();
  persist();
  elements.statusMessage.textContent = "Progress reset. A new map quest is ready.";
  render();
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => changeView(tab.dataset.view)));
  window.addEventListener("hashchange", () => changeView(location.hash ? location.hash.slice(1) : "home"));
  elements.goMapButton.addEventListener("click", () => changeView("map"));
  elements.returnHomeButton.addEventListener("click", () => changeView("home"));
  elements.interactButton.addEventListener("click", interactNearby);
  elements.advCloseButton.addEventListener("click", closeAdv);
  elements.helpButton.addEventListener("click", showHelp);
  elements.speakPromptButton.addEventListener("click", () => speak(elements.advLine.textContent));
  elements.saveButton.addEventListener("click", saveMarkdown);
  elements.loadButton.addEventListener("click", loadMarkdown);
  elements.loadFileInput.addEventListener("change", async () => {
    const file = elements.loadFileInput.files[0];
    if (!file) return;
    try {
      loadMarkdownText(await file.text());
    } catch (error) {
      elements.statusMessage.textContent = `Load failed: ${error.message}`;
    } finally {
      elements.loadFileInput.value = "";
    }
  });
  elements.difficultySelect.addEventListener("change", () => {
    state.difficulty = Number(elements.difficultySelect.value);
    persist();
    render();
  });
  elements.speakToggleButton.addEventListener("click", () => {
    state.speechEnabled = !state.speechEnabled;
    persist();
    renderSettings();
  });
  elements.clearDiaryButton.addEventListener("click", () => {
    state.diary = [];
    persist();
    render();
  });
  elements.resetButton.addEventListener("click", resetProgress);
  elements.saveOpenAIButton.addEventListener("click", () => {
    const typedKey = elements.openaiKeyInput.value.trim();
    openAISettings = {
      orgId: elements.openaiOrgInput.value.trim(),
      apiKey: typedKey && typedKey !== "••••••••" ? typedKey : openAISettings.apiKey
    };
    persistOpenAISettings();
    renderSettings();
  });
  elements.clearOpenAIButton.addEventListener("click", () => {
    openAISettings = { orgId: "", apiKey: "" };
    localStorage.removeItem(openAISettingsKey);
    renderSettings();
  });
  elements.mapStage.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      moveOnMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      moveOnMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      moveOnMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      moveOnMap(1, 0);
    } else if ((event.key === "Enter" || event.key === " ") && activeHotspot) {
      event.preventDefault();
      interactNearby();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (!elements.advModal.classList.contains("show")) {
      if ((event.key === "g" || event.key === "G") && elements.homeView?.classList.contains("active")) {
        event.preventDefault();
        changeView("map");
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeAdv();
      return;
    }
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      event.preventDefault();
      moveAdvFocus(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      moveAdvFocus(1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!confirmAdvFocus() && advMode === "complete") closeAdv();
      return;
    }
    if (/^[1-9]$/.test(event.key) && advMode === "quest") {
      const answerButtons = [...elements.choiceList.querySelectorAll("button[data-choice]")];
      const button = answerButtons[Number(event.key) - 1];
      if (button && !button.disabled) {
        event.preventDefault();
        button.click();
      }
    }
  });
}

Object.defineProperty(window, "__luminaraTest", {
  value: {
    saveRoundtrip() {
      const before = {
        coins: state.coins,
        energy: state.energy,
        vocab: state.vocab,
        expression: state.expression,
        kindness: state.kindness,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
      };
      const markdown = buildSaveMarkdown();
      const hasMarkers = markdown.includes(saveMarkerStart) && markdown.includes(saveMarkerEnd);
      const hasNoOpenAIKey = !markdown.includes(openAISettings.apiKey || "___NO_KEY___");
      loadMarkdownText(markdown);
      const after = {
        coins: state.coins,
        energy: state.energy,
        vocab: state.vocab,
        expression: state.expression,
        kindness: state.kindness,
        difficulty: state.difficulty,
        outfit: { ...state.outfit },
        owned: [...state.owned],
        activeQuest: state.activeQuest?.id || ""
      };
      return {
        hasMarkers,
        hasNoOpenAIKey,
        roundtripSame: JSON.stringify(before) === JSON.stringify(after),
        before,
        after
      };
    }
  }
});

bindEvents();
render();
changeView(location.hash ? location.hash.slice(1) : "home");

window.LuminaraTest = {
  exportMarkdown: buildSaveMarkdown,
  importMarkdown: loadMarkdownText,
  getState: () => JSON.parse(JSON.stringify(state)),
  setDifficulty: (difficulty) => {
    if (!difficultyConfig[difficulty]) throw new Error("Unsupported difficulty");
    state.difficulty = Number(difficulty);
    persist();
    render();
  },
  moveToNode: (nodeId) => {
    if (!mapNodes[nodeId]) throw new Error("Unknown node");
    state.playerNode = nodeId;
    state.player = { x: mapNodes[nodeId].x, y: mapNodes[nodeId].y };
    persist();
    renderMap();
  },
  interact: interactNearby,
  answerCurrent: (choice) => {
    const button = [...elements.choiceList.querySelectorAll("button")].find((item) => item.dataset.choice === choice);
    if (!button) throw new Error("Choice not found");
    answerLesson(button, choice);
  },
  closeAdv,
  buy: (itemId) => buyItemInAdv(itemById(itemId))
};

function runSelfTestIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "save-load") return;
  const before = JSON.parse(JSON.stringify(state));
  const markdown = buildSaveMarkdown();
  const changedDifficulty = before.difficulty === 1000 ? 100 : 1000;
  state.difficulty = changedDifficulty;
  state.coins = 0;
  loadMarkdownText(markdown);
  const after = JSON.parse(JSON.stringify(state));
  const passed =
    markdown.includes("## Diary") &&
    markdown.includes("LUMINARA_SAVE_JSON") &&
    !markdown.includes("OPENAI_API_KEY") &&
    after.difficulty === before.difficulty &&
    after.coins === before.coins &&
    after.activeQuest.place === before.activeQuest.place &&
    Math.abs(after.player.x - before.player.x) < 0.01 &&
    Math.abs(after.player.y - before.player.y) < 0.01;
  const result = document.createElement("pre");
  result.id = "selfTestResult";
  result.textContent = JSON.stringify({
    test: "save-load",
    passed,
    markdownLength: markdown.length,
    beforeDifficulty: before.difficulty,
    afterDifficulty: after.difficulty,
    beforeCoins: before.coins,
    afterCoins: after.coins
  });
  document.body.prepend(result);
}

runSelfTestIfRequested();

function runMonkeyTestIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "monkey") return;
  const errors = [];
  const actions = [
    () => changeView(["home", "map", "diary", "settings"][Math.floor(Math.random() * 4)]),
    () => moveOnMap(1, 0),
    () => moveOnMap(-1, 0),
    () => moveOnMap(0, 1),
    () => moveOnMap(0, -1),
    () => interactNearby(),
    () => showHelp(),
    () => closeAdv(),
    () => {
      const buttons = [...elements.choiceList.querySelectorAll("button")].filter((button) => !button.disabled);
      if (buttons.length) buttons[Math.floor(Math.random() * buttons.length)].click();
    },
    () => {
      const affordable = shopItems.filter((item) => !state.owned.includes(item.id) && state.coins >= item.cost);
      if (affordable.length) buyItemInAdv(affordable[Math.floor(Math.random() * affordable.length)]);
    },
    () => {
      const owned = shopItems.filter((item) => state.owned.includes(item.id));
      if (owned.length) toggleEquip(owned[Math.floor(Math.random() * owned.length)]);
    }
  ];

  for (let index = 0; index < 300; index += 1) {
    try {
      actions[Math.floor(Math.random() * actions.length)]();
      if (state.coins < 0) errors.push("coins below zero");
      if (!state.player || !isWalkable(state.player.x, state.player.y)) errors.push("invalid player position");
      if (!state.activeQuest || !hotspotById(state.activeQuest.place)) errors.push("invalid active quest");
      Object.entries(state.outfit).forEach(([slot, itemId]) => {
        if (itemId !== "none" && !state.owned.includes(itemId)) errors.push(`unowned equipped ${slot}:${itemId}`);
      });
      if ($$(".view.active").length !== 1) errors.push("active view count is not one");
    } catch (error) {
      errors.push(error.message);
    }
  }
  closeAdv();
  changeView("home");
  const result = document.createElement("pre");
  result.id = "monkeyTestResult";
  result.textContent = JSON.stringify({
    test: "monkey",
    passed: errors.length === 0,
    steps: 300,
    errors: [...new Set(errors)].slice(0, 10),
    coins: state.coins,
    playerNode: state.playerNode,
    activeQuest: state.activeQuest?.place,
    activeViews: $$(".view.active").length
  });
  document.body.prepend(result);
}

runMonkeyTestIfRequested();
