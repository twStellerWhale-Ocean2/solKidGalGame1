# 設計note — issue #212 本機開發環境於起始選單提供衣物調整工具入口

> 本檔為 #212 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] 下之 **dev-tooling affordance**：於**本機開發環境**在起始選單（選角對話框 `Start` 鈕下方）顯示一顆［衣物調整工具］dev 入口，點擊導向既有 dev 工具 [tool/wardrobe-tuner.html]，以前端環境偵測為閘門、正式發佈站一律不顯示。design.md ＜I＞ 種子採 **「不新增產品 spec#、視為 dev-tooling affordance」**（USR 於 go-plan 採此保守方向）；plan 僅於 design.md ＜IV.A 部署組態＞補一條「本機開發工具入口」說明，**不污染** spec→solStory→intTest→productReadme 產品模型。docLint sol = 0。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **衣物調整工具＝既有 dev 工具**：[tool/wardrobe-tuner.html]／[tool/wardrobe-tuner.js]，目前唯一入口為手動輸入 `http://127.0.0.1:4174/tool/wardrobe-tuner.html`，或於 Windows 執行 [tool/start-wardrobe-tuner.ps1]（啟動 [server.mjs] 後開瀏覽器）。其套用（`POST /tool/apply-wardrobe`）與管理端點由 [server.mjs] 限定 `127.0.0.1`、白名單寫入 `content-package/wardrobe/`。
* **起始選單 `Start` 按鈕**：[index.html] `#characterSelect`（「Choose your princess」）底部 `.character-select-actions` 內 `#characterConfirm`（文字 `Start`）；旁為 `#characterCancel`（`Back`）。事件接線於 [game-engine/main.js] `bindEvents()`（L3505 `characterConfirm` → `confirmCharacterSelect`）。元素參照集中於 [game-engine/app/elements.js]。
* **前端環境偵測缺位**：`127.0.0.1` 判斷目前僅存在於 server 端 [server.mjs]（依 request IP）；前端 [game-engine] 無 client-side local／dev 偵測（無 `location.hostname` 之類判斷）——本案需新增前端 helper。
* **design.md 現況**：spec#1–#12 未涵蓋 wardrobe-tuner（其為 `tool/` 下 dev 工具、非產品 spec）；design.md 僅於 ＜IV.A＞建置指令提及本機預覽 `node server.mjs`（`http://127.0.0.1:4174/`）。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的①**：在本機開發環境，於起始選單 `Start` 鈕下方提供可發現、可點擊的 dev 入口，直接進入 wardrobe-tuner，省去手動記憶／輸入 URL。
* **目的②（安全核心）**：該入口**僅於本機開發環境出現**——以前端環境偵測為閘門，確保正式發佈站（GitHub Pages 公開網域）之一般玩家**永不可見**此 dev 按鈕。
* 範圍界定：不擴及 wardrobe-tuner 本身功能、不改動正式玩家流程；屬 dev-tooling affordance，**不新增產品 spec#**。

## 3. 設計決策（plan 已落地 design.md，docLint sol = 0）

* **D1 不動產品 spec 模型**：design.md ＜I＞ spec#1–#12 與 ＜II＞ solStory／solCase／intTest／productReadme 一律不增不改。本案為支援衣物素材對位（spec#3）與模組化衣物內容擴充（spec#7）作業流程之 dev 工具便利性，記為 dev-tooling affordance。
* **D2 design.md ＜IV.A＞補述**：新增 bullet「**本機開發工具入口**」，宣告 dev 入口之觸發條件（`location.hostname` ∈ {`127.0.0.1`,`localhost`,`[::1]`}）、置放（`Start` 鈕下方）、導向（相對路徑 `tool/wardrobe-tuner.html`）與**硬約束「正式發佈站一律不顯示」**；並註明完整套用功能仍需 `node server.mjs`。
* **D3 前端環境偵測收斂為單一 helper**：新增 [game-engine/app/env.js]，匯出純函式 `isLocalDevHost(hostname)`（判 `127.0.0.1`／`localhost`／`[::1]`，大小寫不敏感）與 `isLocalDevEnv()`（讀 `location.hostname` 套用前者）。**集中閘門、避免散寫**，利於日後其他 dev-only 功能沿用。
* **D4 dev 入口 DOM 預設隱藏、僅本機揭示**：[index.html] 於 `.character-select-actions` **之下**新增一列 `.character-select-devtools`，內含 `#wardrobeTunerDevButton`（文字「衣物調整工具」）、預設帶 `hidden`；[game-engine/main.js] `bindEvents()` 於 `isLocalDevEnv()` 為真時移除 `hidden` 並接線 click → `window.location.assign("tool/wardrobe-tuner.html")`。非本機環境保持 `hidden`、不可互動。元素參照加入 [game-engine/app/elements.js]。
* **D5 驗證（＜IV.A＞測試指令補 `?selftest=dev-tools`）**：新增 selftest `dev-tools`——①純函式斷言 `isLocalDevHost`：`127.0.0.1`／`localhost`／`[::1]` → true，`foo.github.io`／`example.com`／`""` → false；②依當前 host 斷言按鈕揭示狀態與 `isLocalDevEnv()` 一致、且導向目標為相對路徑 `tool/wardrobe-tuner.html`（不寫死埠號／主機）。

## 4. 影響面與不變式

* **影響檔案**：[index.html]（+1 列按鈕）、[game-engine/app/env.js]（新檔）、[game-engine/app/elements.js]（+1 參照）、[game-engine/main.js]（揭示＋接線）、[game-engine/testing/selftests.js]（+`dev-tools` runner）、[docs/design.md]（＜IV.A＞）、[tool/README.md]（遊戲內 dev 入口說明）。
* **不變式**：正式發佈站（非本機網域）`#wardrobeTunerDevButton` 恆 `hidden`、不渲染為可互動入口；導向採相對路徑、不寫死 `4174`／主機，與 [tool/start-wardrobe-tuner.ps1]／[server.mjs] 既有慣例解耦。
* **產品 README.md 不變**：本案無玩家可見行為，產品手冊主流程不更動；dev 入口說明落於 [tool/README.md]。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **閘門判準明確化**：採封閉白名單 `127.0.0.1`／`localhost`／`[::1]`（不含區網 IP／自訂網域），過寬外洩風險與過嚴漏接間取明確、可測之中點；如需擴充由後續 USR-gated 調整。
* **不積技術債**：環境偵測收斂為單一 `env.js` helper、不散寫；導向相對路徑化。
* **安全可回歸**：以 `dev-tools` selftest 固化「本機顯示／非本機隱藏」不變式，杜絕日後改動誤洩 dev 入口至正式站。
