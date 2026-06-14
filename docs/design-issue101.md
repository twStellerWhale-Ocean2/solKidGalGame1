# 設計note — issue #101 對話方框統一（2plan）

* **議題**：[#101](https://github.com/twStellerWhale-Ocean2/solKidGalGame/issues/101) 對話方框統一高度＋選項一致性。
* **分支／PR**：`feat/issue101-unify-dialog`。
* **棒次／型態**：2tech-devSet-2plan；本議題屬 **UI/視覺一致性（CSS＋少量標示字串）**。
* **落點 Option A（同 #103 精神）**：純視覺呈現精修，**不動 `docs/design.md`**（design.md 為功能 spec/case/test，無對話框高度/按鈕底色之落點，docLint 維持 0），**不動 `README.md`**（功能描述未變；撥放鈕標示由 3code 收尾校準）。本文件為本棒可審設計產物；3code 據此實作並產**逐畫面視覺 test-summary**（本議題有畫面，適用 GATE §5 鏡頭 C）。

---

## 1. 現況（以產物為準）

| 元件 | 現況 | 檔案 |
|---|---|---|
| 對話框（對話模式） | `.adv-scene height: min(620px, 70dvh)`；內含角色立繪舞台 `--adv-character-stage-height: min(590px, 66vh)` | `styles/adv.css` |
| 對話框（購物/換裝/退款模式） | 同一 `.adv-scene` 被覆寫為 `height: min(860px, 92dvh)` | `styles/shop.css` |
| 作答鈕 `.choice-button` | **白色不透明** `background:#fff`、深色文字；correct/wrong 為綠/紅底 | `styles/adv.css` |
| 音訊鈕 `.choice-audio-button`（En/中） | #103 設為**深色半透明** `rgba(70,52,76,0.66)`、白字；註解自稱「沿用 .choice-button 深色半透明家族」 | `styles/adv.css` |
| 購物特賣框 `.shop-feature` | 粉色漸層不透明底 `#fff7fb→#ffe2ee` | `styles/shop.css` |
| 撥放鈕英文標示 | `🔊`（題目鈕 `#speakPromptButton`、選項鈕 `makeAudioButton`） | `index.html` / `game-engine/main.js` |

**癥結**：①同一 `.adv-scene` 兩種模式相依高度（70dvh vs 92dvh），違反一致性；②`.choice-button`（白不透明）與 `.choice-audio-button`（深半透明）底色語言不一致——#103 註解已宣稱兩者同家族，實際卻不同，即 USR 所指「原本就該同色卻不一致」；③英文鈕 `🔊` 與中文鈕 `中` 不成對。

## 2. 設計決策（USR 已核可方向，本棒釘定具體做法）

* **D1 單一對話框、統一高度**：移除 `.adv-scene` 的模式相依高度差，對話與購物/換裝/退款共用**單一高度**，目標約**視窗 1/2**。
  * ⚠️ **容性權衡（3code 須 visual-QA 驗）**：對話模式含角色立繪（現 66vh）、購物模式含試穿娃娃＋商品格（`.compact-shop max-height:235px`）。硬設 `50dvh` 可能裁切立繪或壓縮商品格，故採「統一高度 + 內層自適應」：以 `min/clamp` 收斂於約 50dvh，並同步調整 `--adv-character-stage-height` 使立繪不溢出；若 50dvh 仍無法同時容立繪與商品格，3code 以預覽截圖提報 USR 取捨（略放寬高度 vs 縮內容），不自行硬切。
* **D2 單一選項按鈕底色家族**：以 #103 既有 `.choice-audio-button` 之 **`rgba(70,52,76,·)` 深色半透明家族**為唯一「選項按鈕底色家族」（不另立新 token）。
  * `.choice-button`（作答）改用此家族（半透明透出背景、文字改淺色），落實 USR「兩鈕同色」與原議題「加強透明、不遮背景」。
  * `.shop-feature` 購物底色改用同家族。
  * `correct`/`wrong` 狀態於新深底上維持可辨（保留綠/紅語意，調整為深底相容的邊框/文字）。
  * ⚠️ **可讀性權衡（3code 須 visual-QA 驗）**：本遊戲核心任務是兒童**讀英文答案**；半透明深底疊在場景上不得犧牲答案文字對比。3code 須確保作答鈕文字對比達可讀（必要時加深底透明度或加文字陰影/底襯），以「可讀 > 透出背景」為優先。
* **D3 英文鈕標示 `🔊` → `En`**：與中文鈕 `中` 成對；同步處理 `index.html`（`#speakPromptButton`）與 `game-engine/main.js`（`makeAudioButton` 英文鈕）兩處。注意 `.choice-audio-button min-width:44px` 須容 `En` 兩字並與 `中` 視覺對稱。

## 3. 影響面與驗證（交棒 3code）

* **異動檔案（預估）**：`styles/adv.css`、`styles/shop.css`、（可能）`styles/mobile.css`；`index.html`、`game-engine/main.js`（撥放鈕標示字串）。不動遊戲邏輯與 DOM 結構。
* **受影響畫面（visual-QA 逐畫面）**：ADV 對話、Help、商店、換裝、退款（高度與底色）；答題畫面（作答鈕＋En/中 鈕）。
* **機器判定**：`tsc`／`docLint`／`repoLint`／既有 selftest 應維持 0 error（純樣式＋標示字串，不動測試所綁的 class/id：`.choice-audio-button.zh`、`#speakPromptButtonZh` 不變）。
* **GATE §5**：本議題有畫面，3code 產**逐畫面視覺 test-summary**（修前/修後截圖），覆蓋 D1 容性、D2 可讀性、D3 對稱。

## 4. 待 USR 審查（審查點2）

* 確認 D1～D3 具體做法（尤其 **D2 作答鈕改深色半透明**屬明顯視覺轉變，與原本白底差異大）。
* 確認兩處權衡之優先序：D1「容立繪/商品格 > 硬切 1/2」、D2「答案可讀 > 透出背景」。
* 核准後交棒 3code 實作＋逐畫面 visual-QA。
