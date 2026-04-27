# ==============================================
# Start Exam System Services (PowerShell)
# ==============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Exam System Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Go installation
try {
    $goVersion = go version 2>$null
    Write-Host "[✓] Go installed: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Go is not installed or not in PATH" -ForegroundColor Red
    Write-Host "    Install from: https://go.dev/dl/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node installation
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[✓] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "    Install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/4] Starting Golang Backend..." -ForegroundColor Yellow

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\golang-backend'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; go run cmd/server/main.go"

Start-Sleep -Seconds 3

Write-Host "[2/4] Starting Next.js Frontend..." -ForegroundColor Yellow

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[3/4] Services are starting..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Wait and open browser
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "To stop services: Close both PowerShell windows" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"
