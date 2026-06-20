# 設計note — issue #196 衣物單品標準解析度、單一素材兼作投影與商店預覽

> 本檔為 2plan 設計note 與後續 GATE 紀錄（沿 #101／#150／#166／#176／#180／#195 焦點變更慣例：GATE 結果記於本節與 PR；test-summary.pdf 待 USR 裁決）。本案承 **#195「單品單層」** 之後續——既然每件 wardrobe item 已恰好對應單一外觀層，本案進一步**移除分離的商店商品縮圖、令該單一 layer 素材兼作投影材與商店方塊預覽**，並規範衣物單品之標準解析度。對應既有 **spec#3**（可把學習成果轉為看得見的外觀獎勵）＋ **spec#7**（純靜態部署與模組化擴充內容）。
>
> **USR 方向（2026-06-20，issue #196）**：商店方塊預覽**直接用同一張去白邊 layer 圖 contain-fit 進方塊**（採 Approach B「單一素材填滿方塊」），不另設分離縮圖；單一真相、改動最小。已知取捨：contain-fit 使各件在方塊內被正規化為等大（非真實相對大小），換得「商店預覽與投影素材同源、消除分離縮圖造成之不一致」。

## 1. 現況量測（以產物為準，現行 main 已 ff 同步含 #195）

* **單品＝layer＋thumb 雙素材**：#195（PR #200）確立單品單層後，每件 wardrobe item 恰對應——
  * 投影層 `content-package/wardrobe/<pack>/assets/layers/<name>.webp`：#176 去白邊緊貼裁切 bitmap（≤`512×768`），經 per-item `targetBox`（覆寫→裁切原始框→類別 `safeBox`）等比 fit 回 `512×768` rig；由 [content-package/wardrobe/_shared/item-helpers.js] `layer()` 生成、寫入 `layers[0].src`。
  * 商店縮圖 `assets/thumbs/<name>.webp`：`256×256` 方塊圖，由同檔 `thumb()`（[paper-doll-assets.js] `wardrobePackThumb`）生成、寫入 item 之 `image` 欄。
* **thumb 本即 layer 之衍生物**：[server.mjs] 上傳端點（L197–218）先把來圖轉為 `512×768` 透明畫布 layer，再 `-trim +repage -resize 256x256` 由該 layer 裁出 thumb——縮圖並非另繪美術，而是 layer 去白邊後縮為 `256²`。
* **`item.image` 之唯一消費者＝商店／衣櫃格預覽**：[game-engine/main.js] `itemPreviewStyle`（L1218）輸出 `--item-img:url(item.image)`；[styles/mobile.css] `.item-preview { background: #fffaf0 var(--item-img) center / contain no-repeat }`（L412–414，逛店列另為 `20%` 半透明白底，#167）。地圖 token、頭胸照大頭照、帳號頭像皆走紙娃娃 layer **合成幾何**（[game-engine/render/paper-doll.js]，#194），**不使用 `item.image`**——故改 `item.image` 之來源只影響商店／衣櫃預覽，不動穿戴合成。
* **落差根因（議題參考圖）**：thumb 為 `256²`、商品幾乎填滿；實際穿戴經 `targetBox` 投影到 `512×768` 身體位置（如頭飾僅佔頭頂一小塊）。兩者**不同檔案、不同裁切尺寸**，故「商店所見大小」≠「穿上身大小感受」。
* **守門現況**：[game-engine/testing/selftests.js] `data-audit` 對 `item.image`（thumb，L2042）與 `layer.src`（L2047）各做一次 bitmap 資產檢查；layer 另驗 `≤512×768`＋`targetBox` 落於 `safeBox`（L2060+）。
* **既有產物對「商品縮圖」之措辭**（將連動）：design.md spec#3（L19）、spec#7（L23）、sysCase#5.3（L222）、docProgTest productReadme 要求（L1001）；契約 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B（L47）／§III.C（L55）；[README.md] L85／L153／L165 等結構描述。
* **資產盤點**：各 pack `assets/thumbs/` 約 90 張 per-item 縮圖（layer 79 張；差額為已移除商品之孤兒縮圖殘留，併於本案清理）。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、為 public 可存取；本地 `main` 已 ff 至 `c60491e`，工作分支 `feat/issue196-standardize-wardrobe-item-resolution` 自最新 main 切出。

## 2. 設計命題（USR 目標）

* **單一素材**：移除分離的 per-item 商店縮圖；商店商品預覽**直接重用該商品之 wardrobe layer 素材**，使「商店預覽」與「實際投影」同源、同一真相。
* **規範標準解析度**：衣物單品素材統一為**去白邊透明 WebP、於 `512×768` rig 座標空間 authored（內容 ≤`512×768`）**，同一張同時作為投影層與商店方塊預覽；不另維護不同解析度（`256²`）之分離縮圖。
* **範圍界定**：僅收斂「商店／衣櫃預覽來源」與「衣物素材規範」，並清理縮圖資產與其產製流程；**不動**換裝邏輯、紙娃娃合成幾何、`targetBox` 對位、頭胸照大頭照、帳號頭像、商品資料／價格／slot 疊圖順序。

## 3. 設計決策

### D1：`item.image` 由分離縮圖改指向 layer 素材
* [content-package/wardrobe/_shared/item-helpers.js] `wearable()` 之 `image` 由 `thumb(asset)` 改為 `wardrobePackLayer(packId, asset)`（與 `layers[0].src` 為同一檔）；移除 `thumb()` 與 [paper-doll-assets.js] `wardrobePackThumb` 匯出。

### D2：商店預覽呈現維持 contain-fit（Approach B）
* [styles/mobile.css] `.item-preview` 既有 `background: var(--item-img) center / contain` 不變；素材改為去白邊透明 layer→各件於方塊內等比置中。白底／`20%` 半透明白底維持（透明 layer 疊其上，逛店仍透出試穿）。

### D3：標準解析度規範落入契約
* [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B 明定：**單一 wardrobe 素材＝去白邊透明 WebP、`512×768` rig 座標 authored（≤`512×768`）**，同時作投影層與商店方塊預覽；§III.C 之「衣物 layer、商品縮圖」併為「衣物 layer（兼商店預覽）」，移除「商品縮圖」獨立列舉。data-audit 既有 `≤512×768` 限制即標準下界。

### D4：清理分離縮圖資產與產製流程
* 刪除各 pack `content-package/wardrobe/*/assets/thumbs/`（約 90 webp，含孤兒殘留）。
* [server.mjs]：上傳端點移除 thumb 產製（L210／L218）與 `thumbs` 目錄建立（L144）；僅產 layer。
* [tool/wardrobe-tuner.js]／`.html`：`assetOfItem` 之 `layers|thumbs` 正規表示式收斂為 layer、上傳說明與流程移除縮圖步驟。

### D5：守門改為單一素材不變式
* [game-engine/testing/selftests.js] `data-audit`：移除對 `item.image`（thumb）之獨立 bitmap 斷言（已由 layer 檢查涵蓋）；新增不變式 **`item.image === item.layers[0].src`**（商店預覽與投影同源、無分離縮圖）。

### D6：design.md ＜I／II／III／IV＞ 連動回修（USR-gated ＜I＞）
* ＜I＞spec#3／spec#7：移除「商品縮圖」獨立美術交付，改述「商店商品預覽重用 wardrobe layer 素材、單一素材、規範標準解析度、不另設縮圖」。
* ＜II＞sysCase#5.3：同步移除「商品縮圖」獨立列舉；＜III＞intTest#08 補單一素材不變式；docProgTest（L1001）productReadme 要求移除縮圖；＜IV＞spec#3 觀察項補「商店預覽與實穿同源（無分離縮圖殘留）檢出率」。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md ＜I＞ spec#3／spec#7 USR-gated 回修**：移除「商品縮圖」獨立美術交付列舉、改述單一素材兼商店預覽。obj 種子已預示（Issue #196 ＜I＞方案目的）、待 USR 於 Draft PR 核准。比照 #195 於 plan 回修 spec#3 之慣例。
* **② 標準解析度定義**：採「`512×768` rig 座標 authored、去白邊透明 WebP、≤`512×768`」為單一素材標準（沿用 #176 既有裁切模型，**不需大量重製既有素材**）。若 USR 另要更嚴格之最小像素密度規範，於此確認後納入契約。
* **③ 範圍確認**：僅收斂預覽來源＋素材規範＋清理縮圖；不動換裝、紙娃娃合成幾何、`targetBox` 對位、頭胸照、帳號頭像、商品資料／slot。
* **④ 預覽呈現取捨（B 之已知）**：contain-fit 使各件在方塊內正規化等大（非真實相對大小）；換得單一真相、消除分離縮圖 vs 實際素材之不一致。USR 已於選項選定 B、知悉此取捨。

## 5. 產物分工與 GATE 計畫

* **本 plan 交付（docs，Draft PR）**：design.md 回修（spec#3／#7／sysCase#5.3／intTest#08／docProgTest／＜IV＞）＋本設計note＋[README.md] ＜變更紀錄＞初稿一筆；`docLint docs/design.md`（sol）→ 0、`repoLint .` → 0。
* **code 計畫（3code，沿用同分支轉正式 PR）**：
  * D1 [item-helpers.js]／[paper-doll-assets.js]；D2 [styles/mobile.css] 確認；D4 刪 `thumbs/`＋[server.mjs]＋[tool/wardrobe-tuner.js]；D5 [selftests.js]；D3 契約 [contract-local/hmiIntf自訂角色尺度與美術規範.md] §III.B／§III.C 落地。
  * **GATE §1**：`node --check`（改動 JS）／headless `data-audit`（單一素材不變式 `image===layers[0].src`、`passed errors:[]`）／`save-load`／`monkey` 回歸／`repoLint .` 0／`docLint` sol 0。
  * **GATE §5**：商店與衣櫃格預覽手機直向＋桌機 visual-qa——代表性各類（上衣／下身／洋裝／外套／鞋／頭飾／配件）預覽顯示正確、與實穿同源、無破圖或空框；逛店試穿透出維持。
