@echo off
REM Explore UniFi Access Devices Structure

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Explore UniFi Access Devices
echo ==========================================
echo.

node scripts/explore-devices.js

pause
