# 設計note — issue #378 非破壞性「新增／切換公主」UI（Increment 3）

> 承 epic #375（Option A）Increment 3——**首個使用者可感知的多角色行為**。同帳號可存多位公主、各自存檔、點卡非破壞切換。決策見 #375 留言（家長時鐘 account-scoped、金幣/衣櫃 per-character、re-skin 保留＋另加 add/switch）。不改後端/spec（#381）。

## 1. 現況（承 #376/#377）
- 存檔已為 roster envelope（本機 localStorage／雲端 cloud.roster）。roster 恆 size==1。
- 「Change princess」＝就地覆寫（re-skin，`confirmCharacterSelect`）。無新增/切換 UI。

## 2. 設計決策
- **D1 roster 級操作（select-screens.js）**：`getActiveRoster()`（雲端讀 `cloud.roster`、本機讀 localStorage；缺則以 active wrap）、`commitRoster(env)`（雲端 `setCloudRoster`＋`scheduleCloudSave`；本機 `writeRosterEnvelope`）。
  - `switchToCharacter(saveId)`：存目前 active 回 roster → 載入目標角色（`normalizeState`，**不清空**）→ `carryAccountClock`（帳號時鐘 account-scoped，切角色**不重置休息鎖**＝防繞過）→ 設 active → commit → render。
  - `startAddCharacter()`／`confirmAddCharacter(character)`：開選角於「新增」模式（`session.pendingAddCharacter`），confirm 時 append 一員 fresh 角色（套用選定外觀、沿帳號時鐘）、設為 active、寫全 roster。
  - `listAccountCharacters()`：列 roster 各角色供 picker（active 併入 `session.state` 最新變動）。
- **D2 confirmCharacterSelect 拆 re-skin／add 兩支**，共用 `applyChosenAppearance`（原就地覆寫程式）。`cancelCharacterSelect` 清 `pendingAddCharacter`。
- **D3 game-state helper**：`carryAccountClock`（複製 sessionEndsAt/restEndsAt/sessionMaxEndsAt/cycle）、`writeRosterEnvelope`（寫全 roster）、匯出 `characterSliceOf`。
- **D4 UI（設定選單 #371〈Your princesses〉組）**：`#characterRoster` 角色卡列（`hud.renderCharacterRoster`，點卡→`switchToCharacter`）＋`#addCharacterButton`（Add princess）＋保留 `changeCharacterButton`（改當前造型）。hint 更新（仍含「Switch player」導引，#371 斷言不破）。
- **D5 本機/雲端**：雲端優先（`cloudActive()` 分支）；本機以 account blob。roster 恆可 size>1（新增後）。

## 3. 影響面
| 檔案 | 修改 |
|------|------|
| `state/game-state.js` | `carryAccountClock`／`writeRosterEnvelope`；匯出 `characterSliceOf` |
| `system/cloud-sync.js` | 匯出 `setCloudRoster` |
| `app/select-screens.js` | getActiveRoster/commitRoster/switchToCharacter/startAddCharacter/confirmAddCharacter/listAccountCharacters；confirmCharacterSelect 拆 re-skin/add；cancel 清旗標 |
| `render/hud.js` | `renderCharacterRoster`（於 renderSettings） |
| `app/{bind-events,elements}.js` | 接線 Add/roster 點卡；註冊元素 |
| `index.html`／`styles/system.css` | 〈Your princesses〉roster picker 標記＋樣式 |
| `main.js` | 曝 listAccountCharacters/switchToCharacter/startAddCharacter（自測） |
| `testing/selftests.js` | roster 套件補 #378：切換非破壞＋帳號時鐘 account-scoped |

**不改**：後端/DB、spec（#381）、刪除（#379）、存檔 MD（#380）。

## 4. 驗收
- `?selftest=roster` 綠（含 #378：切換載入目標角色、他角色存檔保留、帳號時鐘不重置、切回無損）。
- `?selftest=auth`/`about`/`accounts`/`character-silhouette` 不回歸；無 console error；設定選單顯示角色卡列＋Add。CODE GATE 綠。
