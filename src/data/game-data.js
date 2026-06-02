import { castleArea, castleLessons, castleQuestTemplates, castleSceneConfigs, castleVocabularyProfile } from "../areas/castle/manifest.js";
import { forestArea, forestLessons, forestQuestTemplates, forestSceneConfigs, forestVocabularyProfile } from "../areas/forest/manifest.js";
import { kingdomArea, kingdomLessons, kingdomQuestTemplates, kingdomSceneConfigs, kingdomVocabularyProfile } from "../areas/kingdom/manifest.js";
import { suburbArea, suburbLessons, suburbQuestTemplates, suburbSceneConfigs, suburbVocabularyProfile } from "../areas/suburb/manifest.js";
export { routeForPortal, worldRoutes } from "../areas/world.js";

export const difficultyConfig = {
  100: { label: "Common English 100 words", reward: 1, maxTier: 100 },
  250: { label: "Common English 250 words", reward: 1.15, maxTier: 250 },
  500: { label: "Common English 500 words", reward: 1.35, maxTier: 500 },
  750: { label: "Common English 750 words", reward: 1.55, maxTier: 750 },
  1000: { label: "Common English 1000 words", reward: 1.8, maxTier: 1000 }
};

const dollAssetVersion = "?v=20260602-issue53";

export const paperDollBaseLayer = `assets/doll/lumi/v3/layers/base-starter-pajama.webp${dollAssetVersion}`;

export const paperDollLayerOrder = [
  "outerBack",
  "base",
  "hairstyle",
  "dress",
  "bottom",
  "top",
  "outerFront",
  "shoes",
  "neck",
  "hand",
  "headTop",
  "headSide",
  "faceEyes",
  "faceMask"
];

export const outfitSlots = [
  "hairstyle",
  "top",
  "bottom",
  "dress",
  "outer",
  "shoes",
  "headTop",
  "headSide",
  "faceEyes",
  "faceMask",
  "neck",
  "hand",
  "room"
];

export const categories = [
  { id: "hairstyle", label: "Hair", types: ["hairstyle"] },
  { id: "top", label: "Tops", types: ["top"] },
  { id: "bottom", label: "Bottoms", types: ["bottom"] },
  { id: "dress", label: "Dresses", types: ["dress"] },
  { id: "outer", label: "Outerwear", types: ["outer"] },
  { id: "shoes", label: "Shoes", types: ["shoes"] },
  { id: "accessory", label: "Accessories", types: ["headTop", "headSide", "faceEyes", "faceMask", "neck", "hand"] },
  { id: "room", label: "Room Treasures", types: ["room"] }
];

const dollLayer = (name) => `assets/doll/lumi/v3/layers/${name}.webp${dollAssetVersion}`;
const dollThumb = (name) => `assets/doll/lumi/v3/thumbs/${name}.webp${dollAssetVersion}`;
const dollSource = (name) => `assets/doll/lumi/v3/sources/${name}-source.png`;
const layer = (slot, name) => ({ slot, src: dollLayer(name) });

export const shopItems = [
  { id: "softBrownHair", storeId: "starter", type: "hairstyle", name: "Soft brown hair", cost: 0, icon: "💇", image: dollThumb("base-starter-pajama"), source: dollSource("base-starter-pajama"), layers: [] },
  { id: "starterPajama", storeId: "starter", type: "dress", name: "Pink-white cotton pajama", cost: 0, icon: "🌙", image: dollThumb("base-starter-pajama"), source: dollSource("base-starter-pajama"), layers: [] },
  { id: "twinBraidHair", storeId: "boutique", type: "hairstyle", name: "Twin-braid story hair", cost: 110, icon: "💇", image: dollThumb("hairstyle-twin-braid"), source: dollSource("hairstyle-twin-braid"), layers: [layer("hairstyle", "hairstyle-twin-braid")] },
  { id: "blondeBobHair", storeId: "boutique", type: "hairstyle", name: "Blonde bob story hair", cost: 130, icon: "💇", image: dollThumb("hairstyle-blonde-bob"), source: dollSource("hairstyle-blonde-bob"), layers: [layer("hairstyle", "hairstyle-blonde-bob")] },
  { id: "skyBlouse", storeId: "boutique", type: "top", name: "Sky blue puff blouse", cost: 100, icon: "👚", image: dollThumb("top-sky-blouse"), source: dollSource("top-sky-blouse"), layers: [layer("top", "top-sky-blouse")] },
  { id: "peachSailorTop", storeId: "boutique", type: "top", name: "Peach sailor top", cost: 120, icon: "👚", image: dollThumb("top-peach-sailor"), source: dollSource("top-peach-sailor"), layers: [layer("top", "top-peach-sailor")] },
  { id: "navyShorts", storeId: "boutique", type: "bottom", name: "Navy story shorts", cost: 90, icon: "🩳", image: dollThumb("bottom-navy-shorts"), source: dollSource("bottom-navy-shorts"), layers: [layer("bottom", "bottom-navy-shorts")] },
  { id: "roseSkirt", storeId: "boutique", type: "bottom", name: "Rose ribbon skirt", cost: 110, icon: "👗", image: dollThumb("bottom-rose-skirt"), source: dollSource("bottom-rose-skirt"), layers: [layer("bottom", "bottom-rose-skirt")] },
  { id: "blueDress", storeId: "boutique", type: "dress", name: "Blue harbor dress", cost: 100, icon: "👗", image: dollThumb("dress-blue-harbor"), source: dollSource("dress-blue-harbor"), layers: [layer("dress", "dress-blue-harbor")] },
  { id: "roseDress", storeId: "boutique", type: "dress", name: "Rose festival dress", cost: 200, icon: "👗", image: dollThumb("dress-rose-festival"), source: dollSource("dress-rose-festival"), layers: [layer("dress", "dress-rose-festival")] },
  { id: "snowDress", storeId: "boutique", type: "dress", name: "Snowflake gown", cost: 260, icon: "👗", image: dollThumb("dress-snowflake-gown"), source: dollSource("dress-snowflake-gown"), layers: [layer("dress", "dress-snowflake-gown")] },
  { id: "yellowCardigan", storeId: "boutique", type: "outer", name: "Little yellow cardigan", cost: 150, icon: "🧥", image: dollThumb("outer-yellow-cardigan"), source: dollSource("outer-yellow-cardigan"), layers: [layer("outerFront", "outer-yellow-cardigan")] },
  { id: "pinkSlippers", storeId: "shoeShop", type: "shoes", name: "Ribbon walking shoes", cost: 90, icon: "👞", image: dollThumb("shoes-pink-ribbon"), source: dollSource("shoes-pink-ribbon"), layers: [layer("shoes", "shoes-pink-ribbon")] },
  { id: "blueBoots", storeId: "shoeShop", type: "shoes", name: "Blue seaside boots", cost: 150, icon: "🥾", image: dollThumb("shoes-blue-boots"), source: dollSource("shoes-blue-boots"), layers: [layer("shoes", "shoes-blue-boots")] },
  { id: "goldCrown", storeId: "accessoryShop", type: "headTop", name: "Tiny gold crown", cost: 140, icon: "👑", image: dollThumb("headtop-gold-crown"), source: dollSource("headtop-gold-crown"), layers: [layer("headTop", "headtop-gold-crown")] },
  { id: "silkRibbon", storeId: "accessoryShop", type: "headSide", name: "Silk party ribbon", cost: 120, icon: "🎀", image: dollThumb("headside-silk-ribbon"), source: dollSource("headside-silk-ribbon"), layers: [layer("headSide", "headside-silk-ribbon")] },
  { id: "roundGlasses", storeId: "accessoryShop", type: "faceEyes", name: "Round storybook glasses", cost: 120, icon: "👓", image: dollThumb("faceeyes-round-glasses"), source: dollSource("faceeyes-round-glasses"), layers: [layer("faceEyes", "faceeyes-round-glasses")] },
  { id: "starMask", storeId: "accessoryShop", type: "faceMask", name: "Lavender star mask", cost: 160, icon: "✦", image: dollThumb("facemask-star-mask"), source: dollSource("facemask-star-mask"), layers: [layer("faceMask", "facemask-star-mask")] },
  { id: "pearlNecklace", storeId: "accessoryShop", type: "neck", name: "Pearl heart necklace", cost: 150, icon: "📿", image: dollThumb("neck-pearl-necklace"), source: dollSource("neck-pearl-necklace"), layers: [layer("neck", "neck-pearl-necklace")] },
  { id: "pearlBag", storeId: "accessoryShop", type: "hand", name: "Pearl shell bag", cost: 170, icon: "👜", image: dollThumb("hand-pearl-bag"), source: dollSource("hand-pearl-bag"), layers: [layer("hand", "hand-pearl-bag")] },
  { id: "starCape", storeId: "boutique", type: "outer", name: "Starry helper cape", cost: 240, icon: "✨", image: dollThumb("outer-starry-cape"), source: dollSource("outer-starry-cape"), layers: [layer("outerFront", "outer-starry-cape")] },
  { id: "studyDesk", storeId: "market", type: "room", name: "New study desk", cost: 180, icon: "🪑", image: "assets/items/studyDesk.png" },
  { id: "seaLamp", storeId: "market", type: "room", name: "Sea glass lamp", cost: 220, icon: "💡", image: "assets/items/seaLamp.png" },
  { id: "mossCloak", storeId: "dwarfCottage", type: "outer", name: "Moss helper cloak", cost: 130, icon: "🍃", image: dollThumb("outer-moss-cloak"), source: dollSource("outer-moss-cloak"), layers: [layer("outerFront", "outer-moss-cloak")] }
];

export const areaRegistry = Object.freeze({
  castle: castleArea,
  kingdom: kingdomArea,
  suburb: suburbArea,
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
  ...suburbSceneConfigs,
  ...forestSceneConfigs
});

export const vocabularyProfiles = Object.freeze({
  [castleVocabularyProfile.id]: castleVocabularyProfile,
  [kingdomVocabularyProfile.id]: kingdomVocabularyProfile,
  [suburbVocabularyProfile.id]: suburbVocabularyProfile,
  [forestVocabularyProfile.id]: forestVocabularyProfile
});

export const questTemplates = [
  ...castleQuestTemplates,
  ...kingdomQuestTemplates,
  ...suburbQuestTemplates,
  ...forestQuestTemplates
];

export const lessons = [
  ...castleLessons,
  ...kingdomLessons,
  ...suburbLessons,
  ...forestLessons
];
