# 設計note — issue #166 地圖以方形圖示區分商店地點、可逛店場景一眼可辨

> 本檔為 2plan 設計note。**初判 Option A**：本項為既有方案下之地圖地點辨識精修，於 `docs/design.md` ＜I／II＞無須增刪修改 **spec# 編號**；呈現決策由本 note 承載，確切方形樣式（圓角・尺寸・與 `portal` 形狀之區別與優先序・icon 內襯）與寬窄版值留 3code 以實機 visual-qa（寬＋窄、四區含 castle）定案。意旨對應既有 **spec#2**（角色陪伴與場景探索維持遊玩意願——地圖地點辨識／沉浸）＋ **spec#11**（各場景分流逛店／聊天／打工——可逛店場景之可辨識性），並受 **spec#7**（模組化擴充：規則須對任何新商店自動套用）約束。⚠️ 審查點見 §4：design.md 既未對任何 marker 形狀（含既有 `portal` 門形）設條文，本案維持同一慣例不另起；USR 可選擇是否對 sysCase（地圖渲染）作 USR-gated 輕修，預設維持 Option A。

## 1. 現況量測（以產物為準）

### 商店辨識資料源（已齊備、無須改）

* 場景「有販售（可逛店）」之既定旗標＝`isShopHotspot(hotspot)`（[game-engine/flow/scene-actions.js] L38，#138 引進）：`Array.isArray(hotspot.shopCategories) && hotspot.shopCategories.length > 0`；已取代舊 `kind:"shop"` 特例（[game-engine/testing/selftests.js] L969 反向把關「不得殘留 `kind:"shop"`」）。
* 全方案共 **11 個商店地點**（皆具非空 `shopCategories`）：
  * urban 5：`boutique`／`hairSalon`／`tailorStudio`／`shoeShop`／`accessoryShop`。
  * wild 2：`fairyAtelier`／`dwarfCottage`。
  * rural 2：`workwearStall`／`fieldCobbler`。
  * castle 2：`royalCloakRoom`／`castleSeamstress`。
* 同一旗標已被側欄目的地清單採用：`renderHotspots` 之目的地卡片於 `isShopHotspot` 時加 `shop` class（[game-engine/main.js] L1711），對應 [styles/map.css] L309 `.destination-card.shop`（邊色）；惟此為**側欄卡片**、非地圖 marker 形狀。

### 地圖 marker 形狀現況（癥結所在）

* 地圖地點 marker＝`.hotspot`（[styles/map.css] L115）：預設 `border-radius:50%`＝**圓形**，42×42、內含 `.hotspot-icon`（L150，亦 `border-radius:50%`）承載 emoji。
* 既有唯一非圓變體＝`.hotspot.portal`（[styles/map.css] L175，城門／傳送）：圓角門形（`border-radius:12px 12px 16px 16px`＋門柱 `::before`）。即「**以 marker 形狀編碼地點類別**」之既有先例（但此先例僅落在 CSS／renderer，design.md 未對之設條文）。
* **無任何 `.hotspot.shop` 形狀規則**：CSS 內與地圖 marker 相關之 `shop` 僅側欄 `.destination-card.shop`（L309），**不影響地圖 marker 形狀**。故 11 個商店 marker 目前皆呈圓形、與一般地點無外觀區隔。

### renderer 現況（兩處不一致——半完成 hook）

* **區域地圖** `renderHotspots()`（[game-engine/main.js] L1846，服務 urban／rural／wild）className（L1855）＝`` `map-marker hotspot${isShopHotspot(hotspot) ? " shop" : ""}${isPortal ? " portal" : ""}` ``——**已掛** `shop` class，但因無對應 CSS 形狀規則，該 class 目前為**視覺無作用之空 class**；9 個區域商店 marker 仍呈圓形。
* **城堡內部地圖** `renderCastleMap()`（[game-engine/main.js] L1372，服務 castle）className（L1385）**完全未加** `shop` class（只處理 `castle-marker`／`nearby`／`disabled`／`portal`）；castle 2 商店連空 class 都沒有。
* **世界地圖** `renderWorldMap()`（[game-engine/main.js] L1517）僅渲染地區入口（全 `portal`），不直接顯示商店地點，**不在本案範圍**。
* `isPortal` 判定＝`hotspot.kind === "gate" || hotspot.markerStyle === "portal"`；商店地點皆不具 `kind:"gate"`／`markerStyle:"portal"`，與 `portal` **互斥不重疊**（同一 marker 不會同時 shop＋portal）。

* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public 可存取。

## 2. 設計命題（USR 目標）

* 進場原始概念（忠實轉錄）：標題「商店的地圖ICON改成方形」；內文「如果場景有賣東西，則地圖上的 ICON 改成方形」。
* 目標：使「有販售（可逛店）」之地圖地點以**方形圖示**與其他地點（圓形）區隔，讓兒童玩家於地圖一眼辨識可購物（換外觀獎勵）之場景——「方形」為手段，真正目標為「**可逛店場景一眼可辨**」。
* 範圍界定：僅改**商店 marker 形狀**（圓→方）；不動非商店地點、不改 icon emoji、不改側欄卡片（已有 `.destination-card.shop`）、不改世界地圖入口（portal）。

## 3. 設計決策（確切數值／樣式留 3code visual-qa）

### D1：商店 marker 採方形、以 `isShopHotspot` 旗標自動套用

* 於 [styles/map.css] 新增 `.hotspot.shop` 形狀規則，使商店 marker 呈方形（如將 `border-radius` 由 `50%` 改為小圓角／近直角，必要時連動 `.hotspot-icon` 之圓角），沿用既有 `.hotspot`／`.hotspot.portal` 體例、**不另立平行 marker class**。
* 規則以既有 `shop` class 承接，**判定一律走 `isShopHotspot`（`shopCategories` 旗標）**；新增商店（任何區域）只要具 `shopCategories` 即自動變方形、免逐點設定（合 spec#7 模組化擴充）。
* 確切圓角半徑、尺寸、是否加邊框／底色微調、icon 內襯由 3code 依實機 visual-qa 定案。

### D2：統一兩 renderer，城堡商店一致變方形

* [game-engine/main.js] `renderCastleMap`（L1385）之 className 比照 `renderHotspots`（L1855）**補加** `` `${isShopHotspot(hotspot) ? " shop" : ""}` ``，使 castle 2 商店（`royalCloakRoom`／`castleSeamstress`）一致取得 `shop` class、套用方形。
* 接上 [styles/map.css] `.hotspot.shop`（D1）後，區域地圖既有 `shop` 空 class 同步生效；兩 renderer 對「商店＝方形」達成一致，消除「掛了沒接／castle 漏掛」之半完成 hook。

### D3：形狀優先序與並存狀態

* `shop` 與 `portal` 互斥（見 §1，商店不具 gate／portal）；惟 CSS 仍須確認疊加順序，避免日後若有重疊時形狀規則互蓋——3code 落地時確認 `.hotspot.portal` 與 `.hotspot.shop` 選擇器具確定優先序。
* 方形 marker 須與既有狀態 class 並存不衝突：`.hotspot.target`（♥ 目標地點，[styles/map.css] L129）、`nearby`、`disabled`（L210）。商店同時為 target 時，形狀（方）與目標高亮（♥／光環）須協調並存、不互相破壞。

### D4：視覺調性與相容

* 維持地圖既有**柔和童趣**視覺：避免過於生硬之直角；方形採適度圓角即可，並與既有 `portal` 圓角門形保有足夠形狀區別、各自可辨。
* **相容**：不動答題／生活聊天／打工／逛店購買／換裝／語音／計時與護眼邏輯；`shopCategories` 資料源既有，本案重**呈現**、不新增能力。與 #125（地點座標對位）、#131／#153（地圖公主 token 識別背版）、#138（商店旗標）、#157（商店定價）等既有成果共存、不回退。

### D5：寬窄共用、不另立分歧

* 方形 marker 須寬窄共用，差異僅止於斷點尺寸（[styles/mobile.css] 之 `.hotspot`／marker 覆寫如有）；不另立分歧的商店形狀值。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點 → 初判 Option A（建議，obj 已預核）**：marker 形狀屬呈現精修；且 design.md 現**未對任何 marker 形狀設條文**（連既有 `portal` 門形亦僅落在 CSS／renderer、不在 design.md），本案維持同一慣例——design.md ＜I／II＞無 spec# 增刪、決策由本 note 承載、README 補＜變更紀錄＞初稿。
  * **可選輕修（如 USR 希望記為 design 級行為）**：可於 sysStory#2（承接地圖導航）新增一條 sysCase，述「[modMap模組] 渲染地圖地點圖示時，依地點類別區分外觀（一般圓形、城門／傳送門形、可逛店方形），可逛店以 `isShopHotspot` 判定、城堡與各地區地圖一致」；spec# 編號不增減，屬 ＜II＞ 文字。預設不做、維持 Option A（與既有 portal 不設條文一致）。
* **② 範圍確認**：僅商店 marker 形狀（圓→方），含 **castle**（須同步補 `renderCastleMap` 之 `shop` class，否則 castle 2 商店漏改）；不動非商店地點、icon emoji、側欄卡片、世界地圖入口。
* **③「方形」調性確認**：方形＝「可辨之專屬形狀」（適度圓角、保留童趣、與 portal 門形有別），非生硬直角實心塊。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option A）＋ [README.md] ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。`docs/design.md` 未改（docLint sol 仍 0）。若 §4① USR 改選輕修，再補 design.md（sysStory#2 新增 sysCase，docLint sol 0）與 README 同步。
* **3code 程式產物**（依本 note §3）：
  * [styles/map.css]：新增 `.hotspot.shop` 方形樣式（D1／D3／D4），必要時連動 [styles/mobile.css] 寬窄（D5）。
  * [game-engine/main.js]：`renderCastleMap`（L1385）className 補 `shop` class（D2）；`renderHotspots`（L1855）既有 `shop` class 不動（接上 CSS 後自動生效）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（main.js）／`docLint docs/design.md`（sol 0）／`repoLint .` 0；headless selftest（`map-avatar` 等）PASS、console 0 error。建議於 selftest 補可選斷言：所有 `isShopHotspot` 之地圖 marker（含 castle）皆帶 `shop` class，守住兩 renderer 一致性。
  * **GATE §5（實機 visual-qa，寬＋窄、四區含 castle）**：商店 marker 呈方形、與一般圓形地點及 portal 門形清楚有別；castle／urban／rural／wild 之商店一致變方形；target ♥／nearby／disabled 狀態與方形並存無衝突；童趣調性維持、寬窄一致。逐頁發現＋截圖＋分級，must-fix 全修。

## 6. 實作與驗證結果（3code，2026-06-19）

> 沿 #101／#111／#120／#132／#150／#153 焦點 UI 修正慣例：本焦點變更之 GATE 驗證結果記於本節。design.md 未改（Option A，docLint sol 0）。

### 實作

* **D1（[styles/map.css]）**：於 `.hotspot.portal` 之後新增 `.hotspot.shop { border-radius: 4px; }` 與 `.hotspot.shop .hotspot-icon { border-radius: 3px; }`——商店 marker 由圓形（`50%`）改為**銳利方角**（僅留極小圓角避免完全硬邊、維持童趣），內 icon 板同步方角；保留既有 `.hotspot` 暖色漸層底（同族異形），與 `portal` 門形（`12px 12px 16px 16px`）及圓形地點有別；不覆寫 `.hotspot.target`／`.nearby`／`.disabled` 之高亮（僅改形狀、與其並存）。mobile.css 既有 `.hotspot` 覆寫未動 `border-radius`，方形於窄版自動沿用、無須另立分歧（D5）。
  * **USR 回饋微調（2026-06-19）**：初版 `10px`／`7px` 圓角過於圓潤、與圓形不易區分；依 USR 回饋收斂為 `4px`／`3px`（固定 px、各尺寸一致銳利），使方形於寬窄版皆清楚可辨。
* **D2（[game-engine/main.js] `renderCastleMap`）**：className 補 `` `${isShopHotspot(hotspot) ? " shop" : ""}` ``，使城堡內部地圖之商店（`royalCloakRoom`／`castleSeamstress`）一致取得 `shop` class；`renderHotspots`（區域地圖）既有 `shop` class 不動，接上 D1 之 CSS 後自動生效——兩 renderer 對「商店＝方形」達成一致，消除原「掛了沒接／castle 漏掛」之半完成 hook。
* **回歸守門（[game-engine/testing/selftests.js] `map-avatar`）**：於既有跨地圖渲染自測補斷言——castle 與 urban／rural／wild 各區之所有 `isShopHotspot`（非空 `shopCategories`）地點，其地圖 marker 皆須帶 `shop` class（守住兩 renderer 一致性，正是本案修正之 castle 漏掛回歸點）。

### GATE §1（機器判定，全綠）

* `node --check`（`game-engine/main.js`／`game-engine/testing/selftests.js`）→ OK。
* `docLint docs/design.md`（sol）→ **0**；`repoLint .` → **0**。
* headless selftest（獨立 context）：`map-avatar`（含 #166 新增 shop-class 斷言）→ `passed:true`、`errors:[]`；`data-audit`（`shopCount:11`）→ `passed:true`、`errors:[]`；console **0 error**。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用。

### GATE §5（實機 visual-qa，computed style 為準＋截圖佐證）

| 地圖（surface） | 商店 marker | 一般地點 | 城門/傳送 |
|---|---|---|---|
| urban（寬版） | 5 商店 `border-radius:4px`（方）✅ | 9 地點 `50%`（圓）✅ | `luminaraCastle` 門形 ✅ |
| **castle**（D2 修正點，寬版） | `royalCloakRoom`／`castleSeamstress` `4px`（方）✅ | 6 房間 `50%`（圓）✅ | `castleGate` 門形 ✅ |
| rural（寬版） | `workwearStall`／`fieldCobbler` `4px`（方）✅ | 全 `50%`（圓）✅ | — |
| wild（寬版） | `fairyAtelier`／`dwarfCottage` `4px`（方）✅ | 全 `50%`（圓）✅ | — |
| urban（窄版 376px） | `boutique`／`shoeShop` `4px`（方，30×30）✅ | `library` `50%`（圓）✅ | `luminaraCastle` 門形 ✅ |

* 全方案 **11/11 商店** marker 皆呈方形、各區（含 castle）一致；非商店地點維持圓形、portal 維持門形；窄版同樣方形（D5）。
* 邊界案例：`harbor`（label「Fish Shop」）因無 `shopCategories`（屬打工/釣魚場景、不販售外觀商品）**正確維持圓形**——規則以 `isShopHotspot` 旗標為準、非依名稱，符合「場景有賣東西」之語意。
* 三鏡頭：A（HMI 最低能力：可逛店地點於地圖可被辨識，達成）＋B（兒童 UX：方形一眼區分可購物場景）＋C 逐頁（上表 5 surface × 形狀對照、含 castle 與窄版）。`務必要修`：castle 商店原無方形（renderer 漏掛 shop class）——**已修**（D2，selftest 守門佐證）。其餘為可接受（方形採適度圓角延續童趣調性、與 portal 門形有別）。
* **結論：可宣稱完成。**

### 交付物（test-summary.pdf 待 USR 裁決）

* 沿 #101／#111／#120／#132／#150／#153 焦點 UI 修正慣例，本節即 GATE 報告；是否另產 A5 直向 [docs/test-summary.pdf] 待 USR 裁決。QA 截圖為暫存產物、不作交付物。
