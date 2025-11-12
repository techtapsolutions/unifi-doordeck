# Windows Testing Guide - UniFi-Doordeck Bridge

## 🎉 Installers Ready!

Two Windows installers have been successfully built on macOS:

### Installer Files

Located in: `gui/release/`

1. **UniFi-Doordeck Bridge-Setup-0.1.0.exe** (78 MB)
   - Full NSIS installer with setup wizard
   - Creates shortcuts, registry entries
   - Recommended for permanent installation

2. **UniFi-Doordeck Bridge-Portable-0.1.0.exe** (77 MB)
   - Portable executable, no installation needed
   - Perfect for testing or USB drive usage

### File Verification

**MD5 Checksums:**
```
UniFi-Doordeck Bridge-Setup-0.1.0.exe:    9427998788142f6f4fc727e36d39d66f
UniFi-Doordeck Bridge-Portable-0.1.0.exe: dbfa1c430b8ef64ae2c69d335e5f2704
```

**File Type:** PE32 executable (GUI) Intel 80386, for MS Windows, NSIS Installer

---

## 📦 Step 1: Transfer to Windows

### Option A: Direct Copy (Recommended)
If the Mac and Windows machine share a network or external drive:

1. Copy installers from Mac:
   ```bash
   # On Mac
   open gui/release/
   ```

2. Transfer both `.exe` files to Windows machine via:
   - Shared network drive
   - USB drive
   - Cloud storage (Dropbox, Google Drive, etc.)
   - AirDrop (if Windows supports)

### Option B: Via Cloud Storage

**Using Dropbox (Already on Dropbox!):**
Since your project is in Dropbox, the files are already syncing:
```
/Volumes/PRO-G40/Dropbox/Tech Tap Solutions/AI/Claude/DoorDeck/gui/release/
```

**On Windows:**
1. Open Dropbox folder
2. Navigate to: `Tech Tap Solutions\AI\Claude\DoorDeck\gui\release\`
3. Wait for files to sync (78 MB may take a few minutes)
4. Right-click installers → "Make available offline" (if needed)

### Option C: Direct Download
If you set up a file share or HTTP server:
```bash
# On Mac (in gui/release directory)
python3 -m http.server 8000

# Then on Windows, download via browser:
# http://[mac-ip-address]:8000/
```

---

## 🧪 Step 2: Testing on Windows

### Before You Start

**Requirements:**
- Windows 10 or Windows 11
- Administrator access (for full installer)
- UniFi Access controller (IP/hostname, username, password)
- Doordeck account (email and password)

**Recommended Test Environment:**
- ✅ Clean Windows 10 or 11 VM or machine
- ✅ Real UniFi Access controller (for full integration test)
- ⚠️ Windows Defender may show SmartScreen warning (normal for unsigned apps)

---

## 🚀 Step 3: Installation Testing

### Test Option 1: Full NSIS Installer (Recommended First)

1. **Run Installer**
   ```
   Right-click: UniFi-Doordeck Bridge-Setup-0.1.0.exe
   → Run as Administrator
   ```

2. **Expected: Windows SmartScreen Warning**
   ```
   "Windows protected your PC"
   → Click "More info"
   → Click "Run anyway"
   ```
   *(This is normal for unsigned applications)*

3. **Setup Wizard Steps:**
   - [ ] Welcome screen appears
   - [ ] License agreement (MIT License)
   - [ ] Choose installation directory (default: C:\Program Files\UniFi-Doordeck Bridge)
   - [ ] Choose Start Menu folder
   - [ ] Desktop shortcut option
   - [ ] Installation progress bar
   - [ ] Completion screen

4. **Verify Installation:**
   ```cmd
   # Check installation directory
   dir "C:\Program Files\UniFi-Doordeck Bridge"

   # Expected files:
   # - UniFi-Doordeck Bridge.exe
   # - resources/
   # - locales/
   # - Uninstall.exe
   ```

5. **Check Shortcuts Created:**
   - [ ] Desktop: "UniFi-Doordeck Bridge" icon
   - [ ] Start Menu: "UniFi-Doordeck Bridge" entry
   - [ ] Can launch from both locations

### Test Option 2: Portable Version

1. **Extract and Run**
   ```
   Double-click: UniFi-Doordeck Bridge-Portable-0.1.0.exe
   ```

2. **Expected Behavior:**
   - [ ] Extracts to temporary location
   - [ ] Application launches immediately
   - [ ] No installation or admin rights required
   - [ ] Perfect for testing without system changes

---

## 🎯 Step 4: Application Testing

### First Launch - Setup Wizard

1. **Launch Application**
   - From desktop shortcut, or
   - From Start Menu, or
   - Double-click executable

2. **Setup Wizard Should Appear:**

   **Step 1: Welcome**
   - [ ] Welcome screen displays
   - [ ] "Get Started" button works

   **Step 2: UniFi Configuration**
   - [ ] Form fields for:
     - UniFi Controller IP/hostname
     - Username
     - Password
     - Verify SSL option
   - [ ] "Test Connection" button works
   - [ ] Shows success/error message

   **Step 3: Doordeck Configuration**
   - [ ] Form fields for:
     - Doordeck email
     - Doordeck password
   - [ ] "Test Connection" button works
   - [ ] Shows authentication success/error

   **Step 4: Door Discovery**
   - [ ] Automatically discovers UniFi doors
   - [ ] Shows list of discovered doors
   - [ ] Can map doors to Doordeck locks
   - [ ] Shows door status (online/offline)

   **Step 5: Completion**
   - [ ] Shows summary of configuration
   - [ ] "Start Monitoring" button
   - [ ] Transitions to Dashboard

### Dashboard Testing

After setup wizard completes:

1. **Service Status Panel**
   - [ ] Shows "Running" or "Stopped" status
   - [ ] Connection status for UniFi (green/red)
   - [ ] Connection status for Doordeck (green/red)
   - [ ] Last sync time displayed

2. **Door List**
   - [ ] Lists all discovered doors
   - [ ] Shows door status (locked/unlocked)
   - [ ] Shows last activity timestamp
   - [ ] "Unlock" button for each door

3. **Quick Actions**
   - [ ] "Start Service" button works
   - [ ] "Stop Service" button works
   - [ ] "Refresh" button updates status
   - [ ] Service responds to commands

4. **System Tray**
   - [ ] Application minimizes to system tray
   - [ ] Tray icon shows status (green/red)
   - [ ] Right-click menu:
     - Show/Hide window
     - Quick unlock options
     - Exit

### Integration Testing (If you have real hardware)

1. **Door Unlock Test**
   - [ ] Click "Unlock" button in dashboard
   - [ ] Bridge service sends command to UniFi
   - [ ] Physical door unlocks
   - [ ] Status updates in dashboard
   - [ ] Event appears in Doordeck app

2. **Event Monitoring Test**
   - [ ] Physically open/close a door
   - [ ] Event appears in dashboard
   - [ ] Event syncs to Doordeck Cloud
   - [ ] Timestamp is accurate

3. **Connection Recovery Test**
   - [ ] Disconnect network
   - [ ] Dashboard shows offline status
   - [ ] Reconnect network
   - [ ] Application recovers automatically
   - [ ] Queued events are sent

---

## 🐛 Step 5: Common Issues & Solutions

### Issue: "Windows protected your PC" Warning

**Cause:** Application is not code-signed

**Solutions:**
1. Click "More info" → "Run anyway"
2. OR: Add code signing certificate (for production)
3. OR: Disable Windows SmartScreen (not recommended)

### Issue: Application Won't Start

**Check:**
```cmd
# Verify .NET Framework installed
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" /v Release

# Check Windows Event Viewer
eventvwr.msc
→ Windows Logs → Application
→ Look for errors from "UniFi-Doordeck Bridge"
```

### Issue: Can't Connect to UniFi Controller

**Verify:**
- Controller IP/hostname is correct
- Port 443 is open (firewall)
- SSL certificate is valid (or disable SSL verification)
- Username/password are correct
- User has admin permissions

**Test Connection:**
```cmd
# Ping controller
ping 192.168.1.100

# Test HTTPS port
curl -k https://192.168.1.100
```

### Issue: Can't Authenticate with Doordeck

**Verify:**
- Email and password are correct
- Internet connection is working
- Firewall allows HTTPS to api.doordeck.com
- Account is active

**Test API Access:**
```cmd
curl https://api.doordeck.com/health
```

### Issue: Doors Not Discovered

**Check:**
- UniFi Access has doors configured
- User has permission to view doors
- Controller is UniFi Access (not UniFi Network)
- API is responding

---

## 📊 Step 6: Test Results Checklist

Use this checklist to document your testing:

### Installation Tests
- [ ] NSIS installer runs on Windows 10
- [ ] NSIS installer runs on Windows 11
- [ ] Portable version runs without installation
- [ ] Desktop shortcut created
- [ ] Start Menu entry created
- [ ] Application launches successfully

### Setup Wizard Tests
- [ ] Welcome step displays correctly
- [ ] UniFi connection test succeeds
- [ ] Doordeck authentication succeeds
- [ ] Door discovery finds doors
- [ ] Configuration saves successfully
- [ ] Wizard completes without errors

### Dashboard Tests
- [ ] Dashboard loads after setup
- [ ] Service status displays correctly
- [ ] Connection indicators work (green/red)
- [ ] Door list populates
- [ ] Unlock buttons respond
- [ ] Service start/stop works

### Integration Tests (Optional)
- [ ] Physical door unlocks from dashboard
- [ ] Physical door events appear in dashboard
- [ ] Events sync to Doordeck Cloud
- [ ] Mobile app shows door status
- [ ] Connection recovery works

### Uninstallation Tests
- [ ] Uninstaller runs successfully
- [ ] Files removed from Program Files
- [ ] Shortcuts removed
- [ ] Registry entries cleaned up
- [ ] No leftover files

---

## 📝 Step 7: Report Findings

After testing, report:

1. **What Worked:**
   - List all successful features
   - Note performance (speed, responsiveness)
   - UI/UX observations

2. **Issues Found:**
   - Screenshot any errors
   - Copy error messages
   - Note steps to reproduce
   - Check Windows Event Viewer logs

3. **Suggestions:**
   - UI improvements
   - Missing features
   - Performance issues
   - Documentation gaps

---

## 🔧 Step 8: Uninstallation (If needed)

### Uninstall NSIS Version

**Method 1: Control Panel**
```
Settings → Apps → Apps & features
→ Search "UniFi-Doordeck Bridge"
→ Click → Uninstall
```

**Method 2: Start Menu**
```
Start Menu → UniFi-Doordeck Bridge folder
→ Uninstall
```

**Method 3: Direct**
```
C:\Program Files\UniFi-Doordeck Bridge\Uninstall.exe
```

### Remove Portable Version
Simply delete the executable - no system changes were made.

---

## 📚 Additional Resources

**Documentation:**
- [README.md](../README.md) - Main project overview
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Problem solving
- [CONFIGURATION.md](../CONFIGURATION.md) - Config reference

**Support:**
- GitHub Issues: [Report bugs or issues]
- Email: [Your support email]

---

## 🎯 Next Steps After Testing

Based on test results:

1. **If All Tests Pass:**
   - ✅ Ready for production use
   - Consider adding code signing
   - Create release notes
   - Publish to GitHub releases

2. **If Issues Found:**
   - Document all bugs
   - Prioritize fixes
   - Re-test after fixes
   - Update documentation

3. **Before Production:**
   - [ ] Replace placeholder icons with professional designs
   - [ ] Add code signing certificate
   - [ ] Create user documentation
   - [ ] Set up auto-update mechanism (optional)
   - [ ] Test on multiple Windows versions
   - [ ] Security audit
   - [ ] Performance testing with 10+ doors

---

## 🔐 Security Notes

**Important:**
- Application is NOT code-signed (shows SmartScreen warning)
- Use test credentials, not production passwords
- Review firewall rules before deployment
- Keep credentials secure
- Consider using Windows Credential Manager for production

**For Production:**
- Obtain code signing certificate ($100-500/year)
- Sign both installers and main executable
- Submit for Microsoft SmartScreen reputation building
- Implement secure credential storage

---

**Testing Started:** [Date]
**Tested By:** [Your Name]
**Windows Version:** [10/11]
**Test Environment:** [Production/VM/Lab]
**Status:** [ ] Pass / [ ] Fail / [ ] Needs Fixes

---

**Good luck with testing! 🚀**

If you encounter any issues or have questions, check the troubleshooting guide or create a GitHub issue with details.
