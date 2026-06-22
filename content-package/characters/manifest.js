//#region 可玩紙娃娃角色
// 角色本體集中在 content-package/characters；衣物 layer 仍共用同一個 512x768 rig。
// issue #214：立繪拆為「共用 body（neck-down＋永久肌膚安全底著）＋ per-character head（臉＋預設髮＝識別）」
// 分層合成——四位公主共用同一張 body.webp，各自一張 assets/head.webp；衣物與髮型 wardrobe layer 疊於其上，
// 髮型 layer 須完全覆蓋 head 預設髮，使換衣／換髮舊層不殘留（消除昔日 baked-in base 不可移除之雙重疊圖）。
export const characterAssetVersion = "?v=20260621-issue214-body-head";
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

// issue #214：四位可玩公主共用同一張 neck-down body（含永久肌膚安全底著），不分角色。
export const sharedBodyLayer = `content-package/characters/body.webp${characterAssetVersion}`;

// issue #131：識別色色盤由 16 高飽和色改為 8 種低飽和粉彩色（spec#6）。
// 8 色橫跨色相環、彼此可辨識（spec#8 多帳號辨識）。玩家亦可用調色器自訂任一色（見 normalizeProfileColor）。
export const profileColorPalette = Object.freeze([
  "#fda4af", // rose
  "#fdba74", // peach
  "#fcd34d", // amber
  "#86efac", // mint
  "#5eead4", // teal
  "#93c5fd", // sky
  "#c4b5fd", // lavender
  "#f0abfc"  // lilac
]);

// issue #131：合法 hex（#rgb / #rrggbb）即接受，使調色器自訂色可存活、且舊存檔既有識別色（含舊 16 色盤值）原值保留、不被重置。
const PROFILE_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export function isValidProfileColor(color) {
  return typeof color === "string" && PROFILE_COLOR_RE.test(color.trim());
}

export const characterRegistry = Object.freeze({
  lumi: Object.freeze({
    id: "lumi",
    label: "Princess Lumi",
    defaultName: "Lumi",
    baseLayer: sharedBodyLayer,
    headLayer: characterAsset("lumi", "head"),
    defaultProfileColor: "#fda4af",
    defaultOutfit: Object.freeze({ hairstyle: "none", outfit: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  yumi: Object.freeze({
    id: "yumi",
    label: "Princess Yumi",
    defaultName: "Yumi",
    baseLayer: sharedBodyLayer,
    headLayer: characterAsset("yumi", "head"),
    defaultProfileColor: "#93c5fd",
    defaultOutfit: Object.freeze({ hairstyle: "none", outfit: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  sol: Object.freeze({
    id: "sol",
    label: "Princess Mary",
    defaultName: "Mary",
    baseLayer: sharedBodyLayer,
    headLayer: characterAsset("sol", "head"),
    defaultProfileColor: "#fcd34d",
    defaultOutfit: Object.freeze({ hairstyle: "none", outfit: "none" }),
    naturalHeightCm: 125,
    stageScale: 1.2,
    rig: sharedPaperDollRig
  }),
  rosa: Object.freeze({
    id: "rosa",
    label: "Princess Rosa",
    defaultName: "Rosa",
    baseLayer: sharedBodyLayer,
    headLayer: characterAsset("rosa", "head"),
    defaultProfileColor: "#86efac",
    defaultOutfit: Object.freeze({ hairstyle: "none", outfit: "none" }),
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

export function randomProfileColor() {
  return profileColorPalette[Math.floor(Math.random() * profileColorPalette.length)] || profileColorPalette[0];
}

export function normalizeProfileColor(color, characterId = defaultActiveCharacterId) {
  return isValidProfileColor(color) ? color.trim() : defaultProfileColorFor(characterId);
}

// issue #131：背景花紋集（spec#6）。"none" 為預設無花紋；其餘 8 種與識別色組成公主視覺主題、套用於識別卡半透明背版。
export const backgroundPatternIds = Object.freeze([
  "none", "wave", "bubble", "grid", "dots", "stripes", "checks", "diamonds", "confetti"
]);

export function normalizeBackgroundPattern(pattern) {
  return backgroundPatternIds.includes(pattern) ? pattern : "none";
}

export function randomBackgroundPattern() {
  const visiblePatterns = backgroundPatternIds.filter((pattern) => pattern !== "none");
  return visiblePatterns[Math.floor(Math.random() * visiblePatterns.length)] || "none";
}

export function isPlayableCharacterId(characterId) {
  return Boolean(characterRegistry[characterId]);
}
//#endregion 可玩紙娃娃角色
