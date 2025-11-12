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

⚠️ **Replace Placeholder Icons**

The default `npm run make-icons` creates basic placeholders. For production:

1. Create professional icons using:
   - Adobe Illustrator / Photoshop
   - Figma (free)
   - Inkscape (free)

2. Required files in `assets/`:
   - `icon.ico` - Main app icon (16, 32, 48, 256px)
   - `installer-header.bmp` - Installer header (150x57)
   - `installer-sidebar.bmp` - Installer sidebar (164x314)
   - `tray-icon.png` - System tray icon (16x16)

3. Icon conversion tools:
   - https://convertio.co/png-ico/
   - https://icoconvert.com/

See **[BUILD_INSTALLER.md](BUILD_INSTALLER.md#icon-requirements)** for detailed icon guidelines.

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
