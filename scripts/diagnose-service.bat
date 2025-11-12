@echo off
REM Service Diagnostics Script
REM Helps identify why the service isn't starting or accessible

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ==========================================
echo UniFi-Doordeck Bridge - Service Diagnostics
echo ==========================================
echo.

node scripts/diagnose-service.js

echo.
pause
