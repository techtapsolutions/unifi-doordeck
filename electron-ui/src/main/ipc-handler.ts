import { ipcMain } from 'electron';
import axios from 'axios';
import {
  IPC_CHANNELS,
  IPCResponse,
  AppConfig,
  TestConnectionResult,
  UniFiDoor,
  DoordeckDoor,
  LogEntry,
} from '../shared/types';
import { ConfigManager } from './config-manager';
import { ServiceManager } from './service-manager';
import { TrayManager } from './tray-manager';

export class IPCHandler {
  private configManager: ConfigManager;
  private serviceManager: ServiceManager;
  private trayManager: TrayManager;
  private logSubscribers = new Set<string>();

  constructor(
    configManager: ConfigManager,
    serviceManager: ServiceManager,
    trayManager: TrayManager
  ) {
    this.configManager = configManager;
    this.serviceManager = serviceManager;
    this.trayManager = trayManager;
  }

  public registerHandlers(): void {
    this.registerConfigHandlers();
    this.registerServiceHandlers();
    this.registerConnectionTestHandlers();
    this.registerDoorHandlers();
    this.registerStatisticsHandlers();
    this.registerLoggingHandlers();
    this.registerSetupHandlers();
  }

  private registerConfigHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.GET_CONFIG, (): IPCResponse<AppConfig> => {
      try {
        return {
          success: true,
          data: this.configManager.getConfig(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get config',
        };
      }
    });

    ipcMain.handle(
      IPC_CHANNELS.SET_CONFIG,
      (_event, config: Partial<AppConfig>): IPCResponse => {
        try {
          this.configManager.setConfig(config);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set config',
          };
        }
      }
    );

    ipcMain.handle(IPC_CHANNELS.RESET_CONFIG, (): IPCResponse => {
      try {
        this.configManager.resetConfig();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reset config',
        };
      }
    });
  }

  private registerServiceHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.SERVICE_START, async (): Promise<IPCResponse> => {
      try {
        await this.serviceManager.startService();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start service',
        };
      }
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_STOP, async (): Promise<IPCResponse> => {
      try {
        await this.serviceManager.stopService();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to stop service',
        };
      }
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_RESTART, async (): Promise<IPCResponse> => {
      try {
        await this.serviceManager.restartService();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to restart service',
        };
      }
    });

    ipcMain.handle(
      IPC_CHANNELS.SERVICE_INSTALL,
      async (_event, bridgePath: string): Promise<IPCResponse> => {
        try {
          await this.serviceManager.installService(bridgePath);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to install service',
          };
        }
      }
    );

    ipcMain.handle(IPC_CHANNELS.SERVICE_UNINSTALL, async (): Promise<IPCResponse> => {
      try {
        await this.serviceManager.uninstallService();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to uninstall service',
          };
      }
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_STATUS, async (): Promise<IPCResponse> => {
      try {
        const status = await this.serviceManager.checkStatus();
        return { success: true, data: status };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get service status',
        };
      }
    });
  }

  private registerConnectionTestHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.TEST_UNIFI_CONNECTION,
      async (_event, host: string, username: string, password: string): Promise<IPCResponse<TestConnectionResult>> => {
        try {
          // Test UniFi Access connection
          const response = await axios.post(
            `${host}/api/auth/login`,
            { username, password },
            {
              timeout: 10000,
              validateStatus: (status) => status < 500,
            }
          );

          if (response.status === 200) {
            return {
              success: true,
              data: {
                success: true,
                message: 'Successfully connected to UniFi Access',
                details: { version: response.data?.version },
              },
            };
          } else {
            return {
              success: true,
              data: {
                success: false,
                message: 'Invalid credentials or connection failed',
                details: { status: response.status },
              },
            };
          }
        } catch (error) {
          return {
            success: true,
            data: {
              success: false,
              message: error instanceof Error ? error.message : 'Connection test failed',
            },
          };
        }
      }
    );

    ipcMain.handle(
      IPC_CHANNELS.TEST_DOORDECK_CONNECTION,
      async (_event, apiUrl: string, authToken?: string): Promise<IPCResponse<TestConnectionResult>> => {
        try {
          // Test Doordeck connection
          const headers: Record<string, string> = {};
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          const response = await axios.get(`${apiUrl}/api/v1/health`, {
            headers,
            timeout: 10000,
            validateStatus: (status) => status < 500,
          });

          if (response.status === 200) {
            return {
              success: true,
              data: {
                success: true,
                message: 'Successfully connected to Doordeck API',
              },
            };
          } else {
            return {
              success: true,
              data: {
                success: false,
                message: 'Failed to connect to Doordeck API',
                details: { status: response.status },
              },
            };
          }
        } catch (error) {
          return {
            success: true,
            data: {
              success: false,
              message: error instanceof Error ? error.message : 'Connection test failed',
            },
          };
        }
      }
    );
  }

  private registerDoorHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.DISCOVER_UNIFI_DOORS,
      async (): Promise<IPCResponse<UniFiDoor[]>> => {
        try {
          // In production, this would query UniFi Access API
          // For now, return mock data
          const doors: UniFiDoor[] = [];
          return { success: true, data: doors };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to discover UniFi doors',
          };
        }
      }
    );

    ipcMain.handle(
      IPC_CHANNELS.DISCOVER_DOORDECK_DOORS,
      async (): Promise<IPCResponse<DoordeckDoor[]>> => {
        try {
          // In production, this would query Doordeck API
          // For now, return mock data
          const doors: DoordeckDoor[] = [];
          return { success: true, data: doors };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to discover Doordeck doors',
          };
        }
      }
    );

    ipcMain.handle(IPC_CHANNELS.SYNC_DOOR_MAPPINGS, async (): Promise<IPCResponse> => {
      try {
        // In production, this would sync door mappings with the bridge service
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to sync door mappings',
        };
      }
    });
  }

  private registerStatisticsHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.GET_STATISTICS, async (): Promise<IPCResponse> => {
      try {
        const stats = await this.serviceManager.fetchStatistics();
        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get statistics',
        };
      }
    });

    ipcMain.handle(IPC_CHANNELS.GET_CONNECTION_STATUS, async (): Promise<IPCResponse> => {
      try {
        const status = await this.serviceManager.fetchConnectionStatus();
        return { success: true, data: status };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get connection status',
        };
      }
    });
  }

  private registerLoggingHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.GET_LOGS,
      async (_event, limit?: number): Promise<IPCResponse<LogEntry[]>> => {
        try {
          // In production, this would read from log files
          // For now, return empty array
          const logs: LogEntry[] = [];
          return { success: true, data: logs };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get logs',
          };
        }
      }
    );

    ipcMain.handle(IPC_CHANNELS.CLEAR_LOGS, async (): Promise<IPCResponse> => {
      try {
        // In production, this would clear log files
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to clear logs',
        };
      }
    });

    ipcMain.handle(IPC_CHANNELS.SUBSCRIBE_LOGS, async (): Promise<IPCResponse> => {
      try {
        // Track log subscribers
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to subscribe to logs',
        };
      }
    });

    ipcMain.handle(IPC_CHANNELS.UNSUBSCRIBE_LOGS, async (): Promise<IPCResponse> => {
      try {
        // Remove from log subscribers
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to unsubscribe from logs',
        };
      }
    });
  }

  private registerSetupHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.COMPLETE_SETUP, async (): Promise<IPCResponse> => {
      try {
        this.configManager.completeSetup();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to complete setup',
        };
      }
    });
  }
}
