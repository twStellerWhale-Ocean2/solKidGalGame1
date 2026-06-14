# 設計note — issue #112 NPC 表情徽章改用 emoji 心情符號（2plan→3code）

* **議題**：[#112](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/112) 對話場景 NPC 立繪右上角表情徽章，由文字符號（`!`／`OK`／`?`）改為 emoji 心情符號。
* **分支／PR**：`feat/issue112-emoji-mood-badge` ／ PR #113。
* **型態**：UI／視覺。Option A（同 #101／#103 精神）：不動 `docs/design.md`（docLint 0）；`README.md` 未描述此徽章、不需校準。

---

## 1. 現況（以活的 build 為準）

* 徽章元件 [styles/adv.css] `.adv-npc::after`：圓形 `34×34`、定位 `top:10px; right:10px`（NPC 立繪右上角）、底色 `rgba(169, 63, 103, 0.9)` 玫瑰、`color:#fff`、白框 `border:2px solid #fff`、`border-radius:50%`、`font-weight:900`。
* 三態 `content`（由 `data-expression` 切換）：
  * `normal` → `"!"`
  * `happy` → `"OK"`（綠底 `rgba(45, 114, 89, 0.9)`、`font-size:0.72rem`）
  * `surprised` → `"?"`
* 驅動：[game-engine/main.js] `setExpressions(princess, npc)` → `advNpcPortrait.dataset.expression`；觸發時機——開場與作答中 `normal`、答錯 `surprised`、答對 `happy`。
* [styles/mobile.css] 僅覆寫 `.adv-npc` 立繪之位置／尺寸（手機立繪移至底部、`right:42px`），**未覆寫 `.adv-npc::after` 徽章**（唯一 `::after` 觸及為 `prefers-reduced-motion` 之動畫關閉）→ adv.css 徽章樣式於手機仍有效。
* 僅在場景有 NPC 時顯示（無 NPC 之 `.npc-none` 為 `display:none`），故「只有部分場景」右上角才有此徽章。

## 2. 設計決策（本次範圍）

### D1：三態字符 → emoji 心情符號（USR 核准 2026-06-14）

| 狀態（`data-expression`） | 現況 | 改為 | 語意 |
|---|---|---|---|
| `normal` | `!` | 🙂 | 中性聆聽（預設、作答中） |
| `happy` | `OK`（綠底） | 😄 | 答對、正向肯定 |
| `surprised` | `?` | 😮 | 答錯、「咦？再試一次」 |

### D2：徽章樣式微調（容納 emoji）

* 提高 `font-size` 使 emoji 於圓內清晰可辨（emoji 不吃 `color`，原 `color:#fff`／`font-weight` 對 emoji 無效）。
* 底色由「玫瑰／綠」實心，改為中性淺色泡泡（emoji 自身已表色與情緒；`happy` 不再需要綠底）；保留圓形＋白框作為「心情泡泡」。
* 維持 `position`／`top`／`right`／`border-radius`／尺寸既有結構；**不動** DOM、`data-expression` 介面、[game-engine/main.js] 邏輯與觸發時機。
* **具體字級、底色與是否保留色環，最終以 3code visual-qa（手機 375×812）逐態定案**（避免全彩 emoji 與場景對比不足或顯雜）。

### 不在範圍

* [公主] 立繪（paper-doll）臉部表情——另一套美術機制（[game-engine/render/paper-doll.js]），非本徽章。
* 新增第四種表情（NPC 僅用 `normal`／`happy`／`surprised` 三態）。

## 3. 影響與相容

* 純 CSS（[styles/adv.css]：三條 `content` ＋徽章底色／字級），不動邏輯與結構。
* 既有測試：[game-engine/testing/selftests.js] 僅以 `rectFor(".adv-npc")` 取幾何，未斷言徽章 `content` → 換字不回歸。
* 風險：emoji 跨平台字形差異（Windows／Android／iOS）、泡泡底色與場景背景對比 → 由 3code visual-qa 逐畫面驗。

## 4. 實作與驗證（3code，GATE）

* **實作**：[styles/adv.css] `.adv-npc::after` 三態 `content` 改 🙂／😄／😮；底色玫瑰／綠 → 中性白泡泡 `rgba(255, 255, 255, 0.92)`、`font-size:1.25rem`（20px）、`line-height:1`、加 `box-shadow` 提升與場景對比；移除對 emoji 無效的 `color:#fff`／`font-weight:900` 與 happy 綠底。**僅改字符與徽章內樣式，未動徽章與立繪的 `position`／尺寸**，故 RWD 定位與可見性與改動前一致。**未動** DOM、`data-expression` 介面、[game-engine/main.js] 邏輯與觸發時機。
* **GATE §1 機器判定**：`tsc --noEmit -p jsconfig.json` exit 0；`docLint -Level sol` 0（design.md 未動）；`repoLint -Path .` 0；`?selftest=voice` `passed:true`／`errors:[]`（答題流程＝驅動三態 `setExpressions` 的路徑，無回歸）；console 0 error；`npm audit` 不適用（純靜態無相依）。
* **GATE §5 視覺（聚焦變更元件）**：Playwright(chromium) 逐態截圖確認 🙂／😄／😮 於白泡泡內正確著色、置中、不溢出、與場景對比足夠；computed-style 三態 `content`＝🙂／😄／😮、`font-size:20px`、`background:rgba(255, 255, 255, 0.92)`、`34×34`。其餘畫面無版面／色彩異動，沿用 #103／#105 基線 `docs/test-summary.html`、不重跑逐頁。
* **結論：可宣稱完成**（emoji 三態落地、機器判定全綠、無回歸、視覺確認著色正確）。
