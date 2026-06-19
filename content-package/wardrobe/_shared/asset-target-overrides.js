// 人工校準的 per-item targetBox 覆寫（issue #176，由 Wardrobe Tuner「② 單品框」匯出）。
//
// 優先於 asset-content-box.generated.js 的裁切原始內容框；重跑 tool/trim-wardrobe-assets.mjs
// 不會覆寫本檔，故手動微調的單品定位得以保留。鍵為 `<packId>/<assetName>`，值為 canvas
// 512x768 座標的目標矩形 { left, top, right, bottom }；選配 corners 為四角相對矩形角的 px
// 偏移 { nw:[dx,dy], ne, sw, se }，使投影區可自由變形成任意四邊形（issue #191）。
export const assetTargetOverrides = Object.freeze({
  "castle-royal-cloak-room/outer-aurora-cape": { left: 123, top: 398, right: 374, bottom: 582 },
  "castle-royal-cloak-room/outer-mint-cardigan": { left: 168, top: 396, right: 337, bottom: 557 },
  "castle-royal-cloak-room/outer-moon-cape": { left: 125, top: 398, right: 384, bottom: 582 },
  "castle-royal-cloak-room/outer-yellow-cardigan": { left: 172, top: 402, right: 341, bottom: 563 },
  "urban-accessory-atelier/headtop-gold-crown": { left: 200, top: 285, right: 311, bottom: 349 },
  "urban-dress-boutique/dress-blue-harbor": { left: 162, top: 399, right: 348, bottom: 646 },
  "urban-dress-boutique/dress-rose-festival": { left: 164, top: 404, right: 346, bottom: 651 },
  "urban-dress-boutique/dress-snowflake-gown": { left: 143, top: 404, right: 368, bottom: 712 },
  "urban-hair-salon/hairstyle-twin-braid": { left: 151, top: 281, right: 357, bottom: 559, corners: { nw: [22, 0], ne: [-22, 0], sw: [15, 0], se: [-15, 0] } },
  "urban-shoe-shop/shoes-blue-boots": { left: 225, top: 725, right: 286, bottom: 761 },
  "urban-shoe-shop/shoes-lilac-ribbon": { left: 212, top: 718, right: 297, bottom: 768 },
  "urban-shoe-shop/shoes-pink-ribbon": { left: 230, top: 737, right: 278, bottom: 763, corners: { nw: [0, 0], ne: [0, 0], sw: [0, 0], se: [-2, 0] } },
  "urban-tailor-studio/bottom-cocoa-shorts": { left: 194, top: 499, right: 319, bottom: 604 },
  "urban-tailor-studio/bottom-navy-shorts": { left: 193, top: 494, right: 319, bottom: 616, corners: { nw: [-12, -2], ne: [6, -1], sw: [0, 0], se: [0, 0] } },
  "urban-tailor-studio/bottom-rose-skirt": { left: 160, top: 489, right: 351, bottom: 653, corners: { nw: [-9, 3], ne: [8, -7], sw: [0, 0], se: [0, 0] } }
});
