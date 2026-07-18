# 設計note — issue #371 帳號/角色/登出表單導覽整理（表單地圖）

> 本檔為 #371 之設計note（2plan 階段）。本案為既有 [solKidGalGame方案] 之 **UX/導覽整理（玩家可感知、不動資料模型）**：家長回饋「同帳號內切換角色的表單功能混亂、與帳號切換/登出的表單混用、缺 Back、動線未分析」。採 **UX-only 最小改動**：畫出**表單地圖**（各表單之進入與返回邊）、補齊/確認各表單 Back、於設定選單將「角色/造型」與「帳號/玩家」動作**分組正名**並以一行說明澄清「一玩家一公主」模型，把「想切換到別的小孩」導引到 ⟳ Switch player。
>
> **明確排除（不在本案）**：內文所稱「業界常規每帳號可多角色（各自存檔可切換）」＝破壞性資料模型變更，牴觸 **spec#5**（每帳號單一所選角色）/**spec#8**/**spec#19**，需改存檔 MD／雲端同步／modApi schema。本案**不新增、不修訂任何 spec**，維持 1 帳號＝1 公主。相依可獨立修復之「雲端 ⟳Switch player 進入登入畫面缺 Back」已於 **#372**（v0.68.2）先修。

## 1. 現況（以產物為準，本地 main 已同步 origin/main）

遊戲殼以數個 overlay／menu panel 承載帳號與角色流程，但三個語意相鄰的動作入口散落、且缺一張統一導覽地圖：

* **帳號選擇／登入**（`#accountSelect`）：本機模式由 `select-screens.js` 之 `openAccountSelect` 驅動（帳號卡）；雲端模式由 `login-screen.js` 之 `openLoginScreen`/`buildLoginScreen` 取代（登入卡）。共用 `#accountBack`（Back）。
* **選公主**（`#characterSelect`）：`select-screens.js` 之 `openCharacterSelect`，服務三種呼叫者、以隱藏旗標（first-run／pendingNewAccount／cancelable）分岔返回。已有 `#characterCancel`（Back）＋`#characterConfirm`（Start），Back 於 `.first-run` 時由 CSS 隱藏（`character-select.css:243`）。
* **設定選單**（`#settingsView`，⚙ 開啟）：`.settings-actions` 內**平鋪**四顆——`Voice`、`Change princess`（開選公主，就地覆寫本帳號單一公主＝破壞性換膚，非在並存角色間切換）、`Sign out`（雲端登出，`renderSettings` 依 `cloudUsername` 顯示）、`Reset Progress`（危險）。
* **HUD**（`.info-actions`）：`⚙ systemMenuButton`（開選單）、`⟳ switchPlayerQuickButton`（Switch player → `returnToInitialSelect` → 帳號/登入選擇）。

**混淆根因**：（A）`Change princess`（角色/造型）與 `Sign out`（帳號）、`Reset Progress` 同排平鋪、無標籤分組；（B）「切換到別的小孩」的正解入口 `⟳ Switch player` 只在 HUD、icon-only 無文字提示、與設定內的 `Change princess` 語意易混；（C）玩家以「每帳號可多角色」心智模型看待 `Change princess`，但現行為 1 帳號＝1 公主的覆寫，落差造成「功能混亂」感。

## 2. 設計命題（USR 目標，承 ISSUE-READY，UX-only）

* **spec 不變**：維持 1 帳號＝1 公主（spec#5）。本案只整理導覽與呈現，不改資料模型、不改任何 spec。
* **表單地圖**：明確列出各表單之進入邊與返回邊，確保每個「可返回」的表單都有 Back，且啟動 gate（無 session）不可退出（#309）。
* **正名分組**：設定選單將動作分為「角色/造型」與「帳號/玩家」兩組並加組標題；於 `Change princess` 下以一行說明澄清模型、把「換小孩」導向 `⟳ Switch player`。
* **可發現性**：HUD 之 `⚙`／`⟳` icon 按鈕補 `title` 文字提示（aria-label 已具，補視覺 tooltip）。

## 3. 表單地圖（form map）

節點＝表單；邊＝可到達/返回路徑。

```
        [bootstrap / 無 session]
                 │ mustChoose（不可退出 · 無 Back，#309）
                 ▼
   ┌─────────────────────────────┐   ⟳ Switch player（遊戲中·有帳號）
   │  Login / Account select      │◄──────────────────────────────┐
   │  #accountSelect              │   Back（#372：回原遊戲）─────► [Game]
   │  · 選帳號/登入 → Game        │                                 ▲
   │  · Add player ─► 選公主(new) │                                 │
   └───────┬─────────────────────┘                                 │
           │ Add player（cancelable）                               │
           ▼                                                        │
   ┌─────────────────────────────┐                                 │
   │  Character select            │  Start ─► 確認 ─► Game ─────────┘
   │  #characterSelect            │  Back：
   │                              │   · first-run：無 Back（不可取消，#153/#352）
   │                              │   · Add player：丟棄空帳號 ─► Account select
   │                              │   · Change princess：關閉 ─► Game
   └─────────────────────────────┘
           ▲
           │ Change princess
   ┌─────────────────────────────┐
   │  System menu ▸ Settings      │  ⚙ 開啟；關閉 ─► Game
   │  #settingsView               │  群組：
   │   〈Your princess〉           │   · Change princess ─► 選公主（覆寫本帳號公主）
   │   〈This player〉             │   · Sign out（雲端）─► Login；Reset Progress（危險）
   └─────────────────────────────┘
```

### Back 稽核（每個可返回表單皆具 Back）

| 表單 | 進入來源 | Back 是否具備 | Back 目標 |
|------|---------|--------------|-----------|
| Login/Account select | bootstrap gate | 否（刻意，#309） | —（不可退出） |
| Login/Account select | 遊戲中 ⟳ Switch player | **是**（#372 修復） | 回原遊戲畫面 |
| Character select | first-run | 否（刻意，#153/#352） | —（不可取消） |
| Character select | Add player 新帳號 | 是 | 丟棄空帳號→Account select |
| Character select | Change princess | 是（`#characterCancel`） | 關閉→回遊戲 |
| System menu ▸ Settings | ⚙ | 是（選單關閉） | 回遊戲 |

> 動線註記：`Change princess` 開啟前先 `closeSystemMenu()`，故其 Back 回到**遊戲**而非**設定**；此為刻意（回遊戲後可再開 ⚙），於地圖標明，不另加返回設定之狀態追蹤。

## 4. 設計決策（plan 定方向，3code 落地）

* **D1 設定選單分組正名（不改按鈕 id）**：`.settings-actions` 內以 `.settings-group-title` 分為〈Your princess〉（`Change princess`）與〈This player〉（`Sign out`／`Reset Progress`）兩組；`Voice` 留於組前。所有既有按鈕 id 不變（`speakToggleButton`／`changeCharacterButton`／`signOutButton`／`resetButton`），故 `renderSettings` 之顯示邏輯（依 `cloudUsername` 控 `signOutButton`）零變更。
  > 為何以標題分隔而非包 group `<div>`：維持按鈕為 `.settings-actions` 直屬子元素，不擾動既有版面流。

* **D2 澄清「一玩家一公主」模型**：`Change princess` 下加 `#changePrincessHint` 一行說明——「Changes how your princess looks. Each player has one princess — to play as a different child, tap ⟳ Switch player at the top.」把「換小孩」導向 `⟳ Switch player`，消除與 `Change princess` 的混用。

* **D3 HUD icon 補視覺 tooltip**：`⚙ systemMenuButton`／`⟳ switchPlayerQuickButton` 加 `title`（文字同 aria-label），提升可發現性（無障礙 aria-label 已具，不變）。

* **D4 回歸守門**：`about` selftest 補 #371 斷言——設定選單具分組標題（≥2）、`#changePrincessHint` 存在且導引至「Switch player」；`Change princess` 仍能開啟選公主（沿用既有斷言）。#134「Settings 不得殘留 Switch player 按鈕」不變（本案不加 `#switchAccountButton`）。

## 5. 影響面（以本案實作範疇為限）

| 檔案 | 修改內容 | 決策 |
|------|--------|------|
| `sysLingoWorld/modShell/index.html` | `.settings-actions` 加分組標題與 `#changePrincessHint`；HUD `⚙`/`⟳` 加 `title` | D1、D2、D3 |
| `sysLingoWorld/modShell/styles/system.css` | `.settings-group-title`／`.settings-group-hint` 樣式（theme-safe，繼承卡片文字色） | D1、D2 |
| `sysLingoWorld/modShell/game-engine/testing/selftests.js` | `about` selftest 補 #371 分組/說明斷言 | D4 |

**不改**：資料模型（state/accounts/game-state）、modApi schema、cloud-sync、按鈕 id 與 `renderSettings` 邏輯、選公主/登入既有動線（僅 #372 已修之登入 Back）。

## 6. 驗收

* `?selftest=about` 綠（含新 #371 斷言）；`?selftest=auth`（#372）綠；`?selftest=character-silhouette` 綠。
* 目視：設定選單〈Your princess〉/〈This player〉分組清楚、換公主下方有導引說明；HUD `⟳`/`⚙` hover 顯示文字提示。
