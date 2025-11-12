@echo off
REM Simple Config Creator

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Create Config File (Simple Method)
echo ==========================================
echo.

echo Creating config.json with your API key...
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
echo     "apiToken": "REPLACE_WITH_YOUR_DOORDECK_TOKEN",
echo     "refreshToken": "",
echo     "email": "REPLACE_WITH_YOUR_EMAIL",
echo     "password": "REPLACE_WITH_YOUR_PASSWORD",
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
    echo NEXT STEP: Edit the Doordeck credentials
    echo ==========================================
    echo.
    echo Open in Notepad:
    echo   notepad config.json
    echo.
    echo Replace these values:
    echo   - apiToken: REPLACE_WITH_YOUR_DOORDECK_TOKEN
    echo   - email: REPLACE_WITH_YOUR_EMAIL
    echo   - password: REPLACE_WITH_YOUR_PASSWORD
    echo.
    echo UniFi settings are already configured with your API key.
    echo.
) else (
    echo [✗] Failed to create config.json
    echo.
)

echo.
echo Press any key to open config.json in Notepad...
pause >nul

notepad config.json

echo.
echo After editing, run:
echo   scripts\test-with-local-config.bat
echo.
pause
