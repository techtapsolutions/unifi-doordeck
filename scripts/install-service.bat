@echo off
REM Windows Service Installation Script (Batch Version)
REM Alternative to PowerShell for systems with restricted execution policy

REM Change to project root directory (one level up from scripts folder)
cd /d "%~dp0\.."

echo.
echo ========================================
echo UniFi-Doordeck Bridge Service Installer
echo ========================================
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

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing Windows Service...
node scripts/install-service.js install

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Service installed successfully!
    echo ========================================
    echo.
    echo Service Name: UniFiDoordeckBridge
    echo Display Name: UniFi-Doordeck Bridge Service
    echo.
    echo To start the service, run:
    echo   scripts\start-service.bat
    echo.
    echo Or use Windows Services Manager:
    echo   services.msc
    echo.
) else (
    echo.
    echo ERROR: Service installation failed
    echo Check the logs above for details
    echo.
)

pause
