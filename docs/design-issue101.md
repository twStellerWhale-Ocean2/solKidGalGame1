# 設計note — issue #101 對話方框統一（2plan→3code）

* **議題**：[#101](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/101) 對話方框統一高度＋選項一致性。
* **分支／PR**：`feat/issue101-unify-dialog` ／ PR #108。
* **型態**：UI/視覺一致性。Option A（同 #103 精神）：不動 `docs/design.md`（docLint 0），README 僅校準撥放鈕標示文字。

---

## 1. 重大現況更正（以活的 build 為準）

2plan 初稿曾據 `styles/adv.css` 基底（`.choice-button { background:#fff }`）假設「作答鈕為白底、需改深色並與音訊鈕統一」。**經實機 inspect（手機 375×812）更正——該基底被 `styles/mobile.css` 覆寫，實際產品早已一致**：

| 元件 | 實測現況 |
|---|---|
| 作答鈕 `.choice-button` | **深色半透明** `rgba(58,46,64,0.74)`（聚焦 `rgba(70,52,76,0.88)`）、白字 |
| 音訊鈕 `.choice-audio-button` | `rgba(70,52,76,0.66)`、白字 |
| adv-box 內容區 | `rgba(47,38,52,0.46)`、深色半透明 |
| 對話框高度 | quest（答題）`760px≈94dvh`、shop（購物）`720px≈89dvh`——**兩者皆 ~90dvh，非議題所述 1/3 vs 1/2** |

**判定**：#101 早於 #103；#103「手機常駐 HUD 重設計＋專家會審（底色家族統一、覆蓋層偏透明）」**已達成 #101 絕大部分一致性訴求**——作答鈕與音訊鈕已同屬深紫半透明家族、對話/購物高度已接近。原議題「按鈕太深、加強透明」「統一高度」之差異在現行產品已不顯著。

## 2. 本次範圍（USR 裁決：只做 En 標示）

USR 檢視上述實況後裁決 **#101 收斂為僅做 D3**，其餘視為已由 #103 達成：

* **D3 英文撥放鈕標示 `🔊` → `En`**，與中文鈕 `中` 成對：
  * 題目鈕 [index.html] `#speakPromptButton`。
  * 選項鈕 [game-engine/main.js] `makeAudioButton` 英文鈕。
* **不動**高度（D1）與按鈕底色（D2）——現況已一致，且強制 1/2 反而會擠壓立繪/商品格。
* README [README.md] 答題畫面段同步標示 `En`／`中`（產品手冊校準）。

## 3. 實作與驗證（3code，GATE）

* **實作**：`🔊`→`En` 兩處字串；不動任何 class/id、樣式、邏輯。
* **GATE §1 機器判定**：`tsc --noEmit` exit 0；`docLint -Level sol` 0；`repoLint` 0；`?selftest=voice`（intTest#24–27）／`help-reward` 皆 `passed:true`、console 0 error。
* **GATE §5（有畫面）**：實機 inspect（手機）——
  * 選項鈕 `En`／`中` 各 44×44、`overflow:false`；題目鈕 `En` 38×36 不溢出；與 `中` 成對對稱。
  * 未動測試所綁 `.choice-audio-button.zh`／`#speakPromptButtonZh`，故 selftest 無回歸。
  * 因僅標示字串變更、無版面/色彩異動，逐頁視覺以 #103 基線 `docs/test-summary.html` 為準，本案不重跑。
* **結論：可宣稱完成**（En 標示落地、機器判定全綠、無回歸）。
