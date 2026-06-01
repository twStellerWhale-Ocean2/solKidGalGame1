$ErrorActionPreference = "Stop"

$Repo = "C:\Users\User\Documents\Github\solKidGalGame"
$Worktree = "C:\Users\User\AppData\Local\Temp\solKidGalGame-before-20260601-135745"
$Python = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$CaptureScript = Join-Path $Repo ".codex\log\20260601-135745-cdp_capture.py"
$Port = "4184"
$CdpPort = "9335"
$Server = $null

try {
  if (Test-Path -LiteralPath $Worktree) {
    git -C $Repo worktree remove --force $Worktree | Out-Null
    if (Test-Path -LiteralPath $Worktree) {
      Remove-Item -LiteralPath $Worktree -Recurse -Force
    }
  }

  git -C $Repo worktree add --detach $Worktree HEAD | Out-Null

  $env:PORT = $Port
  $Server = Start-Process -FilePath "node" -ArgumentList "server.mjs" -WorkingDirectory $Worktree -PassThru -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 40; $i += 1) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  if (-not $ready) {
    throw "Before-version local server did not become ready on port $Port."
  }

  $env:APP_PORT = $Port
  $env:CDP_PORT = $CdpPort
  $env:CAPTURE_LABEL = "before"
  $env:FRESH = "1"
  & $Python $CaptureScript
} finally {
  if ($Server -and -not $Server.HasExited) {
    Stop-Process -Id $Server.Id -Force
  }
  Remove-Item Env:\APP_PORT -ErrorAction SilentlyContinue
  Remove-Item Env:\CDP_PORT -ErrorAction SilentlyContinue
  Remove-Item Env:\CAPTURE_LABEL -ErrorAction SilentlyContinue
  Remove-Item Env:\FRESH -ErrorAction SilentlyContinue
  Remove-Item Env:\PORT -ErrorAction SilentlyContinue
  git -C $Repo worktree remove --force $Worktree | Out-Null
}
