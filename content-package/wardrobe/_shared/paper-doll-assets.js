//#region 紙娃娃角色素材
// 角色本體集中在 content-package/characters；衣物 pack 只引用它作為預設縮圖與底圖。
import {
  characterAsset as registryCharacterAsset,
  characterAssetVersion,
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  isPlayableCharacterId,
  normalizeProfileColor,
  playableCharacterById,
  profileColorPalette,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomProfileColor,
  randomBackgroundPattern
} from "../../characters/manifest.js";

export const dollAssetVersion = characterAssetVersion;
export {
  characterRegistry,
  defaultActiveCharacterId,
  defaultProfileColorFor,
  isPlayableCharacterId,
  normalizeProfileColor,
  playableCharacterById,
  profileColorPalette,
  backgroundPatternIds,
  normalizeBackgroundPattern,
  randomProfileColor,
  randomBackgroundPattern
};

export const characterAsset = (name, characterId = defaultActiveCharacterId) => registryCharacterAsset(characterId, name);
export const paperDollBaseLayer = playableCharacterById(defaultActiveCharacterId).baseLayer;
//#endregion 紙娃娃角色素材

//#region 衣物資源包素材
// 每個衣物包自己的圖放在 content-package/wardrobe/<pack>/assets/，方便新增或移除整包衣物。
export const wardrobePackLayer = (packId, name) => (
  `content-package/wardrobe/${packId}/assets/layers/${name}.webp${dollAssetVersion}`
);
// #196：移除分離商店縮圖（wardrobePackThumb）——商店預覽改重用 wardrobePackLayer 單一素材。
//#endregion 衣物資源包素材
