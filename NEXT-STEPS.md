# Next Steps - Fixing Connection Refused Issue

## 📝 What I've Done

I've created diagnostic and testing tools to help identify why the service isn't accessible at localhost:9090:

### New Files Created:

1. **`scripts/diagnose-service.js`** + **`scripts/diagnose-service.bat`**
   - Comprehensive diagnostic tool that checks:
     - ✓ Service script exists
     - ✓ Configuration directory and files
     - ✓ Config file is valid JSON
     - ✓ Port 9090 availability
     - ✓ Windows Service status
   - **Run this first to see what's wrong!**

2. **`scripts/test-service-startup.bat`**
   - Runs the service directly (not as Windows Service)
   - Shows all error messages in real-time
   - Helps identify why service isn't starting
   - **Use this to see the actual error messages**

3. **`WINDOWS-SERVICE-QUICKSTART.md`**
   - Quick reference guide for common issues
   - Step-by-step fixes for each error
   - Service management commands
   - Complete setup-from-scratch procedure

### Bugs Fixed:

1. **`scripts/uninstall-service.bat`**
   - Fixed: Was calling `install-service.js` instead of `uninstall-service.js`
   - Now correctly uninstalls the service

---

## 🚀 What You Should Do Next

On your Windows VM, follow these steps:

### Step 1: Run Diagnostics

```cmd
cd C:\Users\ronalden\Desktop\DoorDeck
scripts\diagnose-service.bat
```

**This will tell you:**
- ✅ What's working
- ❌ What's broken
- 💡 How to fix it

### Step 2: Test Service Startup

```cmd
scripts\test-service-startup.bat
```

**Watch for these messages:**

**✅ Success looks like:**
```
Service API started on http://127.0.0.1:9090
```

**❌ Errors might be:**
```
ERROR: Service script not found
  → Solution: npm run build:service

ERROR: Config file not found
  → Solution: setup-windows.bat

Error: Cannot find module 'express'
  → Solution: npm install

ERROR: Port 9090 is already in use
  → Solution: Kill the process or change port
```

### Step 3: Fix Any Issues

Based on the error messages from Step 2, run the suggested commands.

**Common fixes:**

**If missing dependencies:**
```cmd
npm install
```

**If service not built:**
```cmd
npm run build:service
```

**If config missing:**
```cmd
setup-windows.bat
notepad C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

### Step 4: Verify It Works

Once `test-service-startup.bat` shows "Service API started", open browser:

```
http://localhost:9090/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "uptime": 123.45
}
```

If you see this, **SUCCESS!** Press Ctrl+C to stop the test.

### Step 5: Install as Windows Service

Now that we know it works, install as Windows Service:

```cmd
scripts\install-service.bat
sc start UniFiDoordeckBridge
scripts\service-status.bat
```

---

## 🎯 Expected Output

### diagnose-service.bat should show:

```
✓ Check 1: Verify built service exists
  ✅ Service script found: ...\dist-service\service-main.js

✓ Check 2: Verify configuration directory
  ✅ Config directory exists: C:\ProgramData\UniFi-Doordeck-Bridge

✓ Check 3: Verify configuration file
  ✅ Config file exists: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
  ✅ Config file is valid JSON
  ✅ Required fields present
  ℹ️  API Port: 9090

✓ Check 4: Verify log directory
  ✅ Log directory exists: C:\ProgramData\UniFi-Doordeck-Bridge\logs

✓ Check 5: Check if API is running on port 9090
  ⚠️  Port 9090 is available (service not running)

✓ Check 6: Check Windows Service status
  ⚠️  Service is not installed
  💡 Solution: Run scripts/install-service.bat
```

### test-service-startup.bat should show:

```
Starting service in test mode...

[INFO] Starting UniFi-Doordeck Bridge Service...
[INFO] Loading configuration from: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
[INFO] Configuration loaded successfully
[INFO] Bridge service started successfully
[INFO] Service API started on http://127.0.0.1:9090  ← This is the key message!
[INFO] Configuration file watcher started
```

---

## 🐛 What If It Still Doesn't Work?

### Share This Information:

1. **Screenshot of diagnostic output:**
   ```cmd
   scripts\diagnose-service.bat
   ```

2. **Screenshot of test startup errors:**
   ```cmd
   scripts\test-service-startup.bat
   ```

3. **Your Windows and Node.js versions:**
   ```cmd
   systeminfo | find "OS Name"
   node --version
   npm --version
   ```

4. **Any error messages you see**

---

## 📚 Documentation Files

Quick reference guides I've created:

1. **`WINDOWS-SERVICE-QUICKSTART.md`** ← Start here!
   - Quick fixes for common issues
   - Service management commands
   - Step-by-step setup

2. **`TROUBLESHOOTING.md`** (already existed)
   - Comprehensive troubleshooting
   - Advanced debugging
   - All possible issues and solutions

3. **`RUN-SETUP-CORRECTLY.md`** (already existed)
   - How to run setup from correct directory
   - Common mistakes to avoid

---

## 💡 Why Connection Refused Happens

The "connection refused" error on localhost:9090 means:

1. **Service isn't running** - Most common cause
2. **Service crashed on startup** - Check error messages
3. **Wrong port** - Verify config file port setting
4. **Firewall blocking** - Unlikely for localhost

The diagnostic and test scripts will identify which one it is!

---

## 🎓 Understanding the Architecture

**What happens when service starts:**

1. Loads config from `C:\ProgramData\UniFi-Doordeck-Bridge\config.json`
2. Connects to UniFi Access controller
3. Authenticates with Doordeck Cloud
4. Starts REST API on port 9090 (localhost only)
5. Begins monitoring for unlock commands and door events

**The REST API (port 9090):**
- Used by Electron UI to communicate with service
- Also useful for debugging and monitoring
- Only accessible from localhost (security)

---

*Created: 2025-10-21*
*Status: Ready for testing*
