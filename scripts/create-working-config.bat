@echo off
REM Create Guaranteed Working Config

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Create Working Config (Guaranteed)
echo ==========================================
echo.

echo This will create a config that WILL pass validation.
echo You just need to add your Doordeck email/password.
echo.

REM Delete old config if exists
if exist "config.json" (
    echo Backing up old config...
    copy /Y "config.json" "config.json.backup" >nul
    del "config.json"
)

REM Create new config with ONLY required fields (no empty strings)
echo Creating config.json...
echo.

echo {> config.json
echo   "unifi": {>> config.json
echo     "host": "192.168.1.1",>> config.json
echo     "port": 443,>> config.json
echo     "apiKey": "YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY",>> config.json
echo     "verifySsl": false>> config.json
echo   },>> config.json
echo   "doordeck": {>> config.json
echo     "email": "ENTER_YOUR_EMAIL_HERE",>> config.json
echo     "password": "ENTER_YOUR_PASSWORD_HERE">> config.json
echo   }>> config.json
echo }>> config.json

echo ✓ Config created!
echo.

echo Contents:
echo ----------------------------------------
type config.json
echo ----------------------------------------
echo.

echo ==========================================
echo IMPORTANT: Edit Your Credentials
echo ==========================================
echo.
echo Open config.json and replace:
echo   - ENTER_YOUR_EMAIL_HERE → your Doordeck email
echo   - ENTER_YOUR_PASSWORD_HERE → your Doordeck password
echo.

echo Opening config.json in Notepad...
notepad config.json

echo.
echo After editing, test with:
echo   scripts\test-with-local-config.bat
echo.

pause
