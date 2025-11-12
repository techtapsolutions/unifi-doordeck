@echo off
REM Windows Service Uninstallation Script (Batch Version)

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ==========================================
echo UniFi-Doordeck Bridge Service Uninstaller
echo ==========================================
echo.
echo Working directory: %cd%
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Uninstalling Windows Service...
node scripts/uninstall-service.js

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Service uninstalled successfully!
    echo ========================================
    echo.
) else (
    echo.
    echo ERROR: Service uninstallation failed
    echo Check the logs above for details
    echo.
)

pause
