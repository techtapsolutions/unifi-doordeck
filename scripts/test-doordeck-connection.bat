@echo off
REM Test Doordeck API Connectivity

cd /d "%~dp0\.."

echo.
echo ==========================================
echo Test Doordeck API Connectivity
echo ==========================================
echo.

echo Testing DNS resolution...
nslookup api.doordeck.com
echo.

echo Testing HTTPS connectivity...
curl -v https://api.doordeck.com 2>&1 | findstr /C:"Connected" /C:"SSL" /C:"failed" /C:"error"
echo.

echo Testing with PowerShell...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://api.doordeck.com' -Method Get -TimeoutSec 10; Write-Host 'SUCCESS: Can reach Doordeck API'; Write-Host 'Status:' $response.StatusCode } catch { Write-Host 'ERROR:' $_.Exception.Message }"
echo.

echo.
echo If you see connection errors above, check:
echo   1. Internet connectivity (can you browse websites?)
echo   2. Firewall settings (allow Node.js outbound HTTPS)
echo   3. Proxy settings (if behind corporate proxy)
echo.

pause
