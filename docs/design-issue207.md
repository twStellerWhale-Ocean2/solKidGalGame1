# 設計note — issue #207 公主立繪改用簡潔深灰立體投影、去除詭異光暈與糊化腳底陰影

> 本檔為 #207 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] **spec#12-可依透明角色輪廓強化角色立繪圖地分離** 範圍內之**視覺呈現收斂**：ADV 場景公主立繪（`.adv-doll`／紙娃娃 surface）之常態陰影由現行多層柔邊投影改呈「簡潔深灰立體投影」，去除被讀為光暈之大範圍發光與糊化腳底陰影，並維持「常態描邊／陰影 ↔ 試穿互動光暈」語意分離。design.md ＜I＞ spec#12 **不增不改**（USR 於 issue 階段核准「落於既有 spec#12、不新增 spec#」）；plan 僅就既有 ＜II＞ sysCase#12.2 與 ＜III＞ intTest#48 作**最小幅度具體化**補述，不新增 spec／solStory／solCase 結構。docLint sol = 0。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **ADV 公主立繪＝紙娃娃合成立繪**：[index.html] `.adv-portraits` 內 `.adv-princess > .paper-doll.adv-doll`（`data-doll="adv"`）。常態描邊／陰影以 `--character-silhouette-filter` 施於合成 `.paper-doll-stage`（[styles/paper-doll.css:14-18]）。
* **ADV 立繪 surface tier 之常態投影（肇因主體）**：[styles/paper-doll.css:32-39] `.adv-doll` 設三層堆疊投影——
  * `drop-shadow(0 0 1px rgba(64,43,53,.58))`：緊貼深色描邊（圖地分離主力，宜保留）。
  * `drop-shadow(0 2px 3px rgba(58,37,46,.34))`：近身接觸投影。
  * `drop-shadow(0 16px 22px rgba(58,37,46,.22))`：大範圍下偏柔邊投影——在童話背景上易被讀為「腳底一片糊化陰影」，多層疊加亦使輪廓邊緣帶發光感。
* **互動狀態光暈（須語意分離、不可誤改）**：[styles/paper-doll.css:92-95] `.adv-doll.try-on-active` 另施暖黃 `drop-shadow(0 0 14px rgba(255,214,80,.62)) drop-shadow(0 0 22px rgba(255,247,181,.28))`，為換裝試穿提示光暈，僅試穿狀態出現。
* **design.md 既有模型（spec#12 已完整成形）**：＜I＞ spec#12；＜II＞ solStory#15／solCase#15.1、sysStory#12／sysCase#12.1（modScene：ADV NPC 立繪）／sysCase#12.2（modWardrobe：公主紙娃娃／地圖 token／頭胸照）；＜III＞ intTest#48／docProgTest#15／e2eTest#15；＜IV.B＞ spec#12 成效追蹤。其中 ADV 公主立繪屬 sysCase#12.2（紙娃娃 surface）。spec#12 既有條文已要求「不得以大範圍糊化發光取代角色本體輪廓辨識」「與試穿提示等互動狀態光暈維持語意分離」——本案使實作更貼合此既有意圖、並補上「簡潔深灰立體投影」之觀感取向。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **目的**：ADV 公主立繪常態呈現由「多層柔邊投影＋被讀為光暈之發光感」收斂為單一、簡潔、方向明確的深灰立體投影（drop shadow），維持本體輪廓清晰、去除大範圍糊化發光與突兀腳底陰影（使用者語：「改成簡單圖片深灰陰影」）。
* **不變式**：維持 spec#12「常態描邊／陰影 ↔ 試穿互動光暈」語意分離——本案只調常態 ADV 立繪 surface，`.try-on-active` 暖黃提示光暈之既有語意不被誤改。
* **範圍界定**：scope 為 ADV 立繪 surface tier（以公主為主，code 須確保同場景 NPC 立繪接地投影觀感一致）；不動紙娃娃 rig、wardrobe layer 對位、其他 surface（地圖 token／頭胸照）之既有投影分級。**不新增產品 spec#。**

## 3. 設計決策（plan 已落地 design.md，docLint sol = 0）

* **D1 不動 spec 模型**：design.md ＜I＞ spec#1–#12 與 ＜II＞ solStory／solCase 結構一律不增不改。本案為 spec#12 既有意圖之實作收斂＋觀感具體化，落於既有 sysCase#12.2／intTest#48。
* **D2 ＜II＞ sysCase#12.2 具體化**：於 modWardrobe 輪廓規則補一句——「ADV 場景之公主立繪 surface 常態陰影須呈簡潔深灰立體投影（以單一方向性接地投影為主、保留貼合輪廓描邊），避免多層柔邊投影疊加被讀為角色光暈或糊化腳底陰影」。屬同一 `runAct自訂系統渲染角色輪廓` 之 surface 約束細化，非新行為。
* **D3 ＜III＞ intTest#48 預期結果收斂**：預期結果 #2 由「自然景深陰影」改為「簡潔深灰立體投影」，並加「ADV 公主立繪不呈現多層柔邊疊加而被讀為光暈或糊化腳底陰影」，使本案成為可回歸檢核之不變式。
* **D4 實作方向（留 code 依 visual-qa 落地，本note僅定方向）**：傾向收斂 `.adv-doll` 之 `--character-silhouette-filter`——保留緊貼描邊層＋單層方向性深灰立體投影，移除或大幅收束最外層 `0 16px 22px` 大柔邊層；確切 offset／blur／灰階色值由 code 以手機直向＋桌機實機 visual-qa 校準。`.try-on-active` 暖黃光暈不動。
* **D5 替代方案（次選，僅當純 `drop-shadow` 難達觀感時評估）**：以單張深灰接地陰影底圖／橢圓影替代 CSS 投影；惟須登記資產尺寸與檔重於資產標準表（spec#7）、採透明 raster，不得以未登記過大圖檔拖慢純靜態載入或以特例素材偽裝。預設仍以 D4 之 CSS 收斂為主。

## 4. 影響面與不變式

* **預期影響檔案**：[styles/paper-doll.css]（`.adv-doll` 常態 `--character-silhouette-filter` 收斂）；視 code visual-qa 結果可能含 [styles/adv.css]（NPC 立繪接地投影一致性）／[styles/mobile.css]（窄版斷點一致性）；[docs/design.md]（本案已改 sysCase#12.2／intTest#48）；[docs/design-issue207.md]（本檔）。
* **不變式**：① spec#12 ＜I＞ 條文不變；② `.adv-doll.try-on-active` 暖黃試穿光暈僅試穿狀態出現、不被常態調校覆蓋；③ 共用 `--character-silhouette-filter` 預設與其他 surface（地圖 token／頭胸照／非 ADV 紙娃娃）之既有投影分級不被外溢牽動；④ 投影續以 surface 級 token 集中管理、不在 `.adv-doll` 外另疊一次性 inline filter。
* **產品 README.md 不變**：README spec#12 描述已涵蓋「角色以透明輪廓描邊與自然陰影保持可辨識、試穿光暈屬互動狀態」之意圖，本案為同一意圖下之觀感收斂、無新玩家可見能力，主流程不更動。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **觀感基準明確化**：「光暈／腳底陰影／立體陰影」均為觀感語；本案以 intTest#48 預期結果＋手機直向與桌機實機 visual-qa 為共同基準釘定「簡潔深灰立體投影、非多層糊化柔邊」，避免理解分歧。
* **不外溢其他 surface**：限定調 `.adv-doll`（ADV 立繪 surface tier），不動共用預設與地圖 token／頭胸照分級，避免一次調校牽動全站角色投影。
* **不積技術債**：就既有 surface 級 token（`--character-silhouette-filter`）收斂，不以一次性 inline filter／外掛陰影 div 硬補；若改採陰影底圖則納入 spec#7 資產標準。
* **安全可回歸**：以 intTest#48（含試穿狀態對照）固化「常態簡潔深灰立體投影 ↔ 試穿互動光暈分離」不變式，杜絕日後 surface 投影調整再度誤洩光暈或糊化腳底陰影。
