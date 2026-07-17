# repoLint.ps1 — repo 標準結構檢查（repoStructVersion 版本感知 1.0／2.0，對應 src/FORMAT.md（原名 SKELETON.md））
# 用法：pwsh test/scripts/repoLint.ps1 [-Path <repo根目錄>]（預設 `.`；勿設 Mandatory——漏帶參數時 pwsh 停在提示無聲掛死）
# 回傳：0 違規 → exit 0；否則列出違規並 exit 違規數
# 版本偵測：有 docs/shared-contracts/ → 2.0（契約單一資料夾、自訂寫 design）；
#           否則有 contract-common/ 或 contract-local/ → 1.0（舊制根目錄雙資料夾，相容既有 repo）。
param(
    [string]$Path = '.'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$violations = New-Object System.Collections.Generic.List[string]
$repoRoot = (Resolve-Path -LiteralPath $Path).Path

function Add-Violation([string]$message) {
    $script:violations.Add($message)
}

# ── 0. 版本偵測 ─────────────────────────────────────
$sharedDir = Join-Path $repoRoot "docs/shared-contracts"
$commonDir = Join-Path $repoRoot "contract-common"
$localDir = Join-Path $repoRoot "contract-local"

if (Test-Path $sharedDir) {
    $structVer = "2.0"
    $contractDirs = @($sharedDir)
    # v2.0：不得殘留舊制根目錄契約資料夾
    if (Test-Path $commonDir) { Add-Violation "v2.0 不得有根目錄 contract-common/（共享契約移入 docs/shared-contracts/）" }
    if (Test-Path $localDir) { Add-Violation "v2.0 不得有 contract-local/（自訂設計寫入 docs/design.md 文字、不成檔）" }
}
elseif ((Test-Path $commonDir) -or (Test-Path $localDir)) {
    $structVer = "1.0"
    $contractDirs = @($commonDir, $localDir)
}
else {
    $structVer = "2.0"
    $contractDirs = @()
    Add-Violation "缺少契約資料夾：docs/shared-contracts/（v2.0；本案若確有共享契約引用）"
}

# ── 1. facade 四物 ──────────────────────────────────
foreach ($required in @("README.md", "VERSION", "docs/design.md")) {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $required))) {
        Add-Violation "缺少 facade 檔案：$required"
    }
}

# ── 2. 契約項：命名分類白名單（前綴式）+ README ──────────
# 契約項＝直屬契約資料夾之 .md 檔或資料夾（folder-form 契約，如 hmiIntf通用視覺規範/），名為「{分類}{名稱}」。
# 分類含四層技術選型 techStyle/techApp/techStack/techItem。判定用「名稱以分類起始」（前綴式）：
#   folder-form 契約與帶中文名之 .md 檔契約皆合規，非要求資料夾名全等於分類（起因 solLingoWorld：hmiIntf通用視覺規範/ 被舊全等式誤報）。
$allowedCategories = @("apiIntf", "comIntf", "datIntf", "runWi", "setWi", "etyCfg", "hmiIntf", "techApp", "techStack", "techStyle", "techItem")
foreach ($dir in $contractDirs) {
    if (-not (Test-Path $dir)) { continue }
    $dirName = Split-Path $dir -Leaf
    if (-not (Test-Path (Join-Path $dir "README.md"))) {
        Add-Violation "${dirName}/ 缺少 README.md（分類說明與格式對照表）"
    }
    # 契約項涵蓋 .md 檔與資料夾（meta 檔 README.md／contract-index.md 除外）——舊版只掃資料夾致 .md 檔契約全未檢查。
    $metaFiles = @("README.md", "contract-index.md")
    Get-ChildItem -LiteralPath $dir |
        Where-Object { $metaFiles -notcontains $_.Name -and ($_.PSIsContainer -or $_.Extension -eq ".md") } |
        ForEach-Object {
            $entry = $_.Name
            $suffix = if ($_.PSIsContainer) { "/" } else { "" }
            $ok = $false
            foreach ($cat in $allowedCategories) { if ($entry.StartsWith($cat)) { $ok = $true; break } }
            if (-not $ok) {
                Add-Violation "${dirName}/${entry}${suffix} 契約項未以分類白名單起始（$($allowedCategories -join '/')）"
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
        Add-Violation "根目錄 $($_.Name)/ 為舊制階段資料夾；改依 src/FORMAT（repo 結構規格）佈局"
    }
}
Get-ChildItem -LiteralPath $repoRoot -Recurse -Filter ".gitkeep" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "[\\/](node_modules|\.git|dist|build|coverage)[\\/]" } |
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
            Add-Violation "docs/design.md＜C.(D) 部署做法＞缺少「$decl」宣告（外來者導航依據）"
        }
    }
}

# ── 輸出 ─────────────────────────────────────────
Write-Host "repoLint repoStructVersion $structVer ── 檢查：$repoRoot"
if ($violations.Count -eq 0) {
    Write-Host "結果：PASS（0 違規）" -ForegroundColor Green
    exit 0
}
Write-Host "結果：FAIL（$($violations.Count) 違規）" -ForegroundColor Red
$violations | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Yellow }
exit $violations.Count
