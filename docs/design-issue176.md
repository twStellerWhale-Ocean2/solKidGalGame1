# 設計note — issue #176 任意尺寸衣物素材都能正確對位穿戴

> 本檔為 2plan 設計note（非 design.md 正本、不受 docLint）。**初判 Option A**：本項為既有 wardrobe 類別級對位機制之精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；對位機制語意（render bounds 由「近全畫布 inset 微調」轉為「類別目標矩形 fit」）位於 design.md 抽象高度以下，由本 note 承載，確切資料 shape（沿用既有 `safeBox` 作目標矩形／新增 `targetBox` 欄位／是否保留 inset 作微調 override）、各類別錨定與縮放策略值留 3code 以實機 visual-qa（代表性異尺寸素材實穿、寬＋窄、四位公主）定案。意旨對應既有 **spec#3**（換裝外觀獎勵——wardrobe layer 須與 `shared-512x768-v1` base 正確對位、類別級邊界組態、同類統一、不逐件 nudge）＋ **spec#7**（模組化擴充——新增同類衣物沿用類別級 layer bounds、不另建單件對位常數）。⚠️ 審查點見 §4：design.md ＜II＞（L292 重點組態、L507 intTest#08）與 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B 對「render bounds／512×768 rig」之既有措辭仍成立，本案維持 Option A（決策由本 note 承載、實作與契約措辭隨 3code 落地）；USR 可選擇是否對 design.md ＜II＞與 art 契約作 USR-gated 輕修措辭，預設維持 Option A。

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

### D1：對位語意由「近全畫布 inset」改為「類別目標矩形 fit」

* 渲染盒由「全畫布 inset 微調」改為各類別之**目標矩形**：把 layer 的定位盒設為該類別在 512×768 上應佔的區域，素材 `contain` 縮放置入該盒——任意尺寸來圖被正規化到該類別區域，落點與尺度由目標矩形決定、不再隨來圖外框漂移。
* 目標矩形之來源：既有 `safeBox`（每類已定義「素材有效像素應落入」之畫面矩形）即為現成候選；3code 定案「直接複用 `safeBox` 作渲染目標／新增明確 `targetBox` 欄位／二者關係」之確切資料 shape。

### D2：縮放保持長寬比、各類別錨定，不變形

* fit 須等比（`contain` 類語意），避免拉伸變形破壞「正確穿戴」；各類別錨定基準（如 `shoes` 錨底、`headTop`/`hairstyle` 錨頂、`top`/`bottom`/`dress` 錨身中線）由 3code 依實機 visual-qa 定案。
* 沿用既有 `background-position:center bottom` 或改為依類別錨點，屬 3code visual-qa 決策。

### D3：渲染套用點維持 [paper-doll.js]＋[styles/paper-doll.css] 體例

* 仍以 `.paper-doll-layer` 之 CSS 變數驅動（不另立平行 layer class）；將「`--layer-*` inset＝近全畫布」改為「以目標矩形定位盒＋等比 fit」。確切 CSS／JS 作法（inset 改寫為目標矩形、或新增 `--layer-target-*` 變數、`background-size` 取 `contain`/錨定）由 3code 定案。

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

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 仍 0）。若 §4① USR 改選輕修，再補 design.md ＜II＞措辭（spec# 不增減，docLint sol 0）與 art 契約 §III.B、README 同步。
* **3code 程式產物**（依本 note §3）：
  * [content-package/wardrobe/_shared/rules.js]：類別目標矩形資料 shape（複用 `safeBox`／新增 `targetBox`）（D1／D5）。
  * [game-engine/render/paper-doll.js] + [styles/paper-doll.css]：渲染盒改為目標矩形＋等比 fit、各類別錨定（D2／D3）；既有滿版素材 identity 相容（D4）。
  * [game-engine/testing/selftests.js] `data-audit`：補「異尺寸來圖正確 fit／不變形」可重複斷言；[tool/wardrobe-tuner.js] 調參語意配合（D6）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check` 相關 JS／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless `data-audit` selftest（含新增異尺寸 fit 斷言）PASS、console 0 error。
  * **GATE §5（實機 visual-qa，寬＋窄、四位公主）**：代表性各類別（含上衣／下身／洋裝／外套／鞋／髮型／頭飾）及**刻意異尺寸**之同類素材實穿後，衣物落點落入類別目標矩形、比例與接縫正確、不變形；既有 #168／#175 已調素材不退步（identity）；跨四位公主共用 layer 對位一致。逐頁發現＋截圖＋分級，must-fix 全修。
