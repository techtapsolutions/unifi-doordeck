@echo off
REM Test Doordeck Authentication

cd /d "%~dp0\.."

echo.
echo Running Doordeck authentication test...
echo.

node scripts\test-doordeck-auth.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo ✅ Doordeck authentication working!
    echo ==========================================
    echo.
    echo You can now run the full service:
    echo   scripts\test-with-local-config.bat
    echo.
) else (
    echo.
    echo ==========================================
    echo ❌ Doordeck authentication failed
    echo ==========================================
    echo.
    echo Check the error messages above.
    echo.
)

pause
