# Installation Guide - UniFi-Doordeck Bridge

This guide will walk you through installing the UniFi-Doordeck Bridge on your Windows server.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Installation Steps](#installation-steps)
4. [Post-Installation Setup](#post-installation-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Upgrading](#upgrading)
8. [Uninstallation](#uninstallation)

---

## System Requirements

### Minimum Requirements

- **Operating System:** Windows 10 (64-bit) or Windows Server 2016 or later
- **RAM:** 2 GB minimum, 4 GB recommended
- **Disk Space:** 500 MB for application and dependencies
- **Network:**
  - Access to UniFi Access controller (typically on local network)
  - Internet access for Doordeck Cloud API
- **Permissions:** Administrator rights for installation

### Software Prerequisites

The installer will handle these automatically:

- ✅ Node.js v20 LTS (bundled with installer)
- ✅ NPM dependencies (installed automatically)
- ✅ Windows Service registration (configured automatically)

### Network Requirements

- **UniFi Access Controller:** HTTPS access on port 443
- **Doordeck Cloud:** HTTPS access to Doordeck API endpoints
- **Firewall:** Allow outbound HTTPS (443) traffic

---

## Pre-Installation Checklist

Before installing, ensure you have:

### 1. UniFi Access Information

- [ ] UniFi Access controller IP address or hostname
- [ ] Admin username for UniFi Access
- [ ] Admin password for UniFi Access
- [ ] At least one door configured in UniFi Access

**Example:**
```
Controller IP: 192.168.1.100
Username: admin
Password: ********
```

### 2. Doordeck Account

- [ ] Doordeck account email address
- [ ] Doordeck account password

**Don't have an account?** Create one at:
- https://developer.doordeck.com
- Or contact: support@doordeck.com

**Note:** You do NOT need an API token. The bridge generates authentication tokens automatically when you log in with your account credentials.

### 3. Installation Account

- [ ] Windows account with Administrator privileges
- [ ] Ability to run the installer as Administrator

---

## Installation Steps

### Step 1: Download the Installer

**Option A: Download from GitHub Releases**

1. Go to: https://github.com/your-org/unifi-doordeck-bridge/releases
2. Find the latest release
3. Download `UniFi-Doordeck-Bridge-Setup-X.X.X.exe`

**Option B: Build from Source** (Advanced)

See [BUILD.md](BUILD.md) for instructions on building from source.

### Step 2: Run the Installer

1. **Locate the downloaded file:**
   - Default location: `C:\Users\YourName\Downloads\`
   - Filename: `UniFi-Doordeck-Bridge-Setup-X.X.X.exe`

2. **Run as Administrator:**
   - Right-click the installer
   - Select **"Run as administrator"**
   - Click **"Yes"** when prompted by User Account Control

3. **Follow the installation wizard:**

   **Welcome Screen**
   - Click **"Next"**

   **License Agreement**
   - Review the MIT License
   - Click **"I Agree"**

   **Choose Install Location**
   - Default: `C:\Program Files\UniFi-Doordeck-Bridge`
   - Click **"Next"** (recommended to keep default)

   **Installing Components**
   - The installer will:
     - Copy program files
     - Install Node.js dependencies (this may take 2-3 minutes)
     - Register Windows Service
     - Create configuration files
     - Add Start Menu shortcuts

   **Completion**
   - Click **"Finish"**

### Step 3: Verify Installation

Check that the service is installed:

1. Press **Win + R**
2. Type: `services.msc`
3. Press **Enter**
4. Look for **"UniFi-Doordeck Bridge"** in the list

The service should be:
- **Status:** Stopped (will configure before starting)
- **Startup Type:** Automatic

---

## Post-Installation Setup

### Step 1: Configure the Bridge

**Option A: Using Start Menu Shortcut** (Recommended)

1. Press **Win** key
2. Search for **"UniFi-Doordeck Bridge"**
3. Click **"Configure"**
4. Notepad will open with `config.json`

**Option B: Manual Configuration**

1. Navigate to: `C:\ProgramData\UniFi-Doordeck-Bridge\`
2. Open `config.json` in your preferred text editor

### Step 2: Edit Configuration File

Replace the example values with your actual credentials:

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "port": 443,
    "username": "admin",
    "password": "your-unifi-password",
    "verifySsl": false,
    "reconnectDelay": 5000,
    "maxRetries": 3
  },
  "doordeck": {
    "email": "your@email.com",
    "password": "your-doordeck-password"
  },
  "bridge": {
    "syncInterval": 300000,
    "eventQueueSize": 1000,
    "enableHealthCheck": true
  },
  "logging": {
    "level": "info",
    "maxFiles": 7,
    "maxSize": "10m"
  }
}
```

**Configuration Tips:**

- **host:** Your UniFi Access controller IP or hostname
- **verifySsl:** Set to `false` if using self-signed certificates (typical for local controllers)
- **email/password:** Your Doordeck account credentials (NOT an API token)
- **syncInterval:** How often to sync doors (in milliseconds, 300000 = 5 minutes)

### Step 3: Save Configuration

1. **Save the file** (Ctrl + S in Notepad)
2. **Close the editor**

### Step 4: Start the Service

**Option A: Using Start Menu Shortcut**

1. Press **Win** key
2. Search for **"UniFi-Doordeck Bridge"**
3. Click **"Start Service"**
4. Wait 5-10 seconds for service to start

**Option B: Using Services Console**

1. Press **Win + R**
2. Type: `services.msc`
3. Find **"UniFi-Doordeck Bridge"**
4. Right-click → **"Start"**

**Option C: Using Command Line**

```cmd
sc start "UniFi-Doordeck-Bridge"
```

---

## Verification

### Check Service Status

**Method 1: Start Menu Shortcut**

1. Press **Win** key
2. Search for **"UniFi-Doordeck Bridge"**
3. Click **"Service Manager"**
4. Verify status is **"Running"**

**Method 2: Command Line**

```cmd
sc query "UniFi-Doordeck-Bridge"
```

You should see:
```
STATE              : 4  RUNNING
```

### Check Logs

**Using Start Menu:**

1. Press **Win** key
2. Search for **"UniFi-Doordeck Bridge"**
3. Click **"View Logs"**
4. Open the most recent `bridge-YYYY-MM-DD.log` file

**Manual Location:**

```
C:\ProgramData\UniFi-Doordeck-Bridge\logs\
```

**What to look for:**

✅ **Successful startup:**
```
[INFO] Starting UniFi-Doordeck Bridge...
[INFO] Initializing Doordeck client...
[INFO] Doordeck client initialized successfully
[INFO] Connecting to UniFi Access controller at 192.168.1.100...
[INFO] Successfully connected to UniFi Access
[INFO] Discovered 3 doors
[INFO] Bridge started successfully
```

❌ **Common errors:**
```
[ERROR] Failed to connect to UniFi Access: ETIMEDOUT
[ERROR] Authentication failed with Doordeck
[ERROR] Invalid configuration: missing required field
```

See [Troubleshooting](#troubleshooting) section for solutions.

### Test Door Registration

1. Check logs for door discovery:
   ```
   [INFO] Discovered doors:
   [INFO]   - Front Door (ID: door-123)
   [INFO]   - Back Door (ID: door-456)
   ```

2. Verify doors are registered with Doordeck:
   - Log in to your Doordeck account
   - Check for newly registered doors

---

## Troubleshooting

### Service Won't Start

**Symptom:** Service shows "Stopped" and won't start

**Solutions:**

1. **Check configuration file:**
   ```cmd
   notepad "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
   ```
   - Verify all required fields are filled
   - Check for JSON syntax errors (missing commas, brackets)

2. **Check logs:**
   - Navigate to: `C:\ProgramData\UniFi-Doordeck-Bridge\logs\`
   - Open the latest error log
   - Look for specific error messages

3. **Test connectivity:**
   ```cmd
   ping 192.168.1.100
   curl -k https://192.168.1.100
   ```

4. **Restart service:**
   - Start Menu → **"Restart Service"**

### Cannot Connect to UniFi Access

**Symptom:** Logs show `ETIMEDOUT` or connection errors

**Solutions:**

1. **Verify controller is reachable:**
   ```cmd
   ping <your-controller-ip>
   ```

2. **Check firewall:**
   - Ensure Windows Firewall allows outbound HTTPS
   - Check UniFi Access controller firewall settings

3. **Verify credentials:**
   - Try logging in via UniFi Access web UI with same credentials
   - URL: `https://<controller-ip>`

4. **Check SSL settings:**
   - If using self-signed certificate, ensure `verifySsl: false` in config

### Doordeck Authentication Failed

**Symptom:** Logs show authentication errors

**Solutions:**

1. **Verify credentials:**
   - Try logging in to Doordeck mobile app with same credentials
   - Check email and password are correct

2. **Account issues:**
   - Ensure Doordeck account is active
   - Contact support@doordeck.com if account issues persist

3. **Network connectivity:**
   - Ensure internet access is available
   - Check firewall allows outbound HTTPS to Doordeck API

### No Doors Discovered

**Symptom:** Logs show 0 doors discovered

**Solutions:**

1. **Check UniFi Access:**
   - Log in to UniFi Access web UI
   - Verify doors are configured and visible

2. **Check permissions:**
   - Ensure admin account has permission to view doors

3. **Restart bridge:**
   ```cmd
   sc stop "UniFi-Doordeck-Bridge"
   timeout /t 5
   sc start "UniFi-Doordeck-Bridge"
   ```

### High Memory/CPU Usage

**Symptom:** Service uses excessive resources

**Solutions:**

1. **Adjust sync interval:**
   - Edit `config.json`
   - Increase `syncInterval` (e.g., 600000 for 10 minutes)

2. **Reduce log verbosity:**
   - Change `logging.level` to `"warn"` or `"error"`

3. **Restart service:**
   - Start Menu → **"Restart Service"**

---

## Upgrading

### Upgrade Process

1. **Download new installer** from GitHub Releases

2. **Stop the service:**
   ```cmd
   sc stop "UniFi-Doordeck-Bridge"
   ```

3. **Run new installer** as Administrator
   - Installer will detect existing installation
   - Choose **"Install"** to upgrade in place

4. **Configuration preserved:**
   - Your `config.json` is NOT overwritten
   - Logs are preserved

5. **Start the service:**
   ```cmd
   sc start "UniFi-Doordeck-Bridge"
   ```

6. **Verify upgrade:**
   - Check logs for version number
   - Ensure service starts successfully

### Upgrade Notes

- **Backward compatibility:** Configuration files are compatible across versions
- **Database migrations:** Automatic (if applicable)
- **No downtime required:** Can upgrade during maintenance windows

---

## Uninstallation

### Complete Removal

**Option A: Using Control Panel**

1. Open **Control Panel**
2. Go to **Programs → Uninstall a program**
3. Find **"UniFi-Doordeck Bridge"**
4. Click **"Uninstall"**
5. Follow uninstaller prompts

**Option B: Using Start Menu**

1. Press **Win** key
2. Search for **"UniFi-Doordeck Bridge"**
3. Click **"Uninstall"**

### Uninstaller Options

**Remove configuration and logs?**

- **Yes:** Complete clean removal (recommended for permanent uninstall)
- **No:** Keep config and logs (recommended if reinstalling later)

### Manual Cleanup (if needed)

If uninstaller fails or partial removal:

```cmd
REM Stop service
sc stop "UniFi-Doordeck-Bridge"

REM Delete service
sc delete "UniFi-Doordeck-Bridge"

REM Remove program files
rmdir /s /q "C:\Program Files\UniFi-Doordeck-Bridge"

REM Remove data (optional)
rmdir /s /q "C:\ProgramData\UniFi-Doordeck-Bridge"

REM Remove Start Menu shortcuts
rmdir /s /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\UniFi-Doordeck Bridge"
```

---

## Getting Help

### Documentation

- **Architecture Guide:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Configuration Reference:** [CONFIGURATION.md](CONFIGURATION.md)
- **Troubleshooting Guide:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Support Channels

- **GitHub Issues:** https://github.com/your-org/unifi-doordeck-bridge/issues
- **Doordeck Support:** support@doordeck.com
- **UniFi Support:** https://help.ui.com

### Reporting Bugs

When reporting issues, include:

1. **Version information:**
   ```cmd
   type "C:\Program Files\UniFi-Doordeck-Bridge\package.json" | findstr version
   ```

2. **Log files:**
   - Latest error logs from: `C:\ProgramData\UniFi-Doordeck-Bridge\logs\`

3. **Configuration** (remove sensitive data):
   - Sanitized `config.json` (hide passwords!)

4. **Steps to reproduce**

---

## Next Steps

After successful installation:

1. ✅ **Monitor logs** for the first 24 hours
2. ✅ **Test door unlocks** via Doordeck mobile app
3. ✅ **Verify event forwarding** (door open/close events)
4. ✅ **Set up monitoring** (optional, see MONITORING.md)
5. ✅ **Schedule regular backups** of configuration

**Congratulations!** Your UniFi-Doordeck Bridge is now installed and running.
