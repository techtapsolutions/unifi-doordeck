import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ServiceStatus, Statistics, LogEntry, ConnectionStatus } from '../shared/types';
import { ConfigManager } from './config-manager';

const execAsync = promisify(exec);

interface ServiceManagerEvents {
  'status-change': (status: ServiceStatus) => void;
  'statistics-update': (stats: Statistics) => void;
  'log-entry': (entry: LogEntry) => void;
  'connection-status-change': (status: ConnectionStatus) => void;
}

export declare interface ServiceManager {
  on<U extends keyof ServiceManagerEvents>(
    event: U,
    listener: ServiceManagerEvents[U]
  ): this;
  emit<U extends keyof ServiceManagerEvents>(
    event: U,
    ...args: Parameters<ServiceManagerEvents[U]>
  ): boolean;
}

export class ServiceManager extends EventEmitter {
  private configManager: ConfigManager;
  private serviceProcess: ChildProcess | null = null;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private statisticsInterval: NodeJS.Timeout | null = null;
  private currentStatus: ServiceStatus = {
    isRunning: false,
    isInstalled: false,
  };

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Check status every 5 seconds
    this.statusCheckInterval = setInterval(() => {
      this.checkStatus().catch(console.error);
    }, 5000);

    // Update statistics every 10 seconds
    this.statisticsInterval = setInterval(() => {
      if (this.currentStatus.isRunning) {
        this.fetchStatistics().catch(console.error);
      }
    }, 10000);

    // Initial status check
    this.checkStatus().catch(console.error);
  }

  public async checkStatus(): Promise<ServiceStatus> {
    try {
      // Check if Windows service is installed
      const isInstalled = await this.isServiceInstalled();

      if (!isInstalled) {
        this.updateStatus({
          isRunning: false,
          isInstalled: false,
        });
        return this.currentStatus;
      }

      // Check if service is running
      const isRunning = await this.isServiceRunning();

      this.updateStatus({
        isRunning,
        isInstalled,
        uptime: isRunning ? await this.getServiceUptime() : undefined,
      });

      return this.currentStatus;
    } catch (error) {
      this.updateStatus({
        isRunning: false,
        isInstalled: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.currentStatus;
    }
  }

  private async isServiceInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('sc query "DoordeckBridge"');
      return stdout.includes('SERVICE_NAME');
    } catch {
      return false;
    }
  }

  private async isServiceRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('sc query "DoordeckBridge"');
      return stdout.includes('RUNNING');
    } catch {
      return false;
    }
  }

  private async getServiceUptime(): Promise<number> {
    try {
      // This is a simplified version - you'd need to implement proper uptime tracking
      const { stdout } = await execAsync('sc queryex "DoordeckBridge"');
      // Parse the PID and then get process start time
      // For now, return 0
      return 0;
    } catch {
      return 0;
    }
  }

  public async startService(): Promise<void> {
    try {
      await execAsync('sc start "DoordeckBridge"');
      await this.waitForServiceState('RUNNING', 30000);
      await this.checkStatus();
    } catch (error) {
      throw new Error(`Failed to start service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async stopService(): Promise<void> {
    try {
      await execAsync('sc stop "DoordeckBridge"');
      await this.waitForServiceState('STOPPED', 30000);
      await this.checkStatus();
    } catch (error) {
      throw new Error(`Failed to stop service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async restartService(): Promise<void> {
    await this.stopService();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.startService();
  }

  public async installService(bridgeServicePath: string): Promise<void> {
    try {
      // Using node-windows Service class would go here
      // For now, using sc.exe directly
      const command = `sc create "DoordeckBridge" binPath= "${bridgeServicePath}" start= auto DisplayName= "Doordeck Bridge Service"`;
      await execAsync(command);
      await this.checkStatus();
    } catch (error) {
      throw new Error(`Failed to install service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async uninstallService(): Promise<void> {
    try {
      // Stop the service first
      if (this.currentStatus.isRunning) {
        await this.stopService();
      }

      await execAsync('sc delete "DoordeckBridge"');
      await this.checkStatus();
    } catch (error) {
      throw new Error(`Failed to uninstall service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async waitForServiceState(state: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const { stdout } = await execAsync('sc query "DoordeckBridge"');
        if (stdout.includes(state)) {
          return;
        }
      } catch {
        // Ignore errors during polling
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timeout waiting for service state: ${state}`);
  }

  private updateStatus(status: ServiceStatus): void {
    const changed =
      this.currentStatus.isRunning !== status.isRunning ||
      this.currentStatus.isInstalled !== status.isInstalled;

    this.currentStatus = status;

    if (changed) {
      this.emit('status-change', status);
    }
  }

  public async fetchStatistics(): Promise<Statistics> {
    // In a real implementation, this would query the bridge service
    // For now, return mock data
    const stats: Statistics = {
      totalUnlocks: 0,
      successfulUnlocks: 0,
      failedUnlocks: 0,
      errors24h: 0,
      averageResponseTime: 0,
    };

    this.emit('statistics-update', stats);
    return stats;
  }

  public async fetchConnectionStatus(): Promise<ConnectionStatus> {
    // In a real implementation, this would query the bridge service
    const status: ConnectionStatus = {
      unifi: {
        connected: false,
        lastCheck: new Date().toISOString(),
      },
      doordeck: {
        connected: false,
        lastCheck: new Date().toISOString(),
      },
    };

    this.emit('connection-status-change', status);
    return status;
  }

  public getCurrentStatus(): ServiceStatus {
    return this.currentStatus;
  }

  public destroy(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
    }
    this.removeAllListeners();
  }
}
