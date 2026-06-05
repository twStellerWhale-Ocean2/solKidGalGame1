//#region 紙娃娃疊圖順序
// layerOrder 是渲染順序；新增 slot 時要同步檢查 CSS z-index 與 outfit state。
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
//#endregion 紙娃娃疊圖順序

//#region 可裝備欄位
// outfitSlots 是存檔與狀態正規化會使用的欄位清單。
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
//#endregion 可裝備欄位
