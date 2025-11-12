@echo off
REM Start UniFi-Doordeck Bridge Service

echo.
echo Starting UniFi-Doordeck Bridge Service...
echo.

net start UniFiDoordeckBridge

if %errorLevel% equ 0 (
    echo.
    echo Service started successfully!
    echo.
    timeout /t 2 >nul

    REM Show service status
    sc query UniFiDoordeckBridge
) else (
    echo.
    echo Failed to start service
    echo Error code: %errorLevel%
    echo.
    echo Common issues:
    echo 1. Service not installed - run install-service.bat first
    echo 2. Service already running
    echo 3. Configuration error - check config.json
    echo.
)

pause
