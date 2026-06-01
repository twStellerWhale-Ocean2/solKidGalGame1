$ErrorActionPreference = "Stop"

$Python = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$Script = "C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-cdp_selftests.py"
$ProfileDir = "C:\Users\User\Documents\Github\solKidGalGame\.codex\log\20260601-135745-qa\chrome-selftest-profile"

try {
  & $Python $Script
} finally {
  if (Test-Path -LiteralPath $ProfileDir) {
    Remove-Item -LiteralPath $ProfileDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
