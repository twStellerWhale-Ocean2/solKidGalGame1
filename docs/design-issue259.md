# 設計note — issue #259 起始狀態組態依關注點分離為公主新局／起始位置／遊戲規則三片

> 本檔為 #259 之設計note（2plan 階段）。本案為既有 [solKidGalGame方案] 之**行為保持結構重構**：把 [game-engine/state/default-state.js] 單一 `defaultState` 物件依語意拆為三個具名片段，配合 #260（管理設定工具導覽已改依資料包分組，v0.55.1 已併入 main）使「工具分頁」與「底層資料」關注點一致。**採 Option A**：檔案內部重組落在 `docs/design.md` 抽象高度（modState 模組行為／sysCase／param／etyCfg）**之下**，design.md ＜I／II／III／IV＞ **不增刪修改**、docLint sol 維持 **0**；規則由本 note 承載、由 3code 落地並以 selftest 守回歸。**不新增 spec**——沿用既有 ＜I.B＞ spec#1–#12，維護性訴求對應既有 **spec#5-可保存並還原玩家進度**（`normalizeState` 存檔保存／還原與淺合併相容不得退化）與 **spec#7-可用純靜態網站方式部署並模組化擴充內容**（起始狀態組態依關注點模組化）。盤點時發現之 `mood` 宣告矛盾**移出本案**、另循 #262，本案 `mood` 完全不碰。

## 1. 現況（以產物為準，本地 main 已同步 origin/main＝v0.55.1）

* **單一物件混三關注點**：[game-engine/state/default-state.js] 之 `export const defaultState` 同時承載——
  * **①公主新局設定**：`activeCharacterId`／`playerName`／`profileColor`／`backgroundPattern`／`coins`／`owned`／`outfit`，以及**起始進度**初值（`diary`／`completedLessons`／`metNpcs`／`learnedWords`／`badges`／`purchaseStoreIds`／`activeQuest`，皆空集合或 `null`）。
  * **②起始位置**：`area`／`playerNode`／`player`／`world`。
  * **③遊戲規則與家長**：`playLimit`（`playMinutes`／`restMinutes`／`playMaxMinutes`／時戳／`cycle`）／`difficulty`／`energy`／`mood`／`speechEnabled`。
* **消費端（2 處 import）**：
  * [game-engine/state/game-state.js]（`import { defaultState }`）：`freshState`／`normalizeState` 之合併底。`normalizeState(candidate)` 以 `const base = freshState({ randomizeTheme: false }); const merged = { ...base, ...candidate }` 淺合併後，逐欄正規化；`normalizeOutfit(candidateOutfit, baseOutfit = defaultState.outfit)` 亦直接引用 `defaultState.outfit`。
  * [tool/defaults-tuner.js]（dev 工具，`import { defaultState }`）：讀 `defaultState` 之 `coins`／`outfit`／`owned`，並經 dev-server 白名單 `/tool/save-defaults` **寫回** default-state.js。
* **自我測試**：[game-engine/testing/selftests.js] 之 `?selftest=save-load`（存檔保存／還原相容）為本案主要回歸守門；`mood-extend`／`data-audit`／`monkey` 等不直接相關但須維持綠燈。
* **design.md 對照**：design.md 以 `modState模組` 承接 sysCase#4.1/#4.2/#4.3（保存／匯入／還原）等行為，**全文未出現** `default-state.js`／`defaultState` 字樣——即起始狀態物件之檔案內部組織不在 design.md 抽象高度內（佐證 Option A）。

## 2. 設計命題（USR 目標，承 ISSUE-READY；USR 已於對話選定「拆到最輕」）

* **目的**：把 `defaultState` 依語意拆為三個可獨立維護之具名片段（公主新局／起始位置／遊戲規則），使其與 #260 之三頁籤（公主／地圖／遊戲規則）關注點對齊，消除「工具拆、資料沒拆」之組態結構技術債。
* **範圍**：僅 [game-engine/state/default-state.js] 之內部組織與其直接消費端（`game-state.js`／`defaults-tuner.js`）之 import 形狀；起始值、`normalizeState`／`freshState` 行為、存檔格式、玩法皆不變。
* **不變式**：① 起始值（每一欄位之預設值）與物件最終形狀與重構前**逐位元等價**；② `normalizeState` 淺合併與逐欄正規化行為不退化、舊存檔載入結果不變；③ 單一事實來源為三具名片段、`defaultState` 僅為其唯讀聚合視圖（不出現「一份資料兩種讀法」雙軌）；④ `mood` 之宣告與行為不動（另循 #262）。

## 3. 設計決策（plan 定方向，3code 落地）

* **D1 design.md 不改（Option A）**：本案無 spec／solCase／sysCase／param／etyCfg 增減，起始狀態物件之檔案內部組織落在 design.md 抽象高度之下。`docs/design.md` ＜I／II／III／IV＞不動，docLint sol 維持 0；規則由本 note＋selftest 承載。
* **D2 三具名片段與欄位歸屬（窮盡且互斥）**：於 [game-engine/state/default-state.js] 內定義三個具名片段並各自 `export`，候選名（3code 可微調）：
  * `princessStart`（**公主新局設定**）：`activeCharacterId`／`playerName`／`profileColor`／`backgroundPattern`／`coins`／`owned`／`outfit`＋起始進度初值（`diary`／`completedLessons`／`metNpcs`／`learnedWords`／`badges`／`purchaseStoreIds`／`activeQuest`）。
  * `startPosition`（**起始位置**）：`area`／`playerNode`／`player`／`world`。
  * `gameRules`（**遊戲規則與家長**）：`playLimit`／`difficulty`／`energy`／`mood`／`speechEnabled`。
  * **補白決策**：issue 三關注點枚舉原未列入「起始進度」欄位（`diary` 等空初值）；plan 將其歸入 `princessStart`（皆為該帳號公主新局之起始狀態），使三片窮盡覆蓋且互斥，不另立第四片（守「片數固定為三」）。
* **D3 `defaultState` 收斂為唯讀聚合**：`export const defaultState = { ...princessStart, ...startPosition, ...gameRules }`，欄位順序與內容與重構前等價；既有 `import { defaultState }` 介面與 `defaultState.outfit` 引用維持可用，消費端零改動為目標（除 tuner 寫回見 D5）。
* **D4 `normalizeState`／`freshState` 讀法不變**：合併底仍經 `freshState({ randomizeTheme: false })` 取得，組裝順序與 `randomizeTheme` 隨機主題行為不變；`normalizeOutfit` 之 `baseOutfit = defaultState.outfit` 預設引數沿用。**不**改 normalize 任何分支邏輯。
* **D5 tuner 寫回相依**：[tool/defaults-tuner.js] 經 `/tool/save-defaults` 寫回 default-state.js 之檔案內容**須能被三具名 export 結構正確解析與再寫回**。3code 須驗證 tuner 套用（編輯 coins／outfit／owned 後寫回）產生之檔案仍合法、三片結構不被破壞；若寫回模板與單一物件耦合，連帶更新寫回邏輯（最小幅度、不改 tuner UI）。
* **D6 回歸守門（3code 落地）**：以 [game-engine/testing/selftests.js] 固化不變式——`save-load` 維持綠燈（舊存檔載入結果不變）、新增「起始值快照」斷言（`freshState({randomizeTheme:false})`／`defaultState` 之欄位集合與各預設值與重構前一致、且三具名片段聯集等於 `defaultState`、彼此鍵不重疊）。`mood-extend`／`data-audit`／`monkey` 維持綠燈。

## 4. 影響面與不變式

* **預期影響檔案（留 3code 落地）**：[game-engine/state/default-state.js]（三具名 export＋聚合 `defaultState`）、[game-engine/state/game-state.js]（如沿用 `defaultState` 介面則零改；若改引用具名片段則同步）、[tool/defaults-tuner.js]（寫回模板對齊三片，必要時）、[game-engine/testing/selftests.js]（起始值快照斷言）、[docs/design-issue259.md]（本檔）、[README.md]（變更紀錄一行）、[VERSION]／[CHANGELOG.md]／[game-engine/build/version.js]（refactor、playerVisible:false、版號於 merge 釘選）。**[docs/design.md] 不改。**
* **不變式**：① 起始值與物件形狀逐位元等價；② `normalizeState`／`freshState` 行為與舊存檔載入結果不變；③ 三具名片段聯集＝`defaultState`、鍵互斥不重疊；④ 無多檔拆分、無相容聚合抽象層、無 wear-only 式特例雙軌；⑤ `mood` 宣告與行為不動（#262）；⑥ tuner 寫回後檔案仍合法可解析。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **議題條理自洽（切分窮盡且互斥）**：三片以「公主新局／起始位置／遊戲規則」切分，並於 D2 明訂 `energy`／`mood`／`speechEnabled` 歸「遊戲規則與家長」、起始進度空初值歸「公主新局」，補齊 issue 未列欄位，使三片窮盡且鍵互斥；以 D6 快照斷言機判「聯集＝defaultState、鍵不重疊」杜絕遺漏或重複。
* **不衝擊現有功能**：`normalizeState` 合併底為 `freshState({randomizeTheme:false})` 而非裸 `defaultState`，D4 明令不改其組裝順序與隨機主題行為；`defaultState` 維持唯讀聚合介面，消費端零改動為目標；以 `save-load` selftest 與起始值快照固化，杜絕識別色／花紋／outfit 正規化結果漂移。
* **不積技術債（單一機制）**：採同檔具名 export、`defaultState` 僅為唯讀聚合，不建多檔、不建相容轉接層，避免「一份資料兩種讀法」雙軌；單一事實來源為三具名片段（D3）。
* **測試補強**：本案非 Bug 而為結構重構；以 `save-load`＋起始值快照斷言固化「起始值不變、舊存檔相容、三片聯集＝defaultState」之不變式（含 tuner 寫回路徑驗證），作為重構安全網。

## 6. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一行（內部整理、不影響玩法）。`docs/design.md` 未改（docLint sol 維持 0）。
* **3code 程式產物**（依本 note §3）：
  * [game-engine/state/default-state.js]：三具名片段 export＋聚合 `defaultState`（D2／D3），加註 issue #259 約定。
  * [tool/defaults-tuner.js]：寫回模板對齊三片（D5，必要時）。
  * [game-engine/testing/selftests.js]：起始值快照斷言（D6）；必要時 bump [game-engine/main.js] 之 `selftests.js?v=`。
  * [VERSION]／[CHANGELOG.md]／[game-engine/build/version.js]：refactor、`playerVisible:false`、版號於 merge 釘選（patch）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（改動檔）／`docLint docs/design.md`（sol 0）／`repoLint .` 0／`genVersion --check` 通過；headless selftest PASS、console 0 error；`save-load`＋新增起始值快照 PASS、既有 `mood-extend`／`data-audit`／`monkey` 維持綠燈。
  * **GATE §5（實機 visual-qa）**：**不適用**——本案為起始狀態組態之檔案內部重組、無任何 UI／渲染／玩法變動（純結構、行為保持），以 GATE §1 機判＋起始值快照即足，無新增畫面需人工視覺複核。
* **依賴安全**：純靜態網站、無 package 相依（techStackStaticWeb），`npm audit` 不適用。
