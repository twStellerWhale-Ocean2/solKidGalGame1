# 設計note — issue #390 選角色頁（登入後家門口）＋開機動線改落選角頁（兩表單 Inc1）

> 承 epic #389（techApp遊戲webApp ＜III.B 帳號/角色動線 canon＞）Increment 1——新建「選角色頁」表單並改開機動線；**純加法**，舊登入頁帳號卡本增量不動（#393 拆）。

## 1. 現況
- 開機（CLOUD_MODE）一律 `openLoginScreen({mustChoose:true})`；免密續玩要在帳號卡上點「Continue as X」。
- 登入/續玩成功（`enterGame`）直進遊戲；角色切換藏在設定選單〈Your princesses〉roster picker（#378）。
- ⟳（`returnToInitialSelect`）雲端分支回登入頁（帳號層），與角色層切換為兩套。

## 2. 設計決策
- **D1 新模組 `app/character-home.js`**：選角色頁 overlay（`#characterHome`，reuse `.account-select-overlay` 樣式類）。三區：
  - 頂：帳號名（`cloud.username`；本機＝帳號名）＋角色數＋「Log out」（僅雲端顯示；`cloudLogout()`＋`clearCachedSession()`→`openLoginScreen({mustChoose:true})`）。
  - 中：角色列（reuse `.account-row` 版型：bust＋名字＋coins·lastPlayed＋play 狀態）。點列＝進入遊戲：active→直接進；非 active→`switchToCharacter(saveId)` 後進。（密碼驗證於 #391。）
  - 底：「Add princess」（`startAddCharacter()`，達上限停用）；confirm 後以新角色直接進遊戲（選了就進）。
  - 家門口不可回退：無 backdrop 關閉、無 Back（離開途徑＝選角色或 Log out）。
- **D2 開機動線（main.js）**：CLOUD_MODE 先靜默 `cloudResume()`——成功→`enterGame` 落選角色頁（不見登入表單＝保持登入）；失敗→`openLoginScreen({mustChoose:true})`。
- **D3 `enterGame` 改落點**：登入/續玩成功後改開選角色頁（`openCharacterHome()`）；`isNew`（新帳號）或缺 playerName 仍先 `openCharacterSelect({forced:true})` 創首角，confirm 直接進遊戲。
- **D4 ⟳ 重導**：`returnToInitialSelect` 雲端分支改 `flushCloudSave()`＋`openCharacterHome()`（角色層單一路徑）；本機分支照舊（`openAccountSelect`，selftest 用）。
- **D5 roster 來源**：一律 `listAccountCharacters()`／`getActiveRoster()`（#378 既有，雲端/本機自分流），不動資料模型。

## 3. 影響面
| 檔案 | 修改 |
|------|------|
| `app/character-home.js`（新） | openCharacterHome/closeCharacterHome/buildCharacterHome＋進入/登出/新增接線 |
| `index.html` | `#characterHome` overlay 標記（reuse account-select 類） |
| `styles/account-select.css` | 頂列（帳號行＋Log out）小幅樣式 |
| `app/elements.js` | characterHome* 元素註冊 |
| `main.js` | 開機靜默 resume 分流；曝 openCharacterHome（自測） |
| `app/login-screen.js` | enterGame 落點改 openCharacterHome |
| `app/select-screens.js` | returnToInitialSelect 雲端分支重導 |
| `testing/selftests.js` | 新 `character-home` 套件（本機 roster 情境）＋roster 套件不回歸 |

**不改**：後端/DB、登入頁帳號卡（#393）、角色密碼（#391）、刪除/檢視（#392）、spec（#394）。

## 4. 驗收
- `?selftest=character-home` 綠：兩角色 roster 開頁列 2、active 標示；點非 active 列＝切換＋關頁；Add 達上限停用；本機無 Log out。
- `?selftest=roster`/`auth`/`about`/`save-load` 不回歸；無 console error。CODE GATE 綠。
