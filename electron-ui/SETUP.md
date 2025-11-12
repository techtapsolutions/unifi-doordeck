# Doordeck Bridge UI - Setup Guide

Complete guide for setting up the development environment and building the application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Workflow](#development-workflow)
4. [Building for Production](#building-for-production)
5. [Troubleshooting](#troubleshooting)
6. [Integration with Bridge Service](#integration-with-bridge-service)

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm**: Version 9.x or higher (comes with Node.js)
  - Verify: `npm --version`

- **Git**: For version control
  - Download: https://git-scm.com/
  - Verify: `git --version`

- **Windows 10/11**: Required for Windows service integration
  - Administrator privileges needed for service installation

### Recommended Tools
- **Visual Studio Code**: https://code.visualstudio.com/
- **Windows Terminal**: https://aka.ms/terminal
- **Node Version Manager (nvm)**: https://github.com/coreybutler/nvm-windows

## Installation

### 1. Clone or Navigate to Project

```bash
cd /path/to/DoorDeck/electron-ui
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Electron and Electron Builder
- React and React DOM
- TypeScript and build tools
- Webpack and loaders
- Development dependencies

**Installation time**: ~2-5 minutes depending on internet speed

### 3. Verify Installation

```bash
# Check if all dependencies installed correctly
npm list --depth=0

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Development Workflow

### Starting Development Mode

```bash
# Terminal 1: Start webpack dev servers
npm run dev

# Terminal 2 (after webpack compiles): Start Electron
npm start
```

**What happens:**
1. Webpack compiles main process (TypeScript → JavaScript)
2. Webpack dev server starts for renderer process with hot reload
3. Electron launches and loads from localhost:3001

### Development Features
- **Hot Module Replacement**: Changes to React components reload instantly
- **DevTools**: Automatically open in development mode
- **Source Maps**: Debug TypeScript directly
- **Watch Mode**: Automatic recompilation on file changes

### Making Changes

#### Adding a New Component
```bash
# Create component file
touch src/renderer/components/MyComponent.tsx

# Create corresponding CSS
touch src/renderer/components/MyComponent.css
```

#### Adding a New IPC Channel
1. Add channel constant to `src/shared/types.ts`:
```typescript
export const IPC_CHANNELS = {
  // ... existing channels
  MY_NEW_CHANNEL: 'my:new-channel',
}
```

2. Add handler in `src/main/ipc-handler.ts`:
```typescript
ipcMain.handle(IPC_CHANNELS.MY_NEW_CHANNEL, async () => {
  // Implementation
  return { success: true, data: 'result' };
});
```

3. Use in renderer via hook:
```typescript
const result = await electronAPI.invoke(channels.MY_NEW_CHANNEL);
```

### Debugging

#### Main Process (Node.js)
```bash
# Add breakpoints in VS Code
# Press F5 or use Debug menu
# Attach to Electron main process
```

#### Renderer Process (React)
- Press `Ctrl+Shift+I` to open Chrome DevTools
- Use React DevTools extension
- Console, Network, and Performance tabs available

#### IPC Communication
```typescript
// Add logging in preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: async (channel, ...args) => {
    console.log('[IPC] Invoke:', channel, args);
    const result = await ipcRenderer.invoke(channel, ...args);
    console.log('[IPC] Result:', result);
    return result;
  },
});
```

## Building for Production

### 1. Clean Build

```bash
# Remove previous builds
rm -rf dist/ release/

# Build both main and renderer
npm run build
```

### 2. Package Application

```bash
# Create Windows installer (.exe)
npm run package

# Or create unpacked directory (for testing)
npm run package:dir
```

**Output locations:**
- Installer: `release/Doordeck Bridge Setup 1.0.0.exe`
- Unpacked: `release/win-unpacked/`

### 3. Test Packaged Application

```bash
# Run unpacked version
cd release/win-unpacked
"Doordeck Bridge.exe"
```

### Build Configuration

Edit `package.json` for build customization:

```json
{
  "build": {
    "appId": "com.techtap.doordeck-bridge",
    "productName": "Doordeck Bridge",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "package.json"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Doordeck Bridge",
      "installerIcon": "assets/icon.ico",
      "uninstallerIcon": "assets/icon.ico",
      "installerHeaderIcon": "assets/icon.ico"
    }
  }
}
```

## Integration with Bridge Service

### Connecting to Bridge Service

The UI needs to communicate with the bridge service. Configure the bridge service path:

#### Option 1: Service Installed
If the bridge is installed as a Windows service:

```typescript
// src/main/service-manager.ts
// Uses Windows Service Manager API
// No direct path needed
```

#### Option 2: Development Mode
For development, point to the bridge service executable:

```typescript
// In service-manager.ts, update the path
const BRIDGE_SERVICE_PATH = 'C:/path/to/DoorDeck/dist/service.exe';
```

### Bridge Service Requirements

The bridge service must expose:
1. **Windows Service**: Installable via `sc.exe` or `node-windows`
2. **IPC/Socket**: For real-time communication (WebSocket or named pipes)
3. **Config File**: Readable/writable by the UI

### Expected Bridge Service API

```typescript
// The UI expects these endpoints/methods:
interface BridgeServiceAPI {
  // Service Control
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;

  // Status
  getStatus(): Promise<ServiceStatus>;
  getStatistics(): Promise<Statistics>;

  // Configuration
  testUniFiConnection(config): Promise<TestResult>;
  testDoordeckConnection(config): Promise<TestResult>;

  // Doors
  discoverUniFiDoors(): Promise<UniFiDoor[]>;
  discoverDoordeckDoors(): Promise<DoordeckDoor[]>;

  // Logs
  getLogs(limit?: number): Promise<LogEntry[]>;
  streamLogs(): EventEmitter;
}
```

## Troubleshooting

### Build Issues

#### "Cannot find module '@types/node'"
```bash
npm install --save-dev @types/node
```

#### "Webpack compilation failed"
```bash
# Clear cache and rebuild
rm -rf node_modules/ dist/
npm install
npm run build
```

#### "electron-builder fails"
```bash
# Ensure you're on Windows
# Check administrator privileges
# Update electron-builder
npm install -D electron-builder@latest
```

### Runtime Issues

#### "Application won't start"
```bash
# Check if config is corrupted
# Delete: %APPDATA%/doordeck-bridge-ui/config.json

# Run with logging
set DEBUG=*
npm start
```

#### "Service control doesn't work"
1. Ensure running as Administrator
2. Check Windows Event Viewer for errors
3. Verify service is installed: `sc query DoordeckBridge`

#### "Hot reload not working"
```bash
# Restart dev server
# Check webpack-dev-server is running on port 3001
netstat -ano | findstr :3001
```

### Performance Issues

#### "Application is slow"
```bash
# Build production version for testing
npm run build
npm run package:dir

# Profile in DevTools (Renderer)
# Use Performance tab
# Check for memory leaks
```

#### "High memory usage"
- Check for memory leaks in React components
- Use React DevTools Profiler
- Ensure proper cleanup in `useEffect` hooks

## Advanced Configuration

### Custom Webpack Configuration

#### Main Process
Edit `webpack.main.config.js` for:
- Adding externals
- Configuring loaders
- Optimization settings

#### Renderer Process
Edit `webpack.renderer.config.js` for:
- CSS preprocessing (Sass, Less)
- Asset optimization
- Code splitting

### TypeScript Configuration

Edit `tsconfig.json` for:
- Strict mode settings
- Path aliases
- Lib includes

### Electron Configuration

#### Enable Node Integration (Not Recommended)
```typescript
// In main.ts
webPreferences: {
  nodeIntegration: true, // Not recommended!
  contextIsolation: false,
}
```

#### Custom Protocols
```typescript
// In main.ts
app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    // Handle custom app:// protocol
  });
});
```

## Deployment Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Test on clean Windows installation
- [ ] Verify all IPC channels work
- [ ] Test service installation/uninstallation
- [ ] Check for console errors
- [ ] Test setup wizard flow
- [ ] Verify door mapping functionality
- [ ] Test minimize to tray
- [ ] Check installer runs as admin
- [ ] Verify uninstaller works
- [ ] Test on Windows 10 and 11
- [ ] Create release notes
- [ ] Sign code (optional, for production)

## Additional Resources

- **Electron Documentation**: https://www.electronjs.org/docs
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Webpack Guide**: https://webpack.js.org/guides
- **Node Windows**: https://github.com/coreybutler/node-windows

## Support

For issues or questions:
1. Check existing issues in the repository
2. Review console logs and error messages
3. Contact Tech Tap Solutions support
4. Submit detailed bug reports with:
   - Steps to reproduce
   - Error messages
   - System information
   - Screenshots
