@echo off
REM Test Unlock Endpoint Discovery

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Test Unlock Endpoint Discovery
echo ==========================================
echo.
echo WARNING: This will attempt to unlock your door!
echo.

node scripts/test-unlock-endpoint.js

pause
