# Quick Start Guide

Get the Doordeck Bridge UI up and running in 5 minutes.

## Installation

```bash
cd electron-ui
npm install
```

## Development

### Start the Application

```bash
# Terminal 1: Build and watch
npm run dev

# Terminal 2: Start Electron (wait for compilation)
npm start
```

### Access the Application
- The Electron window will open automatically
- Setup wizard appears on first run
- DevTools open automatically in development mode

## First Run Setup

### 1. Welcome Screen
Click "Get Started"

### 2. UniFi Access Configuration
- **Host**: `https://your-unifi-controller:12445`
- **Username**: Your UniFi Access username
- **Password**: Your UniFi Access password
- **SSL**: Uncheck if using self-signed certificate
- Click "Test Connection" → Should show success
- Click "Next"

### 3. Doordeck Configuration
- **API URL**: `https://api.doordeck.com` (default)
- **Auth Token**: Your Doordeck auth token OR
- **Client ID/Secret**: OAuth credentials
- Click "Test Connection" → Should show success
- Click "Next"

### 4. Door Mapping
- Wait for door discovery
- Map each UniFi door to a Doordeck door
- Toggle mappings on/off as needed
- Click "Next"

### 5. Service Installation
- Enter bridge service executable path
- Click "Install Service"
- Click "Next"

### 6. Complete
- Review quick start guide
- Click "Go to Dashboard"

## Using the Dashboard

### Overview Tab
- **Service Controls**: Start/Stop/Restart the bridge service
- **Statistics**: View unlock events and success rates
- **Connection Status**: Monitor API connectivity

### Configuration Tab
- **UniFi**: Update UniFi Access settings
- **Doordeck**: Update Doordeck API settings
- **Doors**: Manage door mappings
- **Logging**: Configure log levels and file logging

### Logs Tab
- View real-time logs
- Filter by log level
- Search for specific events
- Clear logs

## Common Tasks

### Start the Service
1. Go to Overview tab
2. Click "Start Service"
3. Wait for status to change to "Running"

### Stop the Service
1. Go to Overview tab
2. Click "Stop Service"
3. Wait for status to change to "Stopped"

### Add a Door Mapping
1. Go to Configuration tab
2. Click "Doors" sub-tab
3. Click "Add Mapping"
4. Select UniFi door and Doordeck door
5. Enable the mapping
6. Restart service

### View Logs
1. Go to Logs tab
2. Select log level filter
3. Use search box to find specific entries
4. Click "Clear Logs" to reset

### Minimize to Tray
- Click the minimize button
- Application continues running in system tray
- Right-click tray icon for quick actions
- Double-click tray icon to restore

## Building for Production

### Create Installer

```bash
npm run package
```

Output: `release/Doordeck Bridge Setup 1.0.0.exe`

### Test Without Installing

```bash
npm run package:dir
cd release/win-unpacked
"Doordeck Bridge.exe"
```

## Keyboard Shortcuts

- `Ctrl+R` - Refresh dashboard
- `Ctrl+Q` - Quit application
- `Ctrl+Shift+I` - Open DevTools (development)
- `F11` - Toggle fullscreen

## Troubleshooting

### Application Won't Start
```bash
# Check for errors
npm start

# Reset configuration
# Delete: %APPDATA%/doordeck-bridge-ui/config.json
```

### Service Won't Install
- Run as Administrator
- Check service path is correct
- Verify bridge.exe exists

### Connection Test Fails
- Check network connectivity
- Verify credentials are correct
- Disable firewall temporarily
- Check SSL certificate settings

### Hot Reload Not Working
```bash
# Restart development server
# Kill all Node processes
taskkill /F /IM node.exe

# Restart
npm run dev
```

## File Locations

### Development
- **Source**: `src/`
- **Build Output**: `dist/`
- **Assets**: `assets/`

### Production
- **Executable**: `%LOCALAPPDATA%/Programs/doordeck-bridge/`
- **Config**: `%APPDATA%/doordeck-bridge-ui/config.json`
- **Logs**: `%APPDATA%/doordeck-bridge-ui/logs/`

## Next Steps

1. **Configure all doors** in the Configuration tab
2. **Test unlock functionality** with a Doordeck door
3. **Monitor statistics** on the Overview tab
4. **Set up logging** for troubleshooting
5. **Enable start with Windows** in settings

## Getting Help

- Check `README.md` for detailed documentation
- Review `SETUP.md` for advanced configuration
- Check console logs in DevTools
- Review Windows Event Viewer for service errors

## Tips

💡 **Minimize to Tray**: Keep the app running in the background

💡 **Test Connection**: Always test connections before saving

💡 **Enable Logging**: Helps troubleshoot issues

💡 **Regular Restarts**: Restart service after config changes

💡 **Monitor Statistics**: Check success rates regularly

That's it! You're now ready to use the Doordeck Bridge UI. 🚀
