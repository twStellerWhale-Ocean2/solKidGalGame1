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

//#region 衣櫃圖層對位契約
// 所有正式穿戴素材維持 512x768 透明畫布；render bounds 因此預設全畫布，避免二次縮放。
// safeBox 是素材透明像素應落入的類別級範圍，供 data-audit 檢查 GPT 童話手繪 bitmap 是否對齊角色 rig。
const fullCanvasBounds = Object.freeze({ left: 0, top: 0, right: 0, bottom: 0 });

const layerBounds = (safeBox) => Object.freeze({
  ...fullCanvasBounds,
  safeBox: Object.freeze(safeBox)
});

export const wardrobeLayerBoundsByType = Object.freeze({
  hairstyle: layerBounds({ left: 168, top: 280, right: 352, bottom: 570 }),
  top: layerBounds({ left: 150, top: 390, right: 370, bottom: 570 }),
  bottom: layerBounds({ left: 160, top: 510, right: 360, bottom: 690 }),
  dress: layerBounds({ left: 145, top: 405, right: 375, bottom: 730 }),
  outer: layerBounds({ left: 145, top: 385, right: 375, bottom: 660 }),
  shoes: layerBounds({ left: 216, top: 720, right: 300, bottom: 768 }),
  headTop: layerBounds({ left: 190, top: 270, right: 330, bottom: 365 }),
  headSide: layerBounds({ left: 280, top: 335, right: 345, bottom: 420 }),
  faceEyes: layerBounds({ left: 205, top: 335, right: 315, bottom: 390 }),
  faceMask: layerBounds({ left: 205, top: 335, right: 315, bottom: 392 }),
  neck: layerBounds({ left: 210, top: 385, right: 310, bottom: 470 }),
  hand: layerBounds({ left: 280, top: 530, right: 365, bottom: 640 })
});

export function wardrobeLayerBoundsForType(type) {
  return wardrobeLayerBoundsByType[type] || fullCanvasBounds;
}
//#endregion 衣櫃圖層對位契約
