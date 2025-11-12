@echo off
REM Open config.json in Notepad for editing

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Edit Configuration File
echo ==========================================
echo.

if exist "config.json" (
    echo Opening config.json in Notepad...
    echo.
    echo UPDATE THESE FIELDS:
    echo   - "email": "ENTER_YOUR_EMAIL_HERE"
    echo   - "password": "ENTER_YOUR_PASSWORD_HERE"
    echo.
    echo Replace with your actual Doordeck credentials.
    echo.

    notepad config.json

    echo.
    echo After saving, test with:
    echo   scripts\test-with-local-config.bat
    echo.
) else (
    echo ✗ config.json not found!
    echo.
    echo Run: scripts\create-working-config.bat
    echo.
)

pause
