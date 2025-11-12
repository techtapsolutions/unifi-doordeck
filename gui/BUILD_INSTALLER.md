# Building the Windows Installer

Complete guide for building the UniFi-Doordeck Bridge Windows installer.

## Prerequisites

### Required Software

1. **Node.js 20.x or later**
   - Download from https://nodejs.org/
   - Verify: `node --version`

2. **Windows 10/11**
   - Required for building Windows installers
   - Administrator access may be needed

3. **Git** (optional but recommended)
   - For version control
   - Download from https://git-scm.com/

### Required Files

Before building, ensure these files exist:

- [ ] Bridge service built (`../dist-service/`)
- [ ] LICENSE file (`../LICENSE`)
- [ ] Configuration example (`../config.example.json`)
- [ ] GUI source code (`gui/src/`)
- [ ] Application icons (see Icon Requirements below)

## Quick Start

### 1. Install Dependencies

```bash
cd gui
npm install
```

### 2. Create Placeholder Icons

```bash
npm run make-icons
```

This creates basic placeholder icons in `assets/` directory:
- `icon.ico` - Main application icon
- `icon.svg` - Scalable application icon
- `installer-header.bmp` - Installer header image (150x57)
- `installer-sidebar.bmp` - Installer sidebar image (164x314)
- `tray-icon.svg` - System tray icon

**⚠️ IMPORTANT**: Replace placeholder icons with professional designs before production release!

### 3. Build the Application

```bash
npm run build
```

This compiles:
- Main process (Electron) → `dist/main/`
- Renderer process (React) → `dist-renderer/`

### 4. Create Windows Installer

```bash
npm run package:win
```

This creates both:
- **NSIS Installer**: `release/UniFi-Doordeck Bridge-Setup-0.1.0.exe`
- **Portable App**: `release/UniFi-Doordeck Bridge-Portable-0.1.0.exe`

## Build Process Details

### What Gets Included

The installer packages:

1. **GUI Application**
   - Electron main process (`dist/main/`)
   - React UI (`dist-renderer/`)
   - Node.js runtime (bundled by Electron)
   - npm dependencies

2. **Bridge Service** (optional)
   - Service files from `../dist-service/`
   - Packaged as extra resources in `resources/service/`

3. **Configuration**
   - Example configuration file
   - Default settings

4. **Assets**
   - Application icons
   - Installer graphics

### Build Scripts Explained

```bash
# Clean build artifacts
npm run clean

# Build renderer (React + Vite)
npm run build:renderer

# Build main process (Electron + TypeScript)
npm run build:main

# Complete build (renderer + main + assets)
npm run build

# Package as Windows installer
npm run package:win

# Package as NSIS installer only
npm run package:win:nsis

# Package as portable app only
npm run package:win:portable

# Full build + package in one command
npm run package
```

### Build Configuration

Located in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.techtap.unifi-doordeck-bridge",
    "productName": "UniFi-Doordeck Bridge",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

## Icon Requirements

### Main Application Icon (icon.ico)

**Required Sizes**:
- 16x16 pixels
- 32x32 pixels
- 48x48 pixels
- 256x256 pixels

**Format**: ICO (Windows Icon)

**Recommendations**:
- Use vector graphics for scalability
- Include alpha transparency
- Test at all sizes
- Keep design simple and recognizable

### Installer Graphics

**Header Image** (`installer-header.bmp`):
- Size: 150x57 pixels
- Format: BMP (24-bit)
- Content: Company logo or product name
- Background: Solid color or subtle gradient

**Sidebar Image** (`installer-sidebar.bmp`):
- Size: 164x314 pixels
- Format: BMP (24-bit)
- Content: Product branding, logo, or themed graphic
- Colors: Match brand guidelines

### System Tray Icon (tray-icon.png)

- Size: 16x16 or 32x32 pixels
- Format: PNG with transparency
- Design: Simplified version of main icon
- Must be visible on light and dark backgrounds

### Creating Professional Icons

#### Tools

**Free Tools**:
- **Inkscape**: Vector graphics editor (recommended)
- **GIMP**: Raster graphics editor
- **Paint.NET**: Windows image editor

**Online Tools**:
- **Convertio**: https://convertio.co/png-ico/
- **ICO Convert**: https://icoconvert.com/
- **RealFaviconGenerator**: https://realfavicongenerator.net/

**Paid Tools**:
- **Adobe Illustrator**: Professional vector graphics
- **Adobe Photoshop**: Professional raster graphics
- **Figma**: Collaborative design tool

#### Design Guidelines

1. **Keep It Simple**
   - Clear, recognizable shape
   - Minimal details
   - Works at small sizes

2. **Use Brand Colors**
   - Match company branding
   - Ensure contrast
   - Test on different backgrounds

3. **Test All Sizes**
   - View at 16x16, 32x32, 48x48, 256x256
   - Ensure legibility at each size
   - Adjust details for small sizes if needed

4. **Use Vector Source**
   - Start with SVG or AI file
   - Export to required formats
   - Maintain source for future updates

#### Example Workflow

1. **Design in Inkscape** (SVG format)
2. **Export as PNG** (512x512 for highest quality)
3. **Convert to ICO** using online tool or GIMP
4. **Test in Windows** - View icon in File Explorer
5. **Adjust if needed** - Refine design

## Installer Customization

### NSIS Installer Options

Edit `package.json` → `build` → `nsis`:

```json
{
  "nsis": {
    "oneClick": false,              // Allow installation directory choice
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,          // Request admin privileges if needed
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "UniFi-Doordeck Bridge",
    "runAfterFinish": true,          // Launch app after install
    "menuCategory": true,            // Create program group
    "license": "../LICENSE"          // Show license during install
  }
}
```

### Installer Branding

Customize these files:
- `assets/installer-header.bmp` - Top banner (150x57)
- `assets/installer-sidebar.bmp` - Left sidebar (164x314)
- `LICENSE` - License agreement text

### Package Metadata

Edit `package.json`:

```json
{
  "name": "unifi-doordeck-bridge-gui",
  "version": "0.1.0",
  "description": "Native Windows GUI for UniFi-Doordeck Bridge",
  "author": "Your Company Name",
  "license": "MIT",
  "build": {
    "copyright": "Copyright © 2025 Your Company"
  }
}
```

## Testing the Installer

### Before Release

1. **Test on Clean Machine**
   - Use a VM or clean Windows install
   - No development tools installed
   - Test the actual user experience

2. **Installation Test**
   - Run installer
   - Choose custom installation directory
   - Verify shortcuts created
   - Check Start Menu entry

3. **Application Test**
   - Launch application
   - Complete setup wizard
   - Test door unlock functionality
   - Verify service connection

4. **Uninstallation Test**
   - Use Windows Settings → Apps
   - Verify clean uninstall
   - Check for leftover files
   - Verify shortcuts removed

### Common Issues

**Issue**: "Cannot find module 'electron'"
**Solution**: Run `npm install` in gui directory

**Issue**: "Icon file not found"
**Solution**: Run `npm run make-icons` to create placeholders

**Issue**: "Build failed - TypeScript errors"
**Solution**: Run `npm run build:main` to see detailed errors

**Issue**: "Cannot copy ../dist-service"
**Solution**: Build bridge service first: `cd .. && npm run build:service`

**Issue**: "electron-builder not found"
**Solution**: Install dev dependencies: `npm install --save-dev electron-builder`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Installer

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        run: |
          cd gui
          npm ci

      - name: Build Application
        run: |
          cd gui
          npm run build

      - name: Package Installer
        run: |
          cd gui
          npm run package:win

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: installer
          path: gui/release/*.exe
```

## Advanced Configuration

### Code Signing

For production releases, sign your installer:

1. **Obtain Code Signing Certificate**
   - Purchase from trusted CA (DigiCert, Sectigo, etc.)
   - Or use self-signed for internal distribution

2. **Configure electron-builder**

```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

3. **Use Environment Variables** (recommended)

```bash
# Set before building
set CSC_LINK=path\to\cert.pfx
set CSC_KEY_PASSWORD=your_password
npm run package:win
```

### Auto-Updates

Enable automatic updates with electron-updater:

1. **Install Package**

```bash
npm install electron-updater
```

2. **Configure Update Server**

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  }
}
```

3. **Add Update Logic** in `src/main/main.ts`

```typescript
import { autoUpdater } from 'electron-updater';

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Multi-Architecture Builds

Build for both x64 and ARM64:

```json
{
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64", "arm64"] }
    ]
  }
}
```

## Troubleshooting

### Build Errors

**Problem**: TypeScript compilation errors
**Solution**:
```bash
cd gui
npm run build:main
# Fix any TypeScript errors shown
```

**Problem**: Vite build errors
**Solution**:
```bash
cd gui
npm run build:renderer
# Check for React/TypeScript issues
```

**Problem**: electron-builder fails
**Solution**:
```bash
# Enable verbose logging
set DEBUG=electron-builder
npm run package:win
```

### Installer Issues

**Problem**: Installer won't run
**Solution**: Check Windows Defender / antivirus settings

**Problem**: "App won't install"
**Solution**: Run installer as Administrator

**Problem**: Missing DLLs
**Solution**: Ensure all dependencies are in package.json

### Icon Issues

**Problem**: Icon doesn't appear
**Solution**: Clear icon cache
```bash
ie4uinit.exe -show
```

**Problem**: Blurry icon
**Solution**: Include all required sizes in ICO file (16, 32, 48, 256)

## Checklist

### Pre-Build Checklist

- [ ] All TypeScript code compiles without errors
- [ ] React components render correctly in dev mode
- [ ] Bridge service is built (`../dist-service/`)
- [ ] Icons are created (or placeholders exist)
- [ ] LICENSE file exists
- [ ] package.json version is updated
- [ ] README.md is up to date

### Build Checklist

- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] All assets copied
- [ ] `dist/` and `dist-renderer/` directories populated

### Package Checklist

- [ ] `npm run package:win` succeeds
- [ ] Installer file created in `release/`
- [ ] Installer size is reasonable (< 200MB typical)
- [ ] Portable app created (optional)

### Testing Checklist

- [ ] Installer runs on clean Windows machine
- [ ] Desktop shortcut created
- [ ] Start Menu entry created
- [ ] Application launches successfully
- [ ] Setup wizard appears (first run)
- [ ] Can connect to bridge service
- [ ] All features work as expected
- [ ] Uninstaller works correctly

### Release Checklist

- [ ] Version number updated in package.json
- [ ] CHANGELOG updated
- [ ] Release notes prepared
- [ ] Code signed (for production)
- [ ] Tested on Windows 10 and 11
- [ ] Documentation updated
- [ ] Installer uploaded to release location

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review electron-builder docs: https://www.electron.build/
3. Check build logs in `release/` directory
4. Enable debug logging: `set DEBUG=electron-builder`
5. Search GitHub issues: https://github.com/electron-userland/electron-builder/issues

## Reference

### Useful Commands

```bash
# Development
npm run dev                  # Run in development mode
npm start                    # Run production build

# Building
npm run clean                # Clean build artifacts
npm run build                # Build application
npm run build:main           # Build Electron only
npm run build:renderer       # Build React only

# Icons
npm run make-icons           # Create placeholder icons

# Packaging
npm run package              # Build + package
npm run package:win          # Package for Windows
npm run package:win:nsis     # NSIS installer only
npm run package:win:portable # Portable app only

# Maintenance
npm run lint                 # Check code quality
npm run format               # Format code
```

### File Locations

```
gui/
├── assets/                  # Icons and images
│   ├── icon.ico            # Main application icon
│   ├── installer-header.bmp
│   └── installer-sidebar.bmp
├── dist/                    # Compiled Electron main
├── dist-renderer/           # Compiled React UI
├── release/                 # Generated installers
│   ├── UniFi-Doordeck Bridge-Setup-0.1.0.exe
│   └── UniFi-Doordeck Bridge-Portable-0.1.0.exe
├── scripts/                 # Build scripts
├── src/                     # Source code
└── package.json             # Build configuration
```

### Resources

- **electron-builder docs**: https://www.electron.build/
- **NSIS documentation**: https://nsis.sourceforge.io/
- **Electron documentation**: https://www.electronjs.org/docs
- **Windows icon guidelines**: https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
