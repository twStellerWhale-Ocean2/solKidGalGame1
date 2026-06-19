# Issue #179 設計 note：重繪上下以模糊補版的場景圖

> 本檔為 2plan 設計 note。主體設計已同步回 [docs/design.md](design.md) 的 spec#2、spec#7、方案／系統運作個案、intTest#47、docProgTest#02/#07、e2eTest#14 與成效追蹤；本檔保留本議題的盤點判準、候選清單與後續 dev QA 方式。

## 1. 問題界定

既有 ADV 場景背景已統一為 `1024x1024` WebP，並由 sceneArt renderer 載入。#179 的問題不是要改 renderer 尺寸，也不是要新增 CSS 遮罩，而是有些正式場景圖疑似以上下模糊、延展或失焦區塊補滿正方形畫布，導致手機直向或半透明對話框下露出品質落差。

本議題判定缺陷的核心是：「原本應存在可辨識場景內容的上緣或下緣，是否被模糊／延展區替代」。合理景深、霧氣、光暈、遠景柔焦不自動視為缺陷。

## 2. 設計決策

* 場景背景仍採單張 `1024x1024` WebP，並沿用現有 `sceneArt.src` manifest 引用。
* renderer 只負責通用載入、overlay、position 與 cover；不得為個別場景新增 blur、frosted cover、上下延展或 fallback 背景圖特例。
* 不合格場景須回到正式 raster 資產重繪或修圖，讓整張圖都是實際繪製內容。
* 重繪須維持原場景語意、地點主體、NPC 站位可讀性、童話手繪風格與手機直向可讀性。
* 可接受景深須在 QA 表中明確標記，避免把正常藝術表現誤列為補版缺陷。

## 3. 初步候選清單

obj 階段 contact sheet 初篩顯示下列資產可能需要優先檢查。此清單不是最終重繪清單，dev 階段須逐張以手機直向與桌機截圖定案。

| 區域 | 場景資產 | 初步疑點 |
|---|---|---|
| castle | `bedroom-1024.webp` | 畫面邊緣柔焦明顯，需確認是否為補版或風格化景深 |
| castle | `castle-seamstress-1024.webp` | 檔案量偏低，接觸表可見柔焦區較大 |
| castle | `royal-cloak-room-1024.webp` | 檔案量偏低，主體外圍疑似模糊撐版 |
| urban | `garden-1024.webp` | 遠近景柔焦明顯，需確認下緣是否補版 |
| urban | `hair-salon-1024.webp` | 檔案量偏低，邊緣與下緣較糊 |
| urban | `harbor-1024.webp` | 下緣空白與柔焦區明顯 |
| urban | `lighthouse-1024.webp` | 下緣柔焦沙地區較大 |
| urban | `market-1024.webp` | 下緣柔焦區較大 |
| urban | `shoes-1024.webp` | 檔案量偏低，下緣空白與柔焦區較大 |
| wild | `fairy-atelier-1024.webp` | 檔案量偏低，前景柔焦區較大 |
| wild | `wild-path-1024.webp` | 中央與下緣柔焦明顯，需確認是否為路徑景深或補版 |

## 4. Dev 驗證要求

* 列出所有 `content-package/areas/*/assets/scenes/*-1024.webp`，確認實際像素皆為 `1024x1024`。
* 產生全場景 contact sheet，標示「完整繪製」「合理景深」「需重繪」三類。
* 對「需重繪」場景替換正式 WebP 後，產出前後對照 contact sheet。
* 用同一 localhost URL 做手機直向與桌機 viewport 截圖，至少覆蓋候選清單與每個地區一個代表性完整場景。
* 檢查 sceneArt renderer 與 CSS 無個別場景 blur/frosted cover/fallback 特例。

## 5. 交付邊界

本議題可只替換正式背景資產與必要的自測/QA 輸出，不應改題庫、商店、打工、聊天、NPC、地圖導航或場景流程。若重繪後構圖造成 NPC 或公主位置不適，應以資產重繪或通用安全框判準處理，不以個別 runtime nudge 擴大責任。

## 6. 3code 實作紀錄

* `?selftest=data-audit` 已擴充 scene background contract audit：列出 unique runtime `sceneArt.src`、檢查實際 `1024x1024` 尺寸，並以 top／middle／bottom band edge detail 與 luma variance 產生 `review-soft-band` warnings。此 heuristic 只作人工複核排序，不作為自動失敗條件。
* `?selftest=visual-qa&surface=scene-art-contact-sheet` 已新增全場景 contact sheet，顯示尺寸、review 狀態與 top/bottom edge ratios；橘框表示需要人工美術複核。
* `?selftest=visual-qa&surface=scene-art&place=<id>` 已新增單一場景 QA surface，可用同一 localhost URL 截取手機直向與桌機 viewport，檢查對話框後方與上下區域。
* 本次未新增 renderer blur、frosted cover、fallback 背景圖或個別場景 CSS 特例；sceneArt renderer 仍載入正式 raster `sceneArt.src`。
* 本次 QA 報告輸出於 [docs/test-summary.pdf](test-summary.pdf)。
