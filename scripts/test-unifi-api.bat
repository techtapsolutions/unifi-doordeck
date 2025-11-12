@echo off
REM Test UniFi OS API Key Authentication

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ==========================================
echo Test UniFi OS API Key Authentication
echo ==========================================
echo.

node scripts/test-unifi-os-api.js

pause
