# UniFi-Doordeck Bridge GUI - Quick Start Guide

## Installation

### Prerequisites

- Node.js 20.x or later installed
- Bridge service built and installed
- Windows 10 or Windows 11

### Install GUI Dependencies

```bash
cd gui
npm install
```

## Development

### Run in Development Mode

```bash
# From the gui directory
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron with DevTools
3. Enable hot module replacement

### Expected Behavior

When you run the GUI for the first time:

1. **No Configuration**:
   - App detects no configuration
   - Automatically shows Setup Wizard
   - Redirects to `/setup` route

2. **Existing Configuration**:
   - App loads configuration from `%APPDATA%/unifi-doordeck-bridge-gui/config.json`
   - Shows Dashboard
   - Displays service status and doors

## Setup Wizard Walkthrough

### Step 1: Welcome
- Click "Get Started" to begin setup

### Step 2: Configure UniFi Access

1. Enter your UniFi controller IP address (e.g., `192.168.1.1`)
2. Choose authentication method:
   - **API Key** (Recommended):
     - Enter your UniFi OS API key
   - **Username/Password**:
     - Enter admin username
     - Enter password
3. (Optional) Enter path to CA certificate if using self-signed certs
4. Click "Test Connection"
5. Wait for success message
6. Click "Next"

### Step 3: Configure Doordeck

1. Enter your Doordeck account email
2. Enter your Doordeck account password
3. Click "Test Connection"
4. Wait for success message
5. Click "Next"

### Step 4: Discover Doors

1. App automatically discovers doors from UniFi Access
2. Review discovered doors
3. Select which doors to enable for Doordeck
4. (Optional) Customize Site ID
5. Click "Next"

### Step 5: Complete Setup

1. Review configuration summary
2. Verify all settings are correct
3. Click "Complete Setup & Start Service"
4. Wait for service to start
5. Redirected to Dashboard

## Using the Dashboard

### Service Status

Monitor real-time status of:
- Overall service (running/stopped/error)
- UniFi Access connection
- Doordeck Cloud connection
- Service uptime

### Door Control

For each door:
- View door name and floor
- See monitoring status
- Click "Unlock" to open the door

### System Tray

- Click the system tray icon to show/hide the window
- Right-click for context menu:
  - Show App
  - Service Status
  - Quit

## Troubleshooting

### GUI Won't Start

**Problem**: Application crashes on startup

**Solutions**:
1. Check Node.js version: `node --version` (should be 20+)
2. Reinstall dependencies:
   ```bash
   cd gui
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Check for errors in console

### Cannot Connect to Bridge Service

**Problem**: Dashboard shows "Service not running" or connection errors

**Solutions**:
1. Verify bridge service is running:
   ```bash
   npm run service:status
   ```
2. Start the service if stopped:
   ```bash
   npm run service:start
   ```
3. Check service port (default: 3000)
4. Review bridge service logs

### Setup Wizard: UniFi Test Fails

**Problem**: "Test Connection" fails in Step 2

**Solutions**:
1. Verify UniFi controller IP address
2. Check network connectivity to controller
3. Verify API key or credentials are correct
4. Check SSL certificate:
   - If using self-signed cert, add CA certificate path
   - Verify CA certificate file exists and is readable

### Setup Wizard: Doordeck Test Fails

**Problem**: "Test Connection" fails in Step 3

**Solutions**:
1. Verify Doordeck email and password
2. Check internet connectivity
3. Confirm Doordeck account exists and is active
4. Try logging into Doordeck web portal to verify credentials

### Setup Wizard: No Doors Discovered

**Problem**: Step 4 shows "No doors found"

**Solutions**:
1. Verify UniFi Access controller has doors configured
2. Check controller permissions (API key needs door access)
3. Review UniFi Access logs
4. Click "Retry Discovery"

### Dashboard: Doors Won't Unlock

**Problem**: Clicking "Unlock" fails

**Solutions**:
1. Check service status is "running"
2. Verify UniFi connection is active
3. Check door mapping is correct
4. Review bridge service logs
5. Test unlock via REST API:
   ```bash
   curl -X POST http://localhost:3000/api/doors/{door-id}/unlock
   ```

## Development Tips

### Hot Reload

- **Renderer changes** (React components, CSS):
  - Changes appear instantly
  - No restart needed

- **Main process changes** (main.ts, ipc-handlers.ts):
  - Requires Electron restart
  - Press Ctrl+R or restart dev server

### DevTools

**Renderer Process**:
- DevTools open automatically in dev mode
- Use React DevTools extension for component inspection

**Main Process**:
- Use VS Code debugger
- Or log to console with `console.log()`

### IPC Debugging

Add logging to `src/main/ipc-handlers.ts`:

```typescript
async function handleGetConfig(): Promise<APIResponse<BridgeConfig>> {
  console.log('[IPC] Getting config...');
  try {
    const config = await configManager.getConfig();
    console.log('[IPC] Config loaded:', config);
    return { success: true, data: config };
  } catch (error) {
    console.error('[IPC] Failed to get config:', error);
    return { success: false, error: error.message };
  }
}
```

### Bridge Service Debugging

Test bridge service endpoints directly:

```bash
# Health check
curl http://localhost:3000/api/health

# List doors
curl http://localhost:3000/api/doors

# Unlock door
curl -X POST http://localhost:3000/api/doors/{door-id}/unlock
```

## Building for Production

### Build Application

```bash
npm run build
```

This creates:
- `dist/main/` - Compiled Electron main process
- `dist-renderer/` - Compiled React application

### Test Production Build

```bash
npm start
```

### Create Windows Installer

```bash
npm run package:win
```

This creates installer in `release/` directory.

## Configuration Files

### GUI Configuration

**Location**: `%APPDATA%/unifi-doordeck-bridge-gui/config.json`

**Structure**:
```json
{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "apiKey": "your-api-key"
  },
  "doordeck": {
    "email": "your@email.com",
    "password": "your-password"
  },
  "logging": {
    "level": "info",
    "fileLogging": true
  },
  "security": {
    "apiAuthEnabled": true,
    "logSanitization": true
  },
  "server": {
    "port": 3000,
    "enabled": true
  }
}
```

### Reset Configuration

To start fresh:

1. Stop the GUI
2. Delete config file:
   ```
   del "%APPDATA%\unifi-doordeck-bridge-gui\config.json"
   ```
3. Restart GUI
4. Setup Wizard will appear

## Next Steps

1. **Complete Setup**: Run through the Setup Wizard
2. **Test Door Unlock**: Try unlocking a door from the dashboard
3. **Monitor Status**: Watch the service status in real-time
4. **Review Logs**: Check bridge service logs for any issues

## Getting Help

If you encounter issues:

1. Check this Quick Start Guide
2. Review the main README.md in `gui/` directory
3. Check bridge service logs
4. Review browser DevTools console (F12)
5. Contact support with:
   - Error messages
   - Steps to reproduce
   - Configuration (with sensitive data removed)

## Success Checklist

- [ ] GUI starts successfully
- [ ] Setup Wizard completes without errors
- [ ] Dashboard loads and shows service status
- [ ] UniFi connection shows "Connected"
- [ ] Doordeck connection shows "Connected"
- [ ] Doors are listed on dashboard
- [ ] Door unlock works when clicked
- [ ] System tray icon appears
- [ ] Application minimizes to tray
- [ ] Configuration persists after restart

---

**Note**: This GUI is designed to work with the UniFi-Doordeck Bridge service. Ensure the bridge service is properly installed and configured before using the GUI.
