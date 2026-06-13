# repoLint.ps1 — repo 標準結構檢查（repoStructVersion 1.0，對應 SKELETON.md）
# 用法：pwsh scripts/repoLint.ps1 -Path <repo根目錄>
# 回傳：0 違規 → exit 0；否則列出違規並 exit 違規數
param(
    [Parameter(Mandatory = $true)][string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$violations = New-Object System.Collections.Generic.List[string]
$repoRoot = (Resolve-Path -LiteralPath $Path).Path

function Add-Violation([string]$message) {
    $script:violations.Add($message)
}

# ── 1. 門面四物 ──────────────────────────────────
foreach ($required in @("README.md", "VERSION", "docs/design.md")) {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $required))) {
        Add-Violation "缺少門面檔案：$required"
    }
}

$commonDir = Join-Path $repoRoot "contract-common"
$localDir = Join-Path $repoRoot "contract-local"
if (-not (Test-Path $commonDir) -and -not (Test-Path $localDir)) {
    Add-Violation "缺少契約資料夾：contract-common/ 或 contract-local/ 至少其一"
}

# ── 2. 契約資料夾：分類名稱白名單 + README ──────────
$allowedCategories = @("apiIntf", "comIntf", "datIntf", "runAct", "setAct", "etyCfg", "hmiIntf")
foreach ($dir in @($commonDir, $localDir)) {
    if (-not (Test-Path $dir)) { continue }
    $dirName = Split-Path $dir -Leaf
    if (-not (Test-Path (Join-Path $dir "README.md"))) {
        Add-Violation "${dirName}/ 缺少 README.md（分類說明與格式對照表）"
    }
    Get-ChildItem -LiteralPath $dir -Directory | ForEach-Object {
        if ($allowedCategories -notcontains $_.Name) {
            Add-Violation "${dirName}/$($_.Name)/ 不在契約分類白名單（$($allowedCategories -join '/')）"
        }
    }
}

# ── 3. sys 資料夾命名與自包含 ────────────────────
$sysDirs = Get-ChildItem -LiteralPath $repoRoot -Directory |
    Where-Object { $_.Name -cmatch "^sys[A-Z]" }
foreach ($sys in $sysDirs) {
    # 系統不得內含階段資料夾（舊制殘留檢查）
    Get-ChildItem -LiteralPath $sys.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Name -match "^\d[ab]?\.\w+Stage") {
            Add-Violation "$($sys.Name)/$($_.Name)/ 為舊制階段資料夾，sys 內部應依生態系慣例佈局"
        }
    }
}

# ── 4. 根目錄不得有舊制階段資料夾與 .gitkeep 充數 ──
Get-ChildItem -LiteralPath $repoRoot -Directory | ForEach-Object {
    if ($_.Name -match "^\d[ab]?\.\w+Stage") {
        Add-Violation "根目錄 $($_.Name)/ 為舊制階段資料夾；改依 SKELETON 佈局"
    }
}
Get-ChildItem -LiteralPath $repoRoot -Recurse -Filter ".gitkeep" -ErrorAction SilentlyContinue |
    Select-Object -First 5 | ForEach-Object {
        $rel = $_.FullName.Substring($repoRoot.Length + 1)
        Add-Violation ".gitkeep 充數：$rel（空階段不立碑，無內容即不建資料夾）"
    }

# ── 5. design.md 指令宣告 ────────────────────────
$designPath = Join-Path $repoRoot "docs/design.md"
if (Test-Path -LiteralPath $designPath) {
    $design = Get-Content -LiteralPath $designPath -Raw -Encoding UTF8
    foreach ($decl in @("建置指令", "測試指令", "部署指令")) {
        if ($design -notmatch [regex]::Escape($decl)) {
            Add-Violation "docs/design.md＜IV.A＞缺少「$decl」宣告（外來者導航依據）"
        }
    }
}

# ── 輸出 ─────────────────────────────────────────
Write-Host "repoLint repoStructVersion 1.0 ── 檢查：$repoRoot"
if ($violations.Count -eq 0) {
    Write-Host "結果：PASS（0 違規）" -ForegroundColor Green
    exit 0
}
Write-Host "結果：FAIL（$($violations.Count) 違規）" -ForegroundColor Red
$violations | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Yellow }
exit $violations.Count
