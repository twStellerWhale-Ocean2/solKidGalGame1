// 人工校準的 per-item targetBox 覆寫（由 Wardrobe Tuner「② 單品框」匯出）。
//
// 優先於類別 safeBox；鍵為 `<packId>/<assetName>`，值為 canvas 512x768 座標的目標矩形
// { left, top, right, bottom }；選配 corners 為四角相對矩形角的 px 偏移 { nw:[dx,dy], ne, sw, se }，
// 使投影區可自由變形成任意四邊形。
//
// issue #196：素材由「#176 去白邊緊貼裁切」改為「512×512 長邊貼滿」，舊有 per-item 覆寫（含 corners
// 變形）係為舊裁切素材所校準、已不適用，故清空——所有 wardrobe 單品改以類別 safeBox 為預設投影框
// （見 rules.js wardrobeLayerBoundsByType），由維護者依需要以 tuner 逐件重新校準後寫回本檔。
// issue #251：移除分件 top/bottom 單品後，連同其 per-item 覆寫一併刪除（dress 改名 outfit，asset 檔名不變、覆寫沿用）。
export const assetTargetOverrides = Object.freeze({
  "castle/hairstyle-blonde-bob": { left: 180, top: 281, right: 328, bottom: 437, corners: { nw: [-2, -3], ne: [7, 0], sw: [0, 0], se: [0, 0] } },
  "castle/hairstyle-blonde-bob-cocoa": { left: 182, top: 270, right: 333, bottom: 426 },
  "castle/hairstyle-blonde-bob-honey": { left: 180, top: 280, right: 331, bottom: 436 },
  "castle/hairstyle-blonde-bob-lavender": { left: 181, top: 260, right: 332, bottom: 415 },
  "castle/hairstyle-blonde-bob-silver": { left: 182, top: 276, right: 333, bottom: 449 },
  "castle/hairstyle-twin-braid": { left: 158, top: 283, right: 353, bottom: 471 },
  "castle/hairstyle-twin-braid-auburn": { left: 152, top: 287, right: 360, bottom: 506, corners: { nw: [17, -4], ne: [-14, -1], sw: [-21, -22], se: [23, -6] } },
  "castle/hairstyle-twin-braid-chestnut": { left: 180, top: 290, right: 359, bottom: 518 },
  "castle/hairstyle-twin-braid-midnight": { left: 172, top: 282, right: 346, bottom: 553 },
  "castle/hairstyle-twin-braid-rose": { left: 180, top: 290, right: 338, bottom: 516 },
  "castle/headtop-pearl-tiara": { left: 212, top: 270, right: 300, bottom: 334 },
  "castle/headtop-ruby-tiara": { left: 210, top: 270, right: 304, bottom: 334 },
  "castle/headtop-starry-tiara": { left: 209, top: 270, right: 305, bottom: 334 },
  "rural/headtop-aurora-tiara": { left: 210, top: 275, right: 303, bottom: 339 },
  "rural/headtop-wild-tiara": { left: 207, top: 280, right: 306, bottom: 344 },
  "rural/shoes-plum-boots": { left: 214, top: 710, right: 298, bottom: 768, corners: { nw: [1, 2], ne: [0, 0], sw: [0, 0], se: [0, 0] } },
  "rural/shoes-wild-boots": { left: 214, top: 700, right: 297, bottom: 768 },
  "urban/dress-blue-harbor": { left: 150, top: 391, right: 363, bottom: 612, corners: { nw: [8, 5], ne: [-8, 3], sw: [0, 0], se: [0, 0] } },
  "urban/dress-lavender-festival": { left: 157, top: 394, right: 357, bottom: 614 },
  "urban/dress-lilac-harbor": { left: 164, top: 391, right: 347, bottom: 612 },
  "urban/dress-mint-harbor": { left: 162, top: 394, right: 352, bottom: 618 },
  "urban/dress-pearl-harbor": { left: 168, top: 393, right: 344, bottom: 614 },
  "urban/dress-rose-festival": { left: 156, top: 394, right: 356, bottom: 614 },
  "urban/dress-snowflake-gown": { left: 141, top: 394, right: 369, bottom: 703 },
  "urban/faceeyes-round-glasses": { left: 217, top: 311, right: 297, bottom: 393 },
  "urban/facemask-star-mask": { left: 217, top: 307, right: 294, bottom: 389 },
  "urban/headside-silk-ribbon": { left: 218, top: 405, right: 292, bottom: 458 },
  "urban/headtop-gold-crown": { left: 212, top: 280, right: 301, bottom: 344 },
  "urban/headtop-lilac-crown": { left: 212, top: 277, right: 300, bottom: 341 },
  "urban/headtop-mint-crown": { left: 212, top: 276, right: 300, bottom: 340 },
  "urban/headtop-rose-crown": { left: 212, top: 281, right: 300, bottom: 345 },
  "urban/headtop-silver-crown": { left: 212, top: 275, right: 300, bottom: 339 },
  "urban/neck-pearl-necklace": { left: 221, top: 405, right: 287, bottom: 455 },
  "urban/shoes-blue-boots": { left: 209, top: 661, right: 301, bottom: 768 },
  "urban/shoes-pink-ribbon": { left: 207, top: 697, right: 300, bottom: 768 },
  "wild/dress-aurora-gown": { left: 138, top: 399, right: 372, bottom: 712 },
  "wild/dress-coral-festival": { left: 156, top: 394, right: 356, bottom: 614 },
  "wild/dress-starlight-gown": { left: 142, top: 395, right: 369, bottom: 612, corners: { nw: [0, 0], ne: [-6, 1], sw: [21, 0], se: [-25, -7] } },
  "wild/faceeyes-silver-glasses": { left: 216, top: 305, right: 296, bottom: 398 },
  "wild/facemask-moon-mask": { left: 217, top: 304, right: 294, bottom: 393 },
  "wild/hand-lilac-bag": { left: 321, top: 543, right: 379, bottom: 614 },
  "wild/neck-rose-necklace": { left: 222, top: 396, right: 288, bottom: 446 },
  "wild/shoes-cocoa-boots": { left: 208, top: 715, right: 301, bottom: 768 },
  "wild/shoes-silver-boots": { left: 210, top: 705, right: 303, bottom: 766 }
});
