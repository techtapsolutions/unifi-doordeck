@echo off
REM Find Correct Doors Endpoint

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Find Doors Endpoint
echo ==========================================
echo.

node scripts/find-doors-endpoint.js

pause
