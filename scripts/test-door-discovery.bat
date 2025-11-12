@echo off
REM Test Door Discovery

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Test Door Discovery
echo ==========================================
echo.

node scripts/test-door-discovery.js

pause
