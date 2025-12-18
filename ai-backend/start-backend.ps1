# Avengement AI Backend Launcher for Windows PowerShell
# Run: powershell -ExecutionPolicy Bypass -File start-backend.ps1

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Avengement AI Backend Launcher        ║" -ForegroundColor Cyan
Write-Host "║  PowerShell Version                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "[CHECK] Node.js..." -ForegroundColor Yellow
$nodeExists = (Get-Command node -ErrorAction SilentlyContinue) -ne $null
if (-not $nodeExists) {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "Please install from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Node.js found:" -ForegroundColor Green
node --version
npm --version
Write-Host ""

# Check and install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] Dependencies installed`n" -ForegroundColor Green
}

# Check Ollama
Write-Host "[CHECK] Ollama connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Ollama is running at http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Cannot reach Ollama at http://localhost:11434" -ForegroundColor Yellow
    Write-Host "         Make sure to run: ollama serve" -ForegroundColor Yellow
}
Write-Host ""

# Start backend
Write-Host "[INFO] Starting Avengement AI Backend..." -ForegroundColor Yellow
Write-Host "`n╔════════════════════════════════════════╗"
Write-Host "║  Backend Server                        ║"
Write-Host "║  http://localhost:3001                 ║"
Write-Host "║                                        ║"
Write-Host "║  ✓ Open game.html in browser           ║"
Write-Host "║  ✓ Look for: 🟢 AI Ready               ║"
Write-Host "║  ✓ Press Ctrl+C to stop                ║"
Write-Host "╚════════════════════════════════════════╝`n"

npm start

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Backend failed to start" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
