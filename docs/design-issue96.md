# 設計note — issue #96 統一地區英文題庫（場景自帶、手寫固定、進場載入）

* **議題**：[#96](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/96) 統一 castle 及其他地區英文（實為地區英文**題庫一致性重構**）。
* **分支／PR**：`feat/issue96-unify-lesson-bank`。
* **型態**：內容／資料結構與載入模型一致性重構。design.md ＜I＞ spec#1–#10 不變（obj 已定不新增 spec#）；[modScene模組] 之 `sysCase#1.1`（載入題庫）、`sysCase#8.1`（題庫含中文欄位、缺則降級）之**行為描述仍成立**，故採 **Option A：`docs/design.md` 不動（docLint 0）、`README.md` 不動（無玩家可見行為變更）**；題庫**結構／中文存法／載入模型**之設計契約以本 note 承載，交 3code 實作。
* **USR 定調（obj #96 已核准）**：四地區英文題庫以 **castle 手寫固定作法**為基準收斂，並改為 **「場景自帶、題目自帶中文、進場載入」** 之內聚模型——「一個地點＝一個獨立場景包＝美術＋NPC＋對話＋題庫（任務外框與題目同一塊、每題內嵌中文）」。

---

## 1. 現況盤點（以產物為準）

四地區題庫最終皆餵入 [content-package/areas/_shared/lesson-helpers.js] 之 `makeLessons`／`makeQuestTemplates`，由 [game-engine/data/game-data.js] 彙整為**全域扁平註冊表** `lessons`／`questTemplates`，引擎 [game-engine/main.js] `pickLesson(place)` 於執行時以 `place` id **過濾全域陣列**取題、[game-engine/state/game-state.js] 以 `questTemplates.find(place)` 取任務外框。三面分歧：

| 面向 | 🏰 castle | 🏘🌾🌲 urban／rural／wild |
|---|---|---|
| **產題作法** | 每地點 5 題**逐題手寫**（`q()` 寫死），5 地點 25 題 | **參數化題型產生器**（`starterQuestions`／`moversQuestions`／`flyersQuestions`），固定 5 槽位骨架量產，合計約 **145 題**（urban 70／rural 35／wild 40） |
| **中文存法** | 題目**不帶中文**，靠獨立整句表 `castleZh`（約 130 條），`makeLessons` 查表補 | 題目**內嵌** `promptZh`／`choicesZh` ＋單字表 `tz()` |
| **分級** | Dolch Sight Words 220 | Cambridge Pre-A1 Starters／A1 Movers／A2 Flyers |

* **存放**：題庫存於各 area `manifest.js` 之 `xxxLessonPlaces` 清單，與同檔 `xxxSceneConfigs`（場景設定）**並排為兩份平行清單**、同以 `place id` 為鍵；改一地點需動兩處。題目**不在**場景物件內。
* **同一組資料被拆**：單一 `lessonPlace` 源頭即含任務外框（`theme`/`title`/`opening`/`ending`）＋ `questions`，但 `makeLessons`／`makeQuestTemplates` 衍生時拆成 `lessons`／`questTemplates` **兩份全域註冊表**，引擎再分別取用。
* **場景共用**：`scene` id／背景圖檔跨地點／跨 area 重用（如 urban `harbor`＋`port` 共用 `scene-harbor`、`scene-garden` 跨 area）。
* **載入**：eager 全域扁平＋執行時過濾，非進場才取。

## 2. 設計決策

### D1：統一單題資料形狀（手寫固定＋內嵌中文）

* 四地區一致採**手寫固定題庫**——逐題實寫，**移除** `starterQuestions`／`moversQuestions`／`flyersQuestions` 三支題型產生器。
* **每題內嵌中文**，目標單題形狀：

```js
{ prompt, promptZh, answer, choices, choicesZh, words, reward }   // 自帶中文、自足
```

* castle 現行獨立整句表 `castleZh` **內聯為各題內嵌中文**（urban/rural/wild 本即內嵌，僅改手寫）。`openingZh` 隨任務外框內嵌。
* **保留各區現有難度分級**（Dolch／Cambridge Starters・Movers・Flyers 為刻意階梯，**不壓平**）；攤平後 rendered 題目維持等義，對玩家無感。

### D2：場景自帶題庫整塊（搬進 sceneConfigs、收掉雙註冊表、場景獨立）

* 將每地點之**任務外框（`theme`/`title`/`opening`/`ending`）＋含內嵌中文之 `questions`** 視為**同一組課程資料**，整塊**併入該地點的 `sceneConfigs` 條目**，使場景自帶題庫；獨立 `xxxLessonPlaces` 平行清單退場。
* **收掉 `lessons`／`questTemplates` 兩份全域註冊表的拆分**——同一塊課程資料不再被 `makeLessons`／`makeQuestTemplates` 拆兩份。
* 無題庫之場景（房間／商店／出入口）單純不帶該課程資料塊。
* **場景獨立**：解除 `scene` id 的跨地點共用為各自獨立；背景圖檔可續指同一 `.webp`（獨立 ≠ 複製美術資產），以利未來分化。

### D3：載入時機改 lazy（進場才取該場景題庫）

* `pickLesson(place)`／`hasLessonsForPlace(place)`／任務外框取用改為從**進場之場景物件**直接讀其課程資料塊，取代「全域扁平註冊表＋執行時過濾」。
* 連帶評估 `makeLessons`／`makeQuestTemplates`（[content-package/areas/_shared/lesson-helpers.js]）與 [game-engine/data/game-data.js] 之全域彙整**退場或改型**；[game-engine/state/game-state.js] 之 `questTemplates.find(place)` 取任務外框改讀場景物件。

### D4：定為單一作法基準

* 將「場景自帶、手寫固定、題目自帶中文、進場載入、外框與題目同一塊」定為地區題庫的**單一作法基準**，後續新地區（如 ocean）依循，防止再長出第二套機制（generator 或全域註冊表）。本基準以本 note 承載；如需固化為 repo 內容撰寫慣例文件，列為後續可選。

## 3. 設計契約（可驗證不變式，交 3code 守）

1. **結構一致**：四地區每練習地點題數一致（沿現行 5 題／地點）；每題必備欄位齊備（`prompt`/`answer`/`choices`/`words`/`reward`），且 `answer ∈ choices`。
2. **題目自帶中文**：每題 `promptZh`/`choicesZh`（及該地點 `openingZh`）逐題逐選項補齊，**整題不得無中文**；缺單項才回退既有「僅英文撥放」契約（issue #73 / `sysCase#8.1`）。
3. **行為等價（取題）**：改 lazy 後「進場景取得之題庫」與原全域過濾 `pickLesson` 結果**集合等價**（同地點可抽題集合不變、取題行為不退步）。
4. **玩家無感**：rendered 題目語意、難度分級、coins 獎勵與中文協助行為維持不變（spec#1／spec#7 行為不退步）。
5. **單一機制**：無殘留 generator 函式、無殘留 `lessons`／`questTemplates` 雙全域註冊表之拆分作法。

## 4. 切片計畫（建議，3code 承）

* 約 145 題（urban 70／rural 35／wild 40）＋ castle 25 題（內聯中文）建議**逐區切片**落地、逐題審句義與中文對照：
  * 切片1：建立場景自帶題庫結構與 lazy 取題介面，先以 **castle**（已手寫）內聯中文、搬入場景、切換 lazy，作為基準範式並驗等價。
  * 切片2–4：urban／rural／wild 各一切片——展開 generator 為逐題固定清單、補/保內嵌中文、搬入場景、移除 generator。
  * 收尾：移除 `makeLessons`／`makeQuestTemplates` 雙註冊表殘跡與全域彙整、場景 scene-id 解共用。

## 5. 審查點（USR）

* 三軸方向（手寫固定／場景自帶＋收雙註冊表／lazy 進場載入）與「保留難度分級、題目自帶中文」已於 obj #96 定案核准。
* 本 note 新增之 2plan 具體決策供 PR review：**Option A（design.md／README 不動）**、單題資料形狀（D1）、場景自帶整塊與場景獨立（D2）、lazy 取題介面（D3）、切片計畫（§4）、設計契約不變式（§3）。

## 6. 產物分工與 GATE 驗證計畫（交棒 3code）

* **不動** `docs/design.md`（docLint sol 0；sysCase#1.1/#8.1 行為描述仍成立）與 `README.md`（無對外操作流程變更）。
* 3code 完成判定（GATE）：
  * **GATE §1（機器判定）**：`tsc --noEmit` 0；`docLint docs/design.md` 0；`repoLint .` 0；既有 `?selftest`（含 `data-audit`／`save-load`／`monkey`／`chinese-reward`）`passed:true`、console 0 error。
  * **題庫一致性檢查**：於 [game-engine/testing/selftests.js] 增設檢查——每地點題數一致、每題必備欄位齊備、`answer ∈ choices`、**每題中文覆蓋率**（`promptZh`/`choicesZh` 補齊）；驗「進場取題 ≡ 原全域過濾」之集合等價（§3 不變式 1–3）。
  * 因本案涉引擎取題路徑（D3）改動，建議 3code 以 `data-audit`／新增結構檢查之 selftest 結果佐證；是否另產 `docs/test-summary.html` 由 3code 依 GATE 與改動面判定。
* **回歸重點**：答題（`runAct自訂玩家答英文題`）、中文協助（`runAct自訂玩家取用中文協助`）、協助獎勵階梯（`runAct自訂系統結算協助獎勵`）行為不退步（對應既有 intTest#05／#20／#21）。

## 7. 3code 實作與驗證結果（CODE-READY，2026-06-15）

> 沿 #101／#111／#120 之 Option A：本案為**內部架構/內容一致性重構、無玩家可見變更**，不另產 `docs/test-summary.html`；GATE 驗證結果記於本節。`docs/design.md`／`README.md` 全程未動。

### 實作（垂直切片，5 commit）

* **切片1**（`29cef4c`）：四區 170 題以 Node 腳本由「已解析之 resolved lessons（含內嵌中文）」**序列化為靜態 `lessonBank`**（手寫固定形狀 `{prompt,promptZh,answer,choices,choicesZh,words,reward}`），經 `mergeLessons` 併入各 `sceneConfigs` 條目；castle 之 `castleZh` 整句表即於此內聯為各題內嵌中文。舊路徑暫留、行為不變。
* **切片2**（`eb01622`）：引擎改 **lazy 進場取題**——[game-engine/main.js] `pickLesson`／`hasLessonsForPlace` 改讀 `sceneConfigs[place].lesson`；[game-engine/data/game-data.js] `questTemplates` 由 `sceneConfigs` 就地導出（**收掉雙註冊表拆分**）。
* **切片3**（`4337c63`）：移除舊路徑——四區 manifest 之題型產生器（`starterQuestions`/`moversQuestions`/`flyersQuestions`）、zh 表＋`tz()`、`lessonPlaces`，`_shared/lesson-helpers.js` 之 `makeLessons`/`makeQuestTemplates`/`zhLookup`，game-data 全域 `lessons` 匯出（共 −469 行）。
* **切片4**（`c0b9291`）：**場景 scene-id 去共用**——`scene-garden`（→`scene-luminara-castle`／`scene-castle-gate`）、`scene-harbor`（→`scene-port`）、`scene-rural-farm`（→`scene-rural-exit`）；44 場景各自獨立、背景圖檔續用同檔（scene-id 僅為 `.adv-scene` CSS class，唯 `scene-princess-room` 有專屬樣式、不在共用群）。並於 `data-audit` 增設**題庫契約守護**。

### GATE §1（機器判定，全數 exit 0）

* `npx tsc --noEmit --project jsconfig.json` → 0
* `docLint docs/design.md` → PASS（0）；`repoLint .` → PASS（0）

### GATE §1（瀏覽器 selftest，活 build，console 0 error）

| selftest | 結果 | 涵蓋 |
|---|---|---|
| `data-audit`（含新增 `lessonAudit`） | ✅ passed | 題庫結構/欄位/`answer∈choices`/**中文覆蓋**；計 places 34（castle5/urban14/rural7/wild8）、questions 170 |
| `chinese-reward` | ✅ passed | 答題＋中文協助＋獎勵階梯（全額/半額/無） |
| `monkey`（300 步） | ✅ passed | 隨機操作無 runtime error |
| `save-load` | ✅ passed | 匯出/匯入還原 |
| `character-voice` | ✅ passed | NPC 配音＋公主朗讀所選作答（經 `getActiveLesson`） |

### 等價佐證（取題行為不退步，§3 不變式 3）

* 切片落地時以 Node 比對：每區 `sceneConfigs[place].lesson.questions` 與重構前 resolved lessons **逐題逐欄位全等**（castle 25／urban 70／rural 35／wild 40＝170）；derived `questTemplates` 與舊 `xxxQuestTemplates` 串接**集合全等**（34）；34 個有題地點皆可由 `sceneConfigs` 解析（無不可達）。

### GATE §5（業界水準審查）

* **鏡頭 C（逐頁 UI/UX）：不適用**——本案無任何玩家可見變更（題庫 rendered 內容、難度分級、coins、中文協助行為均等價），未改 DOM 與樣式（scene-id 去共用不影響無專屬 CSS 之場景）。
* **鏡頭 A/B（能力/專家缺口）**：產品能力（短回合英文練習、中文協助、獎勵閉環）經上表 selftest 驗證與重構前等價、無退步；題庫產出已收斂為單一作法（手寫固定＋內嵌中文＋場景自帶＋lazy），消除雙軌/雙註冊表技術債，並以 `data-audit` 契約守護防回歸。新地區（如 ocean）依 `lessonBank`＋`mergeLessons` 範式擴充即可。

### 後續修復（PR 自動審查回應，`8c4d7c7`）

* **Codex review P2**：序列化靜態 `lessonBank` 時遺漏每題 `id`／`vocabProfile`，致 `pickLesson` 回傳缺欄、`answerLesson` 寫入 `completedLessons`（徽章 First Quest／Kind Helper）與日誌 `lessonId`／`vocabProfile` 變 `undefined`，完成進度停擺。（原等價檢查只比對 rendered 欄位、漏比進度欄位；selftest 答題未斷言 `completedLessons` 推進，故漏接。）
* **修法**：`mergeLessons` 注入地區常數 `area`／`vocabProfile` 至各 lesson 區塊；`pickLesson` 由 `${lesson.area}-${place}-${NN}` 導出 lessonId（格式同重構前）＋帶 `vocabProfile`。`data-audit` `lessonAudit` 加 area/vocabProfile 守護。
* **驗證**：實機完成一題確認 `completedLessons` 0→1 且記為 `castle-kingHall-03`、日誌帶 `lessonId`/`vocabProfile`；`data-audit`／`chinese-reward`／`monkey`(300) 重跑全綠、console 0。

### 結論

* **可宣稱完成（CODE-READY 候選）**：GATE §1 全綠、§3 契約守護就位、行為等價佐證齊備（含完成進度/徽章/日誌）、design.md/README 未動（docLint 0）。待 USR 於 PR #122 審查 merge。
