# 設計note — issue #267 衣物單品收斂單一事實來源、消除跨檔寫死 id 與靜默失聯

> 本檔為 #267 之設計note（2plan 階段）。本案為既有 [solKidGalGame方案] 之**架構 refactor（行為保持／玩家無感）**：把衣物單品的存在與描述自「手寫 [wardrobe/manifest.js] 聚合＋各包 [manifest.js] 寫死 `wearable(...)`＋[style.json] `items` 生成 prompt＋[asset-target-overrides.js] 對位框」之**多檔散落**，收斂為「**素材旁 JSON sidecar 單一事實來源 ＋ build 期衍生式 registry**」，並補開發期一致性守門。**採 Option B**：本案改變內容包結構與載入路徑、屬 design.md 抽象高度內，故 design.md ＜II.D 重點組態＞新增 `paramWardrobeRegistry`、＜III.D＞新增 `intTest#54`（docLint sol 維持 **0**）；其餘細節由本 note 承載、由 3code 落地、以 selftest／index-gen 守回歸。**不新增、不修訂任何 spec**（承 ISSUE-READY、USR 方案 A 定調）——落於既有 **spec#3**（學習成果→外觀獎勵／wardrobe 分層素材）、**spec#7**（純靜態部署＋內容包模組化擴充）、**spec#13**（維護者依資料包結構維護擴充組態）之交集，為實作層架構強化。USR 於 2026-06-26 對話選定**完整 SSOT 收斂**（sidecar＋衍生 registry），並要求實作從簡、以 smoke 驗收。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **單品身分散落 5＋ 檔、且雙 id 隱性對應**：
  * [content-package/wardrobe/&lt;pack&gt;/manifest.js]：各包以 `wearable({ id, storeId, type, name, cost, icon, asset })` **寫死**每件單品（[castle/manifest.js] 15 件為例）；`id` 為 camelCase 引擎 id、`asset` 為 kebab 素材 slug，**兩套並存且對應隱性**（如引擎 id `countrysideLowPonytail` ↔ 素材 `rural/hairstyle-simple-low-ponytail`、`urbanGreyBlueTownDress` ↔ `urban/outfit-grey-blue-town-dress`，無機可循）。
  * [content-package/wardrobe/manifest.js]：**手寫聚合**——逐一 `import` 五包 items（`castleItems`／`ruralItems`／`starterItems`／`urbanItems`／`wildItems`）再 spread 為單一 `wardrobeItems`（alias `shopItems`），檔頭註明「新增衣物包時…再在這裡匯入與展開」＝手動註冊點。
  * [content-package/wardrobe/&lt;pack&gt;/style.json]：`packStyle`（整包美術風格）＋ `items`（素材 slug → 影像生成 prompt），僅由 [tool/generate-wardrobe-asset.mjs] 於生成期消費；與 manifest **無連結**，刪一半即孤兒（#268 才補上對稱清理）。
  * [content-package/wardrobe/_shared/asset-target-overrides.js]：~60 件 per-asset 人工對位框（鍵 `&lt;pack&gt;/&lt;slug&gt;`、值 `{left,top,right,bottom}`），由 Wardrobe Tuner 匯出；與 manifest／style 各自獨立。
  * [content-package/wardrobe/_shared/asset-content-box.generated.js]：#196 fill 模型後已退化為空表（保留相容）。
* **引擎端寫死 id、且靜默失聯**：
  * [game-engine/state/default-state.js]：`princessStart.owned`（21 件）與 `outfit`（預設穿搭 hairstyle／outfit／shoes）以**寫死字串 id** 引用衣物。
  * [game-engine/state/game-state.js]：`normalizeState` 對 `owned` 以 `.filter((id) => Boolean(itemById(id)))`（:125）、`normalizeOutfit` 對 slot 以 `!itemById(...)` 退回 base／`none`（:182）——即現行**執行期 safe-fallback**，但亦使單邊內容變更**靜默失聯**（無錯、無紅）。
  * [game-engine/testing/selftests.js]：穿/脫切換測試以**寫死 `pinkSlippers`** 為 fixture（:919）、starter 過濾以寫死五件 starter id（:907）；內容重作即 fixture 失效（本案根因之一）。
* **管理工具後端多檔拼接**：[server.mjs] `handleDeleteItem`（:137）刪一件須改 manifest 行＋splice overrides＋content-box＋清 style.json（4 檔）；`handleGetWardrobeDesc`／`handleSaveWardrobeMeta`（:269/:289）讀寫 name/cost（manifest）＋desc（style.json）跨檔；`handleAddItem`／`handleUploadItem` 亦寫 manifest。每件 metadata **散在 3 檔**。
* **已治標、根因仍在**：#266 已手動修「#263 衣物重作後預設新局裝扣指向已移除物件（暫豁免 3 試行素材）」、#268 已修 style.json 孤兒；皆為症狀修補，**無開發期守門**阻止同類再發。
* **倉庫慣例**：純靜態網站、**無 `package.json`／無第三方相依**（[techStackStaticWeb]）；dev 工具以 `node` 直跑 [server.mjs]／[tool/*.mjs]；已有**committed 生成檔**慣例（`game-engine/build/version.js`、`asset-content-box.generated.js`，檔頭 `// AUTO-GENERATED … 請勿手改`）。瀏覽器無法 `readdir`——純靜態載入只能讀已生成之 `.js`。

## 2. 設計命題（USR 目標，承 ISSUE-READY；USR 選定「完整 SSOT 收斂」）

* **目的（承 Issue ＜I＞開發目的）**：① 讓衣物單品的存在與描述收斂為**單一事實來源**，內容增刪即生效、不需手動同步多檔；② 引用失聯須於**開發期被明確發現（出聲告警）**、執行期保留 safe-fallback 使玩家端永不崩潰；③ 維護者經管理工具之新增／刪除／調位變更須**原子且自描述、不殘留孤兒、不依賴手寫註冊**。
* **範圍**：衣物內容包結構與其載入路徑、生成腳本、管理工具後端、引擎端預設與 selftest fixture；**不動**玩法、UI 動線、紙娃娃合成幾何、類別級 layer bounds、單品單層（#196）與四類別（#251）等既成不變式。
* **不變式**：① 玩家可見行為（換裝、商店、存檔、預設公主造型）與重構前等價；② 既有存檔之 camelCase 單品 id 持續可用（不強制 id 改名／存檔遷移）；③ 純靜態部署相容（spec#7）——runtime 永不 readdir，只讀生成 index；④ 單品至多一外觀層、商店預覽 image≡layers[0].src（#196）；⑤ 衍生 index 與素材一一對應、無孤兒（build 期守門）。

## 3. 設計決策（plan 定方向，3code 落地）

* **D1 sidecar 格式＝JSON（非 yaml）**：每件素材旁置 `&lt;slug&gt;.metadata.json`（與 `&lt;slug&gt;.webp` 同目錄同基名），為該件**唯一事實來源**，欄位 `{ id, type, name, cost, icon, prompt, targetBox? }`。
  > Issue ＜I＞曾舉 `.metadata.yaml`；**改採 JSON** 之理由：本 repo 無 `package.json`／無第三方相依，Node 與瀏覽器皆原生解析 JSON、無需引入 YAML parser（守 [techStackStaticWeb] 零相依、呼應「CODE 簡單」）。「metadata 不可烘入圖檔」之 GIMP 約束由 sidecar（圖檔外）滿足，與 JSON／YAML 無關。**全 id 統一（slug 即唯一 id、廢 camelCase）需存檔遷移，本案不做**——sidecar 顯式單源宣告 `id`↔slug，雙表示退為**單一來源、顯式對應**（非昔日跨檔隱性手寫雙軌），即解 Issue「跨檔寫死 id／隱性對應」之痛。
* **D2 per-pack 風格與店家**：`&lt;pack&gt;/style.json` 收斂為 `{ packStyle, storeId }`（移除 `items`；prompt 已下放各 sidecar）；`storeId` 自此 per-pack 單一宣告（原各 item 重複寫死之 `storeId` 由此繼承）。
* **D3 衍生式 registry（build 期生成、committed）**：新增 [scripts/genWardrobeIndex.mjs]——掃描 `content-package/wardrobe/&lt;pack&gt;/assets/layers/*.webp`＋同名 `.metadata.json`＋各包 `style.json`，產出 [content-package/wardrobe/index.generated.js]（frozen `wardrobeItems` 陣列，檔頭 `// AUTO-GENERATED … 請勿手改`，比照 `version.js`）。**生成期守門**：每 `.webp` 必有同名 sidecar、每 sidecar 必有 `.webp`（無孤兒）、`id` 全域唯一、`type` ∈ 已知 slot、`targetBox` 形狀合法；違反即非零退出、擋 build。
* **D4 runtime 載入＝生成 index（單一路徑、靜態相容）**：[content-package/wardrobe/manifest.js] 改自 [index.generated.js] re-export `wardrobeItems`／`shopItems`（沿用既有名，下游零改）＋續 re-export `_shared` 規則；移除手寫五包 import／spread 與 `createWardrobePackTools` 之 per-item `wearable(...)`（layer src／targetBox 解析移入 index-gen 之 item 工廠）。瀏覽器只 import 生成 `.js`，**永不 readdir**。
* **D5 dev 即時預覽（readdir 路徑、僅本機）**：[server.mjs] 於每次 wardrobe 變更工具操作（add／delete／upload／saveMeta／generate）後與 dev 啟動時，重跑 [genWardrobeIndex.mjs] 重生 index，使本機預覽即時反映內容增刪、無須手動同步；prod 直接 ship committed 之 [index.generated.js]。dev＝readdir 重生、prod＝讀生成檔，**spec#7 純靜態不破**。
* **D6 管理工具單檔 metadata（原子、無孤兒）**：[server.mjs] 之 `handleDeleteItem`＝刪 `&lt;slug&gt;.webp`＋`&lt;slug&gt;.metadata.json`（2 同目錄檔，原子、無跨檔殘留）後重生 index；`handleGetWardrobeDesc`／`handleSaveWardrobeMeta`／`handleAddItem`／`handleUploadItem` 改讀寫**單一 sidecar**（取代 manifest 行＋style.json＋overrides 多檔拼接）。
* **D7 生成腳本對位**：[tool/generate-wardrobe-asset.mjs] 改自各 sidecar 取 `prompt`＋各包 `style.json` 取 `packStyle`＋全域 `art-style.json` 取 houseStyle 組 prompt（取代讀 `style.items`＋regex 解析 manifest）；生成 webp 寫回素材目錄、與其 sidecar 同基名。
* **D8 開發期一致性守門（引擎，出聲告警）**：[game-engine/testing/selftests.js] `data-audit` 新增斷言——`princessStart.owned` 每 id、`princessStart.outfit` 每非 `none` slot、starter 相容 id 皆須 `itemById(...)` 命中（失聯即 selftest **紅**，開發期出聲）；穿/脫切換 fixture 改為**自 registry 動態挑選**（owned 且未穿戴之正式 layer 單品），廢寫死 `pinkSlippers`。**執行期 normalizeState safe-fallback 不動**（玩家端仍永不崩潰）。
* **D9 一次性遷移（不留雙軌）**：以 [genWardrobeIndex.mjs]（或一次性伴隨腳本）將現有 manifest.js `wearable(...)`＋style.json `items`＋overrides 轉出 ~60 件 sidecar；隨即移除各包 manifest.js 之手寫 items、style.json 之 `items`、[asset-target-overrides.js]、[asset-content-box.generated.js]（已空）。**一步到位、無新舊並存期**（守維護度分析「一次到底」）。
* **D10 starter 無素材相容項**：starter 五件（`storeId="starter"`、無正式 webp、僅作 base 內建外觀相容）無 layer 可掃，故以單一 [content-package/wardrobe/starter/items.json]（顯式小集合）併入 index；其無 `targetBox`／無商店上架（沿 #244 衣櫃不列 starter 之既有守門）。

## 4. 影響面與不變式

* **預期影響檔案（留 3code 落地）**：
  * 新增：[scripts/genWardrobeIndex.mjs]、[content-package/wardrobe/index.generated.js]（生成）、各包 `assets/layers/&lt;slug&gt;.metadata.json`（~60）、[content-package/wardrobe/starter/items.json]。
  * 改：[content-package/wardrobe/manifest.js]（改 re-export 生成 index）、各包 [style.json]（留 `packStyle`＋`storeId`）、[tool/generate-wardrobe-asset.mjs]（讀 sidecar）、[server.mjs]（單檔 metadata＋重生 index）、[game-engine/testing/selftests.js]（守門＋動態 fixture）、[docs/design.md]（＜II.D＞param／＜III.D＞intTest#54）、[docs/design-issue267.md]（本檔）、[README.md]（變更紀錄一行）、[VERSION]／[CHANGELOG.md]／[game-engine/build/version.js]（refactor、版號於 merge 釘選）。
  * 移除：各包 [manifest.js] 手寫 items（檔可留薄殼或刪）、各包 [style.json] `items`、[asset-target-overrides.js]、[asset-content-box.generated.js]。
* **不變式**：① 玩家可見行為等價（預設公主造型、換裝、商店、存檔）；② 既有存檔 camelCase id 相容；③ runtime 不 readdir、純靜態相容（spec#7）；④ 衍生 index 與素材一一對應、無孤兒；⑤ 單品單層、image≡layers[0].src（#196）、四類別與類別級 bounds（#251／#263）不動；⑥ 預設 owned/outfit 與 fixtures 皆解析得到（D8 守門機判）。

## 5. 魔鬼代言人回應（承 Issue ＜I＞）

* **「零手寫註冊」於純靜態的可行邊界**：明確切為 **build 期生成 index（prod 讀生成 `.js`）＋dev server readdir 即時重生**兩條路徑（D3／D4／D5），runtime 永不 readdir，與 spec#7 靜態部署不牴觸；「自動掃資料夾」只發生在 dev/build 期 Node 端。
* **不衝擊現有功能**：改動橫跨內容結構、生成腳本、管理工具、引擎載入，惟下游 `wardrobeItems`／`shopItems` 介面名不變（D4），消費端零改為目標；以動態 fixture＋預設裝扣守門＋既有 `save-load`／`data-audit` selftest 回歸固化，保留執行期 safe-fallback，杜絕衝擊換裝／商店／存檔動線。
* **不疊床架屋／不積債**：採**一次到底**遷移（D9）、不留新舊雙軌；sidecar 為單一事實來源、index 為其唯讀衍生（非「一份資料兩種讀法」）。
* **測試作法修訂（本案根因之一）**：廢寫死 `pinkSlippers` fixture、改自 registry 動態挑選（D8）；新增「預設 owned/outfit／starter fixture／index 對得上」守門，使同類靜默失聯於開發期即紅，杜絕再發。

## 6. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note（Option B）＋ [docs/design.md] ＜II.D＞`paramWardrobeRegistry`／＜III.D＞`intTest#54`（docLint sol 維持 0）。[README.md] 無玩法異動，最多補變更紀錄一行（校準權在 code/release）。
* **3code 程式產物**（依本 note §3 D1–D10）：sidecar 結構＋[genWardrobeIndex.mjs]＋生成 index、[manifest.js] 改 re-export、[style.json] 收斂、[generate-wardrobe-asset.mjs]／[server.mjs] 改單檔 metadata、[selftests.js] 守門＋動態 fixture、一次性遷移與舊檔移除；bump [VERSION]（refactor→patch）／重生 [version.js]／[CHANGELOG.md]。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`node --check`（改動檔）／`node scripts/genWardrobeIndex.mjs --check`（index 與素材一致、無孤兒、id 唯一）／`docLint docs/design.md`（sol 0）／`repoLint .` 0／`assetLint`（圖標準）／`genVersion --check` 通過；headless selftest PASS、console 0 error；新增「預設裝扣／fixture／index 一致性」守門 PASS、既有 `save-load`／`data-audit`／`monkey` 維持綠燈。
  * **GATE §5（實機 visual-qa，本案必做）**：依 Issue ＜I＞「其他注意事項」，須確認**新帳號預設公主造型**於**手機直向與桌機**正確載入、不退化（全身著裝＋頭胸照大頭照），並抽驗一件換裝穿戴對位；以 smoke task 串接（USR 指定）。
  * **smoke task（USR 指定驗收）**：起本機 server → 新局載入預設公主 → headless selftest（含新守門）全綠 → 預設造型截圖（手機直向＋桌機）佐證不退化。
* **依賴安全**：純靜態、無 `package.json`，`npm audit` 不適用。

## 7. 實作與驗證結果（3code，2026-06-26）

> USR 於本對話選定「完整 SSOT 收斂」並要求 CODE 從簡＋smoke 驗收；plan→code 同一 PR（#269），三審查點以 in-chat 核准續作。

### 實作（依 §3 D1–D10）
* **D1／D2（sidecar SSOT）**：62 件 layer 各置 `<slug>.metadata.json`（id／type／name／cost／icon／prompt／targetBox?）；各包 `style.json` 收斂為 `{storeId, packStyle}`；starter 5 件無素材相容項 → `starter/items.json`。
* **D3（衍生 index＋守門）**：新增 [scripts/genWardrobeIndex.mjs]，掃 sidecar＋storeId 產 [content-package/wardrobe/index.generated.js]（**67 件** frozen）；`--check` 守 webp↔sidecar 一一對應無孤兒、id 唯一、type 合法。
* **D4（runtime 單一路徑）**：[content-package/wardrobe/manifest.js] 改自 index re-export `wardrobeItems`／`shopItems`（下游 game-data.js 契約不變）；[_shared/item-helpers.js] 改 `buildWardrobeItem(raw)`（image≡layers[0].src、targetBox 自 raw）。
* **D5／D6（dev 即時＋管理工具原子）**：[server.mjs] `handleDeleteItem`＝刪 webp＋sidecar 後重生 index；add／upload／get／save desc／meta 皆對單一 sidecar；Tuner apply 之 targetBox 寫回各 sidecar＋重生。
* **D7（生成腳本）**：[tool/generate-wardrobe-asset.mjs] 改自 sidecar 取 prompt／type（取代 style.items＋manifest regex）。
* **D8（開發期守門＋動態 fixture）**：[selftests.js] `data-audit` 斷言預設 owned／outfit＋starter fixture 皆 `itemById` 命中（失聯即紅）；穿脫 fixture 改自 registry 動態挑、廢寫死 `pinkSlippers`；執行期 `normalizeState` safe-fallback 不動。
* **D9（一次到底遷移）**：移除 asset-target-overrides.js、asset-content-box.generated.js（已空）及其 #176 配套 obsolete [tool/trim-wardrobe-assets.mjs]、各包 manifest.js 寫死 items、style.json items；無新舊雙軌。[tool/wardrobe-tuner.js] 改自記憶體 item.targetBox seed。
* **版號**：refactor→patch，`0.55.3`→**`0.55.4`**（playerVisible:false、#267）；genVersion 重生 version.js／CHANGELOG，`--check` 0 漂移。

### GATE §1（機器判定，全綠）
* `node --check`（所有改動檔）OK；`docLint docs/design.md`（sol）PASS 0；`repoLint .` PASS 0；`assetLint` PASS（154 圖 0 違規）；`genVersion --check` PASS；`genWardrobeIndex --check` PASS（67 件、無孤兒、id 唯一）。
* headless selftest（本機 server :4173、[.codex/run-selftests-267.mjs]）：`data-audit`（#267 守門）／`save-load`（舊存檔相容）／`scene-nav`（穿脫動態 fixture）／`default-state`（#259 不變式）／`monkey` 全 **PASS**、console 0 error（**ALL-PASS**）。
* 依賴安全：無 `package.json`、純靜態，`npm audit` 不適用；`tsc` 本環境未安裝（jsconfig checkJs 屬編輯期選配、非硬 gate）。

### GATE §5（業界水準審查＝行為保持＋visual-qa smoke）
* **鏡頭 A／B**：本案行為保持、不新增／移除任何產品能力、無責任邊界變動；relevant 風險＝「載入路徑改寫致預設造型靜默退化」，已以 (a) data-audit 預設裝扣守門、(b) scene-nav 實機渲染穿脫、(c) 新舊 registry 等價（67 件、image≡src、預設 owned/outfit 全解析）三道守門覆蓋。
* **鏡頭 C（visual-qa smoke，#267 必做）**：新帳號（coins 200＝princessStart）預設公主造型於**手機直向（390×844）＋桌機（1280×800）**入公主房載入——**全身著裝完整（髮型＋grey-blue town dress），未退化為無衣著（#263 症狀不再現）**、console 0 error、45 layer 正常合成（截圖 [.codex/princess-mobile-267.png]／[.codex/princess-desktop-267.png]）。本案無新增／異動畫面，不產 per-page test-summary.pdf（GATE §5「無畫面變動→獨立報告」路徑，本節即報告）。
* **分級結論**：`務必要修` 0。**結論：可宣稱完成。**
