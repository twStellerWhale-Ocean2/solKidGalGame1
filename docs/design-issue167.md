# 設計note — issue #167 統一場景對話方塊選項樣式並調整透明度與版面使試穿可見

> 本檔為 2plan 設計note。**初判 Option A**：本項為既有方案下之對話方塊呈現層精修（選項配色一致性、第三層透明度、退款空狀態、商品白底、角色水平比例），於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號或既有條文**；呈現決策由本 note 承載，確切數值（透明度基準的對半值、`20%` 白底色碼、角色水平 `%` 與斷點對位、選項配色收斂後的實際色票）留 3code 以實機 visual-qa（寬＋窄、含試穿透視與退款空清單）定案。意旨對應既有 **spec#11**（場景互動三模組生活聊天／逛店／打工之呈現一致性）＋ **spec#3**（換裝外觀可見、購買時可見試穿效果），並承 #135／#138／#143／#149／#150 場景對話收斂脈絡。⚠️ 審查點見 §4：design.md 既未對對話方塊配色／透明度／角色像素定位設條文（皆落在 [styles/adv.css]／[styles/shop.css]／[styles/mobile.css]／[game-engine/render/item-panel.js]），本案維持同一慣例不另起；USR 可選擇是否對 sysCase 作 USR-gated 輕修，預設維持 Option A。

## 1. 現況量測（以產物為準）

### 動線層級（承 #143）

* 場景互動分層（承 issue #143，見 [README.md] ＜變更紀錄＞）：**第一層 [場景選單]**以 `Leave` 回地圖；進入任一互動後以 `Back` 回 [場景選單]。本案所稱「**第二層**」＝直接以對話選項作答之互動（生活聊天 Chat／打工 Work）；「**第三層**」＝其後掛有物品明細面板、且角色試穿（try-on）需透出之互動（逛店 Shop／退款 Refund／換裝 Wardrobe，即 `.adv-scene[data-mode="shop"|"refund"|"wardrobe"]`）。

### 選項／命令鈕配色現況（癥結：兩條樣式路徑）

* **第二層（Chat／Work）選項**＝ `.choice-button`（[styles/adv.css:233-264]）：`#fff` 底、`2px` 玫瑰描邊，答題回饋 `.correct`（薄荷綠 `#effbf2`）／`.wrong`（淡紅 `#fff1f1`）。此為對話選項配色之既有事實來源。
* **第三層（Shop／Refund）命令鈕**另走一套：物品明細面板由 [game-engine/render/item-panel.js] 之 `renderItemDetailPanel` 產製，動作鈕 `.shop-buy-button`（[styles/shop.css:125-136]）採 `linear-gradient(180deg, #e46696, #aa3f6b)` 粉紅漸層實心鈕；命令列容器 `.shop-command-list`（[styles/shop.css:148-156]）。
* 兩條路徑分屬 [styles/adv.css] 與 [styles/shop.css]＋[item-panel.js]，各自演化致視覺語彙不一致——即 issue 所指「選項配色分散」。
* 唯一已收斂處：明細面板的返回鈕已重用 `.choice-button leave-choice item-panel-back`（[item-panel.js:84]），可作為「面板沿用 Chat 選項機制」之既有先例。

### 第三層對話方塊不透明度現況（癥結：遮住試穿）

* 對話方塊 `.adv-box` 底色＝ `rgba(255, 250, 246, 0.97)`（[styles/adv.css:145]），近乎不透明。
* 第三層（shop／refund／wardrobe）其後即角色試穿區（`.adv-portraits` 內 `.adv-princess` 紙娃娃）；近不透明的 `.adv-box` 使「邊看試穿邊買」之效果不易透出，與 spec#3「購買時可見試穿」相牴觸。
* `.adv-box` 透明度目前為散落字面值、**無集中參數**，難以單點微調。

### 退款空清單現況（癥結：突兀白方塊）

* 退款無可退款項時，`emptyText` ＝ `` `No ${shopLabel} treasures to refund.` ``（[game-engine/main.js:2668]）。
* 該文字由 `renderItemDetailPanel` 包成 `.item-panel-empty` div 鋪在面板上（[item-panel.js:19-23]）；於第三層白色面板上呈現為一塊突兀白方塊。
* 既有體例已有 `:empty` 隱藏慣例（`.choice-list:empty`／`.lesson-feedback:empty` 等，[styles/adv.css:208-212]、[styles/mobile.css:2801-2807]），可資沿用。

### 販賣物品白色底現況

* 物品縮圖底＝ `.item-preview`／`.item-image` 之 `#fffaf0`（[styles/mobile.css:414]、[styles/mobile.css:1583-1585]）近白奶油底；逛店時此白底亦壓在試穿之上、減弱透視。

### 角色水平定位現況（癥結：固定像素、無寬窄比例）

* `.adv-princess`／`.adv-npc` 以**固定像素**水平定位、寬窄各自為政：
  * 基準 [styles/adv.css:107-124]：`.adv-princess { left: 34px }`／`.adv-npc { right: 34px }`。
  * 窄版 [styles/mobile.css:461-467]：`left: 42px`／`right: 42px`；場景模式 [styles/mobile.css:2404-2410]：`.adv-scene[data-mode="scene"] .adv-princess { left: -48px }`／`.adv-npc { right: 0 }`。
* 尚無依窄版／寬版區分之**水平比例**（如 `25%`／`75%` vs `33%`／`66%`），固定像素在不同螢幕比例下不易維持一致構圖。

* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取；本地 `main` 已同步 `origin/main`（d49db7e），自最新 main 切出 `feat/issue167-adv-scene-dialog-style`。

## 2. 設計命題（USR 目標）

* 進場原始概念（忠實轉錄 Issue＜I. 開發目的＞）：
  1. 統一第二、三層對話方塊（Chat／Work／Refund）的選項配色，一律沿用生活聊天（Chat）的選項機制，消除分散。
  2. 將統一後的第三層對話方塊不透明度降為現行之半（更透明），使公主選購時可看見試穿效果。
  3. 第三層退款（Refund）選單於無可退款項（`No {shop} treasures to refund.`）時直接留空，不顯示突兀的白色方塊。
  4. 販賣物品的白色底改用 `20%` 白色（半透明白底）。
  5. 角色水平配置：窄版維持水平 `25%`／`75%`；寬版改為水平 `33%`／`66%`。
* 目標：收斂對話選項配色為單一事實來源（手段），真正目標為「**場景對話呈現一致**」＋「**選購時可見試穿**」（spec#11／spec#3 表現層精修）。
* 範圍界定：僅改對話方塊**呈現層**（選項／命令鈕配色、第三層透明度、退款空狀態、商品白底、角色水平定位）；不動答題判定、coins／退款金額、心情與護眼計時、換裝穿戴與 layer 對位（#168）、商店定價（#157）、地圖（#125／#166）等既有能力與邏輯。

## 3. 設計決策（確切數值／色票留 3code visual-qa）

### D1：選項配色收斂為單一事實來源（Chat 機制），Work／Refund 面板沿用

* 以第二層 `.choice-button`（[styles/adv.css:233-264]）為**選項配色單一事實來源**：底色、描邊、`.correct`／`.wrong` 回饋家族集中於此。
* 第三層 Shop／Refund 明細面板之命令／動作鈕（現 `.shop-buy-button` 漸層、`.shop-command-list`）改沿用同一 `.choice-button` 配色家族，收斂兩條樣式路徑；返回鈕已沿用（[item-panel.js:84]）即既有方向。
* **真收斂、非加旗標**（回應魔鬼代言人③）：以抽出共用配色（CSS 變數或共用 class）讓面板鈕**直接套用** Chat 既有語彙，不得為 Shop／Refund 另開 `if/旗標` 分支把特例硬塞進通用機制；統一後一併移除逛店／退款殘留且分歧的配色規則（死碼／覆寫衝突）。
* 確切色票、是否保留漸層改為純色、動作鈕（買／退）與選項鈕之主次區別由 3code 依 visual-qa 定案。

### D2：第三層對話方塊不透明度減半，且「方塊背景」與「選項按鈕底」分層

* **明確定義「第三層」與基準**（回應魔鬼代言人②／④）：第三層＝ `.adv-scene[data-mode="shop"|"refund"|"wardrobe"]`；不透明度基準＝ `.adv-box` 之 `rgba(255, 250, 246, 0.97)`（[styles/adv.css:145]）。
* 為 `.adv-box` 背景透明度建立**可調參數**（如 CSS 變數 `--adv-box-opacity`），第二層維持現值、第三層降為**現值之半**（約 `0.48`，確切值 3code 定），使其後試穿透出。
* **分層原則（回應魔鬼代言人①）**：只降「方塊背景容器」透明度；**選項／命令按鈕底色維持足夠不透明與對比**，使統一後的選項落在更透明的第三層方塊上仍清楚可讀——透明的是 box、非 button。
* 手機直向小螢幕對比優先（[AGENTS.md]：主要遊玩裝置為手機瀏覽器）：透明度不得低到文字難辨，3code visual-qa 以實機對比判定下限。

### D3：退款空清單留空、不渲染白方塊，保留輕量提示

* 退款無可退款項時不渲染 `.item-panel-empty` 白方塊（沿用既有 `:empty` 隱藏慣例，[styles/adv.css:208-212]），消除突兀白塊。
* **保留極輕量「目前無可退款」回饋**（回應魔鬼代言人②）：改以對話標題列／feedback 行之文字承載，而非整塊白色面板；確切呈現（保留標題提示或完全靜默）由 3code 依 visual-qa／USR 定案。
* 實作落點待 3code 拍板：於 [item-panel.js] 空清單時不產生空容器，或於 [game-engine/main.js] 退款渲染（約 [main.js:2661-2679]）分流不掛面板；二擇一不重複。

### D4：販賣物品白色底改 `20%` 白（半透明白底）

* `.item-preview`／`.item-image` 之 `#fffaf0`（[styles/mobile.css:414]、[styles/mobile.css:1583-1585]）改為 `rgba(255, 255, 255, 0.2)`（`20%` 白），使逛店縮圖不再以實心白底壓住試穿透視。
* 須兼顧縮圖（emoji／bitmap 商品圖）於半透明白底上的辨識度；確切是否連動描邊／陰影補強對比由 3code 定。

### D5：角色水平定位改比例化（窄 `25%`／`75%`、寬 `33%`／`66%`）

* `.adv-princess`／`.adv-npc` 之水平定位由固定像素（[styles/adv.css:107-124]、[styles/mobile.css:461-467]、[styles/mobile.css:2404-2410]）改為**依斷點之比例**：窄版維持水平 `25%`／`75%`、寬版改為 `33%`／`66%`。
* 比例之參考容器（`.adv-portraits` 寬）、`%` 與角色寬度（`--adv-character-stage-*`）之對位、各既有斷點覆寫之收斂由 3code 依 visual-qa（寬＋窄）定案；不另立分歧的第三套定位值。

### D6：相容與寬窄共用

* 不動答題／生活聊天／打工／逛店購買／退款金額／換裝穿戴／語音／計時護眼邏輯；本案重**呈現**、不新增能力。
* 與 #143（互動分層動線）、#149／#150／#165（對話與回饋收斂）、#157（商店定價）、#168（wardrobe layer 對位）等既有成果共存、不回退。
* 寬窄共用單一結構（承 #111／#120／#132「同元件、寬窄各自為政」版型債之收斂），差異僅止於斷點數值，不另立分歧樣式。

## 4. 審查點（USR 裁決結果）

> **USR 裁決（2026-06-19，✅ 全數核准）**：① 維持 **Option A**（design.md ＜I／II＞不改）；③ 退款空清單**留空＋保留輕量提示**；④ 第三層透明度以 `.adv-box` `0.97` **對半（約 `0.48`）**為基準（按鈕底不隨之減半）。② 範圍依下述。plan 達 `DESIGN-READY`、交棒 3code。

* **① design.md 落點 → Option A（USR 核准）**：對話方塊配色／透明度／空狀態／角色像素定位皆屬呈現精修，且 design.md 現**未對之設條文**（與既有 portal 形狀、選項配色一致——皆只落在 CSS／renderer）；本案維持同一慣例——design.md ＜I／II＞無 spec# 增刪、決策由本 note 承載、README 補＜變更紀錄＞初稿。
  * **可選輕修（如 USR 希望記為 design 級行為）**：可於 sysStory#3（承接換裝與商店，[docs/design.md:209-212]）新增一條 sysCase，述「[modScene／modWardrobe模組] 渲染第三層物品面板時，選項配色沿用對話選項單一機制、方塊背景透明度於試穿模式減半且不犧牲選項可讀、空清單不渲染面板、角色水平依斷點比例定位」；spec# 編號不增減，屬 ＜II＞ 文字。預設不做、維持 Option A。
* **② 範圍確認**：選項配色統一涵蓋 Chat（SSOT）／Work／Refund 之選項與命令鈕；透明度減半與商品 `20%` 白底套用於第三層（shop／refund／wardrobe）；角色比例化套用於對話角色舞台。不動非呈現邏輯。
* **③「退款空清單」回饋確認**：留空不顯白方塊，但**保留輕量「無可退款」文字提示**（標題／feedback 行），非完全無回饋——請 USR 確認此取向。
* **④「透明度基準」確認**：第三層不透明度減半以 `.adv-box` `0.97` 為基準對半（約 `0.48`）；按鈕底色不隨之減半（維持可讀）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 仍 0）。若 §4① USR 改選輕修，再補 design.md（sysStory#3 新增 sysCase，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * [styles/adv.css]：選項配色單一事實來源（D1）；`.adv-box` 透明度參數化、第三層減半（D2）。
  * [styles/shop.css]：Shop／Refund 命令鈕（`.shop-buy-button`／`.shop-command-list`）改沿用 `.choice-button` 配色家族（D1），移除分歧殘留。
  * [styles/mobile.css]：物品 `.item-preview`／`.item-image` 白底改 `20%` 白（D4）；`.adv-princess`／`.adv-npc` 水平比例化（D5）；寬窄收斂（D6）。
  * [game-engine/render/item-panel.js]／[game-engine/main.js]：退款空清單不渲染白方塊、保留輕量提示（D3）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（main.js／item-panel.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest PASS、console 0 error。
  * **GATE §5（實機 visual-qa，computed style 為準＋截圖佐證，寬＋窄）**：
    * 選項配色：Chat／Work／Refund（含 shop 命令鈕）選項採同一配色家族、視覺一致；無殘留分歧規則。
    * 透明度：第三層 `.adv-box` 較第二層明顯更透、其後試穿可見；選項／命令按鈕文字於透明方塊上仍清楚可讀（對比達標）。
    * 退款空清單：無可退款項時不出現白方塊、保留輕量提示；有可退款項時面板正常。
    * 商品白底：`.item-preview`／`.item-image` 為 `20%` 白、試穿透出、縮圖仍可辨。
    * 角色水平：窄版 `25%`／`75%`、寬版 `33%`／`66%`，寬窄構圖一致。
    * 三鏡頭：A（HMI 最低能力：選購時可見試穿、選項可讀）＋B（兒童 UX：手機直向對比與一致性）＋C 逐頁（上列五項 × 寬窄對照）。逐頁發現＋截圖＋分級，must-fix 全修。
* **交付物（test-summary.pdf 待 USR 裁決）**：沿 #101／#111／#120／#132／#150／#166 焦點 UI 修正慣例，3code 之 GATE 報告記於本檔對應節；是否另產 A5 直向 [docs/test-summary.pdf] 待 USR 裁決，QA 截圖為暫存產物、不作交付物。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#166 焦點 UI 修正慣例：本焦點變更之 GATE 驗證結果記於本節。design.md 未改（Option A，docLint sol 0）。

### ⚠️ 現況校正（以產物為準，STATES §2）

* **plan §1／§3 現況量測之透明度與配色基準有誤，3code 以實機 computed style 校正**：plan 依 [styles/adv.css] 靜態值記為「`.adv-box` 近不透明奶油 `rgba(255,250,246,0.97)`、`.choice-button` `#fff`」；惟 **實機 computed style 顯示對話方塊實際走 issue #70「視覺小說分層」暗色玻璃 token 系統**（[styles/mobile.css] `.adv-scene:is(scene…refund)` 區塊，約 L3314+）：
  * 對話方塊底色＝ `var(--adv-dialog-bg)` ＝ `rgba(47, 38, 52, 0.46)`（暗紫半透明，**非** `0.97` 奶油），且 `.adv-box` 為 `position:absolute` 浮於滿版角色層（z-index 5 / 2）之上——故方塊確實覆蓋試穿，D2 命題成立、僅基準值不同。
  * Chat／Work 選項鈕＝ `rgba(58,46,64,0.74)` 暗色玻璃（**非** `#fff`）；Shop／Refund 動作鈕＝ `.shop-buy-button` 粉紅漸層——此即真正「配色分散」（暗色玻璃 vs 粉紅漸層）。
  * 角色水平**現況本即 25%／75%**（token 系統 calc，[styles/mobile.css] L3390/3404），故 issue「窄版維持 25/75」＝保留、「寬版改 33/66」＝僅改 ≥821px。
* **影響**：實作落點由 plan 預估之 [styles/adv.css]／[styles/shop.css] 改為**統一落在 issue #70 視覺小說 token 區塊（[styles/mobile.css]）**（屬 sys/mod 內部自由區，design.md ＜I／II＞ spec 不受影響）。**透明度「對半」基準改以實機 `0.46` 計**（→ `0.23`），非 plan/USR 當時依誤值討論之 `0.97`→`0.48`。意圖（第三層更透、試穿可見）不變；確切值經實機 visual-qa 確認試穿清楚透出且文字／按鈕仍可讀。**此差異已回報 USR**。

### 實作（皆落在 [styles/mobile.css] issue #70 視覺小說 token 區塊）

* **D1**：第三層（shop/wardrobe/refund）`.item-panel-action` 由 `.shop-buy-button` 粉紅漸層改沿用 `.choice-button` 暗色玻璃家族（`rgba(58,46,64,0.78)`＋頂光漸層、`--adv-dialog-text` 文字），動作鈕以 `--adv-dialog-accent` 邊框維持主要操作辨識（同一機制、非另起一套）；返回鈕 `.item-panel-back` 既已為 `.choice-button.leave-choice`、本即同家族。
* **D2**：第三層 `--adv-dialog-bg` 由共用 `0.46` 覆寫為 `0.23`（對半），方塊更透、試穿透出；只降方塊容器底，選項／命令鈕保有自身 `~0.78` 底色維持可讀（分層）。
* **D3**：`.adv-scene[data-mode="refund"] .item-panel-empty` 改透明底、`border:0`、`height:auto`、`--adv-dialog-muted` 文字——退款無可退款項時不再有突兀白方塊，僅留輕量「No … treasures to refund.」提示、其後試穿可見（純 CSS、未動 [item-panel.js]／[main.js]）。
* **D4**：第三層 `.item-preview`／`.item-image` 白底由 `#fffaf0` 改 `rgba(255,255,255,0.2)`（20% 白），商品縮圖不再以實心白底壓住試穿。
* **D5**：寬版（≥821px）`.adv-princess`／`.adv-npc` 水平改 `33%`／`66%`（於既有 `@media (min-width:821px)` 區塊以同 calc 體例覆寫）；窄版維持既有 `25%`／`75%`。

### GATE §1（機器判定）

* `node --check`（`game-engine/main.js`／`game-engine/render/item-panel.js`）→ **OK**（本案未改 JS，D3 純 CSS）。
* `docLint docs/design.md`（sol）→ **PASS（0 違規）**；`repoLint -Path .` → **PASS（0 違規）**。
* headless selftest（system Chrome）：`map-avatar` → `passed:true, errors:[]`；`data-audit` → `passed:true`（`shopCount:11`、各類 10 件）；console／pageerror **0**（含 8 截圖 pass 期間）。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用。

### GATE §5（實機 visual-qa，computed style 為準＋截圖佐證，寬 1280＋窄 390）

| 項目 | 寬版 | 窄版 | 結果 |
|---|---|---|---|
| D2 方塊透明度 | `--adv-dialog-bg:0.23`、試穿princess透出 | 同 | ✅ 試穿清楚可見、文字（光暈描邊）仍可讀 |
| D1 命令/動作鈕 | shop「Buy …」/ refund「Refund 50」皆暗色玻璃＋accent 邊框 | 同 | ✅ 與 Chat 選項同家族、粉紅漸層消除 |
| D3 退款空清單 | 僅輕量 muted 提示、無白方塊（height 63px） | 同 | ✅ 試穿透出、保留「No … to refund.」 |
| D4 商品白底 | `.item-preview` `rgba(255,255,255,0.2)` | 同 | ✅ 縮圖仍可辨、試穿透出 |
| D5 角色水平 | princess 33% / npc 66% | princess 25% / npc 75% | ✅ 寬窄各自正確 |
| 回歸（Chat/Work scene） | 選項暗色玻璃、correct/wrong 不變 | 同 | ✅ 未受影響 |

* 三鏡頭：A（HMI 最低能力：選購時試穿可見、選項可讀，達成）＋B（兒童 UX：手機直向對比 OK、配色一致）＋C 逐頁（shop／refund-item／refund-empty／chat × 寬窄共 8 截圖審視）。`務必要修`：原 Shop/Refund 粉紅漸層與 Chat 暗色玻璃分散——**已修**（D1）；退款突兀白方塊——**已修**（D3）。其餘為可接受。
* **結論：可宣稱完成（GATE §1 全綠、§5 三鏡頭 must-fix 全修）。**
