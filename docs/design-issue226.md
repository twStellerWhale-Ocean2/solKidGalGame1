# 設計note — issue #226 桌機寬視口固定比例畫面以模糊背景鋪底消除左右留白

> 本檔為 #226 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] **spec#2-可用角色陪伴與場景探索維持遊玩意願** 範圍內之**呈現精修**：桌機／寬視口下，固定比例內容（城堡與地區地圖、世界地圖、ADV 場景背景）置中後於內容區外露出的 letterbox 留白，改以該畫面背景藝術之模糊放大版鋪底，消除純色空白邊、維持風格一致沉浸。**不新增 spec**——spec#2 既有條文已含「桌機視口下完整、清楚、風格一致」與「不以模糊／frosted cover 替代應繪製區域」之意圖，本案於 issue 階段經 USR 核准走 USR-gated ＜I＞ 措辭澄清，補明「應繪製內容區（禁模糊）↔ 視口外 letterbox 留白（以模糊鋪底）」之分界，並就 ＜II＞／＜III＞／＜IV＞ 作最小幅度具體化。docLint sol = 0。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **整體外框**：[styles/base.css] `.app-shell` 寬 `min(1800px, calc(100vw - 16px))`、`margin: 0 auto` 置中；`.game-layout` 為 `272px 1fr`（左資訊欄＋右 `.view-stack`）。
* **固定比例 stage**：
  * 城堡／地區／世界地圖 [styles/map.css] `.map-stage`（含 `.castle-stage`／`.world-stage`）之 `> img` 以 `object-fit: fill` 鋪於 stage，stage 底為 `linear-gradient(180deg,#c9e8ef,#8ac8dc)` 淺藍漸層——即截圖所見之左右淺藍留白來源。
  * ADV 場景 [styles/adv.css] `.adv-scene` 為置中固定比例面板，其後 `.adv-backdrop`（`inset:0`）為深色半透明（`backdrop-filter: blur(1px)`）。
* **斷點**：[styles/mobile.css] 手機直向 `.app-shell` 收為 `100vw`、內容填滿寬度，原則上無左右留白；故本案範圍限**桌機／寬視口**出現 letterbox 時。
* **既有禁制（須語意分離）**：design.md sysCase#2.3 與 intTest#47 已禁「sceneArt renderer／場景 CSS 為個別場景新增 blur／frosted cover／上下延展遮蔽背景圖補版缺陷」——此禁制針對**遮蔽應繪製內容本身**，非本案之**內容區外** letterbox 鋪底。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的**：桌機／寬視口下，固定比例內容外的 letterbox 留白由純色／漸層空白改為「該畫面背景圖之模糊放大鋪底」，使空白邊成為風格一致的沉浸延伸。
* **範圍**：USR 確認套用**所有固定比例畫面**（城堡地圖、世界地圖、ADV 場景）；僅桌機／寬視口出現留白時生效，手機直向填滿不受影響。
* **邊界不變式**：模糊只施於**應繪製內容區之外**；內容區（地圖圖／場景藝術）仍維持完整、清楚、不模糊、不被遮蔽（spec#2／intTest#47 既有意圖不被弱化）。

## 3. 設計決策（plan 已落地 design.md，docLint sol = 0）

* **D1 spec 模型不增**：不新增 spec／solStory；本案落於既有 spec#2、solStory#2（地圖探索與角色陪伴）／sysStory#2。＜I＞ spec#2 僅作 USR-gated 措辭澄清（補 letterbox 鋪底分界），不改編號、不牽動下游 spec# traceability。
* **D2 ＜II.A(C)＞ 新增 solCase#2.3**：`[runAct自訂系統鋪底視口留白]`——固定比例內容於桌機／寬視口露出 letterbox 留白時，以該畫面背景之模糊放大版鋪滿留白、僅施於內容區外。
* **D3 ＜II.B(C)＞ 新增 sysCase#2.4 並澄清 sysCase#2.3**：sysCase#2.4 由 **[modShell模組]** 承接同一 runAct，提供**跨檢視共用之 stage 視口底機制**（單一背景圖來源＋共用 CSS 樣式常數，置內容層下、`pointer-events:none`、不攔截 hotspot／marker／拖曳）；sysCase#2.3 補一句點明「個別場景補版禁制 ↔ 共用 letterbox 鋪底」語意分離。
* **D4 ＜III.D＞ 新增 intTest#50**：桌機寬視口三畫面留白以模糊背景鋪滿、內容區仍清楚不被遮蔽、鋪底不攔截互動、手機直向無破版、地圖與 ADV 共用單一機制——可回歸不變式。
* **D5 ＜III.E／IV.B＞ 最小具體化**：docProgTest#02 補 productReadme 須說明桌機留白模糊鋪底（與場景內容補版區分）；spec#2 成效追蹤補 letterbox 鋪底生效率、內容區未被遮蔽合格率、地圖鋪底未攔截互動合格率。
* **D6 實作方向（留 code 依 visual-qa 落地，本note僅定方向）**：傾向以**單一共用 class／CSS 變數**（如 stage 容器設 `--stage-backdrop: url(...)`）由 [modMap模組]／[modScene模組] 切換檢視時寫入當前背景圖；共用 stage 偽元素（`::before`）以 `background: var(--stage-backdrop) center/cover; filter: blur(...) brightness(...); inset:0; z-index` 低於內容、`pointer-events:none`。模糊半徑、放大、暗化為**共用 CSS 常數單一事實**、不逐畫面硬寫；確切數值由 code 以桌機＋手機直向實機 visual-qa 校準。低階裝置效能降級（降模糊或停用）由 code 評估。

## 4. 影響面與不變式

* **預期影響檔案（留 code 落地）**：[styles/base.css]／[styles/map.css]／[styles/adv.css]（共用 stage backdrop 樣式與各 stage 套用）、[styles/mobile.css]（窄版確認無破版）；[index.html] 或 [game-engine] 檢視切換處（寫入當前背景圖至共用 CSS 變數）；[docs/design.md]（本案已改）；[docs/design-issue226.md]（本檔）；[README.md]（產品手冊補述）。
* **不變式**：① 內容區（地圖圖／場景藝術）不被模糊或遮蔽，spec#2／intTest#47 場景內容補版禁制不被弱化；② 鋪底層位內容層之下且 `pointer-events:none`，不改變 hotspot／marker 定位與地圖拖曳命中；③ 地圖與 ADV 共用單一鋪底機制與樣式常數，不逐畫面各自硬寫（避免疊床架屋）；④ 手機直向內容填滿、留白不顯著時鋪底自然不可見、不留破版殘影。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **與 spec#2「禁模糊」表面矛盾之釐清**：以 ＜I＞ 措辭澄清＋sysCase#2.3／#2.4 語意分離釘定「應繪製內容區（禁模糊）↔ 視口外 letterbox 留白（以模糊鋪底）」，本案模糊不碰內容區，故不違反 spec#2／intTest#47。
* **不衝擊地圖互動**：鋪底置內容層下且 `pointer-events:none`，intTest#50 步驟 4 回歸驗證地圖 hotspot／marker 點擊與拖曳不受影響。
* **不積技術債（單一機制）**：地圖與 ADV 共用同一 stage backdrop 機制與樣式常數，背景圖來源單一事實，新增 area／場景沿用同機制、不需另設鋪底常數（呼應 spec#7 模組化）。
* **安全可回歸**：以 intTest#50 固化「留白鋪底 ↔ 內容清楚 ↔ 不攔截互動 ↔ 手機不破版 ↔ 單一機制」不變式，杜絕日後再以逐畫面特例補留白。
