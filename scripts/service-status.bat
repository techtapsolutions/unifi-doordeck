@echo off
REM Check UniFi-Doordeck Bridge Service Status

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ========================================
echo UniFi-Doordeck Bridge Service Status
echo ========================================
echo.
echo Working directory: %cd%
echo.

sc query UniFiDoordeckBridge

if %errorLevel% neq 0 (
    echo.
    echo Service is not installed
    echo Run install-service.bat to install
    echo.
) else (
    echo.
    echo Service is installed
    echo.

    REM Check if service is running
    sc query UniFiDoordeckBridge | find "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo Status: RUNNING
        echo.
        echo Recent logs:
        echo.
        if exist "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" (
            powershell -Command "Get-Content 'C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log' -Tail 20"
        ) else (
            echo No logs found yet
        )
    ) else (
        echo Status: STOPPED
    )
)

echo.
pause
