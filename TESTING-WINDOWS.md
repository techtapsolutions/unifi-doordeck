# Testing UniFi-Doordeck Bridge on Windows VM

This guide explains how to test the bridge on your Windows VM.

## Prerequisites

- ✅ Windows 10/11 or Windows Server 2016+ VM
- ✅ Administrator access
- ✅ Node.js 20+ installed on Windows
- ✅ UniFi Access controller at 192.168.1.1
- ✅ Doordeck account credentials

## Quick Test (Without Installer)

This is the fastest way to test the software without building an installer.

### Step 1: Transfer Project to Windows VM

**Option A: Clone from GitHub** (if pushed)
```cmd
git clone https://github.com/your-org/unifi-doordeck-bridge.git
cd unifi-doordeck-bridge
```

**Option B: Transfer via Shared Folder/Network**
1. Copy the entire project folder to your Windows VM
2. Open Command Prompt as Administrator
3. Navigate to the project directory

### Step 2: Install Dependencies

```cmd
npm install
```

### Step 3: Build the Project

```cmd
npm run build
```

### Step 4: Create Configuration

**Create `.env` file in project root:**

```cmd
notepad .env
```

**Add your credentials:**
```env
# UniFi Access Configuration
UNIFI_HOST=192.168.1.1
UNIFI_PORT=443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your-unifi-password
UNIFI_VERIFY_SSL=false

# Doordeck Configuration
DOORDECK_EMAIL=your@email.com
DOORDECK_PASSWORD=your-doordeck-password

# Bridge Configuration
BRIDGE_SYNC_INTERVAL=300000
BRIDGE_EVENT_QUEUE_SIZE=1000
BRIDGE_ENABLE_HEALTH_CHECK=true

# Logging
LOG_LEVEL=debug
LOG_MAX_FILES=7
LOG_MAX_SIZE=10m
```

Save and close.

### Step 5: Run the Bridge

**Run directly (for testing):**
```cmd
npm start
```

**Or run in development mode with live reload:**
```cmd
npm run dev
```

### Step 6: Monitor Logs

You should see output like:
```
[INFO] Starting UniFi-Doordeck Bridge...
[INFO] Loading configuration...
[INFO] Initializing Doordeck client...
[INFO] Doordeck client initialized successfully
[INFO] Connecting to UniFi Access controller at 192.168.1.1...
[INFO] Successfully connected to UniFi Access
[INFO] Discovering doors...
[INFO] Discovered 3 doors:
[INFO]   - Front Door (ID: door-123)
[INFO]   - Back Door (ID: door-456)
[INFO]   - Garage Door (ID: door-789)
[INFO] Registering doors with Doordeck...
[INFO] All doors registered successfully
[INFO] Starting event monitoring...
[INFO] Bridge started successfully
```

### Step 7: Test Unlock Flow

1. **Open Doordeck mobile app**
2. **Find your doors** in the door list (they should appear automatically)
3. **Tap to unlock** a door
4. **Verify:**
   - Bridge logs show unlock command received
   - UniFi Access logs show unlock command sent
   - Door physically unlocks

### Step 8: Test Event Forwarding

1. **Physically unlock a door** (using card/fob/manual)
2. **Check bridge logs:**
   ```
   [INFO] UniFi event received: door-123 unlocked
   [INFO] Translating event to Doordeck format
   [INFO] Forwarding event to Doordeck Cloud
   [INFO] Event forwarded successfully
   ```

## Full Test (With Windows Service)

For production-like testing, install as a Windows service.

### Step 1: Install Service

```cmd
node scripts/install-service.js
```

Expected output:
```
Installing UniFi-Doordeck Bridge as Windows Service...
Service installed successfully
Service started successfully
```

### Step 2: Verify Service Status

```cmd
sc query "UniFi-Doordeck-Bridge"
```

Should show:
```
STATE              : 4  RUNNING
```

### Step 3: Check Service Logs

**Logs location:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\logs\
```

**View latest log:**
```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge-2025-10-20.log"
```

### Step 4: Test Service Control

**Stop service:**
```cmd
sc stop "UniFi-Doordeck-Bridge"
```

**Start service:**
```cmd
sc start "UniFi-Doordeck-Bridge"
```

**Restart service:**
```cmd
sc stop "UniFi-Doordeck-Bridge" && timeout /t 3 && sc start "UniFi-Doordeck-Bridge"
```

### Step 5: Uninstall Service (When Done Testing)

```cmd
node scripts/uninstall-service.js
```

## Building and Testing the Installer

If you want to test the actual installer:

### Step 1: Install NSIS on Windows

1. Download NSIS 3.09 from: https://sourceforge.net/projects/nsis/files/NSIS%203/3.09/
2. Run installer
3. Install to default location: `C:\Program Files (x86)\NSIS`

### Step 2: Build the Installer

```cmd
npm run installer:build:win
```

This will:
1. Build the TypeScript project
2. Copy LICENSE file
3. Run NSIS to create installer
4. Output: `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

### Step 3: Test the Installer

1. **Locate installer:**
   ```cmd
   dir installer\*.exe
   ```

2. **Run installer as Administrator:**
   - Right-click `UniFi-Doordeck-Bridge-Setup-0.1.0.exe`
   - Select "Run as administrator"

3. **Follow installation wizard:**
   - Click "Next"
   - Accept license
   - Choose install location (default: `C:\Program Files\UniFi-Doordeck-Bridge`)
   - Select components (all recommended)
   - Click "Install"
   - Wait for installation (~2-3 minutes)
   - Click "Finish"

4. **Configure via Start Menu:**
   - Press Win key
   - Search "UniFi-Doordeck Bridge"
   - Click "Configure"
   - Edit `config.json` with your credentials
   - Save and close

5. **Start service via Start Menu:**
   - Press Win key
   - Search "UniFi-Doordeck Bridge"
   - Click "Start Service"

6. **View logs via Start Menu:**
   - Press Win key
   - Search "UniFi-Doordeck Bridge"
   - Click "View Logs"
   - Open latest log file

## Troubleshooting

### Node.js Not Found

**Error:**
```
'node' is not recognized as an internal or external command
```

**Solution:**
1. Download Node.js 20 LTS from: https://nodejs.org/
2. Run installer
3. Restart Command Prompt
4. Verify: `node --version`

### Cannot Connect to UniFi Access

**Error:**
```
[ERROR] Failed to connect to UniFi Access: ETIMEDOUT
```

**Solutions:**

1. **Verify controller is reachable:**
   ```cmd
   ping 192.168.1.1
   ```

2. **Test HTTPS access:**
   ```cmd
   curl -k https://192.168.1.1
   ```

3. **Check firewall:**
   - Windows Defender Firewall → Allow an app
   - Ensure Node.js has network access

4. **Verify credentials:**
   - Try logging into UniFi Access web UI: https://192.168.1.1
   - Use same username/password in config

### Doordeck Authentication Failed

**Error:**
```
[ERROR] Failed to authenticate with Doordeck
```

**Solutions:**

1. **Verify credentials:**
   - Try logging into Doordeck mobile app
   - Use exact same email/password

2. **Check internet connectivity:**
   ```cmd
   ping api.doordeck.com
   ```

3. **Review logs for detailed error:**
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge-*.log" | findstr "ERROR"
   ```

### No Doors Discovered

**Error:**
```
[INFO] Discovered 0 doors
```

**Solutions:**

1. **Check UniFi Access has doors:**
   - Log into UniFi Access web UI
   - Go to Doors section
   - Verify doors are configured

2. **Verify user permissions:**
   - Ensure admin account has full permissions
   - Try with default admin account

3. **Check logs for errors:**
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge-*.log" | findstr "door"
   ```

### Service Won't Start

**Error:**
```
STATE              : 1  STOPPED
```

**Solutions:**

1. **Check configuration file exists:**
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
   ```

2. **Verify JSON syntax:**
   - Open config.json in notepad
   - Check for missing commas, brackets
   - Use online JSON validator if needed

3. **Check service logs:**
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\error.log"
   ```

4. **Restart with error output:**
   ```cmd
   sc start "UniFi-Doordeck-Bridge"
   ```

## Test Checklist

After installation, verify these work:

### Basic Functionality
- [ ] Service installs successfully
- [ ] Service starts and runs
- [ ] Connects to UniFi Access controller
- [ ] Authenticates with Doordeck
- [ ] Discovers all doors
- [ ] Registers doors with Doordeck

### Unlock Flow
- [ ] Doors appear in Doordeck mobile app
- [ ] Tap-to-unlock sends command to bridge
- [ ] Bridge forwards command to UniFi Access
- [ ] Door physically unlocks
- [ ] Bridge logs show full flow
- [ ] Unlock latency < 10 seconds

### Event Forwarding
- [ ] Physical unlock triggers event
- [ ] Bridge captures UniFi event
- [ ] Bridge translates event
- [ ] Bridge forwards to Doordeck
- [ ] Event appears in Doordeck logs
- [ ] Latency < 3 seconds

### Service Management
- [ ] Start Menu shortcuts work
- [ ] Configure shortcut opens config.json
- [ ] View Logs shortcut opens log directory
- [ ] Start/Stop/Restart shortcuts work
- [ ] Service Manager shortcut opens services.msc

### Health & Monitoring
- [ ] Health checks run every 60 seconds
- [ ] Status changes logged correctly
- [ ] Circuit breaker opens on failures
- [ ] Auto-recovery works after failures

### Edge Cases
- [ ] Service survives network interruption
- [ ] Reconnects after UniFi restart
- [ ] Reconnects after Doordeck API issues
- [ ] Event queue buffers during outages
- [ ] Events forward after recovery

## Performance Testing

### Monitor Resource Usage

**Open Task Manager:**
1. Press Ctrl+Shift+Esc
2. Find "node.exe" (UniFi-Doordeck Bridge)
3. Monitor:
   - CPU: Should be < 5% typical, < 20% peak
   - Memory: Should be ~200MB typical
   - Network: Should be < 1 Mbps

### Stress Test

1. **Rapid unlocks:**
   - Unlock multiple doors quickly
   - Verify all commands process
   - Check for dropped commands

2. **Event flood:**
   - Open/close doors rapidly
   - Verify all events forward
   - Check queue doesn't overflow

3. **Long-running:**
   - Run service for 24+ hours
   - Monitor memory usage (should be stable)
   - Check for memory leaks

## Next Steps

After successful testing:

1. ✅ **Document issues found** (if any)
2. ✅ **Test with real users** (staff unlocking doors)
3. ✅ **Monitor for 24-48 hours** in production-like conditions
4. ✅ **Create production release** when stable
5. ✅ **Deploy to production** Windows server

## Support

**Logs location:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\logs\
```

**Configuration:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

**Installation directory:**
```
C:\Program Files\UniFi-Doordeck-Bridge\
```

**Report issues with:**
- Full log files
- Configuration (remove passwords!)
- Windows version
- Node.js version
- UniFi Access version
- Steps to reproduce
