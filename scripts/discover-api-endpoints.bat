@echo off
REM Discover API Endpoints

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Discover API Endpoints
echo ==========================================
echo.

node scripts/discover-api-endpoints.js

pause
