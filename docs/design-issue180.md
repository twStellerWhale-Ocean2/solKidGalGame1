# 設計note — issue #180 地圖公主 token 永遠顯示於地圖圖示之上、不被遮擋

> 本檔為 2plan 設計note。**初判 Option A**（obj 已預核此方向）：本項為既有方案下之地圖公主 token 圖層順序修正，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；規則由本 note 承載、由 3code 落地並以 selftest／實機 visual-qa 守回歸。意旨對應既有 **spec#2**（可用角色陪伴與場景探索維持遊玩意願——含「公主頭像在世界／城堡／地區地圖一致移動並進入場景」之地圖導航，對應 **solCase#2.1** [runAct自訂玩家地圖導航]）並呼應 **spec#9**（地圖上公主 token 須以足夠大的尺寸醒目且清楚呈現）：補上「公主 token 永遠顯示於地圖圖示之上、不被遮擋」之清楚呈現要件。⚠️ 審查點見 §4：design.md 已以 solCase#2.1／spec#9 記錄地圖 token 行為，USR 可選擇是否將本要求以 USR-gated 方式明文寫入 design.md（spec#2／#9 微修），預設維持 Option A。

## 1. 現況量測（以產物為準）

### 三處地圖各有一個公主 token、皆同型套用 `map-marker player` 類別

* **地區地圖** `#mapStage`：`#playerToken`（`class="map-marker player"`，[index.html] L68）。
* **城堡地圖** `#castleStage`：`#castlePlayerToken`（`class="map-marker player castle-player"`，L36）。
* **世界地圖** `#worldStage`：`#worldPlayerToken`（`class="map-marker player world-player"`，L47）。
* 三 token 內各嵌一個 `.paper-doll.map-doll`（紙娃娃公主），由 [game-engine/main.js] `positionMapElement(elements.playerToken, …)`（L1917）依座標定位。三 token 為各自 stage 的直接子元素，與該 stage 的地圖圖示層為**同層級兄弟**（同一 positioned 容器內的堆疊脈絡）。

### 公主 token 的有效 z-index 偏低（現況：被遮主因）

* [styles/map.css] `.player`（`z-index:3`，L91-97）宣告於 `.map-marker`（`z-index:4`，L79-83）之後，同特異度後者被覆蓋，故 `#playerToken` 等 token 之**有效 z-index＝3**。
* token 同掛 `.map-marker`(z4) 與 `.player`(z3) 兩個都設 z-index 的類別，最終值倚賴 CSS 宣告順序（`.player` 後勝），隱晦難察。

### 地圖圖示的有效 z-index 皆高於公主 token

* **地點標記（hotspot）**：由 main.js 動態建立、套 `map-marker hotspot …` 類別（地區 L1898／城堡 L1428／世界 L1577）；[styles/map.css] `.hotspot`（`z-index:5`，L115-127）宣告於 `.map-marker` 之後勝出，故每個地點標記之**有效 z-index＝5**。
* **標記容器層**：`#hotspotLayer`／`#worldMarkerLayer`／`#nodeLayer`／`.route-layer` 為 `z-index:4`（L61-69）。
* **裝飾性動畫層**：地區地圖 `#mapLifeLayer`（`.map-life-layer`，[styles/mobile.css] `z-index:7`，L875-881）承載 [game-engine/map/actors.js] 渲染之 `.map-actor`（鳥、船、波浪、風車等）；該圖層 `z-index:7` 為地圖圖示中最高。

### 綜合堆疊順序與更高層功能 UI

* 同一 stage 堆疊脈絡內：地圖底圖 `<img>`（z 1）< **公主 token（z 3）** < 標記容器層（z 4）< 地點 hotspot 標記（z 5）< 裝飾動畫層（z 7）。公主 token 僅高於底圖、落在所有地圖圖示之下——當 token 位置與任一地點標記或裝飾元素重疊時即被覆蓋，正是 #180 所述「移動時被地圖圖示遮住」。
* 地圖之上另有**功能性 UI 面板**層級更高：目的地面板 `.destination-panel`（`z-index:24`，[styles/map.css] L255-257）、地圖控制鈕等。公主置頂須高於地圖圖示、**但不應蓋過這些操作面板**。

### 既有回歸測試守「token 放大且無背板」但不守「不被遮擋」

* `?selftest=map-avatar`（[game-engine/testing/selftests.js] L154）係 #161／#9 後驗證地圖 token 放大且不再套識別色背板（L686 註解），**未驗證 token 與地圖圖示的前後堆疊（z-order／是否被遮）**。

### 癥結小結

* 被遮的直接成因＝**公主 token 有效 z-index（3）偏低**，落在地點標記(5)／標記容器(4)／裝飾層(7) 之下；非座標或地圖資料問題。
* 三 token 共用 `.map-marker.player`，改動 `.player` 之 z-index 三處一致生效，須確認三 stage 各自堆疊脈絡皆達成置頂、避免顧此失彼。
* 調整須界定明確區間：**高於所有地圖圖示（≥ 8，超過 life-layer 的 7），但低於地圖操作 UI 面板（< 24，不蓋過目的地面板）**。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 目標①**公主永遠在地圖圖示之上**：公主 token 在世界／城堡／地區三處地圖移動，經過任何地點 hotspot 標記、標記容器層或裝飾動畫元素時皆完整顯示、不被遮擋。
* 目標②**不退化既有現況**：維持公主 token 既有的尺寸醒目、無識別色背板（#161／#9）、定位與走動手感（#178）；本案僅修正前後堆疊順序。
* 範圍界定（呼應 Issue）：主體＝**地圖公主 token 與地圖圖示之圖層（z-index）前後順序**，涵蓋**三處地圖面**（地區 `#mapStage`／城堡 `#castleStage`／世界 `#worldStage`）；地點互動、走動輸入、座標與地圖資料**不在本案改動範圍**。「永遠在最前面」精確界定為**高於所有地圖圖示、但不越過地圖操作 UI 面板**（目的地面板 z 24 等）。

## 3. 設計決策（確切數值／實作細節留 3code）

### D1：根因＝公主 token 有效 z-index 偏低，須拉升至所有地圖圖示之上

* 三 token 共用 `.map-marker.player`，現有效 z-index 為 3（`.player` 覆蓋 `.map-marker` 的 4），低於地點標記(5)、標記容器(4)、裝飾層(7)。
* 修正方向＝令公主 token 的有效堆疊層級**高於地圖圖示中最高者（裝飾層 z 7）**，使任何地圖圖示都不再覆蓋公主。

### D2：以「明確的公主置頂層級」取代隱晦的多類別宣告順序（建議，最小改動）

* 於 `.player`（或公主 token 專屬選擇器）設**明確且足夠高的 z-index**：須 `> 7`（高過 life-layer）、且 `< 24`（不蓋過目的地面板等操作 UI）；建議取一個有註解、語意明確的中間值（如 `z-index: 8`～`20` 區間之單一定值），確切數值由 3code 定。
* 須避免再次落入「`.map-marker` 與 `.player` 兩類別 z-index 互覆蓋」之隱晦狀態：調整後以註解標明「公主永遠在地圖圖示之上」之約定與區間上下界。
* **可選替代（Option，§4②）**：為公主另設**專屬置頂圖層**（各 stage 內 z-index 最高之容器），與地圖圖示圖層解耦，後續新增任何地圖圖示自動不致再遮公主；代價是 DOM／樣式較大改動。預設採前者（調 `.player` z-index）之最小改動。

### D3：一處共用樣式、三 token 沿用；三 stage 堆疊脈絡皆須生效

* 改動 `.player`（三 token 共用）即三處一致，與 spec#7 模組化相容；不得三處各自硬塞 z-index 數字（易漂移積債）。
* 須確認三 stage（`#mapStage`／`#castleStage`／`#worldStage`）各為獨立 positioned 容器，公主在各自脈絡內皆置於該 stage 地圖圖示之上。

### D4：保留既有行為——不擋點擊、不退化放大／無背板、不越過操作 UI

* 公主 token 現為 `pointer-events:none`（不攔截下方 hotspot 點擊）；拉升 z-index 後**仍須保留**，確保地點仍可點擊、互動不被公主擋住。
* 不得回退 #161／#9 之 token 放大與「移除識別色背板」；本案僅改堆疊順序、不動尺寸與背板。
* z-index 須低於地圖操作 UI（目的地面板 z 24 等），公主置頂僅凌駕地圖圖示、不蓋過功能面板。

### D5：回歸守門——補可機判的 z-order 斷言

* 既有 `?selftest=map-avatar` 未驗堆疊；3code 宜於 selftest 補可機判部分：公主 token 之 computed `z-index` **高於**地點標記（`.map-marker.hotspot`）與裝飾層（`.map-life-layer`），且仍**低於**目的地面板（`.destination-panel`）。
* 純視覺遮擋（公主走到圖示上是否完整可見）難以單元化者，明列為**人工 visual-qa**：寬＋窄視窗、地區／城堡／世界三面，將公主移到地點圖示／裝飾元素位置確認不被遮、且地點仍可點擊。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核此方向）**：本圖層規則由本 note 承載、3code 落地、selftest／實機 visual-qa 守回歸；`docs/design.md` ＜I／II＞ spec# 編號不增刪、文字不改（docLint sol 維持 0）。
  * **可選 Option B（USR-gated）**：因 design.md 已以 solCase#2.1／spec#9 記錄地圖 token 行為，可一併於 **spec#9**（或 spec#2）句末微修補述「地圖公主 token 須永遠顯示於地圖圖示之上、不被地點標記或裝飾元素遮擋」（屬 ＜I＞ 回修、USR-gated）；spec# 編號不增減。預設不做、維持 Option A。
* **② 實作手法（調 `.player` z-index vs 公主專屬置頂層）**：建議**調高 `.player` z-index**（D2，最小改動、三 token 共用一處生效）。若 USR 偏好結構上更穩健、未來免再調的「公主專屬置頂層」，3code 對應改 DOM／樣式（代價較大）。
* **③ 範圍確認**：建議**僅三地圖面之 token 圖層順序**（地區／城堡／世界），地點互動、走動、座標與地圖資料不動（D4）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 維持 0）。若 §4① USR 改選 Option B，再補 design.md（spec#9／#2 微修，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * [styles/map.css]：將 `.player`（三 token 共用）之 z-index 由 3 調升至高於地圖圖示最高層（life-layer 7）、低於操作 UI（目的地面板 24）之明確定值（D1／D2／D3），並加註層級約定；保留 `pointer-events:none`（D4）。
  * 必要時檢視 [styles/mobile.css] 等是否有覆蓋 `.player` 或 `.map-life-layer` z-index 之 RWD 規則，確保三面與寬窄視窗一致生效。
  * [game-engine/testing/selftests.js]：補 z-order 斷言（公主 token computed z-index 高於 `.map-marker.hotspot`／`.map-life-layer`、低於 `.destination-panel`），或擴充 `?selftest=map-avatar`（D5）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（含改動之 selftests.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error。補 selftest 斷言（D5）：公主 token computed z-index 高於地點標記與裝飾層、低於目的地面板；既有 `?selftest=map-avatar` 維持綠燈。
  * **GATE §5（實機 visual-qa，異動渲染堆疊）**：將公主 token 移到地點圖示／裝飾元素位置——①公主**完整顯示不被遮**；②地區／城堡／世界三面一致；③hotspot 仍可點擊進入場景（`pointer-events:none` 保留）；④公主不蓋過目的地面板等操作 UI；⑤token 放大／無背板現況不退化。寬＋窄視窗逐面紀錄為證。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#153／#157／#161／#166／#177／#178 焦點修正慣例：本焦點變更之 GATE 驗證結果記於本節與 PR 留言。`docs/design.md` 未改（Option A，docLint sol 0）。三審查點均採 §4 建議預設（Option A／調 `.player` z-index／僅三地圖面，USR 於本對話以「GO CODE」核准）。

### 實作（依 §3 D1–D5）

* **D1／D2／D3（[styles/map.css]）**：新增 ID 選擇器規則 `#playerToken, #castlePlayerToken, #worldPlayerToken { z-index: 20; }`。三 token 原有效 z-index 為 11（`.player` 經 mobile.css 各斷點覆蓋 18／11、最終 11），落在地圖圖示之下；ID 選擇器特異度（1,0,0）高於所有 `.player` 類別／媒體查詢規則（0,1,0），故跨**所有斷點**統一勝出為 20，無 `!important`、不動既有 `.player`／`.hotspot`／`.map-life-layer` 規則。一處規則、三 token 共用（D3）。
* **D4（保留既有行為）**：僅設 z-index，未動 `.player` 之 `pointer-events:none`（地點 hotspot 仍可點擊）、未動 token 尺寸與 `.map-doll::before` 背板移除（#161／#9 放大無背板現況不退化，map-avatar intTest#26 仍綠）。z-index 20 < 目的地面板 `.destination-panel`（24），公主不蓋過地圖操作 UI。
* **D5（回歸守門，[game-engine/testing/selftests.js]）**：擴充 `?selftest=map-avatar` 加入 #180 z-order 斷言——三 token 之 computed z-index 均高於對應標記層（`#hotspotLayer`／`#castleMarkerLayer`／`#worldMarkerLayer`）與合成 `.hotspot.nearby`，且 urban token 高於裝飾層 `#mapLifeLayer`、低於 `#destinationPanel`。

### GATE §1（機器判定，全綠）

* `node --check`：`game-engine/testing/selftests.js`／`game-engine/main.js` → OK。
* `docLint docs/design.md`（sol）→ **0**；`repoLint .` → **0**。
* headless selftest（chromium，本機 server :4188 服務本分支檔案）全 PASS、console **0 error／0 warning**：
  * **`map-avatar`（含 #180 新斷言）**：`passed:true`——跨地圖渲染＋intTest#26（token 放大 ≥100px、無背板）＋intTest#27（走到再進入／途中略過）＋**#180 z-order**（三 token z20 高於標記層／nearby、高於裝飾層、低於目的地面板）。
  * **回歸**：`map-walk`、`scene-nav`、`data-audit`（0 err）、`monkey`（300 步、0 err）→ 全 `passed:true`。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用（STACK techStackStaticWeb）。

### GATE §5（業界水準審查＋視覺證據）

> 本增量異動渲染堆疊（z-order），以實機量測＋修前／修後視覺佐證。

* **跨斷點 computed z-index 量測**（vw 390／773／1280／1600 一致）：公主 token = **20**、`#hotspotLayer` = 12、`.hotspot.nearby` = 12、`#mapLifeLayer` = 7、`#destinationPanel` = 24 ⇒ 序為 `7 < 12 < 20 < 24`：公主高於所有地圖圖示、低於地圖操作 UI。
* **修前／修後視覺**（urban 地圖，公主 token 疊於地點標記 `workwearStall` 上）：修前（強制回 z11）公主被標記方塊遮住、僅露下緣；修後（z20）公主完整顯示於標記之上。
* **鏡頭 A／B**：①三面公主置頂不被遮、②hotspot 仍可點擊（`pointer-events:none` 保留）、③不蓋過目的地面板（20<24）、④token 放大／無背板不退化（intTest#26 綠）、⑤裝飾動畫層（z7）不再遮公主、⑥純 CSS／無 JS 邏輯變更（monkey 300 步、data-audit 0 err 無副作用）——逐項以量測／selftest／截圖坐實。
* **分級**：`務必要修` **0**；`可以接受`——z-index 取 20（安全窗 13–23 之中值），留足與圖示（≤12）及 UI（24）之上下緩衝。
* **結論：可宣稱完成。**
