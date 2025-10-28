param(
  [switch]$Mock
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[ClarityCompass] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[ClarityCompass] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ClarityCompass] $msg" -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root 'backend'

# ----- Start Backend in a new window -----
Write-Info "Launching backend (FastAPI) in a new window..."

$backendScript = Join-Path $env:TEMP 'clarity_backend_start.ps1'
$backendContent = @'
if (!(Test-Path .venv)) {
  try { py -m venv .venv } catch { python -m venv .venv }
}
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
$env:AUTH_MODE = 'dev'
$env:ALLOWED_ORIGINS = 'http://localhost:9003'
& ".\.venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
'@
Set-Content -Path $backendScript -Value $backendContent -Encoding UTF8
Start-Process powershell -WorkingDirectory $backendDir -ArgumentList @('-NoExit','-File', $backendScript) | Out-Null

# ----- Start Frontend in a new window -----
Write-Info "Launching frontend (Next.js) in a new window..."

$useMock = if ($Mock) { 'true' } else { 'false' }
$frontendScript = Join-Path $env:TEMP 'clarity_frontend_start.ps1'
$frontendTemplate = @'
$env:NEXT_PUBLIC_USE_MOCK_API = '{USE_MOCK}'
$env:NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8000'
npm install
npm run dev
'@
$frontendContent = $frontendTemplate -replace '\{USE_MOCK\}', $useMock
Set-Content -Path $frontendScript -Value $frontendContent -Encoding UTF8
Start-Process powershell -WorkingDirectory $root -ArgumentList @('-NoExit','-File', $frontendScript) | Out-Null

Write-Host "" 
Write-Info "Two windows were opened: Backend on :8000 and Frontend on :9003"
Write-Info "Visit http://localhost:9003 and log in via Dev Login"
if ($Mock) { Write-Warn "Frontend started in MOCK API mode (no backend required)." }
