# 設計note — issue #244 公主房換裝合併至商店衣櫃機制簡併專用表單

> 本檔為 #244 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] **spec#3-可把學習成果轉為看得見的外觀獎勵** 範圍內、並呼應 **spec#7-模組化重用** 之**機制簡併**：公主房第一層昔日以攤平之各分類入口（Hair／Tops／…／Accessories）構成**專用表單**進入換裝，與商店「單鈕開右側衣櫃面板」之動線並存兩套；本案改為公主房第一層提供單一「換裝」入口（深粉紅）開啟與商店同一套 item-panel 衣櫃面板，並就已擁有衣物提供 wear-only 穿脫切換（穿上↔脫下、不含試穿與購買），消除兩套進入動線之重工與技術債。**不新增 spec**——於 issue 階段經 USR 核准走 USR-gated ＜I＞ 補述（spec#3 補一句公主房換裝沿用商店同一面板機制、wear-only、不另設專用表單），並就 ＜II＞／＜III＞／＜IV＞ 作最小幅度具體化。docLint sol = 0。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **第一層場景選單**：[game-engine/flow/scene-actions.js] `firstLayerActionsFor()` 於 `hotspot.kind === "room"` 時回傳 `ROOM_ACTIONS`——8 個 `wardrobeAction`（Hair／Tops／Bottoms／Dresses／Outerwear／Shoes／Hats／Accessories，`handlerKey: "wardrobe"` 各帶 `category`）＋ `leaveAction()`。即公主房第一層即攤開逐分類入口之**專用表單**。
* **商店動線對照**：帶 `shopCategories` 之 hotspot（如 [castleSeamstress]）第一層為單一「Shop」鈕（`handlerKey: "shop"`）開啟右側 item-panel。
* **共用面板本就存在**：[game-engine/render/item-panel.js] `renderItemDetailPanel({ mode })` 為 `mode`-driven 共用元件；[game-engine/main.js] `renderWardrobeDetail()` 以 `mode: "wardrobe"` 渲染，`renderAdvShop()` 以 `mode: "shop"` 渲染——**右側面板已是同一套機制**，差異只在「第一層進入方式」與「動作鈕行為」。
* **衣櫃面板已具分類分頁**：`renderWardrobeDetail()` 內 `renderCategoryTabs(...)` 已提供面板內切換類別，故第一層 8 個分類入口為**冗餘**。
* **動作鈕無穿脫切換**：`wardrobePanelAction()` 對已穿戴項回傳 `disabled: true`（label「Wearing」），`equipWardrobePreview()` 只穿不脫——**衣櫃無法在面板內脫下**，與本案要求之穿脫 toggle 不符。
* **dispatch**：`handleFirstLayerSceneAction()` 之 `case "wardrobe": openWardrobeDetail(action.category)`、`case "shop": openShopDetail(hotspot)`、`case "leave": leaveScene(hotspot)`。`leaveScene()` 於 `kind==="room"` 回 `openArea("castle")`。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的**：公主房換裝改用單一「換裝」入口（深粉紅、行為如 Shop 鈕）開啟右側衣櫃面板，與商店衣櫃機制**同一套、不另做重工**；面板僅供「穿上」（不含試穿與購買），動作鈕為穿脫切換（按下穿上後字改「脫下」、再按即脫下）；公主房保留與其他場合一致之 Leave 鈕。
* **範圍**：僅公主房（`kind:"room"`）第一層進入動線與其衣櫃面板動作鈕；商店逛店（試穿、購買、退款）行為不變。
* **不變式**：① 衣櫃面板與商店逛店共用同一 item-panel 機制、僅以 `mode` 區分，不為公主房另立 wear-only 特例分支；② 公主房面板不出現試穿與購買鈕；③ 商店逛店之試穿、購買、退款不受影響。

## 3. 設計決策（plan 已落地 design.md，docLint sol = 0）

* **D1 spec 模型不增**：不新增 spec／solStory；本案落於既有 spec#3、solStory#3（換裝獎勵）／sysStory#3（承接換裝與商店）。＜I＞ spec#3 僅作 USR-gated 補述（公主房換裝沿用商店同一面板、wear-only、不另設專用表單），不改編號、不牽動下游 spec# traceability。
* **D2 ＜II.A(C)＞ solCase#3.2 具體化**：補明公主房（衣櫃）以單一「換裝」入口、wear-only 穿脫切換，與商店試穿購買共用同一面板機制、不另設專用分類表單。
* **D3 ＜II.B(C)＞ 新增 sysCase#3.4**：[modWardrobe模組] 以與商店逛店共用之同一 item-panel 機制（`mode wardrobe`／`shop` 區分）渲染公主房衣櫃面板，提供穿脫切換（穿上↔脫下、wear-only、不含試穿購買），不另立特例分支；公主房第一層以單一「換裝」入口（深粉紅）開啟此面板，取代逐分類攤平之專用表單。
* **D4 ＜III.D＞ 新增 intTest#51**：公主房第一層僅單一「換裝」入口＋Leave（無逐分類專用表單）、換裝開啟之衣櫃面板與商店逛店為同一機制且不含試穿購買鈕、已擁有衣物穿脫切換（穿上↔脫下不殘留）、返回與 Leave 動線一致、商店逛店試穿購買退款不受影響——可回歸不變式。
* **D5 ＜IV.B＞ spec#3 成效具體化**：補公主房換裝入口簡併合格率、wear-only 穿脫切換正確率、與商店共用機制互不干擾合格率。
* **D6 實作方向（留 code 落地，本note僅定方向）**：
  * `scene-actions.js`：`ROOM_ACTIONS` 由 8 個 `wardrobeAction` 收斂為單一「換裝」入口動作（`handlerKey: "wardrobe"`、無 `category`，由 `openWardrobeDetail` 取預設類別）＋ `leaveAction()`；移除冗餘逐分類入口。
  * `main.js`：`wardrobePanelAction()` 對已穿戴項改回傳「脫下」label、`disabled: false`；`equipWardrobePreview()` 改為穿脫 toggle（已穿戴則 `unequipOutfitItem`、否則 `equipOutfitItem`，沿用既有 `toggleEquip` 規則），更新 feedback 文案。room 型擺設（`item.type === "room"`）維持原「Place／Placed」行為、不納入 wear-only toggle。
  * 樣式：為「換裝」入口鈕加深粉紅（deep pink）變體 class，沿用 `.choice-button` 基底、不另造一套按鈕；確切色值與穿脫字樣由 code 以實機 visual-qa 落地。

## 4. 影響面與不變式

* **預期影響檔案（留 code 落地）**：[game-engine/flow/scene-actions.js]（`ROOM_ACTIONS` 收斂為單一換裝入口）、[game-engine/main.js]（`wardrobePanelAction`／`equipWardrobePreview` 改為穿脫 toggle、feedback 文案）、樣式檔（深粉紅入口鈕變體，如 [styles/main.css] 或 [styles/wardrobe.css]）、[game-engine/testing/selftests.js]（補單一入口與穿脫 toggle 自我測試）、[docs/design.md]（本案已改）、[docs/design-issue244.md]（本檔）、[README.md]（產品手冊補述）。
* **不變式**：① 衣櫃面板與商店逛店共用同一 item-panel 機制、僅以 `mode` 區分，不新增 wear-only 特例渲染路徑；② 公主房第一層只剩單一「換裝」入口（深粉紅）＋ Leave、無逐分類專用表單殘留；③ 公主房面板不出現試穿與購買鈕，動作鈕為穿脫 toggle；④ 商店逛店之試穿、購買、退款與既有換裝層合成（body＋head、類別級 layer bounds、單品單層）皆不受影響。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **議題條理自洽**：公主房為「換穿已擁有衣物」、商店為「購買」，wear-only 與 try-on＋buy 本應分流；單一「換裝」入口不致與商店逛店混淆，且衣櫃面板既有分類分頁已可切換類別，第一層 8 個分類入口屬冗餘可收斂。
* **不衝擊現有功能**：item-panel 既具 `shop`／`wardrobe` 雙模式，本案僅改公主房第一層進入與衣櫃動作鈕，不動商店渲染路徑；intTest#51 步驟 5 回歸驗證商店試穿、購買、退款不受影響。
* **不積技術債（單一機制）**：以面板既有 `mode` 承接、移除 `ROOM_ACTIONS` 攤平專用表單與「只穿不脫」殘缺，消除兩套進入動線之重工；新增衣物分類沿用同一面板與類別組態、不需另建公主房入口（呼應 spec#7）。
* **測試補強**：本案非 Bug 而為機制簡併；以 intTest#51 與 selftests 固化「單一換裝入口、wear-only 穿脫切換、Leave 一致、商店逛店不受影響」之不變式，杜絕日後再以公主房特例分支補洞。

## 6. 修正紀錄（v0.53.2，承 USR 回饋）

> 上方 D3／D6 與 §4 為 plan 初版方向，於 v0.53.1（PR #247）實作時**判斷錯誤**，經 USR 指正後於 v0.53.2（fix）更正。本節為現行正解，與 design.md sysCase#3.4／intTest#51 一致；上文方向段保留為歷程，不再為現行依據。

* **錯誤 1（機制）**：v0.53.1 公主房沿用的是 repo **舊版**單類別分頁衣櫃 `renderWardrobeDetail`，而商店現行已革新為**多欄貨架** `renderAdvShop`；兩者實為兩套不同機制，等於保留了議題要消除的重工。**更正**：刪除舊單類別分頁版型，`renderWardrobeDetail` 改為薄包裝呼叫 `renderAdvShop(preserveFocus, { closet: true })`；`renderAdvShop` 以 `closet` 參數同時服務商店（未擁有／試穿購買）與公主房衣櫃（已擁有／wear-only 穿脫），**真正單一機制、單一函式**。新增 `ownedWardrobeItemsFor`／`ownedWardrobeCategories`；移除死碼 `wardrobeEmptyText`。
* **錯誤 2（深粉紅位置）**：v0.53.1 把深粉紅誤上在**場景選單的「換裝」入口鈕**。**更正**：入口鈕移除特別顏色、沿用一般場景選單樣式（還原 `adv-controls.js` variant、移除 `.change-outfit-choice` 入口色）；深粉紅改上在**衣櫃內每件衣物的「穿上／脫下」動作鈕**（`styles/mobile.css` `.adv-scene[data-mode="wardrobe"] .item-panel-action`，border `#ad1457`），與商店購買鈕之暗色玻璃家族區辨。
* **實際影響檔案**：[game-engine/main.js]（`renderAdvShop` closet 化、`renderWardrobeDetail` 薄包裝、owned 助手、移除 `wardrobeEmptyText`、入口 variant 移除）、[game-engine/flow/scene-actions.js]（單一換裝入口，沿用）、[game-engine/flow/adv-controls.js]（還原 variant）、[styles/mobile.css]（深粉紅移至穿脫動作鈕、移除入口色）、[game-engine/testing/selftests.js]（scene-nav 改驗多欄貨架＋穿脫鈕深粉紅＋入口非深粉紅）、[docs/design.md]（sysCase#3.4／intTest#51 更正）、[README.md]、[VERSION]（0.53.1→0.53.2 fix）、[docs/test-summary.pdf]。
* **回歸驗證**：scene-nav（含更正斷言）PASS、monkey(300) PASS、save-load PASS；以 LuminaraTest 開商店確認仍為 5 欄貨架、試穿鈕在、購買鈕非深粉紅（closet 變更不波及商店）。
