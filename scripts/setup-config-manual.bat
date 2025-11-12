@echo off
REM Manual Config Setup Helper

echo.
echo ==========================================
echo Manual Config Setup
echo ==========================================
echo.

cd /d "%~dp0\.."

echo This script will help you manually set up the configuration.
echo.
echo Step 1: Copy the config file
echo ==========================================
echo.
echo Run this command in an Administrator Command Prompt:
echo.
echo   mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
echo   copy "%cd%\config-unifi-os.json" "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
echo.
echo OR, copy the config to the current directory instead:
echo.
echo   copy "%cd%\config-unifi-os.json" "%cd%\config.json"
echo.
echo ==========================================
echo.
echo The config file contains your UniFi API key.
echo You still need to add your Doordeck credentials.
echo.
echo Config file location options:
echo   1. C:\ProgramData\UniFi-Doordeck-Bridge\config.json (default)
echo   2. %cd%\config.json (local)
echo.
echo ==========================================
echo.

pause

echo.
echo Opening config file location in Explorer...
echo.
explorer "%cd%"

echo.
echo Next steps:
echo.
echo 1. Copy config-unifi-os.json to one of the locations above
echo 2. Edit the copied file and add your Doordeck credentials
echo 3. Run: scripts\test-service-startup.bat
echo.

pause
