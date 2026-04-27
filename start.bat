@echo off
echo ========================================
echo   Starting Exam System Services
echo ========================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is not installed or not in PATH
    echo Please install Go from: https://go.dev/dl/
    pause
    exit /b 1
)

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Starting Golang Backend...
cd golang-backend
start "Golang Backend" cmd /k "go run cmd/server/main.go"
timeout /t 3 >nul

echo [2/4] Starting Next.js Frontend...
cd ..\frontend
start "Next.js Frontend" cmd /k "npm run dev"
timeout /t 3 >nul

echo [3/4] Services are starting...
timeout /t 2 >nul

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Press any key to open browser...
pause >nul

REM Open browser
start http://localhost:3000

echo.
echo To stop services: Close both command windows
echo.
pause
