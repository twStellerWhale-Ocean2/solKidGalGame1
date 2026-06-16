//#region 可玩紙娃娃角色
// 角色本體集中在 content-package/characters；衣物 layer 仍共用同一個 512x768 rig。
export const characterAssetVersion = "?v=20260616-base-portrait-r1";
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

export const profileColorPalette = Object.freeze([
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b"
]);

export const characterRegistry = Object.freeze({
  lumi: Object.freeze({
    id: "lumi",
    label: "Princess Lumi",
    defaultName: "Lumi",
    baseLayer: characterAsset("lumi", "base"),
    defaultProfileColor: "#ef4444",
    defaultOutfit: Object.freeze({ hairstyle: "none", dress: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  yumi: Object.freeze({
    id: "yumi",
    label: "Princess Yumi",
    defaultName: "Yumi",
    baseLayer: characterAsset("yumi", "base"),
    defaultProfileColor: "#3b82f6",
    defaultOutfit: Object.freeze({ hairstyle: "none", dress: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  sol: Object.freeze({
    id: "sol",
    label: "Princess Sol",
    defaultName: "Sol",
    baseLayer: characterAsset("sol", "base"),
    defaultProfileColor: "#eab308",
    defaultOutfit: Object.freeze({ hairstyle: "none", dress: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  rosa: Object.freeze({
    id: "rosa",
    label: "Princess Rosa",
    defaultName: "Rosa",
    baseLayer: characterAsset("rosa", "base"),
    defaultProfileColor: "#22c55e",
    defaultOutfit: Object.freeze({ hairstyle: "none", dress: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  })
});

export function playableCharacterById(characterId) {
  return characterRegistry[characterId] || characterRegistry[defaultActiveCharacterId];
}

export function defaultProfileColorFor(characterId) {
  return playableCharacterById(characterId).defaultProfileColor || profileColorPalette[0];
}

export function normalizeProfileColor(color, characterId = defaultActiveCharacterId) {
  return profileColorPalette.includes(color) ? color : defaultProfileColorFor(characterId);
}

export function isPlayableCharacterId(characterId) {
  return Boolean(characterRegistry[characterId]);
}
//#endregion 可玩紙娃娃角色
