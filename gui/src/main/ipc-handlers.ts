/**
 * IPC Handler Implementations
 * Handles IPC requests from renderer process and communicates with bridge service
 */

import { IpcMain, BrowserWindow } from 'electron';
import type {
  APIResponse,
  BridgeConfig,
  ConfigValidationResult,
  Door,
  DoorMapping,
  LogEntry,
  ServiceHealth,
  UniFiConfig,
  DoordeckConfig,
} from '../shared/types';
import { IPCChannel } from '../shared/types';
import { BridgeServiceClient } from './bridge-client';
import { ConfigManager } from './config-manager';
import { testUniFiConnection, testDoordeckConnection, discoverUniFiDoors } from './connection-testers';

let bridgeClient: BridgeServiceClient;
let configManager: ConfigManager;

/**
 * Setup all IPC handlers
 */
export function setupIPC(ipcMain: IpcMain, mainWindow: BrowserWindow): void {
  // Initialize clients
  configManager = new ConfigManager();
  bridgeClient = new BridgeServiceClient();

  // Configuration handlers
  ipcMain.handle(IPCChannel.GET_CONFIG, handleGetConfig);
  ipcMain.handle(IPCChannel.SET_CONFIG, handleSetConfig);
  ipcMain.handle(IPCChannel.VALIDATE_CONFIG, handleValidateConfig);

  // Service control handlers
  ipcMain.handle(IPCChannel.SERVICE_START, handleServiceStart);
  ipcMain.handle(IPCChannel.SERVICE_STOP, handleServiceStop);
  ipcMain.handle(IPCChannel.SERVICE_RESTART, handleServiceRestart);
  ipcMain.handle(IPCChannel.SERVICE_STATUS, handleServiceStatus);
  ipcMain.handle(IPCChannel.SERVICE_HEALTH, handleServiceHealth);

  // Door handlers
  ipcMain.handle(IPCChannel.DOORS_LIST, handleDoorsList);
  ipcMain.handle(IPCChannel.DOORS_DISCOVER, handleDoorsDiscover);
  ipcMain.handle(IPCChannel.DOOR_UNLOCK, handleDoorUnlock);
  ipcMain.handle(IPCChannel.DOOR_MAP, handleDoorMap);
  ipcMain.handle(IPCChannel.DOOR_UNMAP, handleDoorUnmap);

  // Log handlers
  ipcMain.handle(IPCChannel.LOGS_GET, handleLogsGet);
  ipcMain.handle(IPCChannel.LOGS_CLEAR, handleLogsClear);

  // Setup wizard handlers
  ipcMain.handle(IPCChannel.SETUP_TEST_UNIFI, handleTestUniFi);
  ipcMain.handle(IPCChannel.SETUP_TEST_DOORDECK, handleTestDoordeck);
  ipcMain.handle(IPCChannel.SETUP_COMPLETE, handleSetupComplete);

  // Setup event polling to push updates to renderer
  startEventPolling(mainWindow);
}

/**
 * Configuration handlers
 */
async function handleGetConfig(): Promise<APIResponse<BridgeConfig>> {
  try {
    const config = await configManager.getConfig();
    return { success: true, data: config };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration',
    };
  }
}

async function handleSetConfig(
  _event: any,
  config: Partial<BridgeConfig>
): Promise<APIResponse<void>> {
  try {
    await configManager.setConfig(config);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set configuration',
    };
  }
}

async function handleValidateConfig(
  _event: any,
  config: Partial<BridgeConfig>
): Promise<APIResponse<ConfigValidationResult>> {
  try {
    const result = await configManager.validateConfig(config);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate configuration',
    };
  }
}

/**
 * Service control handlers
 */
async function handleServiceStart(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.startService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start service',
    };
  }
}

async function handleServiceStop(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.stopService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop service',
    };
  }
}

async function handleServiceRestart(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.restartService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart service',
    };
  }
}

async function handleServiceStatus(): Promise<APIResponse<string>> {
  try {
    const status = await bridgeClient.getServiceStatus();
    return { success: true, data: status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service status',
    };
  }
}

async function handleServiceHealth(): Promise<APIResponse<ServiceHealth>> {
  try {
    const health = await bridgeClient.getServiceHealth();
    return { success: true, data: health };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service health',
    };
  }
}

/**
 * Door handlers
 */
async function handleDoorsList(): Promise<APIResponse<Door[]>> {
  try {
    const doors = await bridgeClient.listDoors();
    return { success: true, data: doors };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list doors',
    };
  }
}

async function handleDoorsDiscover(): Promise<APIResponse<Door[]>> {
  console.log('[IPC] handleDoorsDiscover called');
  try {
    // During setup wizard, use standalone door discovery
    // After setup, use bridge service
    const config = await configManager.getConfig();
    console.log('[IPC] Got config:', {
      hasConfig: !!config,
      hasUnifi: !!(config && config.unifi),
      hasHost: !!(config && config.unifi && config.unifi.host),
      hasApiKey: !!(config && config.unifi && config.unifi.apiKey),
    });

    if (config && config.unifi && config.unifi.host && config.unifi.apiKey) {
      console.log('[IPC] Using standalone door discovery');
      // Use standalone door discovery
      const result = await discoverUniFiDoors(config.unifi);
      console.log('[IPC] Discovery result:', result);
      if (result.success && result.doors) {
        console.log('[IPC] Returning', result.doors.length, 'doors');
        return { success: true, data: result.doors };
      } else {
        console.error('[IPC] Discovery failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to discover doors',
        };
      }
    } else {
      console.log('[IPC] Trying bridge service');
      // Try bridge service (for when setup is complete and service is running)
      try {
        const doors = await bridgeClient.discoverDoors();
        console.log('[IPC] Bridge service returned', doors.length, 'doors');
        return { success: true, data: doors };
      } catch (error) {
        console.error('[IPC] Bridge service failed:', error);
        return {
          success: false,
          error: 'Please configure UniFi settings with API key first',
        };
      }
    }
  } catch (error) {
    console.error('[IPC] Exception in handleDoorsDiscover:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discover doors',
    };
  }
}

async function handleDoorUnlock(_event: any, doorId: string): Promise<APIResponse<void>> {
  try {
    await bridgeClient.unlockDoor(doorId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unlock door',
    };
  }
}

async function handleDoorMap(_event: any, mapping: DoorMapping): Promise<APIResponse<void>> {
  try {
    await bridgeClient.mapDoor(mapping);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to map door',
    };
  }
}

async function handleDoorUnmap(_event: any, unifiDoorId: string): Promise<APIResponse<void>> {
  try {
    await bridgeClient.unmapDoor(unifiDoorId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unmap door',
    };
  }
}

/**
 * Log handlers
 */
async function handleLogsGet(_event: any, limit?: number): Promise<APIResponse<LogEntry[]>> {
  try {
    const logs = await bridgeClient.getLogs(limit);
    return { success: true, data: logs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get logs',
    };
  }
}

async function handleLogsClear(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.clearLogs();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear logs',
    };
  }
}

/**
 * Setup wizard handlers
 */
async function handleTestUniFi(
  _event: any,
  config: UniFiConfig
): Promise<APIResponse<boolean>> {
  try {
    // Use standalone connection tester (doesn't require bridge service to be running)
    const result = await testUniFiConnection(config);
    if (result.success) {
      return { success: true, data: true };
    } else {
      return {
        success: false,
        error: result.error || 'Connection test failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test UniFi connection',
    };
  }
}

async function handleTestDoordeck(
  _event: any,
  config: DoordeckConfig
): Promise<APIResponse<boolean>> {
  try {
    // Use standalone connection tester (doesn't require bridge service to be running)
    const result = await testDoordeckConnection(config);
    if (result.success) {
      return { success: true, data: true };
    } else {
      return {
        success: false,
        error: result.error || 'Connection test failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test Doordeck connection',
    };
  }
}

async function handleSetupComplete(
  _event: any,
  config: BridgeConfig
): Promise<APIResponse<void>> {
  try {
    await configManager.setConfig(config);
    await bridgeClient.startService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete setup',
    };
  }
}

/**
 * Start polling for events and push to renderer
 */
function startEventPolling(mainWindow: BrowserWindow): void {
  // Poll service status every 5 seconds
  setInterval(async () => {
    try {
      const health = await bridgeClient.getServiceHealth();
      mainWindow.webContents.send(IPCChannel.EVENT_SERVICE_STATUS, health.status);
    } catch (error) {
      // Service might not be running yet
    }
  }, 5000);

  // Poll for new logs every 2 seconds
  setInterval(async () => {
    try {
      const logs = await bridgeClient.getLogs(10);
      if (logs && logs.length > 0) {
        // Send the most recent log
        mainWindow.webContents.send(IPCChannel.EVENT_LOG, logs[0]);
      }
    } catch (error) {
      // Service might not be running yet
    }
  }, 2000);
}
