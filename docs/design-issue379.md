# 設計note — issue #379 刪除公主＋last-remaining 守門＋roster 上限（Increment 4）

> 承 epic #375 Increment 4。決策見 #375：守最後一員、roster 上限 ~6、二次確認。不改後端/spec（#381）。

## 設計決策
- **D1 `ROSTER_CAP=6`**（game-state.js）：每帳號角色上限。
- **D2 `deleteActiveCharacter()`（select-screens.js）**：守 `ids.length<=1` 不可刪（最後一員）；刪 active 後切到其餘首員（`normalizeState`＋`carryAccountClock` 帳號時鐘 account-scoped）→ commit roster → render。
- **D3 `rosterAtCap()`**：roster 達上限判斷（供 UI 停用 Add）；`startAddCharacter`／`confirmAddCharacter` 亦守上限（達上限不新增）。
- **D4 UI**：〈Your princesses〉actions 加 `removeCharacterButton`（danger，二次 `window.confirm`）；`renderCharacterRoster` 於達上限停用 Add、僅一員時隱藏 Remove（守最後一員）。

## 影響面
| 檔案 | 修改 |
|------|------|
| `state/game-state.js` | `ROSTER_CAP` |
| `app/select-screens.js` | `deleteActiveCharacter`／`rosterAtCap`；add 守上限 |
| `render/hud.js` | renderCharacterRoster 停用 Add／隱藏 Remove |
| `app/{bind-events,elements}.js` | 接線 removeCharacterButton（確認）；註冊 |
| `index.html`／`system.css` | Remove 按鈕（danger、預設 hidden） |
| `main.js` | 曝 deleteActiveCharacter／rosterAtCap（自測） |
| `testing/selftests.js` | roster 套件補 #379：刪除非破壞、守最後一員、上限 |

## 驗收
- `?selftest=roster` 綠（含 #379：刪 active 切其餘、他角色保留、守最後一員 no-op、6 員達上限）。
- `about`/`auth`/`accounts`/`character-silhouette` 不回歸；無 console error；設定達上限停用 Add、單員隱藏 Remove。CODE GATE 綠。
