# 設計note — issue #391 角色密碼選配——新增可設、進入須驗（兩表單 Inc2）

> 承 epic #389 Increment 2——角色密碼（選配）：防共用裝置手足互玩之**家庭內防呆**，非防駭防線（canon ＜III.B＞ 定位）。後端零改動。

## 1. 現況（承 #390）
- 選角色頁點列即進入遊戲，無任何驗證；新增角色（選角表單）無密碼欄。

## 2. 設計決策
- **D1 資料**：角色 state 增選配欄 `pinHash`（字串、單向雜湊）——存於 character slice 內，隨 roster envelope／雲端 PUT／存檔 MD 全通路自動攜帶；`normalizeState` 顯式清洗（非法值移除）。envelope schema 不升版（欄位加法、legacy 無損）。
- **D2 雜湊 `hashCharacterPin(pin)`（game-state.js）**：cyrb53 變體、同步、免 secure context（`crypto.subtle` 於內網 HTTP 不可用，展測機即此情境）；固定 app salt。定位＝防呆，於 code 註記明示。
- **D3 設定入口（選角表單）**：新增選配欄「Secret password (optional)」——僅於**建立新角色**時顯示（`pendingAddCharacter` 或 forced 創角）；re-skin（Change princess）隱藏、不動既有 pinHash。留空＝不設。confirm 時非空才寫入 `session.state.pinHash`。
- **D4 驗證入口（選角色頁）**：點有 pin 之角色列＝展開就地面板（密碼欄＋Enter＋錯誤行，沿 #331 就地錯誤通則）；驗證正確→進入遊戲；錯誤→「Wrong password. Ask a grown-up if you forgot.」留在本頁。無 pin 角色照舊點即進入。再點列可收合。
- **D5 守門層級**：僅 UI 閘（`switchToCharacter` 不驗）——同帳號內資料本可經匯出/DevTools 取得，防呆定位不做深防。

## 3. 影響面
| 檔案 | 修改 |
|------|------|
| `state/game-state.js` | `hashCharacterPin`；normalizeState 清洗 `pinHash` |
| `index.html`／`app/elements.js` | 選角表單 pin 欄（hidden 預設）＋元素註冊 |
| `app/select-screens.js` | openCharacterSelect 顯隱 pin 欄；confirm 兩支寫入 pinHash；清欄 |
| `app/character-home.js` | 角色列 pin 展開面板＋驗證進入；listAccountCharacters 曝 pinHash |
| `main.js` | 曝 `hashCharacterPin`（自測） |
| `testing/selftests.js` | character-home 套件補 #391：有 pin 不直進、錯誤留頁、正確進入 |

## 4. 驗收
- `?selftest=character-home` 綠（含 #391 三斷言組）；`roster`/`auth`/`save-load` 不回歸；legacy 無 pin 角色行為不變。CODE GATE 綠。
