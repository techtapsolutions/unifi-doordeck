@echo off
REM Show Current Config

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Current Config File Contents
echo ==========================================
echo.

if exist "config.json" (
    echo File: %cd%\config.json
    echo.
    echo Contents:
    echo ----------------------------------------
    type config.json
    echo ----------------------------------------
    echo.

    echo Checking for empty values...
    findstr /C:"\"\"" config.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ⚠️  WARNING: Found empty string values ("")
        echo.
        echo Empty values found:
        findstr /N /C:"\"\"" config.json
        echo.
        echo These empty strings may cause validation errors!
        echo.
    ) else (
        echo ✓ No empty string values found
    )
) else (
    echo ✗ config.json NOT FOUND
    echo.
    echo Location checked: %cd%\config.json
    echo.
    echo Run: scripts\create-final-config.bat
)

echo.
pause
