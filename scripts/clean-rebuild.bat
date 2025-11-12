@echo off
REM Clean Rebuild - Force fresh build of service

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Clean Rebuild Service
echo ==========================================
echo.

echo Step 1: Removing old compiled files...
if exist "dist-service" (
    echo   Deleting dist-service folder...
    rmdir /s /q dist-service
    echo   ✓ Old files removed
) else (
    echo   No dist-service folder found
)

echo.
echo Step 2: Rebuilding service from TypeScript source...
echo.

call npm run build:service

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo ✓ Build completed successfully!
    echo ==========================================
    echo.
    echo Compiled files are in: dist-service\
    echo.
    echo Next step: Test the service
    echo   scripts\test-with-local-config.bat
    echo.
) else (
    echo.
    echo ==========================================
    echo ✗ Build failed!
    echo ==========================================
    echo.
    echo Error code: %ERRORLEVEL%
    echo.
    echo Try:
    echo   1. npm install (install dependencies)
    echo   2. Check for TypeScript errors in src/
    echo.
)

pause
