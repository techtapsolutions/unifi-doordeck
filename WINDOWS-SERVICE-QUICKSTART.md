# Windows Service Quick Start Guide

Quick guide to diagnose and fix Windows Service installation issues.

---

## 🚀 Quick Fix - Connection Refused on localhost:9090

If you're getting "Connection refused" when accessing the service API, run these steps:

### Step 1: Run Diagnostics

```cmd
scripts\diagnose-service.bat
```

This checks all components and shows what's missing or broken.

### Step 2: Test Service Startup

```cmd
scripts\test-service-startup.bat
```

This runs the service directly and shows any errors in real-time.

**Expected output:**
```
Service API started on http://127.0.0.1:9090
```

If you see this, the service is working! Press Ctrl+C and install as Windows Service (see below).

---

## 🔧 Common Issues and Quick Fixes

### Issue: "Service script not found"

**Solution:**
```cmd
npm run build:service
```

### Issue: "Config file not found"

**Solution:**
```cmd
setup-windows.bat
```

Then edit credentials:
```cmd
notepad C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

### Issue: "Cannot find module 'express'"

**Solution:**
```cmd
npm install
```

### Issue: "Port 9090 already in use"

**Find what's using it:**
```cmd
netstat -ano | findstr :9090
```

**Kill the process:**
```cmd
taskkill /PID <PID_number> /F
```

Or change port in config:
```json
{
  "server": {
    "port": 9091
  }
}
```

---

## 📦 Install as Windows Service

Once the test script works (shows "Service API started"), install as Windows Service:

### 1. Install Service

```cmd
scripts\install-service.bat
```

### 2. Start Service

```cmd
sc start UniFiDoordeckBridge
```

### 3. Check Status

```cmd
scripts\service-status.bat
```

Should show: `STATE: 4 RUNNING`

---

## 🌐 Access Service API

Once service is running, access:

- **Health Check**: http://localhost:9090/api/health
- **Status**: http://localhost:9090/api/status
- **Stats**: http://localhost:9090/api/stats
- **Logs**: http://localhost:9090/api/service/logs

---

## 🔄 Service Management Commands

### Check Service Status
```cmd
scripts\service-status.bat
```

### Start Service
```cmd
sc start UniFiDoordeckBridge
```

### Stop Service
```cmd
sc stop UniFiDoordeckBridge
```

### Restart Service
```cmd
scripts\restart-service.bat
```

### Uninstall Service
```cmd
scripts\uninstall-service.bat
```

---

## 🐛 Still Not Working?

### Get Detailed Error Information

1. **Run diagnostics and save output:**
   ```cmd
   scripts\diagnose-service.bat > diagnostics.txt
   ```

2. **Test service and screenshot errors:**
   ```cmd
   scripts\test-service-startup.bat
   ```

3. **Check Windows Event Viewer:**
   - Press `Win + R`
   - Type: `eventvwr.msc`
   - Navigate to: Windows Logs > Application
   - Look for errors from "UniFiDoordeckBridge"

4. **Check service logs (if service ran at least once):**
   ```cmd
   type C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log
   ```

---

## 📋 Complete Setup From Scratch

If nothing works, start fresh:

### 1. Stop and Uninstall
```cmd
sc stop UniFiDoordeckBridge
scripts\uninstall-service.bat
```

### 2. Clean Build
```cmd
npm run clean
npm install
npm run build:service
```

### 3. Setup Configuration
```cmd
setup-windows.bat
```

### 4. Configure Credentials
```cmd
notepad C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

Edit:
- `unifi.host` - Your UniFi controller IP
- `unifi.username` - Admin username
- `unifi.password` - Admin password
- `doordeck.apiToken` - Your Doordeck API token
- `doordeck.email` - Your Doordeck email
- `doordeck.password` - Your Doordeck password

### 5. Test Before Installing
```cmd
scripts\test-service-startup.bat
```

Look for: `Service API started on http://127.0.0.1:9090`

### 6. Install as Service
```cmd
scripts\install-service.bat
sc start UniFiDoordeckBridge
```

### 7. Verify
```cmd
scripts\service-status.bat
```

Open browser: http://localhost:9090/api/health

---

## 🎯 Key Files and Locations

### Scripts (in project directory)
- `scripts\diagnose-service.bat` - Run diagnostics
- `scripts\test-service-startup.bat` - Test service manually
- `scripts\install-service.bat` - Install Windows Service
- `scripts\uninstall-service.bat` - Uninstall service
- `scripts\service-status.bat` - Check service status

### Configuration
- `C:\ProgramData\UniFi-Doordeck-Bridge\config.json` - Service configuration

### Logs
- `C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log` - Service logs

### Built Files
- `dist-service\service-main.js` - Service entry point (created by build)

---

## 💡 Pro Tips

1. **Always test first** - Use `test-service-startup.bat` before installing as Windows Service
2. **Check diagnostics** - Run `diagnose-service.bat` when something breaks
3. **Watch logs** - Monitor logs in real-time:
   ```cmd
   powershell Get-Content C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log -Wait -Tail 20
   ```
4. **Use absolute paths** - In config.json, use full paths like `C:\ProgramData\...`

---

## 📚 Related Documentation

- [Complete Troubleshooting Guide](TROUBLESHOOTING.md) - Comprehensive problem solving
- [Setup Instructions](RUN-SETUP-CORRECTLY.md) - How to run setup correctly
- [Configuration Example](config.example.json) - Example configuration file

---

*Last Updated: 2025-10-21*
