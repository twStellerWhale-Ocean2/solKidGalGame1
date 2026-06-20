# 設計note — issue #210 衣物改以資源包為單位、各地區收斂為單一店

> 本檔為 2plan 設計note（沿 #195／#196／#197 焦點變更慣例）。本案承 **#138「商店非特例（shopCategories 旗標）」**、**#195「單品單層」**、**#196「單品單一 512×512 素材兼投影與商店預覽」**：把衣物內容由「一家店對應一（至兩）類衣物」收斂為 **「一個資源包＝一家衣物商店、可含多類別衣物（含髮型），原則上每地區僅一家衣物商店」**。對應既有 **spec#7**（純靜態部署與模組化擴充）並觸及 **spec#3**（外觀獎勵）／**spec#11**（逛店）。
>
> **USR 方向（2026-06-20，issue #210）**：①衣物系列＝一個資源包、包內種類不限；②一家店對應一個資源包；③**取消**原「髮型不可與其他衣物相容」之限制（髮型與其他衣物同包同店）；④**各地區只留一家店**。（議題對話兩次收斂後定案，見 Issue #210 ＜I＞。）

## 1. 現況（以產物為準，現行 main 已同步 origin/main）

* **衣物內容包＝店＝類別**：現有 11 個 wardrobe 內容包（不含 `starter`），各包對應一家店、各只維護一至兩類衣物。每件商品 `wearable({ id, storeId, type, ... })`（[content-package/wardrobe/_shared/item-helpers.js]）帶 `storeId`；[content-package/wardrobe/manifest.js] 以 `wardrobeItems` 彙整、alias 為 `shopItems`。
* **商店端以 `shopCategories` 過濾**：各 area manifest `locations[]` 商店帶 `shopCategories`／`defaultCategory`（#138 起以 `shopCategories` 旗標辨識商店、不再依 `kind:"shop"`）；分類定義於 [content-package/wardrobe/_shared/categories.js]（hair／tops／bottoms／dresses／outerwear／shoes／hats／accessories）。
* **各地區現況店數**（[content-package/areas/*/manifest.js]）：

| 地區 | 現有衣物相關店（`storeId`：類別） | 對應內容包 |
|---|---|---|
| urban | boutique(dresses)、hairSalon(hair)、tailorStudio(tops,bottoms)、shoeShop(shoes)、accessoryShop(hats,accessories) | urban-dress-boutique／urban-hair-salon／urban-tailor-studio／urban-shoe-shop／urban-accessory-atelier |
| castle | royalCloakRoom(outerwear,hats)、castleSeamstress(tops,bottoms) | castle-royal-cloak-room／castle-seamstress |
| rural | workwearStall(tops,bottoms)、fieldCobbler(shoes,hats) | rural-workwear-stall／rural-field-cobbler |
| wild | fairyAtelier(dresses,accessories)、dwarfCottage(outerwear,shoes) | wild-dwarf-cottage／wild-fairy-atelier |

* **runtime 消費（save-compat 關鍵）**：
  * 擁有以 **itemId** 記錄——`state.owned` 為 `string[]`（[game-engine/types.js:102]）；**`storeId` 不入存檔**。故只要 **itemId 不變**，既有存檔已購衣物即相容。
  * `allowedShopCategories(hotspot)`（[game-engine/core/lookups.js:84]）：商店有 `shopCategories` 則用之，**否則 fallback 全類別**；衣櫃 UI 已逐類別分頁渲染（[game-engine/main.js:1135]）——「單店多類、類別分頁瀏覽」機制現成、無需新建。
  * 既有守門斷言（code 階段須調和，見 §5）：[game-engine/testing/selftests.js:1481] `shopCategories.length>2 即報錯`（單店全類別會違反）；:1485 `item.storeId 須指向存在的店`（合併後須重映射）；:205／:1437 以 `shopCategories.length>0` 辨識商店並渲染 shop marker（#166）——單店仍須**列出**其 `shopCategories`（非省略）方被認得。

## 2. 設計命題（USR 目標）

* **資源包為單位**：衣物以資源包為模組化單位，一個資源包可含多類別衣物（含髮型，不限類別、無相容限制）。
* **一店一包**：一家衣物商店對應一個資源包、整包販售。
* **一區一店**：原則上每地區僅一家衣物商店。
* **範圍**：不動素材對位契約（類別級 layer bounds、#196 單一 512×512 素材）、不動換裝／購買／退款核心機制、不動紙娃娃合成與頭胸照；只收斂「衣物如何分包、分店、佈於地圖」與其殘留清理＋既有測試調和。

## 3. 設計決策

### D1：各地區 location 收斂為單一衣物商店
* 各 [content-package/areas/*/manifest.js] 之 `locations[]` 衣物相關店收斂為 **1 家**：urban 5→1、castle 2→1、rural 2→1、wild 2→1。保留店之 `shopCategories`（列出該區資源包涵蓋之全部類別，因 #166 marker 與 #138 商店辨識均依 `shopCategories.length>0`）。

### D2：各地區衣物內容包收斂為單一資源包（可含多類別）
* 各區多個內容包合併為 **1 個區級資源包**（如 `urban`／`castle`／`rural`／`wild`），包內可含 top／bottom／dress／outer／shoes／hats／accessories／**hairstyle** 各類別之單品。確切包目錄命名與資產搬移由 code 落地。

### D3：商店以資源包整包供逛店、類別分頁瀏覽
* 單店之 `shopCategories` 列出其資源包涵蓋之全部類別；逛店沿用既有 `allowedShopCategories`＋衣櫃類別分頁 UI（[lookups.js]／[main.js]），玩家在單店內以類別分頁瀏覽包內各類商品。**資源包是內容組織單位，非「商店不分類」**。

### D4：取消髮型相容限制
* 髮型（`hairstyle`）與其他類別同包同店、無互斥／相容性宣告；現行 urban 髮型併入 urban 單店資源包。其餘地區現無髮型素材，維持不變（日後可於各區資源包補髮型，不受限制）。

### D5：既有存檔相容（itemId 不變）
* 合併時 **保留所有 item `id` 不變**（如 `twinBraidHair`／`blueDress`），既有 `state.owned`（itemId 陣列）即相容；`storeId` 不入存檔、可自由重映射。

### D6：被合併商店之殘留清理
* item `storeId` 重映射至各區單店；移除被併商店之 `locations` 項、對應 NPC（`npcImage`）、`scene` 設定（`urbanSceneConfigs` 等）、自帶題庫（`*LessonBank`／`*ChatLessonBank`）entries，以及地圖 `nodes`／`links` 引用，避免殘留懸空引用。地圖節點收斂後之座標佈點沿 #125 由 dev 以實機 visual-qa 校準。

## 4. 審查點裁決（USR 已定案，2026-06-21）

* **① spec#7 落點 → 定案：就地精修 spec#7**：採就地精修 spec#7 措辭（衣物以資源包為模組化單位、一店一包、一區一店），不新增獨立 spec#、spec 編號不增減。
* **② packStyle 收斂為區級 → 定案：採行**：合併後每區一個資源包＝一個 `packStyle`（#196 art-gen 三層描述詞之中層）；既有素材沿用、**不重生**（本案非美術翻新）；後續若要區內多風格再議。
* **③ 單店門面 → 定案：每區保留下列門面，其餘併入並清理**：

| 地區 | 保留門面（label／NPC／scene／icon） | 併入並清理之店 |
|---|---|---|
| urban | Dress Boutique／Rena／scene-urban-dress-boutique／👗 | hairSalon・tailorStudio・shoeShop・accessoryShop |
| castle | Castle Seamstress／Seamstress Bea／scene-castle-seamstress／👚 | royalCloakRoom |
| rural | Workwear Stall／Workwear Keeper／scene-rural-workwear-stall／👚 | fieldCobbler |
| wild | Fairy Atelier／Faye／scene-wild-fairy-atelier／👗 | dwarfCottage |

* 保留店之 `shopCategories` 擴為其資源包涵蓋之全部類別；被併店之 `locations` 項、NPC、`scene`、自帶題庫與 `nodes`／`links` 引用一併移除（見 D6）。
* **④ 地圖佈點 → 定案：交 dev**：店減少後各地圖節點佈局沿 #125 由 dev／opr 實機 visual-qa 校準，本 note 不釘死座標。

## 5. 產物分工與 GATE 計畫

* **本 plan 交付（docs，Draft PR）**：design.md 回修（＜I＞spec#7／＜II＞sysCase#5.3／＜IV.B＞spec#7 觀察項）＋本設計note＋[README.md] 變更紀錄；`pwsh scripts/docLint.ps1 -Path docs/design.md -Level sol` → 0、`pwsh scripts/repoLint.ps1` → 0。不動 content／runtime 程式碼。
* **code 計畫（3code，沿用本分支轉正式 PR）**：
  * **內容**：D2 各區 wardrobe pack 合併為單包（保留 itemId、搬移 `assets/layers/`、合併 `style.json` packStyle）；D1/D6 各 area manifest `locations` 收斂單店、`storeId` 重映射、移除多餘 NPC／scene／lessonBank／nodes／links。
  * **runtime**：D3 確認 `allowedShopCategories`／類別分頁對「單店多類」正常；原則上無需新機制。
  * **測試調和**：放寬 [selftests.js:1481] `shopCategories>2` 斷言以容許單店全類別；[selftests.js:1485] `storeId→店` 一致性對重映射後通過；#166 shop marker（`shopCategories.length>0`）仍成立；`save-load` 驗既有存檔已購 itemId 相容；`data-audit`／`monkey` 零回歸。
  * **GATE §1**（機器判定）：`node --check`／headless selftest（`data-audit`／`monkey`／`save-load` `passed:true`、`errors:[]`、console 0 error）／`assetLint` 0（素材沿用未動）／`repoLint` 0／`docLint` sol 0。
  * **GATE §5**（業界水準）：逐頁——各區單店逛店之類別分頁呈現多類商品（含 urban 髮型同店）、地圖單店佈點清楚、既有存檔載入後已購衣物仍在；手機直向＋桌機 visual-qa。
