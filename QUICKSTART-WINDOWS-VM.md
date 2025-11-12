# ⚡ Quick Start - Windows VM (Parallels)

## 🚨 PowerShell Scripts Disabled? Use Batch Files!

All scripts have `.bat` alternatives that work without changing PowerShell policy.

---

## 📋 Essential Commands (Copy & Paste)

### **1. First Time Setup**

```cmd
REM Navigate to project
cd C:\path\to\DoorDeck

REM Install dependencies
npm install

REM Build the service
npm run build:service

REM Create config directory
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"

REM Create/edit config
notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

### **2. Install Service (Right-click → Run as Admin)**

```
scripts\install-service.bat
```

OR via command line:
```cmd
node scripts/install-service.js install
```

### **3. Start Service**

```
scripts\start-service.bat
```

OR:
```cmd
net start UniFiDoordeckBridge
```

### **4. Check Status**

```
scripts\service-status.bat
```

OR:
```cmd
sc query UniFiDoordeckBridge
```

### **5. View Logs**

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"
```

Real-time tail:
```powershell
Get-Content "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" -Wait -Tail 20
```

### **6. Test API**

```cmd
curl http://127.0.0.1:9090/api/health
curl http://127.0.0.1:9090/api/status
curl http://127.0.0.1:9090/api/stats
```

---

## 🔧 Batch Scripts Reference

All located in `scripts/` folder:

| Script | Purpose |
|--------|---------|
| `install-service.bat` | Install Windows Service |
| `uninstall-service.bat` | Remove Windows Service |
| `start-service.bat` | Start service |
| `stop-service.bat` | Stop service |
| `restart-service.bat` | Restart service |
| `service-status.bat` | Show status + recent logs |

**Usage:** Right-click → Run as Administrator

---

## 📝 Minimal Configuration

Save this to: `C:\ProgramData\UniFi-Doordeck-Bridge\config.json`

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "username": "admin",
    "password": "your-password",
    "verifySsl": false
  },
  "doordeck": {
    "apiKey": "your-api-key"
  },
  "server": {
    "port": 9090
  }
}
```

---

## 🐛 Common Issues

### **Issue: Scripts disabled**
**Solution:** Use `.bat` files instead of `.ps1` files

### **Issue: Permission denied**
**Solution:** Right-click → Run as Administrator

### **Issue: Service won't start**
**Solution:** Run directly to see errors:
```cmd
node dist-service/service-main.js
```

### **Issue: Port 9090 in use**
**Solution:** Find and kill process:
```cmd
netstat -ano | findstr :9090
taskkill /PID <process_id> /F
```

### **Issue: Can't find node**
**Solution:** Install Node.js 20 from https://nodejs.org

---

## ✅ Verification Checklist

Run these to verify everything works:

```cmd
REM 1. Node.js installed
node --version

REM 2. Dependencies installed
dir node_modules

REM 3. Service built
dir dist-service

REM 4. Config exists
type "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"

REM 5. Service installed
sc query UniFiDoordeckBridge

REM 6. Service running
sc query UniFiDoordeckBridge | findstr RUNNING

REM 7. API responding
curl http://127.0.0.1:9090/api/health

REM 8. Logs working
dir "C:\ProgramData\UniFi-Doordeck-Bridge\logs"
```

---

## 🎯 Development Workflow

```cmd
REM 1. Make changes to code
notepad src\service-main.ts

REM 2. Rebuild
npm run build:service

REM 3. Restart service
scripts\restart-service.bat

REM 4. Check logs
scripts\service-status.bat
```

---

## 📚 Full Documentation

- **Windows VM Setup:** `WINDOWS-VM-SETUP.md`
- **Service Architecture:** `SERVICE-ARCHITECTURE.md`
- **Complete Transformation:** `WINDOWS-UI-TRANSFORMATION.md`

---

## 🆘 Quick Troubleshooting

```cmd
REM Stop service
net stop UniFiDoordeckBridge

REM Run directly to see errors
node dist-service/service-main.js

REM Check last 50 log lines
powershell Get-Content "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" -Tail 50

REM Check Windows Event Log
eventvwr.msc
→ Windows Logs → Application
→ Look for UniFiDoordeckBridge
```

---

## 🚀 Next Steps

1. ✅ Fix PowerShell issue (use .bat files)
2. ✅ Install service
3. ✅ Start service
4. ✅ Verify API is responding
5. ⏭️ Configure UniFi Access details
6. ⏭️ Configure Doordeck credentials
7. ⏭️ Build Electron UI
8. ⏭️ Test end-to-end

---

*Keep this file open while setting up!*
*Last updated: 2025-10-21*
