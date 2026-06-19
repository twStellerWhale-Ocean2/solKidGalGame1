# 設計note — issue #164 場景內層級切換即時收束前段語音、同場景造訪歡迎詞只播一次（fix(voice)）

> 本檔為 2plan 設計note。本案對 `docs/design.md` 採 **USR-gated 輕修（spec# 編號不增減）**：精修 **spec#2** 條文、**solCase#12.3／sysCase#9.3（穩定語音播放）** 補「場景內層級切換收束」facet、**solCase#14.4／sysCase#11.5（返回場景選單）** 補「歡迎詞每次造訪只播一次」facet、新增 **intTest#45／intTest#46**、＜IV＞spec#2 補觀察項；流程／實作落點與「造訪態旗標」之繫結點留 3code 定案。意旨對應既有 **spec#2**（角色陪伴與場景沉浸；語音須明確降級且不中斷遊戲），為 **#156（離場收束）之同機制延伸**。⚠️ 審查點見 §4。

## 0. 兩 facet 範圍界定（USR 已裁決）

* **Facet A — 場景內層級切換即時收束前段語音（改接當下話題）**：#156 已使「離開場景」即時收束語音；本案將收束時機擴及「**場景內第一↔二層切換**」——自第一層場景選單進入第二層子互動（chat／shop／打工等），或自第二層退回第一層場景選單時，前一情境正在播放之語音須即時收束、不跨層級殘留。收束聽感與降級界定沿用 #156（約 1 秒平滑收束為目標，Web Speech API 無法對進行中語句即時淡出時明確降級為即時 `cancel()`）。
* **Facet B — 同一場景「每次造訪」只播一次歡迎詞**：首次進入場景播放角色第一人稱招呼（`travelLine`，`source:"npc-scene"`），該次造訪內自第二層退回第一層場景選單**不重播**；離開場景回地圖後再次進入＝**新造訪、重新播放一次**。USR 裁決邊界為「**每次造訪一次**」（非跨造訪持久、不寫入存檔）。

## 1. 現況量測（以產物為準）

* 場景互動為兩層動線（sysCase#11.5）。第一層場景選單由 [game-engine/main.js] `openSceneAdv`（L2020）／`renderFirstLayerSceneActions`（L2045）／`handleFirstLayerSceneAction`（L2054）渲染；第二層各互動為 `openChatAction`（`mode:"chat"`）／`openShopDetail`／`openPracticeAction`／`openRefundDetail`／`openWardrobeDetail`／`openHintAdv`。
* **第一↔二層切換不經 `closeAdv()`**：進入第二層由 `handleFirstLayerSceneAction` 分派至各 opener；退回第一層走 `backToSceneMenu`（L2079）→`openSceneAdv`，答題完成「↩ Back」亦走 `backToSceneMenu`。此切換於同一 ADV 視窗內重繪、**不關閉視窗**，故不觸及 #156 之離場共同收口。
* **Facet A 缺口**：#156（已 merge）僅於 `closeAdv()` 發聲中時 `speechManager.stop("scene-leave")`（`stop`／`cancel()` 見語音模組）；語音開關關閉時 `stop("voice-off")`、`replace-last` 佇列同 replayKey 以 `cancel()` 硬切。**第一↔二層切換未呼叫任何 `speechManager.stop()`**——前一情境語音（NPC 寒暄開場、或「公主朗讀作答→NPC 結語」串接 L2836）跨層級殘留續播。
* **Facet B 缺口**：`openSceneAdv`（L2034）**每次呼叫**皆 `speak(elements.advLine.textContent, npcVoiceFor(hotspot), { source: "npc-scene" })` 播放歡迎詞；`backToSceneMenu`→`openSceneAdv` 復用同一入口返回第一層，故**每次返回第一層都重播歡迎詞**。`openSceneAdv` 目前無「首次造訪 vs 造訪內返回」之區別參數；公主房 `openRoomScene`（L2037）本就無歡迎詞 `speak`，不受影響。
* **平台能力（沿 #156）**：Web Speech API 之 `SpeechSynthesisUtterance.volume` 於 `speak()` 當下固定、無法對進行中語句即時調整音量，唯一中止手段為 `cancel()`（瞬間）。
* 既有語音診斷 `recordSpeechDiagnostic` 已記錄 source／cancelCalled／事件時間，可承載層級切換收束之 stop 來源。
* 連線檢查：目標 repo [solKidGalGame] Issue 讀寫正常、repo 為 public；#156（PR #162）已 merge 入 `main`，本地自最新 `main` 開 `feat/issue164-scene-voice-cut-and-once-welcome`、工作區乾淨。

## 2. 設計命題（USR 目標）

* Facet A：場景內第一↔二層切換（進入子互動或返回場景選單）時，正在播放之前段語音即時收束、不跨層級殘留，使語音「改接當下話題」。
* Facet B：同一場景每次造訪只播一次歡迎詞——首次進入播放，造訪內返回第一層不重播，離場再次進入重新播放一次。

## 3. 設計決策（確切繫結點與斷言留 3code）

### D1（Facet A）：層級切換收束＝沿用 #156 之 `speechManager.stop(reason)`、新增 reason、共同收口呼叫

* 於場景內第一↔二層切換之共同收口呼叫 `speechManager.stop("scene-switch")`（沿用既有 `stop(reason)`、新增 reason 標識）：
  * 進入第二層：`handleFirstLayerSceneAction` 分派各 opener 之前（單一收斂點）。
  * 退回第一層：`backToSceneMenu`（涵蓋第二層返回與答題完成「↩ Back」）。
  * 視 3code 實機盤點，必要時於各 opener 入口補強，確保「層級切換＝前段語音收束」無遺漏路徑。
* 收束須**冪等**（無語音播放時呼叫不報錯）、**不誤殺當下話題語音**（先收束前段、後由當下情境自然 `speak()`，須確保收束在當下 `speak()` 之前、避免時序競態把當下語音一併取消）；不影響語音開關、`replace-last` 佇列、「作答→結語」串接（#93）與診斷紀錄。
* stop 來源寫入 `recordSpeechDiagnostic`（reason=`scene-switch`、cancelCalled=true），供 intTest#45 與成效觀察佐證。
* 降級界定同 #156：以即時 `cancel()` 作為「約 1 秒淡出」目標聽感之明確降級（呼應 spec#2「受瀏覽器語音能力限制時須明確降級且不中斷遊戲」）。

### D2（Facet B）：歡迎詞以「造訪態旗標」控制、與 `openSceneAdv` 之 `speak` 解耦

* 引入「本次造訪是否已播歡迎詞」之造訪態旗標（in-memory、與當前造訪繫結、**不持久化存檔**）：
  * 首次自地圖進入場景：`openSceneAdv` 播放歡迎詞並記旗標。
  * 造訪內返回第一層（`backToSceneMenu`→`openSceneAdv`）：略過歡迎詞 `speak`，仍正常渲染第一層選單與 `advLine` 文字。
  * 離場（`closeAdv()`／`leaveScene()`／場景切換）：清旗標，使再次造訪重新播放一次。
* 確切繫結方式（旗標放 `openSceneAdv` 參數、或模組層 `state` 暫態、或 hotspot id 比對）留 3code 定案；原則為「渲染選單」與「播放歡迎詞」職責解耦，`backToSceneMenu` 之返回不再順帶觸發開場語音。
* Facet B 僅抑制「歡迎詞重播」，不影響第二層各互動本身既有語音觸發（shop greeting、作答朗讀、NPC 結語等），亦不影響無歡迎詞之公主房。

### D3：範圍與相容

* **範圍**：[game-engine/main.js] 之 `speechManager.stop` 呼叫補強（層級切換共同收口 `handleFirstLayerSceneAction`／`backToSceneMenu`）與 `openSceneAdv` 歡迎詞造訪態控制；不動 `speak()` 發聲、voice 選取、fallback、leading pad、語速倍率、佇列策略等既有行為。
* **相容**：不回退 #156（離場收束）／#93（作答→結語串接）／#109（語速倍率、首字留白）／既有語音開關；純補「層級切換即收束」與「歡迎詞每造訪一次」之生命週期綁定，不新增語音能力、不改題庫與互動。
* **協調**：與 sysCase#11.5／solCase#14.4（兩層動線、返回場景選單）一致——Facet A 收束、Facet B 不重播，合起來即「返回第一層＝安靜回到選單、不被同一句招呼重複轟炸」。

## 4. 審查點（⚠️ 待 USR 裁決）

* **① design.md 落點**：採 USR-gated 輕修——spec#2 條文＋solCase#12.3／sysCase#9.3（Facet A）＋solCase#14.4／sysCase#11.5（Facet B）＋intTest#45／intTest#46＋＜IV＞spec#2 觀察項；**spec# 編號不增減**（兩 facet 皆為既有「穩定語音播放」與「返回場景選單」之 facet，非新 spec/story）。docLint(sol)＝0 已驗。
* **② Facet A 觸發邊界確認**：「場景內層級切換」含「進入第二層子互動」與「自第二層退回第一層場景選單」；3code 以實機盤點確認共同收口涵蓋全部切換路徑、無漏停，且不誤殺當下話題語音。
* **③ Facet B 造訪邊界確認（USR 已裁決）**：「只播一次」＝**每次造訪一次**；離場再次進入重新播放。旗標與造訪繫結、離場即清、不持久化存檔、不跨 session 記憶。

## 5. 產物分工與 GATE 驗證計畫（交棒 3code）

* **本棒產物（plan）**：本設計note ＋ `docs/design.md`（spec#2／solCase#12.3／sysCase#9.3／solCase#14.4／sysCase#11.5／intTest#45／intTest#46／＜IV＞spec#2，docLint sol 0）＋ `README.md` ＜變更紀錄＞補一筆（2plan 初稿，待 dev／opr 校準）。無新增契約引用（契約同步 N/A）。
* **3code 程式產物**（依本 note §3）：[game-engine/main.js]（`handleFirstLayerSceneAction`／`backToSceneMenu` 等層級切換共同收口呼叫 `speechManager.stop("scene-switch")`；`openSceneAdv` 歡迎詞造訪態旗標控制；離場清旗標；stop reason 標識；診斷紀錄）；[game-engine/testing/selftests.js]（層級切換收束自測 intTest#45、歡迎詞每造訪一次自測 intTest#46）。
* **3code 完成判定**：
  * **GATE §1（機器判定）**：`tsc`／`docLint`(sol 0)／`repoLint` 0；`node --check`；selftest 涵蓋——(A)「場景內觸發語音→進入第二層或返回第一層→`speechSynthesis.speaking` 為 false、診斷 stop 來源為 `scene-switch`、無跨層級殘留」（intTest#45）；(B)「進入場景→入第二層→返回第一層」序列歡迎詞 `speak`（`source:"npc-scene"`）僅 1 次、「離場→再進入」重置為可再播 1 次（intTest#46），並 `chat`／`scene-nav`／`monkey` 全綠、console 0 error。
  * **GATE §5（實機 visual-qa／聽感抽查）**：於第一層觸發歡迎詞後進入第二層、再返回第一層，確認前段語音即時停止、返回第一層不重播歡迎詞；離場再進入則重新播放一次；語音開關與後續場景語音正常。
