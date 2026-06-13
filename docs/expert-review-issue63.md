# 專家評價與完成判斷 — issue #63 本機多帳號（gateVersion 1.0）

對應 design.md `spec#8`、`solStory#10`／`sysStory#6`。本檔依 [GATE.md] §2 矩陣與 §6 專家評價產出；機器判定（§1）與測試證據見 `docs/test-summary.html`。

## 完成判斷Gate

### story/case/產品能力/責任邊界矩陣

| 來源 | story/case | 系統類型 | 產品能力 | 設計責任鏈 | 實際責任鏈 | 實作入口 | 測試檔案 | 狀態 | 證據 | 缺口 |
|---|---|---|---|---|---|---|---|---|---|---|
| spec#8 | solCase#10.1／sysCase#6.1 | 本機 WUI | 進入先選帳號、選定載入該帳號進度 | modShell 入口＋modState 載入 | `main.js#selectAccount`／`openAccountSelect`＋`accounts.js`＋`game-state.js#loadAccountState` | `main.js`、`state/accounts.js` | `selftests.js#runAccountSelfTest`、e2e UI | 已測通過 | accounts selftest passed；e2e 選 Mia→`Princess Mia`、overlay 關閉 | 無 |
| spec#8 | solCase#10.2／sysCase#6.2 | 本機 WUI | 新增帳號（乾淨初始、成使用中） | modState 建立資料 | `main.js#createNewAccount`＋`game-state.js#createFreshAccount`＋`accounts.js#createAccount` | 同上 | accounts selftest（隔離）、e2e | 已測通過 | 新帳號 coins=100 非繼承；e2e 建立 Mia/Zoe，index=["Mia","Zoe"] | 無 |
| spec#8 | solCase#10.3／sysCase#6.3 | 本機 WUI | 刪除帳號（刪 active→回選擇；刪最後→空狀態） | modState 移除資料 | `main.js#handleDeleteAccount`＋`accounts.js#deleteAccount` | 同上 | accounts selftest | 已測通過 | 刪非 active 不動 active；刪 active→activeId 清空；清單回 baseline | 刪除 UI 採 window.confirm（見發現#6） |
| spec#5（修訂） | solStory#5／sysStory#4 | 本機 WUI | 每個帳號各自保存／還原進度 | modState 以 active 帳號鍵存取 | `game-state.js#loadLocalState`／`persistState`（active 帳號鍵） | `state/game-state.js`、`state/storage.js` | accounts selftest（隔離）、save-load selftest | 已測通過 | 切換帳號 coins 各自還原；save-load roundtrip 一致 | 無 |
| spec#8 | （資料安全） | 本機 WUI | 既有單一存檔遷移為首帳號，不遺失進度 | modState 一次性遷移 | `accounts.js#migrateLegacyAccount`（由 `loadLocalState` 觸發） | `state/accounts.js` | e2e 遷移驗證 | 已測通過 | 舊存檔 coins=777 保留、自動使用中、舊鍵移除、冪等、不顯示選擇器 | 無 |

**企業常規完整性審查（GATE §5，本機多帳號 ≈ 本機 profile 生命週期 + WUI）**

* 帳號生命週期：建立／選擇／刪除／空狀態 — 皆已實作並測通。
* WUI 常規：空狀態（無帳號）✅、互動回饋（選定後狀態列訊息）✅、刪除確認 ✅、Back 僅在有 active 時可用 ✅。
* 非網路身分：不含登入／密碼／session／雲端（設計即本機 profile）；GATE §5「Auth/IdP」之 session/IdP 失效項不適用，已於 design.md 與 README 明示。
* 資料一致性：每次變更即 `persist()` 寫使用中帳號鍵；切換不丟失；reset 僅限使用中帳號。

### 重大缺口與是否可宣稱完成

* 機器判定（§1）：tsc `--noEmit` exit 0、repoLint 0、docLint 0、npm audit N/A（無 package.json、0 依賴）。單元覆蓋 80% 此 repo 未插樁，沿用既有瀏覽器 selftest 為測試機制（見發現#15）。
* 矩陣：5/5 核心項目 `已測通過`，0 未實作、0 責任邊界不符。
* 結論：**可宣稱完成**（5/5 已測通過，0 未實作，0 責任邊界不符）。

## 專家評價（≥10 發現與處置）

1. **[已修復] localStorage 寫入無配額/失敗保護**：多帳號使資料量上升，配額已滿時 `setItem` 會丟未捕捉例外中斷遊戲。已於 `persistState`、`persistAccountIndex` 加 try/catch + `console.warn`，存檔失敗不崩潰。
2. **[已驗證] 既有玩家存檔遷移**：`migrateLegacyAccount` 將舊單一存檔遷為首帳號，實測保留 coins=777、自動設為使用中、移除舊鍵、冪等，且既有玩家不被強制看到帳號選擇。
3. **[已驗證] 帳號進度隔離**：新帳號乾淨初始、切換各自還原（accounts selftest）。
4. **[已驗證] 刪除邊界**：刪使用中帳號回到帳號選擇、刪最後一個顯示僅可新增的空狀態（selftest + boot gate）。
5. **[依範圍/延後] Save MD 匯入覆蓋「使用中帳號」而非彈出帳號選擇器**：匯入目標即玩家當前所選帳號；於 `loadMarkdownText` 內加 confirm 會破壞既有 `save-load` selftest 與程式化匯入路徑，故明確帳號選擇器列為未來增強（⁉️，已記於 contract-local 待補 `datIntf自訂多帳號存檔格式`）。
6. **[可接受限制] 刪除採 `window.confirm`**：家長層級操作、最小摩擦，符合設計「明確確認」。
7. **[可接受限制] Account Select 無焦點陷阱**：與既有 `character-select` 一致；列為整體無障礙增強，不在本議題擴大。
8. **[可接受限制] 無跨分頁同步**：兒童遊戲單分頁假設；未監聽 `storage` 事件，多分頁切換不即時互通。
9. **[可接受限制] 帳號數量無硬上限**：理論上可逼近 localStorage 配額；已由發現#1 的寫入保護避免崩潰；軟上限列為增強。
10. **[已優雅處理] characterId 指向已移除角色**：`playableCharacterById` 回 undefined，label fallback「Princess」，不崩潰。
11. **[已優雅處理] 帳號索引毀損/activeId 失效**：`loadAccountIndex` 過濾驗證、activeId 回退 null（交回帳號選擇）；`loadAccountState` 解析失敗回退乾淨初始。
12. **[正向] Reset Progress 正確限定使用中帳號**：`resetProgress` 經 `persist()` 寫使用中鍵，不影響其他帳號。
13. **[低風險/未處理] 遷移中途崩潰殘留舊鍵**：若 `removeItem` 前崩潰，下次因已有帳號略過遷移，殘留鍵被忽略、無害。
14. **[次要/未處理] 帳號清單依建立順序**：無「最近遊玩」排序，屬 UX 增強。
15. **[測試機制] 單元覆蓋率未插樁**：本 repo 無單元測試框架/覆蓋率工具，沿用瀏覽器 selftest（accounts/save-load/monkey/data-audit）作為可重跑證據；與既有專案一致，非本議題引入之缺口。
