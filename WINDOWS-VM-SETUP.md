# Windows VM Setup Guide (Parallels)

## Common Issues and Solutions

### ❌ Issue: "Running scripts is disabled on this system"

This is a PowerShell execution policy restriction. You have several options:

---

## Solution 1: Use Batch Files (Recommended for VM)

I've created `.bat` alternatives that don't require PowerShell:

### **Service Management Scripts**

Located in `scripts/` folder:

```
install-service.bat     - Install Windows Service
uninstall-service.bat   - Remove Windows Service
start-service.bat       - Start the service
stop-service.bat        - Stop the service
restart-service.bat     - Restart the service
service-status.bat      - Check service status + logs
```

### **Usage (Right-click → Run as Administrator)**

1. **Install Service:**
   ```
   Right-click scripts\install-service.bat
   → Run as administrator
   ```

2. **Start Service:**
   ```
   Right-click scripts\start-service.bat
   → Run as administrator
   ```

3. **Check Status:**
   ```
   Right-click scripts\service-status.bat
   → Run as administrator
   ```

---

## Solution 2: Fix PowerShell Execution Policy

If you prefer PowerShell scripts:

### **Method A: One-Time Bypass (Safest)**

```powershell
# Right-click PowerShell → Run as Administrator
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run your script
.\scripts\install-service.ps1
```

### **Method B: Current User Only**

```powershell
# Right-click PowerShell → Run as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### **Method C: System-Wide (Most Permissive)**

```powershell
# Right-click PowerShell → Run as Administrator
Set-ExecutionPolicy -Scope LocalMachine -ExecutionPolicy RemoteSigned
```

### **Verify Policy**

```powershell
Get-ExecutionPolicy -List
```

---

## Solution 3: Alternative Installation Methods

### **Manual Node.js Service Installation**

```cmd
REM 1. Build the service
npm run build:service

REM 2. Install service via Node
node scripts/install-service.js install

REM 3. Start with Windows service manager
sc start UniFiDoordeckBridge

REM 4. Check status
sc query UniFiDoordeckBridge
```

### **Run Without Installing as Service (Testing)**

```cmd
REM Build first
npm run build:service

REM Run directly (not as service)
node dist-service/service-main.js
```

This runs the bridge in the current terminal window (useful for debugging).

---

## Parallels-Specific Issues

### **Issue: Shared Folders Permissions**

If your project is on a Mac shared folder:

1. **Move project to Windows drive:**
   ```cmd
   xcopy /E /I /H Z:\path\to\project C:\Projects\DoorDeck
   cd C:\Projects\DoorDeck
   ```

2. **Or grant permissions to shared folder:**
   - Right-click folder → Properties
   - Security tab → Edit
   - Add "Everyone" with Full Control

### **Issue: Node.js Not Found**

Install Node.js in Windows VM:

1. Download: https://nodejs.org/en/download/
2. Install Node.js 20 LTS (64-bit Windows Installer)
3. Verify:
   ```cmd
   node --version
   npm --version
   ```

### **Issue: Port Already in Use**

If port 9090 is already taken:

1. **Find what's using the port:**
   ```cmd
   netstat -ano | findstr :9090
   ```

2. **Kill the process:**
   ```cmd
   taskkill /PID <process_id> /F
   ```

3. **Or change the port:**
   Edit `config.json`:
   ```json
   {
     "server": {
       "port": 9091
     }
   }
   ```

---

## Step-by-Step Setup for Windows VM

### **1. Prerequisites**

```cmd
REM Check Windows version (need Windows 10+)
winver

REM Check if Node.js is installed
node --version

REM If not, install from https://nodejs.org
```

### **2. Clone/Copy Project**

```cmd
REM If on Mac shared folder, copy to Windows drive
mkdir C:\Projects
cd C:\Projects

REM Then navigate to project
cd C:\path\to\DoorDeck
```

### **3. Install Dependencies**

```cmd
REM Install main project dependencies
npm install

REM Install Electron UI dependencies
cd electron-ui
npm install
cd ..
```

### **4. Build Service**

```cmd
npm run build:service
```

### **5. Create Configuration**

```cmd
REM Create config directory
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"

REM Create config file
notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

Paste this template:

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "username": "admin",
    "password": "your-password",
    "verifySsl": false
  },
  "doordeck": {
    "apiKey": "your-api-key",
    "authToken": "your-auth-token"
  },
  "server": {
    "port": 9090
  },
  "logging": {
    "level": "info",
    "logFilePath": "C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs\\bridge.log"
  }
}
```

### **6. Install Service (Choose One)**

**Option A: Batch file (Recommended)**
```cmd
REM Right-click → Run as Administrator
scripts\install-service.bat
```

**Option B: Direct Node.js**
```cmd
REM Open cmd as Administrator
node scripts/install-service.js install
```

**Option C: Manual via sc.exe**
```cmd
REM Open cmd as Administrator
sc create UniFiDoordeckBridge ^
  binPath= "\"C:\Program Files\nodejs\node.exe\" \"C:\Projects\DoorDeck\dist-service\service-main.js\"" ^
  DisplayName= "UniFi-Doordeck Bridge Service" ^
  start= auto
```

### **7. Start Service**

```cmd
REM Option 1: Batch file
scripts\start-service.bat

REM Option 2: Windows Services
services.msc
REM → Find "UniFi-Doordeck Bridge Service"
REM → Right-click → Start

REM Option 3: Command line
net start UniFiDoordeckBridge
```

### **8. Verify Service is Running**

```cmd
REM Check service status
sc query UniFiDoordeckBridge

REM Check logs
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"

REM Test API endpoint
curl http://127.0.0.1:9090/api/health
```

### **9. Build Electron UI (Optional)**

```cmd
cd electron-ui

REM Development mode (hot reload)
npm run dev
REM In another terminal:
npm start

REM Production build
npm run build
npm run package
```

---

## Troubleshooting

### **Service Won't Start**

1. **Check logs:**
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"
   ```

2. **Check Windows Event Log:**
   ```cmd
   eventvwr.msc
   → Windows Logs → Application
   → Look for UniFiDoordeckBridge errors
   ```

3. **Run directly (not as service) to see errors:**
   ```cmd
   node dist-service/service-main.js
   ```

4. **Check configuration:**
   ```cmd
   notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
   ```

### **Permission Denied Errors**

```cmd
REM Run as Administrator
REM Right-click cmd.exe → Run as administrator

REM Or grant permissions
icacls "C:\ProgramData\UniFi-Doordeck-Bridge" /grant Users:F /t
```

### **Port Already in Use**

```cmd
REM Find process using port 9090
netstat -ano | findstr :9090

REM Kill it
taskkill /PID <process_id> /F

REM Or change port in config.json
```

### **Node.js Module Errors**

```cmd
REM Rebuild native modules
npm rebuild

REM Clean and reinstall
rd /s /q node_modules
npm install
```

---

## Testing Checklist

- [ ] Node.js installed and accessible
- [ ] Project dependencies installed (`npm install`)
- [ ] Service built (`npm run build:service`)
- [ ] Configuration file created
- [ ] Service installed (check with `sc query UniFiDoordeckBridge`)
- [ ] Service started (status = RUNNING)
- [ ] API accessible (`curl http://127.0.0.1:9090/api/health`)
- [ ] Logs being written
- [ ] Electron UI builds (`cd electron-ui && npm run build`)

---

## Quick Commands Reference

### **Service Management**

```cmd
REM Install
scripts\install-service.bat

REM Start
net start UniFiDoordeckBridge

REM Stop
net stop UniFiDoordeckBridge

REM Status
sc query UniFiDoordeckBridge

REM Uninstall
scripts\uninstall-service.bat
```

### **Debugging**

```cmd
REM View logs
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"

REM Tail logs (real-time)
powershell Get-Content "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" -Wait -Tail 20

REM Test API
curl http://127.0.0.1:9090/api/health
curl http://127.0.0.1:9090/api/status
curl http://127.0.0.1:9090/api/stats
```

### **Development**

```cmd
REM Build service
npm run build:service

REM Run without installing
node dist-service/service-main.js

REM Build UI
cd electron-ui
npm run build
npm start
```

---

## Next Steps After Installation

1. **Configure UniFi Access:**
   - Edit `config.json` with your UniFi controller details
   - Restart service: `net stop UniFiDoordeckBridge && net start UniFiDoordeckBridge`

2. **Configure Doordeck:**
   - Add Doordeck API credentials to `config.json`
   - Restart service

3. **Map Doors:**
   - Launch Electron UI
   - Go through setup wizard
   - Map UniFi doors to Doordeck locks

4. **Test Unlock:**
   - Use Doordeck mobile app
   - Tap NFC tile
   - Verify door unlocks

---

## Alternative: Docker (If VM Issues Persist)

If you continue having Windows VM issues, consider Docker:

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist-service ./dist-service
CMD ["node", "dist-service/service-main.js"]
```

```bash
# Build and run
docker build -t doordeck-bridge .
docker run -p 9090:9090 -v ./config.json:/app/config.json doordeck-bridge
```

---

## Support

If you continue having issues:

1. Check logs: `C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log`
2. Check Windows Event Viewer: `eventvwr.msc`
3. Try running without service: `node dist-service/service-main.js`
4. Verify configuration: Check `config.json` syntax

---

*Updated: 2025-10-21*
*For Parallels Windows VM*
