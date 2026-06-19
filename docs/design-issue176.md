# 設計note — issue #176 任意尺寸衣物素材都能正確對位穿戴

> 本檔為 2plan 設計note（非 design.md 正本、不受 docLint）。**初判 Option A**：本項為既有 wardrobe 類別級對位機制之精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；對位機制語意（render bounds 由「近全畫布 inset 微調」轉為「類別目標矩形 fit」）位於 design.md 抽象高度以下，由本 note 承載。意旨對應既有 **spec#3**（換裝外觀獎勵——wardrobe layer 須與 `shared-512x768-v1` base 正確對位、類別級邊界組態、同類統一、不逐件 nudge）＋ **spec#7**（模組化擴充——新增同類衣物沿用類別級 layer bounds、不另建單件對位常數）。⚠️ 審查點見 §4：design.md ＜II＞（L292 重點組態、L507 intTest#08）與 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B 對「render bounds／512×768 rig」之既有措辭仍成立，本案維持 Option A（決策由本 note 承載、契約措辭隨後續落地）；USR 可選擇是否對 design.md ＜II＞與 art 契約作 USR-gated 輕修措辭，預設維持 Option A。
>
> **USR 方向（2026-06-19）**：對位由人以肉眼判斷美術效果，故本案交付**手動校準工具**——強化 [tool/wardrobe-tuner.js]，讓 USR 逐類別手動設定衣物投影到人物身上的**目標矩形**；引擎以**選配 `targetBox`**（canvas 座標）把任意尺寸素材經 `background-size:contain` 等比 fit 進該矩形。實作採**加性、向後相容**：未設 `targetBox` 之類別維持現行滿版行為（identity），game 端 `wardrobeLayerBoundsByType` 在 USR 用工具逐類調出並貼回前**完全不變**。各類別目標矩形的**確切數值**即 USR 透過工具的手動校準產出（含以「任意尺寸測試圖」逐類目視驗證）。

## 1. 現況量測（以產物為準）

### 對位資料源（類別級，已齊備）

* 主畫面契約＝`512×768`（[game-engine/data/character-scale.js] `characterScaleContract`：`canvasWidth`=512、`canvasHeight`=768、`groundBaselineY`=768）。
* 類別級對位組態＝`wardrobeLayerBoundsByType`（[content-package/wardrobe/_shared/rules.js] L50，#168 引進），每個 item type 一筆，含兩部份：
  * **render bounds**：`{top,right,bottom,left}` 之 px **inset**（多為 ±數 px 微調，預設 `fullCanvasBounds`=全 0）。
  * **`safeBox`**：該類別「素材有效（不透明）像素應落入」之畫面像素矩形（如 `top`：`{left:150,top:390,right:370,bottom:570}`），目前僅供 `data-audit` 檢核，**未參與實際渲染定位**。
* 商品 layer 透過 [content-package/wardrobe/_shared/item-helpers.js] `layer()` 取得 `bounds = wardrobeLayerBoundsForType(type)`，即每件衣服一律繼承其類別之組態、不逐件設定（合 spec#3／spec#7）。
* 涵蓋 12 類：`hairstyle`／`top`／`bottom`／`dress`／`outer`／`shoes`／`headTop`／`headSide`／`faceEyes`／`faceMask`／`neck`／`hand`。

### 渲染套用（癥結所在）

* [game-engine/render/paper-doll.js] `boundsStyle(layer.bounds)` 只把 render bounds 寫成 CSS 變數 `--layer-top/right/bottom/left`(px)。
* [styles/paper-doll.css] L38–48 `.paper-doll-layer`：`position:absolute` + `inset: var(--layer-top) … var(--layer-left)`（預設 0 → **近全畫布盒**）+ `background-image:var(--layer-img)` + `background-size:contain` + `background-position:center bottom` + `background-repeat:no-repeat`。
* 即現行機制**已是 contain 縮放**——但縮放的是「**整張來圖（含其透明留白）的外框**」去 fit「**近全畫布盒（512×768 比例，僅 inset 微調）**」。
* **故定位「很奇怪」之根因**：`background-size:contain` 依整張圖外框等比縮放，當不同來源（GPT 產生／修圖）的同類素材其畫布尺寸／透明留白多寡／主體偏置／長寬比不一致時，整張圖 fit 進近全畫布盒後，衣物主體落點與尺度即隨之漂移。現行機制隱含要求「每張素材都先畫成 `512×768`、且主體置於 rig 正確位置」（[rules.js] 註解明示「所有正式穿戴素材維持 512×768 透明畫布；render bounds 預設全畫布避免二次縮放」），來圖版型一不一致即偏位。

### 既有產物對照（design.md／契約／驗證）

* design.md 對此機制之既有條文（措辭仍成立、無 spec# 牽動）：
  * solCase#3.2（L78）：「穿搭後之衣物位置須依類別級 layer bounds 與實際穿搭視覺 QA 判定是否對位」。
  * sysCase#5.3（L220）：「新增 wardrobe item 須依 `type`／slot 繼承類別級 layer bounds」。
  * 重點組態（L292）：`paramWardrobeLayerBounds=wardrobeLayerBoundsByType（每個 item type 定義 render bounds 與 safeBox）`。
  * intTest#08（L507）：data-audit 檢查 layer type、render bounds、`safeBox` 與 PNG／WebP，且未出現單件 CSS nudge。
  * cfgTest#08（L426）：[etyCfg自訂modWardrobe組態] wardrobe 類別級 layer bounds 與素材限制組態符合契約。
* 契約 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B：L42「wardrobe layer 共用同一 `512×768` paper-doll rig、須同一幾何對位」、L48「類別級上下左右邊界／安全框組態管理…不得每件 nudge／改 selector／靠透明留白調位」。
* 既有調參工具 [tool/wardrobe-tuner.js] 與自測 [game-engine/testing/selftests.js] `data-audit`（#168／#175 已調 13 類 bounds、80 layers PASS）。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 進場原始概念（忠實轉錄，#176＜I＞）：不同公主身體構型基本一致，但上衣／外套／褲子／頭髮／鞋子等素材「進來的版型不一定一樣」；希望「所有圖片進來後，都自動縮放到主畫面（512×768）內、落在設定好的左右上下範圍」，使衣物無論多大多小都能正確穿在人物身上；頭髮、褲子、鞋子等全部同一方式辦理。
* 目標：使 wardrobe 對位**不再依賴來圖本身已對齊滿版**——任意尺寸／版型素材一律依其**類別目標範圍**自動縮放對位至 512×768 主畫面之正確位置與尺度——「縮放 fit」為手段，真正目標為「**衣物無論大小都正確穿到人物身上**」。
* 範圍界定：12 類 wardrobe layer 全體適用同一「類別目標矩形 fit」；含既有 #168／#175 已調素材之向後相容。不動答題／生活聊天／打工／逛店購買／語音／計時與護眼邏輯，不改商品資料與 slot 疊圖順序。

## 3. 設計決策（確切資料 shape／數值留 3code visual-qa）

### D1：對位語意由「近全畫布 inset」改為「類別目標矩形 fit」（已實作）

* 渲染盒由「全畫布 inset 微調」改為各類別之**目標矩形**：把 layer 的定位盒設為該類別在 512×768 上應佔的區域，素材 `contain` 縮放置入該盒——任意尺寸來圖被正規化到該類別區域，落點與尺度由目標矩形決定、不再隨來圖外框漂移。
* **資料 shape（已定案）**：於 [content-package/wardrobe/_shared/rules.js] `layerBounds(safeBox, renderBounds, targetBox)` 新增**選配第三參數 `targetBox`**（canvas 座標 `{left,top,right,bottom}`）。設定後渲染改走目標矩形 fit；未設定則沿用 render bounds（px inset）舊行為。`safeBox` 保留供 data-audit、不變。12 個既有類別暫不帶 `targetBox`（identity），實際數值由 USR 以工具逐類校準後貼回。

### D2：縮放保持長寬比、各類別錨定，不變形

* fit 須等比（`contain` 類語意），避免拉伸變形破壞「正確穿戴」；各類別錨定基準（如 `shoes` 錨底、`headTop`/`hairstyle` 錨頂、`top`/`bottom`/`dress` 錨身中線）由 3code 依實機 visual-qa 定案。
* 沿用既有 `background-position:center bottom` 或改為依類別錨點，屬 3code visual-qa 決策。

### D3：渲染套用點維持 [paper-doll.js]＋[styles/paper-doll.css] 體例（已實作）

* 仍以 `.paper-doll-layer` 之 CSS 變數驅動（不另立平行 layer class）。[paper-doll.js] `boundsStyle()` 在 layer 帶 `targetBox` 時，把目標矩形換算為**畫布相對百分比** inset（`top=box.top/768`、`left=box.left/512`、`right=(512-box.right)/512`、`bottom=(768-box.bottom)/768`）輸出 `--layer-*:%`；既有 `background-size:contain` 即把素材等比 fit 進該盒。未帶 `targetBox` 時維持 px inset 舊路徑。
* [styles/paper-doll.css] 無需改動（`inset` 同時接受 px 與 %）。canvas 維度由 `createPaperDollRenderer({canvasWidth,canvasHeight})` 注入（預設 512×768）；% 正確對應之前提為 doll 盒呈 512:768——tuner 預覽 stage 已設 `aspect-ratio:512/768`，game 端待 USR 套用各類 `targetBox` 時於 GATE §5 visual-qa 一併確認。

### D4：向後相容（identity 路徑，不得退步）

* 既有 #168／#175 已調之滿版對齊素材：當「目標矩形＝全畫布、來圖為滿版 512×768」時，新機制行為須等同現況（identity）。
* 既有 `wardrobeLayerBoundsByType` 之 render bounds 微調值在新模型下之換算或保留方式（作為目標矩形上的細部 override）由 3code 定案；既有已穿好之代表性衣物（跨四位公主共用 layer）不得對位退步。

### D5：全 12 類一體適用、同類共用、不逐件 nudge

* 12 類 wardrobe layer 同一套「類別目標矩形 fit」；同類共用同一目標矩形，新增同類素材只需落在類別範圍即自動對位、免逐件位移或 CSS nudge（守 spec#3／spec#7 與 art 契約 §III.B L48）。
* 目標矩形成為**唯一對位事實來源**；render bounds（若保留）僅為例外 override，不得回退為常態逐件 nudge（避免兩套對位疊床架屋）。

### D6：驗證作法補「異尺寸 fit」可重複守門

* 現行 `data-audit` 僅查 layer type／render bounds／`safeBox`／素材格式，未涵蓋「來圖尺寸不一仍正確 fit」；3code 應補可重複驗證——含代表性**異尺寸**素材（同類不同畫布尺寸／留白）實穿後落點落入類別目標矩形、不變形，並以 GATE §5 實機 visual-qa（寬＋窄、四位公主）佐證。
* [tool/wardrobe-tuner.js] 調參語意（調 inset → 調目標矩形）配合更新。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核）**：對位機制語意（inset→目標矩形 fit）位於 design.md 抽象高度以下；spec#3／spec#7 與 ＜II＞既有措辭（L292「render bounds 與 safeBox」、L507 data-audit、solCase#3.2、sysCase#5.3）皆仍成立、無 spec# 增刪——決策由本 note 承載、README 補＜變更紀錄＞初稿，實作隨 3code 落地。
  * **可選輕修（如 USR 希望記為 design 級／契約級措辭）**：可於 ＜II＞重點組態 L292 與 intTest#08 L507 將「render bounds」措辭補述為「類別目標矩形 fit（render bounds 為其上之微調 override）」，並於 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B L42／L48 補述「來圖可為任意尺寸、由類別目標矩形等比 fit，TARGET 幾何仍為 512×768；不得逐件 nudge 之規則保留」。spec# 編號不增減，屬 ＜II＞／契約文字。預設不做、維持 Option A（措辭與契約更新隨 3code，比照 #168 於 code 修訂本契約之慣例）。
* **② 範圍確認**：12 類 wardrobe layer 全體（不只上衣／外套／褲子，含髮型／鞋／頭飾／臉部／頸／手）＋既有素材向後相容（identity）；不動答題／聊天／打工／逛店／語音／計時／護眼與商品資料、slot 疊圖順序。
* **③ 縮放調性確認**：等比 fit、各類別錨定、不變形（非拉伸塞滿）；目標矩形為唯一對位事實來源，nudge 僅例外 override。

## 5. 產物分工與 GATE 驗證計畫

* **本 PR 已交付（機制 + 工具，加性向後相容）**：
  * [content-package/wardrobe/_shared/rules.js]：`layerBounds` 新增選配 `targetBox`（D1）；12 類暫不帶、game 不變。
  * [game-engine/render/paper-doll.js]：`boundsStyle` 目標矩形→畫布相對 % fit；`createPaperDollRenderer` 注入 canvas 維度（D3）。未帶 `targetBox` 維持 px 舊路徑（D4 identity）。
  * [tool/wardrobe-tuner.js]／`.html`／`.css`：Target Box 編輯（canvas 座標）＋虛線 overlay＋「任意尺寸測試圖」預覽＋含 `targetBox` 的 export（D1／D2／D5／D6）；[tool/README.md] 更新。
  * 設計note（本檔，Option A）＋ [README.md] ＜變更紀錄＞一筆。`docs/design.md` 未改（docLint sol 0）。
  * **驗證（已過）**：`node --check`（paper-doll／rules／tuner）OK；`repoLint .` 0；`docLint docs/design.md` sol 0；tuner 於本機 server 載入無 console error，目標矩形→% 對映正確（top 390/768=50.781% 等）、實際 top layer 套用 % inset、export 帶 `targetBox`、identity 預設（0,0,512,768）。
* **後續（USR 校準迴圈 → 套用 → 收尾 QA）**：
  * USR 以工具逐類目視校準各 `targetBox`（用「任意尺寸測試圖」確認對位），export 貼回 [content-package/wardrobe/_shared/rules.js]。
  * 套用後 GATE §5 實機 visual-qa（寬＋窄、四位公主）：各類別含**刻意異尺寸**素材實穿落點落入目標矩形、比例接縫正確、不變形；既有 #168／#175 素材不退步；跨角色共用 layer 一致。
  * 視需要補 [game-engine/testing/selftests.js] `data-audit` 對 `targetBox`／異尺寸 fit 之可重複斷言（D6）。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#153／#166 焦點變更慣例：本變更之 GATE 驗證結果記於本節。本增量交付的是**維護者工具 + 加性引擎機制**；遊戲玩家畫面未變（game 端 `wardrobeLayerBoundsByType` 維持 identity，未帶 `targetBox`），故無玩家面 UI 逐頁與 test-summary.pdf（待 USR 裁決是否另產）。`docs/design.md` 未改（Option A，docLint sol 0）。

### 實作

* **D1（[content-package/wardrobe/_shared/rules.js]）**：`layerBounds(safeBox, renderBounds, targetBox)` 新增選配第三參數 `targetBox`（canvas 座標）；12 個既有類別未帶 → game 行為不變。
* **D3（[game-engine/render/paper-doll.js]）**：`boundsStyle` 在 layer 帶 `targetBox` 時輸出畫布相對 %（`top/768`、`left/512`、`right=(512-right)/512`、`bottom=(768-bottom)/768`）+ 既有 `background-size:contain` 等比 fit；未帶則維持 px inset 舊路徑（D4 identity）。`createPaperDollRenderer` 加 `canvasWidth/canvasHeight` 參數（預設 512×768）。
* **工具（[tool/wardrobe-tuner.js]／`.html`／`.css`／README）**：「Render Bounds」改為 **Target Box**（canvas 座標 L/T/R/B）編輯＋ Move 平移＋虛線 overlay；新增「任意尺寸測試圖」載入即時預覽；export 含 `targetBox`（identity 類別自動省略）；stage 設 `aspect-ratio:512/768` 使 % 正確對映。輸入夾限至 `[0, 512/768]` 並回寫輸入框、`left≤right`／`top≤bottom` 防反向框。

### GATE §1（機器判定，全綠）

* `node --check`：`game-engine/render/paper-doll.js`、`content-package/wardrobe/_shared/rules.js`、`tool/wardrobe-tuner.js` → OK。
* headless selftest（本機 server）：`data-audit` → `passed:true`、`errors:[]`；`map-avatar` → `passed:true`、`errors:[]`；console **0 error**——加性 `targetBox` 對既有 wardrobe 渲染**零回歸**。
* `repoLint .` → **0**；`docLint docs/design.md`（sol）→ **0**。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用。

### GATE §5（業界水準審查，聚焦變更之維護者工具）

* **鏡頭 A（工具/腳本能力）**：目標矩形輸入驗證（夾限＋回寫＋防反向框）✅；Reset Type／Reset All ✅；export 可重貼、identity 類別不含 `targetBox`（貼回 game 不變）✅；載入/Clear 測試圖 ✅。
* **鏡頭 B（專家缺口）**：發現「超範圍輸入只夾限儲存值、輸入框仍顯示原數字」與「未防 `left>right` 反向框」→ **已修**（`setTargetEdge` 夾限後回寫輸入框並做 `left≤right`/`top≤bottom` 約束），實機複驗 `9999→512`、`-50→0`、`left=999→370`。
* **鏡頭 C（逐頁）**：本增量唯一變更畫面為維護者 Wardrobe Tuner（非產品玩家 HMI）；遊戲玩家畫面未變（config identity、selftest 零回歸）。Tuner 經實機驗證：目標矩形→% 對映精確（top `390/768=50.781%`…）、overlay 與實際 layer inset 一致、無 console error。
* **分級**：`務必要修`＝輸入夾限回寫/防反向框（已修）；其餘 `可以接受`（dmethod 為 dev 工具、調性沿用既有粉彩主題）。
* 註：本環境 preview 截圖工具連續 timeout（截圖管線問題、頁面經 eval 確認正常），故以 computed-style／selftest／DOM 實證代替截圖佐證。

### 結論：可宣稱完成（本增量交付範圍：維護者工具 + 加性引擎機制；玩家畫面零回歸）。各類別 `targetBox` 確切數值為 USR 後續以工具之手動校準產出。

## 7. 研改方向：兩層對位 + 去空白邊（USR 回饋，2026-06-19）

USR 實試後回饋：單靠類型框喬不好同類內尺寸差異（如頭髮長短）；改採——

* **兩層對位**：①類型框（layer1，只設投影上下左右邊界）②各單品 per-item `targetBox`（layer2，縮放＋位移），同類內各件可不同。
* **現有素材去空白邊**：素材改為緊貼裁切 bitmap（USR 選「腳本實際裁切重存」）。
* **工具以左邊（分類/單品）為准**，移除右側重複的 Layer Type 頁籤。

### 切片 A（已完成：裁切 + 引擎 + 稽核 + 契約）

* [tool/trim-wardrobe-assets.mjs]（ImageMagick）量測每張 layer 的原始內容框（alpha 門檻）並 `--apply` 緊貼裁切覆寫 80 張、產生 [content-package/wardrobe/_shared/asset-content-box.generated.js]。
* [content-package/wardrobe/_shared/item-helpers.js]：每件 layer 帶 per-item `targetBox` = 其原始內容框（identity 遷移）。
* [game-engine/testing/selftests.js] `data-audit`：改為——帶 `targetBox` 者驗「素材緊貼裁切 + `targetBox` 落於類別 `safeBox` 內」；未帶者沿用舊 512×768 + alpha-in-safeBox。
* [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B／§IV：wardrobe layer 改為「緊貼裁切 bitmap + per-item `targetBox` 等比 fit」（base rig 仍 512×768）。
* **驗證**：`node --check`（item-helpers／selftests／generated）OK；`repoLint` 0；`docLint` sol 0；`data-audit` selftest `passed:true errors:[]`；遊戲載入 console 0 error。
* **已知精度註記**：in-game doll 容器（`.adv-doll` 390×560、`.map-doll` 108×140）非精確 512:768，皆「高度受限」——故 per-item `targetBox` 之 **垂直定位精確、水平僅在邊緣有 ≤letterbox（中心為 0、邊緣約 ±8px）微偏**，近 identity。若需像素精確，後續可加 512:768 內層 canvas wrapper（須一併處理 `.bust-doll` 頭胸裁切）；目前近似足供 USR 校準。

### 切片 B（已完成）：工具兩層改版

* [tool/wardrobe-tuner.js]／`.html`／`.css`：左（分類/單品）為唯一選取、**移除右側 Layer Type 頁籤**；右側分 **① 類型框**（= 該類 `safeBox`，套同類、faint overlay）＋ **② 單品框**（per-item `targetBox`，縮放/位移/edge，僅該件、solid overlay），含 selected-info、Move/Bigger/Smaller、輸入夾限回寫＋防反向框、任意尺寸測試圖。
* **雙匯出**：① 類型框 → [content-package/wardrobe/_shared/rules.js]（`wardrobeLayerBoundsByType` safeBox）；② 單品框 → [content-package/wardrobe/_shared/asset-target-overrides.js]（**只列與裁切原始框不同者**之 diff）。
* 引擎 [content-package/wardrobe/_shared/item-helpers.js]：per-item `targetBox` 解析優先序 **覆寫 → 裁切原始框 → 類別 safeBox**；新增 [asset-target-overrides.js]（人工校準層，重跑 trim 不覆寫）。
* **驗證**：`node --check`（tuner／item-helpers／overrides）OK；tuner 載入無 console error，無右側類型頁籤、① safeBox／② 內容框正確帶入、Move/Bigger/edit 即時更新 overlay 與雙匯出（覆寫為 diff、Reset Item 還原）、夾限回寫＋防反向框；`data-audit` selftest `passed errors:[]`；`repoLint` 0；`docLint` sol 0。
* **工具操作強化（USR 回饋，2026-06-19）**：
  * **非等比縮放**：targetBox layer 改 `--layer-fit:100% 100%` 填滿目標矩形（box 同時定寬高、可獨立拉伸）；[styles/paper-doll.css] `background-size: var(--layer-fit, contain)`，base 等無 targetBox 者維持 contain。素材緊貼裁切後 box 預設＝內容框、長寬比相同故 identity 不變形。
  * **圖上拖拉**：② 單品框 overlay 加中央方塊（移動）＋四邊四角共 8 點（非等比縮放），以 stage 512:768 換算 canvas 座標即時更新。
  * **人物畫布圖框**：preview 加 512×768 圖框＋中線參考，輔助對位。
  * **一鍵套用**：「✓ 套用到檔案」按鈕 → `server.mjs` dev 端點 `POST /tool/apply-wardrobe`（白名單兩檔、區塊替換、保留原檔 EOL），免 copy-paste。
  * **編輯對象切換（USR 回饋）**：右側選 ① 類型框／② 單品框，圖上拖拉控制點即作用於所選的框（active 框實線＋控制點，另一框 faint 參考）；「套用到檔案」移至控制欄最下方、取代舊的參數匯出文字框（匯出片段於按下時即時組出，不再常駐 textarea）。
  * ① 類型框（safeBox）定位：為投影區約束＋新素材預設值（既有單品各帶 ② 單品框、不受 ① 即時影響），非逐件控制。
* **後續（USR 校準）**：USR 逐件以工具校準（拖拉/數值）→「套用到檔案」或 Copy 貼回 → 套用後實機 visual-qa（寬＋窄、四位公主、含刻意異尺寸素材）收尾。
