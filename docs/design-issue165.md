# design-issue165 — 聊天完成回饋文案精修設計note

> 本檔為 issue #165 的 plan 設計note（非 design.md 正本、不受 docLint）。
> design.md 對應：**正文不動**——完成回饋 toast 文案在 design.md 抽象高度以下（design.md 僅述「顯示答對回饋」，未規範字串內容）；心情加值與護眼遊玩時間延長機制不變，spec#9 之延長可見性由 sysCase#7.5（HUD Play time 欄位）滿足、spec#11 之聊天／打工分流不變。
> 目的：鎖定「生活聊天完成回饋僅顯示 `+1 mood`」之文案改寫依據，避免日後回退為帶招呼語／遊玩時間提示的長句。

---

## 1. 修訂定位

本案為 **顯示層文案精修**，非機制變更（USR 於 obj 階段裁決「僅改顯示文字」，#165＜I＞）。生活聊天答對時，完成回饋訊息（feedback toast）由帶招呼語與遊玩時間提示的長句，收斂為僅顯示心情加值。

**保留（不動）：**

1. 心情加值機制：答對 `state.mood += CHAT_MOOD_REWARD`（=1）。
2. 護眼遊玩時間延長機制：`extendSession(...)` 於護眼上限（`paramPlayMaxMinutes`）內延長當次可玩時間（sysCase#11.1／#11.3）。
3. 延長量之可見性：人物資訊欄 Play time 欄位 `renderPlayTimeAllowance` 顯示 `15 +1😄 min`（sysCase#7.5、spec#9）——延長仍「看得見」，不依賴完成回饋。
4. 浮字 `burstText`：維持 `+1 mood`。
5. 打工(job)分支之 coins 回饋文案、聊天 0 coins 機制、護眼計時。

**變更（精修）：**

1. 完成回饋訊息 `feedbackText`（生活聊天分支）由
   - `addedMin>0`：`Nice chat! +1 mood, +1 min play time.`
   - 無延長：`Nice chat! +1 mood.`
   收斂為單一字串 `+1 mood`（移除「Nice chat!」招呼語與「+N min play time」遊玩時間提示）。

## 2. 目標文案

| 情境 | 現行 `feedbackText` | 目標 `feedbackText` |
|---|---|---|
| 聊天答對（有延長） | `Nice chat! +1 mood, +1 min play time.` | `+1 mood` |
| 聊天答對（達上限無延長） | `Nice chat! +1 mood.` | `+1 mood` |

> 目標字串與浮字 `burstText` 同為 `+1 mood`（無句末標點，與既有浮字一致）。

## 3. design.md 對齊（為何正文不動）

* **抽象高度**：design.md 以 sysCase#11.1（[docs/design.md] L241）描述「答對時依 paramChatMoodReward 累加心情值並請求 modState 延長當次遊玩時間」、intTest#36（L792）僅要求「顯示答對回饋」，皆未規範回饋字串內容；完成 toast 的確切措辭屬實作層，落在 design.md 抽象高度以下。
* **機制不變**：心情加值與遊玩時間延長照舊，spec#11（場景分流、雙回饋）語意不受影響。
* **spec#9 不違反**：spec#9「使聊天延長可被看見」由 sysCase#7.5（HUD Play time 欄位 `15 +N😄 min`）承載，非由完成回饋承載；本案不動 HUD，故延長仍可見。
* 結論：**design.md 正文（spec／sysCase／intTest／成效）均不需修訂**；本 note 為唯一改寫依據。

## 4. code 落地點（給 dev）

* [game-engine/main.js] `answerLesson` 之 `isChat` 分支（約 L2768–2775）：將 `feedbackText` 兩支三元賦值改為單一 `feedbackText = "+1 mood";`。
* `extendSession(...)` 之**呼叫須保留**（延長為其副作用、HUD 可見性所需）；`addedMin` 若改後不再被引用，可一併移除其捕捉變數（保留 `extendSession(...)` 呼叫本身）。
* `burstText`、`state.mood += CHAT_MOOD_REWARD`、打工分支與聊天 0 coins 一律不動。
* 連動：[docs/design-issue149.md] §4.2 提及「以簡短收尾語（Great work!／Nice chat!）替代」之描述，僅針對聊天分支之 `Nice chat!` 部分過時（打工 `Great work!` 不在本案）；dev 落地時於該處加註指向本 note 即可，不重寫 #149 note。

## 5. QA／驗收（給 dev）

* `node --check game-engine/main.js`、`pwsh scripts/repoLint.ps1 -Path .` 通過。
* selftest `?selftest=chat`：維持綠燈（既有僅驗 `chatReward.coins===0` 與心情累加，不斷言回饋字串；本案不破測）。
* 實機抽查：進入任一有生活聊天的場景，聊天答對一題——
  1. 完成回饋顯示 `+1 mood`，**不含** `Nice chat!`／`play time`。
  2. 浮字仍為 `+1 mood`；心情值 +1。
  3. 資訊欄 Play time 欄位仍顯示 `+N😄`（延長仍生效且可見）。
* 若 dev 認為值得，可於 `chat` selftest 補一條可選斷言（完成聊天後 `advFeedback` 文字為 `+1 mood`、不含 `Nice chat!`／`play time`）；非必要。
