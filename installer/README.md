# Windows Installer Build Instructions

This directory contains the NSIS installer script for building the UniFi-Doordeck Bridge Windows installer.

## Prerequisites

### Required Software

1. **NSIS (Nullsoft Scriptable Install System)**
   - Version: 3.x or later
   - Download: https://nsis.sourceforge.io/Download
   - Install to default location: `C:\Program Files (x86)\NSIS`

2. **Node.js**
   - Version: 20 LTS or later
   - Required for building the project before packaging

3. **Git** (optional)
   - For version tagging and release automation

### Optional Assets

Create these image assets for a professional installer look (optional):

- `assets/icon.ico` - Application icon (256x256, 48x48, 32x32, 16x16)
- `assets/header.bmp` - Installer header (150x57 pixels)
- `assets/welcome.bmp` - Welcome page banner (164x314 pixels)

If these files don't exist, the installer will still build but without custom branding.

## Building the Installer

### Method 1: Using NPM Script (Recommended)

From the project root directory:

```cmd
npm run installer:build
```

This will:
1. Clean previous builds
2. Build the TypeScript project
3. Run the NSIS compiler
4. Output installer to `installer/dist/`

### Method 2: Manual Build

#### Step 1: Build the Project

```cmd
cd C:\path\to\unifi-doordeck-bridge
npm run build
```

#### Step 2: Compile NSIS Script

```cmd
cd installer
"C:\Program Files (x86)\NSIS\makensis.exe" unifi-doordeck-bridge.nsi
```

The installer will be created as:
```
UniFi-Doordeck-Bridge-Setup-1.0.0.exe
```

## Installer Features

The NSIS installer provides:

### Core Installation
- Copies all application files to `Program Files`
- Creates configuration directory in `ProgramData`
- Installs example configuration file
- Writes uninstaller and registry entries

### Node.js Dependencies
- Runs `npm install --production` automatically
- Handles cases where dependencies are pre-installed
- Shows error if installation fails (with manual recovery instructions)

### Windows Service
- Registers service with Windows Service Manager
- Configures automatic startup
- Creates service with proper permissions
- Handles existing service gracefully

### Start Menu Shortcuts
- **Configure** - Opens config.json in Notepad
- **View Logs** - Opens logs directory
- **Start Service** - Starts the bridge service
- **Stop Service** - Stops the bridge service
- **Restart Service** - Restarts the bridge service
- **Service Manager** - Opens Windows Services console
- **README** - Opens README.md
- **Uninstall** - Launches uninstaller

### Documentation
- Installs all markdown documentation
- Available in `docs/` subdirectory

## Installer Configuration

### Version Number

Update version in `unifi-doordeck-bridge.nsi`:

```nsis
!define PRODUCT_VERSION "1.0.0"
```

Also update in:
- `package.json` - `"version": "1.0.0"`
- `VIProductVersion` directive

### Company Information

Update publisher information:

```nsis
!define PRODUCT_PUBLISHER "Your Company Name"
!define PRODUCT_WEB_SITE "https://github.com/your-org/unifi-doordeck-bridge"
```

### Installation Paths

Defaults:
- **Program Files**: `C:\Program Files\UniFi-Doordeck-Bridge`
- **Configuration**: `C:\ProgramData\UniFi-Doordeck-Bridge`
- **Logs**: `C:\ProgramData\UniFi-Doordeck-Bridge\logs`

## Testing the Installer

### Test Installation

1. Run installer as Administrator
2. Follow installation wizard
3. Verify all components installed:
   ```cmd
   dir "C:\Program Files\UniFi-Doordeck-Bridge"
   dir "C:\ProgramData\UniFi-Doordeck-Bridge"
   ```

4. Check service registration:
   ```cmd
   sc query "UniFi-Doordeck-Bridge"
   ```

5. Verify Start Menu shortcuts:
   - Press Win key
   - Search for "UniFi-Doordeck Bridge"
   - Verify all shortcuts present

### Test Uninstallation

1. Run uninstaller from:
   - Control Panel → Programs → Uninstall a program
   - Or: Start Menu → UniFi-Doordeck Bridge → Uninstall

2. Choose whether to remove config/logs

3. Verify complete removal:
   ```cmd
   dir "C:\Program Files\UniFi-Doordeck-Bridge"
   dir "C:\ProgramData\UniFi-Doordeck-Bridge"
   sc query "UniFi-Doordeck-Bridge"
   ```

## Troubleshooting

### Error: NSIS Not Found

**Solution:**
- Install NSIS from https://nsis.sourceforge.io/Download
- Add to PATH: `C:\Program Files (x86)\NSIS`
- Restart terminal

### Error: npm install Failed During Installation

**Cause:** Network issues or missing Node.js

**Solutions:**
1. Ensure Node.js is installed
2. Check internet connection
3. Install dependencies manually after installation:
   ```cmd
   cd "C:\Program Files\UniFi-Doordeck-Bridge"
   npm install --production
   ```

### Error: Service Installation Failed

**Cause:** Insufficient permissions

**Solutions:**
1. Run installer as Administrator
2. Install service manually:
   ```cmd
   cd "C:\Program Files\UniFi-Doordeck-Bridge"
   node scripts\install-service.js
   ```

### Warning: Missing Assets

**Effect:** Installer builds without custom branding

**Solution:**
Create optional asset files or ignore warning if branding not needed.

## Advanced Customization

### Adding Custom Pages

Add custom installer pages in the NSIS script:

```nsis
; Custom configuration page
Page custom ConfigPage ConfigPageLeave

Function ConfigPage
  ; Your custom page content
FunctionEnd
```

### Bundling Node.js Runtime

To bundle Node.js with the installer:

1. Download Node.js portable version
2. Add to installer script:
   ```nsis
   Section "Node.js Runtime" SecNodeJS
     SetOutPath "$INSTDIR\nodejs"
     File /r "vendor\nodejs\*.*"

     ; Add to PATH
     EnVar::SetHKLM
     EnVar::AddValue "PATH" "$INSTDIR\nodejs"
   SectionEnd
   ```

### Code Signing

For production releases, sign the installer:

```cmd
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com UniFi-Doordeck-Bridge-Setup-1.0.0.exe
```

## Release Checklist

Before releasing:

- [ ] Update version number in all files
- [ ] Build and test installer on clean Windows system
- [ ] Test installation with limited user account
- [ ] Test uninstallation (with and without removing config)
- [ ] Verify service starts automatically
- [ ] Test upgrade installation (over previous version)
- [ ] Check installer file size (should be < 50MB)
- [ ] Sign installer with code signing certificate
- [ ] Create release notes
- [ ] Upload to GitHub releases
- [ ] Update documentation with download link

## File Structure

```
installer/
├── README.md                          # This file
├── unifi-doordeck-bridge.nsi          # NSIS installer script
├── assets/                            # Optional branding assets
│   ├── icon.ico                       # Application icon
│   ├── header.bmp                     # Header image
│   └── welcome.bmp                    # Welcome banner
├── LICENSE.txt                        # License file (copy from root)
└── dist/                              # Build output (created by script)
    └── UniFi-Doordeck-Bridge-Setup-1.0.0.exe
```

## Support

For installer issues:
- **NSIS Documentation**: https://nsis.sourceforge.io/Docs/
- **NSIS Forum**: https://forums.winamp.com/forum/47-nsis-discussion/
- **Project Issues**: https://github.com/your-org/unifi-doordeck-bridge/issues
