@echo off
REM Restart UniFi-Doordeck Bridge Service

echo.
echo Restarting UniFi-Doordeck Bridge Service...
echo.

echo Stopping service...
net stop UniFiDoordeckBridge
timeout /t 2 >nul

echo Starting service...
net start UniFiDoordeckBridge

if %errorLevel% equ 0 (
    echo.
    echo Service restarted successfully!
    echo.
    timeout /t 2 >nul
    sc query UniFiDoordeckBridge
) else (
    echo.
    echo Failed to restart service
    echo.
)

pause
