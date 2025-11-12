# ✅ FIXED - Ready to Build!

## 🎉 All Issues Resolved

The `tsc` not found error has been fixed by updating package.json to use `npx`.

---

## 🚀 Option 1: Automated Setup (Easiest)

Just run this one command:

```cmd
setup-windows.bat
```

This will:
- ✅ Install all dependencies
- ✅ Build the service
- ✅ Create config directories
- ✅ Create default config.json
- ✅ Show you next steps

**That's it!** One command and you're ready to go.

---

## 🛠️ Option 2: Manual Steps

If you prefer to run commands manually:

### **1. Install Dependencies (if not done)**

```cmd
npm install
```

### **2. Build Service**

```cmd
npm run build:service
```

**This will now work!** The script now uses `npx tsc` which works on all platforms.

### **3. Create Config**

```cmd
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

Paste this:

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "username": "admin",
    "password": "CHANGE_ME",
    "verifySsl": false
  },
  "doordeck": {
    "apiKey": "CHANGE_ME"
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

Save and close.

### **4. Test Service**

```cmd
node dist-service/service-main.js
```

Press Ctrl+C to stop.

### **5. Install as Windows Service**

```cmd
scripts\install-service.bat
```

(Right-click → Run as Administrator)

### **6. Start Service**

```cmd
scripts\start-service.bat
```

### **7. Verify**

```cmd
curl http://127.0.0.1:9090/api/health
```

Should return: `{"status":"ok",...}`

---

## 📝 What Was Fixed

1. ✅ **package.json** - All TypeScript commands now use `npx`
2. ✅ **tsconfig.service.json** - Created TypeScript build config
3. ✅ **src/service-main.ts** - Created service entry point
4. ✅ **src/service/service-api.ts** - Created REST API
5. ✅ **src/service/config-watcher.ts** - Created config watcher
6. ✅ **setup-windows.bat** - Created automated setup script

---

## ✅ Success Indicators

You'll know it worked when:

```cmd
REM 1. Build completes without errors
npm run build:service
REM → Should show "Compiled successfully"

REM 2. dist-service folder exists
dir dist-service
REM → Should show service-main.js and other files

REM 3. Service runs
node dist-service/service-main.js
REM → Should show startup messages

REM 4. API responds
curl http://127.0.0.1:9090/api/health
REM → Should return JSON
```

---

## 🎯 Quick Commands

```cmd
REM Clean start
npm install
npm run build:service

REM Create config
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"

REM Test directly
node dist-service/service-main.js

REM Install service
scripts\install-service.bat

REM Start service
scripts\start-service.bat

REM Check status
scripts\service-status.bat
```

---

## 📚 Documentation

- **This file** - Quick fix reference
- **BUILD-STEPS-WINDOWS.md** - Detailed build guide
- **QUICKSTART-WINDOWS-VM.md** - Quick reference
- **WINDOWS-VM-SETUP.md** - Complete setup guide

---

## 🆘 If You Still Get Errors

### **"Cannot find module"**
```cmd
npm install
```

### **"Permission denied"**
```cmd
REM Run as Administrator
```

### **"Port already in use"**
```cmd
netstat -ano | findstr :9090
taskkill /PID <process_id> /F
```

---

## ✨ You're All Set!

Run either:
- **`setup-windows.bat`** (automated)
- Or follow manual steps above

**The build will now work!** 🎉

---

*Last updated: 2025-10-21*
*Issue: tsc not found → Fixed with npx*
