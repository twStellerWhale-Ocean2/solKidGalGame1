# 設計note — issue #377 雲端存檔 PUT 整個 roster envelope＋自動遷移（Increment 2）

> 承 epic #375（Option A）Increment 2。**雲端 round-trip；仍無多角色 UI（roster size==1）**。**後端/DB 零改動**（`save` 表 `account_id` PK、opaque JSONB、`updated_at` 409 optimistic lock 不變）。不改 spec（#381）。

## 1. 現況
- `cloud-sync.js flushCloudSave` PUT `{ state: session.state, schemaVersion:"1", baseUpdatedAt }`（單一角色）。
- `cloudLogin`/`cloudResume` 回 `{ state: save.body.state }`，呼叫端 `session.state = normalizeState(state)`；`main.js onConflict` 亦 `normalizeState(serverSave.state)`。
- `syncRecentSummary` 投影 `session.state`（active 角色）。

## 2. 設計決策
- **D1 game-state.js 抽 pure core**：`rosterEnvelopeOf(parsed)`（wrap/idempotent，本機與雲端共用）、`activeCharacterStateOf(candidate)`（回 active 角色 raw 切片）；`readRosterEnvelope` 改用之；`reassembleEnvelope` 匯出。
- **D2 cloud-sync 保留 `cloud.roster`**：`cloudLogin`/`cloudResume` 設 `cloud.roster = rosterEnvelopeOf(serverState)`、回 `activeCharacterStateOf(serverState)`（unwrap，呼叫端不變）；`cloudRegister`/`cloudLogout` 清 `cloud.roster`。
- **D3 PUT 整個 envelope（read-modify-write）**：`flushCloudSave` 送 `reassembleEnvelope(session.state, cloud.roster || rosterEnvelopeOf(session.state))`、`schemaVersion:"2"`；成功後 `cloud.roster = envelope`。**只更新 active 角色、永不覆蓋其他角色**；size==1 等同 wrap。root mirror 使 admin `listAccounts`（`s.state->'playLimit'`／top coins）／`validateStateShape`／rollback 舊 image 讀值不變。
- **D4 conflict 重載 unwrap**：`main.js onConflict` 改 `normalizeState(adoptServerSaveState(serverSave.state))`（cloud-sync 匯出，unwrap＋保留 roster）。
- **D5 自動遷移**：既有雲端帳號（legacy `"1"`）首次 GET 得 bare state、首次 flush 即 PUT envelope（schema `"2"`）；零 server 遷移。

## 3. 影響面
| 檔案 | 修改 |
|------|------|
| `state/game-state.js` | 抽 `rosterEnvelopeOf`/`activeCharacterStateOf`、匯出 `reassembleEnvelope` |
| `system/cloud-sync.js` | `cloud.roster`；login/resume unwrap＋保留；flush PUT envelope（schema "2"）＋成功同步 roster；register/logout 清；匯出 `adoptServerSaveState` |
| `main.js` | onConflict unwrap（`adoptServerSaveState`） |
| `testing/selftests.js` | `auth` 套件補 #377 斷言（PUT 為 1 員 envelope＋root mirror coins＋active 切片） |

**不改**：modApi/DB/schema、UI（#378）、spec（#381）、本機 persist（#376 已就）。

## 4. 驗收
- `?selftest=auth` 綠（含 #377：雲端 PUT＝1 員 roster envelope、root mirror 保 top coins、active 切片一致；migration 首寫升版）。
- `?selftest=roster`／`accounts`／`save-load` 不回歸；無 console error。CODE GATE（structure/doc/repoLint＋genVersion --check）綠。
