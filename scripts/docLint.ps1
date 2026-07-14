#Requires -Version 7
<#
docLint.ps1 — 設計文件格式檢查（formatVersion 3.0–3.3 四件套；版本感知）
規則編號為 FORMAT.md（SKILL）各章硬規則之 in-repo 實作。
3.3 新增 E01–E04：技術選型四層綁層宣告（techStyle→I.C.(A)／techApp→II.C.(A)／techStack→III＋值限封閉枚舉）。
用法：pwsh docLint.ps1 [-Path docs/design.md]
回傳：違規清單與摘要；無違規 exit 0，否則 exit 1。

四件套：每層 A.主旨摘要 / B.運作架構 / C.重點組態 / D.檢核；
  B=(A)人員組織 /(B)方案系統 /(C)動作項目；C=(A)關鍵參數 /(B)部署作法 /(C)人機介面。
追溯鏈：orgsopcat → orgSop → teamSop → prsnSop；spec / cfgTest / intTest / docProgTest / e2eTest。
#>
param(
  [string]$Path = 'docs/design.md'
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
if (-not (Test-Path -LiteralPath $Path)) { throw "找不到檔案：$Path" }
$lines = @(Get-Content -LiteralPath $Path -Encoding UTF8)
$n = $lines.Count
$raw = $lines -join "`n"

$violations = [System.Collections.Generic.List[object]]::new()
function Add-V([string]$Rule, [int]$Line, [string]$Msg) {
  $violations.Add([pscustomobject]@{ Rule = $Rule; Line = $Line; Msg = $Msg })
}

# code fence 狀態表
$fenceState = New-Object bool[] $n
$inFence = $false
for ($i = 0; $i -lt $n; $i++) {
  if ($lines[$i] -match '^\s*```') { $inFence = -not $inFence; $fenceState[$i] = $true; continue }
  $fenceState[$i] = $inFence
}

# 連續性：回 $null＝空、''＝OK、否則回實際序列字串
function Test-Contig([int[]]$nums) {
  $u = @($nums | Sort-Object -Unique)
  if ($u.Count -eq 0) { return $null }
  if (Compare-Object $u @(1..$u.Count) -SyncWindow 0) { return ($u -join ',') }
  return ''
}

$fmt = '3.0'  # design 之 formatVersion（由 F04 設定）；決定結構檢查走 3.0／3.1／3.2
$fmEnd = -1   # frontmatter 結束（第二個 ---）之行 index；由 F 檢查設定，供 D04 用

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
    if ($fm -match '(?m)^formatVersion:\s*"?(3\.[0123])"?') { $fmt = $Matches[1] } else { Add-V 'F04' 1 'frontmatter formatVersion 須為 "3.0"–"3.3"（新建一律 "3.3"）' }
  }
}

# 一級章名（正典，2026-07-08 起）：非 3.0 一律「需求分析／方案設計／系統設計」；3.0 為四章 legacy。舊名（初始需求、3.2 之 方案/系統/模組設計）不再接受、遇到即更換。
if ($fmt -eq '3.0') { $ch1 = 'I. 初始需求'; $ch2 = 'II. 方案設計'; $ch3 = 'III. 系統設計' }
else { $ch1 = 'I. 需求分析'; $ch2 = 'II. 方案設計'; $ch3 = 'III. 系統設計' }
$isNew = ($fmt -ne '3.0')  # 3.1／3.2 內層四步結構相同（僅 3.2 章名不同）

# ---------- C：四章骨架 ----------
$h1 = @()
for ($i = 0; $i -lt $n; $i++) {
  if (-not $fenceState[$i] -and $lines[$i] -match '^# (.+)$') { $h1 += [pscustomobject]@{ Idx = $i; Text = $Matches[1].Trim() } }
}
$expected = if ($fmt -eq '3.0') { @('I. 初始需求', 'II. 方案設計', 'III. 系統設計', 'IV. 成效驗收') } else { @($ch1, $ch2, $ch3) }
$actual = @($h1 | ForEach-Object Text)
# 3.1／3.2 容許可選附錄「# IV. 備註記錄」（編輯備註／變更註記，非設計層；比對前剝除）
if ($isNew -and $actual.Count -gt 0 -and $actual[-1] -match '^IV\. 備註[記紀]錄$') { $actual = @($actual[0..($actual.Count - 2)]) }
if (($actual -join '|') -ne ($expected -join '|')) {
  $ln = if ($h1.Count) { $h1[0].Idx + 1 } else { 1 }
  Add-V 'C01' $ln ("一級章節須依序恰為「{0}」；實際「{1}」" -f ($expected -join '、'), ($actual -join '、'))
}

function ChapterRange([string]$name) {
  for ($k = 0; $k -lt $h1.Count; $k++) {
    if ($h1[$k].Text -eq $name) {
      $end = if ($k -lt $h1.Count - 1) { $h1[$k + 1].Idx - 1 } else { $n - 1 }
      return [pscustomobject]@{ Start = $h1[$k].Idx; End = $end }
    }
  }
  return $null
}
function H2In($r) {
  $o = @()
  for ($i = $r.Start; $i -le $r.End; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^## (.+)$') { $o += [pscustomobject]@{ Idx = $i; Text = $Matches[1].Trim() } }
  }
  return , $o
}
function H3Texts([int]$s, [int]$e) {
  $o = @()
  for ($i = $s; $i -le $e; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^### (.+)$') { $o += $Matches[1].Trim() }
  }
  return , $o
}
function H3In([int]$s, [int]$e) {
  $o = @()
  for ($i = $s; $i -le $e; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^### (.+)$') { $o += [pscustomobject]@{ Idx = $i; Text = $Matches[1].Trim() } }
  }
  return , $o
}
function H4Texts([int]$s, [int]$e) {
  $o = @()
  for ($i = $s; $i -le $e; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^#### (.+)$') { $o += $Matches[1].Trim() }
  }
  return , $o
}

# ---------- I/II/III：四件套骨架 ----------
$chapMap = [ordered]@{ $ch1 = 'I'; $ch2 = 'II'; $ch3 = 'III' }
$is31 = $isNew  # 3.1／3.2 皆走四步內層（B 運作想定／C 組態設定／D 規格效益）
$bName = if ($is31) { 'B. 運作想定' } else { 'B. 運作構想' }
$cName2 = if ($is31) { 'C. 組態設定' } else { 'C. 重點組態' }
$cSubs = if ($is31) { @('(A) 技術選型', '(B) 關鍵參數', '(C) 人機介面', '(D) 部署做法') } else { @('(A) 關鍵參數', '(B) 部署作法', '(C) 人機介面') }
foreach ($cName in $chapMap.Keys) {
  $r = ChapterRange $cName
  if (-not $r) { continue }
  $tag = $chapMap[$cName]
  $h2 = H2In $r
  $h2t = @($h2 | ForEach-Object Text)
  $dTitle = if ($is31) { 'D. 規格效益' } elseif ($tag -eq 'I') { 'D. 需求規格' } else { 'D. 品管測試' }
  foreach ($want in @('A. 主旨摘要', $bName, $cName2, $dTitle)) {
    if ($want -notin $h2t) { Add-V 'S01' ($r.Start + 1) ("＜{0}＞缺「## {1}」" -f $tag, $want) }
  }
  if ($is31) {
    # S02：B 運作想定 子節（3.1）
    $bHead = $h2 | Where-Object { $_.Text -eq $bName } | Select-Object -First 1
    if ($bHead) {
      $bNext = $h2 | Where-Object { $_.Idx -gt $bHead.Idx } | Select-Object -First 1
      $bEnd = if ($bNext) { $bNext.Idx - 1 } else { $r.End }
      $b3all = H3In ($bHead.Idx + 1) $bEnd
      $b3 = @($b3all | ForEach-Object Text)
      foreach ($want in @('(A) 資訊架構', '(C) 動作項目', '(D) 軟硬項目')) {
        if ($want -notin $b3) { Add-V 'S02' ($bHead.Idx + 1) ("＜{0}.B＞缺「### {1}」" -f $tag, $want) }
      }
      # (B)：新制「單位人員」（I/II/III 統一標題、內外部二分）／舊制「人員編組」二擇一相容
      $bSub = $b3all | Where-Object { $_.Text -eq '(B) 單位人員' -or $_.Text -eq '(B) 人員編組' } | Select-Object -First 1
      if (-not $bSub) {
        Add-V 'S02' ($bHead.Idx + 1) ("＜{0}.B＞缺「### (B) 單位人員」（3.3 精修後新建一律用此名；「### (B) 人員編組」為既有案相容舊名）" -f $tag)
      } elseif ($bSub.Text -eq '(B) 單位人員') {
        # S06：新制須含兩個具名 H4 子區塊（方案外＝條列、方案內＝依 I org／II team／III prsn 嚴格編組，見 FORMAT ＜3/4/5節＞）
        $bSubNext = $b3all | Where-Object { $_.Idx -gt $bSub.Idx } | Select-Object -First 1
        $bSubEnd = if ($bSubNext) { $bSubNext.Idx - 1 } else { $bEnd }
        $h4 = H4Texts ($bSub.Idx + 1) $bSubEnd
        foreach ($want4 in @('方案外單位人員關聯', '方案內單位人員編組')) {
          if ($want4 -notin $h4) { Add-V 'S06' ($bSub.Idx + 1) ("＜{0}.B.(B) 單位人員＞缺「#### {1}」" -f $tag, $want4) }
        }
      }
    }
  }
  # S03：C 子節（兩版，名稱依版本）
  $cHead = $h2 | Where-Object { $_.Text -eq $cName2 } | Select-Object -First 1
  if ($cHead) {
    $cNext = $h2 | Where-Object { $_.Idx -gt $cHead.Idx } | Select-Object -First 1
    $cEnd = if ($cNext) { $cNext.Idx - 1 } else { $r.End }
    $c3 = H3Texts ($cHead.Idx + 1) $cEnd
    foreach ($want in $cSubs) {
      if ($want -notin $c3) { Add-V 'S03' ($cHead.Idx + 1) ("＜{0}.C＞缺「### {1}」" -f $tag, $want) }
    }
  }
  if ($is31) {
    # S05：D 規格效益 子節（3.1）
    $dHead = $h2 | Where-Object { $_.Text -eq 'D. 規格效益' } | Select-Object -First 1
    if ($dHead) {
      $dNext = $h2 | Where-Object { $_.Idx -gt $dHead.Idx } | Select-Object -First 1
      $dEnd = if ($dNext) { $dNext.Idx - 1 } else { $r.End }
      $d3 = H3Texts ($dHead.Idx + 1) $dEnd
      foreach ($want in @('(A) 規格要求', '(B) 效益指標')) {
        if ($want -notin $d3) { Add-V 'S05' ($dHead.Idx + 1) ("＜{0}.D＞缺「### {1}」" -f $tag, $want) }
      }
    }
  }
}

# ---------- IV ----------
$rIV = ChapterRange 'IV. 成效驗收'
if ($rIV) {
  $h2t = @((H2In $rIV) | ForEach-Object Text)
  foreach ($want in @('A. 測試課目', 'B. 追蹤指標')) {
    if ($want -notin $h2t) { Add-V 'S04' ($rIV.Start + 1) ("＜IV＞缺「## {0}」" -f $want) }
  }
}

# ---------- spec 鏈 ----------
$specNums = @([regex]::Matches($raw, 'spec#(\d+)') | ForEach-Object { [int]$_.Groups[1].Value })
$specSet = @($specNums | Sort-Object -Unique)
$bad = Test-Contig $specNums
if ($null -eq $bad) { Add-V 'P01' 1 '未找到任何 spec#N' }
elseif ($bad -ne '') { Add-V 'P01' 1 ("spec 編號須自 1 連續；實際 {0}" -f $bad) }
if ($rIV) {
  $bsec = (H2In $rIV) | Where-Object { $_.Text -eq 'B. 追蹤指標' } | Select-Object -First 1
  if ($bsec) {
    $bseg = ($lines[$bsec.Idx..$rIV.End]) -join "`n"
    foreach ($s in $specSet) {
      if ($bseg -notmatch ("spec#{0}\b" -f $s)) { Add-V 'P02' ($bsec.Idx + 1) ("＜IV.B＞缺 spec#{0} 之追蹤指標" -f $s) }
    }
  }
}
# 3.1：效益指標在 ＜I.D 規格效益＞（IV 已併入各層 D）
if ($is31) {
  $rI = ChapterRange $ch1
  if ($rI) {
    $dsec = (H2In $rI) | Where-Object { $_.Text -eq 'D. 規格效益' } | Select-Object -First 1
    if ($dsec) {
      $dseg = ($lines[$dsec.Idx..$rI.End]) -join "`n"
      foreach ($s in $specSet) {
        if ($dseg -notmatch ("spec#{0}\b" -f $s)) { Add-V 'P02' ($dsec.Idx + 1) ("＜I.D 規格效益＞缺 spec#{0} 之效益指標" -f $s) }
      }
    }
  }
}

# ---------- SOP 追溯鏈 ----------
$catNums = @([regex]::Matches($raw, 'orgsopcat#(\d+)') | ForEach-Object { [int]$_.Groups[1].Value })
$bad = Test-Contig $catNums
if ($null -eq $bad) { Add-V 'T01' 1 '未找到 orgsopcat#N' }
elseif ($bad -ne '') { Add-V 'T01' 1 ("orgsopcat 編號須自 1 連續；實際 {0}" -f $bad) }

$orgNums = @([regex]::Matches($raw, 'orgSop#(\d+)') | ForEach-Object { [int]$_.Groups[1].Value })
$orgSet = @($orgNums | Sort-Object -Unique)
$bad = Test-Contig $orgNums
if ($null -eq $bad) { Add-V 'T02' 1 '未找到 orgSop#N' }
elseif ($bad -ne '') { Add-V 'T02' 1 ("orgSop 編號須自 1 連續；實際 {0}" -f $bad) }

$tsByN = @{}
$tsSet = [System.Collections.Generic.HashSet[string]]::new()
foreach ($mm in [regex]::Matches($raw, 'teamSop#(\d+)\.(\d+)')) {
  $tn = [int]$mm.Groups[1].Value; $tmm = [int]$mm.Groups[2].Value
  if (-not $tsByN.ContainsKey($tn)) { $tsByN[$tn] = [System.Collections.Generic.List[int]]::new() }
  $tsByN[$tn].Add($tmm); [void]$tsSet.Add(("{0}.{1}" -f $tn, $tmm))
}
foreach ($tn in ($tsByN.Keys | Sort-Object)) {
  if ($tn -notin $orgSet) { Add-V 'T03' 1 ("teamSop#{0}.M 無對應 orgSop#{0}" -f $tn) }
  $bad = Test-Contig @($tsByN[$tn])
  if ($bad) { Add-V 'T03' 1 ("teamSop#{0}.M 之 M 須自 1 連續；實際 {1}" -f $tn, $bad) }
}
foreach ($tn in $orgSet) {
  if (-not $tsByN.ContainsKey($tn)) { Add-V 'T03' 1 ("orgSop#{0} 未被任何 teamSop 承接" -f $tn) }
}

$psByNM = @{}
foreach ($mm in [regex]::Matches($raw, 'prsnSop#(\d+)\.(\d+)\.(\d+)')) {
  $NM = "{0}.{1}" -f $mm.Groups[1].Value, $mm.Groups[2].Value
  $pk = [int]$mm.Groups[3].Value
  if (-not $psByNM.ContainsKey($NM)) { $psByNM[$NM] = [System.Collections.Generic.List[int]]::new() }
  $psByNM[$NM].Add($pk)
}
foreach ($NM in ($psByNM.Keys | Sort-Object)) {
  if (-not $tsSet.Contains($NM)) { Add-V 'T04' 1 ("prsnSop#{0}.K 無對應 teamSop#{0}" -f $NM) }
  $bad = Test-Contig @($psByNM[$NM])
  if ($bad) { Add-V 'T04' 1 ("prsnSop#{0}.K 之 K 須自 1 連續；實際 {1}" -f $NM, $bad) }
}
foreach ($NM in $tsSet) {
  if (-not $psByNM.ContainsKey($NM)) { Add-V 'T04' 1 ("teamSop#{0} 未被任何 prsnSop 承接" -f $NM) }
}

# T05：反查視圖（如 III.C.(C)）之 bare #N.M.K 參照須存在於 prsnSop 定義集（防 derived 漂移）
$psDef = [System.Collections.Generic.HashSet[string]]::new()
foreach ($m in [regex]::Matches($raw, 'prsnSop#(\d+\.\d+\.\d+)')) { [void]$psDef.Add($m.Groups[1].Value) }
$danglingSeen = [System.Collections.Generic.HashSet[string]]::new()
foreach ($m in [regex]::Matches($raw, '(?<!prsnSop)#(\d+\.\d+\.\d+)')) {
  $ref = $m.Groups[1].Value
  if (-not $psDef.Contains($ref) -and $danglingSeen.Add($ref)) {
    Add-V 'T05' 1 ("反查參照 #$ref 不存在於 prsnSop 定義集（derived 視圖漂移）")
  }
}

# ---------- 測試編號連續 ----------
function Test-TokenSeq([string]$token, [string]$rule) {
  $nums = @([regex]::Matches($raw, ($token + '#(\d+)')) | ForEach-Object { [int]$_.Groups[1].Value })
  $b = Test-Contig $nums
  if ($null -eq $b) { Add-V $rule 1 ("未找到 {0}#N" -f $token) }
  elseif ($b -ne '') { Add-V $rule 1 ("{0} 編號須自 1 連續；實際 {1}" -f $token, $b) }
}
Test-TokenSeq 'cfgTest' 'Q01'
Test-TokenSeq 'docProgTest' 'Q02'
Test-TokenSeq 'e2eTest' 'Q03'

# intTest 以表格列承載（唯一以裸編號起首的表）：| NN | ... |
$itNums = @()
for ($i = 0; $i -lt $n; $i++) {
  if (-not $fenceState[$i] -and $lines[$i] -match '^\|\s*(\d+)\s*\|') { $itNums += [int]$Matches[1] }
}
$bad = Test-Contig $itNums
if ($null -eq $bad) { Add-V 'Q04' 1 '未找到 intTest 編號列（遞增整合測試表 | NN | …）' }
elseif ($bad -ne '') { Add-V 'Q04' 1 ("intTest 編號須自 1 連續；實際 {0}" -f $bad) }

# ---------- G：標題前後空行 ----------
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i]) { continue }
  if ($lines[$i] -match '^#{1,6} ') {
    if ($i -gt 0 -and $lines[$i - 1].Trim() -ne '' -and $lines[$i - 1] -ne '---') {
      Add-V 'G01' ($i + 1) ("標題前須留空白行：{0}" -f $lines[$i].Trim())
    }
    if ($i -lt $n - 1 -and $lines[$i + 1].Trim() -ne '') {
      Add-V 'G01' ($i + 1) ("標題後須留空白行：{0}" -f $lines[$i].Trim())
    }
  }
}

# ---------- D01：域完整性（硬規則⑥）----------
# 由 paramDomainPacks 取宣告之任務域數；orgSop 數須 ≥ 域數（每域一 orgSop，平台維保 orgSop 為額外）。
# 防「＜I/II＞宣告了域、＜II/III＞卻沒長出各域 SOP／頁」——域↔頁逐項對應與 evaluator 由 CHECKLIST 人工把關。
$domMatch = [regex]::Match($raw, 'paramDomainPacks\s*[=＝]\s*`?([A-Za-z][A-Za-z0-9,\s_-]*)')
if ($domMatch.Success) {
  $domains = @($domMatch.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[A-Za-z][\w-]*$' })
  if ($domains.Count -gt 0 -and $orgSet.Count -lt $domains.Count) {
    Add-V 'D01' 1 ("宣告 {0} 個任務域（paramDomainPacks: {1}）卻只有 {2} 條 orgSop——每個域須各有自己的 orgSop→teamSop→prsnSop→具名頁（硬規則⑥；不得以通用 OODA『實例化』代替）" -f $domains.Count, ($domains -join ','), $orgSet.Count)
  }
}

# ---------- D02：架構圖（code fence）內不得含 emoji（含舊 🧱）----------
$emojiRe = '[⌀-➿☀-⛿⬀-⯿\uD800-\uDBFF]'
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i] -and $lines[$i] -match $emojiRe) {
    Add-V 'D02' ($i + 1) ("架構圖不得含 emoji（含 🧱）；techStack 改文字標記：{0}" -f $lines[$i].Trim())
  }
}

# ---------- D03：定稿 design 不得殘留 `>>>` 審查標記 ----------
for ($i = 0; $i -lt $n; $i++) {
  if (-not $fenceState[$i] -and $lines[$i] -match '^\s*>>>') {
    Add-V 'D03' ($i + 1) '殘留審查標記 `>>>`（使用者審查註記、非設計內容，定稿前須刪除）'
  }
}

# ---------- D04：文件頭（frontmatter 後、首個一級章前）不得有 blockquote（硬規則⑦）----------
# 導讀與提醒須併入對應章節的 > 註解，不設集中式閱讀規則 blockquote；frontmatter 後直接接 # I。
if ($fmEnd -ge 0 -and $h1.Count -gt 0) {
  for ($i = $fmEnd + 1; $i -lt $h1[0].Idx; $i++) {
    if (-not $fenceState[$i] -and $lines[$i] -match '^\s*>') {
      Add-V 'D04' ($i + 1) '文件頭（frontmatter 與首個一級章之間）不得有 blockquote；導讀與提醒須併入對應章節的 > 註解（硬規則⑦）'
    }
  }
}

# ---------- D05：cfgTest 對象限 etyCfg（非 prsn/團隊）----------
# cfgTest 測「組態符合性」，對象須為軟硬體/組態實體（etyCfg）；人員 prsn／團隊之作業符規無法機械約束，僅 README 道德勸說、不入 cfgTest。
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i]) { continue }
  if ($lines[$i] -match '^\|\s*cfgTest#\d+\s*\|\s*([^|]+?)\s*\|') {
    $target = $Matches[1].Trim()
    if ($target -match 'prsn|團隊') {
      Add-V 'D05' ($i + 1) ("cfgTest 對象限 etyCfg 軟硬體/組態實體，不得為人員/團隊「{0}」（人員符規無法機械測試、僅 README 道德勸說）" -f $target)
    }
  }
}

# ---------- D06：design 獨立——不得引 skill 工具章節（GATE／FORMAT）----------
# GATE/FORMAT 係 skill 內部工具、非設計內容；設計契約（techApp／techItem／hmiIntf）可引。
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i]) { continue }
  $mm06 = [regex]::Match($lines[$i], '＜(GATE|FORMAT)[^＞]*節＞')
  if ($mm06.Success) {
    Add-V 'D06' ($i + 1) ("design 不得引 skill 工具章節「{0}」（GATE/FORMAT 係 skill 內部工具、非設計內容）" -f $mm06.Value)
  }
}

# ---------- D07：架構圖三線圖例（＜(A) 資訊架構＞ 含 mermaid 者須有「三線通則」圖例）----------
for ($i = 0; $i -lt $n; $i++) {
  if ($fenceState[$i]) { continue }
  if ($lines[$i] -match '^### \(A\) 資訊架構') {
    $secEnd = $n - 1
    for ($j = $i + 1; $j -lt $n; $j++) {
      if (-not $fenceState[$j] -and $lines[$j] -match '^#{1,3} ') { $secEnd = $j - 1; break }
    }
    $seg = ($lines[$i..$secEnd]) -join "`n"
    if ($seg -match '```mermaid' -and $seg -notmatch '三線通則') {
      Add-V 'D07' ($i + 1) '＜(A) 資訊架構＞含架構圖卻無「三線通則」圖例（粗＝運行／細＝部署設定／虛＝人員操作）'
    }
  }
}

# ---------- E01–E04：技術選型四層綁層宣告（3.3 限定；FORMAT ＜2.5節＞）----------
# E01 techStyle→＜I.C.(A)＞（且不得殘留舊制 techApp）；E02 techApp→＜II.C.(A)＞；
# E03 techStack→＜III＞ 至少一處；E04 techStack 值限封閉枚舉（自建 5＋現成服務型 2）。
if ($fmt -eq '3.3') {
  function TechSectionText([string]$chapName) {
    $r = ChapterRange $chapName
    if (-not $r) { return $null }
    for ($i = $r.Start; $i -le $r.End; $i++) {
      if (-not $fenceState[$i] -and $lines[$i] -match '^### \(A\) 技術選型') {
        $secEnd = $r.End
        for ($j = $i + 1; $j -le $r.End; $j++) {
          if (-not $fenceState[$j] -and $lines[$j] -match '^#{1,3} ') { $secEnd = $j - 1; break }
        }
        return [pscustomobject]@{ Line = $i + 1; Text = (($lines[$i..$secEnd]) -join "`n") }
      }
    }
    return $null
  }
  $secI = TechSectionText $ch1
  if ($secI) {
    if ($secI.Text -notmatch 'techStyle') { Add-V 'E01' $secI.Line '＜I.C.(A) 技術選型＞須宣告 techStyle（sol 設計主軸；3.3 四層制）' }
    if ($secI.Text -match 'techApp') { Add-V 'E01' $secI.Line '＜I.C.(A)＞不得宣告 techApp（3.1/3.2 舊制位）——3.3 起 techApp 於 ＜II.C.(A)＞ 每 sys 宣告' }
  }
  else { Add-V 'E01' 1 '找不到 ＜I.C.(A) 技術選型＞——3.3 須於此宣告 techStyle' }
  $secII = TechSectionText $ch2
  if ($secII) {
    if ($secII.Text -notmatch 'techApp') { Add-V 'E02' $secII.Line '＜II.C.(A) 技術選型＞須宣告 techApp（每 sys 一個；3.3 四層制）' }
  }
  else { Add-V 'E02' 1 '找不到 ＜II.C.(A) 技術選型＞——3.3 須於此宣告 techApp' }
  $rIII = ChapterRange $ch3
  if ($rIII) {
    $segIII = ($lines[$rIII.Start..$rIII.End]) -join "`n"
    if ($segIII -notmatch 'techStack') { Add-V 'E03' ($rIII.Start + 1) '＜III＞須至少一處 techStack 標記（每 mod 一個：＜III.C.(A)＞ 條列或架構/部署圖之文字標記 techStack: XXX）' }
  }
  $stackAllow = @('StaticWeb', 'ReactWeb', 'NodeSvr', 'PythonSvr', 'WinApp', 'Postgres', 'Nginx')
  $stackSeen = [System.Collections.Generic.HashSet[string]]::new()
  $stackPatterns = @('techStack\s*[:=＝]\s*`?\[?(?:techStack)?([A-Za-z][A-Za-z0-9]*)', '\[techStack([A-Za-z][A-Za-z0-9]*)\]')
  foreach ($pat in $stackPatterns) {
    foreach ($m in [regex]::Matches($raw, $pat)) {
      $v = $m.Groups[1].Value
      if ($v -notin $stackAllow -and $stackSeen.Add($v)) {
        Add-V 'E04' 1 ("techStack 值「{0}」不在封閉枚舉（{1}）——引入新選型＝修 TECHSTACK 家規，不得臨時自創" -f $v, ($stackAllow -join '/'))
      }
    }
  }
}

# ---------- D08：發行物命名結構合規（trainFlow FORMAT ＜4節＞；design 端機判）----------
# 發行名＝依 sol／sys／mod 結構算出：image `sol[-sys[-mod]]`、chart `sol-chart`（-chart 後綴防與同層 image 撞 OCI path）；
# 全小寫、自設計名算出（禁 repo 消歧尾碼）。僅於 design 宣告 GHCR image／chart 時檢查（純靜態／桌面／無 registry 者跳過）。
$solSlug = ''
if ($fmEnd -ge 0) {
  $fmNameM = [regex]::Match((($lines[1..($fmEnd - 1)]) -join "`n"), '(?m)^name:\s*(\S+)')
  if ($fmNameM.Success) { $solSlug = ($fmNameM.Groups[1].Value.ToLower() -replace '[^a-z0-9]', '') }
}
if ($solSlug) {
  $imgNames = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($m in [regex]::Matches($raw, 'ghcr\.io/[a-z0-9._-]+/([a-z0-9._-]+)')) { [void]$imgNames.Add($m.Groups[1].Value) }
  $chartNames = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($m in [regex]::Matches($raw, '(?:helm |param)?[Cc]hart(?:Name)?\s*[＝=]\s*`([a-z0-9._-]+)`')) { [void]$chartNames.Add($m.Groups[1].Value) }
  if ($imgNames.Count -gt 0 -or $chartNames.Count -gt 0) {
    foreach ($img in $imgNames) {
      if (-not $img.StartsWith($solSlug)) { Add-V 'D08' 1 ("image 發行名「{0}」未以方案名幹「{1}」起始——發行名須自 sol／sys／mod 設計名算出、禁抓 repo 名或消歧尾碼（FORMAT ＜4節＞）" -f $img, $solSlug) }
      elseif ($img -match ('^' + [regex]::Escape($solSlug) + '\d')) { Add-V 'D08' 1 ("image 發行名「{0}」疑帶 repo 消歧尾碼（方案名幹後直接接數字）；須為乾淨結構路徑 sol[-sys[-mod]]" -f $img) }
    }
    foreach ($ch in $chartNames) {
      if (-not $ch.EndsWith('-chart')) { Add-V 'D08' 1 ("chart 發行名「{0}」須帶 -chart 後綴——防與同層 image 撞同一 OCI path 同 tag（FORMAT ＜4節＞）" -f $ch) }
      if (-not $ch.StartsWith($solSlug)) { Add-V 'D08' 1 ("chart 發行名「{0}」未以方案名幹「{1}」起始" -f $ch, $solSlug) }
      if ($imgNames.Contains($ch)) { Add-V 'D08' 1 ("chart 發行名「{0}」與 image 同名——OCI 同 path 同 tag 會撞；chart 須加 -chart 後綴" -f $ch) }
    }
  }
}

# ---------- 報告 ----------
Write-Host ("docLint formatVersion {0} — 檔案：{1}" -f $fmt, $Path)
if ($violations.Count -eq 0) {
  Write-Host '結果：PASS（0 違規）' -ForegroundColor Green
  exit 0
}
$violations | Sort-Object Line, Rule | ForEach-Object { Write-Host ("[{0}] 第 {1} 行：{2}" -f $_.Rule, $_.Line, $_.Msg) }
Write-Host ("結果：FAIL（{0} 項違規）" -f $violations.Count) -ForegroundColor Red
exit 1
