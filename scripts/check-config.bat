@echo off
REM Check Config File Status

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Config File Diagnostic
echo ==========================================
echo.
echo Current directory: %cd%
echo.

echo Checking for config files...
echo.

if exist "config.json" (
    echo [✓] config.json EXISTS in current directory
    echo     Location: %cd%\config.json
    dir config.json | find "config.json"
) else (
    echo [✗] config.json NOT FOUND in current directory
)

echo.

if exist "config-unifi-os.json" (
    echo [✓] config-unifi-os.json EXISTS (template file)
    echo     Location: %cd%\config-unifi-os.json
    dir config-unifi-os.json | find "config-unifi-os.json"
) else (
    echo [✗] config-unifi-os.json NOT FOUND
)

echo.

if exist "config.example.json" (
    echo [✓] config.example.json EXISTS
) else (
    echo [✗] config.example.json NOT FOUND
)

echo.
echo ==========================================
echo.

if not exist "config.json" (
    echo Creating config.json now...
    echo.

    if exist "config-unifi-os.json" (
        copy /Y "config-unifi-os.json" "config.json"

        if exist "config.json" (
            echo [✓] Successfully created config.json
            echo.
            dir config.json
        ) else (
            echo [✗] Failed to create config.json
        )
    ) else (
        echo [✗] Template file config-unifi-os.json not found!
        echo     Cannot create config.json
    )
)

echo.
pause
