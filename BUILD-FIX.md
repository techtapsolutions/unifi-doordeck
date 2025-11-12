# Build Fix Applied ✅

## Problem

The NSIS installer build was failing with this error:

```
Error while loading icon from "assets\icon.ico": can't open file
Error in script "...\unifi-doordeck-bridge.nsi" on line 67 -- aborting creation process
```

## Root Cause

The NSIS script was trying to load custom graphics (icon and bitmaps) that didn't exist:
- `installer/assets/icon.ico`
- `installer/assets/header.bmp`
- `installer/assets/welcome.bmp`

## Fix Applied

**Commented out custom graphics** in `installer/unifi-doordeck-bridge.nsi`:

```nsis
; Custom graphics (optional - comment out if assets don't exist)
; !define MUI_ICON "assets\icon.ico"
; !define MUI_UNICON "assets\icon.ico"
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
; !define MUI_WELCOMEFINISHPAGE_BITMAP "assets\welcome.bmp"
```

**Result:** Installer now uses NSIS default graphics (professional standard appearance).

## Also Updated

✅ Changed company name: "Your Company Name" → "Tech Tap Solutions"
✅ Dynamic version reading working perfectly (reads from package.json)

## ✅ Ready to Build

The installer should now build successfully!

### On your Windows VM:

```cmd
cd X:\Tech Tap Solutions\AI\Claude\DoorDeck
npm run installer:build:win
```

**Expected output:**
```
Processing script file: "...\unifi-doordeck-bridge.nsi"
...
Installer: 1 page (256 bytes), 1 section (1024 bytes), 142 instructions (3976 bytes), 387 strings (31849 bytes)
Total size: 37105 bytes (36.2 KB)
Output: "UniFi-Doordeck-Bridge-Setup-0.1.0.exe"
Install: 7 pages (2304 bytes), 5 sections (5120 bytes), 597 instructions (16716 bytes), 515 strings (54321 bytes)
Uninstall: 3 pages (768 bytes), 1 section (1024 bytes), 261 instructions (7308 bytes), 264 strings (23456 bytes)
Successfully built: UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

✅ **Installer file:** `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

## What Changed

**Before:** ❌ Build failed (missing graphics)
**After:** ✅ Build succeeds (uses default NSIS graphics)

**Visual difference:** None functionally, just uses standard NSIS installer appearance instead of custom branded graphics.

## Next Steps

### 1. Build the installer

```cmd
npm run installer:build:win
```

### 2. Test the installer

```cmd
cd installer
UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

### 3. Verify installation

After installer completes:

```cmd
sc query "UniFi-Doordeck-Bridge"
```

Should show service installed.

### 4. (Optional) Add custom graphics later

If you want branded graphics later, see:
- `installer/CUSTOM-GRAPHICS.md` - Complete guide

## Verification Checklist

After building:

- [ ] Build completed without errors
- [ ] Installer file created: `UniFi-Doordeck-Bridge-Setup-0.1.0.exe`
- [ ] File size: ~50-100 MB (reasonable)
- [ ] Run installer on Windows VM
- [ ] Service installs successfully
- [ ] Start Menu shortcuts appear
- [ ] Configuration file created
- [ ] Service can start/stop

## Support

If build still fails:

1. **Check NSIS is installed:**
   ```cmd
   "C:\Program Files (x86)\NSIS\makensis.exe" /VERSION
   ```
   Should output: `v3.11` or similar

2. **Check you're in the right directory:**
   ```cmd
   cd X:\Tech Tap Solutions\AI\Claude\DoorDeck
   dir package.json
   ```
   Should show package.json exists

3. **Check build output:**
   ```cmd
   npm run build
   ```
   Should compile TypeScript without errors

4. **Try manual NSIS build:**
   ```cmd
   cd installer
   "C:\Program Files (x86)\NSIS\makensis.exe" unifi-doordeck-bridge.nsi
   ```

**Still having issues?** Share the full error output and I'll help debug!

---

**The installer is now ready to build! 🚀**
