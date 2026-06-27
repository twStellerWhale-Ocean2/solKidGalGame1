# 設計note — issue #282 衣物調整介面英化、版面放大置中並調降內容透明度

> 本檔為 #282 之設計note（2plan 階段）。本案為既有 [solKidGalGame方案] 之**介面微調（UI-only，玩家感知的外觀改善）**：
> 1. `#advAdjustBtn` 浮動按鈕文字由「調整」改為英文 `Adjust`。
> 2. `.adjust-overlay-content` 版面放大 25%（preview 欄寬 `min(40vw,260px)→min(50vw,325px)`；控制欄 `min-width:190px;max-width:260px→min-width:238px;max-width:325px`；手機直向版 preview `min(60vw,210px)→min(75vw,263px)`）。
> 3. `.adjust-overlay-content` 背景透明度 `0.90→0.75`，呈半透明效果。
>
> 三項修改均獨立，純 HTML 文字與 CSS 數值調整，不涉及 JS 邏輯。落於既有 **spec#11**（玩家可調整衣物對位）之 UI 細調；**不新增、不修訂任何 spec**（承 ISSUE-READY）。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

* **`index.html:275` 按鈕文字為中文**：`<button ... id="advAdjustBtn" hidden>調整</button>`。
* **`styles/adjust-overlay.css` 現行尺寸**：
  * `.adjust-overlay-preview` → `width: min(40vw, 260px)`（手機版 `min(60vw, 210px)`）
  * `.adjust-overlay-controls` → `min-width: 190px; max-width: 260px`（手機版 `max-width: 90vw`）
  * `.adjust-overlay-content` → `background: rgba(248, 220, 238, 0.90)`

## 2. 設計命題（USR 目標，承 ISSUE-READY）

* **spec#1-英化按鈕**：`#advAdjustBtn` 文字改為 `Adjust`。
* **spec#2-放大 25%**：overlay content 尺寸整體放大 25%，手機版同步。
* **spec#3-半透明**：overlay content 背景透明度 `0.90→0.75`。

## 3. 設計決策（plan 定方向，3code 落地）

* **D1 按鈕文字**：`index.html:275` 直接替換文字節點，無任何邏輯耦合。
* **D2 版面放大**：僅修改 CSS 數值；`max-height: 96vh` 不變，放大後仍受此限制，不會溢出畫面。手機版 `@media (max-width: 460px)` 同步調整。
* **D3 透明度**：`.adjust-overlay-content background` alpha 由 `0.90` 降至 `0.75`，讓後方遊戲場景隱約透出；`backdrop` 的 `rgba(20,10,18,0.66)` 不動。

## 4. 影響面

| 檔案 | 修改內容 | 決策 |
|------|---------|------|
| `index.html` | `#advAdjustBtn` 文字「調整」→`Adjust` | D1 |
| `styles/adjust-overlay.css` | preview 寬度、controls 寬度、content 背景透明度；手機版同步 | D2、D3 |
| `docs/design.md` | 新增 intTest#59 | plan |

## 5. 魔鬼代言人

* **Q：放大後手機小螢幕會不會截斷？** A：`max-height:96vh` 不動，overflow 由現有捲軸處理；手機版 preview `min(75vw,263px)` 在 360px 裝置為 180px，合理。
* **Q：透明度降低後文字可讀性是否下降？** A：`0.75` 仍保有足夠對比（深色文字配淺粉背景），backdrop 的深色 overlay 也形成雙重遮蔽，可讀性無虞。

## 6. 產物分工（2plan 交棒 3code 之界線）

* **本 note**：此檔，plan 階段完成。
* **`docs/design.md` 更新**：新增 intTest#59 驗證上述三項 UI 變更（plan 階段完成）。
* **3code 產物**：
  1. `index.html`（D1）
  2. `styles/adjust-overlay.css`（D2、D3）

## 7. 實作結果（由 3code 填回）

（待填）
