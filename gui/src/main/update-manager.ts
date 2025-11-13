/**
 * Auto-Update Manager
 * Handles application updates using electron-updater
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { log } from './logger';
import { IPCChannel } from '../shared/types';

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  version?: string;
  releaseNotes?: string;
  releaseDate?: string;
  progress?: {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
  };
}

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
  };

  constructor() {
    this.setupAutoUpdater();
    this.registerEventHandlers();
  }

  /**
   * Set the main window for sending events
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Configure auto-updater
   */
  private setupAutoUpdater(): void {
    // Auto-download updates (can be configured)
    autoUpdater.autoDownload = false;

    // Auto-install on app quit
    autoUpdater.autoInstallOnAppQuit = true;

    // Logging
    autoUpdater.logger = {
      info: (message?: any) => log('INFO', `[AutoUpdater] ${message}`),
      warn: (message?: any) => log('WARN', `[AutoUpdater] ${message}`),
      error: (message?: any) => log('ERROR', `[AutoUpdater] ${message}`),
      debug: (message?: any) => log('DEBUG', `[AutoUpdater] ${message}`),
    };

    log('INFO', '[UpdateManager] Auto-updater initialized');
  }

  /**
   * Register event handlers for auto-updater
   */
  private registerEventHandlers(): void {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log('INFO', '[UpdateManager] Checking for updates...');
      this.updateStatus = {
        ...this.updateStatus,
        checking: true,
        error: null,
      };
      this.sendStatusToRenderer();
    });

    // Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log('INFO', `[UpdateManager] Update available: ${info.version}`);
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        available: true,
        version: info.version,
        releaseNotes: this.extractReleaseNotes(info),
        releaseDate: info.releaseDate,
      };
      this.sendStatusToRenderer();
      this.notifyUpdateAvailable(info);
    });

    // Update not available
    autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
      log('INFO', '[UpdateManager] No updates available');
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        available: false,
      };
      this.sendStatusToRenderer();
    });

    // Download progress
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      const percent = Math.round(progress.percent);
      log('DEBUG', `[UpdateManager] Download progress: ${percent}%`);
      this.updateStatus = {
        ...this.updateStatus,
        downloading: true,
        progress: {
          percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond: progress.bytesPerSecond,
        },
      };
      this.sendStatusToRenderer();
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log('INFO', `[UpdateManager] Update downloaded: ${info.version}`);
      this.updateStatus = {
        ...this.updateStatus,
        downloading: false,
        downloaded: true,
        version: info.version,
      };
      this.sendStatusToRenderer();
      this.notifyUpdateDownloaded(info);
    });

    // Error
    autoUpdater.on('error', (error: Error) => {
      log('ERROR', `[UpdateManager] Update error: ${error.message}`);
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        downloading: false,
        error: error.message,
      };
      this.sendStatusToRenderer();
    });
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    try {
      log('INFO', '[UpdateManager] Manual update check requested');
      const result = await autoUpdater.checkForUpdates();

      if (!result) {
        log('WARN', '[UpdateManager] Update check returned null');
        this.updateStatus.error = 'Update check failed';
      }

      return this.updateStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log('ERROR', `[UpdateManager] Failed to check for updates: ${message}`);
      this.updateStatus.error = message;
      return this.updateStatus;
    }
  }

  /**
   * Download update
   */
  async downloadUpdate(): Promise<void> {
    try {
      log('INFO', '[UpdateManager] Starting update download');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log('ERROR', `[UpdateManager] Failed to download update: ${message}`);
      throw new Error(`Failed to download update: ${message}`);
    }
  }

  /**
   * Install update and restart
   */
  quitAndInstall(): void {
    log('INFO', '[UpdateManager] Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return this.updateStatus;
  }

  /**
   * Send status to renderer process
   */
  private sendStatusToRenderer(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IPCChannel.EVENT_UPDATE_STATUS, this.updateStatus);
    }
  }

  /**
   * Extract release notes from update info
   */
  private extractReleaseNotes(info: UpdateInfo): string {
    if (typeof info.releaseNotes === 'string') {
      return info.releaseNotes;
    } else if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes.map((note: any) => note.note || '').join('\n');
    }
    return 'No release notes available';
  }

  /**
   * Notify user that update is available
   */
  private notifyUpdateAvailable(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const releaseNotes = this.extractReleaseNotes(info);

    // Send to renderer for notification UI
    this.mainWindow.webContents.send(IPCChannel.EVENT_UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes,
      releaseDate: info.releaseDate,
    });
  }

  /**
   * Notify user that update has been downloaded
   */
  private notifyUpdateDownloaded(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    // Send to renderer for install prompt
    this.mainWindow.webContents.send(IPCChannel.EVENT_UPDATE_DOWNLOADED, {
      version: info.version,
    });

    // Also show native dialog as backup
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application.\n\nWould you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        this.quitAndInstall();
      }
    });
  }

  /**
   * Check for updates on startup (with delay)
   */
  async checkForUpdatesOnStartup(delayMs: number = 5000): Promise<void> {
    setTimeout(async () => {
      log('INFO', '[UpdateManager] Checking for updates on startup');
      await this.checkForUpdates();
    }, delayMs);
  }
}

// Singleton instance
let updateManagerInstance: UpdateManager | null = null;

/**
 * Get or create update manager instance
 */
export function getUpdateManager(): UpdateManager {
  if (!updateManagerInstance) {
    updateManagerInstance = new UpdateManager();
  }
  return updateManagerInstance;
}
