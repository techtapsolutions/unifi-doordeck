# UniFi-Doordeck Bridge - Installation Guide

Complete guide for installing and configuring the UniFi-Doordeck Bridge service on Windows.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Using the Installer (Recommended)](#method-1-using-the-installer-recommended)
  - [Method 2: Manual Installation](#method-2-manual-installation)
- [Initial Configuration](#initial-configuration)
- [Windows Service Setup](#windows-service-setup)
- [Verification](#verification)
- [Common Installation Issues](#common-installation-issues)
- [Uninstallation](#uninstallation)

## Prerequisites

Before installing the UniFi-Doordeck Bridge, ensure you have:

### Hardware Requirements
- **Operating System**: Windows 10/11 (64-bit) or Windows Server 2016+ (64-bit)
- **RAM**: Minimum 2GB available RAM
- **Disk Space**: Minimum 500MB free disk space
- **Network**: Local network access to UniFi Access Controller

### Software Requirements

#### 1. Node.js Runtime
- **Version**: Node.js 20 LTS or later
- **Download**: https://nodejs.org/
- **Installation**:
  - Download the Windows installer (.msi)
  - Run installer and follow prompts
  - Verify installation: Open Command Prompt and run:
    ```cmd
    node --version
    npm --version
    ```

#### 2. UniFi Access Controller
- **Version**: UniFi Access Controller 1.x or later
- **Access**: Network access to controller (local network or VPN)
- **Credentials**: Administrator username and password
- **Prerequisites**:
  - Controller must be accessible via HTTPS
  - At least one door configured in UniFi Access
  - API access enabled (default)

#### 3. Doordeck Account
- **Account**: Active Doordeck account with API access
- **Credentials**:
  - Doordeck email address
  - Doordeck password
  - Doordeck API token (from developer portal)
- **Setup**:
  - Visit https://www.doordeck.com/
  - Create account or login
  - Contact Doordeck support for API token access

### Network Requirements
- **Firewall**: Allow outbound HTTPS (443) to:
  - Doordeck API (`api.doordeck.com`)
  - UniFi Access Controller (your controller IP/hostname)
- **Connectivity**: Stable network connection to both services
- **SSL/TLS**: Valid SSL certificates or ability to disable verification (not recommended for production)

---

## Installation Methods

### Method 1: Using the Installer (Recommended)

The Windows installer provides the easiest installation experience.

#### Step 1: Download Installer
1. Download the latest installer from releases page
2. File: `UniFi-Doordeck-Bridge-Setup-vX.X.X.exe`
3. Save to Downloads folder

#### Step 2: Run Installer
1. Right-click installer → **Run as administrator**
2. Click **Yes** on UAC prompt
3. Follow installation wizard:
   - Accept license agreement
   - Choose installation directory (default: `C:\Program Files\UniFi-Doordeck-Bridge`)
   - Select components (all recommended)
   - Click **Install**

#### Step 3: Configuration Wizard (Post-Install)
After installation completes, the configuration wizard launches automatically:

1. **UniFi Access Configuration**
   - Enter UniFi Controller host (e.g., `192.168.1.100` or `unifi.local`)
   - Enter port (default: `443`)
   - Enter username
   - Enter password
   - Choose SSL verification setting
   - Click **Test Connection**

2. **Doordeck Configuration**
   - Enter Doordeck email
   - Enter Doordeck password
   - Enter API token
   - Click **Test Authentication**

3. **Service Configuration**
   - Choose logging level (default: `info`)
   - Configure file logging (optional)
   - Set health check interval
   - Review settings

4. **Complete Setup**
   - Click **Finish**
   - Service installs and starts automatically

---

### Method 2: Manual Installation

For advanced users or custom deployments.

#### Step 1: Download Source
```cmd
git clone https://github.com/your-org/unifi-doordeck-bridge.git
cd unifi-doordeck-bridge
```

Or download ZIP from releases and extract.

#### Step 2: Install Dependencies
```cmd
npm install --production
```

#### Step 3: Build Project
```cmd
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

#### Step 4: Create Configuration Directory
```cmd
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge"
mkdir "C:\ProgramData\UniFi-Doordeck-Bridge\logs"
```

#### Step 5: Copy Configuration File
```cmd
copy config.example.json "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

---

## Initial Configuration

Edit the configuration file at `C:\ProgramData\UniFi-Doordeck-Bridge\config.json`:

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "port": 443,
    "username": "admin",
    "password": "your-unifi-password",
    "verifySsl": true,
    "reconnectDelay": 5000,
    "maxRetries": 3
  },
  "doordeck": {
    "apiToken": "your-doordeck-api-token",
    "email": "your-email@example.com",
    "password": "your-doordeck-password",
    "debug": false
  },
  "logging": {
    "level": "info",
    "fileLogging": true,
    "logDirectory": "C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs",
    "maxFileSize": 10485760,
    "maxFiles": 5
  },
  "healthMonitor": {
    "enabled": true,
    "checkInterval": 60000,
    "failureThreshold": 3,
    "timeout": 5000
  },
  "circuitBreaker": {
    "failureThreshold": 5,
    "successThreshold": 2,
    "timeout": 60000
  },
  "retry": {
    "maxAttempts": 3,
    "initialDelay": 1000,
    "maxDelay": 30000,
    "backoffMultiplier": 2
  }
}
```

### Configuration Parameters

See [CONFIGURATION.md](CONFIGURATION.md) for complete parameter reference.

### Using Environment Variables (Optional)

You can override configuration using environment variables:

```cmd
set UNIFI_HOST=192.168.1.100
set UNIFI_USERNAME=admin
set UNIFI_PASSWORD=secure-password
set DOORDECK_EMAIL=your-email@example.com
set DOORDECK_PASSWORD=secure-password
set DOORDECK_API_TOKEN=your-token
```

---

## Windows Service Setup

### Automatic Installation (Installer Method)

If you used the installer, the service is already registered. Skip to [Verification](#verification).

### Manual Service Installation

#### Step 1: Install Service
```cmd
cd C:\path\to\unifi-doordeck-bridge
node scripts\install-service.js
```

Output:
```
UniFi-Doordeck Bridge - Windows Service Installer
============================================================
Service Script: C:\...\dist\service\wrapper.js

Creating configuration directory: C:\ProgramData\UniFi-Doordeck-Bridge
Creating logs directory: C:\ProgramData\UniFi-Doordeck-Bridge\logs

Copying example configuration to: C:\ProgramData\UniFi-Doordeck-Bridge\config.json

⚠️  IMPORTANT: Edit the configuration file with your credentials:
   C:\ProgramData\UniFi-Doordeck-Bridge\config.json

Installing Windows Service...
This may require administrator privileges.

✅ Service installed successfully!

Service Name: UniFi-Doordeck-Bridge
Service Status: Installed

Next steps:
  1. Configure your credentials in: C:\ProgramData\UniFi-Doordeck-Bridge\config.json
  2. Start the service:
     sc start "UniFi-Doordeck-Bridge"
     or use Services.msc

To uninstall:
  node scripts\uninstall-service.js
```

#### Step 2: Configure Credentials

Edit `C:\ProgramData\UniFi-Doordeck-Bridge\config.json` with your credentials.

#### Step 3: Start Service

**Using Command Line:**
```cmd
sc start "UniFi-Doordeck-Bridge"
```

**Using Services Manager:**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **UniFi-Doordeck-Bridge** in the list
4. Right-click → **Start**

#### Step 4: Configure Auto-Start

**Using Command Line:**
```cmd
sc config "UniFi-Doordeck-Bridge" start=auto
```

**Using Services Manager:**
1. Open `services.msc`
2. Find **UniFi-Doordeck-Bridge**
3. Right-click → **Properties**
4. Set **Startup type** to **Automatic**
5. Click **OK**

---

## Verification

### Step 1: Check Service Status

**Using Command Line:**
```cmd
sc query "UniFi-Doordeck-Bridge"
```

Expected output:
```
SERVICE_NAME: UniFi-Doordeck-Bridge
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 4  RUNNING
        WIN32_EXIT_CODE    : 0  (0x0)
        ...
```

**Using Services Manager:**
1. Open `services.msc`
2. Find **UniFi-Doordeck-Bridge**
3. Status should show **Running**

### Step 2: Review Logs

Check logs at `C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log`:

```
2025-10-20 18:30:15 [info]: Starting UniFi-Doordeck Bridge...
2025-10-20 18:30:15 [info]: Configuration loaded successfully
2025-10-20 18:30:16 [info]: Connected to UniFi Access Controller
2025-10-20 18:30:16 [info]: Authenticated with Doordeck
2025-10-20 18:30:17 [info]: Door sync completed: 5 doors
2025-10-20 18:30:17 [info]: UniFi-Doordeck Bridge started successfully
```

### Step 3: Test Door Unlock

1. Open Doordeck mobile app
2. Navigate to a registered door
3. Tap **Unlock**
4. Physical door should unlock
5. Check logs for unlock event

Expected log entry:
```
2025-10-20 18:31:45 [info]: Received unlock command for lock: abc123
2025-10-20 18:31:45 [info]: Unlocking UniFi door: Front Door (door-456)
2025-10-20 18:31:46 [info]: Door unlocked successfully
```

### Step 4: Verify Event Forwarding

1. Physically open a door with badge/card
2. Check Doordeck app for event notification
3. Check logs for event forwarding

Expected log entry:
```
2025-10-20 18:32:10 [info]: Received UniFi event: door_opened (door-456)
2025-10-20 18:32:10 [info]: Forwarding event to Doordeck: door_opened
2025-10-20 18:32:11 [info]: Event forwarded successfully
```

---

## Common Installation Issues

### Issue: Node.js Not Found

**Symptom:**
```
'node' is not recognized as an internal or external command
```

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart Command Prompt
3. Verify: `node --version`

### Issue: Service Fails to Start

**Symptom:**
```
Error 1053: The service did not respond to the start or control request in a timely fashion
```

**Solutions:**

1. **Check Configuration File**
   - Verify `config.json` exists
   - Validate JSON syntax
   - Ensure credentials are correct

2. **Check Logs**
   - Review `C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log`
   - Look for error messages

3. **Test Manual Start**
   ```cmd
   cd C:\Program Files\UniFi-Doordeck-Bridge
   set CONFIG_PATH=C:\ProgramData\UniFi-Doordeck-Bridge\config.json
   node dist\service\wrapper.js
   ```

### Issue: Cannot Connect to UniFi Controller

**Symptom:**
```
[error]: Failed to connect to UniFi Access: ECONNREFUSED
```

**Solutions:**

1. **Verify Network Access**
   ```cmd
   ping 192.168.1.100
   ```

2. **Check Firewall**
   - Ensure port 443 is accessible
   - Test with browser: `https://192.168.1.100`

3. **Verify SSL Settings**
   - If using self-signed certificate, set `"verifySsl": false`

4. **Check Credentials**
   - Verify username/password
   - Ensure user has admin privileges

### Issue: Cannot Authenticate with Doordeck

**Symptom:**
```
[error]: Failed to authenticate with Doordeck: 401 Unauthorized
```

**Solutions:**

1. **Verify Credentials**
   - Check email/password
   - Verify API token

2. **Check Token Validity**
   - Contact Doordeck support
   - Request new API token if expired

3. **Test API Access**
   ```powershell
   Invoke-RestMethod -Uri "https://api.doordeck.com/auth/token" `
     -Method POST `
     -Headers @{"api-key"="your-token"} `
     -Body @{email="your-email"; password="your-password"} | ConvertTo-Json
   ```

### Issue: Doors Not Syncing

**Symptom:**
```
[info]: Door sync completed: 0 doors
```

**Solutions:**

1. **Verify UniFi Doors Exist**
   - Check UniFi Access console
   - Ensure at least one door is configured

2. **Check Permissions**
   - Verify user has access to doors
   - Check UniFi Access user permissions

3. **Review Door Registration**
   - Check logs for registration errors
   - Verify Doordeck integration configuration

### Issue: High Memory Usage

**Symptom:** Service using excessive RAM

**Solutions:**

1. **Adjust Node.js Memory Limit**
   - Edit service configuration
   - Add: `--max_old_space_size=512`

2. **Check for Memory Leaks**
   - Review logs for recurring errors
   - Restart service periodically

3. **Reduce Logging**
   - Set log level to `warn` or `error`
   - Reduce `maxFiles` setting

---

## Uninstallation

### Using Uninstaller (Installer Method)

1. Open **Control Panel** → **Programs and Features**
2. Find **UniFi-Doordeck Bridge**
3. Right-click → **Uninstall**
4. Follow prompts

### Manual Uninstallation

#### Step 1: Stop Service
```cmd
sc stop "UniFi-Doordeck-Bridge"
```

#### Step 2: Uninstall Service
```cmd
cd C:\path\to\unifi-doordeck-bridge
node scripts\uninstall-service.js
```

Output:
```
UniFi-Doordeck Bridge - Windows Service Uninstaller
============================================================
Service Name: UniFi-Doordeck-Bridge
Service Script: C:\...\dist\service\wrapper.js

Uninstalling Windows Service...
This may require administrator privileges.

✅ Service uninstalled successfully!

Do you want to remove configuration and log files? (y/N):
```

- Type `y` to remove configuration and logs
- Type `n` to preserve configuration

#### Step 3: Remove Files (Optional)

If you want to completely remove all files:

```cmd
rmdir /s /q "C:\Program Files\UniFi-Doordeck-Bridge"
rmdir /s /q "C:\ProgramData\UniFi-Doordeck-Bridge"
```

---

## Next Steps

After successful installation:

1. **Configure Door Mappings** - See [CONFIGURATION.md](CONFIGURATION.md)
2. **Review Architecture** - See [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Troubleshooting** - See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Security Best Practices** - See [SECURITY.md](SECURITY.md)

## Support

For additional help:
- **Documentation**: See [README.md](README.md)
- **Issues**: https://github.com/your-org/unifi-doordeck-bridge/issues
- **Doordeck Support**: support@doordeck.com
- **UniFi Access**: https://help.ui.com/

---

## Appendix: Deployment Checklist

Use this checklist for production deployments:

- [ ] Node.js 20 LTS installed
- [ ] UniFi Access Controller accessible
- [ ] Doordeck account configured
- [ ] Configuration file created and validated
- [ ] Credentials secured (not in plain text)
- [ ] Firewall rules configured
- [ ] Windows Service installed and running
- [ ] Service set to automatic start
- [ ] Logs reviewed for errors
- [ ] Test unlock performed successfully
- [ ] Test event forwarding verified
- [ ] Monitoring/alerts configured
- [ ] Backup of configuration created
- [ ] Documentation reviewed by team
- [ ] Rollback plan prepared

---

**Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: UniFi-Doordeck Bridge Team
