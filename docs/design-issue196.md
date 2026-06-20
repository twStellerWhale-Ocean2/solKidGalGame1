# 設計note — issue #196 衣物單品統一 512×512、單一素材兼投影與商店預覽、影像模型生成

> 本檔為 2plan 設計note 與後續 GATE 紀錄（沿 #176／#195／#197 焦點變更慣例）。本案承 **#195「單品單層」**、並與 **#197「資產標準尺寸與檔重預算」** 調和：把每件 wardrobe 單品由「#176 去白邊緊貼裁切（≤512×768）＋分離 256×256 商品縮圖」收斂為 **單一 `512×512` 長邊貼滿透明素材**，兼作投影層與商店方塊預覽，並以**全域 house style＋packStyle＋itemDesc 三層描述詞**經影像模型（OpenAI `gpt-image-1`）生成。對應既有 **spec#3**（外觀獎勵）＋ **spec#7**（純靜態部署與模組化擴充、資產標準）。
>
> **USR 方向（2026-06-20，issue #196）**：①統一 `512×512` 使商店預覽清晰；②投影到身上位置由維護者以 `targetBox` 精確校準以符合美術效果；③長形單品（如長褲）等比縮放至 512×512、至少一軸無白邊（長邊貼滿）；④現有素材像素不足須**重繪**——以維護者 env 之 `OPENAI_API_KEY` 連 OpenAI 影像 API 生成（POC 已驗證 `gpt-image-1` 可出 512×512 透明童話手繪素材）。

## 1. 現況量測（以產物為準，現行 main 已 ff 同步含 #195／#197／#199）

* **單品＝layer＋thumb 雙素材**：#195 確立單品單層後，每件 item 對應投影層 `assets/layers/<name>.webp`（#176 去白邊緊貼裁切、≤512×768、per-item `targetBox` 投影）＋ 商店縮圖 `assets/thumbs/<name>.webp`（`256×256`，[item-helpers.js] `image:thumb(asset)`）。
* **thumb 本即 layer 衍生物**：[server.mjs] 上傳端點先做 512×768 layer，再 `-trim -resize 256x256` 由 layer 裁出 thumb。
* **`item.image` 唯一消費者＝商店／衣櫃預覽**：[main.js] `itemPreviewStyle`→`--item-img`、[mobile.css] `.item-preview{background:var(--item-img) center/contain}`。地圖 token／頭胸照／帳號頭像走紙娃娃 layer 合成（[paper-doll.js]），不用 `item.image`。
* **落差根因**：thumb（256² 幾乎填滿）≠ 實際投影（targetBox 到身體位置、佔一小塊），來自不同檔案不同裁切。
* **量測**：80 件 layer 平均 `131×128`（min 37×26、max 200×289），**無一為 512×768**——故放大到 512×512 約 3.9–8×、明顯模糊（像素不足）。
* **#197 資產標準（本案須調和）**：[content-package/_shared/asset-standards.js] `assetStandards` 含 `wardrobeThumb 256×256·bound·60KB`＋`wardrobeLayer ≤512×768·bound·120KB`，`classifyAssetPath` 認 `/thumbs/`、`/layers/`；[scripts/assetLint.mjs]＋`data-audit`（intTest#49）＋design.md spec#7／sysCase#5.3／＜II.D＞＋契約均引用之。
* **#199**：spec#12 角色輪廓描邊／陰影（[paper-doll.css]）——wardrobe 素材須續相容該 filter（不在本案範圍、僅相容）。
* 連線檢查：repo [solKidGalGame] Issue 讀寫正常、public；`OPENAI_API_KEY`／`OPENAI_ORG_ID` 於 env 可用，影像模型含 `gpt-image-1`（支援透明底）／`gpt-image-2`（不支援透明，故不採）。

## 2. 設計命題（USR 目標）

* **單一素材**：移除分離 per-item 商店縮圖；商店預覽直接重用該件 wardrobe 素材，預覽與投影同源。
* **統一標準解析度**：每件 wardrobe 單品＝`512×512` 透明 WebP、**長邊貼滿**（fill：等比縮放使內容長邊貼滿至少一對對邊、短邊置中留透明、不變形），使方塊預覽清晰一致。
* **影像模型生成**：以三層描述詞（houseStyle＋packStyle＋itemDesc）＋同包風格錨經影像模型重繪取得清晰素材；生一張→改描述詞→重生；留痕進圖檔 metadata。
* **投影定位**：512×512 素材經 per-item `targetBox` 由維護者校準投影到 512×768 紙娃娃身上。
* **範圍**：不動換裝邏輯、紙娃娃合成幾何、頭胸照、帳號頭像、商品資料／價格／slot；只收斂預覽來源＋素材規範＋生成管線＋清理縮圖＋調和 #197 gate。

## 3. 設計決策

### D1：`item.image` 改指向單一 512×512 layer 素材
* [item-helpers.js] `wearable().image` 由 `thumb(asset)` 改為 `wardrobePackLayer(packId,asset)`；移除 `thumb()`／[paper-doll-assets.js] `wardrobePackThumb`。

### D2：商店預覽維持 contain-fit
* [mobile.css] `.item-preview` 既有 `background:var(--item-img) center/contain` 不變；素材改為 512×512 透明。

### D3：標準解析度＝512×512 fill（調和 #197）
* [asset-standards.js]：移除 `wardrobeThumb`，`wardrobeLayer`→新類 `wardrobe { mode:"fill", width:512, height:512, maxKB:≈200(USR-gated) }`；`classifyAssetPath` 移除 `/thumbs/`、`/layers/`→`wardrobe`。
* [assetLint.mjs]＋[selftests.js] `data-audit`（intTest#49）：新增 `fill` mode 判定（尺寸＝512×512 且 alpha 內容邊界長邊貼滿至少一對對邊）；移除 thumb 斷言；新增單一素材不變式 **`item.image===item.layers[0].src`**、`thumbs/` 無殘留。

### D4：三層描述詞 + 影像模型生成
* **houseStyle**（全域，`_shared`）：全作品統一童話手繪底層繪法（線條／上色／質感／透明底）。
* **packStyle**（各 pack manifest）：`{name,reference,palette,motifs,linework,mood}`，僅變母題與配色、不改底層繪法。
* **itemDesc**（各單品）：單品描述。
* 組 prompt＝houseStyle＋packStyle＋itemDesc＋全域排除（無身體／場景／邊框／文字／投影、透明、單件）；以同包既有 2–3 件素材為風格錨（影像 API `image[]`）、文字描述遊戲定位與紙娃娃用途（不傳場景背景圖）。輸出 1024×1024 透明→降採樣 512×512 長邊貼滿。

### D5：生一張→改詞→重生 + 留痕進 metadata（工具驅動）
* [tool/wardrobe-tuner.js]／`.html` 每件於現有 `📁`／`🗑` 外加 `📝描述詞`（編輯三層 JSON）與 `♻重生`（依目前描述詞呼叫 [server.mjs] dev 端點生成、覆蓋）。
* 留痕（`model`／`prompt`／`date`）寫入圖檔 WebP comment／XMP；**產圖／壓縮不得 `-strip`**（[server.mjs] 既有 `-strip` 須移除或改保留 provenance）。

### D6：清理與 design.md／契約調和
* 刪 `content-package/wardrobe/*/assets/thumbs/`（~90 webp）；[server.mjs] 上傳移除 thumb 產製與 `thumbs` 目錄。
* design.md ＜I＞spec#3／#7、＜II＞sysCase#5.3／重點組態（paramAssetStandards、新增 paramWardrobeAssetStyle）／intTest#49、＜IV＞觀察項 已回修；契約 [hmiIntf自訂角色尺度與美術規範] §III.B／§III.C／§IV 已回修。
* 通用「可呼叫影像模型生圖」一句寫入 [2tech-devSet-incr-3code] ＜III＞（跨 repo 通用，不綁本作品慣例）。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md ＜I＞ spec#3／#7 USR-gated 回修**（移除「商品縮圖」獨立交付、改述單一 512×512 素材兼預覽）——obj 種子已預示，待 USR 於 PR 核准。
* **② 標準解析度＝512×512 fill、maxKB≈200**（USR-gated 待實測；512×512 精細透明 WebP 可能 >120KB，故由 #197 的 120KB 上調）。
* **③ 美術翻新之取捨**：影像模型為**重新詮釋**非忠實高清化（POC 月亮披風由橄欖綠開襟→金黃閉合斗篷）；本案等同一次全 wardrobe 美術翻新（~80 件逐件描述詞→重生→人工挑選→`targetBox` 重新校準）。成本：影像 API 逐件多次生成。
* **④ 投影定位由維護者校準**：512×512 素材經 per-item `targetBox` 人工定位，沿用 #176／#191 之 tuner 機制（重新校準）。

## 5. 產物分工與 GATE 計畫

* **本 plan 交付（docs，Draft PR #203）**：design.md 回修＋本設計note 改寫＋契約回修＋README 變更紀錄＋3code 技能通用段；`docLint docs/design.md`（sol）→ 0、`repoLint .` → 0、`assetLint` → 0（既有素材仍合 #197 舊標準，未動）。
* **code 計畫（3code，沿用本分支轉正式 PR）**：
  * D1 [item-helpers.js]／[paper-doll-assets.js]；D2 [mobile.css]；D3 [asset-standards.js]／[assetLint.mjs]／[selftests.js]（fill mode＋單一素材不變式）；D4／D5 [tool/wardrobe-tuner.js]／[server.mjs]（三層描述詞 JSON、`📝`／`♻` 按鈕、生成端點、留痕不 strip）；D6 刪 thumbs。
  * **素材重繪**：houseStyle／各 packStyle 定稿後，逐件以工具描述詞→重生→人工挑→`targetBox` 校準。
  * **GATE §1**：`node --check`／`data-audit`（fill mode＋`image===layers[0].src`＋無 thumbs 殘留、`passed errors:[]`）／`save-load`／`monkey`／`assetLint`（新 wardrobe 標準）／`repoLint` 0／`docLint` sol 0。
  * **GATE §5**：商店／衣櫃預覽手機直向＋桌機 visual-qa（各類預覽清晰、與實穿同源）；代表性衣物實穿 `targetBox` 對位正確、跨四公主一致；同包風格一致、跨件有別。
