# Doordeck Bridge - Electron UI

Professional Windows desktop application for managing the Doordeck-UniFi Access Bridge service.

## Features

### Setup Wizard
- **Welcome Screen**: Introduction to the bridge service and its features
- **UniFi Access Configuration**: Connect to your UniFi Access controller with connection testing
- **Doordeck Configuration**: Configure API credentials with authentication testing
- **Door Mapping**: Discover and map UniFi doors to Doordeck doors
- **Service Installation**: Install the bridge as a Windows service
- **Completion**: Quick start guide and tips

### Main Dashboard
- **Service Controls**: Start, stop, and restart the bridge service
- **Real-time Statistics**: View unlock events, success rates, and performance metrics
- **Connection Status**: Monitor UniFi Access and Doordeck API connectivity
- **Configuration Management**: Update settings for UniFi, Doordeck, doors, and logging
- **Live Log Viewer**: View and filter application logs in real-time

### System Tray Integration
- **Minimize to Tray**: Keep the application running in the background
- **Status Indicators**: Visual indicators for service state (running/stopped/error)
- **Quick Actions**: Start/stop service, view logs, and more from the tray menu
- **Notifications**: Toast notifications for important events

## Architecture

### Main Process (Electron)
- **main.ts**: Application lifecycle and window management
- **config-manager.ts**: Configuration persistence with electron-store
- **service-manager.ts**: Windows service control and monitoring
- **tray-manager.ts**: System tray icon and menu management
- **ipc-handler.ts**: IPC communication handlers

### Renderer Process (React)
- **App.tsx**: Main application component with routing
- **SetupWizard**: Multi-step wizard for first-run configuration
- **Dashboard**: Main application interface with tabs
- **Components**: Reusable UI components (panels, forms, etc.)

### Shared Types
- **types.ts**: TypeScript interfaces shared between main and renderer processes
- **IPC Channels**: Strongly-typed IPC communication

## Project Structure

```
electron-ui/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Application entry point
│   │   ├── preload.ts          # Context isolation bridge
│   │   ├── config-manager.ts   # Configuration management
│   │   ├── service-manager.ts  # Windows service control
│   │   ├── tray-manager.ts     # System tray integration
│   │   └── ipc-handler.ts      # IPC handlers
│   │
│   ├── renderer/               # React application
│   │   ├── components/
│   │   │   ├── SetupWizard/   # Setup wizard components
│   │   │   │   ├── SetupWizard.tsx
│   │   │   │   └── steps/     # Individual wizard steps
│   │   │   │
│   │   │   └── Dashboard/     # Dashboard components
│   │   │       ├── Dashboard.tsx
│   │   │       ├── ServiceControls.tsx
│   │   │       ├── StatisticsPanel.tsx
│   │   │       ├── ConnectionStatusPanel.tsx
│   │   │       └── ConfigurationTabs.tsx
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── useElectronAPI.ts
│   │   │
│   │   ├── styles/            # CSS stylesheets
│   │   │   └── global.css
│   │   │
│   │   ├── App.tsx            # Root component
│   │   ├── index.tsx          # React entry point
│   │   └── index.html         # HTML template
│   │
│   └── shared/                # Shared code
│       └── types.ts           # TypeScript types
│
├── assets/                    # Application assets
│   ├── icon.ico              # Application icon
│   └── icons/                # Tray icons
│
├── webpack.main.config.js    # Webpack config for main process
├── webpack.renderer.config.js # Webpack config for renderer
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Development

### Prerequisites
- Node.js 18+ and npm
- Windows 10/11
- Administrator privileges (for Windows service installation)

### Installation

```bash
cd electron-ui
npm install
```

### Running in Development

```bash
# Start both main and renderer processes in watch mode
npm run dev

# In a separate terminal
npm start
```

### Building for Production

```bash
# Build both main and renderer processes
npm run build

# Package as Windows executable
npm run package
```

### Scripts

- `npm run dev` - Start development servers for main and renderer
- `npm run dev:main` - Build main process in watch mode
- `npm run dev:renderer` - Start webpack dev server for renderer
- `npm start` - Run the Electron application
- `npm run build` - Build for production
- `npm run package` - Create Windows installer (.exe)
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Configuration

### Application Config
Configuration is stored in the user's AppData directory using `electron-store`:

**Location**: `%APPDATA%/doordeck-bridge-ui/config.json`

**Structure**:
```json
{
  "unifi": {
    "host": "https://unifi-access.local:12445",
    "username": "admin",
    "password": "encrypted",
    "verifySSL": false
  },
  "doordeck": {
    "apiUrl": "https://api.doordeck.com",
    "authToken": "encrypted"
  },
  "doorMappings": [
    {
      "unifiDoorId": "...",
      "unifiDoorName": "Front Door",
      "doordeckDoorId": "...",
      "doordeckDoorName": "Front Entrance",
      "enabled": true
    }
  ],
  "logging": {
    "level": "info",
    "enableFileLogging": true,
    "logPath": "C:\\ProgramData\\Doordeck\\logs"
  },
  "firstRun": false,
  "minimizeToTray": true,
  "startWithWindows": false
}
```

### Environment Variables
- `NODE_ENV`: Set to `development` for dev mode, `production` for production

## IPC Communication

### Request-Response Pattern
```typescript
// In renderer
const response = await window.electronAPI.invoke('service:start');
if (response.success) {
  console.log('Service started');
} else {
  console.error(response.error);
}
```

### Event Listening
```typescript
// In renderer
window.electronAPI.on('event:service-status', (status) => {
  console.log('Service status changed:', status);
});
```

### Available IPC Channels

#### Configuration
- `config:get` - Get current configuration
- `config:set` - Update configuration
- `config:reset` - Reset to defaults

#### Service Control
- `service:start` - Start the bridge service
- `service:stop` - Stop the bridge service
- `service:restart` - Restart the bridge service
- `service:install` - Install Windows service
- `service:uninstall` - Uninstall Windows service
- `service:status` - Get service status

#### Connection Testing
- `test:unifi` - Test UniFi Access connection
- `test:doordeck` - Test Doordeck API connection

#### Door Operations
- `doors:discover-unifi` - Discover UniFi doors
- `doors:discover-doordeck` - Discover Doordeck doors
- `doors:sync-mappings` - Sync door mappings

#### Monitoring
- `stats:get` - Get statistics
- `status:connections` - Get connection status

#### Logging
- `logs:get` - Get log entries
- `logs:clear` - Clear logs
- `logs:subscribe` - Subscribe to live logs
- `logs:unsubscribe` - Unsubscribe from logs

## Windows Service Integration

The application integrates with Windows Service Manager to control the bridge service.

### Service Management
```typescript
// Install service
await window.electronAPI.invoke('service:install', 'C:\\path\\to\\bridge.exe');

// Start service
await window.electronAPI.invoke('service:start');

// Check status
const status = await window.electronAPI.invoke('service:status');
```

### Service Status
```typescript
interface ServiceStatus {
  isRunning: boolean;
  isInstalled: boolean;
  pid?: number;
  uptime?: number;
  lastError?: string;
}
```

## Security

### Context Isolation
The application uses Electron's context isolation to separate the renderer process from Node.js:

- **preload.ts**: Exposes only necessary APIs to the renderer
- **No direct Node.js access**: Renderer uses IPC for privileged operations
- **Type-safe communication**: TypeScript ensures correct IPC usage

### Configuration Encryption
Sensitive configuration values (passwords, tokens) are encrypted using `electron-store`'s built-in encryption.

## Styling

### Design System
- **Modern Windows 11 aesthetic**: Fluent Design principles
- **Rounded corners and shadows**: Contemporary UI elements
- **Responsive layout**: Adapts to different window sizes
- **Dark/Light theme support**: Ready for theme switching
- **CSS Variables**: Centralized color and spacing system

### Color Palette
- Primary: `#4F46E5` (Indigo)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)
- Info: `#3B82F6` (Blue)

## Keyboard Shortcuts

- `Ctrl+R` - Refresh dashboard
- `Ctrl+Q` - Quit application
- `Ctrl+,` - Open settings
- `Ctrl+L` - View logs
- `F11` - Toggle fullscreen
- `Ctrl+Shift+I` - Open DevTools (development only)

## Troubleshooting

### Service Won't Start
1. Check that the service is installed: Open Services.msc and look for "Doordeck Bridge"
2. Verify the executable path in service properties
3. Check Windows Event Viewer for error messages
4. Ensure administrator privileges

### Configuration Not Saving
1. Check that the application has write access to AppData
2. Look for errors in the console (DevTools)
3. Try resetting configuration from the UI

### Connection Issues
1. Use the "Test Connection" buttons in the Setup Wizard
2. Verify network connectivity to UniFi Access and Doordeck
3. Check firewall settings
4. Review SSL certificate settings for UniFi Access

### Application Won't Start
1. Check if another instance is already running
2. Delete the config file and restart
3. Run from command line to see error messages
4. Reinstall the application

## Building from Source

### Debug Build
```bash
npm run build
npm run package:dir
```
Output: `release/win-unpacked/`

### Production Build
```bash
npm run package
```
Output: `release/Doordeck Bridge Setup.exe`

### Build Configuration
Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "com.techtap.doordeck-bridge",
    "productName": "Doordeck Bridge",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules: `npm run lint`
- Use functional components with hooks in React
- Add TypeScript types for all IPC communication

### Adding New Features
1. Define types in `src/shared/types.ts`
2. Add IPC handlers in `src/main/ipc-handler.ts`
3. Create React components in `src/renderer/components/`
4. Add corresponding CSS in component directory
5. Update this README

## License

MIT

## Support

For issues and feature requests, please contact Tech Tap Solutions or file an issue in the repository.
