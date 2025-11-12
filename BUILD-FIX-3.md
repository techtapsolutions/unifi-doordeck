# Build Fix #3 Applied ✅

## Problem

After fixing the LICENSE path issues, the build failed with:

```
DetailPrint: "Found Node.js version: $1"
Invalid command: "${StrContains}"
Error in script "...\unifi-doordeck-bridge.nsi" on line 299
```

## Root Cause

The NSIS script uses the `${StrContains}` macro for Node.js version checking (lines 299-301), but the required `StrFunc.nsh` header was not included in the script.

The error occurred in this code block:
```nsis
; Check if version is at least v20
; Simple check: look for v20, v21, v22, etc.
${StrContains} $2 "v20" "$1"  # Line 299 - ERROR
${StrContains} $3 "v21" "$1"
${StrContains} $4 "v22" "$1"
```

## Fix Applied

### Added StrFunc.nsh Include and Initialization ✅

Updated `installer/unifi-doordeck-bridge.nsi` includes section:

**Before:**
```nsis
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"

;--------------------------------
; General Configuration
```

**After:**
```nsis
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"
!include "StrFunc.nsh"

; Initialize string functions
${StrFunc_StrContains}

;--------------------------------
; General Configuration
```

## What This Enables

The `${StrContains}` macro is now available for:
- Checking Node.js version (v20, v21, v22+)
- Warning users if Node.js version is too old
- Allowing users to proceed anyway if desired

## ✅ Ready to Build Again!

The installer should now build successfully!

### On your Windows VM:

```cmd
cd X:\Tech Tap Solutions\AI\Claude\DoorDeck
npm run installer:build:win
```

**Expected output:**
```
Processing script file: "...\unifi-doordeck-bridge.nsi"
!define: "PRODUCT_VERSION" = "0.1.0"
!define: "PRODUCT_PUBLISHER" = "Tech Tap Solutions"
...
Total size: varies
Output: "UniFi-Doordeck-Bridge-Setup-0.1.0.exe"
Install: 7 pages (448 bytes)
Uninstall: 3 pages
Successfully built!
```

✅ **Installer will be:** `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

## Build Progress

Build 4 got MUCH further than previous builds:
- ✅ Successfully extracted version (0.1.0) from package.json
- ✅ Successfully copied all dist files (361 lines processed)
- ✅ Successfully copied LICENSE and README
- ✅ Successfully copied scripts
- ✅ Created documentation sections
- ❌ Failed at Node.js version checking in .onInit function

With this fix, the entire build should complete!

## What's Working Now

✅ Dynamic version reading from package.json
✅ Company name set to "Tech Tap Solutions"
✅ License file references fixed
✅ Default NSIS graphics (professional look)
✅ Cross-platform npm script (Windows + Unix)
✅ **String functions for version checking**

## Files Modified

**Modified:**
- ✅ `installer/unifi-doordeck-bridge.nsi` - Added StrFunc.nsh include and initialization

## Test After Build

```cmd
REM 1. Verify installer was created
dir installer\UniFi-Doordeck-Bridge-Setup-*.exe

REM 2. Check file size (should be 50-150 MB with node_modules)
dir installer\*.exe

REM 3. Run installer (as Administrator)
cd installer
UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

## Installation Flow

When you run the installer, it will:

1. **Welcome Screen** - Display product name and version
2. **License Agreement** - Show MIT License (must accept)
3. **Components Selection** - Choose what to install:
   - ✅ Core Files (required)
   - ✅ Node.js Dependencies (recommended)
   - ✅ Windows Service (recommended)
   - ✅ Start Menu Shortcuts
   - ✅ Documentation

4. **Directory Selection** - Default: `C:\Program Files\UniFi-Doordeck-Bridge`
5. **Installation Progress** - Shows file copying and npm install
6. **Service Installation** - Registers Windows Service
7. **Finish** - Option to launch configuration wizard

## After Installation

The installer creates these shortcuts in Start Menu:

- **Configure** - Opens config.json in Notepad
- **View Logs** - Opens logs folder
- **Start Service** - Starts the bridge service
- **Stop Service** - Stops the bridge service
- **Restart Service** - Restarts the service
- **Service Manager** - Opens Windows Services console
- **README** - Opens README.md
- **Uninstall** - Removes the bridge

## Configuration Files

**Config Location:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

**Logs Location:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\logs\
```

## What's Next

After successful build and installation:

1. ✅ Configure UniFi Access credentials
2. ✅ Configure Doordeck credentials
3. ✅ Start the service
4. ✅ Test unlock flow end-to-end
5. ✅ Monitor logs for any issues

## If Build Still Fails

1. **Check NSIS version:**
   ```cmd
   "C:\Program Files (x86)\NSIS\makensis.exe" /VERSION
   ```
   Should show: v3.11 or later

2. **Verify all includes exist:**
   - MUI2.nsh ✅
   - LogicLib.nsh ✅
   - FileFunc.nsh ✅
   - WinVer.nsh ✅
   - StrFunc.nsh ✅

3. **Check TypeScript build:**
   ```cmd
   npm run build
   dir dist\index.js
   ```

4. **Manual NSIS test:**
   ```cmd
   cd installer
   "C:\Program Files (x86)\NSIS\makensis.exe" unifi-doordeck-bridge.nsi
   ```

---

**The installer should now build successfully! 🚀**

This was the last missing piece - the build should complete fully now.
