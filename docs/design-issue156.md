# 設計note — issue #156 離開場景時收束正在播放的語音、不殘留跨場景（fix(voice)）

> 本檔為 2plan 設計note。本案對 `docs/design.md` 採 **USR-gated 輕修（spec# 編號不增減）**：精修 **spec#2** 條文、**solCase#12.3／sysCase#9.3（穩定語音播放）** 補「離場收束」facet、新增 **intTest#44**、＜IV＞spec#2 補觀察項；流程／實作落點與「淡出 vs 即時停止」之可行性折衷由本 note 承載，確切共同收口繫結點與 selftest 斷言留 3code 定案。意旨對應既有 **spec#2**（角色陪伴與場景沉浸；語音須明確降級且不中斷遊戲）。⚠️ 審查點見 §4：核心可行性結論為「Web Speech API 無法對進行中語句音量淡出 → 以即時 `cancel()` 作為『約 1 秒淡出』之明確降級」，obj 階段 USR 已預核此降級界定。

## 1. 現況量測（以產物為準）

* 語音由 [game-engine/main.js] 之 `speechManager` 統一承載：`speak()` 經 `SpeechSynthesisUtterance` 送 `window.speechSynthesis.speak()`（[game-engine/main.js] L3138 起）；停止經 `speechManager.stop(reason)`→`window.speechSynthesis.cancel()`（`stop` 定義 L3069、`cancel()` L3072）。
* **離場路徑未收束語音**：
  * `leaveScene(hotspot)`（[game-engine/main.js] L2072）→ `closeAdv()`；`closeAdv()`（L2839）僅關閉 ADV 冒險視窗、focus 還原，**未呼叫 `speechManager.stop()`**。
  * 場景切換 `openArea(areaId)`（L464）／世界地圖導航**亦未停止語音**。
  * 結果：於場景觸發之角色配音／公主朗讀，離場後仍持續播放至自然結束（或僅被下一句 `replace-last` 同 key 硬切），會在返回地圖／進入其他場景後殘留發聲。
* **既有唯一顯式停止**：`speechManager.stop("voice-off")`（L3519，語音開關關閉時）；另 `speak()` 之 `replace-last` 佇列於同 replayKey 時以 `window.speechSynthesis.cancel()`（L3115）硬切前一句。皆為**瞬間 `cancel()`、無音量漸變**。
* **平台能力（關鍵）**：Web Speech API 之 `SpeechSynthesisUtterance.volume` 於 `speak()` 當下固定、**無法對已在朗讀中的語句即時調整音量**；合成語音直接輸出至系統音訊、未經本案可控之 `AudioContext`／`GainNode`，故無 gain ramp 可掛；唯一中止手段為 `cancel()`（瞬間）。
* 既有語音診斷 `recordSpeechDiagnostic`（L3073／L3094／L3138）已記錄 source／cancelCalled／事件時間，可承載離場收束之 stop 來源。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public；本地自最新 `main`（含 #153／#159 merge `3d30e86`）開 `feat/issue156-voice-fade-on-scene-leave`、工作區乾淨。

## 2. 設計命題（USR 目標）

* 進場原始概念：「離開場景時，正在播放的語音應該 1 秒內漸變小聲停止」。
* 目標：離開場景（關閉場景對話、切換場景或返回地圖）時，正在播放的語音**即時收束、不殘留跨場景發聲**；收束聽感以「約 1 秒內平滑淡出至靜音」為**目標**，平台不支援時容許明確降級（obj 階段 USR 已預核）。

## 3. 設計決策（確切繫結點與斷言留 3code）

### D1：可行性結論 —「1 秒淡出」於 Web Speech API 不可原生達成 → 即時 `cancel()` 為明確降級

* `utterance.volume` 不可中途改、語音未經可控 `AudioContext`、僅 `cancel()` 可停（見 §1）。
* 「鏈接短 utterance 逼近淡出」需先 `cancel()` 失去播放位置、再以較低音量重唸剩餘文字 → 會**重複字詞或切在音節中**，屬 obj 魔鬼代言人明令避免之脆弱實作，**不採**。
* **決策**：離場收束＝**即時 `speechSynthesis.cancel()`**，作為「約 1 秒音量淡出」目標聽感之**明確降級**（呼應 spec#2「受瀏覽器語音能力限制時須明確降級且不中斷遊戲」）。交付之核心價值為「**消除跨場景語音殘留**」；不引入脆弱淡出 hack、不新增無作用之 fade-ms 死參數。

### D2：以離場共同收口統一收束（單一出口、冪等）

* 於離場之共同收口呼叫 `speechManager.stop("scene-leave")`（沿用既有 `stop(reason)`，新增 reason 標識）：
  * 主繫結點：`closeAdv()`（[game-engine/main.js] L2839）——`leaveScene()` 與場景內各離場路徑（Esc／離開鈕）皆收斂於此。
  * 視 3code 實機盤點，必要時補場景切換導航（`openArea()` L464／世界地圖進入）之收束，確保「畫面離開＝語音收束」無遺漏路徑。
* 收束須**冪等**（無語音播放時呼叫不報錯、不影響流程）、且**不影響**既有語音開關、`replace-last` 佇列、「公主朗讀作答→NPC 結語」串接（#93）與診斷紀錄。
* stop 來源寫入 `recordSpeechDiagnostic`（reason=`scene-leave`、cancelCalled=true），供 intTest#44 與成效觀察佐證。

### D3：範圍與相容

* **範圍**：[game-engine/main.js] `speechManager.stop` 之呼叫補強（離場共同收口 `closeAdv()`，必要時 `openArea()`／世界地圖導航）；不動 `speak()` 發聲、voice 選取、fallback、leading pad、語速倍率、佇列策略等既有行為。
* **相容**：不回退 #93（作答→結語串接）／#109（語速倍率、首字留白）／既有語音開關；純補「離場即收束」之生命週期綁定，不新增語音能力、不改題庫與互動。
* **協調**：與 #155（對話文案）無交集；與場景兩層動線（sysCase#11.5／intTest#43）一致——第一層離開（關冒險視窗回地圖）即觸發收束。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① 可行性降級確認（核心）**：Web Speech API 無法對進行中語句做音量淡出，本案以**即時 `cancel()` 收束**作為「1 秒淡出」之降級實作，交付核心為「不殘留跨場景」。obj 階段 USR 已預核「1 秒淡出＝目標聽感、平台不支援時容許折衷／降級」；plan 沿此定案。若 USR 仍要求可聞之漸弱，須另案評估改採非 Web Speech 之音訊路徑（架構級變更、超出本案範圍）。
* **② design.md 落點**：採 USR-gated 輕修——spec#2 條文＋solCase#12.3／sysCase#9.3＋intTest#44＋＜IV＞spec#2 觀察項；**spec# 編號不增減**（離場收束為「穩定語音播放」runAct 之 teardown facet，非新 spec/story）。docLint(sol)＝0 已驗。
* **③ 觸發邊界確認**：「離開場景」含關閉場景對話、切換場景、返回地圖；3code 以實機盤點確認共同收口涵蓋全部離場路徑、無漏停。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note ＋ `docs/design.md`（spec#2／solCase#12.3／sysCase#9.3／intTest#44／＜IV＞spec#2，docLint sol 0）＋ `README.md` ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。無新增契約引用（契約同步 N/A）。
* **3code 程式產物**（依本 note §3）：[game-engine/main.js]（`closeAdv()` 等離場共同收口呼叫 `speechManager.stop("scene-leave")`，必要時 `openArea()`／世界地圖導航；`stop` reason 標識；診斷紀錄）；[game-engine/testing/selftests.js]（離場收束自測）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`tsc`／`docLint`(sol 0)／`repoLint` 0；`node --check`；selftest 新增 `scene-nav`／語音相關自測涵蓋「場景內觸發語音→離場→`speechSynthesis.speaking` 為 false、診斷紀錄 stop 來源為 `scene-leave`、無跨場景殘留」，並 `chat`／`monkey` 全綠、console 0 error（對應 intTest#44）。
  * **GATE §5（實機 visual-qa／聽感抽查）**：於場景觸發較長語音後立即離場，確認語音即時停止、返回地圖／進入他場景無殘留發聲；語音開關與後續場景語音正常。
