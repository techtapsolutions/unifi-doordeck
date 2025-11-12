import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { ConfigManager } from './config-manager';
import { ServiceManager } from './service-manager';
import { TrayManager } from './tray-manager';
import { IPCHandler } from './ipc-handler';
import { IPC_CHANNELS } from '../shared/types';

class Application {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private configManager: ConfigManager;
  private serviceManager: ServiceManager;
  private trayManager: TrayManager;
  private ipcHandler: IPCHandler;
  private isQuitting = false;

  constructor() {
    this.configManager = new ConfigManager();
    this.serviceManager = new ServiceManager(this.configManager);
    this.trayManager = new TrayManager(this.configManager, this.serviceManager);
    this.ipcHandler = new IPCHandler(
      this.configManager,
      this.serviceManager,
      this.trayManager
    );

    this.initialize();
  }

  private initialize(): void {
    // Handle single instance lock
    const gotLock = app.requestSingleInstanceLock();
    if (!gotLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      this.createWindow();
      this.setupTray();
      this.setupIPC();
      this.setupEventListeners();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        if (!this.configManager.getConfig().minimizeToTray) {
          app.quit();
        }
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  private createWindow(): void {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: Math.min(1024, width),
      height: Math.min(768, height),
      minWidth: 800,
      minHeight: 600,
      show: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      frame: true,
      title: 'Doordeck Bridge',
      icon: path.join(__dirname, '../../assets/icon.ico'),
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3001');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();

      // Show setup wizard if first run
      if (this.configManager.getConfig().firstRun) {
        this.mainWindow?.webContents.send('show-setup-wizard');
      }
    });

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && this.configManager.getConfig().minimizeToTray) {
        event.preventDefault();
        this.mainWindow?.hide();

        if (process.platform === 'win32') {
          this.trayManager.showNotification(
            'Doordeck Bridge',
            'Application minimized to tray. Right-click the tray icon to exit.'
          );
        }
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupTray(): void {
    this.tray = this.trayManager.createTray(
      () => this.showWindow(),
      () => this.quit()
    );
  }

  private setupIPC(): void {
    this.ipcHandler.registerHandlers();

    // Window-specific handlers
    ipcMain.handle(IPC_CHANNELS.MINIMIZE_TO_TRAY, () => {
      this.mainWindow?.hide();
      return { success: true };
    });

    ipcMain.handle(IPC_CHANNELS.SHOW_WINDOW, () => {
      this.showWindow();
      return { success: true };
    });
  }

  private setupEventListeners(): void {
    // Forward service events to renderer
    this.serviceManager.on('status-change', (status) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.SERVICE_STATUS_CHANGE, status);
      this.trayManager.updateTrayIcon(status.isRunning);
    });

    this.serviceManager.on('statistics-update', (stats) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.STATISTICS_UPDATE, stats);
    });

    this.serviceManager.on('log-entry', (logEntry) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.LOG_ENTRY, logEntry);
    });

    this.serviceManager.on('connection-status-change', (status) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS_CHANGE, status);
    });
  }

  private showWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    } else {
      this.createWindow();
    }
  }

  private quit(): void {
    this.isQuitting = true;
    app.quit();
  }
}

// Start the application
new Application();
