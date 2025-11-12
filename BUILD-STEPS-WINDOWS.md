# Build Steps for Windows

## ✅ Files are now in place!

The missing TypeScript files have been created. You can now build the service.

---

## 📋 Step-by-Step Build Process

### **1. Build the Service**

```cmd
npm run build:service
```

This should now complete successfully and create `dist-service/` folder.

### **2. Verify Build Output**

```cmd
dir dist-service
```

You should see:
- `service-main.js`
- `service-main.js.map`
- `service-main.d.ts`
- Various other compiled `.js` files

### **3. Create Configuration File**

```cmd
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

Paste this minimal configuration:

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
    "authToken": ""
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

### **4. Test Service Directly (Before Installing)**

```cmd
node dist-service/service-main.js
```

You should see:
```
info: Starting UniFi-Doordeck Bridge Service...
info: Loading configuration from: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
info: Configuration loaded successfully
info: Bridge service started successfully
info: Service API started on http://127.0.0.1:9090
info: Configuration file watcher started
```

**Press Ctrl+C** to stop when you verify it works.

### **5. Install as Windows Service**

```cmd
REM Right-click and Run as Administrator
scripts\install-service.bat
```

OR:

```cmd
REM In Administrator command prompt
node scripts/install-service.js install
```

### **6. Start the Service**

```cmd
scripts\start-service.bat
```

OR:

```cmd
net start UniFiDoordeckBridge
```

### **7. Verify Service is Running**

```cmd
REM Check service status
sc query UniFiDoordeckBridge

REM Test API
curl http://127.0.0.1:9090/api/health

REM View logs
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"
```

---

## 🐛 Common Build Errors

### **Error: Cannot find module**

**Solution:**
```cmd
npm install
```

### **Error: TypeScript compilation failed**

**Solution:**
```cmd
REM Check TypeScript version
npx tsc --version

REM Clean and rebuild
npm run clean
npm run build:service
```

### **Error: Permission denied**

**Solution:** Run Command Prompt as Administrator

### **Error: Port 9090 in use**

**Solution:**
```cmd
netstat -ano | findstr :9090
taskkill /PID <process_id> /F
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ `npm run build:service` completes without errors
2. ✅ `dist-service/` folder exists with `.js` files
3. ✅ Direct run works: `node dist-service/service-main.js`
4. ✅ Service installs: `sc query UniFiDoordeckBridge`
5. ✅ Service starts: `STATE = RUNNING`
6. ✅ API responds: `curl http://127.0.0.1:9090/api/health`
7. ✅ Logs are created

---

## 📝 What Just Got Created

These files were added to fix the build:

1. **`tsconfig.service.json`** - TypeScript build config for service
2. **`src/service-main.ts`** - Main entry point (replaces web server version)
3. **`src/service/service-api.ts`** - REST API for UI communication
4. **`src/service/config-watcher.ts`** - Auto-reload config on changes
5. **`src/service/index.ts`** - Module exports

---

## 🎯 Next Steps After Successful Build

1. Install service: `scripts\install-service.bat`
2. Start service: `scripts\start-service.bat`
3. Configure UniFi and Doordeck credentials in `config.json`
4. Test with: `curl http://127.0.0.1:9090/api/status`
5. Build Electron UI: `cd electron-ui && npm install && npm run build`

---

## 📚 Additional Help

- **Full Setup:** See `WINDOWS-VM-SETUP.md`
- **Quick Start:** See `QUICKSTART-WINDOWS-VM.md`
- **Architecture:** See `SERVICE-ARCHITECTURE.md`

---

*Run these commands in order and you'll have a working service!*
