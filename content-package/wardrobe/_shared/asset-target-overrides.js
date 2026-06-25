// 人工校準的 per-item targetBox 覆寫（由 Wardrobe Tuner「② 單品框」匯出）。
//
// 鍵為 `<packId>/<assetName>`，值為 canvas 512x768 座標的目標矩形
// { left, top, right, bottom }；選配 corners 為四角相對矩形角的 px 偏移。
//
// 本輪衣物資源包重作只負責產出穿戴視角素材；位置大小由後續人工調整。
export const assetTargetOverrides = Object.freeze({
  "urban/hairstyle-ribbon-long-straight": { left: 175, top: 268, right: 348, bottom: 465 },
  "urban/hairstyle-side-braid": { left: 173, top: 269, right: 343, bottom: 478 },
  "urban/outfit-grey-blue-town-dress": { left: 153, top: 392, right: 359, bottom: 619 },
  "urban/outfit-milk-tea-tailored-coat": { left: 141, top: 381, right: 371, bottom: 584 }
});
