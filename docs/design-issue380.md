# 設計note — issue #380 存檔 Markdown 支援 roster（Increment 5）

> 承 epic #375 Increment 5。存檔 `.md` 匯出/匯入支援多角色 roster。決策見 #375（匯入 add-vs-replace 提示；匯出整個 roster）。不改後端/spec（#381）。

## 設計決策
- **D1 匯出整個 roster**（persistence.buildSaveMarkdown）：`reassembleEnvelope(session.state, getActiveRoster())` 併入 active 最新變動，`buildStateSaveMarkdown(state, envelope)` 之 payload 改為整個 envelope（標頭仍取 active）。使 `.md` 備份含所有公主、不遺失。
- **D2 game-state.buildSaveMarkdown(state, envelope=null)**：給 envelope 則 payload＝envelope；否則單一 state（相容）。
- **D3 匯入判別（save-load.loadMarkdownText）**：payload 有 `characters` 物件＝roster envelope → `importRosterMode`（提示 ADD/REPLACE）→ `onRosterLoaded`；否則 legacy 單一 → `onStateLoaded`＋persist（更新 active、read-modify-write 保留其他公主）。
- **D4 匯入套用（persistence）**：`importRosterReplace`（以檔案 roster 取代，active＝檔案 active）／`importRosterAdd`（各公主配新 saveId 加入、守 ROSTER_CAP）；經 `commitRoster`（雲端/本機）。
- **D5 措辭**：`confirmImport` 由「OVERWRITE」改中性「will change this player's saved princesses」（roster 可為 add）。

## 影響面
| 檔案 | 修改 |
|------|------|
| `state/game-state.js` | `buildSaveMarkdown(state, envelope)` payload 支援 envelope |
| `system/persistence.js` | buildSaveMarkdown 併 roster；importRosterMode/onRosterLoaded/importRosterReplace/importRosterAdd；confirmImport 措辭 |
| `system/save-load.js` | loadMarkdownText 判別 envelope→prompt→route；controller 加 importRosterMode/onRosterLoaded |
| `app/select-screens.js` | 匯出 getActiveRoster/commitRoster |
| `testing/selftests.js` | roster 套件補 #380（匯出含 2 員、匯入 legacy/replace/add）；save-load 套件 mock confirm（MD 現含 envelope、round-trip 採 replace） |

## 驗收
- `?selftest=roster` 綠（#380：匯出含所有公主、匯入 legacy 更新 active 保留他角色、envelope replace/add）。
- `?selftest=save-load` 綠（envelope round-trip、coins 保留）；`auth`/`about` 不回歸；無 console error。CODE GATE 綠。
