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

// targetBox（選配，#176）：素材有效內容應投影到的畫布矩形（canvas 座標 left/top/right/bottom）。
// 設定後渲染改以畫布相對百分比把任意尺寸素材 contain-fit 進此矩形；未設定則沿用 render bounds（px inset）舊行為。
const layerBounds = (safeBox, renderBounds = fullCanvasBounds, targetBox = null) => Object.freeze({
  ...renderBounds,
  safeBox: Object.freeze(safeBox),
  ...(targetBox ? { targetBox: Object.freeze({ ...targetBox }) } : {})
});

export const wardrobeLayerBoundsByType = Object.freeze({
  hairstyle: layerBounds({ left: 168, top: 280, right: 352, bottom: 570 }, { left: -6, top: -23, right: 6, bottom: 23 }),
  top: layerBounds({ left: 149, top: 389, right: 369, bottom: 569 }, { left: -4, top: -9, right: 4, bottom: 9 }),
  bottom: layerBounds({ left: 161, top: 459, right: 361, bottom: 666 }, { left: -6, top: -32, right: 6, bottom: 32 }),
  dress: layerBounds({ left: 145, top: 405, right: 375, bottom: 730 }, { left: -5, top: -19, right: 5, bottom: 19 }),
  outer: layerBounds({ left: 145, top: 385, right: 375, bottom: 660 }, { left: -4, top: -16, right: 4, bottom: 16 }),
  shoes: layerBounds({ left: 216, top: 720, right: 300, bottom: 768 }, { left: -4, top: -3, right: 4, bottom: 3 }),
  headTop: layerBounds({ left: 190, top: 270, right: 330, bottom: 365 }, { left: -4, top: -14, right: 4, bottom: 14 }),
  headSide: layerBounds({ left: 280, top: 335, right: 345, bottom: 420 }, { left: -10, top: -8, right: 10, bottom: 8 }),
  faceEyes: layerBounds({ left: 205, top: 335, right: 315, bottom: 390 }, { left: 0, top: 12, right: 0, bottom: -12 }),
  faceMask: layerBounds({ left: 205, top: 335, right: 315, bottom: 392 }, { left: -6, top: -5, right: 6, bottom: 5 }),
  neck: layerBounds({ left: 210, top: 385, right: 310, bottom: 470 }),
  hand: layerBounds({ left: 280, top: 530, right: 365, bottom: 640 })
});

export function wardrobeLayerBoundsForType(type) {
  return wardrobeLayerBoundsByType[type] || fullCanvasBounds;
}
//#endregion 衣櫃圖層對位契約
