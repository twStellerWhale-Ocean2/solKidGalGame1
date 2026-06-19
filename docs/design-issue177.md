# 設計note — issue #177 每場景打工每遊玩週期限答對一次、杜絕重複刷錢

> 本檔為 2plan 設計note。**初判 Option A**：本項為既有方案下之打工經濟反重複刷錢精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；規則由本 note 承載、由 3code 落地並以 selftest 守回歸。意旨對應既有 **spec#11**（打工以 coins 回饋體現勞動所得、各地區報酬平緩遞增以**避免誘發洗 coins**——本案補上「同場景同遊玩週期最多計酬一次」之週期內防線），以 **spec#9**（遊玩週期＝護眼結算／重置單位）為重置界線，受 **spec#7**（模組化：規則對新場景自動套用）約束。⚠️ 審查點見 §4：design.md 既以 sysCase／intTest 記錄打工發 coins 行為，USR 可選擇是否將本規則以 USR-gated 方式明文寫入 design.md（spec#11 微修＋sysCase＋intTest＋IV），預設維持 Option A。

## 1. 現況量測（以產物為準）

### 打工取題與計酬（現況：可同週期重複計酬）

* **取題＝隨機、不排除已答對**：`pickLesson(place, bankKey="lesson")`（[game-engine/main.js] L2772）以 `Math.floor(Math.random()*questions.length)` 自場景題庫隨機抽題，**不排除本週期已答對之題**。
* **打工入口**：`openQuestAdv`（[game-engine/main.js] L2178）預設 `mode="job"`（L2180）；場景第一層動作由 `firstLayerActionsFor(hotspot, { hasLessons, hasChat })`（[game-engine/flow/scene-actions.js] L42，呼叫處於 [game-engine/main.js]）組裝，打工(Work 💼 practice) 僅由 `options.hasLessons`（＝`hasLessonsForPlace`，場景有非空 lesson 題庫）決定是否出現（L45），**未對「本週期是否已答對」做任何阻擋**。
* **答對發 coins、無重複防護**：`answerLesson`（[game-engine/main.js] L2794）以 `isChat=activeLessonMode==="chat"`（L2812）分流；打工(job，`isChat=false`)走 `applyEffects({coins})` 依 `helpRewardTier()`（full／half／none，#73）發 coins。同場景可重複進入、重複答對、重複計酬。

### 兩項可承接之基礎（現況：材料齊、未組裝）

* **`completedLessons`（跨週期永久、僅供徽章／日誌）**：答對後 `addUnique("completedLessons",[activeLesson.id])`（[game-engine/main.js] L2843），id 格式 job＝`${area}-${place}-NN`。初值 `[]`（[game-engine/state/default-state.js]）、跨週期永久累積、不隨週期重置；用途僅徽章門檻（First Quest≥1／Kind Helper≥5，[game-engine/state/game-state.js]）與日誌，**未接到取題或作答阻擋**。
* **`playLimit.cycle`（以週期為界、僅統計數量）**：[game-engine/system/play-clock.js] 之 `cycle={coinsAtStart,answered,correct}`，於 `startSession`（L82）重置；進入休息 `enterRest`（L124）→玩家續玩 `resumeFromRest`（L132）→`startSession` 即新週期（對齊 spec#9，預設 playMinutes 15／playMaxMinutes 20）。`recordAnswer`（L150，main.js 以 `recordCycleAnswer` 別名於 L2797 呼叫）只累加 answered／correct，**不記錄「本週期已答對哪些場景之打工」**。

### 癥結小結

* 「已答對之題」記在**跨週期永久**之 `completedLessons`；「週期界線」記在**只統計數量**之 `playLimit.cycle`；兩者未交集——缺一個「**以遊玩週期為單位、記錄本週期已答對哪些場景打工**」之狀態與其阻擋點。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 目標：在**同一遊玩週期內**，每個場景的打工最多「答對計酬一次」；某場景打工答對後，該場景之打工於本週期**下架**（題目消失／不可再作答），杜絕同週期對同一場景重複答對重複賺錢；下一遊玩週期（進入休息後重新開始）重置、可再次作答。
* 重置界線：對齊 spec#9 之「遊玩週期」（休息→續玩＝新週期），與護眼結算共用同一週期界線。
* 範圍界定（呼應 Issue「待確認」）：本增量主體＝**打工(job，答對發 coins)**；**聊天(chat) 不套用**（見 D6、§4②）。

## 3. 設計決策（確切 UI 文案／版型留 3code visual-qa）

### D1：以「本遊玩週期已答對之打工場景」狀態承載規則，落於 `playLimit.cycle`

* 於 `playLimit.cycle` 增一欄記錄本週期已答對打工之場景（場景 id 集合，序列化為陣列，如 `cycle.jobsDone: []`）。
* **落點理由**：`cycle` 天然以遊玩週期為生命週期、`startSession` 既有重置點即免費涵蓋本規則之重置（見 D4），且與週期統計同層、語意一致。
* **不沿用 `completedLessons`**：後者為跨週期永久、且供徽章／日誌；若把週期性語意硬塞入會混淆兩種生命週期、污染徽章／進度判定（技術債）。兩者責任分離——`completedLessons`＝跨週期成就累積、`cycle.jobsDone`＝本週期內下架。

### D2：記錄時機＝打工答對時，由 play-clock 持有

* 於 `answerLesson`（[game-engine/main.js]）答對且為打工(job，`isChat=false`) 之分支，將該場景 id 記入 `cycle.jobsDone`；經 play-clock 新增之 helper（如 `markJobDone(state, place)`）寫入，與既有 `recordAnswer`／`recordCycleAnswer` 同慣例（play-clock 為 cycle 狀態唯一持有者，main.js 只呼叫）。
* 僅打工計入；聊天答對不記（D6）。答錯不記、不下架（見 §4③）。

### D3：阻擋＝場景第一層選單隱藏打工動作（「打工消失」）

* 主機制＝**入口層下架**：`firstLayerActionsFor` 之 practice 動作改由「`hasLessons` **且** 本週期該場景打工未答對」決定是否出現——已答對者該場景本週期不再出現 Work 動作，即 Issue 所述「題目消失／不可再作答」。
  * 落地方式：呼叫處（[game-engine/main.js]）傳入新旗標（如 `jobDoneThisCycle`），`scene-actions.js` 以 `options.hasLessons && !options.jobDoneThisCycle` 決定 practice。
* **一致性**：其餘 practice 呈現面（如目的地卡片 badge「Practice」、場景提示文案、第二層提示）須與入口層一致，下架後不再引導打工（確切面盤點與文案由 3code 收口）。
* 聊天(chat)、逛店、退款、換裝等其他動作不受影響（仍依各自旗標出現）。

### D4：重置＝對齊 spec#9 週期，重用既有 `startSession`，不另立重置

* `cycle.jobsDone` 隨 `startSession`（[game-engine/system/play-clock.js] L82）一併重置為空——涵蓋玩家休息後續玩（`resumeFromRest`）與離開已足休息後自動開新回合（`tick` 之 `startSession`）兩條路徑；新週期該場景打工自動重新可作答。
* 不新增獨立重置邏輯，避免與週期生命週期分歧。

### D5：存檔相容與週期內持久

* `normalizePlayLimit`（[game-engine/system/play-clock.js] L36）擴充守新欄：非陣列／缺漏→空陣列、元素強制為字串（場景 id）；舊存檔無此欄者視為「本週期尚未答對任何打工」。
* **週期內持久**：`cycle` 屬帳號狀態、會持久化至本機儲存；玩家於同一週期中途關閉重開（sessionEndsAt 未過）時下架狀態保留（打工仍消失），符合「以週期為單位」之語意；跨週期則由 D4 重置。

### D6：範圍＝僅打工(job)；聊天(chat) 不套用（本增量）

* 本增量僅對打工(job，答對發 coins) 套用「每場景每週期限答對一次」。
* **聊天不套用之理由**：聊天答對加心情並延長遊玩時間、**不發 coins**，無「刷錢」誘因；其「重複延長遊玩時間」之上限已由 spec#9 護眼硬上限 `playMaxMinutes`／`sessionMaxEndsAt`（[game-engine/system/play-clock.js] `extendSession` L94）約束，不致無限延長。
* 屬產品範圍決策，**待 USR 於 §4② 確認／否決**（Issue 原列「聊天是否套用待確認」）。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核此方向）**：本規則由本 note 承載、3code 落地、selftest 守回歸；`docs/design.md` ＜I／II＞ spec# 編號不增刪、文字不改（docLint sol 維持 0）。
  * **可選 Option B（USR-gated，如 USR 希望寫入 design 級行為）**：因 design.md 已以 sysCase／intTest 記錄「打工答對發 coins」行為，可一併：(a) 於 **spec#11** 句末微修補述「且同一場景之打工於同一遊玩週期最多計酬一次（答對後該週期下架、下一週期重置）」（屬 ＜I＞ 回修、USR-gated）；(b) 於承接打工／週期之系統新增一條 sysCase；(c) ＜III＞ 補一條 intTest；(d) ＜IV＞ spec#11 成效追蹤補對應觀察項。spec# 編號不增減。預設不做、維持 Option A。
* **② 範圍確認（聊天是否套用）**：建議**僅打工、聊天不套用**（理由見 D6）。若 USR 要求聊天亦限制（如防重複延長遊玩時間），擴及 chat 分支與其入口層下架，本 note 與 3code 對應放大。
* **③「下架」語意確認**：建議採「**答對才下架、各場景獨立計算、下架＝該場景本週期不再出現 Work 動作**」；答錯不消耗（仍可再試至答對）。若 USR 希望改為「仍可進入但提示已完成、不發 coins」之軟下架，UI 與機制對應調整。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 維持 0）。若 §4① USR 改選 Option B，再補 design.md（spec#11 微修＋sysCase＋intTest＋IV，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * [game-engine/system/play-clock.js]：`cycle` 增 `jobsDone`（D1）；`emptyCycle`／`startSession` 初始化與重置（D4）；`normalizePlayLimit` 守新欄（D5）；新增 helper `markJobDone(state, place)`／查詢（如 `isJobDoneThisCycle(state, place)`）（D2/D3）。
  * [game-engine/main.js]：`answerLesson` 打工答對分支呼叫 `markJobDone`（D2）；`firstLayerActionsFor` 呼叫處傳入 `jobDoneThisCycle`（D3）；其餘 practice 呈現面一致下架（D3）。
  * [game-engine/flow/scene-actions.js]：`firstLayerActionsFor` 之 practice 改 `hasLessons && !jobDoneThisCycle`（D3）。
  * [game-engine/testing/selftests.js]：回歸守門（見下）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（main.js／play-clock.js／selftests.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error。補 selftest 斷言：①同一週期內對某場景打工答對後，該場景打工不可再作答／不再計酬（`cycle.jobsDone` 含該場景、入口層不出 practice）；②跨週期（`startSession`／`resumeFromRest`）後重置、該場景打工恢復可作答；③舊存檔（無 `jobsDone`）正規化為空、視為未答對；④聊天答對不寫入 `jobsDone`（D6）。
  * **GATE §5（實機 visual-qa）**：於某場景打工答對 → 該場景 Work 動作消失、其他動作（聊天／逛店等）仍在；同週期重訪該場景無法再打工；經休息→續玩後該場景打工恢復；中途重整（同週期）下架狀態保留。逐項截圖佐證。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#153／#157／#166 焦點修正慣例：本焦點變更之 GATE 驗證結果記於本節與 PR 留言。`docs/design.md` 未改（Option A，docLint sol 0）。

### 實作（依 §3 D1–D6）

* **D1／D4／D5（[game-engine/system/play-clock.js]）**：`emptyCycle()`／`startSession()` 之 `cycle` 增 `jobsDone: []`（與遊玩週期同生命週期、`startSession` 重置免費）；`normalizePlayLimit` 守新欄（非陣列→[]、僅留字串 id，舊存檔視為未答對）。
* **D2／D3 記錄與查詢（[game-engine/system/play-clock.js]）**：新增 `markJobDone(state, place)`（去重 push）與 `isJobDone(state, place)`，與既有 `recordAnswer` 同慣例由 play-clock 持有 cycle 狀態。
* **D2 記錄時機（[game-engine/main.js] `answerLesson`）**：於打工(job，`isChat=false`) 答對分支呼叫 `markJobDone(state, activeLesson.place)`；聊天分支不呼叫（D6）。即使本次無 coins（中文／第三次）仍下架（答對即下架）。
* **D3 下架（[game-engine/flow/scene-actions.js]＋[game-engine/main.js]）**：`firstLayerActionsFor` 之 practice 改 `options.hasLessons && !options.jobDoneThisCycle`；`renderFirstLayerSceneActions` 呼叫處傳入 `jobDoneThisCycle: isJobDone(...)`。新增 main.js helper `jobAvailableForPlace(place)=hasLessonsForPlace(place) && !isJobDone(state, place)`，統一套用於六處 practice 呈現面：場景選單、目的地卡 badge、目的地卡說明文、地圖 travelActionLabel、openHintAdv 提示文、`openPracticeAction` 守門（已下架時改提示「本週期已完成、休息後再來」）。
* **回歸守門（[game-engine/testing/selftests.js]）**：新增 `runJobCycleSelfTest`（`?selftest=job-cycle`）＋ main.js 測試 hook `firstLayerActionKeys(place)`（回傳場景第一層動作含下架判斷）與 playClock `markJobDone`／`isJobDone`／`normalizeLimit`。

### GATE §1（機器判定，全綠）

* `node --check`：`main.js`／`system/play-clock.js`／`flow/scene-actions.js`／`testing/selftests.js` → 全 OK。
* `docLint docs/design.md`（sol）→ **0**；`repoLint .` → **0**。
* headless selftest（獨立 context，注入時鐘）全 PASS、console **0 error**：
  * **`job-cycle`（本案新增）**：`passed:true`——起始 practice 提供／jobsDone 空；聊天答對不計入 jobsDone 且不下架打工（D6）；打工答對 → 發 coins、`jobsDone:["kingHall"]`、`isJobDone` 真、practice **下架**、chat 仍在；休息後續玩（`resume`）→ jobsDone 重置、practice 復原（D4）；normalize 舊存檔（缺漏／雜質）→ 安全字串陣列（D5）。
  * **回歸**：`chat`（聊天+心情/延長、打工+coins 分流）、`playtimer`（週期結算）、`scene-nav`（兩層導覽）、`map-avatar`（跨地圖渲染含 shop class）、`data-audit`（shopCount 11、各類 10）、`monkey`（300 步）→ 全 `passed:true`、errors `[]`。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用。

### GATE §2 產品能力矩陣（摘要）

| story/case | 產品能力 | 實作入口 | 測試 | 狀態 |
|---|---|---|---|---|
| spec#11（反洗 coins）／spec#9（週期） | 每場景打工每遊玩週期限答對計酬一次、答對後下架 | `answerLesson`→`markJobDone`；`firstLayerActionsFor` gate；`jobAvailableForPlace` 六面 | `job-cycle` selftest（步驟 0–4） | 已測通過 |
| D4 重置 | 下一週期（休息後續玩）恢復可作答 | `startSession` 重置 `cycle.jobsDone` | `job-cycle` 步驟 3 | 已測通過 |
| D5 相容 | 舊存檔無 jobsDone → 視為未答對 | `normalizePlayLimit` | `job-cycle` 步驟 4 | 已測通過 |
| D6 範圍 | 聊天不套用、不計入 | `answerLesson` 聊天分支不呼叫 markJobDone | `job-cycle` 步驟 1 | 已測通過 |

結論摘要：**4/4 核心能力已測通過、0 未實作、0 責任邊界不符**。

### GATE §5（業界水準審查，異動 UI → 鏡頭 C 逐面）

* **鏡頭 C（scene 選單，主要異動面）**：實機（真實帳號＋注入時鐘）驅動 castle `kingHall` 第一層場景選單——
  * **下架前**：選單＝`["💬 Chat","💼 Work"]`、`isJobDone=false`、`jobsDone=[]`。
  * **打工答對後（markJobDone 同真實答對分支之狀態變更）**：選單＝`["💬 Chat"]`——**Work 動作消失**、Chat 保留；`isJobDone=true`、`jobsDone=["kingHall"]`。console 0 error。
* **其餘 practice 呈現面（map badge／destinationActionText／travelActionLabel／openHintAdv／openPracticeAction）**：統一走 `jobAvailableForPlace`；**打工未答對時與原 `hasLessonsForPlace` 完全等價（無回歸）**，僅「本週期已答對」時由「Practice/有打工」回退為一般呈現，與場景選單下架一致。
* **跨畫面一致性**：下架僅針對打工(job)，Chat／逛店／退款／換裝等其他動作依各自旗標不受影響；下一週期一致恢復。
* 分級：`務必要修` 0（核心下架已達成且 selftest 守門）；`可以接受`——下架採「Work 動作整個消失」（符合 Issue「題目消失／不可再作答」語意，USR §4③ 已確認）。截圖因本機 preview renderer 對本遊戲 canvas/語音持續佔用而逾時，改以 DOM 動作標籤＋狀態變更為證（GATE §4 合格證據：可操作流程＋資料狀態改變＋測試檔案＋runtime 紀錄）。
* **結論：可宣稱完成。**

### 交付物（test-summary.pdf 待 USR 裁決）

* 沿 #157／#166 焦點修正慣例，本節即 GATE 報告；是否另產 A5 直向 [docs/test-summary.pdf] 待 USR 裁決。QA 驅動為暫存、不作交付物。
