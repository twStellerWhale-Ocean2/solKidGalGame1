# 設計note — issue #393 登入頁簡化為帳密＋註冊、拆帳號卡與第二套切換（兩表單 Inc4）

> 承 epic #389 Increment 4——本 epic 唯一拆舊張（破壞性 UX 變更、資料不動）。新路（#390–#392）已全通，拆除反樣式：帳號卡並列、Remove card、Continue 卡、設定內第二套 roster 切換與 Sign out。

## 1. 設計決策
- **D1 登入頁只剩兩態**：`uiMode = login | register`（cards 拆除）。login＝Sign in（帳號欄**預填最近帳號**＋密碼＋👁）＋「First time here? Create an account」次要連結；register 原樣（Back 移除）。註冊關閉行為沿 spec#26(c)（無任何建立入口＋友善說明）。
- **D2 帳號層無回程**：Back 恆隱、Create new account 大鈕退場（#357 收斂完成式）；本畫面僅未登入時出現（登出/失效才回來）。
- **D3 拆 buildAccountCard 全系**：statusTextFor/formatLastPlayed/Remove card 兩段確認/Continue-as/逐卡密碼併除；`removeRecent` 出口刪除。recent-accounts 快取保留（供帳號欄預填與遷移）。
- **D4 單一切換路徑**：設定選單〈Your princesses〉roster 清單、Add princess、Remove this princess、Sign out 全拆（hud.renderCharacterRoster 刪）；⟳ 改名 **Switch princess**（title/aria），hint 導引回選角色頁；「Change this princess's look」（re-skin）保留。
- **D5 本機模式不動**：select-screens openAccountSelect（selftest 替身）與 #accountEmpty/#accountNewButton 之本機用途保留。

## 2. 影響面
| 檔案 | 修改 |
|------|------|
| `app/login-screen.js` | 拆 cards 模式與帳號卡全系；buildLoginForm 預填；buildLoginScreen 重寫；未用 import 清除 |
| `index.html` | ⟳ 改名 Switch princess；設定區拆 roster/Add/Remove/Sign out、hint 改寫 |
| `render/hud.js` | 拆 renderCharacterRoster＋Sign out 顯隱 |
| `app/{bind-events,elements}.js` | 拆對應接線與元素 |
| `styles/system.css` | 拆 .character-roster* picker 樣式 |
| `testing/selftests.js` | auth 步驟 8/8b/10 改兩表單斷言（#393）；about 套件 hint/殘留斷言更新 |

## 3. 驗收
- `?selftest=auth`（兩表單斷言）／`about`／`character-home`／`roster`／`accounts`／`save-load` 全綠；真實登入頁 a11y 樹驗證無帳號卡；console 無錯。CODE GATE 綠。
- Breaking（UX）：升級後首畫面改變＝預期（USR 裁定）；帳號/存檔資料零變動。
