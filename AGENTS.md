# AGENTS.md

本檔是給 Codex / coding agent 進入本 repo 時快速讀取的操作規則。專案設計、遊戲流程、資產狀態、驗證方式與目前問題統一維護在 `README.md`。

## 讀取順序

1. 先讀本檔。
2. 再讀 `README.md`，並以它作為設計內容 source of truth。
3. 需要追蹤稽核細節時，再讀 `doc/AUDIT-111.md` 與 `doc/AUDIT-IMAGE-ISSUES.md`。

## 硬性操作規則

- Windows PowerShell 必須使用：
  `C:\Users\User\AppData\Local\Microsoft\WindowsApps\pwsh.exe`
- 不要使用 `powershell.exe`。
- 不要依賴 PATH 上的 `pwsh`。
- 手動修改檔案使用 `apply_patch`。
- 不要問 Git commit/push；使用者已明確要求不要卡在 Git 問題上。
- 不要 revert 使用者或其他 agent 的既有變更。
- 修改前先確認目前 worktree 狀態，但不要因為 dirty worktree 停住。
- 修改後必須做實際瀏覽器渲染檢查；若 in-app Browser MCP 未暴露，可用 Playwright/Chromium 對同一 localhost URL 截圖驗證。
- 討論型問題短答；只有使用者明確說「請修改 / 請執行」時才進入完整改檔與驗證流程。

## 專案入口

- 專案路徑：`C:\Users\User\Documents\Github\solKidGalGame`
- 本地 server：`webroot/server.mjs`
- 預設 URL：`http://127.0.0.1:4174/`
- 完整設計與操作說明：`README.md`
