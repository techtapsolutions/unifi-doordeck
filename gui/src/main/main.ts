/**
 * Electron Main Process
 * Entry point for the Electron application
 */

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { setupIPC } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Create the main application window
 */
function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'UniFi-Doordeck Bridge',
    icon: path.join(__dirname, '../../assets/icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // Disabled for desktop app - allows normal require() in preload
    },
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDevelopment) {
    window.loadURL('http://localhost:5173');
    window.webContents.openDevTools();
  } else {
    window.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  // Show window when ready
  window.once('ready-to-show', () => {
    window.show();
  });

  // Handle window close - minimize to tray instead
  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
      return false;
    }
    return true;
  });

  return window;
}

/**
 * Create system tray icon
 */
function createTray(): Tray {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.svg');
  const icon = nativeImage.createFromPath(iconPath);
  const iconTray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Service Status',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  iconTray.setToolTip('UniFi-Doordeck Bridge');
  iconTray.setContextMenu(contextMenu);

  iconTray.on('click', () => {
    mainWindow?.show();
  });

  return iconTray;
}

/**
 * App ready handler
 */
app.whenReady().then(() => {
  // Create main window
  mainWindow = createMainWindow();

  // Create system tray
  createTray();

  // Setup IPC handlers (this also initializes the update manager with the main window)
  setupIPC(ipcMain, mainWindow);

  // Check for updates on startup (after 5 seconds delay)
  // Note: The update manager is already initialized with the main window in setupIPC
  const { getUpdateManager } = require('./update-manager');
  const updateManager = getUpdateManager();
  updateManager.checkForUpdatesOnStartup(5000);

  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

/**
 * Quit when all windows closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Before quit handler
 */
app.on('before-quit', () => {
  isQuitting = true;
});

/**
 * Cleanup on exit
 */
app.on('will-quit', () => {
  // Cleanup IPC handlers
  ipcMain.removeAllListeners();
});
