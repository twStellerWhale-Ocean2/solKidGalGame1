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
  { id: "outfit", label: "Dresses" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
  { id: "room", label: "Room Treasures" }
];

const shopItems = [
  { id: "pinkDress", type: "outfit", name: "Pink academy dress", cost: 0, icon: "👗", colors: ["#f6a1bf", "#ffd8e8"], shape: "dress-ball", sprite: "0%", image: "assets/items/pinkDress.png" },
  { id: "blueDress", type: "outfit", name: "Blue harbor dress", cost: 100, icon: "👗", colors: ["#82b9dc", "#d8f0ff"], shape: "dress-sailor", sprite: "33.333%", image: "assets/items/blueDress.png" },
  { id: "roseDress", type: "outfit", name: "Rose festival dress", cost: 200, icon: "👗", colors: ["#cf5d89", "#ffc1d7"], shape: "dress-rose", sprite: "66.666%", image: "assets/items/roseDress.png" },
  { id: "snowDress", type: "outfit", name: "Snowflake gown", cost: 260, icon: "👗", colors: ["#bde9ff", "#ffffff"], shape: "dress-snow", sprite: "100%", image: "assets/items/snowDress.png" },
  { id: "pinkSlippers", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "👞", colors: ["#f19ab7", "#ffe1ec"], shape: "shoes-round", image: "assets/items/pinkSlippers.png" },
  { id: "blueBoots", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "🥾", colors: ["#4b668c", "#b7d8f2"], shape: "shoes-boots", image: "assets/items/blueBoots.png" },
  { id: "goldCrown", type: "accessory", name: "Tiny gold crown", cost: 140, icon: "👑", colors: ["#d7a64b", "#fff2a6"], shape: "crown", image: "assets/items/goldCrown.png" },
  { id: "silkRibbon", type: "accessory", name: "Silk party ribbon", cost: 120, icon: "🎀", colors: ["#c98dd6", "#ffe4fb"], shape: "ribbon", image: "assets/items/silkRibbon.png" },
  { id: "pearlBag", type: "accessory", name: "Pearl shell bag", cost: 170, icon: "👜", colors: ["#fff0f5", "#d7a64b"], shape: "bag", image: "assets/items/pearlBag.png" },
  { id: "starCape", type: "accessory", name: "Starry helper cape", cost: 240, icon: "✨", colors: ["#5b6fa6", "#d9e4ff"], shape: "cape", image: "assets/items/starCape.png" },
  { id: "studyDesk", type: "room", name: "New study desk", cost: 180, icon: "🪑", colors: ["#b98963", "#f2c083"], shape: "desk", image: "assets/items/studyDesk.png" },
  { id: "seaLamp", type: "room", name: "Sea glass lamp", cost: 220, icon: "💡", colors: ["#70bfc9", "#e0fbff"], shape: "lamp", image: "assets/items/seaLamp.png" }
];

const hotspots = [
  { id: "luminaraCastle", node: "castleRoom", label: "Luminara Castle", icon: "🏰", npcClass: "npc-none", npc: "Gate Guard", kind: "gate", targetArea: "castle", hint: "Climb the purple castle stairway back inside." },
  { id: "port", node: "port", label: "Harbor Port", icon: "⚓", npcClass: "npc-none", npc: "Dock Guide", scene: "scene-harbor", hint: "The docks are ready for boats and sea trips." },
  { id: "garden", node: "garden", label: "Castle Garden", icon: "🌷", npcClass: "npc-garden", npc: "Mira", scene: "scene-garden", hint: "The garden is quiet. A small cat may be hiding near the roses." },
  { id: "market", node: "market", label: "Market Square", icon: "🥖", npcClass: "npc-market", npc: "Auntie Pom", scene: "scene-market", kind: "shop", shopCategories: ["room"], defaultCategory: "room", hint: "The bakery smells sweet. Auntie Pom also has room treasures." },
  { id: "harbor", node: "harbor", label: "Fish Shop", icon: "🐟", npcClass: "npc-harbor", npc: "Nami", scene: "scene-harbor", hint: "The fish shop has fresh fish for dinner." },
  { id: "boutique", node: "boutique", label: "Dress Boutique", icon: "👗", npcClass: "npc-boutique", npc: "Rena", scene: "scene-boutique", kind: "shop", shopCategories: ["outfit"], defaultCategory: "outfit", hint: "Rena's boutique has dresses for doll play." },
  { id: "shoeShop", node: "shoeShop", label: "Shoe Shop", icon: "👞", npcClass: "npc-shoes", npc: "Mina", scene: "scene-shoes", kind: "shop", shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina shows shoes for long walks." },
  { id: "accessoryShop", node: "accessoryShop", label: "Accessory Shop", icon: "🎀", npcClass: "npc-accessory", npc: "Lili", scene: "scene-accessory", kind: "shop", shopCategories: ["accessory"], defaultCategory: "accessory", hint: "Lili sells crowns, ribbons, bags, and capes." },
  { id: "farm", node: "farm", label: "Sunny Farm", icon: "🐄", npcClass: "npc-farm", npc: "Theo", scene: "scene-farm", hint: "The farm is busy. Theo is brushing the big cow." },
  { id: "lighthouse", node: "lighthouse", label: "Lighthouse", icon: "🗼", npcClass: "npc-lighthouse", npc: "Captain Sol", scene: "scene-lighthouse", hint: "The lighthouse watches the sea before ships sail." }
];

const sceneConfigs = {
  castleRoom: { scene: "scene-garden", npcClass: "npc-garden", npc: "Lumi", travelAction: "Room", travelLine: "Return to Lumi's room for dress-up time." },
  princessRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for dress-up and room treasures." },
  kingRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The king's room is reserved for a later story." },
  queenRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The queen's room will open in a later chapter." },
  castleGate: { scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "Travel", travelLine: "The castle gate leads back to the kingdom map." },
  garden: { scene: "scene-garden", npcClass: "npc-garden", npc: "Mira", travelAction: "Visit", travelLine: "Mira is watching the roses and a shy garden cat." },
  market: { scene: "scene-market", npcClass: "npc-market", npc: "Auntie Pom", travelAction: "Shop", travelLine: "Auntie Pom has warm bread and cozy room treasures.", shopGreeting: "Auntie Pom has cozy treasures for Lumi's room." },
  harbor: { scene: "scene-harbor", npcClass: "npc-harbor", npc: "Nami", travelAction: "Visit", travelLine: "Nami is waiting by the bright harbor boats." },
  port: { scene: "scene-harbor", npcClass: "npc-none", npc: "Dock Guide", travelAction: "Visit", travelLine: "Boats arrive at the harbor port for sea trips and dock visits." },
  boutique: { scene: "scene-boutique", npcClass: "npc-boutique", npc: "Rena", travelAction: "Shop", travelLine: "Rena has dresses ready for a bright day.", shopGreeting: "Welcome, Princess. Outfits are ready for a bright day." },
  shoeShop: { scene: "scene-shoes", npcClass: "npc-shoes", npc: "Mina", travelAction: "Shop", travelLine: "Mina has walking shoes for Lumi's next trip.", shopGreeting: "Hello, Princess. Try shoes for the road." },
  accessoryShop: { scene: "scene-accessory", npcClass: "npc-accessory", npc: "Lili", travelAction: "Shop", travelLine: "Lili has ribbons, crowns, bags, and capes.", shopGreeting: "Good day, Princess. Pick a ribbon, crown, bag, or cape." },
  farm: { scene: "scene-farm", npcClass: "npc-farm", npc: "Theo", travelAction: "Visit", travelLine: "Theo is caring for the animals at Sunny Farm." },
  lighthouse: { scene: "scene-lighthouse", npcClass: "npc-lighthouse", npc: "Captain Sol", travelAction: "Visit", travelLine: "Captain Sol checks the sea from the lighthouse." }
};

const mapNodes = {
  castleRoom: { id: "castleRoom", label: "Castle Stairway", x: 49.4, y: 37.4, links: ["garden", "market", "farm"] },
  garden: { id: "garden", label: "Castle Garden", x: 49.7, y: 52.8, links: ["castleRoom", "market"] },
  market: { id: "market", label: "Market Square", x: 28.0, y: 61.6, links: ["garden", "boutique", "shoeShop", "harbor", "port"] },
  boutique: { id: "boutique", label: "Dress Boutique", x: 64.0, y: 59.0, links: ["market", "shoeShop", "accessoryShop", "farm"] },
  shoeShop: { id: "shoeShop", label: "Shoe Shop", x: 67.5, y: 65.0, links: ["market", "harbor", "boutique"] },
  accessoryShop: { id: "accessoryShop", label: "Accessory Shop", x: 74.2, y: 61.1, links: ["boutique", "farm"] },
  farm: { id: "farm", label: "Sunny Farm", x: 87.0, y: 19.8, links: ["castleRoom", "accessoryShop", "boutique"] },
  harbor: { id: "harbor", label: "Fish Shop", x: 35.6, y: 63.0, links: ["market", "shoeShop", "port"] },
  port: { id: "port", label: "Harbor Port", x: 40.8, y: 87.6, links: ["market", "harbor", "lighthouse"] },
  lighthouse: { id: "lighthouse", label: "Lighthouse", x: 77.3, y: 78.2, links: ["port"] }
};

const mapImageSize = { width: 1672, height: 941 };

const mapActors = [
  { id: "river-flow", type: "water", src: "assets/map-layers/river-flow.png", x: 14.6, y: 29.5, w: 11.5, h: 39.0, z: 2, phase: 0.3 },
  { id: "harbor-flow", type: "water", src: "assets/map-layers/harbor-flow.png", x: 41.5, y: 86.8, w: 33.5, h: 23.6, z: 2, phase: 1.1 },
  { id: "ocean-flow", type: "water", src: "assets/map-layers/ocean-flow.png", x: 91.2, y: 56.5, w: 19.0, h: 48.0, z: 2, phase: 1.8 },
  { id: "harbor-ship-large", type: "ship", src: "assets/map-layers/harbor-ship-large.png", x: 42.7, y: 89.0, w: 14.8, h: 14.0, z: 3, phase: 0.2 },
  { id: "harbor-ship-small", type: "ship", src: "assets/map-layers/harbor-ship-small.png", x: 31.2, y: 91.2, w: 4.6, h: 7.1, z: 3, phase: 1.4 },
  { id: "lighthouse-boat", type: "ship", src: "assets/map-layers/lighthouse-boat.png", x: 55.6, y: 92.7, w: 4.8, h: 7.1, z: 3, phase: 2.0 },
  { id: "castle-flag", type: "flag", src: "assets/map-layers/castle-flag.png", x: 49.7, y: 3.4, w: 3.4, h: 5.1, anchorX: 0.5, anchorY: 0.95, z: 6 },
  { id: "farm-windmill", type: "windmill", src: "assets/map-layers/windmill-blades.png", x: 89.5, y: 20.4, w: 4.8, h: 8.6, z: 4 },
  { id: "lighthouse-glow", type: "glow", x: 78.7, y: 75.4, w: 12, h: 12, z: 1 },
  { id: "sea-bird-a", type: "bird", x: 42.8, y: 86.5, w: 3.4, h: 1.5, z: 5, phase: 0.4 },
  { id: "sea-bird-b", type: "bird", x: 65.0, y: 84.6, w: 3.0, h: 1.3, z: 5, phase: 1.6 }
];

const castleMapImageSize = { width: 1312, height: 1199 };

const castleMapNodes = {
  princessRoom: { id: "princessRoom", label: "Princess Room", x: 40.7, y: 56.5 },
  kingRoom: { id: "kingRoom", label: "King Room", x: 50.2, y: 31.5 },
  queenRoom: { id: "queenRoom", label: "Queen Room", x: 30.2, y: 52.8 },
  castleGate: { id: "castleGate", label: "Castle Gate", x: 40.7, y: 79.8 }
};

const castleHotspots = [
  { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for dress-up, shoes, accessories, and room treasures." },
  { id: "kingRoom", area: "castle", node: "kingRoom", label: "King Room", icon: "👑", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The king's room is reserved for a future story." },
  { id: "queenRoom", area: "castle", node: "queenRoom", label: "Queen Room", icon: "💐", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The queen's room will open in a future chapter." },
  { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", targetArea: "kingdom", hint: "Go out to the kingdom travel map." }
];

const areaRegistry = {
  castle: {
    id: "castle",
    label: "Castle",
    view: "home",
    mapImage: "assets/castle-map2.png?v=20260531-stair-map",
    imageSize: castleMapImageSize,
    locations: castleHotspots,
    nodes: castleMapNodes,
    defaultNode: "princessRoom",
    enabled: true
  },
  kingdom: {
    id: "kingdom",
    label: "Kingdom",
    view: "map",
    mapImage: "assets/kingdom-map2.png?v=20260531-stair-map",
    imageSize: mapImageSize,
    locations: hotspots,
    nodes: mapNodes,
    defaultNode: "garden",
    enabled: true
  },
  forest: {
    id: "forest",
    label: "Forest",
    enabled: false,
    defaultNode: ""
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    enabled: false,
    defaultNode: ""
  }
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
  outfit: { outfit: "pinkDress", shoes: "none", accessory: "none", room: "none" },
  diary: [],
  completedLessons: [],
  metNpcs: [],
  learnedWords: [],
  badges: [],
  activeQuest: null,
  area: "castle",
  player: { x: 51.5, y: 50 },
  playerNode: "princessRoom"
};

let state = loadLocalState();
let openAISettings = loadOpenAISettings();
let activeHotspot = null;
let activeLesson = null;
let advMode = "closed";
let shopCategory = "outfit";
let activeShopHotspot = null;
let wardrobeCategory = "outfit";
let princessExpression = "normal";
let npcExpression = "normal";
let advFocusIndex = 0;
let mapLifeFrame = null;
let shopPreviewItemId = "";
const mapZoomLimits = { min: 1, max: 2.2, mobileBaseScale: 1.06 };
const areaMapViewports = {
  castle: { pan: { x: 0, y: 0 }, zoom: 1 },
  kingdom: { pan: { x: 0, y: 0 }, zoom: 1 }
};
const centerMapOnNextRender = { castle: true, kingdom: true };
let mapGesture = null;
let pendingMapPositionFrame = 0;
let pendingMapRefreshArea = "";
let systemMenuPanel = "diary";
let activeCastleHotspot = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  tabs: $$(".tab-button"),
  views: $$(".view"),
  homeView: $("#homeView"),
  saveButton: $("#saveButton"),
  loadButton: $("#loadButton"),
  loadFileInput: $("#loadFileInput"),
  systemMenuButton: $("#systemMenuButton"),
  systemMenu: $("#systemMenu"),
  systemMenuBook: $(".system-menu-book"),
  systemMenuClose: $("#systemMenuClose"),
  systemMenuTabs: $$(".system-menu-tab"),
  systemPanels: $$(".system-panel"),
  coinValue: $("#coinValue"),
  energyValue: $("#energyValue"),
  levelValue: $("#levelValue"),
  outfitSummary: $("#outfitSummary"),
  statusMessage: $("#statusMessage"),
  goMapButton: $("#goMapButton"),
  wardrobeCount: $("#wardrobeCount"),
  wardrobeTabs: $("#wardrobeTabs"),
  wardrobeGrid: $("#wardrobeGrid"),
  areaNav: $("#areaNav"),
  castleStage: $("#castleStage"),
  castlePlayerToken: $("#castlePlayerToken"),
  castleMarkerLayer: $("#castleMarkerLayer"),
  mapStage: $("#mapStage"),
  mapImage: $("#mapImage"),
  playerToken: $("#playerToken"),
  hotspotLayer: $("#hotspotLayer"),
  nodeLayer: $("#nodeLayer"),
  routeLayer: $("#routeLayer"),
  mapLifeLayer: $("#mapLifeLayer"),
  destinationPanel: $("#destinationPanel"),
  destinationHint: $("#destinationHint"),
  destinationList: $("#destinationList"),
  returnHomeButton: $("#returnHomeButton"),
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
  speakPromptButton: $("#speakPromptButton"),
  helpButton: $("#helpButton"),
  collectionSummary: $("#collectionSummary"),
  diaryList: $("#diaryList"),
  clearDiaryButton: $("#clearDiaryButton"),
  difficultySelect: $("#difficultySelect"),
  speakToggleButton: $("#speakToggleButton"),
  resetButton: $("#resetButton"),
  openaiSettingsForm: $("#openaiSettingsForm"),
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

function nodeMapForArea(areaId) {
  return areaRegistry[areaId]?.nodes || mapNodes;
}

function normalizePlayer(player, nodeId, areaId = "kingdom") {
  if (player && typeof player.x === "number" && typeof player.y === "number") {
    return { x: clamp(player.x, 6, 94), y: clamp(player.y, 8, 92) };
  }
  const nodes = nodeMapForArea(areaId);
  const node = nodes[nodeId] || nodes[areaRegistry[areaId]?.defaultNode] || mapNodes.garden;
  return { x: node.x, y: node.y };
}

function closestNodeFromLegacy(player, areaId = "kingdom") {
  const nodes = nodeMapForArea(areaId);
  const defaultNode = areaRegistry[areaId]?.defaultNode || "garden";
  if (!player || typeof player.x !== "number") return defaultNode;
  let best = defaultNode;
  let bestDistance = Infinity;
  Object.values(nodes).forEach((node) => {
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

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hotspotById(id) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.id === id);
}

function sceneConfigFor(hotspot) {
  if (!hotspot) return {};
  return { ...hotspot, ...(sceneConfigs[hotspot.id] || {}) };
}

function hotspotByNode(nodeId) {
  return [...castleHotspots, ...hotspots].find((hotspot) => hotspot.node === nodeId) || null;
}

function itemById(id) {
  return shopItems.find((item) => item.id === id) || null;
}

function createRandomQuest(previousPlace) {
  const available = questTemplates.filter((quest) => quest.place !== previousPlace);
  const pool = available.length ? available : questTemplates;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return createQuestFromTemplate(template);
}

function createQuestForPlace(place) {
  const template = questTemplates.find((quest) => quest.place === place) || questTemplates[0];
  return createQuestFromTemplate(template);
}

function createQuestFromTemplate(template) {
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

function areaForHotspot(hotspot) {
  if (!hotspot) return state.area || "kingdom";
  if (hotspot.area) return hotspot.area;
  if (castleMapNodes[hotspot.node]) return "castle";
  return "kingdom";
}

function ensureKingdomPosition() {
  if (mapNodes[state.playerNode]) return;
  const target = hotspotById(state.activeQuest?.place) || hotspotById(areaRegistry.kingdom.defaultNode);
  const node = mapNodes[target?.node] || mapNodes[areaRegistry.kingdom.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function ensureCastlePosition() {
  if (castleMapNodes[state.playerNode]) return;
  const node = castleMapNodes[areaRegistry.castle.defaultNode];
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
}

function openArea(areaId) {
  const area = areaRegistry[areaId];
  if (!area?.enabled) {
    elements.statusMessage.textContent = `${area?.label || "This area"} is not open yet.`;
    return;
  }
  state.area = areaId;
  if (areaId === "kingdom") {
    ensureKingdomPosition();
  } else if (areaId === "castle") {
    ensureCastlePosition();
  }
  centerMapOnNextRender[areaId] = true;
  persist();
  changeView(area.view);
  renderAreaNav();
}

function changeView(viewName) {
  if (["diary", "settings", "save"].includes(viewName)) {
    openSystemMenu(viewName);
    return;
  }
  if (!document.getElementById(`${viewName}View`)) viewName = "home";
  if (viewName === "home") {
    state.area = "castle";
    ensureCastlePosition();
  } else if (viewName === "map") {
    state.area = "kingdom";
    ensureKingdomPosition();
  }
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  if (location.hash.slice(1) !== viewName) {
    history.replaceState(null, "", `#${viewName}`);
  }
  if (viewName === "map") {
    setTimeout(() => {
      renderMap();
      elements.mapStage.focus({ preventScroll: true });
    }, 0);
  } else if (viewName === "home") {
    setTimeout(() => {
      renderCastleMap();
      elements.castleStage?.focus({ preventScroll: true });
    }, 0);
  }
  renderAreaNav();
}

function activeViewName() {
  const active = elements.views.find((view) => view.classList.contains("active"));
  return active?.id?.replace(/View$/, "") || "home";
}

function isSystemMenuOpen() {
  return elements.systemMenu?.classList.contains("show");
}

function openSystemMenu(panel = "diary") {
  changeSystemPanel(panel);
  elements.systemMenu.classList.add("show");
  elements.systemMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("system-menu-open");
  if (location.hash.slice(1) !== panel) history.replaceState(null, "", `#${panel}`);
  setTimeout(() => {
    elements.systemMenuBook?.focus({ preventScroll: true });
  }, 0);
}

function closeSystemMenu() {
  if (!isSystemMenuOpen()) return;
  elements.systemMenu.classList.remove("show");
  elements.systemMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("system-menu-open");
  const viewName = activeViewName();
  if (["diary", "settings", "save"].includes(location.hash.slice(1))) {
    history.replaceState(null, "", `#${viewName}`);
  }
  elements.systemMenuButton?.focus({ preventScroll: true });
}

function changeSystemPanel(panel = "diary") {
  if (!["diary", "settings", "save"].includes(panel)) panel = "diary";
  systemMenuPanel = panel;
  elements.systemMenuTabs.forEach((tab) => {
    const isActive = tab.dataset.menuPanel === panel;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  elements.systemPanels.forEach((item) => {
    const isActive = item.dataset.menuPanel === panel;
    item.classList.toggle("active", isActive);
    item.hidden = !isActive;
  });
  if (isSystemMenuOpen() && location.hash.slice(1) !== panel) {
    history.replaceState(null, "", `#${panel}`);
  }
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
  renderAreaNav();
  renderPaperDolls();
  renderHome();
  renderCastleMap();
  renderMap();
  renderDiary();
  renderSettings();
}

function renderStatus() {
  elements.coinValue.textContent = state.coins;
  elements.energyValue.textContent = state.energy;
  elements.levelValue.textContent = `Lv ${state.difficulty}`;
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
  categories.map((category) => category.id).forEach((type) => {
    if (type === "room") return;
    const item = itemById(state.outfit[type]);
    if (item) labels.push(item.name);
  });
  return labels.join(" / ") || "No outfit";
}

function renderPaperDolls() {
  document.querySelectorAll("[data-doll]").forEach((doll) => {
    doll.innerHTML = avatarMarkup(doll.dataset.doll || "side");
    doll.dataset.outfit = state.outfit.outfit || "none";
    doll.dataset.shoes = state.outfit.shoes || "none";
    doll.dataset.accessory = state.outfit.accessory || "none";
    doll.dataset.expression = princessExpression;
  });
}

function avatarMarkup(surface, outfitState = state.outfit) {
  const outfit = itemById(outfitState.outfit) || itemById("pinkDress");
  const spritePosition = outfit?.sprite || "0%";
  return `
    <div class="avatar-shadow"></div>
    <span class="avatar-base avatar-sprite" style="--sprite-x:${spritePosition}" aria-hidden="true"></span>
    <span class="avatar-layer avatar-shoes" aria-hidden="true"></span>
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
  renderCastleMap();
}

function renderAreaNav() {
  if (!elements.areaNav) return;
  elements.areaNav.innerHTML = "";
  Object.values(areaRegistry).filter((area) => area.enabled).forEach((area) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `area-button${state.area === area.id ? " active" : ""}`;
    button.setAttribute("aria-current", state.area === area.id ? "page" : "false");
    button.innerHTML = `
      <span class="area-avatar" aria-hidden="true">
        <span class="paper-doll area-doll" data-doll="area-${area.id}"></span>
      </span>
      <span class="area-label">${area.label}</span>
    `;
    button.addEventListener("click", () => openArea(area.id));
    elements.areaNav.appendChild(button);
  });
  renderPaperDolls();
}

function renderWardrobeTabs() {
  elements.wardrobeTabs.innerHTML = "";
  categories.forEach((category) => {
    const ownedCount = shopItems.filter((item) => item.type === category.id && state.owned.includes(item.id)).length;
    if (!ownedCount) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab wardrobe-accordion-tab${wardrobeCategory === category.id ? " active" : ""}`;
    button.textContent = `${category.label} ${ownedCount}`;
    button.addEventListener("click", () => {
      wardrobeCategory = wardrobeCategory === category.id ? "" : category.id;
      renderHome();
    });
    elements.wardrobeTabs.appendChild(button);
  });
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
  renderWardrobeTabs();
  elements.wardrobeGrid.innerHTML = "";
  const ownedGroups = categories.map((category) => ({
    category,
    items: shopItems.filter((item) => item.type === category.id && state.owned.includes(item.id))
  })).filter((group) => group.items.length);

  if (!ownedGroups.length) {
    elements.wardrobeGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in town.</div>`;
    return;
  }

  ownedGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "wardrobe-section";
    section.innerHTML = `
      <div class="wardrobe-section-title">
        <strong>${group.category.label}</strong>
        <span>${group.items.length}</span>
      </div>
      <div class="wardrobe-section-items"></div>
    `;
    const list = section.querySelector(".wardrobe-section-items");
    group.items.forEach((item) => {
      list.appendChild(createItemCard(item, {
        mode: "wardrobe",
        action: () => toggleEquip(item)
      }));
    });
    elements.wardrobeGrid.appendChild(section);
  });
}

function createItemCard(item, options = {}) {
  const owned = state.owned.includes(item.id);
  const equipped = state.outfit[item.type] === item.id;
  const affordable = state.coins >= item.cost;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-card ${item.type}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!owned && !affordable ? " locked" : ""}${options.selected ? " selected" : ""}`;
  button.dataset.itemId = item.id;
  const previewStyle = `--sprite-x:${item.sprite || "0%"};--c1:${item.colors[0]};--c2:${item.colors[1]};--item-img:url(${item.image})`;
  button.innerHTML = `
    <span class="item-preview item-art item-image ${item.shape}" style="${previewStyle}">
      <span aria-hidden="true">${item.icon || "✦"}</span>
    </span>
    <strong>${item.name}</strong>
    <span>${owned ? equipped ? "Equipped" : "Owned" : `${item.cost} coins`}</span>
    <small>${categoryLabel(item.type)}</small>
  `;
  button.addEventListener("click", options.action || (() => {}));
  if (options.onPreview) {
    button.addEventListener("focus", () => options.onPreview(item));
    button.addEventListener("mouseenter", () => options.onPreview(item));
  }
  return button;
}

function categoryLabel(type) {
  return categories.find((category) => category.id === type)?.label || type;
}

function toggleEquip(item) {
  if (item.type === "room") {
    elements.statusMessage.textContent = `${item.name} is placed in Lumi's room.`;
    persist();
    render();
    return;
  }
  state.outfit[item.type] = state.outfit[item.type] === item.id ? "none" : item.id;
  elements.statusMessage.textContent = state.outfit[item.type] === item.id ? `${item.name} equipped.` : `${item.name} removed.`;
  persist();
  render();
}

function areaMapStage(areaId) {
  return areaId === "castle" ? elements.castleStage : elements.mapStage;
}

function areaMapImageSize(areaId) {
  return areaId === "castle" ? castleMapImageSize : mapImageSize;
}

function areaMapViewport(areaId) {
  if (!areaMapViewports[areaId]) {
    areaMapViewports[areaId] = { pan: { x: 0, y: 0 }, zoom: 1 };
  }
  return areaMapViewports[areaId];
}

function baseAreaMapDisplay(areaId, rect) {
  const imageSize = areaMapImageSize(areaId);
  const imageRatio = imageSize.width / imageSize.height;
  const stageRatio = rect.width / rect.height;
  const useCover = isMobileTravelMap();
  const width = useCover
    ? stageRatio > imageRatio ? rect.width : rect.height * imageRatio
    : stageRatio > imageRatio ? rect.height * imageRatio : rect.width;
  const height = useCover
    ? stageRatio > imageRatio ? rect.width / imageRatio : rect.height
    : stageRatio > imageRatio ? rect.height : rect.width / imageRatio;
  const scale = useCover ? mapZoomLimits.mobileBaseScale : 1;
  return { width: width * scale, height: height * scale };
}

function clampAreaMapViewport(areaId, viewport, rect = null) {
  const stage = areaMapStage(areaId);
  const stageRect = rect || stage.getBoundingClientRect();
  if (!isMobileTravelMap()) return { pan: { x: 0, y: 0 }, zoom: 1 };
  const zoom = clamp(viewport.zoom || 1, mapZoomLimits.min, mapZoomLimits.max);
  const baseDisplay = baseAreaMapDisplay(areaId, stageRect);
  const displayWidth = baseDisplay.width * zoom;
  const displayHeight = baseDisplay.height * zoom;
  const maxX = Math.max(0, (displayWidth - stageRect.width) / 2);
  const maxY = Math.max(0, (displayHeight - stageRect.height) / 2);
  return {
    pan: {
      x: clamp(viewport.pan?.x || 0, -maxX, maxX),
      y: clamp(viewport.pan?.y || 0, -maxY, maxY)
    },
    zoom
  };
}

function areaMapMetrics(areaId, viewportOverride = null) {
  const stage = areaMapStage(areaId);
  const rect = stage.getBoundingClientRect();
  const viewport = viewportOverride || areaMapViewport(areaId);
  const constrained = clampAreaMapViewport(areaId, viewport, rect);
  if (!viewportOverride) {
    areaMapViewports[areaId] = constrained;
  }
  const baseDisplay = baseAreaMapDisplay(areaId, rect);
  const displayWidth = baseDisplay.width * constrained.zoom;
  const displayHeight = baseDisplay.height * constrained.zoom;
  return {
    width: rect.width,
    height: rect.height,
    displayWidth,
    displayHeight,
    panX: constrained.pan.x,
    panY: constrained.pan.y,
    zoom: constrained.zoom,
    offsetX: (rect.width - displayWidth) / 2 + constrained.pan.x,
    offsetY: (rect.height - displayHeight) / 2 + constrained.pan.y
  };
}

function syncAreaMapStyles(areaId, metrics = areaMapMetrics(areaId)) {
  const stage = areaMapStage(areaId);
  if (!stage) return;
  stage.style.setProperty("--map-display-width", `${metrics.displayWidth}px`);
  stage.style.setProperty("--map-display-height", `${metrics.displayHeight}px`);
  stage.style.setProperty("--map-offset-x", `${metrics.offsetX}px`);
  stage.style.setProperty("--map-offset-y", `${metrics.offsetY}px`);
}

function centerAreaMapOnPoint(areaId, x, y) {
  const stage = areaMapStage(areaId);
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const viewport = areaMapViewport(areaId);
  const baseDisplay = baseAreaMapDisplay(areaId, rect);
  const zoom = clamp(viewport.zoom || 1, mapZoomLimits.min, mapZoomLimits.max);
  const displayWidth = baseDisplay.width * zoom;
  const displayHeight = baseDisplay.height * zoom;
  applyAreaMapViewport(areaId, {
    zoom,
    pan: {
      x: rect.width / 2 - (x / 100) * displayWidth - (rect.width - displayWidth) / 2,
      y: rect.height / 2 - (y / 100) * displayHeight - (rect.height - displayHeight) / 2
    }
  });
}

function zoomAreaMapAtStagePoint(areaId, stageX, stageY, zoomFactor) {
  const stage = areaMapStage(areaId);
  if (!stage) return;
  const metrics = areaMapMetrics(areaId);
  const zoom = clamp(metrics.zoom * zoomFactor, mapZoomLimits.min, mapZoomLimits.max);
  const focus = {
    x: clamp((stageX - metrics.offsetX) / metrics.displayWidth, 0, 1),
    y: clamp((stageY - metrics.offsetY) / metrics.displayHeight, 0, 1)
  };
  const rect = stage.getBoundingClientRect();
  const baseDisplay = baseAreaMapDisplay(areaId, rect);
  const displayWidth = baseDisplay.width * zoom;
  const displayHeight = baseDisplay.height * zoom;
  applyAreaMapViewport(areaId, {
    zoom,
    pan: {
      x: stageX - focus.x * displayWidth - (rect.width - displayWidth) / 2,
      y: stageY - focus.y * displayHeight - (rect.height - displayHeight) / 2
    }
  });
  refreshAreaMapPositions(areaId);
}

function zoomAreaMapFromKeyboard(areaId, direction) {
  const stage = areaMapStage(areaId);
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  zoomAreaMapAtStagePoint(areaId, rect.width / 2, rect.height / 2, direction > 0 ? 1.18 : 1 / 1.18);
}

function centerAreaMapOnCurrentPlayer(areaId) {
  const point = currentPlayerPoint(areaId);
  if (!point) return;
  centerAreaMapOnPoint(areaId, point.x, point.y);
}

function centerAreaMapIfRequested(areaId) {
  if (!centerMapOnNextRender[areaId]) return;
  centerMapOnNextRender[areaId] = false;
  centerAreaMapOnCurrentPlayer(areaId);
}

function castleCoverMetrics() {
  return areaMapMetrics("castle");
}

function castlePointToStage(x, y, metrics = castleCoverMetrics()) {
  return {
    x: metrics.offsetX + (x / 100) * metrics.displayWidth,
    y: metrics.offsetY + (y / 100) * metrics.displayHeight
  };
}

function positionCastleElement(element, x, y, metrics = castleCoverMetrics()) {
  const point = castlePointToStage(x, y, metrics);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
}

function currentPlayerPoint(areaId) {
  const nodes = nodeMapForArea(areaId);
  const fallback = nodes[state.playerNode] || nodes[areaRegistry[areaId]?.defaultNode];
  if (
    state.area === areaId &&
    typeof state.player?.x === "number" &&
    typeof state.player?.y === "number"
  ) {
    return state.player;
  }
  return fallback || null;
}

function nearbyAreaHotspot(areaId, defaultRadius = 6.8) {
  const nodes = nodeMapForArea(areaId);
  const player = currentPlayerPoint(areaId);
  if (!player) return null;
  const candidates = (areaRegistry[areaId]?.locations || []).map((hotspot) => {
    const node = nodes[hotspot.node];
    if (!node) return null;
    const radius = hotspot.focusRadius || defaultRadius;
    const distance = Math.hypot(node.x - player.x, (node.y - player.y) * 1.18);
    const score = distance / radius;
    return { hotspot, distance, score, radius };
  }).filter((candidate) => candidate && candidate.distance <= candidate.radius);
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
  return candidates[0].hotspot;
}

function renderCastleMap() {
  if (!elements.castleStage || !elements.castleMarkerLayer) return;
  if (elements.castleStage.offsetParent === null && activeViewName() !== "home") return;
  centerAreaMapIfRequested("castle");
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  elements.castleMarkerLayer.innerHTML = "";
  castleHotspots.forEach((hotspot) => {
    const node = castleMapNodes[hotspot.node];
    if (!node) return;
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker hotspot castle-marker${activeCastleHotspot?.id === hotspot.id ? " nearby" : ""}${hotspot.kind === "future" ? " disabled" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot)}.`);
    positionCastleElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleCastleHotspotClick(hotspot.id);
    });
    elements.castleMarkerLayer.appendChild(marker);
  });
  updateCastlePlayerPosition(metrics);
  updateNearbyCastleHotspot();
}

function focusCastleHotspot(hotspotId, rerender = true) {
  activeCastleHotspot = castleHotspots.find((hotspot) => hotspot.id === hotspotId) || castleHotspots[0];
  const node = castleMapNodes[activeCastleHotspot?.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
    centerAreaMapOnPoint("castle", node.x, node.y);
    persist();
  }
  if (rerender) renderCastleMap();
  elements.castleStage.focus({ preventScroll: true });
}

function handleCastleHotspotClick(hotspotId) {
  if (activeCastleHotspot?.id === hotspotId) {
    interactCastleHotspot();
    return;
  }
  focusCastleHotspot(hotspotId);
}

function updateCastlePlayerPosition(metrics = castleCoverMetrics()) {
  if (!elements.castlePlayerToken) return;
  const point = currentPlayerPoint("castle");
  if (!point) return;
  positionCastleElement(elements.castlePlayerToken, point.x, point.y, metrics);
}

function refreshCastleMapPositions() {
  const metrics = castleCoverMetrics();
  syncAreaMapStyles("castle", metrics);
  castleHotspots.forEach((hotspot) => {
    const marker = elements.castleMarkerLayer?.querySelector(`[data-hotspot-id="${hotspot.id}"]`);
    const node = castleMapNodes[hotspot.node];
    if (marker && node) positionCastleElement(marker, node.x, node.y, metrics);
  });
  updateCastlePlayerPosition(metrics);
  updateCastleHotspotFocus();
}

function interactCastleHotspot() {
  const hotspot = activeCastleHotspot || nearbyCastleHotspot();
  if (!hotspot) return;
  activeCastleHotspot = hotspot;
  if (hotspot.kind === "gate" && hotspot.targetArea) {
    if (hotspot.targetArea === "kingdom" && mapNodes.castleRoom) {
      state.playerNode = "castleRoom";
      state.player = { x: mapNodes.castleRoom.x, y: mapNodes.castleRoom.y };
      activeHotspot = null;
    }
    openArea(hotspot.targetArea);
    return;
  }
  if (hotspot.kind === "future") {
    elements.statusMessage.textContent = `${hotspot.label} is reserved for a later chapter.`;
    return;
  }
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
  }
}

function updateNearbyCastleHotspot() {
  activeCastleHotspot = nearbyCastleHotspot();
  updateCastleHotspotFocus();
}

function updateCastleHotspotFocus() {
  elements.castleMarkerLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeCastleHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyCastleHotspot() {
  return nearbyAreaHotspot("castle", 5.8);
}

function moveOnCastleMap(dx, dy) {
  const speed = 1.35;
  const current = currentPlayerPoint("castle") || castleMapNodes[areaRegistry.castle.defaultNode];
  const next = {
    x: clamp(current.x + dx * speed, 0, 100),
    y: clamp(current.y + dy * speed, 0, 100)
  };
  state.area = "castle";
  state.player = next;
  state.playerNode = closestNodeFromLegacy(state.player, "castle");
  activeCastleHotspot = nearbyCastleHotspot();
  if (activeCastleHotspot) {
    elements.statusMessage.textContent = `${activeCastleHotspot.label}: ${travelActionLabel(activeCastleHotspot)}.`;
  }
  elements.castlePlayerToken?.classList.add("walking");
  window.setTimeout(() => elements.castlePlayerToken?.classList.remove("walking"), 180);
  persist();
  renderCastleMap();
}

function renderMap() {
  if (!elements.mapStage || (elements.mapStage.offsetParent === null && activeViewName() !== "map")) return;
  ensureKingdomPosition();
  centerAreaMapIfRequested("kingdom");
  const target = hotspotById(state.activeQuest.place);
  if (elements.destinationHint) elements.destinationHint.textContent = `${target.icon} ${target.label} is waiting.`;
  elements.routeLayer.innerHTML = "";
  elements.nodeLayer.innerHTML = "";
  const metrics = mapCoverMetrics();
  syncMapPanStyles(metrics);
  renderMapActors(metrics);
  renderHotspots(metrics);
  updatePlayerPosition(metrics);
  updateNearbyHotspot();
  startMapLife();
}

function renderDestinationPicker() {
  if (!elements.destinationList) return;
  const targetId = state.activeQuest.place;
  elements.destinationList.innerHTML = "";
  hotspots.filter((hotspot) => hotspot.kind !== "room").forEach((hotspot) => {
    const isTarget = hotspot.id === targetId;
    const isShop = hotspot.kind === "shop";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `destination-card${isTarget ? " target" : ""}${isShop ? " shop" : ""}`;
    button.dataset.destinationId = hotspot.id;
    button.innerHTML = `
      <span class="destination-icon" aria-hidden="true">${hotspot.icon}</span>
      <span class="destination-copy">
        <strong>${hotspot.label}</strong>
        <small>${destinationActionText(hotspot, isTarget)}</small>
      </span>
      <span class="destination-badge">${isTarget ? "Talk" : isShop ? "Shop" : "Visit"}</span>
    `;
    button.addEventListener("click", () => chooseDestination(hotspot.id));
    elements.destinationList.appendChild(button);
  });
}

function destinationActionText(hotspot, isTarget) {
  if (isTarget) return `${sceneConfigFor(hotspot).npc} has today's English task.`;
  if (hotspot.kind === "shop") {
    const categoriesText = allowedShopCategories(hotspot).map(categoryLabel).join(" / ");
    return `Try ${categoriesText.toLowerCase()} rewards.`;
  }
  return hotspot.hint;
}

function chooseDestination(hotspotId) {
  const hotspot = hotspots.find((item) => item.id === hotspotId);
  if (!hotspot) return;
  const node = mapNodes[hotspot.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
  }
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  if (hotspot.kind === "gate" && hotspot.targetArea) {
    enterTravelGate(hotspot);
    return;
  }
  openSceneAdv(hotspot);
}

function focusTravelHotspot(hotspotId) {
  const hotspot = hotspots.find((item) => item.id === hotspotId);
  const node = mapNodes[hotspot?.node];
  if (!hotspot || !node) return;
  state.playerNode = node.id;
  state.player = { x: node.x, y: node.y };
  activeHotspot = hotspot;
  centerAreaMapOnPoint("kingdom", node.x, node.y);
  persist();
  renderMap();
  activeHotspot = hotspot;
  updateHotspotFocus();
  elements.mapStage.focus({ preventScroll: true });
}

function handleTravelHotspotClick(hotspotId) {
  if (activeHotspot?.id === hotspotId) {
    interactNearby();
    return;
  }
  focusTravelHotspot(hotspotId);
}

function isMobileTravelMap() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function syncMapPanStyles(metrics = mapCoverMetrics()) {
  syncAreaMapStyles("kingdom", metrics);
}

function mapCoverMetrics() {
  return areaMapMetrics("kingdom");
}

function mapPointToStage(x, y, metrics = mapCoverMetrics()) {
  return {
    x: metrics.offsetX + (x / 100) * metrics.displayWidth,
    y: metrics.offsetY + (y / 100) * metrics.displayHeight
  };
}

function positionMapElement(element, x, y, metrics = mapCoverMetrics()) {
  const point = mapPointToStage(x, y, metrics);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
}

function renderMapActors(metrics = mapCoverMetrics()) {
  if (!elements.mapLifeLayer) return;
  if (!metrics.width || !metrics.height) return;
  elements.mapLifeLayer.innerHTML = "";
  mapActors.forEach((actor) => {
    const point = mapPointToStage(actor.x, actor.y, metrics);
    const item = document.createElement("span");
    item.className = `map-actor map-actor-${actor.type}${actor.src ? " map-actor-image" : ""}`;
    item.dataset.actorId = actor.id;
    item.dataset.actorType = actor.type;
    item.dataset.phase = String(actor.phase || 0);
    item.dataset.scale = String(actor.scale || 1);
    item.dataset.anchorX = String(actor.anchorX ?? 0.5);
    item.dataset.anchorY = String(actor.anchorY ?? 0.5);
    item.style.left = `${point.x}px`;
    item.style.top = `${point.y}px`;
    item.style.width = `${(actor.w / 100) * metrics.displayWidth}px`;
    item.style.height = `${(actor.h / 100) * metrics.displayHeight}px`;
    item.style.zIndex = String(actor.z || 1);
    if (actor.src) item.style.backgroundImage = `url("${actor.src}")`;
    elements.mapLifeLayer.appendChild(item);
  });
}

function startMapLife() {
  if (mapLifeFrame) return;
  const tick = (time) => {
    const t = time / 1000;
    document.querySelectorAll(".map-actor").forEach((item) => {
      const type = item.dataset.actorType;
      const phase = Number(item.dataset.phase || 0);
      const scale = Number(item.dataset.scale || 1);
      const anchorX = Number(item.dataset.anchorX || 0.5) * -100;
      const anchorY = Number(item.dataset.anchorY || 0.5) * -100;
      let dx = 0;
      let dy = 0;
      let rotate = 0;
      let skew = 0;
      let pulse = 1;
      if (type === "water") {
        dx = Math.sin(t * 0.34 + phase) * 7;
        dy = Math.cos(t * 0.28 + phase) * 4;
        pulse = 1 + Math.sin(t * 0.42 + phase) * 0.012;
        item.style.opacity = String(0.18 + Math.sin(t * 0.46 + phase) * 0.05);
      } else if (type === "ship") {
        dx = Math.sin(t * 0.48 + phase) * 0.9;
        dy = Math.sin(t * 0.72 + phase) * 1.8;
        rotate = Math.sin(t * 0.55 + phase) * 0.18;
        item.style.opacity = "0.38";
      } else if (type === "wave") {
        dx = Math.sin(t * 1.7 + phase) * 10;
        dy = Math.cos(t * 1.3 + phase) * 4;
        pulse = 1 + Math.sin(t * 1.4 + phase) * 0.07;
        item.style.opacity = String(0.44 + Math.sin(t * 1.4 + phase) * 0.22);
      } else if (type === "windmill") {
        rotate = (t * 72 + phase * 90) % 360;
        item.style.opacity = "0.8";
      } else if (type === "flag") {
        skew = Math.sin(t * 3.2 + phase) * 5;
        dx = Math.sin(t * 2.4 + phase) * 1.2;
        item.style.opacity = "0.76";
      } else if (type === "glow") {
        pulse = 1 + Math.sin(t * 1.6 + phase) * 0.16;
        item.style.opacity = String(0.34 + Math.sin(t * 1.6 + phase) * 0.14);
      } else if (type === "bird") {
        dx = ((t * 18 + phase * 40) % 70) - 20;
        dy = Math.sin(t * 2.1 + phase) * 5;
      }
      item.style.transform = `translate(${anchorX}%, ${anchorY}%) translate(${dx}px, ${dy}px) rotate(${rotate}deg) skewY(${skew}deg) scale(${scale * pulse})`;
    });
    mapLifeFrame = requestAnimationFrame(tick);
  };
  mapLifeFrame = requestAnimationFrame(tick);
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
  const metrics = mapCoverMetrics();
  elements.nodeLayer.innerHTML = "";
  Object.values(mapNodes).forEach((node) => {
    const marker = document.createElement("div");
    marker.className = `road-node${node.id === state.playerNode ? " current" : ""}${mapNodes[state.playerNode].links.includes(node.id) ? " reachable" : ""}`;
    positionMapElement(marker, node.x, node.y, metrics);
    elements.nodeLayer.appendChild(marker);
  });
}

function renderHotspots(metrics = mapCoverMetrics()) {
  elements.hotspotLayer.innerHTML = "";
  hotspots.forEach((hotspot) => {
    const node = mapNodes[hotspot.node];
    const marker = document.createElement("button");
    const isTarget = state.activeQuest.place === hotspot.id;
    marker.type = "button";
    marker.className = `map-marker hotspot${isTarget ? " target" : ""}${hotspot.kind === "shop" ? " shop" : ""}`;
    marker.dataset.hotspotId = hotspot.id;
    marker.dataset.label = hotspot.label;
    marker.setAttribute("aria-label", `${hotspot.label}. ${travelActionLabel(hotspot, isTarget)}.`);
    positionMapElement(marker, node.x, node.y, metrics);
    marker.innerHTML = `<span class="hotspot-icon" aria-hidden="true">${hotspot.icon}</span>`;
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleTravelHotspotClick(hotspot.id);
    });
    elements.hotspotLayer.appendChild(marker);
  });
}

function updatePlayerPosition(metrics = mapCoverMetrics()) {
  positionMapElement(elements.playerToken, state.player.x, state.player.y, metrics);
}

function refreshMapPositions() {
  const metrics = mapCoverMetrics();
  syncMapPanStyles(metrics);
  renderMapActors(metrics);
  renderHotspots(metrics);
  updatePlayerPosition(metrics);
  updateHotspotFocus();
}

function travelActionLabel(hotspot, isTarget = hotspot?.id === state.activeQuest.place) {
  if (!hotspot) return "Visit";
  if (hotspot.kind === "room") return "Enter";
  if (hotspot.kind === "gate") return hotspot.targetArea === "castle" ? "Castle" : "Kingdom";
  if (hotspot.kind === "future") return "Soon";
  if (isTarget) return "Talk";
  if (hotspot.kind === "shop") return "Shop";
  return sceneConfigFor(hotspot).travelAction || "Visit";
}

function updateNearbyHotspot() {
  activeHotspot = nearbyHotspot();
  updateHotspotFocus();
}

function updateHotspotFocus() {
  elements.hotspotLayer?.querySelectorAll(".hotspot").forEach((marker) => {
    marker.classList.toggle("nearby", activeHotspot?.id === marker.dataset.hotspotId);
  });
}

function nearbyHotspot() {
  return nearbyAreaHotspot("kingdom", 6.8);
}

function moveOnMap(dx, dy) {
  const speed = 1.45;
  const next = {
    x: clamp(state.player.x + dx * speed, 0, 100),
    y: clamp(state.player.y + dy * speed, 0, 100)
  };
  state.player = next;
  state.playerNode = closestNodeFromLegacy(state.player);
  activeHotspot = nearbyHotspot();
  if (activeHotspot) {
    elements.statusMessage.textContent = `${activeHotspot.label}: ${travelActionLabel(activeHotspot)}.`;
  }
  elements.playerToken.classList.add("walking");
  window.setTimeout(() => elements.playerToken.classList.remove("walking"), 180);
  persist();
  renderMap();
}

function isWalkable(x, y) {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

function interactNearby() {
  const hotspot = activeHotspot || nearbyHotspot();
  if (!hotspot) return;
  activeHotspot = hotspot;
  if (hotspot.kind === "gate" && hotspot.targetArea) {
    enterTravelGate(hotspot);
    return;
  }
  openSceneAdv(hotspot);
}

function enterTravelGate(hotspot) {
  if (!hotspot?.targetArea) return;
  if (hotspot.targetArea === "castle" && castleMapNodes.castleGate) {
    state.playerNode = "castleGate";
    state.player = { x: castleMapNodes.castleGate.x, y: castleMapNodes.castleGate.y };
    activeCastleHotspot = castleHotspots.find((item) => item.id === "castleGate") || null;
    activeHotspot = null;
  }
  openArea(hotspot.targetArea);
}

function openAdvBase(hotspot, mode) {
  const areaId = areaForHotspot(hotspot);
  state.area = areaId;
  changeView(areaRegistry[areaId]?.view || "map");
  clearRewardBursts();
  const scene = sceneConfigFor(hotspot);
  advMode = mode;
  activeLesson = null;
  activeShopHotspot = null;
  advFocusIndex = 0;
  setExpressions("normal", "normal");
  elements.advScene.dataset.mode = mode;
  elements.shopArea.before(elements.choiceList);
  elements.choiceList.classList.remove("shop-command-list");
  elements.advModal.classList.add("show");
  elements.advModal.setAttribute("aria-hidden", "false");
  elements.advScene.className = `adv-scene ${scene.scene}`;
  elements.advTitle.textContent = hotspot.label;
  elements.advNpcPortrait.className = `portrait-card adv-npc ${scene.npcClass}`;
  elements.advNpcPortrait.dataset.expression = npcExpression;
  elements.advSpeaker.textContent = scene.npc;
  elements.choiceList.innerHTML = "";
  elements.advShopGrid.innerHTML = "";
  elements.shopArea.classList.remove("show", "wardrobe-detail");
  elements.advFeedback.textContent = "";
  renderPaperDolls();
  requestAnimationFrame(() => {
    elements.advModal.classList.toggle("show", advMode !== "closed");
    elements.advModal.setAttribute("aria-hidden", advMode === "closed" ? "true" : "false");
  });
}

function openSceneAdv(hotspot) {
  if (!hotspot) return;
  if (hotspot.kind === "room") {
    openRoomScene(hotspot);
    return;
  }
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const scene = sceneConfigFor(hotspot);
  const isTarget = hotspot.id === state.activeQuest.place;
  elements.advLine.textContent = scene.travelLine || hotspot.hint;
  elements.advPrompt.textContent = "Choose what to do here.";
  if (hotspot.kind === "shop") addAdvOption("Shop", () => openShopDetail(hotspot));
  if (isTarget) {
    addAdvOption("Talk", () => openQuestAdv(hotspot));
  } else {
    addAdvOption(hotspot.kind === "shop" ? "Chat" : "Talk", () => openHintAdv(hotspot));
  }
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function openRoomScene(hotspot = hotspotById("princessRoom")) {
  openAdvBase(hotspot, "scene");
  addUnique("metNpcs", ["Lumi"]);
  elements.advLine.textContent = "Lumi is in her room. What should we change today?";
  elements.advPrompt.textContent = "Choose a room action.";
  addAdvOption("Dresses", () => openWardrobeDetail("outfit"));
  addAdvOption("Accessories", () => openWardrobeDetail("accessory"));
  addAdvOption("Shoes", () => openWardrobeDetail("shoes"));
  addAdvOption("Room Treasures", () => openWardrobeDetail("room"));
  addAdvOption("Go Outside", () => {
    closeAdv();
    openArea("castle");
  }, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
}

function addAdvOption(label, onClick, options = {}) {
  const button = document.createElement("button");
  button.className = `choice-button${options.leave ? " leave-choice" : ""}`;
  button.type = "button";
  button.textContent = options.number ? `${options.number}. ${label}` : label;
  button.setAttribute("aria-label", label);
  if (options.choice) button.dataset.choice = options.choice;
  button.addEventListener("click", onClick);
  elements.choiceList.appendChild(button);
  return button;
}

function advFocusableButtons() {
  if (!elements.advModal.classList.contains("show")) return [];
  const selectors = advMode === "shop" || advMode === "wardrobe"
    ? ["#advShopGrid .item-card:not(:disabled)", "#choiceList .choice-button:not(:disabled)"]
    : ["#choiceList .choice-button:not(:disabled)", "#advShopGrid .item-card:not(:disabled)"];
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
  button.scrollIntoView({ block: "nearest" });
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
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
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
  elements.advFeedback.textContent = "";
  addAdvOption("Leave", closeAdv, { leave: true });
  window.setTimeout(() => setAdvFocus(0), 0);
}

function openShopAdv(hotspot) {
  openSceneAdv(hotspot);
}

function openShopDetail(hotspot) {
  openAdvBase(hotspot, "shop");
  activeShopHotspot = hotspot;
  addUnique("metNpcs", [sceneConfigFor(hotspot).npc]);
  const firstCategory = hotspot.defaultCategory || hotspot.shopCategories?.[0] || "outfit";
  shopCategory = allowedShopCategories(hotspot).includes(shopCategory) ? shopCategory : firstCategory;
  shopPreviewItemId = shopItems.find((item) => item.type === shopCategory && allowedShopCategories(hotspot).includes(item.type))?.id || "";
  elements.advLine.textContent = shopGreeting(hotspot);
  elements.advPrompt.textContent = "Choose a treasure to preview. Press B or Buy when Lumi wants it.";
  elements.shopArea.classList.remove("wardrobe-detail");
  elements.shopArea.classList.add("show");
  renderAdvShop();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function openWardrobeDetail(category = "outfit") {
  const hotspot = hotspotById("princessRoom");
  activeShopHotspot = hotspot;
  advMode = "wardrobe";
  shopCategory = category;
  elements.advScene.dataset.mode = "wardrobe";
  elements.advLine.textContent = `Choose ${categoryLabel(category).toLowerCase()} for Lumi.`;
  elements.advPrompt.textContent = "Pick a treasure to preview, then equip it.";
  elements.shopArea.classList.add("show", "wardrobe-detail");
  renderWardrobeDetail();
}

function renderWardrobeDetail(preserveFocus = false) {
  const ownedCategories = categories
    .filter((category) => shopItems.some((item) => item.type === category.id && state.owned.includes(item.id)))
    .map((category) => category.id);
  const allowed = ownedCategories.length ? ownedCategories : categories.map((category) => category.id);
  if (!allowed.includes(shopCategory)) shopCategory = allowed[0] || "outfit";
  const categoryItems = shopItems.filter((item) => item.type === shopCategory && state.owned.includes(item.id));
  if (!categoryItems.some((item) => item.id === shopPreviewItemId)) shopPreviewItemId = categoryItems[0]?.id || "";
  const previewItem = itemById(shopPreviewItemId) || categoryItems[0];
  renderCategoryTabs(elements.advShopTabs, shopCategory, (nextCategory) => {
    shopCategory = nextCategory;
    shopPreviewItemId = "";
    renderWardrobeDetail();
  }, true);
  renderShopPreview(previewItem);
  elements.advShopGrid.innerHTML = "";
  if (!categoryItems.length) {
    elements.advShopGrid.innerHTML = `<div class="wardrobe-empty">Buy treasures in the kingdom first.</div>`;
  } else {
    categoryItems.forEach((item) => {
      elements.advShopGrid.appendChild(createItemCard(item, {
        mode: "wardrobe",
        selected: item.id === shopPreviewItemId,
        onPreview: previewWardrobeItem,
        action: () => previewWardrobeItem(item)
      }));
    });
  }
  elements.choiceList.innerHTML = "";
  addAdvOption(wardrobeActionLabel(previewItem), () => equipWardrobePreview(previewItem), { leave: false });
  addAdvOption("Back", () => openRoomScene(hotspotById("princessRoom")));
  addAdvOption("Leave", closeAdv, { leave: true });
  elements.choiceList.classList.add("shop-command-list");
  elements.shopArea.appendChild(elements.choiceList);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  window.setTimeout(() => setAdvFocus(focusIndex), 0);
}

function previewWardrobeItem(item) {
  if (!item || shopPreviewItemId === item.id) return;
  shopPreviewItemId = item.id;
  renderWardrobeDetail(true);
}

function wardrobeActionLabel(item) {
  if (!item) return "No item";
  if (item.type === "room") return "Place";
  return state.outfit[item.type] === item.id ? "Equipped" : "Equip";
}

function equipWardrobePreview(item) {
  if (!item) return;
  if (item.type === "room") {
    elements.advFeedback.textContent = `${item.name} is placed in Lumi's room.`;
  } else {
    state.outfit[item.type] = item.id;
    elements.advFeedback.textContent = `${item.name} equipped.`;
  }
  persist();
  render();
  renderWardrobeDetail(true);
}

function allowedShopCategories(hotspot = activeShopHotspot) {
  return hotspot?.shopCategories?.length ? hotspot.shopCategories : categories.map((category) => category.id);
}

function shopGreeting(hotspot) {
  return sceneConfigFor(hotspot).shopGreeting || "Welcome, Princess. Pick a lovely item.";
}

function renderAdvShop(preserveFocus = false) {
  const allowed = allowedShopCategories();
  if (!allowed.includes(shopCategory)) shopCategory = allowed[0] || "outfit";
  const categoryItems = shopItems.filter((item) => item.type === shopCategory && allowed.includes(item.type));
  if (!categoryItems.some((item) => item.id === shopPreviewItemId)) shopPreviewItemId = categoryItems[0]?.id || "";
  const previewItem = itemById(shopPreviewItemId) || categoryItems[0];
  renderCategoryTabs(elements.advShopTabs, shopCategory, (category) => {
    shopCategory = category;
    shopPreviewItemId = "";
    renderAdvShop();
  }, false, allowed);
  renderShopPreview(previewItem);
  elements.advShopGrid.innerHTML = "";
  categoryItems.forEach((item) => {
    elements.advShopGrid.appendChild(createItemCard(item, {
      mode: "shop",
      selected: item.id === shopPreviewItemId,
      onPreview: previewShopItem,
      action: () => previewShopItem(item)
    }));
  });
  elements.choiceList.innerHTML = "";
  addAdvOption(shopActionLabel(previewItem), () => buyItemInAdv(previewItem), { leave: false });
  addAdvOption("Leave", closeAdv, { leave: true });
  elements.choiceList.classList.add("shop-command-list");
  elements.shopArea.appendChild(elements.choiceList);
  const focusIndex = preserveFocus ? Math.max(0, categoryItems.findIndex((item) => item.id === shopPreviewItemId)) : 0;
  window.setTimeout(() => setAdvFocus(focusIndex), 0);
}

function previewShopItem(item) {
  if (!item || shopPreviewItemId === item.id) return;
  shopPreviewItemId = item.id;
  renderAdvShop(true);
}

function shopActionLabel(item) {
  if (!item) return "Buy";
  if (state.owned.includes(item.id)) {
    if (item.type === "room") return "Placed";
    return state.outfit[item.type] === item.id ? "Equipped" : "Equip";
  }
  if (state.coins < item.cost) return `Need ${item.cost - state.coins} more coins`;
  return `Buy ${item.cost} coins`;
}

function renderShopPreview(item) {
  let feature = elements.shopArea.querySelector(".shop-feature");
  if (!feature) {
    feature = document.createElement("div");
    feature.className = "shop-feature";
    elements.shopArea.prepend(feature);
  }
  if (!item) {
    feature.innerHTML = "";
    return;
  }
  const owned = state.owned.includes(item.id);
  const equipped = state.outfit[item.type] === item.id;
  const affordable = state.coins >= item.cost;
  const previewOutfit = { ...state.outfit };
  if (item.type !== "room") previewOutfit[item.type] = item.id;
  const status = owned ? equipped ? "Equipped now" : "Owned treasure" : affordable ? "Ready to buy" : `Need ${item.cost - state.coins} more coins`;
  feature.innerHTML = `
    <div class="shop-feature-stage">
      <div class="paper-doll shop-preview-doll" data-outfit="${previewOutfit.outfit || "none"}" data-shoes="${previewOutfit.shoes || "none"}" data-accessory="${previewOutfit.accessory || "none"}" data-expression="happy">
        ${avatarMarkup("shop", previewOutfit)}
      </div>
      <div class="shop-feature-item item-preview item-art item-image ${item.shape}" style="--c1:${item.colors[0]};--c2:${item.colors[1]};--sprite-x:${item.sprite || "0%"};--item-img:url('${item.image}')">
        <span aria-hidden="true">${item.icon || "✦"}</span>
      </div>
    </div>
    <div class="shop-feature-copy">
      <strong>${item.name}</strong>
      <span>${status}</span>
      <p>${itemWishText(item)}</p>
    </div>
  `;
}

function itemWishText(item) {
  const lines = {
    pinkDress: "Lumi's first dress for gentle castle mornings.",
    blueDress: "A seaside dress for walking near bright waves.",
    roseDress: "A festival dress that makes every thank-you sparkle.",
    snowDress: "A soft gown for winter stories and moonlit dances.",
    pinkSlippers: "Ribbon shoes for tiny steps across the kingdom.",
    blueBoots: "Sturdy boots for brave harbor walks.",
    goldCrown: "A tiny crown for a very kind princess helper.",
    silkRibbon: "A party ribbon that bounces when Lumi smiles.",
    pearlBag: "A shell bag for keeping little treasure notes.",
    starCape: "A helper cape for night quests and lighthouse wishes.",
    studyDesk: "A cozy desk where new English words can rest.",
    seaLamp: "A sea-glass lamp that makes bedtime stories glow."
  };
  return lines[item.id] || "A lovely treasure for Lumi's next adventure.";
}

function buyItemInAdv(item) {
  if (!item) return;
  if (state.owned.includes(item.id)) {
    if (item.type !== "room") {
      toggleEquip(item);
    } else {
      elements.advFeedback.textContent = `${item.name} is already in Lumi's room.`;
    }
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
  if (item.type !== "room") state.outfit[item.type] = item.id;
  awardBadge("First Shopping");
  updateProgressBadges();
  addDiary({ type: "shop", title: activeShopHotspot?.label || "Shop", body: `Bought ${item.name}.`, result: `-${item.cost} coins` });
  const feedbackText = item.type === "room" ? `${item.name} is in Lumi's room now.` : `${item.name} is on Lumi now.`;
  elements.advLine.textContent = `${item.name} is yours now. It looks wonderful.`;
  elements.advFeedback.textContent = feedbackText;
  elements.statusMessage.textContent = feedbackText;
  showRewardBurst(`${item.name} ✦`);
  persist();
  render();
  renderAdvShop(true);
}

function recommendedShopHotspot() {
  const shopHotspots = hotspots.filter((hotspot) => hotspot.kind === "shop");
  const affordableShop = shopHotspots.find((hotspot) => {
    const allowed = allowedShopCategories(hotspot);
    return shopItems.some((item) => allowed.includes(item.type) && !state.owned.includes(item.id) && state.coins >= item.cost);
  });
  return affordableShop || shopHotspots[0] || null;
}

function openRewardShop() {
  const hotspot = recommendedShopHotspot();
  if (!hotspot) {
    closeAdv();
    return;
  }
  const node = mapNodes[hotspot.node];
  if (node) {
    state.playerNode = node.id;
    state.player = { x: node.x, y: node.y };
  }
  persist();
  renderMap();
  openShopDetail(hotspot);
}

function closeAdvThenHome() {
  closeAdv();
  changeView("home");
}

function showRewardBurst(text) {
  clearRewardBursts();
  const burst = document.createElement("div");
  burst.className = "reward-burst";
  burst.textContent = text;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1400);
}

function clearRewardBursts() {
  document.querySelectorAll(".reward-burst").forEach((item) => item.remove());
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
    elements.advFeedback.textContent = "Try again.";
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
  addUnique("metNpcs", [sceneConfigFor(hotspotById(state.activeQuest.place)).npc]);
  updateProgressBadges();
  setExpressions("happy", "happy");
  button.classList.add("correct");
  showRewardBurst(`+${reward.coins} coins`);
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
  elements.advPrompt.textContent = "Talk complete. Try a reward now, or go back to Lumi's room.";
  elements.advFeedback.textContent = `${effectText(reward)}.`;
  state.activeQuest = createRandomQuest(oldPlace);
  activeLesson = null;
  advMode = "complete";
  elements.advScene.dataset.mode = "complete";
  elements.choiceList.innerHTML = "";
  if (completedHotspot?.kind === "shop") {
    addAdvOption("Shop", () => openShopDetail(completedHotspot));
    addAdvOption("Back to Room", closeAdvThenHome);
    addAdvOption("Leave", closeAdv, { leave: true });
  } else {
    addAdvOption("Choose Reward", openRewardShop);
    addAdvOption("Back to Room", closeAdvThenHome);
    addAdvOption("Leave", closeAdv, { leave: true });
  }
  elements.statusMessage.textContent = `Talk complete. Next place: ${hotspotById(state.activeQuest.place).label}.`;
  persist();
  render();
  window.setTimeout(() => setAdvFocus(0), 0);
  speak(elements.advLine.textContent);
}

function closeAdv() {
  elements.advModal.classList.remove("show");
  elements.advModal.setAttribute("aria-hidden", "true");
  advMode = "closed";
  elements.advScene.dataset.mode = "closed";
  activeLesson = null;
  activeShopHotspot = null;
  setExpressions("normal", "normal");
  const focusTarget = activeViewName() === "home" ? elements.castleStage : elements.mapStage;
  focusTarget?.focus({ preventScroll: true });
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
    if (new URLSearchParams(location.search).has("selftest")) return;
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
  const filename = "luminara-adv-dressup-save.md";
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
  elements.statusMessage.textContent = "Progress reset. A new short talk is ready.";
  render();
}

function relativeStagePoint(stage, pointer) {
  const rect = stage.getBoundingClientRect();
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top
  };
}

function pointerDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function pointerCenter(a, b) {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2
  };
}

function resetMapGestureStart() {
  if (!mapGesture) return;
  const viewport = areaMapViewport(mapGesture.areaId);
  const metrics = areaMapMetrics(mapGesture.areaId);
  const pointers = [...mapGesture.pointers.values()];
  mapGesture.startPan = { ...viewport.pan };
  mapGesture.startZoom = viewport.zoom;
  mapGesture.startPoints = pointers.map((pointer) => ({ ...pointer }));
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(mapGesture.stage, center);
    mapGesture.startDistance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    mapGesture.startCenterStage = centerStage;
    mapGesture.startMapFocus = {
      x: clamp((centerStage.x - metrics.offsetX) / metrics.displayWidth, 0, 1),
      y: clamp((centerStage.y - metrics.offsetY) / metrics.displayHeight, 0, 1)
    };
  } else if (pointers.length === 1) {
    mapGesture.startCenterStage = relativeStagePoint(mapGesture.stage, pointers[0]);
  }
}

function applyAreaMapViewport(areaId, viewport) {
  areaMapViewports[areaId] = clampAreaMapViewport(areaId, viewport);
}

function refreshAreaMapPositions(areaId) {
  if (areaId === "castle") {
    refreshCastleMapPositions();
  } else {
    refreshMapPositions();
  }
}

function scheduleAreaMapPositionRefresh(areaId) {
  pendingMapRefreshArea = areaId;
  if (pendingMapPositionFrame) return;
  pendingMapPositionFrame = requestAnimationFrame(() => {
    const areaToRefresh = pendingMapRefreshArea || state.area || "kingdom";
    pendingMapPositionFrame = 0;
    pendingMapRefreshArea = "";
    refreshAreaMapPositions(areaToRefresh);
  });
}

function mapGestureBlocked(event) {
  return Boolean(event.target.closest("button, .nearby-card, .destination-panel, .area-nav"));
}

function beginAreaMapGesture(areaId, event) {
  if (!isMobileTravelMap()) return;
  if (mapGestureBlocked(event)) return;
  const stage = areaMapStage(areaId);
  if (!mapGesture || mapGesture.areaId !== areaId) {
    mapGesture = {
      areaId,
      stage,
      pointers: new Map(),
      moved: false
    };
  }
  mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  resetMapGestureStart();
  stage.classList.add("is-dragging");
  stage.setPointerCapture?.(event.pointerId);
}

function moveAreaMapGesture(areaId, event) {
  if (!mapGesture || mapGesture.areaId !== areaId || !mapGesture.pointers.has(event.pointerId)) return;
  mapGesture.pointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  const pointers = [...mapGesture.pointers.values()];
  if (pointers.length >= 2) {
    const center = pointerCenter(pointers[0], pointers[1]);
    const centerStage = relativeStagePoint(mapGesture.stage, center);
    const distance = Math.max(1, pointerDistance(pointers[0], pointers[1]));
    const zoom = clamp(mapGesture.startZoom * (distance / mapGesture.startDistance), mapZoomLimits.min, mapZoomLimits.max);
    const stageRect = mapGesture.stage.getBoundingClientRect();
    const baseDisplay = baseAreaMapDisplay(areaId, stageRect);
    const displayWidth = baseDisplay.width * zoom;
    const displayHeight = baseDisplay.height * zoom;
    const pan = {
      x: centerStage.x - mapGesture.startMapFocus.x * displayWidth - (stageRect.width - displayWidth) / 2,
      y: centerStage.y - mapGesture.startMapFocus.y * displayHeight - (stageRect.height - displayHeight) / 2
    };
    applyAreaMapViewport(areaId, { pan, zoom });
  } else if (pointers.length === 1) {
    const pointer = pointers[0];
    const startPoint = mapGesture.startPoints[0];
    const dx = pointer.clientX - startPoint.clientX;
    const dy = pointer.clientY - startPoint.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 4) mapGesture.moved = true;
    applyAreaMapViewport(areaId, {
      pan: { x: mapGesture.startPan.x + dx, y: mapGesture.startPan.y + dy },
      zoom: mapGesture.startZoom
    });
  }
  event.preventDefault();
  scheduleAreaMapPositionRefresh(areaId);
}

function finishAreaMapGesture(areaId, event) {
  if (!mapGesture || mapGesture.areaId !== areaId || !mapGesture.pointers.has(event.pointerId)) return;
  const stage = areaMapStage(areaId);
  mapGesture.pointers.delete(event.pointerId);
  stage.releasePointerCapture?.(event.pointerId);
  if (mapGesture.pointers.size) {
    resetMapGestureStart();
    return;
  }
  stage.classList.remove("is-dragging");
  mapGesture = null;
}

function beginMapDrag(event) {
  beginAreaMapGesture("kingdom", event);
}

function moveMapDrag(event) {
  moveAreaMapGesture("kingdom", event);
}

function finishMapDrag(event) {
  finishAreaMapGesture("kingdom", event);
}

function beginCastleMapDrag(event) {
  beginAreaMapGesture("castle", event);
}

function moveCastleMapDrag(event) {
  moveAreaMapGesture("castle", event);
}

function finishCastleMapDrag(event) {
  finishAreaMapGesture("castle", event);
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => changeView(tab.dataset.view)));
  window.addEventListener("hashchange", () => changeView(location.hash ? location.hash.slice(1) : "home"));
  elements.systemMenuButton.addEventListener("click", () => openSystemMenu(systemMenuPanel || "diary"));
  elements.systemMenuClose.addEventListener("click", closeSystemMenu);
  elements.systemMenu.addEventListener("click", (event) => {
    if (event.target.matches("[data-system-close]")) closeSystemMenu();
  });
  elements.systemMenuTabs.forEach((tab) => tab.addEventListener("click", () => changeSystemPanel(tab.dataset.menuPanel)));
  elements.goMapButton?.addEventListener("click", () => openArea("kingdom"));
  elements.returnHomeButton.addEventListener("click", () => openArea("castle"));
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
    if (!window.confirm("Clear Lumi's diary pages?")) return;
    state.diary = [];
    persist();
    render();
  });
  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset Lumi's coins, clothes, quests, and diary?")) return;
    resetProgress();
  });
  elements.openaiSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
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
  window.addEventListener("resize", () => {
    if (elements.mapStage?.offsetParent !== null) renderMap();
    if (elements.castleStage?.offsetParent !== null) renderCastleMap();
  });
  elements.castleStage?.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("castle", -1);
    } else if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnCastleMap(1, 0);
    } else if ((event.key === "Enter" || event.key === " ") && activeCastleHotspot) {
      event.preventDefault();
      event.stopPropagation();
      interactCastleHotspot();
    }
  });
  elements.castleStage?.addEventListener("pointerdown", beginCastleMapDrag);
  elements.castleStage?.addEventListener("pointermove", moveCastleMapDrag);
  elements.castleStage?.addEventListener("pointerup", finishCastleMapDrag);
  elements.castleStage?.addEventListener("pointercancel", finishCastleMapDrag);
  elements.mapStage.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("kingdom", 1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      event.stopPropagation();
      zoomAreaMapFromKeyboard("kingdom", -1);
    } else if (event.key === "ArrowUp" || key === "w") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, -1);
    } else if (event.key === "ArrowDown" || key === "s") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(0, 1);
    } else if (event.key === "ArrowLeft" || key === "a") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(-1, 0);
    } else if (event.key === "ArrowRight" || key === "d") {
      event.preventDefault();
      event.stopPropagation();
      moveOnMap(1, 0);
    } else if ((event.key === "Enter" || event.key === " ") && activeHotspot) {
      event.preventDefault();
      event.stopPropagation();
      interactNearby();
    }
  });
  elements.mapStage.addEventListener("pointerdown", beginMapDrag);
  elements.mapStage.addEventListener("pointermove", moveMapDrag);
  elements.mapStage.addEventListener("pointerup", finishMapDrag);
  elements.mapStage.addEventListener("pointercancel", finishMapDrag);
  window.addEventListener("keydown", (event) => {
    if (isSystemMenuOpen()) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSystemMenu();
      }
      return;
    }
    if (!elements.advModal.classList.contains("show")) {
      if (
        (event.key === "Enter" || event.key === " ") &&
        elements.mapStage?.offsetParent !== null &&
        activeHotspot
      ) {
        event.preventDefault();
        interactNearby();
        return;
      }
      if ((event.key === "g" || event.key === "G") && elements.homeView?.classList.contains("active")) {
        event.preventDefault();
        openArea("kingdom");
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
    if ((event.key === "b" || event.key === "B") && advMode === "shop") {
      event.preventDefault();
      buyItemInAdv(itemById(shopPreviewItemId));
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
    if (castleMapNodes[nodeId]) {
      state.area = "castle";
      state.playerNode = nodeId;
      state.player = { x: castleMapNodes[nodeId].x, y: castleMapNodes[nodeId].y };
      persist();
      changeView("home");
      return;
    }
    if (!mapNodes[nodeId]) throw new Error("Unknown node");
    state.area = "kingdom";
    state.playerNode = nodeId;
    state.player = { x: mapNodes[nodeId].x, y: mapNodes[nodeId].y };
    persist();
    renderMap();
  },
  focusCastle: (place = "princessRoom") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "castle") throw new Error("Unknown castle hotspot");
    openArea("castle");
    focusCastleHotspot(hotspot.id);
  },
  focusKingdom: (place = "garden") => {
    const hotspot = hotspotById(place);
    if (!hotspot || areaForHotspot(hotspot) !== "kingdom") throw new Error("Unknown kingdom hotspot");
    openArea("kingdom");
    focusTravelHotspot(hotspot.id);
  },
  setMapViewport: (areaId, viewport = {}) => {
    if (!areaRegistry[areaId]) throw new Error("Unknown area");
    applyAreaMapViewport(areaId, {
      pan: viewport.pan || { x: Number(viewport.x) || 0, y: Number(viewport.y) || 0 },
      zoom: Number(viewport.zoom) || 1
    });
    refreshAreaMapPositions(areaId);
  },
  getMapMetrics: (areaId = state.area) => {
    if (!areaRegistry[areaId]) throw new Error("Unknown area");
    return areaMapMetrics(areaId);
  },
  openArea,
  openRoomScene: () => openRoomScene(hotspotById("princessRoom")),
  openShopScene: (place = "boutique") => openSceneAdv(hotspotById(place)),
  openShopDetail: (place = "boutique") => openShopDetail(hotspotById(place)),
  openWardrobeDetail,
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

function runVisualQaIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "visual-qa") return;
  const surface = params.get("surface") || "map";
  const place = params.get("place") || state.activeQuest?.place || "garden";
  if (params.get("fresh") === "1") state = freshState();
  const hotspot = hotspotById(place) || hotspotById("garden");
  const node = mapNodes[hotspot.node];
  const coins = Number(params.get("coins"));
  if (Number.isFinite(coins)) state.coins = Math.max(0, coins);

  if (surface === "castle-map") {
    render();
    openArea("castle");
    return;
  }

  if (surface === "princess-room-scene") {
    render();
    openRoomScene(hotspotById("princessRoom"));
    return;
  }

  if (surface === "wardrobe-detail") {
    render();
    openRoomScene(hotspotById("princessRoom"));
    openWardrobeDetail(params.get("category") || "outfit");
    return;
  }

  if (surface === "kingdom-map") {
    render();
    openArea("kingdom");
    return;
  }

  if (surface === "map-near") {
    state.activeQuest = createQuestForPlace(hotspot.id);
    state.playerNode = hotspot.node;
    state.player = { x: node.x, y: node.y };
    render();
    changeView("map");
    return;
  }

  if (surface === "quest") {
    state.activeQuest = createQuestForPlace(hotspot.id);
    render();
    openQuestAdv(hotspot);
    return;
  }

  if (surface === "shop-scene") {
    render();
    openSceneAdv(hotspot);
    return;
  }

  if (surface === "shop" || surface === "shop-detail") {
    render();
    openShopDetail(hotspot);
    const item = itemById(params.get("item"));
    if (item && allowedShopCategories(hotspot).includes(item.type)) {
      shopPreviewItemId = item.id;
      renderAdvShop(true);
    }
    return;
  }

  if (surface === "hint") {
    state.activeQuest = createRandomQuest(hotspot.id);
    render();
    openHintAdv(hotspot);
    return;
  }

  if (surface === "shop-feedback") {
    render();
    openShopDetail(hotspot);
    const item = itemById(params.get("item")) || shopItems.find((candidate) => allowedShopCategories(hotspot).includes(candidate.type) && !state.owned.includes(candidate.id));
    if (item) {
      state.coins = Math.max(state.coins, item.cost);
      shopPreviewItemId = item.id;
      renderAdvShop(true);
      buyItemInAdv(item);
    }
    return;
  }

  if (["diary", "settings", "save"].includes(surface)) {
    render();
    openSystemMenu(surface);
    return;
  }

  render();
}

runVisualQaIfRequested();

function runMonkeyTestIfRequested() {
  const params = new URLSearchParams(location.search);
  if (params.get("selftest") !== "monkey") return;
  const errors = [];
  const actions = [
    () => changeView(["home", "map"][Math.floor(Math.random() * 2)]),
    () => openSystemMenu(["diary", "settings", "save"][Math.floor(Math.random() * 3)]),
    () => closeSystemMenu(),
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
    },
    () => {
      const visibleButtons = [...document.querySelectorAll("button")].filter((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        const nativeDialogButtons = new Set(["saveButton", "loadButton", "clearDiaryButton", "resetButton"]);
        return !nativeDialogButtons.has(button.id) && !button.disabled && rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
      if (visibleButtons.length) visibleButtons[Math.floor(Math.random() * visibleButtons.length)].click();
    },
    () => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "g", "1", "2", "3", "Escape"];
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: keys[Math.floor(Math.random() * keys.length)],
        bubbles: true
      }));
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
