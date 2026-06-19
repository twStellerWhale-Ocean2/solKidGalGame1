param(
  [int]$Port = 4174,
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

#region I.主旨目的 ================================
Write-Host '# I.主旨目的 ================================' -ForegroundColor Blue
Write-Host '* 啟動本機靜態開發 server，並開啟 Wardrobe Tuner。'
Write-Host '* 這不是正式架站，只是讓 Chrome 用 http://127.0.0.1 讀取 repo 靜態檔案。'
#endregion

#region II.參考準備 ================================
Write-Host '# II.參考準備 ================================' -ForegroundColor Blue

#region A.參數準備 --------------------------------
Write-Host '## A.參數準備 --------------------------------' -ForegroundColor Cyan

$toolRoot = $PSScriptRoot
$repoRoot = Resolve-Path -LiteralPath (Join-Path $toolRoot '..')
$serverScript = Join-Path $repoRoot 'server.mjs'
$toolUrl = "http://127.0.0.1:$Port/tool/wardrobe-tuner.html"
$serverReady = $false

Write-Host "* Repo: $repoRoot"
Write-Host "* Port: $Port"
Write-Host "* URL: $toolUrl"

#endregion

#region B.前置檢查 --------------------------------
Write-Host '## B.前置檢查 --------------------------------' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $serverScript)) {
  Write-Host '* 找不到 server.mjs，請確認你是在 solKidGalGame repo 內使用此工具。' -ForegroundColor Red
  exit 1
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  Write-Host '* 找不到 node，請先安裝 Node.js 或確認 node 在 PATH。' -ForegroundColor Red
  exit 1
}

Write-Host "* Node: $($nodeCommand.Source)"

#endregion

#endregion

#region III.內容程序 ================================
Write-Host '# III.內容程序 ================================' -ForegroundColor Blue

#region A.確認 server 狀態 --------------------------------
Write-Host '## A.確認 server 狀態 --------------------------------' -ForegroundColor Cyan

try {
  $tcpClient = [System.Net.Sockets.TcpClient]::new()
  $connectTask = $tcpClient.ConnectAsync('127.0.0.1', $Port)
  $serverReady = $connectTask.Wait(500)
  $tcpClient.Dispose()
}
catch {
  $serverReady = $false
}

if ($serverReady) {
  Write-Host "* Port $Port 已有服務在執行，直接使用現有 server。" -ForegroundColor Green
}
else {
  Write-Host "* Port $Port 尚未啟動，準備啟動 server.mjs。"
}

#endregion

#region B.啟動本機 server --------------------------------
Write-Host '## B.啟動本機 server --------------------------------' -ForegroundColor Cyan

if (-not $serverReady) {
  $env:PORT = [string]$Port
  $serverProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList 'server.mjs' -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru
  Write-Host "* 已啟動 node server，PID: $($serverProcess.Id)" -ForegroundColor Green

  for ($attempt = 1; $attempt -le 20; $attempt += 1) {
    Start-Sleep -Milliseconds 250

    try {
      $tcpClient = [System.Net.Sockets.TcpClient]::new()
      $connectTask = $tcpClient.ConnectAsync('127.0.0.1', $Port)
      $serverReady = $connectTask.Wait(500)
      $tcpClient.Dispose()
    }
    catch {
      $serverReady = $false
    }

    if ($serverReady) {
      break
    }
  }
}

if (-not $serverReady) {
  Write-Host '* server 未在預期時間內回應，請檢查 server.mjs 輸出或 port 是否被其他程式占用。' -ForegroundColor Red
  exit 1
}

Write-Host '* 本機 server 已可連線。' -ForegroundColor Green

#endregion

#region C.開啟工具頁 --------------------------------
Write-Host '## C.開啟工具頁 --------------------------------' -ForegroundColor Cyan

if ($NoOpen) {
  Write-Host '* 已略過自動開啟瀏覽器。'
}
else {
  Start-Process $toolUrl
  Write-Host '* 已開啟 Wardrobe Tuner。' -ForegroundColor Green
}

#endregion

#endregion

#region IV.備註紀錄 ================================
Write-Host '# IV.備註紀錄 ================================' -ForegroundColor Blue
Write-Host "* 工具網址：$toolUrl"
Write-Host '* 若看到空白，請確認網址是 http://127.0.0.1，而不是 file://。'
#endregion
