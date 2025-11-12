import { Tray, Menu, nativeImage, Notification } from 'electron';
import * as path from 'path';
import { ConfigManager } from './config-manager';
import { ServiceManager } from './service-manager';

export class TrayManager {
  private tray: Tray | null = null;
  private configManager: ConfigManager;
  private serviceManager: ServiceManager;

  constructor(configManager: ConfigManager, serviceManager: ServiceManager) {
    this.configManager = configManager;
    this.serviceManager = serviceManager;
  }

  public createTray(onShow: () => void, onQuit: () => void): Tray {
    // Create tray icon
    const iconPath = this.getIconPath('stopped');
    const icon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Doordeck Bridge - Stopped');

    this.updateTrayMenu(onShow, onQuit);

    // Handle double-click on tray icon
    this.tray.on('double-click', () => {
      onShow();
    });

    return this.tray;
  }

  private updateTrayMenu(onShow: () => void, onQuit: () => void): void {
    if (!this.tray) return;

    const status = this.serviceManager.getCurrentStatus();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: status.isRunning ? 'Service Running' : 'Service Stopped',
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: 'Show Dashboard',
        click: onShow,
      },
      {
        type: 'separator',
      },
      {
        label: status.isRunning ? 'Stop Service' : 'Start Service',
        click: async () => {
          try {
            if (status.isRunning) {
              await this.serviceManager.stopService();
              this.showNotification('Service Stopped', 'The bridge service has been stopped.');
            } else {
              await this.serviceManager.startService();
              this.showNotification('Service Started', 'The bridge service is now running.');
            }
          } catch (error) {
            this.showNotification(
              'Error',
              `Failed to ${status.isRunning ? 'stop' : 'start'} service: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        },
      },
      {
        label: 'Restart Service',
        enabled: status.isRunning,
        click: async () => {
          try {
            await this.serviceManager.restartService();
            this.showNotification('Service Restarted', 'The bridge service has been restarted.');
          } catch (error) {
            this.showNotification(
              'Error',
              `Failed to restart service: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'View Logs',
        click: () => {
          onShow();
          // Signal to open logs tab
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Exit',
        click: onQuit,
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  public updateTrayIcon(isRunning: boolean, hasError: boolean = false): void {
    if (!this.tray) return;

    let iconName: string;
    let tooltip: string;

    if (hasError) {
      iconName = 'error';
      tooltip = 'Doordeck Bridge - Error';
    } else if (isRunning) {
      iconName = 'running';
      tooltip = 'Doordeck Bridge - Running';
    } else {
      iconName = 'stopped';
      tooltip = 'Doordeck Bridge - Stopped';
    }

    const iconPath = this.getIconPath(iconName);
    const icon = nativeImage.createFromPath(iconPath);

    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip(tooltip);
  }

  private getIconPath(name: string): string {
    // In production, these would be actual icon files
    // For now, use placeholder paths
    const iconsDir = path.join(__dirname, '../../assets/icons');
    return path.join(iconsDir, `${name}.ico`);
  }

  public showNotification(title: string, body: string): void {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: this.getIconPath('running'),
      }).show();
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
