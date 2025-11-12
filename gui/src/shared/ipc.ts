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
  LogEntry,
  ServiceHealth,
  UniFiConfig,
  DoordeckConfig,
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
  startService: () => Promise<APIResponse<void>>;
  stopService: () => Promise<APIResponse<void>>;
  restartService: () => Promise<APIResponse<void>>;
  getServiceStatus: () => Promise<APIResponse<string>>;
  getServiceHealth: () => Promise<APIResponse<ServiceHealth>>;

  // Doors
  listDoors: () => Promise<APIResponse<Door[]>>;
  discoverDoors: () => Promise<APIResponse<Door[]>>;
  unlockDoor: (doorId: string) => Promise<APIResponse<void>>;
  mapDoor: (mapping: DoorMapping) => Promise<APIResponse<void>>;
  unmapDoor: (unifiDoorId: string) => Promise<APIResponse<void>>;

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
}

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    bridge: BridgeAPI;
  }
}
