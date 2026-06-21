# Changelog

本檔自 repo 根目錄 `VERSION` 投影產生（`node scripts/genVersion.mjs`）；請勿手改，改沿革請編輯 `VERSION`。
版號釘選於 PR merge（依變更型別 bump VERSION），release 與版號解耦；本檔收全部變更，遊戲 About 只投影 playerVisible 筆。

## 0.53.0 — 2026-06-21
- feat (#226): 桌機寬螢幕下，地圖與場景等固定比例畫面左右（或上下）留白改以該畫面背景的模糊放大版鋪底，消除空白邊、維持沉浸；畫面內容本身仍完整清楚、不被模糊

## 0.52.1 — 2026-06-21
- refactor (#210): 衣物改以資源包為單位：各地區收斂為單一服飾店、整包販售多類別衣物（含髮型），商店可用類別分頁瀏覽；既有存檔已購衣物以 id 相容保留

## 0.52.0 — 2026-06-21
- feat (#205): 打工改為實際賺到 coins 後才在本遊玩週期下架；答對但沒拿到 coins（用了中文協助或第三次以上）不下架、本週期仍可再作答賺錢

## 0.51.1 — 2026-06-20
- fix (#207): 公主與場景人物 ADV 立繪改用簡潔深灰立體投影，去除詭異光暈與糊化腳底陰影

## 0.51.0 — 2026-06-20 _(internal)_
- chore: 導入結構化 VERSION 版號 SSOT（version.js／CHANGELOG／About 改為投影、附防漂移檢查）；補標既有 99 個 merge PR 之 Conventional Commits 型別後回算版號基準＝0.51.0（51 feat→minor、29 fix、9 refactor、6 docs、3 test、2 perf、0 breaking）

## 2026.06.19-character-theme-defaults — 2026-06-19
- feat (#163): Yumi 深藍髮、Mary 深綠髮與新帳號隨機初始主題

## 2026.06.16-speech-quality — 2026-06-16
- feat (#109): Web Speech API 語音品質改善：80% 語速、voice fallback、佇列與診斷紀錄

## 2026.06.16-rest-profile-flow — 2026-06-16
- feat (#126): 兒童休息預設 15 分鐘，公主識別色、大頭照與切換入口一致化

## 2026.06.16-user-princess-base — 2026-06-16
- feat (#123): 依使用者提供圖片替換四位公主 base，轉透明 WebP 並對齊紙娃娃版型

## 2026.06.15-princess-roster — 2026-06-15
- feat (#123): 重整可玩公主 base 分層，新增 Rosa 並調整 Yumi／Sol

## 2026.06.15-about-tab — 2026-06-15
- feat (#110): 設定選單新增 About 頁籤：作品版權宣告與歷次版本中文短主旨

## 2026.06.15-map-avatar — 2026-06-15
- feat (#99): 統一世界／城堡／各地區地圖的公主頭像顯示與移動

## 2026.06.15-coins-only — 2026-06-15
- feat (#100): 答題獎勵統一只發 coins，移除其他屬性獎勵

## 2026.06.14-slower-voice — 2026-06-14
- feat (#102): 語音放慢為約 3/4 速度，兒童更易聽辨

## 2026.06.14-character-voice — 2026-06-14
- feat (#93): 角色差異化配音，公主以其聲音朗讀作答

## 2026.06.14-remove-help — 2026-06-14
- feat (#106): 移除 Help 與 OpenAI 設定入口，Practice 直接開始

## 2026.06.14-chinese-help — 2026-06-14
- feat (#73): 新增中文協助與獎勵階梯

## 2026.06.13-2tech-design — 2026-06-13
- feat (#88): 導入 2tech 設計方法論與 design.md／docLint

## 2026.06.13-multi-account — 2026-06-13
- feat (#63): 本機多帳號選擇與管理

## 2026.06.13-play-limit — 2026-06-13
- feat (#6): 遊玩時間限制與護眼休息
