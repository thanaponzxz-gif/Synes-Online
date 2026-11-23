# Synes Online: เตรียม Blender MCP (MCP for Blender 2.3.1) บน Windows ตามเงื่อนไขของเจ้าของ (ADR-010, 2026-11-23)
#
# ค่าเริ่มคือ "ตรวจอย่างเดียว" ไม่แก้อะไรในเครื่อง:
#   powershell -ExecutionPolicy Bypass -File tools\setup\setup-blender-mcp.ps1
# เมื่อดูผลตรวจแล้วและต้องการให้ทำจริง:
#   powershell -ExecutionPolicy Bypass -File tools\setup\setup-blender-mcp.ps1 -Apply
# หลังเปิด Blender และกด Connect แล้ว ตรวจว่า socket ฟังเฉพาะ localhost:
#   powershell -ExecutionPolicy Bypass -File tools\setup\setup-blender-mcp.ps1 -Verify
#
# สิ่งที่สคริปต์นี้ "ไม่ทำ" เด็ดขาด: ติดตั้ง Blender, ติดตั้ง uv, ติดตั้ง add-on ซ้ำ, เปิด firewall,
# เปิด Allow Remote Connections, เปิด telemetry, ใส่ API key ของบริการ premium
# ที่มาของโค้ด: https://github.com/ahujasid/blender-mcp (MIT) ทีม B ตรวจที่ commit a5a8acf แล้ว

param([switch]$Apply, [switch]$Verify)
$ErrorActionPreference = 'Stop'
$Pkg = 'mcp-for-blender@2.3.1'   # ล็อกเวอร์ชันที่ตรวจโค้ดแล้ว ห้ามใช้ @latest
$Port = 9876
$ok = $true
function Info($m) { Write-Host "  $m" }
function Warn($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }

if ($Verify) {
  Write-Host '== ตรวจ socket ของ Blender MCP'
  $l = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $l) { Warn "ไม่มีโปรแกรมฟังพอร์ต $Port (เปิด Blender แล้วกด Connect ในแท็บ MCP for Blender ก่อน)"; exit 1 }
  $bad = $l | Where-Object { $_.LocalAddress -notin @('127.0.0.1', '::1') }
  $l | ForEach-Object { Info "ฟังที่ $($_.LocalAddress):$Port (PID $($_.OwningProcess))" }
  if ($bad) { Warn 'socket เปิดรับจากภายนอก! ปิด Blender แล้วตั้ง Bind Address = localhost และปิด Allow Remote Connections'; exit 2 }
  $fw = Get-NetFirewallPortFilter -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq "$Port" }
  if ($fw) { Warn "มีกฎ firewall ที่อ้างพอร์ต $Port อยู่ ให้ตรวจว่าไม่ได้เปิดรับขาเข้า" } else { Info "ไม่มีกฎ firewall สำหรับพอร์ต $Port (ดี)" }
  Write-Host 'ผ่าน: ฟังเฉพาะ localhost'; exit 0
}

Write-Host '== 1) Blender ที่มีอยู่ในเครื่อง'
$blenders = @()
$cmd = Get-Command blender -ErrorAction SilentlyContinue
if ($cmd) { $blenders += $cmd.Source }
foreach ($root in @("$env:ProgramFiles\Blender Foundation", "${env:ProgramFiles(x86)}\Steam\steamapps\common\Blender")) {
  if (Test-Path $root) { $blenders += Get-ChildItem $root -Recurse -Filter blender.exe -ErrorAction SilentlyContinue | ForEach-Object FullName }
}
$blenders = $blenders | Sort-Object -Unique
if ($blenders) { $blenders | ForEach-Object { Info $_ } }
else { Warn 'ไม่พบ Blender: ดาวน์โหลดจาก https://www.blender.org/download/ เอง แล้วรันสคริปต์นี้ใหม่ (สคริปต์ไม่ติดตั้งให้)'; $ok = $false }
$cfg = Join-Path $env:APPDATA 'Blender Foundation\Blender'
if (Test-Path $cfg) { Info ("โฟลเดอร์ตั้งค่า Blender: " + ((Get-ChildItem $cfg -Directory | ForEach-Object Name) -join ', ')) }

Write-Host '== 2) uv / uvx'
$uvx = Get-Command uvx -ErrorAction SilentlyContinue
if ($uvx) { Info "$($uvx.Source) ($(& uv --version 2>$null))" }
else { Warn 'ไม่พบ uvx: ติดตั้งเองด้วย  winget install --id=astral-sh.uv -e  (https://docs.astral.sh/uv/) แล้วเปิด terminal ใหม่'; $ok = $false }

Write-Host '== 3) add-on MCP for Blender ที่ติดตั้งไว้แล้ว'
$found = @()
if (Test-Path $cfg) {
  $found = Get-ChildItem $cfg -Recurse -Include *.py -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\(scripts\\addons|extensions\\user_default)\\' } |
    Where-Object { Select-String -Path $_.FullName -Pattern '"name":\s*"MCP for Blender"|"name":\s*"Blender MCP"' -Quiet }
}
if ($found) { $found | ForEach-Object { Info "พบแล้ว: $($_.FullName)  (จะไม่ติดตั้งซ้ำ)" } } else { Info 'ยังไม่มี add-on' }

Write-Host '== 4) Claude Code: MCP server ชื่อ blender (scope user)'
$claude = Get-Command claude -ErrorAction SilentlyContinue
$hasMcp = $false
if ($claude) { & claude mcp get blender *> $null; $hasMcp = ($LASTEXITCODE -eq 0) }
else { Warn 'ไม่พบคำสั่ง claude (Claude Code) ข้ามขั้นนี้'; }
if ($hasMcp) { Info 'มีอยู่แล้ว (ไม่เพิ่มซ้ำ) ตรวจค่าด้วย: claude mcp get blender' }

if (-not $Apply) { Write-Host "`nตรวจอย่างเดียวเสร็จ ถ้าผลถูกต้อง รันซ้ำด้วย -Apply"; exit ([int](-not $ok)) }
if (-not $ok) { Warn 'ยังขาด Blender หรือ uv: ไม่ทำต่อ'; exit 1 }

if (-not $found) {
  Write-Host "== ติดตั้ง add-on ($Pkg install-addon)"
  & $uvx.Source $Pkg install-addon
  if ($LASTEXITCODE -ne 0) { Warn 'ติดตั้ง add-on ไม่สำเร็จ'; exit 1 }
}
if ($claude -and -not $hasMcp) {
  Write-Host '== เพิ่ม MCP server (safe mode เปิด, telemetry ปิด, ต่อเฉพาะ localhost)'
  & claude mcp add blender --scope user `
    -e BLENDER_MCP_SAFE_MODE=1 -e DISABLE_TELEMETRY=true -e BLENDER_MCP_DISABLE_TELEMETRY=true `
    -e BLENDER_HOST=localhost -e BLENDER_PORT=$Port -- uvx $Pkg
  if ($LASTEXITCODE -ne 0) { Warn 'เพิ่ม MCP server ไม่สำเร็จ'; exit 1 }
}
Write-Host @"

ขั้นที่ต้องทำเองใน Blender (สคริปต์ตั้งให้ไม่ได้):
  1. Edit > Preferences > Add-ons > เปิด "MCP for Blender"
  2. ในหน้า preferences ของ add-on: Bind Address = localhost · Allow Remote Connections = ปิด · Allow Telemetry = ปิด
  3. กด N > แท็บ MCP for Blender: ปิด Poly Haven, Sketchfab, Hyper3D และบริการสร้างโมเดลทั้งหมด (asset ภายนอกต้องผ่าน pipeline) แล้วกด Connect
  4. รัน: powershell -ExecutionPolicy Bypass -File tools\setup\setup-blender-mcp.ps1 -Verify
  5. ปิด Connect เมื่อไม่ได้ใช้
"@
