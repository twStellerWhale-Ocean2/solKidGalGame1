# 設計note — issue #270 支援區網瀏覽器端衣物旋轉調整並儲存回伺服器

> 本檔為 #270 之設計note（2plan 階段）。本案為既有 [solKidGalGame方案] 之**維護工具增強（dev-only 功能，玩家不感知）**：在衣物調整工具（[wardrobe-tuner]）中加入旋轉角度控件，並將旋轉值存回 sidecar；同時將 [server.mjs] 監聽位址由 `127.0.0.1` 改為可設定（預設 `0.0.0.0`），使區域網路內其他裝置可直接存取。**採最小改動路徑**：sidecar 新增選填 `rotation` 欄位（度數，預設 0）、後向相容；遊戲引擎渲染層套用 CSS `transform: rotate()`；dev server HOST 改由環境變數 `paramServerHost` 控制。design.md 新增 `paramWardrobeRotation`（`[etyCfg自訂modWardrobe組態]`）、`paramServerHost`（`[etyCfg自訂devServer組態]`）與 intTest#55、intTest#56（docLint sol 維持 **0**）。落於既有 **spec#3**（維護者調整衣物呈現）、**spec#13**（維護者依工具調整衣物組態）之延伸；**不新增、不修訂任何 spec**（承 ISSUE-READY）。USR 於 2026-06-27 對話確認「家庭內使用，沒有安全性的問題。方便性優先」。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **[wardrobe-tuner] 無旋轉控件**：
  * `tool/wardrobe-tuner.js` 的 `workingItemBox` 僅追蹤 `{ left, top, right, bottom }`（第 26 行），`applyToFiles` 只送 `boxes[key]` 含四邊與 `corners`（第 574 行）。
  * `tool/wardrobe-tuner.html` 無旋轉滑桿或數值輸入。
* **sidecar 無 `rotation` 欄位**：
  * sidecar 格式：`{ id, type, name, cost, icon, prompt, targetBox? }`（承 #267 [paramWardrobeRegistry]）；`targetBox` 欄位為 `{ left, top, right, bottom, corners? }`，未含旋轉。
  * `content-package/wardrobe/_shared/item-helpers.js` 的 `buildWardrobeItem` 從 raw index 還原 item 物件，不含旋轉欄位。
* **[server.mjs] `handleApplyWardrobe` 不寫 `rotation`**：
  * 第 95 行：`meta.targetBox = { left: box.left, ... }` —— 旋轉不在此。
  * 第 471 行：`.listen(port, "127.0.0.1", ...)` —— 僅本機可存取，同一區網其他裝置無法直連。
* **遊戲引擎未套用旋轉**：
  * `game-engine/render/paper-doll.js` 渲染 wardrobe layer 時無 CSS `transform: rotate()` 邏輯。

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **spec#1（旋轉調整）**：維護者在 [wardrobe-tuner] 中可對任一衣物單品設定旋轉角度（-180°～180°），即時預覽，按「套用」儲存回 sidecar；遊戲本體渲染時套用此旋轉。
* **spec#2（區網存取）**：[server.mjs] 監聽於 `0.0.0.0`（可由環境變數 `HOST` 覆寫），使同一區域網路之其他裝置（如平板、手機）無需額外設定即可存取工具頁面。

## 3. 設計決策（plan 定方向，3code 落地）

* **D1 sidecar 新增選填 `rotation` 欄位**：為數字（度數，順時針正方向），選填，缺省視同 `0`；與 `targetBox` 並列於 sidecar 根層級。舊 sidecar 無此欄位時後向相容、不觸發重生。
  > 為何不放進 `targetBox`？`targetBox` 語義為「裁切／對位範圍框」（四邊 + warp corners），混入旋轉語義不佳；分離也使未來去除 `targetBox` 時旋轉仍可保留。

* **D2 `handleApplyWardrobe` 讀寫 `rotation`**：當 `boxes[key]` 含 `rotation` 屬性時（含 `0`），寫入 sidecar `meta.rotation`；若不存在則略去（不清除已有值）；box=null（清除 targetBox）時一併清除 `meta.rotation`（保持 null 語義一致）。
  > 已有 `readSidecar`／`writeSidecar` helper 可直接延伸，無需額外基建。

* **D3 `buildWardrobeItem` 傳遞 `rotation`**：從 raw index 讀入 `rotation`，缺省補 `0`；item 物件新增 `rotation: number` 欄位。

* **D4 `genWardrobeIndex.mjs` 輸出 `rotation` 欄位**：掃 sidecar 時若有 `rotation` 則輸出進 `index.generated.js`；無此欄位則略去（runtime 由 D3 補 0）。

* **D5 [wardrobe-tuner] 新增旋轉 UI**：在 item 模式下新增旋轉滑桿（-180～180，step 1）與同步數值輸入，拖曳即時更新 `workingItemBox[key].rotation` 並觸發預覽重繪（CSS transform）；`applyToFiles` 送出時含 `rotation`。

* **D6 遊戲引擎渲染 wardrobe layer 套用旋轉**：`game-engine/render/paper-doll.js` 渲染每個 wardrobe item layer 時，若 `item.rotation` 非零則在 img/canvas element 套用 `style.transform = "rotate(${rotation}deg)"`；旋轉中心為 CSS 預設 center（不影響對位框計算）。

* **D7 server.mjs 監聽位址改為可設定**：`process.env.HOST || "0.0.0.0"` 取代寫死 `"127.0.0.1"`；啟動 log 額外顯示 LAN IP（Node `os.networkInterfaces()` 取第一個非迴環 IPv4）供家庭成員直接複製瀏覽器網址。
  > LAN IP 顯示為「便利性 log」，非安全閘門；符合 USR「方便性優先」目標。

## 4. 影響面（以本案實作範疇為限）

| 檔案 | 修改內容 | 決策 |
|------|--------|------|
| `server.mjs` | `handleApplyWardrobe` 寫 `rotation`；listen 改 `process.env.HOST \|\| "0.0.0.0"`；log 顯 LAN IP | D2、D7 |
| `content-package/wardrobe/_shared/item-helpers.js` | `buildWardrobeItem` 傳遞 `rotation` 欄位（缺省 0） | D3 |
| `scripts/genWardrobeIndex.mjs` | 掃 sidecar 時輸出 `rotation` | D4 |
| `tool/wardrobe-tuner.js` | `workingItemBox` 追蹤 `rotation`；`applyToFiles` 送出 `rotation` | D5 |
| `tool/wardrobe-tuner.html` | 新增旋轉滑桿與數值輸入 | D5 |
| `game-engine/render/paper-doll.js` | 渲染 wardrobe layer 時套用 CSS rotate | D6 |
| `docs/design.md` | `paramWardrobeRotation`、`paramServerHost`、intTest#55、intTest#56 | plan |

## 5. 魔鬼代言人（Issue ＜I＞中已有答辯，此處歸納）

* **Q：旋轉中心不在服裝視覺中心時效果不如預期？**
  A：現階段以 CSS 預設 `transform-origin: center` 為準，滿足一般翻轉需求（D6）。若後續特定素材需自訂旋轉中心，可擴充 sidecar 欄位；本案不預增複雜度（不超出 Issue ＜I＞需求）。

* **Q：server 開放 `0.0.0.0` 是否有安全風險？**
  A：USR 明確告知「家庭內使用，沒有安全性的問題。方便性優先」。dev server 為 dev-only 工具、不納入正式部署（[techStackStaticWeb] 靜態站部署不含 `server.mjs`）。仍保留 `process.env.HOST` 讓有需要者可限縮（D7）。

* **Q：`rotation` 是否影響既有 `targetBox` 對位計算？**
  A：`rotation` 與 `targetBox` 為獨立欄位（D1），對位框計算不受影響；D6 僅在渲染時加 CSS transform，不改 bounds 計算邏輯。

## 6. 產物分工（2plan 交棒 3code 之界線）

* **本 note**（設計決策與界線）：此檔，plan 階段完成。
* **`docs/design.md` 更新**（plan 階段完成）：新增 `paramWardrobeRotation`（`[etyCfg自訂modWardrobe組態]`）、`paramServerHost`（`[etyCfg自訂devServer組態]`）、intTest#55、intTest#56；更新 ＜IV.A＞ 建置指令說明 `HOST` 環境變數。
* **3code 產物**（code 階段）：
  1. `server.mjs`（D2、D7）
  2. `content-package/wardrobe/_shared/item-helpers.js`（D3）＋ `scripts/genWardrobeIndex.mjs`（D4）
  3. `tool/wardrobe-tuner.js`＋ `tool/wardrobe-tuner.html`（D5）
  4. `game-engine/render/paper-doll.js`（D6）
* **GATE plan**：`?selftest=data-audit` 沿用既有守門；intTest#55 驗旋轉讀寫回合、intTest#56 驗區網存取——code 收尾執行。

## 7. 實作結果（由 3code 填回）

（待填）
