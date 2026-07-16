@echo off
rem 一鍵啟動管理設定工具（issue #341）：檔案總管雙擊即可——起本機 server（已在跑則複用）並開啟工具頁。
rem 參數透傳 start-devtool.ps1（如 -Port 4174 -NoOpen）。
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-devtool.ps1" %*
if errorlevel 1 pause
