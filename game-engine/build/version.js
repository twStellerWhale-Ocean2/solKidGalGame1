// issue #110（datIntf自訂版本沿革目錄）：作品版權宣告與歷次版本沿革之單一資料來源。
// versionHistory 由新到舊排列；當前版本為首筆，buildInfo 由首筆導出，避免與 About／Settings 版本顯示雙軌。
export const copyright = "carlton0521@gmail.com, copyright reserved, 2026";

export const versionHistory = [
  { version: "2026.06.16-speech-quality", buildDateTime: "2026-06-16", issue: "#109", summaryZh: "Web Speech API 語音品質改善：80% 語速、voice fallback、佇列與診斷紀錄" },
  { version: "2026.06.16-rest-profile-flow", buildDateTime: "2026-06-16", issue: "#126", summaryZh: "兒童休息預設 15 分鐘，公主識別色、大頭照與切換入口一致化" },
  { version: "2026.06.16-user-princess-base", buildDateTime: "2026-06-16", issue: "#123", summaryZh: "依使用者提供圖片替換四位公主 base，轉透明 WebP 並對齊紙娃娃版型" },
  { version: "2026.06.15-princess-roster", buildDateTime: "2026-06-15", issue: "#123", summaryZh: "重整可玩公主 base 分層，新增 Rosa 並調整 Yumi／Sol" },
  { version: "2026.06.15-about-tab", buildDateTime: "2026-06-15", issue: "#110", summaryZh: "設定選單新增 About 頁籤：作品版權宣告與歷次版本中文短主旨" },
  { version: "2026.06.15-map-avatar", buildDateTime: "2026-06-15", issue: "#99", summaryZh: "統一世界／城堡／各地區地圖的公主頭像顯示與移動" },
  { version: "2026.06.15-coins-only", buildDateTime: "2026-06-15", issue: "#100", summaryZh: "答題獎勵統一只發 coins，移除其他屬性獎勵" },
  { version: "2026.06.14-slower-voice", buildDateTime: "2026-06-14", issue: "#102", summaryZh: "語音放慢為約 3/4 速度，兒童更易聽辨" },
  { version: "2026.06.14-character-voice", buildDateTime: "2026-06-14", issue: "#93", summaryZh: "角色差異化配音，公主以其聲音朗讀作答" },
  { version: "2026.06.14-remove-help", buildDateTime: "2026-06-14", issue: "#106", summaryZh: "移除 Help 與 OpenAI 設定入口，Practice 直接開始" },
  { version: "2026.06.14-chinese-help", buildDateTime: "2026-06-14", issue: "#73", summaryZh: "新增中文協助與獎勵階梯" },
  { version: "2026.06.13-2tech-design", buildDateTime: "2026-06-13", issue: "#88", summaryZh: "導入 2tech 設計方法論與 design.md／docLint" },
  { version: "2026.06.13-multi-account", buildDateTime: "2026-06-13", issue: "#63", summaryZh: "本機多帳號選擇與管理" },
  { version: "2026.06.13-play-limit", buildDateTime: "2026-06-13", issue: "#6", summaryZh: "遊玩時間限制與護眼休息" }
];

export const buildInfo = {
  version: versionHistory[0].version,
  buildDate: versionHistory[0].buildDateTime,
  buildDateTime: versionHistory[0].buildDateTime,
  issues: [versionHistory[0].issue]
};
