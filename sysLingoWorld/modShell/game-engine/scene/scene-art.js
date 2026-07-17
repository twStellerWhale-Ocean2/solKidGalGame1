const TONE_OVERLAYS = Object.freeze({
  castle: "linear-gradient(180deg, rgba(255, 245, 251, 0.015), rgba(42, 31, 42, 0.04))",
  wild: "linear-gradient(180deg, rgba(232, 255, 238, 0.018), rgba(34, 46, 38, 0.04))",
  urban: "linear-gradient(180deg, rgba(255, 245, 232, 0.015), rgba(42, 36, 31, 0.04))",
  room: "linear-gradient(180deg, rgba(255, 245, 251, 0.018), rgba(42, 31, 42, 0.035))",
  shop: "linear-gradient(180deg, rgba(255, 245, 251, 0.015), rgba(42, 31, 42, 0.04))",
  rural: "linear-gradient(180deg, rgba(255, 245, 232, 0.015), rgba(38, 42, 31, 0.04))"
});

const DEFAULT_OVERLAY = TONE_OVERLAYS.urban;

export function applyAdvSceneArt(element, sceneArt, options = {}) {
  if (!element) return;
  if (!sceneArt?.src) {
    clearAdvSceneArt(element);
    return;
  }
  const assetUrl = options.assetUrl || ((src) => src);
  const overlay = sceneArt.overlay || TONE_OVERLAYS[sceneArt.tone] || DEFAULT_OVERLAY;
  const position = sceneArt.position || "center";
  const size = sceneArt.size || "cover";
  element.style.backgroundImage = `${overlay}, url("${assetUrl(sceneArt.src)}")`;
  element.style.backgroundPosition = `center, ${position}`;
  element.style.backgroundRepeat = "no-repeat";
  element.style.backgroundSize = `auto, ${size}`;
  element.dataset.sceneArtSrc = sceneArt.src;
  if (sceneArt.atlas) element.dataset.sceneArtAtlas = sceneArt.atlas;
  else delete element.dataset.sceneArtAtlas;
}

// issue #362：進場前預抓——互動模型為「第一次點聚焦、第二次點進場」，聚焦到進場之間即天然預抓窗口。
// 只抓「當前聚焦地點」之場景圖與 NPC 圖（**不整區掃**，全部場景圖合計 15.9 MB）。
// 紀律：fire-and-forget——預抓失敗（離線／404）不得影響進場，故不 await、不拋、不記狀態。
const prefetched = new Set();
export function prefetchSceneArt(scene, options = {}) {
  const assetUrl = options.assetUrl || ((src) => src);
  [scene?.sceneArt?.src, scene?.npcImage].forEach((src) => {
    if (!src || prefetched.has(src)) return;
    prefetched.add(src);
    const img = new Image();
    // **低優先級為硬性**（Q3 審查 M2）：預抓與「玩家當下正在看的圖」（如剛進區時仍在下載的
    // map-1536，543 KB）共用連線——預設優先級會讓本優化反而拖慢當前畫面。fetchPriority 不支援
    // 之瀏覽器會忽略此屬性（安全降級）。decoding 只影響解碼、不影響網路優先級，故兩者皆設。
    img.fetchPriority = "low";
    img.decoding = "async";
    img.src = assetUrl(src); // 只求進瀏覽器快取；不掛 DOM、不理成敗
    // 失敗（404／離線）只在 img 上觸發 error 事件、無 listener 即靜默丟棄，
    // 不會冒出 unhandled；new Image()／.src 本身不拋，故毋須 try/catch（審查 A5）。
  });
}

export function clearAdvSceneArt(element) {
  if (!element) return;
  element.style.backgroundImage = "";
  element.style.backgroundPosition = "";
  element.style.backgroundRepeat = "";
  element.style.backgroundSize = "";
  delete element.dataset.sceneArtSrc;
  delete element.dataset.sceneArtAtlas;
}
