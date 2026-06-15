# 設計note — issue #120 對話框內層底框（`.adv-box`）高度一致

> 本檔為 2plan 設計note（**Option A**：本議題屬 UI/版型一致性，`docs/design.md`（功能 spec/case/test）無對應落點，故 **design.md 與 README 不動、docLint 0**；視覺/版型決策以本 note 承載，確切像素/響應式值留 3code visual-QA 定案）。承接 #111（已統一**外框** `.adv-scene`）。

## 1. 現況量測（以產物為準，活 build）

實機 visual-qa 量測（`?selftest=visual-qa&surface={shop-scene|shop}&place=royalCloakRoom`），`.adv-scene`（外框）與 `.adv-box`（內層底框）之 computed 高度：

| 視口 | 模式 | 外框 `.adv-scene` | 內層底框 `.adv-box` |
|---|---|---|---|
| 桌機 1280×800 | 場景（scene） | 768 | **260** |
| 桌機 1280×800 | 購物（shop） | 768 | **368** |
| 手機 375×812 | 場景（scene） | 780 | **316** |
| 手機 375×812 | 購物（shop） | 780 | **316** |

* **外框 `.adv-scene`**：每視口內兩模式等高（桌機 768／手機 780）＝ #111 單一來源 `--adv-scene-height`（`styles/adv.css` L27）仍有效。
* **內層底框 `.adv-box`**：**桌機 場景 260 vs 購物 368（差 108px）**；**手機 兩模式皆 316（完全一致）**。
* 結構：`.adv-box` 為內容面板（`styles/adv.css` L129；半透明、帶邊框、`overflow:hidden`），**下緣以 margin 貼齊外框底**，高度由內容（場景＝1 句＋3 鈕；購物＝1 句＋商品格）向上長高。

## 2. 根因

* `.adv-box` 在**桌機寬版無統一高度收斂**（隨內容跑）；購物（含 wardrobe／refund）對 `.adv-box` 的高度收口**只寫在手機 media query**（`styles/mobile.css` L1723 `max-height: min(360px,50dvh)`、L1832 `max-height: 48dvh`），桌機僅 `styles/shop.css` L103 給 `padding-bottom`。
* 故「窄版收口、寬版放任」＝同一 `.adv-box` 元素跨模式×跨斷點走不同高度分支。#111 收斂止於外框、未及內層；#101 當年以單一手機視角誤判已統一。

## 3. 設計決策

### D1：內層底框單一高度來源（消除模式相依）

* 比照 #111 外框做法，於 `.adv-scene` 立**單一內層高度來源**（如 CSS 變數 `--adv-box-height`），`.adv-box` 一律 `height/max-height: var(--adv-box-height)`，**全 `data-mode` 共用、不再逐模式覆寫**。
* **可驗證不變式（設計契約）**：**同一視口下，`.adv-box` 高度於所有模式（scene／hint／quest／complete／shop／wardrobe／refund）必須相同**。允許桌機與手機採不同值（如外框 768 vs 780 之先例），但**禁止同視口內因模式而異**。

### D2：統一方向與值（USR 定案 2026-06-15：向購物拉高對齊）

* 桌機**向內容較多的購物拉高對齊**：場景 `.adv-box` 由 260 拉高至與購物一致（~368 區間之響應式值），避免壓縮商品格／試穿預覽；場景面板一致變高、接受下方留白。與 #111「外框向 shop 近全高對齊」同philosophy。
* 確切值/響應式公式（固定 px、`dvh` 式、或佔外框比例）留 **3code visual-QA** 定案；建議採類 `--adv-scene-height` 之 `min(px, dvh 式)` 響應式，桌機使 scene/shop 同高且 ≥ 購物內容所需。手機現已 316 一致，折入同一來源公式（值可不同、機制統一）。

### D3：涵蓋範圍與相容

* 全模式（scene／hint／quest／complete／shop／wardrobe／refund）× 全斷點（base／`max-width:820px`／`min-width:821px`）；通盤檢視 `styles/adv.css`、`styles/mobile.css`、`styles/shop.css` 對 `.adv-box`（及內層 `.compact-shop`／`.shop-area`）之高度規則，補齊桌機、對齊窄版。
* 與 #111 外框來源 `--adv-scene-height`、#103 選項按鈕底色家族協調，以單一規則收口、不另立分歧值；不動 DOM 與遊戲邏輯（純 CSS）。

## 4. 審查點（USR 已定案 2026-06-15）

* **① 統一方向**：**向購物拉高對齊**——桌機場景 `.adv-box` 由 260 拉高至與購物一致（~368 區間之響應式值），商品格不被壓、場景面板一致變高（下方容留白）。
* **② 一致性層級**：採**最完整一致性作法**——不僅收斂 `.adv-box` 外緣高度，並一併規範內層容性（商品格捲動區 `.compact-shop`、立繪舞台 `.adv-portraits`、選項列 `.choice-list`），使各模式於同一高度面板內皆不裁切、不溢出、結構一致。此為 3code 完成判定之一部分（見 §5）。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **不動** `docs/design.md`（docLint sol 0）與 `README.md`（無對外行為變更）。
* 3code 完成判定：
  * GATE §1：`tsc`／`docLint`／`repoLint` 0；`?selftest=monkey`／`save-load` passed、console 0。
  * GATE §5（有畫面）：實機 visual-qa **寬版＋窄版 × 場景/購物（及 wardrobe/refund）** 量測 `.adv-box` 同視口同高（差 0）；商品格不被裁切、無 overflow、場景面板無過度留白；與 #111 外框、#112 emoji 徽章共存。
