//#region 紙娃娃角色素材
// 角色本體集中在 content-package/characters；衣物 pack 只引用它作為預設縮圖與底圖。
import {
  characterAsset as registryCharacterAsset,
  characterAssetVersion,
  characterRegistry,
  defaultActiveCharacterId,
  isPlayableCharacterId,
  playableCharacterById
} from "../../characters/manifest.js";

export const dollAssetVersion = characterAssetVersion;
export { characterRegistry, defaultActiveCharacterId, isPlayableCharacterId, playableCharacterById };

export const characterAsset = (name, characterId = defaultActiveCharacterId) => registryCharacterAsset(characterId, name);
export const paperDollBaseLayer = playableCharacterById(defaultActiveCharacterId).baseLayer;
//#endregion 紙娃娃角色素材

//#region 衣物資源包素材
// 每個衣物包自己的圖放在 content-package/wardrobe/<pack>/assets/，方便新增或移除整包衣物。
export const wardrobePackLayer = (packId, name) => (
  `content-package/wardrobe/${packId}/assets/layers/${name}.webp${dollAssetVersion}`
);

export const wardrobePackThumb = (packId, name) => (
  `content-package/wardrobe/${packId}/assets/thumbs/${name}.webp${dollAssetVersion}`
);
//#endregion 衣物資源包素材
