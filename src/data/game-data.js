import { castleArea, castleLessons, castleQuestTemplates, castleSceneConfigs, castleVocabularyProfile } from "../areas/castle/manifest.js";
import { forestArea, forestLessons, forestQuestTemplates, forestSceneConfigs, forestVocabularyProfile } from "../areas/forest/manifest.js";
import { kingdomArea, kingdomLessons, kingdomQuestTemplates, kingdomSceneConfigs, kingdomVocabularyProfile } from "../areas/kingdom/manifest.js";
import { suburbArea, suburbLessons, suburbQuestTemplates, suburbSceneConfigs, suburbVocabularyProfile } from "../areas/suburb/manifest.js";
export { routeForPortal, worldRoutes } from "../areas/world.js";
export {
  categories,
  outfitSlots,
  paperDollBaseLayer,
  paperDollLayerOrder,
  shopItems
} from "./shop-data.js";

export const difficultyConfig = {
  100: { label: "Common English 100 words", reward: 1, maxTier: 100 },
  250: { label: "Common English 250 words", reward: 1.15, maxTier: 250 },
  500: { label: "Common English 500 words", reward: 1.35, maxTier: 500 },
  750: { label: "Common English 750 words", reward: 1.55, maxTier: 750 },
  1000: { label: "Common English 1000 words", reward: 1.8, maxTier: 1000 }
};

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
