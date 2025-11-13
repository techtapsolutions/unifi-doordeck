# UniFi-Doordeck Bridge GUI - Quick Reference

**Version:** 0.1.0
**Last Updated:** November 12, 2024

---

## 🚀 Quick Start

### First Time Setup
```bash
cd gui
npm install
npm run dev
```

### Build for Windows
```bash
npm run package:win
```

### Output Location
```
gui/release/UniFi-Doordeck Bridge-Setup-0.1.0.exe
gui/release/UniFi-Doordeck Bridge-Portable-0.1.0.exe
```

---

## 📝 Common Commands

| Task | Command |
|------|---------|
| Start development | `npm run dev` |
| Build application | `npm run build` |
| Package Windows installer | `npm run package:win` |
| Clean build folders | `npm run clean` |
| Generate icons | `npm run make-icons` |
| Run linter | `npm run lint` |
| Format code | `npm run format` |

---

## 📁 Key Files to Edit

### Main Process (Electron)
- `src/main/main.ts` - Application entry point
- `src/main/ipc-handlers.ts` - IPC handlers
- `src/main/update-manager.ts` - Auto-update logic

### Renderer (React UI)
- `src/renderer/App.tsx` - Main React app
- `src/renderer/components/Dashboard.tsx` - Dashboard
- `src/renderer/components/SetupWizard.tsx` - Setup wizard
- `src/renderer/styles/main.css` - Styles

### Configuration
- `package.json` - App metadata and build config
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite bundler config

---

## 🔧 Build Configuration

### Change App Version
```json
// package.json
{
  "version": "0.2.0"  // Update this
}
```

### Change App Name
```json
// package.json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Name"
  }
}
```

### Configure Auto-Updates
```json
// package.json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_GITHUB_USERNAME",
        "repo": "YOUR_REPO_NAME"
      }
    ]
  }
}
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### TypeScript Errors
```bash
# Check TypeScript
npx tsc -p tsconfig.main.json --noEmit
```

### Icon Not Showing
```bash
# Regenerate icons
npm run make-icons
```

### Dependencies Out of Date
```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install electron@latest
```

---

## 📊 Project Status

- ✅ Build complete
- ✅ All features implemented
- 🔄 Pending Windows testing
- ⚠️ Unsigned (dev build)

---

## 📂 Important Directories

| Directory | Purpose |
|-----------|---------|
| `src/main/` | Electron main process |
| `src/renderer/` | React frontend |
| `src/service/` | Bridge service |
| `src/shared/` | Shared types |
| `assets/` | Icons and images |
| `release/` | Build output |
| `dist/` | Compiled main process |
| `dist-renderer/` | Compiled renderer |

---

## 🔐 User Configuration

### Location
**Windows:** `%USERPROFILE%\.unifi-doordeck-bridge-gui`

### Files
- `config.json` - App settings
- `door-mappings.json` - Door mappings
- `service-config.json` - Service settings

---

## 🌐 API Endpoints

### UniFi Access
- **Host:** Configurable (e.g., `https://unifi.local`)
- **Auth:** Username/Password
- **Test:** `src/main/connection-testers.ts:testUniFiConnection()`

### Doordeck
- **Host:** `https://api.doordeck.com`
- **Auth:** API Key
- **Test:** `src/main/connection-testers.ts:testDoordeckConnection()`

---

## 🎨 Icon Files

| File | Size | Purpose |
|------|------|---------|
| `icon.svg` | 512x512 | Main app icon |
| `icon-256.svg` | 256x256 | Medium icon |
| `icon-512.svg` | 512x512 | Large icon |
| `icon.ico` | 256x256 | Windows icon |
| `tray-icon.svg` | 32x32 | System tray |

---

## 📋 Testing Checklist

- [ ] Install on Windows
- [ ] Run setup wizard
- [ ] Test UniFi connection
- [ ] Test Doordeck connection
- [ ] Map doors
- [ ] Install service
- [ ] Start service
- [ ] Check dashboard
- [ ] Test updates
- [ ] Verify settings

---

## 🚨 Known Issues

1. **Unsigned App** - Windows security warning (expected)
2. **ASAR Disabled** - Re-enable for production
3. **Deprecated Warnings** - Update APIs in future

---

## 📞 Help

- Full documentation: `PROJECT_STATUS.md`
- Auto-update guide: `AUTO_UPDATE.md`
- General info: `README.md`

---

## 🎯 Next Steps

1. Transfer installer to Windows
2. Test setup wizard
3. Configure UniFi/Doordeck
4. Verify service functionality
5. Test auto-updates
6. Fix bugs
7. Get code signing cert
8. Build signed installer
9. Deploy to production

---

**Quick Tip:** Always run `npm run clean` before packaging for distribution!

---

*Last updated: November 12, 2024*
