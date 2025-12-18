@echo off
REM Avengement AI Backend Launcher for Windows
REM Run this to start the backend server

echo.
echo ╔════════════════════════════════════════╗
echo ║  Avengement AI Backend Launcher        ║
echo ║  Windows Batch Script                  ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Show Node version
echo [OK] Node.js found:
node --version
npm --version
echo.

REM Check if npm packages are installed
if not exist "node_modules" (
    echo [INFO] Dependencies not found, installing...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo Make sure you're in the ai-backend directory
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

REM Check if Ollama is running
echo [INFO] Checking Ollama connection...
timeout /t 2 /nobreak >nul

REM Try to connect to Ollama
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:11434' -ErrorAction Stop; Write-Host '[OK] Ollama is running' -ForegroundColor Green } catch { Write-Host '[WARNING] Cannot reach Ollama at http://localhost:11434' -ForegroundColor Yellow; Write-Host '         Make sure Ollama is running (ollama serve)' -ForegroundColor Yellow }"
echo.

REM Start the backend
echo [INFO] Starting Avengement AI Backend Server...
echo [INFO] Press Ctrl+C to stop
echo.
echo ╔════════════════════════════════════════╗
echo ║  Backend running on:                   ║
echo ║  http://localhost:3001                 ║
echo ║                                        ║
echo ║  Open game.html in browser             ║
echo ║  Look for: 🟢 AI Ready                 ║
echo ╚════════════════════════════════════════╝
echo.

call npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start
    echo Check the error message above
    pause
    exit /b 1
)
