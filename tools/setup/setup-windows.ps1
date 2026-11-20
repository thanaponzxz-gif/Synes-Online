# Synes Online: ตั้งโฟลเดอร์โปรเจคบน Windows ให้เซสชันใหม่ทุกเซสชันเปิด Remote Control อัตโนมัติ
#
# วิธีใช้ (PowerShell ในโฟลเดอร์ที่ clone repo ไว้แล้ว):
#   git clone https://github.com/<คุณ>/synes-online.git "$HOME\Projects\Synes Online"
#   cd "$HOME\Projects\Synes Online"
#   powershell -ExecutionPolicy Bypass -File tools\setup\setup-windows.ps1
#
# สคริปต์นี้ทำ 3 อย่าง และสำรองไฟล์ก่อนแก้ทุกครั้ง:
#   1) npm ci (ถ้ามี Node.js)
#   2) ตั้ง "remoteControlAtStartup": true ใน %USERPROFILE%\.claude\settings.json
#      ระบบไม่อ่านค่านี้จาก settings ของ repo ต้องตั้งระดับผู้ใช้เท่านั้น ซึ่งมีผลกับทุกโปรเจคบนเครื่องนี้
#   3) บอกขั้นตอนที่ต้องกดเองในแอป Claude
# ค่า "บีบอัดที่ 450k" อยู่ใน .claude\settings.json ของ repo แล้ว (autoCompactWindow) ไม่ต้องตั้งเพิ่ม

param([switch]$SkipNpm, [switch]$SkipRemoteControl)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Write-Host "Synes Online project folder: $root"

if (-not $SkipNpm) {
  if (Get-Command npm -ErrorAction SilentlyContinue) { Push-Location $root; npm ci; Pop-Location }
  else { Write-Warning 'ไม่พบ npm: ติดตั้ง Node.js 22 LTS แล้วรัน npm ci ในโฟลเดอร์นี้' }
}

if (-not $SkipRemoteControl) {
  $dir = Join-Path $HOME '.claude'; $file = Join-Path $dir 'settings.json'
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  if (Test-Path $file) {
    Copy-Item $file "$file.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
    $raw = Get-Content $file -Raw
    $cfg = if ($raw.Trim()) { $raw | ConvertFrom-Json } else { [pscustomobject]@{} }
  } else { $cfg = [pscustomobject]@{} }
  if ($cfg.PSObject.Properties.Name -contains 'remoteControlAtStartup') { $cfg.remoteControlAtStartup = $true }
  else { $cfg | Add-Member -NotePropertyName remoteControlAtStartup -NotePropertyValue $true }
  $json = $cfg | ConvertTo-Json -Depth 32
  [System.IO.File]::WriteAllText($file, $json, (New-Object System.Text.UTF8Encoding $false)) # no BOM: JSON readers reject it
  Write-Host "ตั้ง remoteControlAtStartup = true ใน $file แล้ว (สำรองไฟล์เดิมไว้ข้างกัน)"
}

Write-Host ''
Write-Host 'ขั้นตอนที่ต้องทำเองในแอป Claude (desktop):'
Write-Host "  1) Settings > Claude Code > Remote Control > เพิ่มโฟลเดอร์: $root"
Write-Host '  2) เปิดเซสชันใหม่ในโฟลเดอร์นี้ (หรือรัน: claude remote-control) แล้วเซสชันจะขึ้นในแอป Claude บนมือถือเอง'
Write-Host '  3) เซสชันแรกให้พิมพ์: "/synes-pm ทำงานต่อจาก docs/HANDOFF.md"'
