//#region 紙娃娃角色素材
// 角色本體集中在 content-package/characters；衣物 pack 只引用它作為預設縮圖與底圖。
export const dollAssetVersion = "?v=20260605-wardrobe-packs";
export const activePaperDollCharacter = "lumi";

export const characterAsset = (name) => (
  `content-package/characters/${activePaperDollCharacter}/assets/${name}.webp${dollAssetVersion}`
);

export const paperDollBaseLayer = characterAsset("base");
export const paperDollCharacterThumb = characterAsset("thumb");
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
