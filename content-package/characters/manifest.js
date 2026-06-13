//#region 可玩紙娃娃角色
// 角色本體集中在 content-package/characters；衣物 layer 仍共用同一個 512x768 rig。
export const characterAssetVersion = "?v=20260606-character-scale-r1";
export const defaultActiveCharacterId = "lumi";
export const sharedPaperDollRig = Object.freeze({
  id: "shared-512x768-v1",
  canvasWidth: 512,
  canvasHeight: 768,
  groundBaselineY: 768,
  fullCanvasHeightCm: 200,
  compatibleWardrobeRig: true
});

export const characterAsset = (characterId, name) => (
  `content-package/characters/${characterId}/assets/${name}.webp${characterAssetVersion}`
);

export const characterRegistry = Object.freeze({
  lumi: Object.freeze({
    id: "lumi",
    label: "Princess Lumi",
    defaultName: "Lumi",
    baseLayer: characterAsset("lumi", "base"),
    thumbImage: characterAsset("lumi", "thumb"),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  yumi: Object.freeze({
    id: "yumi",
    label: "Princess Yumi",
    defaultName: "Yumi",
    baseLayer: characterAsset("yumi", "base"),
    thumbImage: characterAsset("yumi", "thumb"),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  sol: Object.freeze({
    id: "sol",
    label: "Princess Sol",
    defaultName: "Sol",
    baseLayer: characterAsset("sol", "base"),
    thumbImage: characterAsset("sol", "thumb"),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  })
});

export function playableCharacterById(characterId) {
  return characterRegistry[characterId] || characterRegistry[defaultActiveCharacterId];
}

export function isPlayableCharacterId(characterId) {
  return Boolean(characterRegistry[characterId]);
}
//#endregion 可玩紙娃娃角色
