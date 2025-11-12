@echo off
REM Create Final Production Config

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Create Production Config
echo ==========================================
echo.

echo Creating config.json with UniFi API key...
echo.

(
echo {
echo   "unifi": {
echo     "host": "192.168.1.1",
echo     "port": 443,
echo     "apiKey": "YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY",
echo     "verifySsl": false,
echo     "reconnectDelay": 5000,
echo     "maxRetries": 3
echo   },
echo   "doordeck": {
echo     "apiToken": "",
echo     "refreshToken": "",
echo     "email": "YOUR_DOORDECK_EMAIL_HERE",
echo     "password": "YOUR_DOORDECK_PASSWORD_HERE",
echo     "debug": false
echo   },
echo   "logging": {
echo     "level": "info",
echo     "fileLogging": true,
echo     "logFilePath": "./logs/bridge.log",
echo     "maxFileSize": 10485760,
echo     "maxFiles": 5
echo   },
echo   "healthMonitor": {
echo     "enabled": true,
echo     "checkInterval": 30000,
echo     "failureThreshold": 3,
echo     "timeout": 5000
echo   },
echo   "circuitBreaker": {
echo     "enabled": true,
echo     "failureThreshold": 5,
echo     "successThreshold": 2,
echo     "timeout": 60000
echo   },
echo   "retry": {
echo     "enabled": true,
echo     "maxAttempts": 3,
echo     "initialDelay": 1000,
echo     "maxDelay": 10000,
echo     "backoffMultiplier": 2
echo   },
echo   "eventTranslator": {
echo     "enabled": true,
echo     "deduplicationWindow": 5000,
echo     "maxQueueSize": 1000,
echo     "processingDelay": 1000
echo   }
echo }
) > config.json

if exist "config.json" (
    echo [✓] config.json created successfully!
    echo.
    echo Location: %cd%\config.json
    echo.
    dir config.json | find "config.json"
    echo.
    echo ==========================================
    echo IMPORTANT: Update Doordeck Credentials!
    echo ==========================================
    echo.
    echo The config file has been created with your UniFi API key.
    echo.
    echo You MUST update these fields in config.json:
    echo.
    echo   "email": "YOUR_DOORDECK_EMAIL_HERE"
    echo   "password": "YOUR_DOORDECK_PASSWORD_HERE"
    echo.
    echo UniFi settings are already configured:
    echo   ✓ Host: 192.168.1.1
    echo   ✓ API Key: YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY
    echo.
    echo Press any key to open config.json in Notepad...
    pause >nul
    notepad config.json
    echo.
    echo ==========================================
    echo After editing, test the service:
    echo ==========================================
    echo.
    echo   scripts\test-with-local-config.bat
    echo.
    echo You should see:
    echo   ✓ Using UniFi OS Client (API key authentication^)
    echo   ✓ Authenticating with Doordeck Fusion API...
    echo   ✓ Successfully authenticated with Doordeck
    echo   ✓ Service API started on http://127.0.0.1:9090
    echo.
) else (
    echo [✗] Failed to create config.json
    echo.
)

pause
