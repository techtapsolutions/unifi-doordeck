@echo off
REM Stop UniFi-Doordeck Bridge Service

echo.
echo Stopping UniFi-Doordeck Bridge Service...
echo.

net stop UniFiDoordeckBridge

if %errorLevel% equ 0 (
    echo.
    echo Service stopped successfully!
    echo.
) else (
    echo.
    echo Failed to stop service
    echo Error code: %errorLevel%
    echo.
    echo The service may not be running
    echo.
)

pause
