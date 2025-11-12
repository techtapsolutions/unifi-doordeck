# Installer Quick Reference

## 🚀 Build NSIS Installer (.exe) - EASIEST ✅

**Already configured and ready to use!**

### On Windows VM:

**1. Install NSIS (one-time):**
```cmd
REM Download from: https://sourceforge.net/projects/nsis/files/NSIS%203/3.09/
REM Run nsis-3.09-setup.exe as Administrator
```

**2. Build installer:**
```cmd
cd path\to\unifi-doordeck-bridge
npm install
npm run installer:build:win
```

**3. Find your installer:**
```cmd
dir installer\UniFi-Doordeck-Bridge-Setup-*.exe
```

✅ **Output:** `UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

**File size:** ~50-100 MB (includes Node.js dependencies)

---

## 📦 Build MSI Installer (.msi) - Enterprise

**For Group Policy deployment and enterprise environments.**

### On Windows VM:

**1. Install WiX Toolset (one-time):**
```cmd
REM Download from: https://github.com/wixtoolset/wix3/releases/latest
REM Run wix314.exe as Administrator
REM Add to PATH: C:\Program Files (x86)\WiX Toolset v3.14\bin
```

**2. Build installer:**
```cmd
cd path\to\unifi-doordeck-bridge
npm install
npm run installer:build:msi
```

**3. Find your installer:**
```cmd
dir installer\UniFi-Doordeck-Bridge.msi
```

✅ **Output:** `UniFi-Doordeck-Bridge.msi`

---

## 🎯 Both Installers

Build both EXE and MSI in one command:

```cmd
npm run installer:build:all
```

Outputs:
- `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`
- `installer\UniFi-Doordeck-Bridge.msi`

---

## 📋 Quick Comparison

| Feature | NSIS (.exe) | WiX (.msi) |
|---------|------------|-----------|
| **Ready to use** | ✅ Yes | ✅ Yes |
| **Setup time** | 5 min | 10 min |
| **Build command** | `npm run installer:build:win` | `npm run installer:build:msi` |
| **Enterprise deployment** | Limited | Excellent |
| **Group Policy** | No | Yes |
| **File size** | Smaller | Larger |
| **Recommended for** | Quick testing | Production |

---

## 🧪 Test the Installer

**Install:**
```cmd
REM NSIS (.exe)
UniFi-Doordeck-Bridge-Setup-0.1.0.exe

REM MSI
msiexec /i UniFi-Doordeck-Bridge.msi
```

**Silent install (no UI):**
```cmd
REM NSIS (.exe)
UniFi-Doordeck-Bridge-Setup-0.1.0.exe /S

REM MSI
msiexec /i UniFi-Doordeck-Bridge.msi /qn /l*v install.log
```

**Verify installation:**
```cmd
sc query "UniFi-Doordeck-Bridge"
```

Should show: `STATE : 4 RUNNING` (if service auto-started)

---

## 📁 What Gets Installed

**Program Files:**
- `C:\Program Files\UniFi-Doordeck-Bridge\`
  - All application files
  - Node.js dependencies
  - Scripts

**Configuration:**
- `C:\ProgramData\UniFi-Doordeck-Bridge\`
  - config.json
  - logs\

**Start Menu:**
- UniFi-Doordeck Bridge
  - Configure
  - View Logs
  - Start/Stop/Restart Service
  - Service Manager
  - Uninstall

**Windows Service:**
- Name: `UniFi-Doordeck-Bridge`
- Startup: Automatic
- Status: Running

---

## 🔧 Troubleshooting

### Build fails: "makensis not found"

**For NSIS:**
```cmd
set PATH=%PATH%;C:\Program Files (x86)\NSIS
npm run installer:build:win
```

### Build fails: "candle not found"

**For MSI:**
```cmd
setx PATH "%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin"
REM Close and reopen Command Prompt
npm run installer:build:msi
```

### Build fails: "dist folder not found"

```cmd
npm run build
npm run installer:build:win
```

### Installer won't run: "Publisher cannot be verified"

This is normal for unsigned installers. To fix:
1. Right-click installer → Properties
2. Check "Unblock" at bottom
3. Click Apply → OK
4. Run installer again

**Or sign the installer** (requires code signing certificate):
```cmd
signtool sign /f cert.pfx /p password /t http://timestamp.digicert.com installer.exe
```

---

## 📝 npm Scripts Reference

```bash
# Build TypeScript
npm run build

# Prepare for installer build
npm run installer:prepare

# Build NSIS .exe
npm run installer:build:win
npm run installer:build:nsis  # Same as above

# Build MSI
npm run installer:build:msi

# Build both
npm run installer:build:all

# Full release (test + build + package)
npm run release
```

---

## 🎓 Next Steps

After building:

1. ✅ **Test on clean Windows VM** (no Node.js)
2. ✅ **Verify service installs and starts**
3. ✅ **Test with real UniFi controller**
4. ✅ **Test unlock flow end-to-end**
5. ✅ **Sign installer for production** (optional)

---

## 📚 Full Documentation

- **Detailed build guide:** `BUILD-INSTALLER.md`
- **Testing guide:** `TESTING-WINDOWS.md`
- **Installation guide:** `INSTALL.md`
- **Quick start:** `QUICKSTART.md`

---

## 💡 Tips

**Faster builds:**
- Keep `node_modules` installed
- Only rebuild when code changes
- Build on Windows VM (not macOS)

**Smaller installers:**
- Use `npm install --production` before building
- Remove dev dependencies
- Compress with UPX (advanced)

**Professional installers:**
- Add company icon
- Sign with code signing certificate
- Add custom graphics
- Include documentation

**Version management:**
- Version in `package.json` auto-updates installer filename
- Update version: `npm version 0.2.0`
- Rebuild installer to get new version

---

## ⚡ Ultra-Quick Build (Copy-Paste)

```cmd
REM On Windows VM - copy and paste this entire block:

cd path\to\unifi-doordeck-bridge
npm install
npm run build
npm run installer:build:win
dir installer\*.exe

REM Done! Installer is ready in installer\ folder
```

**That's it!** 🎉
