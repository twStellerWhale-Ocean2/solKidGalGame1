# 設計note — issue #251 服裝類型簡化為整件 outfit 與配件並移除分件上下身

> 本檔為 #251 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] **spec#3-可把學習成果轉為看得見的外觀獎勵** 範圍內、並呼應 **spec#7-模組化擴充** 之**型別精簡重構**：承 #244 移除 `outerwear` 後續收斂服裝類別，移除分件上下身（`top`／`bottom`）型別、slot 與分類，整件衣著（原 `dress`）改名 `outfit`，原獨立帽子分類（`hats`／`headTop`）併入 `accessories` 顯示；既有 top／bottom 衣物退場移除，舊存檔以載入正規化遷移相容。**不新增 spec**——於 issue 階段經 USR 核准走 USR-gated ＜I＞ 補述（spec#3 補一句服裝類別精簡為髮型／整件 outfit／鞋／配件四類、移除分件上下身、dress 改名 outfit、帽子併入配件），並就 ＜II＞／＜III＞／＜IV＞ 作最小幅度具體化。docLint sol delta = 0（既有 8 項屬全 repo 一致之 setAct／runAct／solCase 變體詞彙基線，非本案引入；見 §6）。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **衣櫃分類**：[content-package/wardrobe/_shared/categories.js] 定 7 類顯示分類——`hair`／`hats`／`tops`／`bottoms`／`dresses`／`shoes`／`accessories`；type 映射 `tops←top`、`bottoms←bottom`、`dresses←dress`、`hats←headTop`、`accessories←[headSide, faceEyes, faceMask, neck, hand]`（檔頭註解已記「#244：移除 outerwear 類型」）。
* **紙娃娃與 slot 契約**：[content-package/wardrobe/_shared/rules.js] 之 `paperDollLayerOrder`（含 `dress`／`bottom`／`top` 三層）、`outfitSlots`（含 `top`／`bottom`／`dress`）、`wardrobeLayerBoundsByType`（含 `top`／`bottom`／`dress`／`headTop` 對位框）皆把分件與整件並列為各自獨立圖層／欄位／對位框。
* **型別宣告**：[game-engine/types.js] `OutfitState` typedef 含 `top`／`bottom`／`dress`／`headTop` 欄位。
* **內容**：`castle`／`rural`／`urban`／`wild`／`starter` 5 個 wardrobe manifest 內含 `type` 為 `top`／`bottom`／`dress`／`headTop` 之衣物素材（含各包 style.json 之相關引用）。
* **引用點**：[game-engine/render/paper-doll.js]、[game-engine/state/game-state.js]、[game-engine/state/default-state.js]、[game-engine/main.js]、[game-engine/testing/selftests.js] 及維護工具 [tool/defaults-tuner.js]／[tool/wardrobe-tuner.js]、樣式 [styles/mobile.css] 均引用上述型別字串。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的**：身上衣著分類收斂為四類核心——`hair`／`outfit`（原 `dress` 改名之整件全身衣著）／`shoes`／`accessories`（含原 `hats`）。
* **範圍**：服裝型別系統與衣櫃顯示分類、紙娃娃 slot／圖層／對位框、wardrobe 內容包、存檔載入正規化與相關自我測試；不動商店試穿／購買／退款動線、不動 #244 之公主房單一換裝入口與穿脫機制。
* **不變式**：① 移除 `top`／`bottom` 型別、slot、紙娃娃圖層與類別級對位框，且各內容包不殘留 `top`／`bottom` 衣物；② `dress` 識別字全鏈改名 `outfit`（型別／slot／對位框／內容／狀態鍵），無 `dress` 殘留；③ `headTop` 型別與圖層保留，僅顯示分類併入 `accessories`；④ 既有存檔曾穿之 `top`／`bottom` 載入時清除、舊 `dress` 欄位改讀為 `outfit`，不殘留懸空 slot 或殘影；⑤ 換裝層合成（body＋head、類別級 layer bounds、單品單層）與商店逛店行為不受影響。

## 3. 設計決策（plan 已落地 design.md，docLint delta = 0）

* **D1 spec 模型不增**：不新增 spec／solStory；本案落於既有 spec#3、solStory#3（換裝獎勵）／sysStory#3（承接換裝與商店）。＜I＞ spec#3 僅作 USR-gated 補述（服裝類別精簡為四類、移除分件上下身、dress→outfit、帽子併入配件、既有內容退場與存檔遷移），不改編號、不牽動下游 spec# traceability。
* **D2 ＜II.A(C)＞ solCase#3.2 具體化**：補明服裝類別精簡為髮型／整件 `outfit`／鞋／配件含帽四類、無分件上下身。
* **D3 ＜II.B(C)＞ sysCase#3.2／#3.4 具體化**：sysCase#3.2 補可裝備服裝型別精簡（移除 `top`／`bottom`、`dress`→`outfit`、配件含 `headTop`、`outfitSlots`／`paperDollLayerOrder`／layer bounds 同步、存檔載入遷移）；sysCase#3.4 將「衣物類型不含 outerwear」延伸補「不含分件 top／bottom（整件改稱 outfit）、衣櫃顯示分類精簡為四類、hats 併入配件」。
* **D4 ＜III.D＞ 新增 intTest#52**：驗證衣櫃顯示分類僅 `hair`／`outfit`／`shoes`／`accessories`（accessories types 含 `headTop`）、無內容包含 `top`／`bottom` 衣物、`outfitSlots`／`paperDollLayerOrder`／`wardrobeLayerBoundsByType` 不含 top／bottom 且以 `outfit` 取代 `dress`、舊存檔 top／bottom 清除且 dress→outfit 改鍵、整件 outfit 與配件穿戴對位合格——皆可回歸不變式。
* **D5 ＜IV.B＞ spec#3 成效具體化**：補服裝類型精簡四類合格率、`top`／`bottom` 退場不殘留檢出率（應為 0）、`dress`→`outfit` 改名無殘留率、帽子併入配件顯示正確率、既有存檔遷移正規化正確率。
* **D6 實作方向（留 code 落地，本note僅定方向）**：
  * `categories.js`：分類收斂為 `hair`／`outfit`（types `["outfit"]`）／`shoes`／`accessories`（types 增列 `headTop`）；移除 `hats`／`tops`／`bottoms`／`dresses` 分類，更新檔頭顯示順序註解。
  * `rules.js`：`paperDollLayerOrder` 移除 `top`／`bottom`、`dress`→`outfit`；`outfitSlots` 移除 `top`／`bottom`、`dress`→`outfit`；`wardrobeLayerBoundsByType` 移除 `top`／`bottom`、`dress` 鍵改 `outfit`（沿用原 dress 對位框）。
  * `types.js`：`OutfitState` 移除 `top`／`bottom`、`dress`→`outfit`。
  * 內容包（`castle`／`rural`／`urban`／`wild`／`starter` manifest 與 style.json）：移除 `type:"top"`／`type:"bottom"` 衣物；`type:"dress"`→`"outfit"`（icon `Dress`→`Outfit` 一併正名）。
  * 存檔遷移（`default-state.js`／`game-state.js` 之 outfit 正規化）：載入時刪除 `top`／`bottom` 鍵；若有舊 `dress` 值而無 `outfit` 則搬移為 `outfit`。
  * `paper-doll.js`／`main.js`／維護工具／`mobile.css`：清除 `top`／`bottom` 引用、`dress`→`outfit` 字串全鏈替換。
  * `selftests.js`：補 intTest#52 對應之自我測試（分類四類、無 top／bottom 內容、slot／layer／bounds 無 top／bottom 且 outfit 取代 dress、舊存檔遷移），並更新既有對 top／bottom／dress 之斷言。
  * 確切疊圖 z-index 重排與 CSS 連動由 code 以實機 visual-qa 落地。

## 4. 影響面與不變式

* **預期影響檔案（留 code 落地）**：[content-package/wardrobe/_shared/categories.js]、[content-package/wardrobe/_shared/rules.js]、[game-engine/types.js]、各 wardrobe manifest 與 style.json（castle／rural／urban／wild／starter）、[game-engine/state/default-state.js]、[game-engine/state/game-state.js]、[game-engine/render/paper-doll.js]、[game-engine/main.js]、[tool/defaults-tuner.js]、[tool/wardrobe-tuner.js]／[tool/wardrobe-tuner.html]、[styles/mobile.css]、[game-engine/testing/selftests.js]、[docs/design.md]（本案已改）、[docs/design-issue251.md]（本檔）、[README.md]、[VERSION]、[CHANGELOG.md]、[docs/test-summary.*]。
* **不變式**：同 §2 之 ①～⑤；另保留 #244 之公主房單一「換裝」入口、wear-only 穿脫切換與商店共用多欄貨架機制不受影響。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **議題條理自洽**：服裝既有整件 `dress`，分件上下身（`top`＋`bottom`）與之並行而增複雜度；對年幼玩家而言，整件 `outfit`＋配件之選擇更直觀，類別收斂自洽。「移除分件」等於放棄混搭，已由 USR 定調為產品取向（徹底型別重構＋既有內容退場移除）。
* **不衝擊現有功能**：改動集中於型別系統、內容包與存檔載入；風險集中於存檔相容與紙娃娃疊圖。以載入正規化遷移處理舊 top／bottom／dress 鍵，並以 selftests（save-load、scene-nav）回歸固化，不動商店試穿購買退款與換裝層合成。
* **不積技術債（一次到底）**：`dress`→`outfit` 須全鏈替換、不留新舊並存；移除分件後同步清除 slot／layer／bounds／typedef／內容殘留，並以 intTest#52 與 selftests 固化不變式，杜絕日後以特例補洞（比照 #244 以斷言固化）。
* **測試補強**：本案非 Bug 而為型別精簡；以 intTest#52 與 selftests 固化「分類僅四類、top／bottom 型別與素材不殘留、dress→outfit 無殘留、帽子併入配件、舊存檔遷移正確、紙娃娃疊圖與對位合格」之不變式。

## 6. docLint 基線說明（非本案引入）

* `pwsh docLint.ps1 -Path docs/design.md -Level sol` 於本案前後皆回報同樣 8 項違規（I01／I03 方案主旨命名、II08／III01 setWi-vs-setAct、II12 orgSop-vs-solCase），位於第 8／66–68／73／190／407 行——皆為本 repo 跨 250+ issue 一致採用之 game-app 變體詞彙（`設計主旨`／`設計目的`、`setAct`／`runAct`、`solCase`／`sysCase`），與通用 FORMAT.md／docLint 詞彙之系統性分歧，非 #251 引入。本案維持 **docLint delta = 0**（未新增任何違規，編修區段第 19／82／220／222／1035 附近／1356 附近均未觸發）。詞彙基線之收斂屬跨 issue 之 FORMAT／repo 對齊議題，超出本案範圍，另案處理。
