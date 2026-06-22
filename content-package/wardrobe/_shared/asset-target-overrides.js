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
  "castle/bottom-lilac-skirt": { left: 171, top: 477, right: 338, bottom: 621 },
  "castle/bottom-sky-shorts": { left: 195, top: 484, right: 309, bottom: 572, corners: { nw: [-4, -2], ne: [16, -5], sw: [12, -4], se: [-1, -2] } },
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
  "castle/top-aqua-sailor": { left: 192, top: 387, right: 317, bottom: 514 },
  "castle/top-coral-blouse": { left: 181, top: 392, right: 334, bottom: 524 },
  "rural/bottom-coral-skirt": { left: 170, top: 468, right: 337, bottom: 612 },
  "rural/bottom-mint-skirt": { left: 172, top: 480, right: 339, bottom: 624 },
  "rural/bottom-sun-skirt": { left: 176, top: 478, right: 343, bottom: 622 },
  "rural/top-butter-sailor": { left: 194, top: 392, right: 319, bottom: 519 },
  "rural/top-violet-sailor": { left: 193, top: 391, right: 318, bottom: 518 },
  "urban/bottom-navy-shorts": { left: 196, top: 491, right: 319, bottom: 585, corners: { nw: [-15, -10], ne: [15, -13], sw: [15, -1], se: [-14, 0] } },
  "urban/bottom-rose-skirt": { left: 170, top: 481, right: 337, bottom: 625 },
  "urban/bottom-wild-shorts": { left: 195, top: 482, right: 320, bottom: 594, corners: { nw: [0, 0], ne: [0, 0], sw: [0, 0], se: [-5, 3] } },
  "urban/dress-blue-harbor": { left: 150, top: 391, right: 363, bottom: 612, corners: { nw: [8, 5], ne: [-8, 3], sw: [0, 0], se: [0, 0] } },
  "urban/dress-lavender-festival": { left: 157, top: 394, right: 357, bottom: 614 },
  "urban/dress-lilac-harbor": { left: 164, top: 391, right: 347, bottom: 612 },
  "urban/dress-mint-harbor": { left: 162, top: 394, right: 352, bottom: 618 },
  "urban/dress-pearl-harbor": { left: 168, top: 393, right: 344, bottom: 614 },
  "urban/dress-rose-festival": { left: 156, top: 394, right: 356, bottom: 614 },
  "urban/dress-snowflake-gown": { left: 141, top: 394, right: 369, bottom: 703 },
  "urban/headside-silk-ribbon": { left: 218, top: 426, right: 292, bottom: 479 },
  "urban/shoes-blue-boots": { left: 209, top: 661, right: 301, bottom: 768 },
  "urban/shoes-pink-ribbon": { left: 207, top: 697, right: 300, bottom: 768 },
  "urban/top-cream-blouse": { left: 186, top: 392, right: 324, bottom: 524, corners: { nw: [0, 0], ne: [0, 0], sw: [-2, 2], se: [5, 0] } },
  "urban/top-lilac-blouse": { left: 186, top: 383, right: 325, bottom: 525 },
  "urban/top-mint-blouse": { left: 183, top: 385, right: 327, bottom: 517 },
  "urban/top-peach-sailor": { left: 194, top: 393, right: 319, bottom: 520 },
  "urban/top-sky-blouse": { left: 188, top: 387, right: 325, bottom: 519 },
  "wild/dress-coral-festival": { left: 156, top: 394, right: 356, bottom: 614 },
  "wild/dress-starlight-gown": { left: 148, top: 395, right: 369, bottom: 612, corners: { nw: [0, 0], ne: [-6, 1], sw: [21, 0], se: [-25, -7] } }
});
