import { castleArea, castleLessons, castleQuestTemplates, castleSceneConfigs, castleVocabularyProfile } from "../../content-package/areas/castle/manifest.js";
import { wildArea, wildLessons, wildQuestTemplates, wildSceneConfigs, wildVocabularyProfile } from "../../content-package/areas/wild/manifest.js";
import { urbanArea, urbanLessons, urbanQuestTemplates, urbanSceneConfigs, urbanVocabularyProfile } from "../../content-package/areas/urban/manifest.js";
import { ruralArea, ruralLessons, ruralQuestTemplates, ruralSceneConfigs, ruralVocabularyProfile } from "../../content-package/areas/rural/manifest.js";
export { characterScaleContract, bodyHeightPxForCm } from "./character-scale.js";
export { worldMap } from "../../content-package/areas/world.js";
export {
  categories,
  characterRegistry,
  defaultActiveCharacterId,
  outfitSlots,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  shopItems
} from "../../content-package/wardrobe/manifest.js";

export const difficultyConfig = {
  100: { label: "Common English 100 words", reward: 1, maxTier: 100 },
  250: { label: "Common English 250 words", reward: 1.15, maxTier: 250 },
  500: { label: "Common English 500 words", reward: 1.35, maxTier: 500 },
  750: { label: "Common English 750 words", reward: 1.55, maxTier: 750 },
  1000: { label: "Common English 1000 words", reward: 1.8, maxTier: 1000 }
};

export const areaRegistry = Object.freeze({
  castle: castleArea,
  urban: urbanArea,
  rural: ruralArea,
  wild: wildArea,
  ocean: {
    id: "ocean",
    label: "Ocean",
    enabled: false,
    defaultNode: ""
  }
});

export const hotspots = urbanArea.locations;
export const mapNodes = urbanArea.nodes;
export const mapImageSize = urbanArea.imageSize;
export const mapActors = urbanArea.actors;
export const castleHotspots = castleArea.locations;
export const castleMapNodes = castleArea.nodes;
export const castleMapImageSize = castleArea.imageSize;
export const sceneConfigs = Object.freeze({
  ...urbanSceneConfigs,
  ...castleSceneConfigs,
  ...ruralSceneConfigs,
  ...wildSceneConfigs
});

export const vocabularyProfiles = Object.freeze({
  [castleVocabularyProfile.id]: castleVocabularyProfile,
  [urbanVocabularyProfile.id]: urbanVocabularyProfile,
  [ruralVocabularyProfile.id]: ruralVocabularyProfile,
  [wildVocabularyProfile.id]: wildVocabularyProfile
});

export const questTemplates = [
  ...castleQuestTemplates,
  ...urbanQuestTemplates,
  ...ruralQuestTemplates,
  ...wildQuestTemplates
];

export const lessons = [
  ...castleLessons,
  ...urbanLessons,
  ...ruralLessons,
  ...wildLessons
];
