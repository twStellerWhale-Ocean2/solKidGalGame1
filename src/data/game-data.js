export const difficultyConfig = {
  100: { label: "Common English 100 words", reward: 1, maxTier: 100 },
  250: { label: "Common English 250 words", reward: 1.15, maxTier: 250 },
  500: { label: "Common English 500 words", reward: 1.35, maxTier: 500 },
  750: { label: "Common English 750 words", reward: 1.55, maxTier: 750 },
  1000: { label: "Common English 1000 words", reward: 1.8, maxTier: 1000 }
};

export const categories = [
  { id: "outfit", label: "Dresses" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
  { id: "room", label: "Room Treasures" }
];

export const shopItems = [
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

export const hotspots = [
  { id: "luminaraCastle", node: "castleRoom", label: "Luminara Castle", icon: "🏰", npcClass: "npc-none", npc: "Gate Guard", kind: "gate", targetArea: "castle", hint: "Climb the purple castle stairway back inside." },
  { id: "port", node: "port", label: "Harbor Port", icon: "⚓", npcClass: "npc-none", npc: "Dock Guide", scene: "scene-harbor", hint: "The docks are ready for boats and sea trips." },
  { id: "garden", node: "garden", label: "Castle Garden", icon: "🌷", npcClass: "npc-garden", npc: "Mira", scene: "scene-garden", hint: "The garden is quiet. A small cat may be hiding near the roses." },
  { id: "market", node: "market", label: "Market Square", icon: "🥖", npcClass: "npc-market", npc: "Auntie Pom", scene: "scene-market", kind: "shop", shopCategories: ["room"], defaultCategory: "room", hint: "The market has warm bread on one side and cozy room treasures on the other." },
  { id: "harbor", node: "harbor", label: "Fish Shop", icon: "🐟", npcClass: "npc-harbor", npc: "Nami", scene: "scene-harbor", hint: "The fish shop has fresh fish for dinner." },
  { id: "boutique", node: "boutique", label: "Dress Boutique", icon: "👗", npcClass: "npc-boutique", npc: "Rena", scene: "scene-boutique", kind: "shop", shopCategories: ["outfit"], defaultCategory: "outfit", hint: "Rena's boutique has dresses for doll play." },
  { id: "shoeShop", node: "shoeShop", label: "Shoe Shop", icon: "👞", npcClass: "npc-shoes", npc: "Mina", scene: "scene-shoes", kind: "shop", shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina shows shoes for long walks." },
  { id: "accessoryShop", node: "accessoryShop", label: "Accessory Shop", icon: "🎀", npcClass: "npc-accessory", npc: "Lili", scene: "scene-accessory", kind: "shop", shopCategories: ["accessory"], defaultCategory: "accessory", hint: "Lili sells crowns, ribbons, bags, and capes." },
  { id: "farm", node: "farm", label: "Sunny Farm", icon: "🐄", npcClass: "npc-farm", npc: "Theo", scene: "scene-farm", hint: "The farm is busy. Theo is brushing the big cow." },
  { id: "lighthouse", node: "lighthouse", label: "Lighthouse", icon: "🗼", npcClass: "npc-lighthouse", npc: "Captain Sol", scene: "scene-lighthouse", hint: "The lighthouse watches the sea before ships sail." }
];

export const sceneConfigs = {
  castleRoom: { scene: "scene-garden", npcClass: "npc-garden", npc: "Lumi", travelAction: "Room", travelLine: "Return to Lumi's room for dress-up time." },
  princessRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for dress-up and room treasures." },
  kingRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The king's room is reserved for a later story." },
  queenRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The queen's room will open in a later chapter." },
  castleGate: { scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "Travel", travelLine: "The castle gate leads back to the kingdom map." },
  garden: { scene: "scene-garden", npcClass: "npc-garden", npc: "Mira", travelAction: "Visit", travelLine: "Mira is watching the roses and a shy garden cat." },
  market: { scene: "scene-market", npcClass: "npc-market", npc: "Auntie Pom", travelAction: "Shop", travelLine: "Auntie Pom's market stall has warm bread and a tiny room-treasures corner.", shopGreeting: "Welcome to the room-treasures stall. Pick something cozy for Lumi's room." },
  harbor: { scene: "scene-harbor", npcClass: "npc-harbor", npc: "Nami", travelAction: "Visit", travelLine: "Nami is waiting by the bright harbor boats." },
  port: { scene: "scene-harbor", npcClass: "npc-none", npc: "Dock Guide", travelAction: "Visit", travelLine: "Boats arrive at the harbor port for sea trips and dock visits." },
  boutique: { scene: "scene-boutique", npcClass: "npc-boutique", npc: "Rena", travelAction: "Shop", travelLine: "Rena has dresses ready for a bright day.", shopGreeting: "Welcome, Princess. Outfits are ready for a bright day." },
  shoeShop: { scene: "scene-shoes", npcClass: "npc-shoes", npc: "Mina", travelAction: "Shop", travelLine: "Mina has walking shoes for Lumi's next trip.", shopGreeting: "Hello, Princess. Try shoes for the road." },
  accessoryShop: { scene: "scene-accessory", npcClass: "npc-accessory", npc: "Lili", travelAction: "Shop", travelLine: "Lili has ribbons, crowns, bags, and capes.", shopGreeting: "Good day, Princess. Pick a ribbon, crown, bag, or cape." },
  farm: { scene: "scene-farm", npcClass: "npc-farm", npc: "Theo", travelAction: "Visit", travelLine: "Theo is caring for the animals at Sunny Farm." },
  lighthouse: { scene: "scene-lighthouse", npcClass: "npc-lighthouse", npc: "Captain Sol", travelAction: "Visit", travelLine: "Captain Sol checks the sea from the lighthouse." }
};

export const mapNodes = {
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

export const mapImageSize = { width: 1672, height: 941 };

export const mapActors = [
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

export const castleMapImageSize = { width: 1312, height: 1199 };

export const castleMapNodes = {
  princessRoom: { id: "princessRoom", label: "Princess Room", x: 40.7, y: 56.5 },
  kingRoom: { id: "kingRoom", label: "King Room", x: 50.2, y: 31.5 },
  queenRoom: { id: "queenRoom", label: "Queen Room", x: 30.2, y: 52.8 },
  castleGate: { id: "castleGate", label: "Castle Gate", x: 40.7, y: 79.8 }
};

export const castleHotspots = [
  { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for dress-up, shoes, accessories, and room treasures." },
  { id: "kingRoom", area: "castle", node: "kingRoom", label: "King Room", icon: "👑", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The king's room is reserved for a future story." },
  { id: "queenRoom", area: "castle", node: "queenRoom", label: "Queen Room", icon: "💐", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The queen's room will open in a future chapter." },
  { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", targetArea: "kingdom", hint: "Go out to the kingdom travel map." }
];

export const areaRegistry = {
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

export const questTemplates = [
  { id: "harborFish", place: "harbor", title: "Buy a fish at the harbor", opening: "Good morning, Princess! We have fresh fish today.", ending: "Thank you, Princess. Dinner will be delicious tonight." },
  { id: "bakeryHelp", place: "market", title: "Help Auntie Pom at the market bakery", opening: "Hello, Princess! The apples are red and sweet.", ending: "Thank you, dear. The market stall is bright and happy again." },
  { id: "gardenCat", place: "garden", title: "Find the garden cat", opening: "Look! A small cat is under the rose.", ending: "You found the cat. The garden feels peaceful again." },
  { id: "boutiqueDress", place: "boutique", title: "Choose a blue dress", opening: "Welcome, Princess! This dress is blue.", ending: "This dress looks lovely on you, Princess." },
  { id: "shoeFitting", place: "shoeShop", title: "Find shoes for a long walk", opening: "Hello, Princess! These shoes are soft.", ending: "Now your feet are ready for the long road." },
  { id: "ribbonGift", place: "accessoryShop", title: "Pick a ribbon for the party", opening: "Good day, Princess! The ribbon is pink.", ending: "The ribbon shines softly. The party will be sweet." },
  { id: "farmCow", place: "farm", title: "Help at Sunny Farm", opening: "Good afternoon! The cow is big and kind.", ending: "The animals are calm now. Thank you for helping." },
  { id: "seaWeather", place: "lighthouse", title: "Check the sea weather", opening: "Hello, Princess! It is sunny by the sea.", ending: "Now the ships can sail safely. Well done." }
];

export const lessons = [
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
