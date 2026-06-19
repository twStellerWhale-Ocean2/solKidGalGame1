# 設計note — issue #178 鍵盤地圖走動消除起步停頓並加快移速

> 本檔為 2plan 設計note。**初判 Option A**（obj 已預核此方向）：本項為既有方案下之地圖鍵盤走動手感精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；規則由本 note 承載、由 3code 落地並以 selftest／實機 playtest 守回歸。意旨對應既有 **spec#2**（可用角色陪伴與場景探索維持遊玩意願——含「公主頭像在世界／城堡／地區地圖一致移動並進入場景」之地圖導航，對應 **solCase#2.1** [runAct自訂玩家地圖導航]）：補上「鍵盤走動即時起步、移速適合兒童」之手感強化。⚠️ 審查點見 §4：design.md 已以 solCase#2.1 記錄地圖導航行為，USR 可選擇是否將本手感要求以 USR-gated 方式明文寫入 design.md（spec#2 微修），預設維持 Option A。

## 1. 現況量測（以產物為準）

### 三處地圖鍵盤走動同型：每次 keydown 只走一步（現況：起步停頓來源）

* **地區地圖**：`mapStage` keydown（[game-engine/main.js] L3693）於 `ArrowUp/Down/Left/Right`（及 `w/a/s/d`）各分支呼叫**一次** `moveOnMap(dx,dy)`（L1950）→ `moveOnAreaMap(areaId, dx, dy, …)`（L1512）。
* **城堡地圖**：`castleStage` keydown（L3622）→ `moveOnCastleMap(dx,dy)`（L1535）→ `moveOnAreaMap("castle", …, { speed:1.35 })`。
* **世界地圖**：`worldStage` keydown（L3658）→ `moveOnWorldMap(dx,dy)`（L1631，自管 `state.world`、不走 `moveOnAreaMap`）。
* 三者**皆未維護「按鍵按住中」狀態、未設連續移動迴圈**；按住方向鍵後的「持續走動」完全倚賴瀏覽器／OS 的**按鍵自動重複**事件驅動。OS 自動重複有內建初始延遲（按住後約 300–500ms 才開始連發），即「按下後第一步雖即時、但要等一段延遲才連續走起來」的起步停頓手感。

### 每步位移量偏小（現況：移速偏慢來源）

* `moveOnAreaMap`（L1512）`const speed = options.speed || 1.45;`——地區地圖每步 **1.45**、城堡 `moveOnCastleMap` 傳 **`speed:1.35`**、世界 `moveOnWorldMap` `const speed = 1.6;`（座標域 0–100）。
* 整體有效移速 ＝「每步位移量 × 每秒步數」；目前每秒步數受 OS 自動重複率節流，配合偏小的每步位移量，整體偏慢。
* 三者皆於位移後加 `.walking` class、180ms 後移除（如 L1529-1530），屬走動動畫提示、與停頓／速度無因果。

### 既有回歸測試守「有移動」但不守「手感」

* `?selftest=map-avatar`（[game-engine/testing/selftests.js] L65）intTest#27（L119-125）以 `moveOnWorldMap(1,0)` 斷言 world 座標改變——**只驗「移動有發生」，未驗起步是否即時、是否連續、移速數值**。

### 癥結小結

* 起步停頓的直接成因＝**缺少自管的連續移動迴圈**，把「連續走動」外包給 OS 自動重複的初始延遲；非地圖或座標資料問題。
* 移速偏慢成因＝**每步位移量偏小**且步頻受 OS 重複率節流；調速須與輸入迴圈一併設計。
* 三處走動面各自複製同型 keydown 分支、底層位移函式不一（`moveOnAreaMap` 共用 vs `moveOnWorldMap` 自走），改動須三處一致、避免顧此失彼。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 目標①**即時起步**：按下方向鍵後立刻開始並**持續**移動，不再等候 OS 按鍵自動重複的初始延遲，消除起步停頓。
* 目標②**加快移速**：提高持續走動的有效移速至適合兒童遊玩、不易疲累的程度，兼顧近地點（hotspot）時的可控停靠。
* 範圍界定（呼應 Issue）：主體＝**鍵盤（方向鍵／WASD）地圖走動**，涵蓋**三處走動面**（地區 `mapStage`／城堡 `castleStage`／世界 `worldStage`）；指標滑鼠拖曳（pointer drag）與世界地圖點選目的地走到再進入（`requestWorldTravel`）屬另套輸入路徑、**不在本案改動範圍**（須並存不衝突）。

## 3. 設計決策（確切數值／實作細節留 3code playtest）

### D1：以「按住方向鍵集合 + 連續移動迴圈」自管走動，取代倚賴 OS 自動重複

* 維護一組「目前按住中的方向」狀態；keydown 時**立即走一步並登記該方向**，由一個自管迴圈（`requestAnimationFrame` 或 `setInterval`）在按住期間**持續推進**，keyup 時移除該方向、集合空則停迴圈。
* 如此「持續走動」即時起步、不再等 OS 自動重複初始延遲——消除起步停頓（達目標①）。第一步本即時（既有行為保留），補上的是第一步之後的連續銜接。

### D2：忽略 OS 合成的自動重複事件（`event.repeat`），避免雙重驅動

* 走動改由 D1 自管迴圈推進後，OS 仍會對按住的鍵送出 `event.repeat===true` 的合成 keydown；走動分支須忽略 `event.repeat` 之 keydown（僅以首次 keydown 登記方向），以免迴圈與 OS 重複疊加致雙倍速或抖動。
* （縮放 `+`／`-`、互動 Enter／空白等非走動鍵不受此限、維持原行為。）

### D3：抽共用「鍵盤走動控制器」，三處走動面沿用

* 將 D1 的按住鍵集合 + 迴圈 + 速度組態收斂為**單一走動控制器**，由地區／城堡／世界三處沿用，避免三倍化迴圈與調速邏輯（降技術債、與 spec#7 模組化相容）。
* 控制器以「**方向 → 位移回呼**」注入，容納兩種底層位移：地區／城堡走 `moveOnAreaMap`、世界走 `moveOnWorldMap`（自管 `state.world`）；不把世界地圖特例硬塞進共用路徑。
* （落地抽象邊界與檔案落點由 3code 定；若 3code 評估三處共用迴圈風險過高，至少令三處遵循同一迴圈與調速規則、共享速度常數。）

### D4：調速＝提高有效移速，以實機 playtest 校準、守住停靠精度

* 有效移速 ＝「每步位移量 × 步頻」兩槓桿；提高每步位移量與／或自管迴圈推進頻率至**兒童友善值**（達目標②）。
* 採**等速提速**（建議，預設）：按住即以固定較快速度走，不引入「按住越久越快」之加速度（對幼童較可預測、易停靠）；若 USR 偏好加速度手感，列為 §4 選項。
* 移速提高**不得使玩家難以停在 hotspot 觸發半徑內**（`nearbyRadius` 6.8／5.8）；確切移速數值（每步位移量與步頻）由 3code 以實機 playtest（寬＋窄視窗、四區含城堡與世界）逐面校準。

### D5：迴圈生命週期＝鬆鍵／失焦／切頁／切面即停，杜絕「卡走」

* 自管迴圈須在下列情況確實清除按住集合並停止：keyup（對應方向）、視窗 `blur`、`visibilitychange`（分頁隱藏）、以及切換 stage／view（離開地圖）。
* 避免「keyup 遺漏 → 鬆鍵仍續走」之卡走 bug（尤以 OS 在某些情況不送 keyup 時）。

### D6：範圍＝僅鍵盤三面；指標拖曳與點選走到再進入並存不衝突

* 本增量僅改鍵盤（方向鍵／WASD）走動；地圖既有的指標拖曳（`beginMapDrag` 等）與世界地圖點選目的地走到再進入（`requestWorldTravel`／`finishWorldTravel`）**不改動**，且自管走動迴圈不得與「途中再次點選即略過」之既有路徑衝突（如玩家鍵盤走動中又點選目的地時的優先序，由 3code 收口）。
* 觸控相容：平板觸控玩家走指標拖曳路徑、不受本案影響、亦不退化；鍵盤改善主要惠及桌機鍵盤遊玩。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核此方向）**：本手感規則由本 note 承載、3code 落地、selftest／實機 playtest 守回歸；`docs/design.md` ＜I／II＞ spec# 編號不增刪、文字不改（docLint sol 維持 0）。
  * **可選 Option B（USR-gated，如 USR 希望寫入 design 級行為）**：因 design.md 已以 solCase#2.1 記錄「公主頭像在各地圖一致移動」，可一併於 **spec#2** 句末微修補述「且鍵盤地圖走動須即時起步（不等按鍵自動重複初始延遲）、移速適合兒童」（屬 ＜I＞ 回修、USR-gated）；spec# 編號不增減。預設不做、維持 Option A。
* **② 提速手感（等速 vs 加速度）**：建議**等速提速**（D4，對幼童可預測、易停靠）。若 USR 偏好「按住越久走越快」之加速度手感，3code 對應加入加速度曲線與上限。
* **③ 範圍確認**：建議**僅鍵盤三面（地區／城堡／世界）**，指標拖曳與點選走到再進入維持不動（D6）。若 USR 希望一併調整觸控／螢幕方向鍵之走速，範圍與 3code 對應放大。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 維持 0）。若 §4① USR 改選 Option B，再補 design.md（spec#2 微修，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * 新增「鍵盤走動控制器」（按住鍵集合＋連續移動迴圈＋速度組態＋生命週期清除；D1／D2／D3／D5），落點與檔案由 3code 定（如 [game-engine/map/] 下新模組或 main.js 內聚合）。
  * [game-engine/main.js]：三處 keydown 走動分支（`mapStage` L3693／`castleStage` L3622／`worldStage` L3658）改接走動控制器、忽略 `event.repeat`（D2）；以「方向→位移回呼」分別注入 `moveOnMap`／`moveOnCastleMap`／`moveOnWorldMap`（D3）。
  * 調速（D4）：提高每步位移量與／或迴圈步頻；`moveOnAreaMap` 之 `speed` 與 `moveOnWorldMap` 之 `speed` 數值以 playtest 校準（守 `nearbyRadius` 停靠）。
  * [game-engine/testing/selftests.js]：回歸守門（見下）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（含 main.js／新模組／selftests.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error。補 selftest 斷言（可機判部分）：①走動控制器以「按住方向集合」驅動可產生**連續多步**位移（非單步）；②keyup／blur／visibilitychange 後**停止**移動（按住集合清空）；③`event.repeat` 之合成 keydown 不額外驅動位移（無雙倍速）；④三處走動面（含 `moveOnWorldMap`）皆改變對應座標、且既有 `?selftest=map-avatar`（含 intTest#27）維持綠燈。
  * **GATE §5（實機 playtest／visual-qa，異動輸入手感）**：按住方向鍵——①**即時起步**（按下即連續走、無明顯起步停頓）；②移速明顯較前快且**仍能停在 hotspot 觸發半徑內**進入場景；③鬆鍵即停、切分頁／失焦不卡走；④地區／城堡／世界三面一致；⑤指標拖曳與點選走到再進入仍正常。latency／手感屬體感，難以單元化者明列為人工 playtest 驗收、逐面紀錄為證。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#153／#157／#166／#177 焦點修正慣例：本焦點變更之 GATE 驗證結果記於本節與 PR 留言。`docs/design.md` 未改（Option A，docLint sol 0）。三審查點均採 §4 建議預設（Option A／等速提速／僅鍵盤三面，USR 於本對話以「OK GO CODE」核准）。

### 實作（依 §3 D1–D6）

* **D1／D2／D3／D5（新模組 [game-engine/map/keyboard-walk.js]）**：`createKeyboardWalkController({ stepMs })` 維護「按住方向集合」＋ `requestAnimationFrame` 連續移動迴圈——`press(dir, moveFn)` 立即走一步（保留原即時手感）並啟動迴圈、之後每 `stepMs`（33ms，≈30 步/秒）以方向向量呼叫 `moveFn(dx,dy)` 連續推進，**免 OS 自動重複初始延遲**（D1）；同向重按由 `held` 集合去重、**忽略 OS 自動重複**之合成 keydown，避免雙倍速（D2）；`release(dir)` 鬆鍵清除、集合空即停；`clear()` 一次清空並停止。控制器**純函式、不碰 DOM／遊戲狀態**，`now／requestFrame／cancelFrame` 可注入替身供 headless 測試；`directionForKey(key)` 對映方向鍵與 WASD。另導出方向→向量、支援對角走動（向量合成、`clamp` 守邊界）。
* **D3 三面接線（[game-engine/main.js]）**：三處 keydown 走動分支（`mapStage`／`castleStage`／`worldStage`）改以 `directionForKey` 判方向、呼叫單一共用實例 `mapWalkController.press(dir, moveOnMap／moveOnCastleMap／moveOnWorldMap)`，以「方向→位移回呼」容納 `moveOnAreaMap`（地區／城堡）與 `moveOnWorldMap`（世界）兩種底層；保留各 handler 的 `+`／`-` 縮放與 Enter／空白互動分支不動。
* **D4 調速（[game-engine/main.js]）**：新增常數 `MAP_WALK_STEP_MS=33`、`MAP_WALK_SPEED={area:2.0,castle:1.9,world:2.2}`（每步位移量較前 1.45／1.35／1.6 提速約 ⅓）；`moveOnAreaMap` 預設 speed、`moveOnCastleMap`／`moveOnWorldMap` 之 speed 改引用該常數。有效移速 ≈ 60／57／66 單位/秒（座標域 0–100），每步 2.0 ≪ `nearbyRadius` 6.8／5.8、停靠可控。
* **D5 生命週期（[game-engine/main.js]）**：`window` keyup→`release`、`window` blur→`clear`、`document` visibilitychange（隱藏）→`clear`、`changeView` 起手→`clear`，杜絕「鬆鍵仍續走」之卡走。
* **D6 範圍**：僅改鍵盤三面；指標拖曳（`beginMapDrag` 等）與世界地圖點選走到再進入（`requestWorldTravel`／`finishWorldTravel`）未動。
* **回歸守門（[game-engine/testing/selftests.js]）**：新增 `runMapWalkSelfTest`（`?selftest=map-walk`）；`moveOnCastleMap` 加入測試 api 匯出。

### GATE §1（機器判定，全綠）

* `node --check`：`game-engine/map/keyboard-walk.js`／`game-engine/main.js`／`game-engine/testing/selftests.js` → 全 OK。
* `docLint docs/design.md`（sol）→ **0**；`repoLint .` → **0**。
* headless selftest（chromium，`.codex/run-selftests-178.mjs`）全 PASS、console **0 error**：
  * **`map-walk`（本案新增）**：`passed:true`——A 方向鍵／WASD 對映正確；B 控制器即時起步（press 即 1 步）＋連續多步（推進時鐘後 ≥5 步）＋放鍵即停；C 同向重複按鍵忽略（即時步數仍 1、方向不重複登記）；D `clear` 後停止並清空；E 地區／城堡／世界三面座標皆隨對應 move 函式改變。
  * **回歸**：`map-avatar`（跨地圖渲染＋intTest#27 走到再進入／途中略過）、`scene-nav`、`monkey`（300 步）、`data-audit`（shopCount 11）、`chat`、`playtimer`、`job-cycle` → 全 `passed:true`、console 0。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用（STACK techStackStaticWeb）。

### GATE §4／§5（業界水準審查＋端對端 runtime 證據）

> 本增量**未異動任何渲染 UI**（無版面／元件視覺變更，僅輸入時序與移速），故 GATE §5 鏡頭 C 逐頁截圖不適用；改以地圖互動之**端對端 runtime 證據**佐證（GATE §4：可操作流程＋資料狀態改變＋測試檔案＋runtime 紀錄）。

* **端對端探針（`.codex/probe-178.mjs`，真實 keydown/keyup）**：urban 地圖、真實事件驅動已接線控制器——按 `ArrowRight`：`x0=20 → 20ms 後 22`（**即時起步**，免 OS 重複延遲）；注入 `repeat=true` 合成 keydown 後按住 ~300ms→`x=38`（連續走 18 單位／≈9 步，**OS 自動重複未致雙倍速**）；keyup 後 `38→38`（**放鍵即停、不卡走**）；console 0 error。`PROBE-PASS`。
* **鏡頭 A（輸入/互動能力盤點）**：①即時起步、②連續走動、③放鍵即停、④失焦/切頁/切面即停、⑤忽略 OS 自動重複不雙倍、⑥三面一致、⑦Enter/空白互動與 +/- 縮放鍵保留、⑧指標拖曳與點選走到再進入無回歸（map-avatar intTest#27 綠）、⑨移速可控停靠（每步 2.0≪半徑 6.8）、⑩觸控路徑不退化——逐項以 probe／selftest／程式碼坐實。
* **鏡頭 B（專家缺口，遊戲輸入工程視角）**：⑪卡走防護（keyup 漏發風險已以 blur/visibilitychange/changeView clear 補上）；⑫對角走動（雙鍵向量合成、clamp 守邊界，合理無害）；⑬persist 頻率（連續走動每步 persist ≈30/秒，**≤ 改動前 OS 自動重複之 persist 頻率**，無新增效能回歸）；⑭走動僅改 player/world 座標、與帳號/週期無耦合（無副作用）。
* **分級**：`務必要修` **0**（核心三項即時起步／連續/即停＋三面＋回歸全綠）；`可以接受`——移速常數（`stepMs 33`、`2.0/1.9/2.2`）為初版值，留 opr 實機 playtest 微調（§4② 採等速提速）。
* **結論：可宣稱完成。**

### 交付物（test-summary.pdf 待 USR 裁決）

* 沿 #157／#166／#177 焦點修正慣例，本節即 GATE 報告；本增量無渲染 UI 變更，是否另產 A5 直向 [docs/test-summary.pdf] 待 USR 裁決。`.codex/` 下 selftest／probe 驅動腳本為暫存（`.codex/` 已 gitignore）、不作交付物。
