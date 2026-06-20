# 設計note — issue #205 打工改為實得 coins 後下架、再作答選項順序隨機

> 本檔為 2plan 設計note（沿 #177／#196 焦點變更慣例）。**初判 Option A**：於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；規則由本 note 承載、由 3code 落地並以 selftest 守回歸。本案為 **#177「每場景打工每遊玩週期限答對一次」之下架條件精修**：把下架觸發由「**答對即下架**」改為「**本次實際賺到 coins（>0）才下架**」。對應既有 **spec#11**（打工以 coins 回饋體現勞動所得、避免誘發洗 coins），以 **spec#9**（遊玩週期＝重置界線）為重置界線，受 **spec#7**（模組化：規則對新場景自動套用）約束。⚠️ 審查點見 §4：design.md 已以 sysCase／intTest 記錄打工發 coins 行為，USR 可選擇是否將本規則以 USR-gated 方式明文寫入 design.md（Option B），預設維持 Option A。
>
> **USR 方向（2026-06-20，issue #205，ISSUE-READY）**：①打工本週期下架條件由「答對」改為「**實得 coins（>0）**」；**0 coins 答對**（按過中文協助／答錯≥2 次到 `none` 階）**不下架**、本週期仍可在該場景再作答賺取 coins。②答案順序：**沿用既有「每次進入打工渲染期 `shuffled`」即達標、本案不另改**（USR 於 obj 審查點裁決）。③範圍僅打工(job)；聊天(chat) 不套用（沿 #177）。

## 1. 現況量測（以產物為準，現行 main 已 ff 同步含 #196／#212）

### 打工下架觸發（現況：答對即下架，與實得 coins 脫鉤）

* **下架條件＝「答對」無條件觸發**：`answerLesson`（[game-engine/main.js] L2757）打工(job，`isChat=false`) 答對分支在 coins 結算後**無條件**呼叫 `markJobDone(state, activeLesson.place)`（L2807）；原碼註解明示「**即使本次無 coins（中文／第三次）仍下架**」（#177 D6）——換言之只要答對就標記本場景打工本週期完成、Work 下架，與本次實得 coins 多寡無關。
* **coins 由獎勵階梯決定、可為 0**：`coins` 於同分支由 `baseCoins`（L2790，`activeLesson.reward.coins`）× `helpRewardTier()`（L2268）決定——`full`（答錯 0 次且未用中文）＝全額、`half`（答錯 1 次）＝半額（×`REWARD_SECOND_TRY_RATIO` 0.5）、`none`（按過中文 `advChineseUsed`／答錯 ≥2 次）＝ `0`；`applyEffects({ coins })`（L2797）發給。故「答對但 coins=0」確實存在（中文協助或第三次以上才答對），現行仍會下架。
* **既有回饋文案已分流 coins 有無**：`burstText`／`feedbackText`（L2799-2804）已依 `coins > 0` 分為 `+N coins` 與 `No coins this time…`；唯下架與否未跟著分流。

### 下架機制與呈現面（#177 既有，本案沿用不動）

* **唯一狀態＝`cycle.jobsDone`、唯一寫入者＝`markJobDone`**：[game-engine/system/play-clock.js] `cycle.jobsDone`（本週期已下架打工場景 id 陣列），由 `markJobDone(state, place)` 去重寫入、`isJobDone(state, place)` 查詢；`startSession` 重置（對齊 spec#9 遊玩週期）、`normalizePlayLimit` 守舊存檔。
* **所有呈現面皆讀 `isJobDone`**：場景第一層 `firstLayerActionsFor` 之 practice 受 `jobDoneThisCycle`（=`isJobDone`）下架（[game-engine/flow/scene-actions.js] L45）；main.js `jobAvailableForPlace(place)=hasLessonsForPlace(place) && !isJobDone(state, place)` 統一套用**六處** practice 呈現面（場景選單、目的地卡 badge、目的地卡說明文、地圖 `travelActionLabel`、`openHintAdv` 提示文、`openPracticeAction` 守門）。
* **關鍵推論（最小爆炸半徑）**：六處呈現面與入口 gate 全部**只讀** `isJobDone`，而 `isJobDone` 只反映 `markJobDone` 何時被呼叫。**故只要改變「`markJobDone` 在何條件下被呼叫」（本案：coins>0），新下架條件即自動傳播至全部呈現面，毋須逐面修改。**

### 答案順序（現況：每次進入打工即隨機，已達標）

* **渲染期隨機**：選項渲染 `renderChoices` 以 `shuffled(options)`（[game-engine/main.js] L2203）打亂位置；`shuffled` 為 `[...items].sort(() => Math.random() - 0.5)`（L2876）。`limitChoiceOptions` 永遠保留正解後再交 `shuffled`，故最終位置隨機。
* **每次進入打工皆重排**：`openQuestAdv`→`renderChoices` 於每次進入打工時重跑 `shuffled`；玩家答對但 0 coins 後重新進入該場景打工再作答時，選項位置即重新隨機。
* **唯一例外**：同一題作答中按「Try again」（答錯，L2761-2769）當次僅停用答錯鈕、不重走 `renderChoices`，故當次不重排——惟此非本案訴求（USR 已裁決沿用既有 shuffle，見 §3 D4／§4②）。
* 連線檢查：repo [solKidGalGame] Issue 讀寫正常、public。

## 2. 設計命題（USR 目標）

* **下架條件對齊實得報酬**：唯有本次答題**實得 coins（>0）**才標記該場景打工本週期完成並下架；答對但 coins=0（`none` 階）不下架，本週期仍可在該場景再作答以賺取 coins。每場景每週期仍只「實得一次 coins」即下架（與 #177「計酬一次」原意一致），只是把「答對但沒賺到」由「消耗（下架）」改為「不消耗（可再試）」。
* **重置界線不變**：沿 spec#9 遊玩週期（休息→續玩＝新週期重置），重用 #177 `cycle.jobsDone`／`startSession`。
* **答案順序**：沿用既有渲染期 `shuffled`，本案不另改（USR 裁決）。
* **範圍**：僅打工(job)；聊天(chat) 不套用（不發 coins、無刷錢誘因，沿 #177 D6）。不動取題、獎勵階梯、週期統計、存檔結構。

## 3. 設計決策（確切 UI 文案／版型留 3code visual-qa）

### D1：`markJobDone` 由「答對」分支移入「`coins > 0`」條件（唯一核心變更）

* 於 `answerLesson`（[game-engine/main.js]）打工(job) 答對分支，將 L2807 之 `markJobDone(state, activeLesson.place);` 改為僅在本次實得 coins 時呼叫，例如 `if (coins > 0) markJobDone(state, activeLesson.place);`。
* `coins` 已於同分支算妥（`full`／`half` → >0；`none` → 0），條件直接複用、不另計算。
* **此為唯一行為變更點**：因下架狀態 `isJobDone` 之唯一寫入者即 `markJobDone`，改其呼叫條件即令全部呈現面（§1）一致改採新條件，無須他處改動。

### D2：0 coins 答對 → 不下架、本週期仍可再作答（由 D1 自然達成）

* `none` 階（中文協助／答錯≥2 次）答對時 `coins=0`，D1 條件不成立 → 不寫入 `jobsDone` → 該場景打工本週期不下架、六處呈現面續顯示 Work、玩家可再進入作答。
* `addUnique("completedLessons", …)`／日誌（[game-engine/main.js] L2809 起，跨週期成就／diary）**維持無條件記錄**（玩家確已答對，屬學習紀錄、與下架無關，不在本案調整範圍）。
* `half` 階（答錯 1 次、未用中文）coins>0 → 仍下架（半額亦屬「賺到錢」，與 #177 一致）。

### D3：六處 practice 呈現面與入口 gate ＝沿用 #177 `jobAvailableForPlace`／`firstLayerActionsFor`、不動

* 不修改 [game-engine/flow/scene-actions.js] 與 `jobAvailableForPlace`；其行為隨 D1 改變之 `isJobDone` 自動正確（下架前後一致由 `cycle.jobsDone` 驅動）。

### D4：答案順序＝沿用既有 `shuffled`、本案不另改（USR 裁決）

* 既有渲染期 `shuffled`（[game-engine/main.js] L2203）已使每次進入打工選項位置隨機，涵蓋「0 coins 答對後再作答」路徑；**USR 於 obj 審查點裁決沿用、不另改**，故不於 `answerLesson` 答錯（Try again）分支新增重排，避免過度工程（§4②）。

### D5：重置、存檔相容、週期內持久 ＝沿用 #177、不動

* `cycle.jobsDone` 隨 `startSession` 重置（D4 of #177）、`normalizePlayLimit` 守舊存檔、週期內持久；本案不新增存檔欄、不改重置點。
* **語意微調僅在「寫入時機」**：舊規則本週期可能因 0-coin 答對而已寫入 `jobsDone` 之場景，新規則下不再因此寫入；對既存存檔無破壞性（`jobsDone` 仍為合法場景 id 陣列，至多本週期某場景由「已下架」變「可再作答」，下一週期一致重置）。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj ＜I＞ 種子已預核此方向）**：規則由本 note 承載、3code 落地、selftest 守回歸；`docs/design.md` ＜I／II＞ spec# 編號不增刪、文字不改（docLint sol 維持 0）。
  * **可選 Option B（USR-gated）**：若 USR 希望把下架條件寫入 design 級行為，可一併：(a) 於 **spec#11** 句末微修補述「且打工以本次實得 coins（>0）為同一遊玩週期下架條件（0 coins 答對不下架、可再作答）」（屬 ＜I＞ 回修、USR-gated）；(b) 調整承接打工之 sysCase／(c) ＜III＞ intTest／(d) ＜IV＞ spec#11 觀察項。spec# 編號不增減。預設不做、維持 Option A。
* **② 答案順序範圍（已由 USR 裁決，記錄）**：沿用既有每次進入打工之渲染期 `shuffled` 即視為達標，本案不另改 shuffle、不於 Try-again 當次重排。如後續 USR 改要求「同題重試亦重排」，再於 `answerLesson` 答錯分支評估重走選項渲染。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 維持 0）。若 §4① USR 改選 Option B，再補 design.md（spec#11 微修＋sysCase＋intTest＋IV，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * [game-engine/main.js]：`answerLesson` 打工答對分支之 `markJobDone` 改為 `coins > 0` 條件呼叫（D1/D2）。可選：0-coin 答對之 `feedbackText` 補一句鼓勵再試（如「再答一次就能賺到 coins」）——屬 UI 文案、留 visual-qa 收口，非必須。
  * [game-engine/flow/scene-actions.js]、`jobAvailableForPlace`、play-clock：**不動**（D3/D5）。
  * [game-engine/testing/selftests.js]：更新／補 `job-cycle` 守門（見下）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（main.js／selftests.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error。
  * **selftest 斷言更新（`job-cycle`）**：
    * ①打工答對且**實得 coins>0**（full／half）→ 發 coins、`jobsDone` 含該場景、`isJobDone` 真、practice **下架**（沿用既有斷言）。
    * ②打工答對但 **coins=0**（模擬 `none` 階：注入 `advChineseUsed=true` 或 ≥2 次答錯後答對）→ **不寫入 `jobsDone`、`isJobDone` 偽、practice 仍在、可再作答**（本案新增、核心回歸防護）。
    * ③跨週期（`startSession`／`resumeFromRest`）後重置；④舊存檔（無 `jobsDone`）正規化為空；⑤聊天答對不寫入 `jobsDone`（沿用）。
  * **GATE §5（實機 visual-qa）**：某場景打工**全額答對**→ Work 消失；另一輪**用中文協助答對（0 coins）**→ Work **仍在**、可再進入；再以全額答對 → Work 消失。逐項以 DOM 動作標籤＋狀態（`isJobDone`／`jobsDone`／coins）為證（沿 #177：preview renderer 對本遊戲逾時，改 DOM＋狀態佐證，GATE §4 合格）。
* **交付物**：沿 #157／#166／#177 焦點修正慣例，GATE 報告記於本 note §6（3code 補）與 PR 留言；A5 `test-summary.pdf` 待 USR 裁決。
