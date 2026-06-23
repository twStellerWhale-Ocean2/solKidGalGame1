#Requires -Version 7
<#
docLint.ps1 — README 設計文件格式檢查（formatVersion 2.0）
規則編號對應 FORMAT.md 各章硬規則。
用法：pwsh docLint.ps1 -Path README.md [-Level sol|sys|mod]
回傳：違規清單與摘要；無違規 exit 0，否則 exit 1。
#>
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [ValidateSet('sol', 'sys', 'mod')][string]$Level = 'sol'
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Path)) { throw "找不到檔案：$Path" }
$lines = @(Get-Content -LiteralPath $Path -Encoding UTF8)
$n = $lines.Count

$violations = [System.Collections.Generic.List[object]]::new()
function Add-V([string]$Rule, [int]$Line, [string]$Msg) {
  $violations.Add([pscustomobject]@{ Rule = $Rule; Line = $Line; Msg = $Msg })
}

# ---------- 前置：code fence 狀態表 ----------
$fenceState = New-Object bool[] $n
$inFence = $false
for ($i = 0; $i -lt $n; $i++) {
  if ($lines[$i] -match '^\s*```') { $inFence = -not $inFence; $fenceState[$i] = $true; continue }
  $fenceState[$i] = $inFence
}

# ---------- F：frontmatter ----------
if ($n -eq 0 -or $lines[0] -ne '---') {
  Add-V 'F01' 1 'frontmatter 缺失：首行必須為 ---'
}
else {
  $fmEnd = -1
  for ($i = 1; $i -lt [Math]::Min($n, 30); $i++) { if ($lines[$i] -eq '---') { $fmEnd = $i; break } }
  if ($fmEnd -lt 0) { Add-V 'F01' 1 'frontmatter 未閉合' }
  else {
    $fm = $lines[1..($fmEnd - 1)] -join "`n"
    if ($fm -notmatch '(?m)^name:\s*\S') { Add-V 'F02' 1 'frontmatter 缺 name' }
    if ($fm -notmatch '(?m)^date:\s*\S') { Add-V 'F03' 1 'frontmatter 缺 date' }
    if ($fm -notmatch '(?m)^formatVersion:\s*"?2\.0"?') { Add-V 'F04' 1 'frontmatter 缺 formatVersion: "2.0"' }
  }
}

# ---------- C：四章骨架 ----------
$h1 = @()
for ($i = 0; $i -lt $n; $i++) {
  if (-not $fenceState[$i] -and $lines[$i] -match '^# (.+)$') {
    $h1 += [pscustomobject]@{ Idx = $i; Text = $Matches[1].Trim() }
  }
}
$expected = @('I. 主旨目的', 'II. 設計分析', 'III. 測試規格', 'IV. 部署成效')
$actual = @($h1 | ForEach-Object Text)
if (($actual -join '|') -ne ($expected -join '|')) {
  $ln = if ($h1.Count) { $h1[0].Idx + 1 } else { 1 }
  Add-V 'C01' $ln ("一級章節須依序恰為「{0}」；實際「{1}」" -f ($expected -join '、'), ($actual -join '、'))
}

function Get-ChapterRange([string]$name) {
  $start = $h1 | Where-Object Text -EQ $name | Select-Object -First 1
  if (-not $start) { return $null }
  $next = $h1 | Where-Object Idx -GT $start.Idx | Select-Object -First 1
  $end = if ($next) { $next.Idx - 1 } else { $n - 1 }
  [pscustomobject]@{ Start = $start.Idx; End = $end }
}
function Get-Seg($r) { if ($r.End -ge $r.Start) { @($lines[$r.Start..$r.End]) } else { @() } }

# story/case 編號連續性共用檢查
function Test-StoryChain([string[]]$Seg, [int]$BaseLn, [string]$Story, [string]$Case, [string]$RuleS, [string]$RuleC) {
  $sNums = @(); $cPairs = @()
  foreach ($t in $Seg) {
    if ($t -match ('\*\*' + $Story + '#(\d+)-')) { $sNums += [int]$Matches[1] }
    if ($t -match ('\*\*' + $Case + '#(\d+)\.(\d+)\*\*')) { $cPairs += , @([int]$Matches[1], [int]$Matches[2]) }
  }
  if ($sNums.Count -gt 0 -and (Compare-Object $sNums @(1..$sNums.Count) -SyncWindow 0)) {
    Add-V $RuleS $BaseLn ("{0} 編號須自 1 連續；實際 {1}" -f $Story, ($sNums -join ','))
  }
  foreach ($g in ($cPairs | Group-Object { $_[0] })) {
    if ([int]$g.Name -notin $sNums) { Add-V $RuleC $BaseLn ("{0}#{1}.M 無對應 {2}#{1}" -f $Case, $g.Name, $Story) }
    $ms = @($g.Group | ForEach-Object { $_[1] })
    if (Compare-Object $ms @(1..$ms.Count) -SyncWindow 0) {
      Add-V $RuleC $BaseLn ("{0}#{1}.M 須自 1 連續；實際 {2}" -f $Case, $g.Name, ($ms -join ','))
    }
  }
  return $sNums.Count
}

# ---------- ＜I＞ ----------
$specNums = @()
$rI = Get-ChapterRange 'I. 主旨目的'
if ($rI) {
  $seg = Get-Seg $rI
  if (-not ($seg -match '^## A\. 設計主旨')) { Add-V 'I01' ($rI.Start + 1) '＜I＞缺「## A. 設計主旨」' }
  if (-not ($seg | Where-Object { $_ -match '^\* 本 REPO 為 \[.+方案\] 的設計文件。$' })) {
    Add-V 'I02' ($rI.Start + 1) '設計主旨第一條須逐字為「本 REPO 為 [solXXX方案] 的設計文件。」'
  }
  if (-not ($seg -match '^## B\. 設計目的')) { Add-V 'I03' ($rI.Start + 1) '＜I＞缺「## B. 設計目的」' }
  foreach ($t in $seg) { if ($t -match '^\* \*\*spec#(\d+)-') { $specNums += [int]$Matches[1] } }
  if ($specNums.Count -eq 0) { Add-V 'I04' ($rI.Start + 1) '未找到任何 spec#N' }
  elseif (Compare-Object $specNums @(1..$specNums.Count) -SyncWindow 0) {
    Add-V 'I04' ($rI.Start + 1) ("spec 編號須自 1 連續；實際 {0}" -f ($specNums -join ','))
  }
}

# ---------- ＜II＞ ----------
$etyInII = [System.Collections.Generic.HashSet[string]]::new()
$setActUsed = [System.Collections.Generic.HashSet[string]]::new()   # (C) 與 III.D 出現者
$setActInB = [System.Collections.Generic.HashSet[string]]::new()    # (B) 圖中呈現者
$rII = Get-ChapterRange 'II. 設計分析'
if ($rII) {
  for ($i = $rII.Start; $i -le $rII.End; $i++) {
    foreach ($m in [regex]::Matches($lines[$i], 'etyCfg[\p{L}\p{N}]+')) { [void]$etyInII.Add($m.Value) }
  }
  $h2 = @()
  for ($i = $rII.Start; $i -le $rII.End; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^## ') { $h2 += [pscustomobject]@{ Idx = $i; Text = $lines[$i].Trim() } }
  }
  if (-not ($h2 | Where-Object Text -Match '^## A\. 方案設計\(')) {
    Add-V 'II01' ($rII.Start + 1) '＜II＞第一小節須為「## A. 方案設計(solXXX)」'
  }
  $designSecs = @($h2 | Where-Object Text -Match '^## [A-Z]\. (方案設計|系統設計)\(')
  foreach ($sec in $designSecs) {
    $nextH2 = $h2 | Where-Object Idx -GT $sec.Idx | Select-Object -First 1
    $secEnd = if ($nextH2) { $nextH2.Idx - 1 } else { $rII.End }
    $h3 = @()
    for ($i = $sec.Idx; $i -le $secEnd; $i++) {
      if (-not $fenceState[$i] -and $lines[$i] -match '^### ') { $h3 += [pscustomobject]@{ Idx = $i; Text = $lines[$i].Trim() } }
    }
    $needed = @('### (A) 架構項目', '### (B) 組態項目', '### (C) 運作個案', '### (D) 重點組態')
    if (((@($h3 | ForEach-Object Text)) -join '|') -ne ($needed -join '|')) {
      Add-V 'II02' ($sec.Idx + 1) ("「{0}」子節須依序恰為 (A)(B)(C)(D) 四節；實際「{1}」" -f $sec.Text, ((@($h3 | ForEach-Object Text)) -join '、'))
      continue
    }
    # 各子節範圍
    $sub = @{}
    for ($k = 0; $k -lt 4; $k++) {
      $s = $h3[$k].Idx + 1
      $e = if ($k -lt 3) { $h3[$k + 1].Idx - 1 } else { $secEnd }
      $sub[$needed[$k]] = [pscustomobject]@{ Start = $s; End = $e }
    }
    # --- (A)(B) 共通：圖外不得有文字 ---
    foreach ($key in @('### (A) 架構項目', '### (B) 組態項目')) {
      $r = $sub[$key]
      for ($i = $r.Start; $i -le $r.End; $i++) {
        if (-not $fenceState[$i] -and $lines[$i].Trim() -ne '') {
          Add-V 'II03' ($i + 1) ("{0} 只放 Mermaid 圖，發現圖外文字：{1}" -f $key.Substring(4), $lines[$i].Trim()); break
        }
      }
    }
    # --- (A) 架構圖規則 ---
    $rA = $sub['### (A) 架構項目']; $hasComEdge = $false
    for ($i = $rA.Start; $i -le $rA.End; $i++) {
      if (-not $fenceState[$i] -or $lines[$i] -match '^\s*```') { continue }
      $t = $lines[$i]
      foreach ($bad in @('runAct', 'setAct', '🎚️', '-.->', '-->')) {
        if ($t.Contains($bad)) { Add-V 'II04' ($i + 1) ("(A) 架構項目禁項「{0}」：{1}" -f $bad, $t.Trim()) }
      }
      if ($t.Contains('==>')) {
        $hasComEdge = $true
        if (-not $t.Contains('comIntf')) { Add-V 'II05' ($i + 1) ("==> 線上須標 comIntf：{0}" -f $t.Trim()) }
      }
    }
    if (-not $hasComEdge) { Add-V 'II06' ($rA.Start + 1) '(A) 架構項目須至少含一條 ==> 通訊承載' }
    # --- (B) 組態圖規則 ---
    $rB = $sub['### (B) 組態項目']
    for ($i = $rB.Start; $i -le $rB.End; $i++) {
      if (-not $fenceState[$i] -or $lines[$i] -match '^\s*```') { continue }
      $t = $lines[$i]
      foreach ($bad in @('==>', 'comIntf', 'runAct', 'apiIntf', 'datIntf')) {
        if ($t.Contains($bad)) { Add-V 'II07' ($i + 1) ("(B) 組態項目禁項「{0}」：{1}" -f $bad, $t.Trim()) }
      }
      if ($t.Contains('-.->') -ne $t.Contains('setAct')) {
        Add-V 'II08' ($i + 1) ("setAct 與 -.-> 須成對出現：{0}" -f $t.Trim())
      }
      if ($t.Contains('-->') -and -not $t.Contains('-.->') -and -not $t.Contains('🎚️')) {
        Add-V 'II09' ($i + 1) ("--> 組態依賴線上須標 🎚️ 參數：{0}" -f $t.Trim())
      }
      foreach ($m in [regex]::Matches($t, 'setAct[\p{L}\p{N}]+')) { [void]$setActInB.Add($m.Value) }
    }
    # --- (C) 運作個案 ---
    $rC = $sub['### (C) 運作個案']
    $segC = @($lines[$rC.Start..$rC.End])
    foreach ($t in $segC) {
      foreach ($m in [regex]::Matches($t, 'setAct[\p{L}\p{N}]+')) { [void]$setActUsed.Add($m.Value) }
    }
    if ($sec.Text -match '方案設計') {
      $storyCount = Test-StoryChain $segC ($rC.Start + 1) 'solStory' 'solCase' 'II10' 'II11'
      if ($specNums.Count -gt 0 -and $storyCount -lt $specNums.Count) {
        Add-V 'II12' ($rC.Start + 1) ("solStory 數({0})少於 spec 數({1})：每條 spec 須由至少一個 solStory 承接" -f $storyCount, $specNums.Count)
      }
    }
    else {
      [void](Test-StoryChain $segC ($rC.Start + 1) 'sysStory' 'sysCase' 'II13' 'II13')
    }
    # --- (D) 重點組態 ---
    $rD = $sub['### (D) 重點組態']
    $segD = @($lines[$rD.Start..$rD.End])
    foreach ($cat in @('* **Env轉K8sSec參數**', '* **HelmChart參數-chart.yaml**', '* **HelmChart參數-values.yaml**')) {
      if (-not ($segD | Where-Object { $_.Trim() -eq $cat.Trim() })) {
        Add-V 'II14' ($rD.Start + 1) ("(D) 重點組態缺固定類別「{0}」（無參數時寫「無」或「暫無」，類別不得省略）" -f $cat)
      }
    }
  }
}

# ---------- II16：web 類 techStack 須附介面設計（hmiIntf 視覺規範綁定或 sitemap）----------
# 本 repo 變體：techStack 宣告於＜II.D＞values.yaml 之 paramTechStack（非 🧱）；介面設計併於＜II.C＞呈現。
if ($rII) {
  $txtII = (Get-Seg $rII) -join "`n"
  if ($txtII -match 'paramTechStack\s*=\s*`?(techStackStaticWeb|techStackReactWeb)') {
    if (-not (($txtII -match 'hmiIntf通用視覺規範') -or ($txtII -match 'sitemap'))) {
      Add-V 'II16' ($rII.Start + 1) '＜II＞偵測到 web 類 techStack，須於介面設計呈現 [hmiIntf通用視覺規範] 綁定或 sitemap（FORMAT II16）'
    }
  }
}

# ---------- ＜III＞ ----------
$rIII = Get-ChapterRange 'III. 測試規格'
if ($rIII) {
  $segIII = Get-Seg $rIII
  $reqSecs = @('## A. 模組層級：測試建議', '## B. 系統層級：測試建議')
  if ($Level -in @('sol', 'sys')) {
    $reqSecs += @('## C. 方案層級：組態測試(etyCfg)', '## D. 方案層級：整合測試(setAct/runAct)')
  }
  if ($Level -eq 'sol') {
    $reqSecs += @('## E. 方案層級：文件程式化測試', '## F. 方案層級：文件端對端測試')
  }
  foreach ($s in $reqSecs) {
    if (-not ($segIII | Where-Object { $_.Trim() -eq $s })) { Add-V 'III01' ($rIII.Start + 1) ("＜III＞缺小節「{0}」" -f $s) }
  }
  if ($Level -ne 'sol') {
    foreach ($s in @('## E. 方案層級：文件程式化測試', '## F. 方案層級：文件端對端測試')) {
      if ($segIII | Where-Object { $_.Trim() -eq $s }) { Add-V 'III01' ($rIII.Start + 1) ("{0} 層級不建立「{1}」" -f $Level, $s) }
    }
  }
  if (-not ($segIII -match '測試涵蓋度必須達到80%以上')) { Add-V 'III02' ($rIII.Start + 1) '＜III.A＞樣板缺「測試涵蓋度必須達到80%以上」' }
  if (-not ($segIII -match '遞增整合測試')) { Add-V 'III02' ($rIII.Start + 1) '＜III.B＞樣板缺「遞增整合測試」' }

  # 小節範圍工具
  $h2III = @()
  for ($i = $rIII.Start; $i -le $rIII.End; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^## ') { $h2III += [pscustomobject]@{ Idx = $i; Text = $lines[$i].Trim() } }
  }
  function Get-SecRange([string]$title) {
    $s = $h2III | Where-Object Text -EQ $title | Select-Object -First 1
    if (-not $s) { return $null }
    $next = $h2III | Where-Object Idx -GT $s.Idx | Select-Object -First 1
    $e = if ($next) { $next.Idx - 1 } else { $rIII.End }
    [pscustomobject]@{ Start = $s.Idx; End = $e }
  }

  # --- C：cfgTest 表格 + 完備性 ---
  $rC3 = Get-SecRange '## C. 方案層級：組態測試(etyCfg)'
  if ($rC3) {
    $segC3 = @($lines[$rC3.Start..$rC3.End])
    $cfgNums = @(); $etyInC = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($t in $segC3) {
      if ($t -match '^\|\s*cfgTest#(\d+)\s*\|') { $cfgNums += [int]$Matches[1] }
      foreach ($m in [regex]::Matches($t, 'etyCfg[\p{L}\p{N}]+')) { [void]$etyInC.Add($m.Value) }
    }
    if ($cfgNums.Count -eq 0) { Add-V 'III03' ($rC3.Start + 1) '＜III.C＞未找到 cfgTest 表格列（formatVersion 2.0 採「| cfgTest#NN | [etyCfg...] | 判定 |」表格形式）' }
    elseif (Compare-Object $cfgNums @(1..$cfgNums.Count) -SyncWindow 0) {
      Add-V 'III03' ($rC3.Start + 1) ("cfgTest 編號須自 1 連續；實際 {0}" -f ($cfgNums -join ','))
    }
    foreach ($e in $etyInII) { if (-not $etyInC.Contains($e)) { Add-V 'III04' ($rC3.Start + 1) ("＜II＞之 [{0}] 無對應 cfgTest" -f $e) } }
    foreach ($e in $etyInC) { if (-not $etyInII.Contains($e)) { Add-V 'III04' ($rC3.Start + 1) ("cfgTest 引用＜II＞未出現的 [{0}]" -f $e) } }
  }

  # --- D：intTest 分組、編號、欄位 ---
  $rD3 = Get-SecRange '## D. 方案層級：整合測試(setAct/runAct)'
  if ($rD3) {
    $segD3 = @($lines[$rD3.Start..$rD3.End])
    if (-not ($segD3 | Where-Object { $_.Trim() -eq '### 初始部署設定相關 setAct' })) {
      Add-V 'III05' ($rD3.Start + 1) '＜III.D＞缺分組「### 初始部署設定相關 setAct」'
    }
    $caseIdx = @()
    for ($i = $rD3.Start; $i -le $rD3.End; $i++) {
      if ($lines[$i] -match '^#### intTest#(\d+)-驗證 ') { $caseIdx += [pscustomobject]@{ Idx = $i; Num = [int]$Matches[1] } }
    }
    $nums = @($caseIdx | ForEach-Object Num)
    if ($nums.Count -eq 0) { Add-V 'III05' ($rD3.Start + 1) '＜III.D＞未找到「#### intTest#NN-驗證 」案例' }
    elseif (Compare-Object $nums @(1..$nums.Count) -SyncWindow 0) {
      Add-V 'III05' ($rD3.Start + 1) ("intTest 編號須自 1 連續；實際 {0}" -f ($nums -join ','))
    }
    for ($k = 0; $k -lt $caseIdx.Count; $k++) {
      $s = $caseIdx[$k].Idx
      $e = if ($k -lt $caseIdx.Count - 1) { $caseIdx[$k + 1].Idx - 1 } else { $rD3.End }
      $block = $lines[$s..$e] -join "`n"
      # 重新縮範圍至下一個任何標題
      foreach ($fld in @('既有基底', '新增項目', '步驟', '預期結果')) {
        if ($block -notmatch $fld) { Add-V 'III06' ($s + 1) ("intTest#{0:d2} 缺欄位「{1}」" -f $caseIdx[$k].Num, $fld) }
      }
      foreach ($m in [regex]::Matches($block, 'setAct[\p{L}\p{N}]+')) { [void]$setActUsed.Add($m.Value) }
    }
  }

  # --- E/F：docProgTest / e2eTest ---
  if ($Level -eq 'sol') {
    $rE3 = Get-SecRange '## E. 方案層級：文件程式化測試'
    if ($rE3) {
      $dNums = @(); $blocks = @()
      for ($i = $rE3.Start; $i -le $rE3.End; $i++) {
        if ($lines[$i] -match '^#### docProgTest#(\d+)-') { $dNums += [int]$Matches[1]; $blocks += $i }
      }
      if ($dNums.Count -eq 0) { Add-V 'III07' ($rE3.Start + 1) '＜III.E＞未找到「#### docProgTest#NN-」案例' }
      elseif (Compare-Object $dNums @(1..$dNums.Count) -SyncWindow 0) {
        Add-V 'III07' ($rE3.Start + 1) ("docProgTest 編號須自 1 連續；實際 {0}" -f ($dNums -join ','))
      }
      $segE = $lines[$rE3.Start..$rE3.End] -join "`n"
      foreach ($fld in @('productReadme 要求', '通過判定')) {
        if ($segE -notmatch $fld) { Add-V 'III07' ($rE3.Start + 1) ("＜III.E＞案例缺欄位「{0}」" -f $fld) }
      }
    }
    $rF3 = Get-SecRange '## F. 方案層級：文件端對端測試'
    if ($rF3) {
      $eNums = @()
      for ($i = $rF3.Start; $i -le $rF3.End; $i++) {
        if ($lines[$i] -match '^#### e2eTest#(\d+)-') { $eNums += [int]$Matches[1] }
      }
      if ($eNums.Count -eq 0) { Add-V 'III08' ($rF3.Start + 1) '＜III.F＞未找到「#### e2eTest#NN-」案例' }
      elseif (Compare-Object $eNums @(1..$eNums.Count) -SyncWindow 0) {
        Add-V 'III08' ($rF3.Start + 1) ("e2eTest 編號須自 1 連續；實際 {0}" -f ($eNums -join ','))
      }
      $segF = $lines[$rF3.Start..$rF3.End] -join "`n"
      foreach ($fld in @('依據', '步驟', '預期結果')) {
        if ($segF -notmatch $fld) { Add-V 'III08' ($rF3.Start + 1) ("＜III.F＞案例缺欄位「{0}」" -f $fld) }
      }
    }
  }

  # --- setAct 完備性：用過的 setAct 須先出現在 (B) 組態圖 ---
  foreach ($s in $setActUsed) {
    if (-not $setActInB.Contains($s)) { Add-V 'III09' ($rIII.Start + 1) ("[{0}] 出現於運作個案或整合測試，但未呈現於任何 (B) 組態項目圖" -f $s) }
  }
}

# ---------- ＜IV＞ ----------
$rIV = Get-ChapterRange 'IV. 部署成效'
if ($rIV) {
  $segIV = Get-Seg $rIV
  if (-not ($segIV -match '^## A\. 部署組態')) { Add-V 'IV01' ($rIV.Start + 1) '＜IV＞缺「## A. 部署組態」' }
  foreach ($key in @('開發 REPO', '產品 REPO', 'productReadme 來源')) {
    if (-not ($segIV | Where-Object { $_ -match [regex]::Escape($key) })) { Add-V 'IV01' ($rIV.Start + 1) ("＜IV.A＞缺固定鍵「{0}」" -f $key) }
  }
  if (-not ($segIV -match '^## B\. 成效追蹤')) { Add-V 'IV02' ($rIV.Start + 1) '＜IV＞缺「## B. 成效追蹤」' }
  $txtIV = $segIV -join "`n"
  foreach ($sn in $specNums) {
    if ($txtIV -notmatch ("\*\*spec#{0}-" -f $sn)) { Add-V 'IV02' ($rIV.Start + 1) ("＜IV.B＞缺 spec#{0} 之成效追蹤" -f $sn) }
  }
  if ($specNums.Count -gt 0) {
    foreach ($fld in @('評估方式', '觀察項目')) {
      $cnt = ([regex]::Matches($txtIV, $fld)).Count
      if ($cnt -lt $specNums.Count) { Add-V 'IV03' ($rIV.Start + 1) ("＜IV.B＞「{0}」出現 {1} 次，少於 spec 數 {2}" -f $fld, $cnt, $specNums.Count) }
    }
  }
}

# ---------- G：全域 ----------
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i]) { continue }
  $t = $lines[$i]
  if ($t -match '^#{1,6} ') {
    if ($i -gt 0 -and $lines[$i - 1].Trim() -ne '' -and $lines[$i - 1] -ne '---') {
      Add-V 'G01' ($i + 1) ("標題前須留空白行：{0}" -f $t.Trim())
    }
    if ($i -lt $n - 1 -and $lines[$i + 1].Trim() -ne '') {
      Add-V 'G01' ($i + 1) ("標題後須留空白行：{0}" -f $t.Trim())
    }
  }
  if ($t.Contains('🎚️')) { Add-V 'G02' ($i + 1) '🎚️ 僅允許出現於＜II＞Mermaid 圖內' }
}

# ---------- 報告 ----------
Write-Host ("docLint formatVersion 2.0 — 檔案：{0}（層級 {1}）" -f $Path, $Level)
if ($violations.Count -eq 0) {
  Write-Host '結果：PASS（0 違規）' -ForegroundColor Green
  exit 0
}
$violations | Sort-Object Line, Rule | ForEach-Object {
  Write-Host ("[{0}] 第 {1} 行：{2}" -f $_.Rule, $_.Line, $_.Msg)
}
Write-Host ("結果：FAIL（{0} 項違規）" -f $violations.Count) -ForegroundColor Red
exit 1
