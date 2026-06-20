# 設計note — issue #195 衣物統一單品單層、移除 outfitSet 套裝與 outer 雙層槽

> 本檔為 #195 之設計note 與 GATE 驗證紀錄（沿 #101／#150／#166／#176／#180 焦點變更慣例：GATE 結果記於本節與 PR；test-summary.pdf 待 USR 裁決）。本案確立**單品單層原則**——每件 wardrobe item 至多對應一個外觀層。design.md 已於 plan 階段回修（spec#3 移除「outfit set」列舉、＜II＞sysCase#3.2／#5.3 明文單品單層、＜III＞intTest#08 補不變式、＜IV＞spec#3 補殘留檢出觀察項；docLint sol 0），對應既有 **spec#3**（可把學習成果轉為看得見的外觀獎勵，solStory#3 換裝獎勵）。

## 1. 現況量測（以產物為準，現行 main 已 ff 同步）

* **outfitSet（套裝 bundle）**：[item-helpers.js] `outfitSet()` 產出 `type:"outfitSet"`、`layers:[]`、靠 `equips` 一次裝備多個既有單品；本身無自有渲染層、另帶一張 baked `set-*` 縮圖。10 套僅售 Dress Boutique（[urban-dress-boutique/manifest.js]）；分類 [categories.js] `outfitSets`、衣櫃鈕 [scene-actions.js]「Outfit Sets」(✨)、商店旗標 [areas/urban/manifest.js] `shopCategories:["dresses","outfitSets"]`。引擎散布近十處 `type==="outfitSet"` 特例（[main.js] 裝備判定／穿脫／試穿／購買解鎖／來源標記／退款）＋專屬 `state.bundleUnlocks`（[default-state.js]／[game-state.js] normalizeBundleUnlocks）。
* **outer 雙槽**：equip 欄位 `outer` 對應**兩個** render 槽 `outerBack`(z1)＋`outerFront`(z5)（[rules.js] paperDollLayerOrder、[paper-doll.css]），保留單件跨兩層能力；惟現役 outer 全為單層 `slot:"outerFront"`、`outerBack` 零內容；且因預設 slot=type="outer" 非 render 槽，每件須手填 slot（footgun）。
* **單品單層稽核**：其餘 11 類衣物皆 1 件→同名單一槽（1:1 ✅）；starter 五件 `layers:[]`（baked 進 base、相容紀錄、非違規）；room 為背景非身體層。唯 outfitSet 與 outer 違反單品單層。
* **既有測試**：`?selftest=data-audit` 對 outfitSet／bundleUnlocks／outerBack 零斷言。data-audit 進場即紅於 `outerwear has 9 paid items`（規則每類 ≥10）——肇因前 commit `6006335` 故意刪除醜的螢光綠 roseCardigan（10→9），非本案造成。

## 2. 設計命題（USR 目標）

* **確立單品單層原則**：每件 wardrobe item 至多對應一個 render 圖層槽。
* **目的①** 移除 outfitSet 套裝 bundle 機制（分類／動作鈕／boutique 商品＋縮圖／引擎特例／bundleUnlocks 狀態）。
* **目的②** 收斂 outer 為單一圖層（移除未用的 outerBack 槽、outerFront 更名單一 `outer` 槽）；**保留現役 outerwear 服裝與既得進度**。
* 範圍界定：移除對象為 **bundle 機制與 outer 雙層設計**，非其綁定之單品、非 outerwear 服裝本身；單品衣物、玩家既得單品與穿搭不變。

## 3. 設計決策（已落地）

* **D1 移除 outfitSet bundle**：刪 `outfitSets` 分類、`outfitSet()` 工廠、衣櫃「Outfit Sets」動作鈕、boutique 10 套商品與 `set-*` 縮圖、[areas/urban] boutique 旗標收斂為 `["dresses"]`＋文案；清 [main.js] 全部 `type==="outfitSet"` 特例（isItemEquipped／equipOutfitItem／unequipOutfitItem／tryOnFeedbackText／buyItemInAdv／purchaseUnlockIds／recordPurchaseSources／bundlePurchaseSource／refundRemovalIds 簡化為單品單一路徑）與 `outfitSets` 空分類提示；移除 `state.bundleUnlocks`（default-state＋normalizeBundleUnlocks）。
* **D2 收斂 outer 單層**：[rules.js] paperDollLayerOrder 移除 `outerBack`、`outerFront`→單一 `outer`；[paper-doll.css] 移除 `.paper-doll-layer-outerBack`、`outerFront`→`.paper-doll-layer-outer`(z5)；9 件 outer 改用預設 type slot（消除手填 footgun）；[wardrobe-tuner.js] 移除 outfitSet 分支。
* **D3 舊存檔遷移**（[game-state.js]）：`owned` 過濾失效 id（丟棄殘留 set id、保既得單品）；`delete merged.bundleUnlocks`（丟棄 spread 進來的舊欄位）；normalizePurchaseStoreIds 丟棄 `bundle:<id>` 來源（單品退回以自身 storeId 退款）。
* **D4 回歸守門**（[selftests.js] data-audit）：新增單品單層不變式——每件 item `layers` ≤1、無 `type==="outfitSet"`、無 `slot==="outerBack"/"outerFront"`。
* **D5 補足 outerwear≥10（GATE 既有缺口）**：依 USR 指示復原 roseCardigan，並把螢光綠**改色為柔玫瑰**——canvas 修圖對有彩度像素 hue→346°、降彩度與亮度上限，保留白色領子／鈕扣／滾邊與透明底（產出新 raster、非 runtime 濾鏡，符 spec#3／#7）；單品單層、content-box 復原原定位。outerwear 回到 10。

## 4. GATE §1（機器判定，全綠）

* `node --check`：15 個改動 JS（main.js／game-state.js／default-state.js／selftests.js／scene-actions.js／paper-doll.js／item-helpers.js／rules.js／categories.js／asset-content-box.generated.js／4 manifests／wardrobe-tuner.js）→ 全 OK。
* `docLint docs/design.md`（sol）→ **0**；`repoLint .` → **0**。
* headless selftest（chromium，本機 server `:4180` 服務本分支檔案）全 PASS、console **0 error**：
  * **`data-audit`**：`passed:true`、errors `[]`——各類 10（outerwear 10）、`outfitSets` 分類移除、**單品單層不變式通過**。
  * **回歸**：`save-load`（存檔遷移正常、coins 一致）、`monkey`（300 步、0 err）→ `passed:true`。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用（STACK techStackStaticWeb）。

## 5. GATE §5（業界水準審查＋視覺證據）

> 本增量異動 UI（移除衣櫃分頁、商店分類、outer 渲染），以實機 DOM 量測＋截圖佐證。

* **衣櫃動作列**：移除「Outfit Sets」(✨) 分頁——DOM 驗 `hasOutfitSetsText=false`，餘 8 類分頁（Hair／Tops／Bottoms／Dresses／Outerwear／Shoes／Hats／Accessories）完整。
* **Dress Boutique 商店分類**：收斂為 `["dresses"]`（boutique 保留 7 件洋裝，dresses 全域仍 10）。
* **outer 渲染**：買裝 mintCardigan／roseCardigan → 紙娃娃 layer 為 `[paper-doll-layer-base, paper-doll-layer-outer]`（**單一 outer 層**，非前後雙層）；equip/refund 流程無 console error。
* **roseCardigan 改色**：螢光綠 → 柔玫瑰粉；實機公主（Lumi）穿著呈柔玫瑰、白領／鈕扣保留、定位正確（同 mint-cardigan content-box），較原螢光綠顯著改善。
* **鏡頭 A／B**：①移除整套 bundle 後購買／裝備／試穿／退款回歸單品單一路徑、無殘留特例；②outer 單層渲染不退化既有穿戴；③boutique 去 outfitSets 後分類與文案自洽；④舊存檔載入既得單品不流失（save-load 綠）；⑤單品單層不變式機判守門——逐項以 selftest／DOM／截圖坐實。
* **分級**：`務必要修` **0**；`可以接受`——roseCardigan 採 canvas 修圖快速改色（非 GPT 重繪），色彩柔和已達可用；若日後要更精緻可另案重繪（已於 spawn task 記錄外套素材精修方向）。
* **結論：可宣稱完成。**

## 6. 交付物與審查點

* **交付物**：程式（25＋4 檔，commit `34fda70`／`00daff0`，Draft→正式 PR #200）＋ design.md 回修（plan）＋ 本設計note。
* **test-summary.pdf**：沿 #101／#150／#166／#176 焦點變更慣例，本檔即 GATE 報告；是否另產 A5 直向 [docs/test-summary.pdf]（逐頁≥10 發現）**待 USR 裁決**。QA 截圖（衣櫃／商店／rose-doll）為暫存產物、不作交付物。
