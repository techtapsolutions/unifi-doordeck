@echo off
REM Test Relay Unlock Endpoint

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Test Relay Unlock Endpoint
echo ==========================================
echo.
echo WARNING: This will attempt to unlock your door!
echo.

node scripts/test-relay-unlock.js

pause
