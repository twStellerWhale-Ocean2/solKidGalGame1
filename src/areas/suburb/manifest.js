import { makeLessons, makeQuestTemplates } from "../lesson-helpers.js";

const npcImage = (name) => `assets/areas/suburb/characters/${name}.webp?v=20260605-npc-r2`;

export const suburbVocabularyProfile = Object.freeze({
  id: "cambridge-a1-movers",
  label: "Cambridge A1 Movers",
  levelLabel: "Cambridge Movers",
  rewardCoins: 500,
  note: "Suburb production places use practical Movers-style resource words."
});

const reward = { coins: 500, vocab: 2, expression: 2, kindness: 1 };
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });
const moversQuestions = ({ object, place, worker, material, action, adjective }) => [
  q(`Pick the best sentence for the ${place}.`, `The ${worker} is carrying ${material}.`, [`The ${worker} is carrying ${material}.`, `The ${worker} is carrying clouds.`, `The castle is carrying ${material}.`, `The river is reading a book.`], ["carrying", material, worker]),
  q(`Pick the sentence about the ${object}.`, `The ${object} is ready before lunch.`, [`The ${object} is ready before lunch.`, `The ${object} is sleeping under lunch.`, `The ${object} can wear a ribbon.`, `The ${object} is afraid of bread.`], [object, "ready", "before", "lunch"]),
  q(`Pick what Lumi asks politely.`, `Could I help you ${action}?`, [`Could I help you ${action}?`, `Could I eat your road?`, `Could the ${object} fly home?`, `Could you put soup in the map?`], ["could", "help", action]),
  q(`Pick the useful description.`, `This ${place} is ${adjective} and busy.`, [`This ${place} is ${adjective} and busy.`, `This ${place} is sleepy and wet inside.`, `My shoe is ${adjective} and busy.`, `The moon works at the ${place}.`], ["this", place, adjective, "busy"]),
  q(`Pick the safe work sentence.`, `We should work slowly and carefully.`, ["We should work slowly and carefully.", "We should run quickly with tools.", `We should hide the ${material}.`, "We should shout at the animals."], ["should", "work", "slowly", "carefully"])
];

const suburbLessonPlaces = [
  { id: "mine", theme: "mining", title: "Help at the Mine", opening: "Miner Gemma checks the sparkling mine carts.", ending: "The bright stones are sorted safely.", questions: moversQuestions({ object: "cart", place: "mine", worker: "miner", material: "stones", action: "sort stones", adjective: "rocky" }) },
  { id: "loggingCamp", theme: "logging", title: "Help at the Logging Camp", opening: "Logger Rowan stacks clean wood beside the cabin.", ending: "The logs are stacked neatly.", questions: moversQuestions({ object: "log", place: "camp", worker: "logger", material: "wood", action: "stack wood", adjective: "quiet" }) },
  { id: "fishingShore", theme: "fishing", title: "Help at the Fishing Shore", opening: "Fisher Nami pulls a net near the shore.", ending: "The small fish are counted carefully.", questions: moversQuestions({ object: "net", place: "shore", worker: "fisher", material: "fish", action: "pull the net", adjective: "windy" }) },
  { id: "pasture", theme: "pasture", title: "Help at the Pasture", opening: "Farmer Theo counts sheep and cows.", ending: "The animals are calm in the pasture.", questions: moversQuestions({ object: "sheep", place: "pasture", worker: "farmer", material: "hay", action: "feed the animals", adjective: "green" }) },
  { id: "farm", theme: "farm fields", title: "Help at the Farm", opening: "Auntie Pom waters the vegetables.", ending: "The farm rows look healthy.", questions: moversQuestions({ object: "field", place: "farm", worker: "farmer", material: "vegetables", action: "water the field", adjective: "sunny" }) },
  { id: "mill", theme: "windmill", title: "Help at the Mill", opening: "Miller Bell carries flour sacks by the windmill.", ending: "The flour sacks are ready for bread.", questions: moversQuestions({ object: "sack", place: "mill", worker: "miller", material: "flour", action: "carry flour", adjective: "windy" }) },
  { id: "villageHome", theme: "village home", title: "Help at the Village Home", opening: "Grandma Fina sets a basket on the porch.", ending: "The home feels warm and tidy.", questions: moversQuestions({ object: "basket", place: "home", worker: "grandma", material: "fruit", action: "tidy the porch", adjective: "warm" }) }
];

export const suburbArea = Object.freeze({
  id: "suburb",
  label: "Suburb",
  view: "map",
  mapImage: "assets/areas/suburb-map.png?v=20260603-region-vocab",
  imageSize: { width: 1536, height: 1024 },
  vocabularyProfile: suburbVocabularyProfile,
  nodes: {
    suburbEntrance: { id: "suburbEntrance", label: "Kingdom Road", x: 19, y: 22, links: ["pasture", "farm"] },
    mine: { id: "mine", label: "Mine", x: 77, y: 26, links: ["loggingCamp", "fishingShore", "suburbEntrance"] },
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 76, y: 66, links: ["mine", "fishingShore", "mill", "fieldCobbler"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 50, y: 86, links: ["loggingCamp", "farm", "mine", "fieldCobbler"] },
    pasture: { id: "pasture", label: "Pasture", x: 22, y: 28, links: ["suburbEntrance", "farm", "mill", "workwearStall"] },
    farm: { id: "farm", label: "Farm", x: 26, y: 62, links: ["pasture", "mill", "villageHome", "fishingShore", "workwearStall"] },
    mill: { id: "mill", label: "Mill", x: 40, y: 57, links: ["farm", "pasture", "loggingCamp", "villageHome", "workwearStall"] },
    workwearStall: { id: "workwearStall", label: "Workwear Stall", x: 33, y: 44, links: ["pasture", "farm", "mill"] },
    fieldCobbler: { id: "fieldCobbler", label: "Field Cobbler", x: 62, y: 70, links: ["fishingShore", "loggingCamp", "mine"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 19, y: 82, links: ["farm", "mill"] }
  },
  locations: [
    { id: "suburbExit", area: "suburb", node: "suburbEntrance", label: "Kingdom Road", icon: "↩", npcClass: "npc-none", npc: "Suburb Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The road returns to the kingdom town." },
    { id: "mine", area: "suburb", node: "mine", label: "Mine", icon: "⛏", npc: "Miner Gemma", scene: "scene-suburb-mine", npcImage: npcImage("miner-gemma"), hint: "The mine has bright stones and cart tracks." },
    { id: "loggingCamp", area: "suburb", node: "loggingCamp", label: "Logging Camp", icon: "🪵", npc: "Logger Rowan", scene: "scene-suburb-logging", npcImage: npcImage("logger-rowan"), hint: "The logging camp stacks wood for safe building." },
    { id: "fishingShore", area: "suburb", node: "fishingShore", label: "Fishing Shore", icon: "🎣", npc: "Fisher Nami", scene: "scene-suburb-fishing", npcImage: npcImage("fisher-nami"), hint: "The shore has nets, boats, and small fish." },
    { id: "pasture", area: "suburb", node: "pasture", label: "Pasture", icon: "🐄", npc: "Farmer Theo", scene: "scene-suburb-pasture", npcImage: npcImage("farmer-theo"), hint: "The pasture has sheep, cows, and hay." },
    { id: "farm", area: "suburb", node: "farm", label: "Farm", icon: "🥕", npc: "Auntie Pom", scene: "scene-suburb-farm", npcImage: npcImage("auntie-pom"), hint: "The farm fields grow vegetables and wheat." },
    { id: "mill", area: "suburb", node: "mill", label: "Mill", icon: "🌬", npc: "Miller Bell", scene: "scene-suburb-mill", npcImage: npcImage("miller-bell"), hint: "The windmill turns grain into flour." },
    { id: "workwearStall", area: "suburb", node: "workwearStall", label: "Workwear Stall", icon: "👚", npc: "Workwear Keeper", scene: "scene-suburb-workwear-stall", npcImage: npcImage("workwear-stall-keeper"), kind: "shop", shopCategories: ["tops", "bottoms"], defaultCategory: "tops", hint: "The Workwear Stall sells sturdy tops and bottoms." },
    { id: "fieldCobbler", area: "suburb", node: "fieldCobbler", label: "Field Cobbler", icon: "👞", npc: "Field Cobbler", scene: "scene-suburb-field-cobbler", npcImage: npcImage("field-cobbler"), kind: "shop", shopCategories: ["shoes", "hats"], defaultCategory: "shoes", hint: "The Field Cobbler sells shoes and hats for country roads." },
    { id: "villageHome", area: "suburb", node: "villageHome", label: "Village Home", icon: "🏡", npc: "Grandma Fina", scene: "scene-suburb-home", npcImage: npcImage("grandma-fina"), hint: "The village home has a warm porch and garden." }
  ],
  actors: [
    { id: "suburb-river-glow", type: "water", x: 50, y: 82, w: 22, h: 12, z: 1, phase: 0.5 },
    { id: "suburb-mill-glow", type: "glow", x: 40, y: 57, w: 8, h: 8, z: 2, phase: 1.2 }
  ],
  defaultNode: "suburbEntrance",
  enabled: true
});

export const suburbSceneConfigs = Object.freeze({
  suburbExit: { scene: "scene-suburb-farm", npcClass: "npc-none", npc: "Suburb Sign", travelAction: "Back to Kingdom", travelLine: "The road returns to the kingdom town." },
  mine: { scene: "scene-suburb-mine", npc: "Miner Gemma", npcImage: npcImage("miner-gemma"), travelAction: "Visit", travelLine: "Miner Gemma is sorting shiny stones." },
  loggingCamp: { scene: "scene-suburb-logging", npc: "Logger Rowan", npcImage: npcImage("logger-rowan"), travelAction: "Visit", travelLine: "Logger Rowan stacks logs beside the cabin." },
  fishingShore: { scene: "scene-suburb-fishing", npc: "Fisher Nami", npcImage: npcImage("fisher-nami"), travelAction: "Visit", travelLine: "Fisher Nami pulls a net near the bright shore." },
  pasture: { scene: "scene-suburb-pasture", npc: "Farmer Theo", npcImage: npcImage("farmer-theo"), travelAction: "Visit", travelLine: "Farmer Theo counts animals in the pasture." },
  farm: { scene: "scene-suburb-farm", npc: "Auntie Pom", npcImage: npcImage("auntie-pom"), travelAction: "Visit", travelLine: "Auntie Pom waters vegetables and wheat." },
  mill: { scene: "scene-suburb-mill", npc: "Miller Bell", npcImage: npcImage("miller-bell"), travelAction: "Visit", travelLine: "Miller Bell carries flour by the windmill." },
  workwearStall: { scene: "scene-suburb-workwear-stall", npc: "Workwear Keeper", npcImage: npcImage("workwear-stall-keeper"), travelAction: "Shop", travelLine: "The Workwear Keeper has sturdy tops and bottoms.", shopGreeting: "Welcome to the Workwear Stall. Pick tops or bottoms." },
  fieldCobbler: { scene: "scene-suburb-field-cobbler", npc: "Field Cobbler", npcImage: npcImage("field-cobbler"), travelAction: "Shop", travelLine: "The Field Cobbler has shoes and hats for country roads.", shopGreeting: "Welcome to the Field Cobbler. Pick shoes or hats." },
  villageHome: { scene: "scene-suburb-home", npc: "Grandma Fina", npcImage: npcImage("grandma-fina"), travelAction: "Visit", travelLine: "Grandma Fina tidies the warm village porch." }
});

export const suburbQuestTemplates = makeQuestTemplates(suburbLessonPlaces);
export const suburbLessons = makeLessons("suburb", suburbVocabularyProfile, suburbLessonPlaces);
