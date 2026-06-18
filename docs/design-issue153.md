# 設計note — issue #153 新增公主可返回帳號選擇＋地圖公主識別背版可清楚辨識

> 本檔為 2plan 設計note。**初判 Option A**：兩項皆為既有方案下之 UI 可用性／可視性精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；流程／呈現決策由本 note 承載，確切互動文案／取消後流程／背版不透明度・對比・尺寸與寬窄版值留 3code 以實機 visual-qa（寬＋窄、行動直向為主）定案。意旨對應既有 **spec#6**（選擇與命名公主）＋ **spec#8**（本機多帳號）＋ **spec#9**（地圖公主 token 識別色橢圓背版清楚標示）。⚠️ 審查點見 §4：USR 可選擇是否對 solCase#9.2（concern 1）與 spec#9「半透明」用語（concern 2）作 USR-gated 輕修；預設維持 Option A。

## 1. 現況量測（以產物為準）

### concern 1：新增公主／玩家無返回「人物選擇」路徑

* 帳號選擇＝`<section class="account-select-overlay" id="accountSelect">`（[index.html] L205）；動作列含 `#accountBack`「Back」（L215，`data-account-cancel`，預設 `hidden`，由 `buildAccountList` 於 `!accountSelectMustChoose && activeId` 時顯示，[game-engine/main.js] L883）與 `#accountNewButton`「Add player」（L216）。
* 創角＝`<section class="character-select-overlay" id="characterSelect">`（[index.html] L221）；動作列含 `#characterCancel`「Back」（`.character-select-cancel`，L246）與 `#characterConfirm`「Start」（L247）。
* **流程**：「Add player」→ `createNewAccount()`（[game-engine/main.js] L944）**先 `createFreshAccount()` 落地一個新帳號並設為使用中** → `closeAccountSelect()` → `openCharacterSelect({ forced: true })`（L952）。
* `openCharacterSelect({forced})`（L674）以 `forced` 切換 `first-run` class（L688）。`first-run` 模式下取消管道全數關閉：
  * 取消鈕 `.character-select-cancel` 被 [styles/character-select.css] L224–227 `display:none` 隱藏（註解「首次進入無存檔：不可取消」）。
  * 背景點擊取消（`[data-character-cancel]`）於 `first-run` 時略過（[game-engine/main.js] L3450）。
  * Esc 鍵於 `first-run` 時略過（[game-engine/main.js] L3623）。
* **癥結**：`createNewAccount` 一律以 `forced:true` 開創角，未區分「**真正首啟（毫無任何帳號）**」與「**既有帳號下新增第 N 個**」；後者也被套用「不可取消」，導致無法返回帳號選擇，且已先生成之空帳號將殘留（與 README L165「刪除帳號後回到帳號選擇而**不殘留錯誤進度**」之精神相違）。
* `first-run`「不可取消」原意僅為 [styles/character-select.css] L224 註解所述「首次進入無存檔」情境（真正首啟須先有一位公主才可玩）。

### concern 2：地圖移動公主識別色背版過於透明

* 地圖移動公主＝`.map-doll`（紙娃娃，[styles/paper-doll.css] L8；地圖 token 尺寸 54×70，[styles/map.css] L91 `.player`、[styles/mobile.css] L349／L356 `.player`／`.map-doll`）。
* 其腳下黃色光暈＝ `.map-doll::before`（[styles/paper-doll.css] L16–33）：`radial-gradient(ellipse at center, …)` 橢圓，顏色取 `--profile-color`（帳號**識別色**，預設 `#ffd166` 金黃），alpha 中心 `60%` → 55% 處 `32%` → 76% 全透明；`width:96% height:58%`、置娃娃腳下（`bottom:1%`）、`z-index:0`（娃娃層之下）。
* 此即 **#131** 引進、取代 #126 舊 drop-shadow 光暈之「識別色橢圓背版」（[styles/paper-doll.css] L14、L85 註解；#126 舊光暈已於 #131 移除）。娃娃本體另有深色投影＋白描邊維持銳利（L87–92）。
* **癥結**：spec#9 明文要求「地圖上公主 token 須以識別色**半透明橢圓背版清楚標示**」——現況背版偏淡、與花俏地圖背景藝術區隔不足，未達「清楚標示」。USR 訴求「不要有透明、不然看不清楚」，其真意為「**夠清楚可辨**」而非「零透明」。
* **界定**：concern 2 之「背板」確指 `.map-doll::before`，**非**地圖裝飾角色 `map-actor`（[game-engine/map/actors.js] 另有 0.18–0.8 振盪透明度，與本案無關）。

* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* concern 1（標題＋內文點 1）：「公主創建人物表單，缺少回到人物選擇表單」「人物選擇表單中可以 add 公主，但缺少 cancel 按鈕」——使自帳號選擇「新增」進入創角後，可取消／返回帳號選擇。
* concern 2（內文點 2，附截圖釐清）：「人物在地圖上移動的背板（公主腳下黃色光暈），不要有透明，不然看不清楚」——使地圖移動公主之識別色背版清楚可辨。

## 3. 設計決策（確切數值／文案留 3code visual-qa）

### D1：既有帳號下新增公主可取消返回帳號選擇

* 以「**是否已存在其他帳號**」（或等效旗標）區分創角模式：
  * **真正首啟（零帳號）**：維持現況 `first-run`「不可取消」（須先建立一位公主方可遊玩）。
  * **既有帳號下新增（≥1 帳號）**：顯示／啟用 `.character-select-cancel`（並開放背景點擊／Esc 取消）；取消即**返回帳號選擇**（`openAccountSelect`）。
* **空帳號殘留處理**：取消時須清除 `createNewAccount` 先行落地之空帳號（不殘留孤帳號）。
* **根因兩選項（擇一，留 3code 評估）**：
  * (a) 將 `first-run`「不可取消」之條件由「`forced`」改為「真正首啟（帳號數為 0）」，並於取消事件清除剛建立之空帳號；或
  * (b) 重構 `createNewAccount` 為「**創角確認（Start）後才落地帳號**」，根除空帳號殘留——取消時自然無帳號可清。
* （b）更乾淨但動到帳號落地時序，須確保 `selectAccount`／`syncActiveAccountMeta`／持久化一致；（a）改動小、風險低。3code 擇一並以 selftest 佐證。

### D2：地圖識別色背版清楚可辨

* 強化 `.map-doll::before` 之可視性，使其在花俏地圖背景上仍清楚標示公主 token——方向如：提高核心 alpha／加深漸層、加細邊框或對比襯托、或微調尺寸；同時延續 #131「避免邊緣糊化」之考量、不回到 #126 drop-shadow 糊邊。
* **保留識別色語意**：不得改為固定不透明白底而失去「各帳號識別色可區分」（spec#6／#8／#9）；強化後各帳號識別色仍須清楚有別。
* 確切 alpha／邊框／尺寸與寬窄版（[styles/mobile.css] `.player`／`.map-doll`）值留 3code visual-qa（寬＋窄）。

### D3：範圍與相容

* **範圍**：concern 1＝選角／帳號覆蓋層之取消流程（[index.html] L205–250、[game-engine/main.js] `openCharacterSelect`／`createNewAccount`／取消事件繫結 L674・L944・L3448–3462・L3623、[styles/character-select.css] L224–227）；concern 2＝`.map-doll::before`（[styles/paper-doll.css] L16–33，必要時連動 [styles/mobile.css] 寬窄）。
* **相容**：不動答題／生活聊天／打工／逛店／換裝／語音／計時與休息邏輯；識別色資料源（`--profile-color`）既有，concern 2 重**呈現**、不新增能力。
* **協調**：concern 2 與 #131 識別色色盤／背景花紋、#132 即時穿搭頭像、地圖 token 三處一致（選單／帳號卡／遊戲內）共存、不互相打架。

### D4：寬窄共用、不另立分歧

* concern 2 之背版強化須寬窄共用、差異僅止於斷點尺寸；不在 [styles/mobile.css] 另立分歧的識別色值。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核）**：兩點屬流程／呈現精修，design.md 無對應 spec# 增刪；決策由本 note 承載、README 補＜變更紀錄＞初稿。
  * **可選輕修 A（concern 1）**：若 USR 希望將「自帳號選擇新增公主之創角流程須可取消返回（真正首啟除外）」記為 design 級行為，可對 **solCase#9.2**（新增帳號）作 USR-gated 條文精修（spec# 編號不增減、屬 ＜II＞ 文字）。預設不做、維持 Option A。
  * **可選輕修 B（concern 2）**：spec#9 現含「半透明橢圓背版」字樣；若 3code 結論為**明顯**提高不透明度，可對 spec#9 該用語作 USR-gated 放寬（如「識別色橢圓背版清楚標示」），spec# 編號不變、README ＜成功判定／變更紀錄＞同步。預設維持 Option A（視「半透明」為「半透明範圍內加強對比仍達清楚標示」）。
* **② concern 1 範圍確認**：修訂僅針對「**既有帳號下新增**」之可取消；**真正首啟（零帳號）**維持不可取消（否則無帳號可玩）。
* **③ concern 2 真意確認**：「不要有透明」＝「夠清楚可辨」（與 spec#9「清楚標示」一致），非「零透明實心色塊」（避免蓋住地圖、失去識別色）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ `README.md` ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 仍 0）。若 §4① USR 改選輕修，再補 design.md（solCase#9.2／spec#9，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * concern 1：[game-engine/main.js]（`createNewAccount`／`openCharacterSelect`／取消事件＋空帳號清理）、[styles/character-select.css]（`first-run` 取消鈕條件）、必要時 [index.html] 動作列。
  * concern 2：[styles/paper-doll.css]（`.map-doll::before` 可視性強化）、必要時 [styles/mobile.css]（寬窄 `.player`／`.map-doll`）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`tsc`／`docLint`（sol 0）／`repoLint` 0；`?selftest=accounts`／`save-load`／`map-avatar`／`monkey` passed、console 0。其中 concern 1 須以 `accounts`（含「既有帳號下新增→取消→返回帳號選擇、無殘留空帳號」流程）佐證。
  * **GATE §5（實機 visual-qa，寬＋窄、行動直向為主）**：concern 1——零帳號首啟仍強制創角（無取消鈕）、既有帳號新增可取消返回且無殘留帳號；concern 2——地圖公主 token 識別色背版清楚可辨、各帳號識別色仍有別、寬窄一致、不糊邊。逐頁 ≥10 發現＋截圖＋分級、must-fix 全修。

## 6. 實作與驗證結果（3code，待填）

> 沿 #101／#111／#120／#132／#150：本焦點 UI 修正之 GATE 驗證結果於 3code 階段記於本節。
