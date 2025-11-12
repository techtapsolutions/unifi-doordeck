# Quick Start Guide - UniFi-Doordeck Bridge

Get up and running in 10 minutes!

## Prerequisites

- ✅ Windows 10/11 or Windows Server 2016+
- ✅ Administrator access
- ✅ UniFi Access controller (IP, username, password)
- ✅ Doordeck account (email, password)

**Don't have a Doordeck account?** Create one at https://developer.doordeck.com

## Installation (5 minutes)

### 1. Download Installer

Download the latest release:
```
https://github.com/your-org/unifi-doordeck-bridge/releases/latest
```

File: `UniFi-Doordeck-Bridge-Setup-X.X.X.exe`

### 2. Run Installer

1. Right-click installer → **"Run as administrator"**
2. Click **"Next"** → **"I Agree"** → **"Next"**
3. Wait for installation (2-3 minutes)
4. Click **"Finish"**

## Configuration (3 minutes)

### 1. Open Configuration

Press **Win** key → Search **"UniFi-Doordeck Bridge"** → Click **"Configure"**

### 2. Edit Configuration

Replace the example values:

```json
{
  "unifi": {
    "host": "192.168.1.100",        ← Your UniFi controller IP
    "username": "admin",             ← Your UniFi username
    "password": "your-password"      ← Your UniFi password
  },
  "doordeck": {
    "email": "you@example.com",      ← Your Doordeck email
    "password": "your-password"      ← Your Doordeck password
  }
}
```

**Save** (Ctrl + S) and **Close**

## Start Service (1 minute)

Press **Win** key → Search **"UniFi-Doordeck Bridge"** → Click **"Start Service"**

## Verify (1 minute)

### Check Logs

Press **Win** key → Search **"UniFi-Doordeck Bridge"** → Click **"View Logs"**

Look for:
```
[INFO] Bridge started successfully
[INFO] Discovered 3 doors
```

### Test Unlock

1. Open Doordeck mobile app
2. Find your doors in the door list
3. Tap to unlock
4. Verify door unlocks

## ✅ Done!

Your bridge is now running and will:
- ✅ Automatically start with Windows
- ✅ Sync doors every 5 minutes
- ✅ Forward unlock commands to UniFi Access
- ✅ Log all activity

## Troubleshooting

### Service Won't Start?

1. Check configuration: Press **Win** → **"Configure"**
2. Verify credentials are correct
3. Check logs: Press **Win** → **"View Logs"**

### No Doors Found?

1. Log in to UniFi Access web UI
2. Verify doors are configured
3. Check user has admin permissions

### Authentication Failed?

1. Verify UniFi credentials: Try logging in to UniFi web UI
2. Verify Doordeck credentials: Try logging in to Doordeck mobile app
3. Check internet connectivity

## Need More Help?

- **Full Installation Guide:** [INSTALL.md](INSTALL.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Support:** https://github.com/your-org/unifi-doordeck-bridge/issues

## What's Next?

- 📱 **Install Doordeck mobile app** on your phone
- 🔔 **Set up notifications** for door events
- 📊 **Monitor logs** for the first 24 hours
- 🔒 **Test emergency unlock** procedures

**Need advanced configuration?** See [CONFIGURATION.md](CONFIGURATION.md)
