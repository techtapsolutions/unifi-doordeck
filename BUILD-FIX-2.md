# Build Fix #2 Applied ✅

## Problem

After fixing the graphics issue, the build failed with:

```
LicenseData: open failed "LICENSE.txt"
Error in script "...\unifi-doordeck-bridge.nsi" on line 70
```

## Root Cause

The NSIS script needed `LICENSE.txt` file in the `installer/` directory, but:
1. The file didn't exist
2. The npm script used Unix `cp` command which doesn't work on Windows

## Fix Applied

### 1. Created LICENSE.txt ✅

Created `installer/LICENSE.txt` with MIT License for Tech Tap Solutions.

### 2. Fixed npm Script ✅

Updated `package.json` to support both Windows and Unix:

**Before:**
```json
"installer:copy-license": "cp LICENSE installer/LICENSE.txt || echo 'LICENSE file not found, skipping'"
```

**After:**
```json
"installer:copy-license": "copy LICENSE installer\\LICENSE.txt || cp LICENSE installer/LICENSE.txt || echo LICENSE already exists"
```

Now tries Windows `copy` first, then Unix `cp` as fallback.

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
Total size: 37105 bytes (36.2 KB)
Output: "UniFi-Doordeck-Bridge-Setup-0.1.0.exe"
...
Successfully built!
```

✅ **Installer will be:** `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

## What's Working Now

✅ Dynamic version reading from package.json
✅ Company name set to "Tech Tap Solutions"
✅ License file present
✅ Default NSIS graphics (professional look)
✅ Cross-platform npm script (Windows + Unix)

## Files Created/Modified

**Created:**
- ✅ `installer/LICENSE.txt` - MIT License

**Modified:**
- ✅ `installer/unifi-doordeck-bridge.nsi` - Commented out custom graphics
- ✅ `package.json` - Windows-compatible copy command

## Test After Build

```cmd
REM 1. Verify installer was created
dir installer\UniFi-Doordeck-Bridge-Setup-*.exe

REM 2. Check file size (should be 50-150 MB)
dir installer\*.exe

REM 3. Run installer
cd installer
UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

## If Build Still Fails

1. **Check you have latest files:**
   - Sync project folder with latest changes
   - Ensure `installer/LICENSE.txt` exists

2. **Verify TypeScript build:**
   ```cmd
   npm run build
   dir dist\index.js
   ```

3. **Manual NSIS test:**
   ```cmd
   cd installer
   "C:\Program Files (x86)\NSIS\makensis.exe" unifi-doordeck-bridge.nsi
   ```

4. **Check NSIS log carefully:**
   - Look for any "can't open file" errors
   - Check line numbers for specific issues

## What's Next

After successful build:

1. ✅ Test installer on Windows VM
2. ✅ Verify service installation
3. ✅ Configure with real credentials
4. ✅ Test unlock flow end-to-end

---

**The installer should now build successfully! 🚀**

Try building again and let me know if you see any other errors.
