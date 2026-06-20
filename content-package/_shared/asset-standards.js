// issue #197：圖像資產標準尺寸與檔重預算之單一事實來源（design.md ＜II.B (D)＞ paramAssetStandards）。
// 資產 lint（data-audit selftest，intTest#49）據此驗證每張圖像資產之像素尺寸與檔案位元組（檔重），
// 攔下過大圖檔——純靜態載入緩慢主因。maxKB 為初始檔重門檻（KB），可依實測 USR-gated 微調。
//
// 尺寸模式（mode）：
//   "exact"：固定畫布資產（地圖／場景／角色 base／UI），像素尺寸須「等於」標準值。
//   "bound"：緊貼裁切之內容 bitmap（地圖裝飾層，以 targetBox 等比 fit 回畫布），
//            素材本身為去白邊後的可變尺寸，僅要求「容於」標準畫布（寬高皆 ≤ 畫布）＋檔重預算。
//   "fill"：固定方塊素材（衣物單品，#196），像素尺寸須「等於」標準值（512×512）、alpha 內容長邊貼滿
//            （短邊置中留透明）——尺寸/檔重於本 lint，長邊貼滿之 alpha 檢查於瀏覽器 data-audit。
//
// 新增資產類別須先於本表登記方納入（intTest#49 對未涵蓋類別報錯，杜絕漏網）。
export const assetStandards = {
  characterBase: { mode: "exact", width: 512, height: 768, maxKB: 350, label: "角色/NPC base（固定畫布）" },
  scene: { mode: "exact", width: 1024, height: 1024, maxKB: 500, label: "ADV 場景背景（固定畫布）" },
  areaMap: { mode: "exact", width: 1536, height: 1536, maxKB: 600, label: "地區地圖（固定畫布）" },
  worldMap: { mode: "exact", width: 1024, height: 1536, maxKB: 600, label: "世界地圖（固定畫布）" },
  wardrobe: { mode: "fill", width: 512, height: 512, maxKB: 120, label: "衣物單品（單一素材兼投影與商店預覽，512×512 長邊貼滿）" },
  mapLayer: { mode: "bound", width: 512, height: 512, maxKB: 80, label: "地圖裝飾層（map-layers，定位疊圖，緊貼裁切）" },
  ui: { mode: "exact", width: 1280, height: 720, maxKB: 120, label: "UI 介面圖（固定畫布）" }
};

// 依資產路徑判定其類別（較依引用欄位穩健——例如 starter 商品借用角色 base 作縮圖，
// 仍應歸 characterBase 而非 wardrobe）。回傳 null＝未涵蓋類別（intTest#49 報錯）。
export function classifyAssetPath(path) {
  if (/\/world-map\.webp$/.test(path)) return "worldMap";
  if (/\/map-1536\.webp$/.test(path)) return "areaMap";
  if (/\/scenes\/[^/]+-1024\.webp$/.test(path)) return "scene";
  if (/\/map-layers\/[^/]+\.(webp|png)$/.test(path)) return "mapLayer";
  if (/\/wardrobe\/[^/]+\/assets\/layers\/[^/]+\.webp$/.test(path)) return "wardrobe";
  if (/\/characters\/[^/]+\.webp$/.test(path) || /\/characters\/[^/]+\/assets\/[^/]+\.webp$/.test(path)) return "characterBase";
  if (/content-base\/ui\/[^/]+\.webp$/.test(path)) return "ui";
  return null;
}

// 具名豁免：path 後綴 → 理由（可審計）。
// 目前無豁免——現存超標資產（rural/urban/wild 地區地圖與 6 張 wild 場景）已於 #197 重壓縮至預算內。
export const assetSizeExemptions = {
  // "content-package/areas/xxx/assets/xxx.webp": "豁免理由（具名、可審計）"
};
