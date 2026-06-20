// 人工校準的 per-item targetBox 覆寫（由 Wardrobe Tuner「② 單品框」匯出）。
//
// 優先於類別 safeBox；鍵為 `<packId>/<assetName>`，值為 canvas 512x768 座標的目標矩形
// { left, top, right, bottom }；選配 corners 為四角相對矩形角的 px 偏移 { nw:[dx,dy], ne, sw, se }，
// 使投影區可自由變形成任意四邊形。
//
// issue #196：素材由「#176 去白邊緊貼裁切」改為「512×512 長邊貼滿」，舊有 per-item 覆寫（含 corners
// 變形）係為舊裁切素材所校準、已不適用，故清空——所有 wardrobe 單品改以類別 safeBox 為預設投影框
// （見 rules.js wardrobeLayerBoundsByType），由維護者依需要以 tuner 逐件重新校準後寫回本檔。
export const assetTargetOverrides = Object.freeze({
});
