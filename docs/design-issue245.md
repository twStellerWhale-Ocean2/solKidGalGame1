# 設計note — issue #245 管理編輯工具新增場景編輯頁籤以檢視編修場景組態與對話

> 本檔為 #245 之設計note（plan 階段）。本案於 dev-only 作者工具 [Luminara Editor]（`tool/wardrobe-tuner.html`）最上方功能頁籤新增**場景設定**頁籤（既有為 衣物設定／公主預設／地圖設定），可檢視各場景組態（場景名稱／場景角色／場景背景）並**檢視與手動編修**場景對話（打工任務 `<area>LessonBank`、生活聊天 `<area>ChatLessonBank`），另提供**依提示詞 AI 自動生成對話**之輔助。沿用編輯器既有 dev-only、經 [server.mjs] 白名單最小改寫端點寫回之機制。**不新增 spec、不改動 design.md ＜I＞ 玩家能力規格**——編輯器於 design.md 屬 ＜IV.A＞「本機開發工具入口」dev-only 範疇（design.md L1335）、變更歸 internal／`playerVisible:false`；其所編修之對話內容服務既有 spec#1（場景對話）／spec#11（生活聊天與打工任務分流），所收斂之內容約束服務 spec#7（模組化內容調整）。docLint sol = 0（design.md 未改、維持基線 0）。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **編輯器為多頁籤殼**：[tool/wardrobe-tuner.html] 上方 `nav.app-tabs` 有三鈕——`data-tab="wardrobe"`（衣物設定）／`defaults`（公主預設）／`map`（地圖設定）；每鈕對應一 `section.editor-panel[data-panel]`。頁籤切換由 [tool/editor-tabs.js] `activate()` 控制：toggle `.active`、設 `panel.hidden`、並 `dispatchEvent("editor-tab-change", { detail:{ tab } })`。
* **各頁籤為獨立 module**：`<script type="module">` 依序載入 [tool/wardrobe-tuner.js]／[tool/defaults-tuner.js]／[tool/map-tuner.js]／[tool/editor-tabs.js]；分頁初始 `hidden`，待 `editor-tab-change` 切到該分頁才首次 render（確保隱藏時量不到尺寸的問題，見 map-tuner `state.rendered`）。
* **地圖頁籤為最貼近之範本**：[tool/map-tuner.js] import 各 area manifest（`castleArea`…）與 `world.js`，建 `maps{world,castle,…}` 工作副本，左欄節點清單／中欄地圖／右欄座標與儲存；儲存以 `postJson("/tool/save-map-positions", { file, positions })` 寫回，並有 `assetUrl`／`escapeHtml`／`setStatus`／`postJson` 等 helper。
* **場景對話資料散落於各 area manifest**（[content-package/areas/<area>/manifest.js]）：
  * `<area>LessonBank`（打工任務）：`const castleLessonBank = Object.freeze({ <nodeId>: { title, questions:[ { questionType, prompt, promptZh, answer, choices[3], choicesZh[3], reward } x3 ] }, … })`；`reward` 為變數參照 `jobReward`（`const jobReward = { coins: 100 }`）。
  * `<area>ChatLessonBank`（生活聊天）：同構，每場景 2 題每題 2 選項，`reward` 參照 `chatReward`（`const chatReward = { coins: 0 }`）。
  * 兩個 bank 經 [content-package/areas/_shared/lesson-helpers.js] `mergeLessons()` 併入導出之 `<area>SceneConfigs`（`lesson`／`chatLesson` 鍵）；scene 元資料（`scene` art、`npc`、`npcImage`、`travelLine`…）亦在 `<area>SceneConfigs`，scene 名稱／角色／背景另見 `<area>Area.locations[]`。
* **server.mjs 寫回慣例**：dev-only（`127.0.0.1`）、白名單檔、保留原檔 EOL（`original.includes("\r\n")?…`）、最小改寫；既有以「就地替換 `export const NAME = Object.freeze({…});` 區塊」（`replaceExportBlock`）與「就地改特定行」（`spliceMapLine`／`setMapXY`）兩法。`readBody`／`json`／`safeName` 為共用 helper；路由註冊於 `WARDROBE_ROUTES`。
* **目前無**任何場景／對話之 GUI；場景對話僅能手改 manifest 原始碼，無 AI 生成輔助。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的**：於編輯器新增**場景設定**頁籤，可檢視各場景組態（至少：場景名稱、場景角色名稱、場景背景）並**檢視與手動編修**場景對話（打工任務／生活聊天題庫）；因對話受整個區域限定（英文等級分級、場景主體一致、第一人稱台詞、選項即公主回應等 spec#1／#11 約束），須提供**依提示詞 AI 自動生成**對話之按鈕。
* **範圍**：僅 dev-only 編輯器（`tool/`）與其 dev server 端點（`server.mjs`）；**不動遊戲 runtime（`game-engine/`）行為、不動公開靜態站**。場景元資料（名稱／角色／背景）以**檢視為主**（其權責屬地圖／角色／場景美術其他來源）；本頁籤之**編修寫回對象為兩個對話 bank**（`<area>LessonBank`／`<area>ChatLessonBank`）。
* **不變式**：① 新頁籤沿用 `editor-tabs.js` 既有切換與 `editor-tab-change` lazy-render 機制，不改既有三頁籤；② 對話寫回沿用 server.mjs 白名單最小改寫＋保留 EOL，不破壞 manifest 其他欄位與結構；③ AI 生成以「區域＋場景約束」為通用輸入、不寫死單一場景，且無 API 金鑰時明確降級為「輸出提示詞供外部模型、貼回解析」不中斷；④ 遊戲 runtime 與既有 selftest／lint 全數維持綠燈（純新增 dev 工具能力，零遊戲行為變動）。

## 3. 設計決策（plan 落地，design.md 未改、docLint 維持基線 0）

* **D1 spec 模型不增、design.md ＜I＞ 不動**：本案為 dev-only 作者工具增能，不新增 spec、不改 design.md ＜I＞ 玩家能力規格；編輯器於 design.md 僅 ＜IV.A＞「本機開發工具入口」一句概括（不逐一列舉頁籤），故新增場景頁籤亦不逐列、design.md 不動（避免疊床架屋），全數設計落於本 note 與 `tool/README.md`。其所編修對話服務既有 spec#1／#11、所收斂約束服務 spec#7，traceability 經本 note 對應、不牽動 spec# 編號。
* **D2 頁籤殼（HTML）**：於 `wardrobe-tuner.html` `nav.app-tabs` 末新增 `<button class="app-tab" data-tab="scene">🎭 場景設定</button>`；新增 `section#panel-scene.editor-panel[data-panel="scene"][hidden]`，內含——區域子頁籤列（Castle／Urban／Rural／Wild，仿 `map-subtabs`）、左欄場景清單、中欄場景元資料卡＋對話編修區、右欄 AI 生成與儲存控制；末尾 `<script type="module" src="./scene-tuner.js">`（置於 `editor-tabs.js` 之前，與既有三 module 並列）。
* **D3 場景頁籤 module（`tool/scene-tuner.js`，新增）**：仿 map-tuner——import 四 area manifest，建各區 `{ scenes:[{ place, label, npc, sceneSrc, hint, job, chat }] }` 工作副本（`job`／`chat` 取自 `<area>SceneConfigs[place].lesson`／`.chatLesson`，即已併入之 bank questions 深拷貝）；`editor-tab-change` 切到 `scene` 才首次 render（`state.rendered`）。左欄選場景、中欄顯示元資料（唯讀）＋以表單渲染該場景 job（3 題×3 選項）與 chat（2 題×2 選項）之 `prompt/promptZh/answer/choices/choicesZh` 可編欄位（綁定工作副本）。
* **D4 對話寫回端點（`server.mjs`，新增 `POST /tool/save-scene-dialog`）**：body `{ area, kind:"job"|"chat", bank }`；`area` 以白名單集合驗證（castle/urban/rural/wild）、`kind` 限兩值、`bank` 結構驗證（每 place→{title,questions[]}，question 欄位齊備、choices/choicesZh 等長、job 3 選項 chat 2 選項、answer ∈ choices）。以 `serializeBank()` 將工作副本序列化為 `const <area>LessonBank = Object.freeze({…});`（或 `ChatLessonBank`）區塊文字——**`reward` 一律輸出變數參照** `jobReward`／`chatReward`（非展開字面值），字串以 JSON 轉義含中文、保留欄位順序；再以既有 `replaceExportBlock` 同法（改吻合 `const NAME = Object.freeze(` 而非 `export const`）就地替換、保留 EOL 寫回該 area manifest。
* **D5 AI 生成端點（`server.mjs`，新增 `POST /tool/generate-scene-dialog`）**：body `{ area, place, kind, hint }`；server 以「區域英文等級（vocabProfile）＋場景主體（npc／label／背景）＋ spec#1／#11 規則（角色第一人稱台詞、選項即公主回應、自然口語、場景主體一致、無 meta 敘述、題數/選項數、job 得 coins／chat 提升心情不發 coins）＋使用者 hint」組成 `buildScenePrompt()` 提示詞。**金鑰存在（`process.env.ANTHROPIC_API_KEY`）** → 呼叫 Anthropic Messages API（預設 `claude-haiku-4-5`、低成本）、要求只回 JSON、解析並 schema 驗證後回 `{ ok:true, bank }`；**無金鑰** → 回 `{ ok:false, needKey:true, prompt }`，UI 顯示提示詞供使用者複製到外部模型、再將回應貼回文字框，前端 `parseDialogJson()` 解析＋驗證後填入編修區待 review。兩路徑產物皆須經同一 schema 驗證才可套用（生成不直接寫檔，一律 review 後按儲存才走 D4）。
* **D6 場景元資料檢視（本案唯讀，不寫回）**：中欄元資料卡顯示 `label`（場景名稱）／`npc`（場景角色）／`sceneArt`（場景背景縮圖，沿 `assetUrl`）／`hint`；名稱/角色/背景之**編修**屬地圖（map 頁籤）、角色素材與場景美術其他來源權責，本頁籤 v1 不重複提供寫回入口（避免與既有來源雙頭寫入、技術債）。對話為本頁籤唯一寫回對象。
* **D7 文件**：`tool/README.md` 增「場景設定 (Scene tab)」段，說明檢視場景組態、手動編修對話、AI 生成（含金鑰/降級）、儲存寫回 `<area>LessonBank`／`ChatLessonBank`；玩家面 `README.md` 為 dev-only 工具、**不動**（編輯器非玩家功能、不進產品手冊主流程，符 design.md L1335）。版號依 Conventional Commits `feat` 於 merge 時 bump（`feat→minor`），`history` 一筆標 `playerVisible:false`（dev-only，進 CHANGELOG 不進玩家 About）。

## 4. 影響面與不變式

* **預期影響檔案（留 code 落地）**：
  * [tool/wardrobe-tuner.html]（新增 scene 頁籤 button＋panel＋script）。
  * [tool/scene-tuner.js]（新增，場景頁籤 module）。
  * [tool/wardrobe-tuner.css]（新增 scene 頁籤所需樣式，沿用既有 `.editor-panel`／`.map-subtabs`／`.control-section` 等基底，不另造設計系統）。
  * [server.mjs]（新增 `handleSaveSceneDialog`／`handleGenerateSceneDialog`＋`serializeBank`／`buildScenePrompt`＋路由註冊；沿用 `readBody`/`json`/`safeName`/EOL 慣例）。
  * [tool/README.md]（場景頁籤說明）。
  * [docs/design-issue245.md]（本檔）。
  * 版號：[VERSION]＋投影 [game-engine/build/version.js]／[CHANGELOG.md]（`node scripts/genVersion.mjs`）。
  * 可能：[game-engine/testing/selftests.js]（補 dev-tools 或新增 scene-serialize round-trip 斷言；實際以 code 階段 GATE 判定）。
* **不變式**：① 既有三頁籤（衣物／公主預設／地圖）與遊戲 runtime 行為零變動；② manifest 對話寫回為 bank 區塊整體重生、`reward` 維持變數參照、其餘 manifest 內容與 EOL 不動；③ AI 生成無金鑰時降級為提示詞複製/貼回、不中斷、不外洩金鑰；④ 寫回前端必經 schema 驗證（題數/選項數/answer∈choices/中英等長）；⑤ 工具仍 dev-only、公開站不出現。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **議題條理自洽**：場景頁籤與既有衣物／地圖／公主預設頁籤同屬 dev 內容編輯工具，新增頁籤條理一致；對話編修聚焦兩個 bank、元資料唯讀，責任邊界清楚、不與地圖/角色來源雙頭寫入。
* **不衝擊現有功能**：沿用 `editor-tabs.js` lazy-render 與 server.mjs 白名單模式，純新增 module 與端點；遊戲 runtime 不動，既有 selftest／tsc／lint 應維持綠燈（以 code 階段回歸驗證）。
* **不積技術債（單一機制）**：寫回沿用既有 `replaceExportBlock`＋EOL 慣例、不另立特例載入；AI 生成以「區域＋場景」通用約束為輸入、不寫死單一場景；序列化以 `reward` 變數參照維持 manifest 既有結構，不展開字面值造成漂移。
* **內容約束落實 / 測試補強**：本案非 Bug 而為新增工具能力；`buildScenePrompt` 將 spec#1／#11 約束編碼為生成規則，前端 schema 驗證守門（題數/選項數/answer∈choices/中英等長），並以 `serializeBank` round-trip（既有 bank → 序列化 → 重新 import 等價）自我測試固化「寫回不破壞結構」之不變式（留 code ＜III＞）。
