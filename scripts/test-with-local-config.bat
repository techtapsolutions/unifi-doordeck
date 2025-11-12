@echo off
REM Test Service with Local Config File

cd /d "%~dp0\.."

echo.
echo ==========================================
echo UniFi-Doordeck Bridge - Test with Local Config
echo ==========================================
echo.

REM Check if local config exists
if not exist "config.json" (
    echo Creating local config.json from template...
    copy "config-unifi-os.json" "config.json" >nul

    if %ERRORLEVEL% EQU 0 (
        echo   ✓ Config file created: config.json
        echo.
        echo   ⚠️  IMPORTANT: You need to add your Doordeck credentials!
        echo.
        echo   Edit: %cd%\config.json
        echo.
        echo   Update these fields:
        echo     "apiToken": "your-doordeck-api-token"
        echo     "email": "your-email@example.com"
        echo     "password": "your-doordeck-password"
        echo.
        pause
    ) else (
        echo   ✗ Failed to create config file
        pause
        exit /b 1
    )
)

echo Working directory: %cd%
echo Using config file: %cd%\config.json
echo.
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

REM Set environment variable to use local config
set CONFIG_PATH=%cd%\config.json

REM Run the service
node dist-service\service-main.js

echo.
echo ==========================================
echo Service stopped (exit code: %ERRORLEVEL%)
echo ==========================================
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Service exited with error code %ERRORLEVEL%
    echo.
    echo Common issues:
    echo   1. Config file missing or invalid JSON
    echo   2. Missing dependencies (run: npm install^)
    echo   3. Port 9090 already in use
    echo   4. Invalid credentials in config
    echo.
    echo Run diagnostics for more details:
    echo   scripts\diagnose-service.bat
    echo.
)

pause
