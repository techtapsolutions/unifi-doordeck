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
  DoordeckLock,
  LogEntry,
  ServiceHealth,
  UniFiConfig,
  DoordeckConfig,
  UpdateStatus,
} from '../shared/types';
import { IPCChannel } from '../shared/types';
import { BridgeServiceClient } from './bridge-client';
import { ConfigManager } from './config-manager';
import {
  testUniFiConnection,
  testDoordeckConnection,
  discoverUniFiDoors,
  discoverDoordeckLocks,
  unlockUniFiDoor,
} from './connection-testers';
import { log, getLogPath } from './logger';
import * as doorMappingStore from './door-mapping-store';
import { getUpdateManager } from './update-manager';

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
  ipcMain.handle(IPCChannel.SERVICE_INSTALL, handleServiceInstall);
  ipcMain.handle(IPCChannel.SERVICE_UNINSTALL, handleServiceUninstall);
  ipcMain.handle(IPCChannel.SERVICE_START, handleServiceStart);
  ipcMain.handle(IPCChannel.SERVICE_STOP, handleServiceStop);
  ipcMain.handle(IPCChannel.SERVICE_RESTART, handleServiceRestart);
  ipcMain.handle(IPCChannel.SERVICE_STATUS, handleServiceStatus);
  ipcMain.handle(IPCChannel.SERVICE_HEALTH, handleServiceHealth);
  ipcMain.handle(IPCChannel.SERVICE_IS_INSTALLED, handleServiceIsInstalled);

  // Door handlers
  ipcMain.handle(IPCChannel.DOORS_LIST, handleDoorsList);
  ipcMain.handle(IPCChannel.DOORS_DISCOVER, handleDoorsDiscover);
  ipcMain.handle(IPCChannel.DOOR_UNLOCK, handleDoorUnlock);

  // Door Mapping handlers
  ipcMain.handle(IPCChannel.MAPPINGS_LIST, handleMappingsList);
  ipcMain.handle(IPCChannel.MAPPINGS_GET, handleMappingsGet);
  ipcMain.handle(IPCChannel.MAPPINGS_CREATE, handleMappingsCreate);
  ipcMain.handle(IPCChannel.MAPPINGS_UPDATE, handleMappingsUpdate);
  ipcMain.handle(IPCChannel.MAPPINGS_DELETE, handleMappingsDelete);
  ipcMain.handle(IPCChannel.DOORDECK_LOCKS_LIST, handleDoordeckLocksList);

  // Log handlers
  ipcMain.handle(IPCChannel.LOGS_GET, handleLogsGet);
  ipcMain.handle(IPCChannel.LOGS_CLEAR, handleLogsClear);

  // Setup wizard handlers
  ipcMain.handle(IPCChannel.SETUP_TEST_UNIFI, handleTestUniFi);
  ipcMain.handle(IPCChannel.SETUP_TEST_DOORDECK, handleTestDoordeck);
  ipcMain.handle(IPCChannel.SETUP_DISCOVER_DOORS, handleDiscoverDoorsWithConfig);
  ipcMain.handle(IPCChannel.SETUP_COMPLETE, handleSetupComplete);

  // Auto-update handlers
  ipcMain.handle(IPCChannel.UPDATE_CHECK, handleUpdateCheck);
  ipcMain.handle(IPCChannel.UPDATE_DOWNLOAD, handleUpdateDownload);
  ipcMain.handle(IPCChannel.UPDATE_INSTALL, handleUpdateInstall);
  ipcMain.handle(IPCChannel.UPDATE_GET_STATUS, handleUpdateGetStatus);

  // Initialize update manager
  const updateManager = getUpdateManager();
  updateManager.setMainWindow(mainWindow);

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
async function handleServiceInstall(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.installService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install service',
    };
  }
}

async function handleServiceUninstall(): Promise<APIResponse<void>> {
  try {
    await bridgeClient.uninstallService();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to uninstall service',
    };
  }
}

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

async function handleServiceIsInstalled(): Promise<APIResponse<boolean>> {
  try {
    const isInstalled = await bridgeClient.isServiceInstalled();
    return { success: true, data: isInstalled };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check service installation',
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
  log('INFO', `handleDoorUnlock called for door: ${doorId}`);
  log('INFO', `Log file location: ${getLogPath()}`);

  try {
    // Try bridge service first
    try {
      log('INFO', 'Attempting unlock via bridge service...');
      await bridgeClient.unlockDoor(doorId);
      log('INFO', 'Door unlocked successfully via bridge service');
      return { success: true };
    } catch (bridgeError) {
      log('WARN', 'Bridge service unlock failed, trying direct unlock...', bridgeError);

      // Bridge service not available, try direct unlock
      const config = await configManager.getConfig();
      log('INFO', 'Loaded config', {
        hasConfig: !!config,
        hasUnifi: !!(config && config.unifi),
        hasHost: !!(config && config.unifi && config.unifi.host),
        hasApiKey: !!(config && config.unifi && config.unifi.apiKey),
      });

      if (config && config.unifi && config.unifi.host && config.unifi.apiKey) {
        log('INFO', 'Using standalone door unlock');
        log('INFO', `Unlocking door with location ID: ${doorId}`);

        // Use the door location ID directly (no need to look up device ID)
        const result = await unlockUniFiDoor(config.unifi, doorId);
        log('INFO', 'Unlock result', { success: result.success, error: result.error });

        if (result.success) {
          log('INFO', 'Door unlocked successfully via direct connection');
          return { success: true };
        } else {
          log('ERROR', 'Direct unlock failed', result.error);
          return {
            success: false,
            error: `${result.error}\n\nLog file: ${getLogPath()}`,
          };
        }
      } else {
        log('ERROR', 'No UniFi config available');
        return {
          success: false,
          error: `UniFi configuration not available.\n\nLog file: ${getLogPath()}`,
        };
      }
    }
  } catch (error) {
    log('ERROR', 'Exception in handleDoorUnlock', error);
    return {
      success: false,
      error: `${error instanceof Error ? error.message : 'Failed to unlock door'}\n\nLog file: ${getLogPath()}`,
    };
  }
}

/**
 * Door Mapping handlers
 */
async function handleMappingsList(): Promise<APIResponse<DoorMapping[]>> {
  try {
    const mappings = doorMappingStore.getMappings();
    return { success: true, data: mappings };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list mappings',
    };
  }
}

async function handleMappingsGet(
  _event: any,
  id: string
): Promise<APIResponse<DoorMapping>> {
  try {
    const mapping = doorMappingStore.getMappingById(id);
    if (mapping) {
      return { success: true, data: mapping };
    } else {
      return {
        success: false,
        error: 'Mapping not found',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mapping',
    };
  }
}

async function handleMappingsCreate(
  _event: any,
  data: {
    unifiDoorId: string;
    unifiDoorName: string;
    doordeckLockId: string;
    doordeckLockName: string;
    siteId?: string;
  }
): Promise<APIResponse<DoorMapping>> {
  try {
    const mapping = doorMappingStore.createMapping(
      data.unifiDoorId,
      data.unifiDoorName,
      data.doordeckLockId,
      data.doordeckLockName,
      data.siteId
    );
    return { success: true, data: mapping };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mapping',
    };
  }
}

async function handleMappingsUpdate(
  _event: any,
  data: {
    id: string;
    updates: Partial<Omit<DoorMapping, 'id' | 'createdAt'>>;
  }
): Promise<APIResponse<DoorMapping>> {
  try {
    const mapping = doorMappingStore.updateMapping(data.id, data.updates);
    return { success: true, data: mapping };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update mapping',
    };
  }
}

async function handleMappingsDelete(
  _event: any,
  id: string
): Promise<APIResponse<void>> {
  try {
    doorMappingStore.deleteMapping(id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete mapping',
    };
  }
}

async function handleDoordeckLocksList(): Promise<APIResponse<DoordeckLock[]>> {
  try {
    const config = await configManager.getConfig();
    if (!config || !config.doordeck) {
      return {
        success: false,
        error: 'Doordeck not configured',
      };
    }

    const result = await discoverDoordeckLocks(config.doordeck);
    if (result.success && result.locks) {
      return { success: true, data: result.locks };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to discover Doordeck locks',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list Doordeck locks',
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

async function handleDiscoverDoorsWithConfig(
  _event: any,
  config: UniFiConfig
): Promise<APIResponse<Door[]>> {
  console.log('[IPC] handleDiscoverDoorsWithConfig called with config');
  try {
    console.log('[IPC] Config has:', {
      hasHost: !!config.host,
      hasApiKey: !!config.apiKey,
    });

    // Use standalone door discovery with provided config
    const result = await discoverUniFiDoors(config);
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
  } catch (error) {
    console.error('[IPC] Exception in handleDiscoverDoorsWithConfig:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discover doors',
    };
  }
}

async function handleSetupComplete(
  _event: any,
  config: BridgeConfig
): Promise<APIResponse<void>> {
  try {
    await configManager.setConfig(config);
    // Note: Service must be started manually via system service manager
    // or through the GUI after setup completes
    console.log('[IPC] Setup complete - configuration saved');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete setup',
    };
  }
}

/**
 * Auto-update handlers
 */
async function handleUpdateCheck(): Promise<APIResponse<UpdateStatus>> {
  try {
    const updateManager = getUpdateManager();
    const status = await updateManager.checkForUpdates();
    return { success: true, data: status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check for updates',
    };
  }
}

async function handleUpdateDownload(): Promise<APIResponse<void>> {
  try {
    const updateManager = getUpdateManager();
    await updateManager.downloadUpdate();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download update',
    };
  }
}

async function handleUpdateInstall(): Promise<APIResponse<void>> {
  try {
    const updateManager = getUpdateManager();
    updateManager.quitAndInstall();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install update',
    };
  }
}

async function handleUpdateGetStatus(): Promise<APIResponse<UpdateStatus>> {
  try {
    const updateManager = getUpdateManager();
    const status = updateManager.getStatus();
    return { success: true, data: status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get update status',
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
