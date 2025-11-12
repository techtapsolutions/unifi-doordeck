@echo off
REM Test Service Startup Script
REM Runs the service directly to see any error messages

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ==========================================
echo UniFi-Doordeck Bridge - Test Service Startup
echo ==========================================
echo.
echo Working directory: %cd%
echo.

REM Check if service script exists
if not exist "dist-service\service-main.js" (
    echo ERROR: Service script not found!
    echo Expected: dist-service\service-main.js
    echo.
    echo Please build the service first:
    echo   npm run build:service
    echo.
    pause
    exit /b 1
)

echo Starting service in test mode...
echo Press Ctrl+C to stop
echo.
echo If the service starts successfully, you should see:
echo   "Service API started on http://127.0.0.1:9090"
echo.
echo Then you can test the API at:
echo   http://localhost:9090/api/health
echo.
echo ==========================================
echo.

REM Set config path
set CONFIG_PATH=C:\ProgramData\UniFi-Doordeck-Bridge\config.json

REM Run the service
node dist-service/service-main.js

echo.
echo ==========================================
echo Service stopped (exit code: %errorLevel%)
echo ==========================================
echo.

if %errorLevel% neq 0 (
    echo ERROR: Service exited with error code %errorLevel%
    echo.
    echo Common issues:
    echo   1. Config file missing or invalid JSON
    echo   2. Missing dependencies (run: npm install)
    echo   3. Port 9090 already in use
    echo   4. Invalid credentials in config
    echo.
    echo Run diagnostics for more details:
    echo   scripts\diagnose-service.bat
    echo.
)

pause
