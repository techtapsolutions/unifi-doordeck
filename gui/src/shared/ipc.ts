/**
 * IPC API interface exposed to the renderer process via preload script
 * This defines the contract between the main and renderer processes
 */

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
  UpdateAvailableInfo,
  UpdateDownloadedInfo,
} from './types';

/**
 * Bridge API exposed to renderer process
 */
export interface BridgeAPI {
  // Configuration
  getConfig: () => Promise<APIResponse<BridgeConfig>>;
  setConfig: (config: Partial<BridgeConfig>) => Promise<APIResponse<void>>;
  validateConfig: (config: Partial<BridgeConfig>) => Promise<APIResponse<ConfigValidationResult>>;

  // Service control
  installService: () => Promise<APIResponse<void>>;
  uninstallService: () => Promise<APIResponse<void>>;
  startService: () => Promise<APIResponse<void>>;
  stopService: () => Promise<APIResponse<void>>;
  restartService: () => Promise<APIResponse<void>>;
  getServiceStatus: () => Promise<APIResponse<string>>;
  getServiceHealth: () => Promise<APIResponse<ServiceHealth>>;
  isServiceInstalled: () => Promise<APIResponse<boolean>>;

  // Doors
  listDoors: () => Promise<APIResponse<Door[]>>;
  discoverDoors: () => Promise<APIResponse<Door[]>>;
  unlockDoor: (doorId: string) => Promise<APIResponse<void>>;

  // Door Mappings
  listMappings: () => Promise<APIResponse<DoorMapping[]>>;
  getMapping: (id: string) => Promise<APIResponse<DoorMapping>>;
  createMapping: (data: {
    unifiDoorId: string;
    unifiDoorName: string;
    doordeckLockId: string;
    doordeckLockName: string;
    siteId?: string;
  }) => Promise<APIResponse<DoorMapping>>;
  updateMapping: (id: string, updates: Partial<Omit<DoorMapping, 'id' | 'createdAt'>>) => Promise<APIResponse<DoorMapping>>;
  deleteMapping: (id: string) => Promise<APIResponse<void>>;
  listDoordeckLocks: () => Promise<APIResponse<DoordeckLock[]>>;

  // Logs
  getLogs: (limit?: number) => Promise<APIResponse<LogEntry[]>>;
  clearLogs: () => Promise<APIResponse<void>>;

  // Event subscriptions
  onServiceStatus: (callback: (status: string) => void) => () => void;
  onDoorEvent: (callback: (event: any) => void) => () => void;
  onLog: (callback: (log: LogEntry) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;

  // Setup wizard
  testUniFiConnection: (config: UniFiConfig) => Promise<APIResponse<boolean>>;
  testDoordeckConnection: (config: DoordeckConfig) => Promise<APIResponse<boolean>>;
  discoverDoorsWithConfig: (config: UniFiConfig) => Promise<APIResponse<Door[]>>;
  completeSetup: (config: BridgeConfig) => Promise<APIResponse<void>>;

  // Auto-update
  checkForUpdates: () => Promise<APIResponse<UpdateStatus>>;
  downloadUpdate: () => Promise<APIResponse<void>>;
  installUpdate: () => Promise<APIResponse<void>>;
  getUpdateStatus: () => Promise<APIResponse<UpdateStatus>>;

  // Update event subscriptions
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  onUpdateAvailable: (callback: (info: UpdateAvailableInfo) => void) => () => void;
  onUpdateDownloaded: (callback: (info: UpdateDownloadedInfo) => void) => () => void;
}

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    bridge: BridgeAPI;
  }
}
