# 設計note — issue #392 選角頁逐角色刪除＋檢視資訊（兩表單 Inc3）

> 承 epic #389 Increment 3——選角色頁角色列補齊三動作：檢視資訊／進入遊戲（#390 已有）／刪除角色。守最後一員沿 #379；有 pin 刪除須驗證（#391）、無 pin 兩段防呆。刪帳號不入玩家端（管理端既有職權）。

## 1. 現況（承 #390/#391）
- 角色列點列＝進入（pin 展開驗證）；刪除只有設定選單「Remove this princess」（僅 active、window.confirm）。

## 2. 設計決策
- **D1 角色列動作**：每列右側加 ⓘ（檢視資訊）與 ×（刪除；roster 僅 1 員時不顯示＝守最後一員）。列身點擊＝進入遊戲不變。三展開面板（pin 驗證／資訊／刪除確認）互斥，開一關其餘。
- **D2 檢視資訊（唯讀面板）**：名字、公主外觀、金幣、衣櫃件數、學會單字數、日記篇數、徽章數。`listAccountCharacters` 各 entry 增 `stats`（自 slice 計數）。
- **D3 刪除確認（就地面板，沿 #331）**：
  - 無 pin：面板顯警語＋「Yes, delete」（點 × 為第一段、Yes 為第二段＝兩段防呆）＋Cancel。
  - 有 pin：面板為密碼欄＋「Delete」＋錯誤行；驗證通過才刪。
- **D4 `deleteCharacter(saveId)`（select-screens.js）**：通用逐角色刪除——守最後一員；刪 active＝切至存活首員（carryAccountClock）；刪非 active＝先回寫 active 最新 slice 再刪；commitRoster。`deleteActiveCharacter` 改為委派（#379 自測與設定選單不破）。
- **D5 刪後留頁**：刪除完成 rebuild 選角色頁（不進遊戲）。

## 3. 影響面
| 檔案 | 修改 |
|------|------|
| `app/select-screens.js` | `deleteCharacter(saveId)`；`deleteActiveCharacter` 委派；listAccountCharacters 增 stats |
| `app/character-home.js` | 列 ⓘ/× 按鈕＋資訊/刪除面板；面板互斥 |
| `styles/account-select.css` | `.account-info` 鈕＋面板小幅樣式 |
| `main.js` | 曝 `deleteCharacter`（自測） |
| `testing/selftests.js` | character-home 套件補 #392：資訊面板、無 pin 兩段刪、pin 驗證刪、守最後一員 |

## 4. 驗收
- `?selftest=character-home` 綠（含 #392 斷言組）；`roster`（#379 斷言）不回歸。CODE GATE 綠。
