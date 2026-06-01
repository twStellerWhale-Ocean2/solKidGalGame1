$ErrorActionPreference = "Continue"

$ProfileFragment = "20260601-135745-qa\chrome-cdp-profile"
$ProfilePath = "C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-qa\chrome-cdp-profile"

$processes = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -like "chrome*" -and $_.CommandLine -like "*$ProfileFragment*"
}

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 600

if (Test-Path -LiteralPath $ProfilePath) {
  Remove-Item -LiteralPath $ProfilePath -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path -LiteralPath $ProfilePath) {
  Write-Output "profile-remains"
} else {
  Write-Output "profile-removed"
}
