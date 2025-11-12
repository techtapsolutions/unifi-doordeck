# Windows Installer - Quick Reference

## TL;DR - Build Installer in 4 Steps

```bash
# 1. Install dependencies
cd gui
npm install

# 2. Create placeholder icons
npm run make-icons

# 3. Build application
npm run build

# 4. Package installer
npm run package:win
```

**Output**: `release/UniFi-Doordeck Bridge-Setup-0.1.0.exe`

---

## Common Commands

### Development
```bash
npm run dev              # Hot reload dev mode
npm start                # Run production build
```

### Building
```bash
npm run clean            # Clean build artifacts
npm run build            # Build everything
npm run build:main       # Build Electron only
npm run build:renderer   # Build React only
```

### Icons
```bash
npm run make-icons       # Create placeholder icons
```

### Packaging
```bash
npm run package          # Build + create installer
npm run package:win      # Windows installer (NSIS + Portable)
npm run package:win:nsis # NSIS installer only
npm run package:win:portable # Portable app only
```

---

## Prerequisites

✅ Node.js 20.x or later
✅ Windows 10/11
✅ Bridge service built (`../dist-service/`)

---

## File Locations

```
gui/
├── release/               # ← Installers appear here
│   ├── UniFi-Doordeck Bridge-Setup-0.1.0.exe
│   └── UniFi-Doordeck Bridge-Portable-0.1.0.exe
├── dist/                  # Compiled Electron
├── dist-renderer/         # Compiled React
└── assets/                # Icons
```

---

## Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run build:main

# Check React errors
npm run build:renderer

# Enable debug logging
set DEBUG=electron-builder
npm run package:win
```

### Missing Icons
```bash
npm run make-icons
```

### electron-builder Not Found
```bash
npm install
```

### Cannot Find Bridge Service
```bash
cd ..
npm run build:service
cd gui
npm run package:win
```

---

## Icon Requirements

**Main Icon** (`assets/icon.ico`):
- Sizes: 16x16, 32x32, 48x48, 256x256
- Format: ICO

**Installer Graphics**:
- Header: `assets/installer-header.bmp` (150x57)
- Sidebar: `assets/installer-sidebar.bmp` (164x314)
- Format: BMP (24-bit)

**Create Professional Icons**:
- Use Inkscape (free) or Adobe Illustrator
- Convert to ICO: https://convertio.co/png-ico/
- Test at all sizes

---

## Testing Checklist

On a clean Windows machine:

- [ ] Run installer
- [ ] Verify desktop shortcut created
- [ ] Launch application
- [ ] Complete setup wizard
- [ ] Test door unlock
- [ ] Uninstall cleanly

---

## Customization

Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "com.yourcompany.app",
    "productName": "Your App Name",
    "copyright": "Copyright © 2025 Your Company",
    "nsis": {
      "createDesktopShortcut": true,
      "runAfterFinish": true
    }
  }
}
```

---

## Release Process

1. **Update Version**
   ```bash
   # In package.json, update "version": "0.1.0" → "0.2.0"
   ```

2. **Build & Package**
   ```bash
   npm run clean
   npm run package:win
   ```

3. **Test Installer**
   - On clean Windows VM
   - Test all features
   - Verify uninstall

4. **Distribute**
   - Upload to release server
   - Update download links
   - Notify users

---

## Help Resources

📖 **Full Guide**: See `BUILD_INSTALLER.md`
🔧 **electron-builder Docs**: https://www.electron.build/
💬 **Issues**: Check GitHub Issues

---

**Quick Tip**: Replace placeholder icons with professional designs before production release!

**Need Help?** Run `npm run build -- --help` for more options.
