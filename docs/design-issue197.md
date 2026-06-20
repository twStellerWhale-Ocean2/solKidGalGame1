# 設計note — issue #197 圖像資產標準尺寸與檔重預算、杜絕過大圖檔拖慢載入

> 本檔為 #197 之設計note（plan 階段）。本案為既有 [solKidGalGame方案] 下之**圖像資產體積治理**：把各類圖像資產的標準像素尺寸與**檔重預算**收斂為單一事實來源（`paramAssetStandards`），並擴充 GATE/data-audit 資產 lint 全面驗證，杜絕錯置過大圖檔拖慢純靜態載入。design.md 已於 plan 回修，對應既有 **spec#7**（可用純靜態網站方式部署並模組化擴充內容，solStory#7 部署擴充與移除）。docLint sol = 0。

## 1. 現況量測（以產物為準，本地 main 已同步 origin/main）

* **資產實況**：`content-base/` + `content-package/` 共 252 個 webp/png、約 30.7 MB。各類已存在「以檔名／manifest 嵌入」之隱性標準尺寸（已實測像素）：
  * 地區地圖 [content-package/areas/*/assets/map-1536.webp] = 1536×1536，**531–865 KB**（rural 865／urban 793／wild 774／castle 531）。
  * 世界地圖 [content-base/world/assets/world-map.webp] = 1024×1536，553 KB。
  * ADV 場景 [.../scenes/*-1024.webp] = 1024×1024，93–553 KB（多張 >500 KB）。
  * 可玩公主與場景人物像 [.../characters/*.webp] = 512×768，NPC 達 290–319 KB。
  * 衣物縮圖 [.../wardrobe/*/assets/thumbs/*.webp] = 256×256；衣物 layer [.../wardrobe/*/assets/layers/*.webp] = 512×768，38–53 KB。
  * UI [content-base/ui/*.webp]（如 diary-book 1280×720）。
* **緩慢主因＝檔重而非像素超規**：最重者（map-1536 與多張 1024 場景）像素尺寸皆符合各自標準，問題在**位元組過大**。
* **既有 lint 涵蓋缺口**（[game-engine/testing/selftests.js] `data-audit`）：已查**像素尺寸**者僅可玩公主 baseLayer 512×768（L1611）、世界地圖 1024×1536（L1819）、地區地圖 1536×1536（L1829）、ADV 場景 1024×1024（L1865/L1878）。**未涵蓋**：①任何**檔重（byte-weight）預算**——1536×1536 但 865 KB 之地圖照樣過關；②場景人物像（NPC）、衣物縮圖、衣物 layer、UI 之尺寸未一致納入；③標準值散落為魔術數字、無單一 SSOT。[scripts/repoLint.ps1] 僅查 repo 結構，無資產檢查。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **確立資產標準尺寸與檔重預算之單一事實來源**（`paramAssetStandards`）。
* **目的①** 全面尺寸 lint：把像素尺寸檢查擴充涵蓋所有圖像資產類別（補齊 NPC／縮圖／layer／UI）。
* **目的②（核心）** 新增檔重預算 lint：對每張資產加查檔重是否超出該類別預算，攔下像素合規但位元組過大之過大圖檔。
* **目的③** 納入 code GATE 完成判定；現存超標資產重壓縮至預算內或經 USR 認可具名豁免。
* 範圍界定：design.md ＜I＞ 種子採 **spec#7 補述**（非新增 spec#12，USR 於 go-plan 採預設）；預算數值、lint 落點與執行方式、現存超標處置之確切作法由 code 定案。

## 3. 設計決策（plan 已落地 design.md，docLint sol = 0）

* **D1 spec#7 補述（＜I＞ USR-gated 回修）**：spec#7 增列「各類圖像資產須符合各自宣告之標準像素尺寸與檔重預算，使純靜態載入不因過大圖檔變慢；合規守門見＜II＞/＜III＞」。spec# 編號維持 1–11 不變。
* **D2 標準表落點（＜II.B (D) 重點組態）**：於 [etyCfg自訂modContent組態] 新增 `paramAssetStandards`＝per-class `{pixelSize, maxKB}`——characterBase 512×768·350、scene 1024×1024·500、areaMap 1536×1536·600、worldMap 1024×1536·600、wardrobeThumb 256×256·60、wardrobeLayer 512×768·120、ui 視類別宣告。作為資產 lint 之尺寸與檔重 SSOT；**初始檔重門檻，code 可依實測 USR-gated 微調**。
* **D3 運作個案承接**：＜II.A solCase#7.2＞（維護者擴充內容）與 ＜II.B sysCase#5.3＞（modContent 匯入內容包）增列「新增/替換資產須通過尺寸＋檔重 lint，超標須重壓縮至預算內或具名豁免方可納入」。
* **D4 整合測試（＜III.D intTest#48）**：新增「驗證 圖像資產標準尺寸與檔重預算」——列舉全 runtime 資產→讀像素尺寸與位元組→比對 paramAssetStandards（尺寸＝標準值、位元組 ≤ 預算）→標記違規與具名豁免；既有基底 intTest#02／#47。
* **D5 ＜IV＞反映**：＜IV.A 測試指令＞增列資產 lint 沿用並擴充 `?selftest=data-audit`（新增全類別涵蓋與檔重檢查）；＜IV.B spec#7 成效＞增列資產尺寸／檔重合規率、過大圖檔檢出率、現存超標重壓縮完成率、地圖與場景載入時間。
* **README（產品手冊初稿）**：「擴充內容（給維護者）」增列各類標準尺寸與檔重預算說明；新增 #197 變更紀錄。

## 4. 待 code（DESIGN-READY → CODE-READY 範圍）

> 以下屬 code 實作決策，本 plan 不預斷，僅列範圍供 code 承接：

* **lint 實作**：擴充 [selftests.js] `data-audit`（已具 `imageMetrics`/`imageNaturalSize` 基建）——對全資產類別查像素尺寸、新增檔案位元組讀取與 `paramAssetStandards` 檔重預算比對；純靜態/headless 友善、不引入影像處理重相依。
* **標準表常數落地**：將 `paramAssetStandards` 落為 code 可讀常數（建議 content-package 共用模組或 selftests 常數），收編 selftests.js 散落的尺寸魔術數字（L1611/L1819/L1829/L1865）改引此表。
* **現存超標處置**：盤點並重壓縮超預算資產（首要 map-1536 之 rural/urban/wild、>500 KB 場景）至預算內，維持像素尺寸與童話手繪觀感（**不得**為降位元組犧牲畫質至模糊補版，違 spec#2/#7）；無法達標者列具名豁免（具理由、可審計）。
* **孤兒資產盤點**：順帶檢出未被 manifest/loader 引用之死檔，避免過大圖檔以死檔形式徒增部署包體積。
* **GATE**：上述 lint 納入 code GATE §1；超標資產於同一增量先處置再綠燈。GATE §1（機判）與 §5（業界水準審查＋視覺證據——重壓縮後場景/地圖視覺不退化）由 code 階段補登本檔。

## 5. 交付物與審查點（plan）

* **交付物**：design.md 回修（spec#7 補述／paramAssetStandards／solCase#7.2／sysCase#5.3／intTest#48／＜IV＞）＋ README 初稿改動＋本設計note。docLint sol = 0、CHECKLIST 完成、無新增/移除契約引用。
* **審查點**：推送 Draft PR，每 3 分鐘輪詢四訊號等待 USR 審查；核准後達 `DESIGN-READY`，交棒 code 於同分支補 lint 實作與現存資產處置。

## 6. code 階段：實作與 GATE 驗證紀錄

### 6.1 實作

* **標準表 SSOT**：新增 [content-package/_shared/asset-standards.js]——`assetStandards`（per-class `{mode, width, height, maxKB, label}`）＋ `classifyAssetPath()`（依路徑歸類，較依引用欄位穩健）＋ `assetSizeExemptions`（目前空）。
* **資產 lint**：[game-engine/testing/selftests.js] `data-audit` 新增 `collectAssetSizeBudgetAudit()`——列舉全 runtime 圖像資產（角色 base／NPC／場景／地區地圖／世界地圖／衣物縮圖＋layer／UI）→ 以 `fetch→blob.size` 量檔重、`imageNaturalSize` 量像素 → 比對標準（exact 等於／bound 容於）＋ 檔重預算；違規入 `errors`、結果入 `assetSizeBudget`。純靜態無 build，於瀏覽器量測。
* **設計修正（code 發現、已同步 design.md）**：plan 假設 wardrobe layer 為固定 512×768，實測為**緊貼裁切之內容 bitmap**（去白邊、可變尺寸，#176 以 targetBox 等比 fit 回畫布，如 200×289／158×271）。故衣物 layer／縮圖改採 **bound 模式**（寬高須容於畫布、非等於），固定畫布類（地圖／場景／角色 base／UI）維持 exact。已回修 design.md ＜II.B (D)＞ paramAssetStandards 與 ＜III.D intTest#48＞（docLint sol=0）。
* **現存超標重壓縮**（ImageMagick，維持像素尺寸、無模糊補版）：地區地圖 rural 865→550KB(q80)／urban 793→508KB(q88)／wild 774→456KB(q88)；wild 場景 elf-glade 553→406(q85)／tree-spirit-grove 521→427／red-hood-path 521→430／halfling-village 513→419／dwarf-cottage 509→408／three-pigs 500→401(q88)——共 9 檔，省約 2.3 MB。無具名豁免。

### 6.2 GATE §1（機器判定，全綠）

* `node --check`：[asset-standards.js]、[selftests.js] → OK。
* `docLint docs/design.md`(sol)=**0**；`repoLint .`=**0**。
* headless selftest（chromium，本機 server `:4191` 服務本分支檔案）全 PASS、console **0 error**：
  * **`data-audit`**：`passed:true`、errors `[]`——`assetSizeBudget` 250 資產、**failed 0／exempt 0**；各類上限：areaMap 550.2/600、worldMap 553.5/600、scene 490.8/500、characterBase 318.9/350、wardrobeThumb 16.7/60(bound)、wardrobeLayer 53.2/120(bound)、ui 24.2/120。
  * **回歸**：`save-load`（coins 100→100、活躍角色一致）、`monkey`(300 步、0 err) → `passed:true`。
* 依賴安全：純靜態網站、無 package 相依，`npm audit` 不適用（STACK techStackStaticWeb）。

### 6.3 GATE §5（業界水準審查＋視覺證據）

> 本增量異動之 UI 為 9 張重壓縮資產（3 地區地圖＋6 wild 場景）；以實機渲染＋before/after montage 佐證無畫質退化。

* **鏡頭 A（資產治理能力）**：標準尺寸＋檔重雙軸 lint 全資產涵蓋（含舊無守門的 NPC／縮圖／layer／UI）、納 data-audit/GATE、現存超標已收斂、具名豁免機制備而未用——能力齊備。
* **鏡頭 B（缺口）**：補上「過大圖檔零守門」之長期缺口；標準表收斂散落魔術數字為單一 SSOT；新增類別未登記即報錯（杜絕漏網）。
* **鏡頭 C（逐頁畫質）**：elf-glade 實機渲染清晰、背景林木與瀑布細節完整、人物層對位正常；rural 地圖（q80 最激進，865→550）與 elf-glade（q85，553→406）before/after montage 視覺一致、無 banding/細節流失；其餘 7 檔採等量或更高品質（q85–88）、像素尺寸保留，至少同等。
* **分級**：`務必要修` **0**；`可以接受`——重壓縮採 ImageMagick q80–88（業界網頁插圖常規品質），畫質肉眼無退化。
* **結論：可宣稱完成。**

### 6.4 交付物與審查點

* **交付物**：程式（asset-standards.js＋selftests.js）＋ 9 張重壓縮資產 ＋ design.md 回修（bound 語意）＋ README ＋ 本設計note。
* **test-summary.pdf**：沿 #101／#150／#166／#176／#180／#195 焦點變更慣例，本節即 GATE 報告；是否另產 A5 直向 [docs/test-summary.pdf] **待 USR 裁決**。QA 截圖／montage 為暫存產物、不作交付物。
