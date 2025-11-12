@echo off
REM Windows Setup Script for UniFi-Doordeck Bridge
REM This script automates the initial setup process

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo.
echo ========================================
echo UniFi-Doordeck Bridge - Windows Setup
echo ========================================
echo.
echo Working directory: %cd%
echo.

REM Check Node.js is installed
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

REM Install dependencies
echo Step 1/4: Installing dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Build the service
echo Step 2/4: Building service...
call npm run build:service
if %errorLevel% neq 0 (
    echo ERROR: Failed to build service
    pause
    exit /b 1
)
echo.

REM Create config directory
echo Step 3/4: Creating configuration directory...
if not exist "C:\ProgramData\UniFi-Doordeck-Bridge" (
    mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
    echo Created: C:\ProgramData\UniFi-Doordeck-Bridge
)

if not exist "C:\ProgramData\UniFi-Doordeck-Bridge\logs" (
    mkdir "C:\ProgramData\UniFi-Doordeck-Bridge\logs"
    echo Created: C:\ProgramData\UniFi-Doordeck-Bridge\logs
)
echo.

REM Create default config if it doesn't exist
echo Step 4/4: Creating default configuration...
if not exist "C:\ProgramData\UniFi-Doordeck-Bridge\config.json" (
    (
        echo {
        echo   "unifi": {
        echo     "host": "192.168.1.1",
        echo     "port": 443,
        echo     "username": "admin",
        echo     "password": "CHANGE_ME",
        echo     "verifySsl": false
        echo   },
        echo   "doordeck": {
        echo     "apiKey": "CHANGE_ME",
        echo     "authToken": ""
        echo   },
        echo   "server": {
        echo     "port": 9090
        echo   },
        echo   "logging": {
        echo     "level": "info",
        echo     "logFilePath": "C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs\\bridge.log"
        echo   }
        echo }
    ) > "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"

    echo Created default config: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
    echo.
    echo IMPORTANT: Edit this file and update:
    echo   - UniFi Access controller details
    echo   - Doordeck API credentials
    echo.
) else (
    echo Config file already exists (not overwriting)
    echo.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Edit configuration file:
echo    notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
echo.
echo 2. Install as Windows Service (Run as Administrator):
echo    scripts\install-service.bat
echo.
echo 3. Start the service:
echo    scripts\start-service.bat
echo.
echo 4. Verify service is running:
echo    scripts\service-status.bat
echo.
echo For help, see: BUILD-STEPS-WINDOWS.md
echo.

pause
