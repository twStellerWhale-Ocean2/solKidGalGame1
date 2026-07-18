# 設計note — issue #376 存檔改為多角色 roster envelope（Increment 1／基礎）

> 本檔為 #376 之設計note（2plan）。承 epic #375（Option A、決策見 #375 留言）。**Increment 1＝基礎資料模型，無 UI，每帳號 roster 恆 size==1、行為與現況一致**。採 **additive active-mirror roster envelope**：本機存檔（localStorage）改為 envelope，**後端零改動**（雲端於 #377）。**不新增/修訂 spec**（spec 修訂歸 #381）。

## 1. 現況（以產物為準）
- 狀態為單一角色：`default-state.js defaultState`（flat：`activeCharacterId`、`playerName`、`coins`、`owned`、`outfit`、`diary`、`playLimit`…）。
- 本機每帳號一份 blob：`storage.js accountStateKey(id)=`${storageKey}:${id}``。
- 載入 choke point：`game-state.js loadAccountState(id)`＝`normalizeState(JSON.parse(blob))`；被**多處**呼叫，含載入他帳號做摘要（`select-screens.js accountSummary`:297、status ticker:267、`login-screen.js` 登入卡:562/578）——**故 loadAccountState 必須保持 pure、不得動 session**。
- 寫入 choke point：`persistState(state)`＝`localStorage.setItem(accountStateKey(activeId), JSON.stringify(state))`。
- `normalizeState(candidate)`＝per-character 正規化器（`{...base,...candidate}`＋逐欄正規化）。

## 2. 設計命題（承 ISSUE-READY）
- 本機存檔改為 envelope `{ schema:"2", activeCharacterSaveId, characters:{ <characterSaveId>:<characterState> }, …root mirror }`。
  - `characters` 之 key＝**新生成** `characterSaveId`（比照 `accounts.js newAccountId()`），非 `activeCharacterId`（兩角色可同膚）。
  - **root mirror**：envelope root 恆為合法 legacy 單角色 state（＝active character 之欄位）＋ envelope meta（`schema`/`activeCharacterSaveId`/`characters`）；使舊 image／`s.state->'playLimit'`／top-level coins／validateStateShape 讀 root 皆無需改動（#377 雲端用）。
- roster 恆 size==1（純 wrap），使用者無感。

## 3. 設計決策（plan 定向，3code 落地）

* **D1 helper 落於 `state/game-state.js`（單檔，不新增檔）**：`newCharacterSaveId()`（`ch-`＋亂數，仿 accounts）、`readRosterEnvelope(accountId)`（讀 blob→有 `characters` 物件＝envelope、無＝legacy wrap 成一員）、`wrapLegacyState(bare)`／`isEnvelope(obj)`、`freshRoster()`、`reassembleEnvelope(activeState, envelope)`（回寫含 root mirror）。
* **D2 `loadAccountState` 保持 pure、改讀 active slice**：`readRosterEnvelope(id)` → `normalizeState(characters[activeCharacterSaveId])`（found 不到 activeCharacterSaveId 退第一員）。回傳仍是單一角色 state，**所有現有呼叫者（含他帳號摘要）行為不變**（讀到 active 角色，等同今日）。不動 session。
* **D3 `persistState` 改 read-modify-write envelope（免 session.roster 穿線）**：
  1. 讀目前 stored envelope（`readRosterEnvelope(activeId)`；空/legacy 亦得一員 roster）。
  2. `characters[activeCharacterSaveId] = <clean active state>`（傳入的 `state`，不含 envelope meta）。
  3. 寫 `reassembleEnvelope(state, envelope)`＝`{ ...state, schema:"2", activeCharacterSaveId, characters }`（root mirror＝active 欄位＋meta）。
  > read-modify-write 使「寫 active 角色」**永不覆蓋其他角色**（自 storage 讀回其餘 slice），Increment 1 無需把 roster 穿線進 session（雲端 #377 另處理 GET-merge-PUT 或 session.roster）。
* **D4 idempotent 與相容鐵則**：`readRosterEnvelope` 對已是 envelope 者不再 wrap（守 `characters` key）；characters 之 slice 一律 clean（無 `schema`/`characters`/`activeCharacterSaveId`）——寫入時只在 root 疊 meta，slice 存乾淨角色 state，避免再讀時 meta 汙染。legacy `"1"` blob load→persist→reload **active state 無損 round-trip**。

## 4. 影響面（本增量範疇）
| 檔案 | 修改 | 決策 |
|------|------|------|
| `sysLingoWorld/modShell/game-engine/state/game-state.js` | 新增 roster helper；`loadAccountState` 改讀 active slice（保持 pure）；`persistState` 改 read-modify-write envelope | D1–D4 |
| `sysLingoWorld/modShell/game-engine/testing/selftests.js` | 新 `?selftest=roster` 套件：legacy round-trip 無損、wrap idempotent、stored blob＝envelope（1 員＋root mirror）、他帳號摘要 pure 不變 | D2–D4 |

**不改**：`default-state.js`（角色 state 形狀不變）、`storage.js`、`accounts.js`（帳號索引不變）、UI、雲端/後端（#377）、spec（#381）。

## 5. 驗收
- `?selftest=roster` 綠：legacy blob→load→persist→reload active state 深度相等；wrap idempotent（再 wrap＝no-op）；stored blob 有 `characters`（1 員）且 root 鏡射 active；多帳號摘要（他帳號 loadAccountState）讀值不變。
- 既有 `?selftest=auth`／`about`／`character-silhouette` 不回歸。
- CODE GATE（structure/doc/repoLint＋genVersion --check）綠。
