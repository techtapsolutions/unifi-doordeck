@echo off
REM Update Config to Use API Key Authentication

echo.
echo ==========================================
echo Update Config to API Key Authentication
echo ==========================================
echo.

cd /d "%~dp0\.."

REM Create config directory if it doesn't exist
if not exist "C:\ProgramData\UniFi-Doordeck-Bridge" (
    echo Creating config directory...
    mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
)

REM Backup existing config if it exists
if exist "C:\ProgramData\UniFi-Doordeck-Bridge\config.json" (
    echo.
    echo Backing up existing config...
    copy "C:\ProgramData\UniFi-Doordeck-Bridge\config.json" "C:\ProgramData\UniFi-Doordeck-Bridge\config.json.backup" >nul
    echo   Backup saved to: config.json.backup
)

REM Copy the new config
echo.
echo Copying UniFi OS config (API key authentication)...
copy "config-unifi-os.json" "C:\ProgramData\UniFi-Doordeck-Bridge\config.json" >nul

if %ERRORLEVEL% EQU 0 (
    echo   ✓ Config file updated successfully!
) else (
    echo   ✗ Failed to copy config file
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Configuration Updated
echo ==========================================
echo.
echo The service will now use:
echo   - UniFi OS API Key authentication
echo   - Host: 192.168.1.1
echo   - API Key: YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY
echo.
echo IMPORTANT: You still need to update the Doordeck credentials!
echo.
echo Edit: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
echo.
echo Update these fields:
echo   "apiToken": "your-doordeck-api-token"
echo   "email": "your-email@example.com"
echo   "password": "your-doordeck-password"
echo.
echo After updating Doordeck credentials, run:
echo   scripts\test-service-startup.bat
echo.

pause
