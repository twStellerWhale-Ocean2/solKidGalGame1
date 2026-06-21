// AUTO-GENERATED FROM /VERSION — DO NOT EDIT BY HAND.
// 版號／版本沿革唯一 SSOT＝repo 根目錄 VERSION（semver＋date＋copyright＋history）；本檔為其投影。
// 改沿革：編輯 VERSION → `node scripts/genVersion.mjs`（重生本檔與 CHANGELOG.md）。
// 防漂移：`node scripts/genVersion.mjs --check`（docs/design.md＜IV.A＞測試指令）。
// 玩家可見沿革＝VERSION.history 中 playerVisible 之投影；buildInfo 之 commit SHA 於 build 當下由 git 取、不入 VERSION。
export const copyright = "carlton0521@gmail.com, copyright reserved, 2026";

export const versionHistory = [
  { version: "0.53.1", buildDateTime: "2026-06-22", summaryZh: "公主房改用單一「換裝」按鈕（深粉紅）打開右側衣櫃，和商店同一套面板；衣櫃只穿不買——按一下穿上、按鈕字變「脫下」再按即脫下，移除原本攤開的逐分類換裝表單以簡併機制、減少技術債" },
  { version: "0.53.0", buildDateTime: "2026-06-21", summaryZh: "桌機寬螢幕下，地圖與場景等固定比例畫面左右（或上下）留白改以該畫面背景的模糊放大版鋪底，消除空白邊、維持沉浸；畫面內容本身仍完整清楚、不被模糊" },
  { version: "0.52.5", buildDateTime: "2026-06-21", summaryZh: "頭胸照統一為單一即時來源：選角卡與側欄／帳號卡 bust 一律以公主身上即時穿搭（state.outfit）渲染，不再有 defaultOutfit 第二套外觀來源——修正選角卡仍光頭、與側欄造型分歧的問題，換髮型／衣物時所有頭胸照同步反映" },
  { version: "0.52.4", buildDateTime: "2026-06-21", summaryZh: "公主選單選角卡頭胸照改為直接引用該公主預設組態（defaultOutfit）渲染，不再餵入寫死的空 outfit：與確認選角後側欄／帳號卡 bust 採同一資料來源，預設髮型／衣物在選角預覽即與實際遊玩造型一致，消除潛在不一致" },
  { version: "0.52.3", buildDateTime: "2026-06-21", summaryZh: "移除所有立繪／地圖角色腳底的橢圓接地圓盤（舊 .avatar-shadow）：該扁橢圓既被讀為「腳步圓盤」、又在施了深灰投影的合成 stage 內被再模糊成糊化光暈；全站一致改由角色本體的簡潔深灰立體投影接地，不再保留任何圓盤元件或開關，徹底落地 #207 去圓盤去光暈意圖" },
  { version: "0.52.2", buildDateTime: "2026-06-21", summaryZh: "公主底圖拆為共用 body（含永久肌膚安全底著）＋ per-character head（含預設髮、髮色識別）分層立繪：衣物疊於底著之上、髮型須完全覆蓋 head 預設髮，更換衣物或髮型時舊的不殘留（消除昔日 baked-in 底圖不可移除之雙重疊圖）" },
  { version: "0.52.1", buildDateTime: "2026-06-21", summaryZh: "衣物改以資源包為單位：各地區收斂為單一服飾店、整包販售多類別衣物（含髮型），商店可用類別分頁瀏覽；既有存檔已購衣物以 id 相容保留" },
  { version: "0.52.0", buildDateTime: "2026-06-21", summaryZh: "打工改為實際賺到 coins 後才在本遊玩週期下架；答對但沒拿到 coins（用了中文協助或第三次以上）不下架、本週期仍可再作答賺錢" },
  { version: "0.51.1", buildDateTime: "2026-06-20", summaryZh: "公主與場景人物 ADV 立繪改用簡潔深灰立體投影，去除詭異光暈與糊化腳底陰影" },
  { version: "2026.06.19-character-theme-defaults", buildDateTime: "2026-06-19", summaryZh: "Yumi 深藍髮、Mary 深綠髮與新帳號隨機初始主題" },
  { version: "2026.06.16-speech-quality", buildDateTime: "2026-06-16", summaryZh: "Web Speech API 語音品質改善：80% 語速、voice fallback、佇列與診斷紀錄" },
  { version: "2026.06.16-rest-profile-flow", buildDateTime: "2026-06-16", summaryZh: "兒童休息預設 15 分鐘，公主識別色、大頭照與切換入口一致化" },
  { version: "2026.06.16-user-princess-base", buildDateTime: "2026-06-16", summaryZh: "依使用者提供圖片替換四位公主 base，轉透明 WebP 並對齊紙娃娃版型" },
  { version: "2026.06.15-princess-roster", buildDateTime: "2026-06-15", summaryZh: "重整可玩公主 base 分層，新增 Rosa 並調整 Yumi／Sol" },
  { version: "2026.06.15-about-tab", buildDateTime: "2026-06-15", summaryZh: "設定選單新增 About 頁籤：作品版權宣告與歷次版本中文短主旨" },
  { version: "2026.06.15-map-avatar", buildDateTime: "2026-06-15", summaryZh: "統一世界／城堡／各地區地圖的公主頭像顯示與移動" },
  { version: "2026.06.15-coins-only", buildDateTime: "2026-06-15", summaryZh: "答題獎勵統一只發 coins，移除其他屬性獎勵" },
  { version: "2026.06.14-slower-voice", buildDateTime: "2026-06-14", summaryZh: "語音放慢為約 3/4 速度，兒童更易聽辨" },
  { version: "2026.06.14-character-voice", buildDateTime: "2026-06-14", summaryZh: "角色差異化配音，公主以其聲音朗讀作答" },
  { version: "2026.06.14-remove-help", buildDateTime: "2026-06-14", summaryZh: "移除 Help 與 OpenAI 設定入口，Practice 直接開始" },
  { version: "2026.06.14-chinese-help", buildDateTime: "2026-06-14", summaryZh: "新增中文協助與獎勵階梯" },
  { version: "2026.06.13-2tech-design", buildDateTime: "2026-06-13", summaryZh: "導入 2tech 設計方法論與 design.md／docLint" },
  { version: "2026.06.13-multi-account", buildDateTime: "2026-06-13", summaryZh: "本機多帳號選擇與管理" },
  { version: "2026.06.13-play-limit", buildDateTime: "2026-06-13", summaryZh: "遊玩時間限制與護眼休息" },
];

export const buildInfo = {
  version: "0.54.0",
  buildDate: "2026-06-22",
  buildDateTime: "2026-06-22",
  issues: ["#245"]
};
