@echo off
REM Create Test Config (For Testing UniFi API Key Only)

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Create Test Config (UniFi API Key Only)
echo ==========================================
echo.

echo Creating config.json for UniFi API key testing...
echo.
echo NOTE: This config uses a placeholder Doordeck token
echo       for testing UniFi connectivity only.
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
echo     "apiToken": "test-token-placeholder-update-before-production",
echo     "refreshToken": "",
echo     "email": "",
echo     "password": "",
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
    echo Ready to Test!
    echo ==========================================
    echo.
    echo This config is ready for testing UniFi connectivity.
    echo.
    echo To test:
    echo   scripts\test-with-local-config.bat
    echo.
    echo The service should now:
    echo   ✓ Connect to UniFi Access using API key
    echo   ✓ Discover doors from devices
    echo   ✓ Initialize successfully
    echo.
    echo NOTE: Doordeck features won't work without real credentials,
    echo       but you can test UniFi connectivity and door discovery.
    echo.
) else (
    echo [✗] Failed to create config.json
    echo.
)

pause
