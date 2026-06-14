# 設計note — issue #111 統一對話框機制（2plan）

* **議題**：[#111](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/111) 統一對話框機制：寬窄版型與對話/購物一致。
* **分支／PR**：`feat/issue111-unify-dialog-mechanism`。
* **型態**：UI/版型機制一致性。Option A（同 #101／#103）：不動 [docs/design.md]（docLint 0）、不動 [README.md]（無對外操作變更），視覺/版型決策以本設計note 承載。
* **USR 定調**：「高度不一代表機制不一」——不是把參數調成一樣，而是讓對話框機制在「寬版/窄版」×「對話/購物（含 wardrobe/refund）」皆一致。

---

## 1. 現況盤點（以活的 build 為準）

以 `?selftest=visual-qa&surface=…` 實機量測 `.adv-scene` 外框 computed height：

| 視口 | 對話（quest） | 購物（shop） | 落差 |
|---|---|---|---|
| 桌機寬版 1600×900 | `680px`（75.5%vh） | `860px`（95.4%vh） | **180px／~20%** |
| 手機窄版 375×812 | `760px`（93.6%vh） | `720px`（88.7%vh） | 40px／~5% |

**判定**：桌機寬版兩模式落差極大（180px）；手機窄版接近但仍非全等（#101 當初只 inspect 手機、見 760/720 接近即判「已統一」，正是漏掉桌機的根因）。故落差非單純數值，而是「外框高度由誰決定」缺乏單一機制。

**機制分歧根因（活 build 列舉 `.adv-scene` 外框 height 規則，跨檔跨斷點計 ~11 條，含重複與逐模式覆寫）**：

| 命中視口 | 來源 | 選擇器 | height |
|---|---|---|---|
| 桌機 quest（勝出） | [styles/mobile.css] | `.adv-scene` | `min(680px, 100dvh - 32px)` |
| 桌機 shop（勝出） | [styles/mobile.css] `@min-width:821px` | `.adv-scene:is([shop],[wardrobe],[refund])` | `min(860px, 100dvh - 32px)` |
| 手機 quest（勝出） | [styles/mobile.css] `@max-width:820px` | `.adv-scene` | `min(760px, 100dvh - 16px)` |
| 手機 shop（勝出） | [styles/mobile.css] | `.adv-scene[data-mode="shop"]` | `min(720px, 100dvh - 32px)` |
| 其餘冗餘/被蓋 | [styles/adv.css]／[styles/shop.css]／[styles/mobile.css] | `.adv-scene`、`:is([shop],[wardrobe],[refund])`、`@max-width:820px` 等 | `min(620px,70dvh)`（重複 3 次）、`min(860px,92dvh)`、`min(960px,100vh)`、`min(78dvh,680px)`、`calc(100dvh - 28px)` … |

* 同一個 [.adv-scene] 外框高度由 [adv.css]／[shop.css]／[mobile.css] 三檔、`base`／`max-width:820px`／`min-width:821px` 三斷點共約 11 條規則決定，且有 `min(620px,70dvh)` 重複 3 次、逐模式 `[data-mode="shop"]` 覆寫。此即「機制不一」之具體形貌。
* 內層已有部分 token 化跡象：`.adv-box` 用 `var(--adv-dialog-height)`，但**外框高度無單一來源**。

## 2. 設計決策

* **D1（核心・機制統一）**：[.adv-scene] **外框高度收斂為單一事實來源**，所有模式（`scene`／`hint`／`quest`／`complete`／`shop`／`wardrobe`／`refund`）於同一斷點共用同一高度；模式差異只表現在**內層內容版型**（`grid-template-rows`、[.adv-box]、商品格/試穿預覽），外框高度**不再逐模式覆寫**。
  * 作法：定義單一 CSS 變數（沿用既有命名風格，如 `--adv-scene-height`），於 `:root`／斷點各定義一次，`.adv-scene { height: var(--adv-scene-height) }`；移除 [shop.css] 的 `:is([shop],[wardrobe],[refund])` 外框高度覆寫、[mobile.css] `[data-mode="shop"]` 外框高度覆寫，及 [adv.css]／[mobile.css] 的重複/相衝 `.adv-scene` 高度宣告。
* **D2（目標值・單一響應式公式）**：外框採**單一響應式高度**，於各視口讓最吃高度的 shop 內容容得下、dialog 內容自然撐滿。**USR 定案（方案甲）：向 shop 近全高對齊**，基準 `min(860px, calc(100dvh - 32px))`，桌機寬版兩模式同為 ~860、手機窄版兩模式同為 ~780。**確切 px/dvh 上限與 dialog 內層自適應，留 3code 跨視口×跨模式 visual-QA 校準**（同 #101 既例）。
* **D3（範圍）**：涵蓋**所有模式**（scene/hint/quest/complete/shop/wardrobe/refund）與**所有斷點**（base／`min-width:821px`／`max-width:820px`／`max-width:480px` 連動內層）；一併清掉 §1 表列之重複與相衝規則，避免「改一處漏他處」重演。
* **不動**：[docs/design.md]（純功能 spec/case/test，無對話框版型落點，docLint 維持 0）、[README.md]（無對外操作流程變更）、選項按鈕底色家族（#103 既定，僅須確保收斂後不被打架）、DOM 結構與遊戲邏輯（純 CSS）。

## 3. USR 定案（審查點2，2026-06-14）

* **統一高度方向**：採**方案甲**——外框向 **shop 近全高**對齊（基準 `min(860px, calc(100dvh - 32px))`），兩模式同框。桌機 dialog 由 680 升至 ~860，**立繪舞台須自適應撐滿**（`--adv-character-stage-height`／portraits `minmax()`／垂直置中，3code visual-QA 校準），避免底部留白。
  * 未採方案乙（較矮、露出更多背景）：因其壓縮 shop 商品格/試穿預覽，且與現行近全高（#103 沉浸式）方向相反。
* **一致性涵蓋層級**：寬窄**共用同一條響應式公式**（`min()` 自動隨視口縮放），機制最單純、達「同視口內 dialog==shop」之核心。

## 4. 3code 實作與 GATE 指引

* **實作**：依 D1–D3 收斂外框高度為單一來源；逐一移除 §1 表列冗餘/相衝/逐模式外框高度規則；dialog 模式視需要調整 `--adv-character-stage-height`／portraits `minmax()`／垂直置中，使加高後的外框看來是刻意設計而非留白。
* **GATE §1（機器判定）**：`tsc --noEmit` 0；`docLint -Level sol` 0（design.md 未動）；`repoLint` 0；既有 `?selftest` 套件（含 voice/help-reward）`passed:true`、console 0 error；未動測試所綁 class/id。
* **GATE §5（有畫面・本案重點）**：實機 visual-QA **必涵蓋寬版（≥1366）＋窄版（375×812）兩視口 × 對話/購物（並抽驗 wardrobe/refund）**，逐一確認：
  * 同一視口內 dialog 與 shop 外框高度**全等**（量測 computed height 相等）。
  * shop 商品格/試穿預覽/tabs 不被裁切或過度捲動。
  * dialog 立繪與 [.adv-box] 在加高外框下版面協調、無異常留白。
  * 以量測數據（computed height 表）佐證，不可只靠單一視口目視（本議題即因單視口誤判而生）。
