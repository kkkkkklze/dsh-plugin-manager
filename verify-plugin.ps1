# verify-plugin.ps1 — dsh-plugin-manager 一键验收(契约 + 逻辑 + 真实启动 + 一致性)
# 用法: pwsh -File verify-plugin.ps1 [-PackagePath 包目录] [-BootProfile pmv2] [-SkipBoot]
param(
  [string]$PackagePath = $PSScriptRoot,
  [string]$BootProfile = 'pmv2',
  [switch]$SkipBoot
)
$ErrorActionPreference = 'Stop'
function Say($m) { Write-Host ('[' + (Get-Date -Format 'HH:mm:ss') + '] ' + $m) }
$failures = @()

if (-not (Test-Path (Join-Path $PackagePath 'verify.mjs'))) { Say 'FATAL: 包目录缺少 verify.mjs'; exit 2 }

# 1) 沙箱副本 —— 必须放在 profiles\node_modules 内,依赖(@deepseek-ai/*)才能解析
$profNm = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules'
$sandbox = Join-Path $profNm ('pm-verify-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '\dsh-plugin-manager')
New-Item -ItemType Directory -Force -Path $sandbox | Out-Null
Copy-Item (Join-Path $PackagePath '*') $sandbox -Recurse
Say '沙箱副本: ' + $sandbox

# 2) 契约 + 逻辑 + HTTP 套件(在沙箱内运行,裸名导入与依赖解析同线上)
Say '运行 Node 测试套件...'
Push-Location $sandbox
try { $nodeOut = & node verify.mjs 2>&1 | Out-String } finally { Pop-Location }
Write-Host $nodeOut
if ($LASTEXITCODE -ne 0) { $failures += 'node 测试套件(exit ' + $LASTEXITCODE + ')' }

# 3) 真实启动检查(与线上完全相同的加载路径)
if (-not $SkipBoot) {
  $prof = Join-Path $env:USERPROFILE ('.dsh\profiles\' + $BootProfile)
  if (-not (Test-Path $prof)) { Say '跳过启动检查:profile 不存在(' + $prof + ')' }
  else {
    $dsh = Join-Path $env:APPDATA 'npm\dsh.cmd'
    if (-not (Test-Path $dsh)) { $dsh = (Get-Command dsh).Source }
    Say '真实启动检查: dsh --profile ' + $BootProfile + ' ...'
    $boot = & $dsh --profile $BootProfile 'say ok' 2>&1 | Out-String
    $boot -split '\r?\n' | Where-Object { $_ -match 'dsh-plugin-manager' } | ForEach-Object { Write-Host '  ' + $_.Trim() }
    if (($LASTEXITCODE -eq 0) -and ($boot -match '\[dsh-plugin-manager\] loaded')) { Say '启动检查 PASS' }
    else { Say '启动检查 FAIL(exit ' + $LASTEXITCODE + ')'; $failures += '真实启动(profile ' + $BootProfile + ')' }
  }
}

# 4) 与安装副本的一致性(防漂移:验过的不等于装上的)
$installed = Join-Path $profNm 'dsh-plugin-manager'
if (Test-Path $installed) {
  foreach ($f in @('package.json','engine.js','index.js','manager.js','remote.js','client-bundle.js','default-tags.yml','default-descriptions.yml','cordis.patch.yml','verify.mjs')) {
    $sp = Join-Path $sandbox $f
    $ip = Join-Path $installed $f
    if ((Test-Path $sp) -and (Test-Path $ip)) {
      $a = (Get-FileHash $sp).Hash
      $b = (Get-FileHash $ip).Hash
      if ($a -ne $b) { $failures += '漂移: ' + $f + ' 与安装副本不一致' }
    }
  }
  if ($failures | Where-Object { $_ -like '漂移:*' }) { Say '一致性检查 FAIL' } else { Say '一致性检查 PASS(安装副本 == 已验证副本)' }
} else { Say '未安装到 profiles\node_modules,跳过一致性检查' }

# 5) 溯源
$pkgHash = (Get-FileHash (Join-Path $sandbox 'package.json')).Hash
Say '已验证 package.json SHA-256: ' + $pkgHash

Remove-Item $sandbox -Recurse -Force
if ($failures.Count -eq 0) { Say '===== ALL PASS:该副本通过全部验收 ====='; exit 0 }
Say ('===== FAILURES: ' + ($failures -join ' | ') + ' ====='); exit 1
