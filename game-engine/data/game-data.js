import { castleArea, castleSceneConfigs, castleVocabularyProfile } from "../../content-package/areas/castle/manifest.js";
import { wildArea, wildSceneConfigs, wildVocabularyProfile } from "../../content-package/areas/wild/manifest.js";
import { urbanArea, urbanSceneConfigs, urbanVocabularyProfile } from "../../content-package/areas/urban/manifest.js";
import { ruralArea, ruralSceneConfigs, ruralVocabularyProfile } from "../../content-package/areas/rural/manifest.js";
export { characterScaleContract, bodyHeightPxForCm } from "./character-scale.js";
export { worldMap } from "../../content-package/areas/world.js";
export {
  categories,
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  outfitSlots,
  paperDollBaseLayer,
  paperDollLayerOrder,
  playableCharacterById,
  isPlayableCharacterId,
  normalizeProfileColor,
  profileColorPalette,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  shopItems
} from "../../content-package/wardrobe/manifest.js";
export {
  composeVoiceProfile,
  resolveVoiceProfile,
  voiceProfileForNpcName,
  voiceProfileForCharacterId,
  DEFAULT_VOICE_PROFILE,
  npcVoiceByName,
  playableVoiceById,
  VOICE_DIMENSIONS,
  voiceCatalogVersion
} from "../../content-package/voice/manifest.js";

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

// issue #96：任務模板由「場景自帶題庫」就地導出（外框與題目同一塊），不再維護獨立的 questTemplates 註冊表。
export const questTemplates = Object.entries(sceneConfigs)
  .filter(([, config]) => config.lesson)
  .map(([place, config]) => ({
    id: `${place}Help`,
    place,
    title: config.lesson.title,
    opening: config.lesson.opening,
    openingZh: config.lesson.openingZh,
    ending: config.lesson.ending
  }));
