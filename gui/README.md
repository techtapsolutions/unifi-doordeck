# UniFi-Doordeck Bridge GUI

Native Windows desktop application for configuring and monitoring the UniFi-Doordeck Bridge service.

## Features

### Setup Wizard
- **Welcome Screen**: Introduction and requirements overview
- **UniFi Configuration**: Test and configure UniFi Access controller connection
  - API Key authentication (recommended)
  - Username/password authentication (legacy)
  - Custom CA certificate support
- **Doordeck Configuration**: Test and configure Doordeck Cloud credentials
- **Door Discovery**: Automatically discover and map doors from UniFi Access
- **Configuration Summary**: Review settings before starting the service

### Dashboard
- **Service Status Monitoring**: Real-time status of bridge service and connections
- **Door Management**: View and control all mapped doors
- **Quick Unlock**: One-click door unlock from the dashboard
- **System Tray**: Minimize to tray for background operation
- **Real-time Logs**: View, filter, search, and export service logs
- **Door Mappings**: Manage UniFi-to-Doordeck door mappings

### Auto-Update System
- **Automatic Update Checks**: Checks for updates on startup
- **Background Downloads**: Updates download without interrupting work
- **Release Notes**: View what's new in each version
- **User Control**: Choose when to install updates
- **Delta Updates**: Only downloads changes, not full installer
- **Code Signature Verification**: Ensures updates are authentic

### Security
- **Windows Credential Manager**: Secure credential storage
- **SSL/TLS Enforcement**: Mandatory encryption for all connections
- **Context Isolation**: Electron security best practices
- **API Authentication**: Protected bridge service access

## Technology Stack

- **Electron 32**: Cross-platform desktop framework
- **React 18**: UI framework
- **TypeScript 5**: Type-safe development
- **Vite**: Fast build tool and dev server

## Project Structure

```
gui/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Application entry point
│   │   ├── preload.ts           # Secure IPC bridge
│   │   ├── ipc-handlers.ts      # IPC request handlers
│   │   ├── bridge-client.ts     # Bridge service REST client
│   │   └── config-manager.ts    # Configuration management
│   ├── renderer/                # React application
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Root component
│   │   ├── components/          # React components
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── setup-steps/     # Wizard step components
│   │   └── styles/
│   │       └── main.css         # Application styles
│   └── shared/                  # Shared code
│       ├── types.ts             # TypeScript types
│       └── ipc.ts               # IPC interface definitions
├── assets/                      # Application assets
├── package.json
├── tsconfig.json
├── tsconfig.main.json
└── vite.config.ts
```

## Development

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Windows 10/11 (for Windows-specific features)

### Install Dependencies

```bash
cd gui
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This will:
1. Start Vite dev server for hot reload (port 5173)
2. Launch Electron with DevTools enabled
3. Enable automatic reload on code changes

### Build for Production

```bash
npm run build
```

This creates:
- `dist/main/` - Compiled main process
- `dist-renderer/` - Compiled renderer process

### Package Application

```bash
npm run package:win
```

This creates a distributable Windows installer in `release/`.

## Configuration

The GUI stores its configuration in:
- **Windows**: `%APPDATA%/unifi-doordeck-bridge-gui/config.json`
- **Credentials**: Windows Credential Manager

## IPC Architecture

The GUI uses Electron's IPC (Inter-Process Communication) for secure communication:

1. **Renderer Process** (React UI)
   - Calls `window.bridge.*()` methods
   - Methods defined in `src/shared/ipc.ts`

2. **Preload Script** (`src/main/preload.ts`)
   - Exposes safe IPC API via `contextBridge`
   - No direct Node.js access from renderer

3. **Main Process** (`src/main/ipc-handlers.ts`)
   - Handles IPC requests
   - Communicates with bridge service REST API
   - Manages configuration files

## Bridge Service Communication

The GUI communicates with the bridge service via REST API:

- **Base URL**: `http://localhost:3000`
- **Authentication**: Optional API key via `X-API-Key` header

### Endpoints Used

- `GET /api/health` - Service health check
- `GET /api/doors` - List mapped doors
- `POST /api/doors/discover` - Discover doors from UniFi
- `POST /api/doors/:id/unlock` - Unlock specific door
- `POST /api/test/unifi` - Test UniFi connection
- `POST /api/test/doordeck` - Test Doordeck connection

## User Experience Flow

### First-Time Setup

1. User launches the application
2. App checks for existing configuration
3. If no config found, shows Setup Wizard:
   - Welcome screen with requirements
   - UniFi Access configuration and testing
   - Doordeck Cloud configuration and testing
   - Automatic door discovery and mapping
   - Configuration review and service startup
4. After setup, redirects to Dashboard

### Normal Operation

1. App loads existing configuration
2. Shows Dashboard with:
   - Service status
   - Connection health
   - List of doors
   - Quick unlock buttons
3. Real-time status updates via polling
4. Minimize to system tray for background operation

## Security Considerations

### Electron Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled in renderer
- **Sandbox**: Enabled for renderer process
- **CSP**: Content Security Policy enforced
- **No Remote Module**: Not used

### Credential Storage

- Windows Credential Manager for production
- AES-256-GCM fallback encryption
- No plaintext credentials in configuration files

### Network Security

- HTTPS only for UniFi Access communication
- Mandatory SSL/TLS verification
- Custom CA certificate support

## Troubleshooting

### GUI Won't Start

1. Check bridge service is installed and running
2. Verify Node.js version (20+)
3. Clear app data: `%APPDATA%/unifi-doordeck-bridge-gui`
4. Reinstall dependencies: `npm clean-install`

### Cannot Connect to Bridge Service

1. Verify service is running: `npm run service:status`
2. Check service port (default: 3000)
3. Check firewall settings
4. Review service logs

### Setup Wizard Issues

1. **UniFi Test Fails**:
   - Verify controller IP address
   - Check API key or credentials
   - Ensure network connectivity
   - Verify SSL certificate (use custom CA if needed)

2. **Doordeck Test Fails**:
   - Verify email and password
   - Check internet connectivity
   - Confirm Doordeck account is active

3. **No Doors Discovered**:
   - Ensure UniFi Access has doors configured
   - Verify controller permissions
   - Check controller firmware version

## Building for Distribution

### Quick Start

**Complete 4-Step Process**:

```bash
# 1. Install dependencies
npm install

# 2. Create placeholder icons (first time only)
npm run make-icons

# 3. Build application
npm run build

# 4. Create Windows installer
npm run package:win
```

**Output**: `release/UniFi-Doordeck Bridge-Setup-0.1.0.exe`

### Detailed Guides

📖 **[Complete Build Guide](BUILD_INSTALLER.md)** - Full documentation with:
- Prerequisites and requirements
- Icon creation guidelines
- Build process details
- Installer customization
- Code signing
- Troubleshooting

⚡ **[Quick Reference](BUILD_QUICK_REFERENCE.md)** - One-page cheat sheet

🔄 **[Auto-Update System](AUTO_UPDATE.md)** - Update management guide:
- How auto-updates work
- Publishing updates to GitHub/S3
- Testing update flow
- Release process
- Delta updates
- Troubleshooting updates

### What Gets Created

```bash
npm run package:win
```

Creates both:
- **NSIS Installer**: `UniFi-Doordeck Bridge-Setup-0.1.0.exe` (recommended)
  - Guided installation wizard
  - Desktop and Start Menu shortcuts
  - Uninstaller included
- **Portable App**: `UniFi-Doordeck Bridge-Portable-0.1.0.exe`
  - No installation needed
  - Run from any location

Output location: `release/`

### Installer Features

- One-click or custom installation
- Desktop shortcut
- Start menu integration
- Professional installer graphics
- License agreement display
- Uninstaller
- Auto-update support (when configured)

### Before Building for Production

⚠️ **Important Production Steps**

#### 1. Professional Icons

The application includes professional icons by default. To regenerate:

```bash
npm run make-icons
```

Generated files:
- `icon.svg` (512x512) - Main application icon with two-door bridge design
- `icon-256.svg` (256x256) - Medium size variant
- `icon-512.svg` (512x512) - Large size variant
- `tray-icon.svg` (32x32) - System tray icon
- `icon.ico` - Windows icon
- `installer-*.bmp` - Installer graphics

#### 2. Code Signing (Highly Recommended)

Code signing prevents "Unknown Publisher" warnings and builds user trust.

**Quick Setup**:

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Add your certificate details to `.env`:
   ```
   WIN_CSC_LINK=path/to/certificate.pfx
   WIN_CSC_KEY_PASSWORD=your-certificate-password
   ```

3. Build with signing:
   ```bash
   npm run package:win
   ```

**Without Certificate** (Development Only):
```bash
npm run package:win
# Will show warnings but build succeeds
```

📖 **[Complete Code Signing Guide](CODE_SIGNING.md)** - Detailed documentation:
- How to obtain certificates (DigiCert, Sectigo, GlobalSign, SSL.com)
- Cost comparison ($199-$629/year)
- Self-signed certificates for testing
- CI/CD integration (GitHub Actions, Azure Pipelines)
- Troubleshooting and best practices
- SmartScreen reputation building

**Certificate Providers**:
- **DigiCert**: $474/year (Standard), $629/year (EV)
- **Sectigo**: $200/year (Standard), $350/year (EV) - Cost-effective
- **GlobalSign**: $249/year (Standard), $599/year (EV)
- **SSL.com**: $199/year (Standard), $399/year (EV) - Budget-friendly

**Recommendation**: Start with Sectigo Standard ($200/year), upgrade to EV if SmartScreen warnings become an issue.

## Releasing Updates

The application includes an automated update system that allows you to push updates to users without requiring them to download new installers.

### How Auto-Updates Work

1. Users install the application (v0.1.0)
2. You publish a new version (v0.1.1) to GitHub Releases
3. On next launch, users automatically see "Update Available" notification
4. They click "Download Update" → installs → restarts with new version
5. No manual installer distribution needed!

### Publishing a New Version (Automated)

**Simple 3-Step Process**:

```bash
cd gui

# 1. Update version in package.json
# Edit "version": "0.1.2"

# 2. Commit and push changes
git add package.json
git commit -m "Release v0.1.2"
git push origin main

# 3. Create and push tag
git tag v0.1.2
git push origin v0.1.2
```

**GitHub Actions automatically**:
- Builds the Windows installer
- Creates a GitHub Release
- Uploads installer + update files (blockmap, latest.yml)
- Users receive update notifications within 24 hours

### What Users Experience

**When Update is Available**:
1. User opens app (or it's already running)
2. Banner appears: "Checking for updates..."
3. After check: "Version 0.1.2 is available" with release notes
4. User clicks "Download Update"
5. Progress bar shows download (fast with delta updates)
6. Dialog: "Update Ready to Install - Restart Now / Later"
7. User clicks "Restart Now"
8. App closes → installs update → reopens with new version

### Update Files

GitHub Actions automatically generates and uploads:
- **Installer** (`UniFi-Doordeck Bridge-Setup-0.1.2.exe`) - Full installer
- **Block Map** (`.exe.blockmap`) - Enables delta updates (only download changes)
- **Metadata** (`latest.yml`) - Version info and checksums

### Current Configuration (Without Code Signing)

**What Works**:
- ✅ Automatic update notifications
- ✅ One-click download and install
- ✅ Delta updates (only downloads changes, not full 79MB)
- ✅ Release notes display

**Known Limitation**:
- ⚠️ Windows SmartScreen shows warning on first run after update
- ⚠️ Users must click "More info" → "Run anyway" (one-time per update)
- ⚠️ Shows "Unknown Publisher"

**To Remove Warnings** (When Budget Allows):
1. Purchase code signing certificate ($200-400/year)
2. Add certificate to GitHub Secrets
3. Update `verifyUpdateCodeSignature: true` in package.json
4. Rebuild → no more security warnings!

### Monitoring Updates

**Check Update Status**:
- Go to: https://github.com/techtapsolutions/unifi-doordeck/releases
- View all published versions
- See download statistics
- Monitor adoption rate

**GitHub Actions**:
- Go to: https://github.com/techtapsolutions/unifi-doordeck/actions
- View build logs
- Troubleshoot build issues
- Verify successful releases

### Release Best Practices

**Version Numbering** (Semantic Versioning):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes only

**Release Notes**:
GitHub Actions automatically extracts release notes from:
- Git commit messages between versions
- Add notes manually in GitHub Release UI for better user experience

**Testing Before Release**:
1. Build and test locally first
2. Verify all features work
3. Test update process from previous version
4. Only then push tag to trigger automated release

### Troubleshooting Updates

**Update Check Fails**:
- Verify GitHub repository is public (or user has access if private)
- Check internet connectivity
- Review error in app logs

**Update Download Fails**:
- Check GitHub Releases has all 3 required files
- Verify file permissions/access
- Check firewall settings

**Build Fails in GitHub Actions**:
- Review build logs in GitHub Actions tab
- Verify package.json syntax is valid
- Check all dependencies are in package.json
- Ensure tag format is correct (v0.1.1, not 0.1.1)

## Development Tips

### Hot Reload

Vite provides hot module replacement (HMR) for the renderer process. Changes to React components update instantly without restarting Electron.

Main process changes require restarting Electron (Ctrl+R or restart dev server).

### Debugging

**Renderer Process**:
- DevTools automatically open in development mode
- Use React DevTools browser extension

**Main Process**:
- Use VS Code debugger
- Or attach to Electron process

**IPC Communication**:
- Add logging to `ipc-handlers.ts`
- Monitor network tab for bridge API calls

### Adding New Features

1. **Add IPC Channel** to `src/shared/types.ts` (`IPCChannel` enum)
2. **Define API** in `src/shared/ipc.ts` (`BridgeAPI` interface)
3. **Implement Handler** in `src/main/ipc-handlers.ts`
4. **Expose in Preload** (`src/main/preload.ts`)
5. **Use in Components** via `window.bridge.*`

## License

MIT

## Support

For issues and feature requests, please contact support or file an issue in the project repository.
