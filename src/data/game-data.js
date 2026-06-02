import { castleArea, castleSceneConfigs } from "../areas/castle/manifest.js";
import { forestArea, forestLessons, forestQuestTemplates, forestSceneConfigs } from "../areas/forest/manifest.js";
import { kingdomArea, kingdomSceneConfigs } from "../areas/kingdom/manifest.js";
export { routeForPortal, worldRoutes } from "../areas/world.js";

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
  { id: "pinkDress", storeId: "boutique", type: "outfit", name: "Pink academy dress", cost: 0, icon: "👗", sprite: "0%", image: "assets/items/pinkDress.png" },
  { id: "blueDress", storeId: "boutique", type: "outfit", name: "Blue harbor dress", cost: 100, icon: "👗", sprite: "33.333%", image: "assets/items/blueDress.png" },
  { id: "roseDress", storeId: "boutique", type: "outfit", name: "Rose festival dress", cost: 200, icon: "👗", sprite: "66.666%", image: "assets/items/roseDress.png" },
  { id: "snowDress", storeId: "boutique", type: "outfit", name: "Snowflake gown", cost: 260, icon: "👗", sprite: "100%", image: "assets/items/snowDress.png" },
  { id: "pinkSlippers", storeId: "shoeShop", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "👞", image: "assets/items/pinkSlippers.png" },
  { id: "blueBoots", storeId: "shoeShop", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "🥾", image: "assets/items/blueBoots.png" },
  { id: "goldCrown", storeId: "accessoryShop", type: "accessory", name: "Tiny gold crown", cost: 140, icon: "👑", image: "assets/items/goldCrown.png" },
  { id: "silkRibbon", storeId: "accessoryShop", type: "accessory", name: "Silk party ribbon", cost: 120, icon: "🎀", image: "assets/items/silkRibbon.png" },
  { id: "pearlBag", storeId: "accessoryShop", type: "accessory", name: "Pearl shell bag", cost: 170, icon: "👜", image: "assets/items/pearlBag.png" },
  { id: "starCape", storeId: "accessoryShop", type: "accessory", name: "Starry helper cape", cost: 240, icon: "✨", image: "assets/items/starCape.png" },
  { id: "studyDesk", storeId: "market", type: "room", name: "New study desk", cost: 180, icon: "🪑", image: "assets/items/studyDesk.png" },
  { id: "seaLamp", storeId: "market", type: "room", name: "Sea glass lamp", cost: 220, icon: "💡", image: "assets/items/seaLamp.png" },
  { id: "mossCloak", storeId: "dwarfCottage", type: "accessory", name: "Moss helper cloak", cost: 130, icon: "🍃", image: "assets/items/mossCloak.png" }
];

export const areaRegistry = Object.freeze({
  castle: castleArea,
  kingdom: kingdomArea,
  forest: forestArea,
  ocean: {
    id: "ocean",
    label: "Ocean",
    enabled: false,
    defaultNode: ""
  }
});

export const hotspots = kingdomArea.locations;
export const mapNodes = kingdomArea.nodes;
export const mapImageSize = kingdomArea.imageSize;
export const mapActors = kingdomArea.actors;
export const castleHotspots = castleArea.locations;
export const castleMapNodes = castleArea.nodes;
export const castleMapImageSize = castleArea.imageSize;
export const sceneConfigs = Object.freeze({
  ...kingdomSceneConfigs,
  ...castleSceneConfigs,
  ...forestSceneConfigs
});

const baseQuestTemplates = [
  { id: "harborFish", place: "harbor", title: "Buy a fish at the harbor", opening: "Good morning, Princess! We have fresh fish today.", ending: "Thank you, Princess. Dinner will be delicious tonight." },
  { id: "bakeryHelp", place: "market", title: "Help Auntie Pom at the market bakery", opening: "Hello, Princess! The apples are red and sweet.", ending: "Thank you, dear. The market stall is bright and happy again." },
  { id: "gardenCat", place: "garden", title: "Find the garden cat", opening: "Look! A small cat is under the rose.", ending: "You found the cat. The garden feels peaceful again." },
  { id: "boutiqueDress", place: "boutique", title: "Choose a blue dress", opening: "Welcome, Princess! This dress is blue.", ending: "This dress looks lovely on you, Princess." },
  { id: "shoeFitting", place: "shoeShop", title: "Find shoes for a long walk", opening: "Hello, Princess! These shoes are soft.", ending: "Now your feet are ready for the long road." },
  { id: "ribbonGift", place: "accessoryShop", title: "Pick a ribbon for the party", opening: "Good day, Princess! The ribbon is pink.", ending: "The ribbon shines softly. The party will be sweet." },
  { id: "farmCow", place: "farm", title: "Help at Sunny Farm", opening: "Good afternoon! The cow is big and kind.", ending: "The animals are calm now. Thank you for helping." },
  { id: "seaWeather", place: "lighthouse", title: "Check the sea weather", opening: "Hello, Princess! It is sunny by the sea.", ending: "Now the ships can sail safely. Well done." }
];

export const questTemplates = [...baseQuestTemplates, ...forestQuestTemplates];

const baseLessons = [
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

export const lessons = [...baseLessons, ...forestLessons];
