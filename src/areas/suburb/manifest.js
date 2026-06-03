import { makeLessons, makeQuestTemplates } from "../lesson-helpers.js";

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
    loggingCamp: { id: "loggingCamp", label: "Logging Camp", x: 76, y: 66, links: ["mine", "fishingShore", "mill"] },
    fishingShore: { id: "fishingShore", label: "Fishing Shore", x: 50, y: 86, links: ["loggingCamp", "farm", "mine"] },
    pasture: { id: "pasture", label: "Pasture", x: 22, y: 28, links: ["suburbEntrance", "farm", "mill"] },
    farm: { id: "farm", label: "Farm", x: 26, y: 62, links: ["pasture", "mill", "villageHome", "fishingShore"] },
    mill: { id: "mill", label: "Mill", x: 40, y: 57, links: ["farm", "pasture", "loggingCamp", "villageHome"] },
    villageHome: { id: "villageHome", label: "Village Home", x: 19, y: 82, links: ["farm", "mill"] }
  },
  locations: [
    { id: "suburbExit", area: "suburb", node: "suburbEntrance", label: "Kingdom Road", icon: "↩", npcClass: "npc-none", npc: "Suburb Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The road returns to the kingdom town." },
    { id: "mine", area: "suburb", node: "mine", label: "Mine", icon: "⛏", npcClass: "npc-none", npc: "Miner Gemma", scene: "scene-suburb-mine", hint: "The mine has bright stones and cart tracks." },
    { id: "loggingCamp", area: "suburb", node: "loggingCamp", label: "Logging Camp", icon: "🪵", npcClass: "npc-none", npc: "Logger Rowan", scene: "scene-suburb-logging", hint: "The logging camp stacks wood for safe building." },
    { id: "fishingShore", area: "suburb", node: "fishingShore", label: "Fishing Shore", icon: "🎣", npcClass: "npc-none", npc: "Fisher Nami", scene: "scene-suburb-fishing", hint: "The shore has nets, boats, and small fish." },
    { id: "pasture", area: "suburb", node: "pasture", label: "Pasture", icon: "🐄", npcClass: "npc-none", npc: "Farmer Theo", scene: "scene-suburb-pasture", hint: "The pasture has sheep, cows, and hay." },
    { id: "farm", area: "suburb", node: "farm", label: "Farm", icon: "🥕", npcClass: "npc-none", npc: "Auntie Pom", scene: "scene-suburb-farm", hint: "The farm fields grow vegetables and wheat." },
    { id: "mill", area: "suburb", node: "mill", label: "Mill", icon: "🌬", npcClass: "npc-none", npc: "Miller Bell", scene: "scene-suburb-mill", hint: "The windmill turns grain into flour." },
    { id: "villageHome", area: "suburb", node: "villageHome", label: "Village Home", icon: "🏡", npcClass: "npc-none", npc: "Grandma Fina", scene: "scene-suburb-home", hint: "The village home has a warm porch and garden." }
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
  mine: { scene: "scene-suburb-mine", npcClass: "npc-none", npc: "Miner Gemma", travelAction: "Visit", travelLine: "Miner Gemma is sorting shiny stones." },
  loggingCamp: { scene: "scene-suburb-logging", npcClass: "npc-none", npc: "Logger Rowan", travelAction: "Visit", travelLine: "Logger Rowan stacks logs beside the cabin." },
  fishingShore: { scene: "scene-suburb-fishing", npcClass: "npc-none", npc: "Fisher Nami", travelAction: "Visit", travelLine: "Fisher Nami pulls a net near the bright shore." },
  pasture: { scene: "scene-suburb-pasture", npcClass: "npc-none", npc: "Farmer Theo", travelAction: "Visit", travelLine: "Farmer Theo counts animals in the pasture." },
  farm: { scene: "scene-suburb-farm", npcClass: "npc-none", npc: "Auntie Pom", travelAction: "Visit", travelLine: "Auntie Pom waters vegetables and wheat." },
  mill: { scene: "scene-suburb-mill", npcClass: "npc-none", npc: "Miller Bell", travelAction: "Visit", travelLine: "Miller Bell carries flour by the windmill." },
  villageHome: { scene: "scene-suburb-home", npcClass: "npc-none", npc: "Grandma Fina", travelAction: "Visit", travelLine: "Grandma Fina tidies the warm village porch." }
});

export const suburbQuestTemplates = makeQuestTemplates(suburbLessonPlaces);
export const suburbLessons = makeLessons("suburb", suburbVocabularyProfile, suburbLessonPlaces);
