// 人工校準的 per-item targetBox 覆寫（issue #176，由 Wardrobe Tuner「② 單品框」匯出）。
//
// 優先於 asset-content-box.generated.js 的裁切原始內容框；重跑 tool/trim-wardrobe-assets.mjs
// 不會覆寫本檔，故手動微調的單品定位得以保留。鍵為 `<packId>/<assetName>`，值為 canvas
// 512x768 座標的目標矩形 { left, top, right, bottom }。
export const assetTargetOverrides = Object.freeze({
});
