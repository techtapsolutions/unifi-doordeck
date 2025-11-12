// Shared types between main and renderer processes

export interface UniFiConfig {
  host: string;
  username: string;
  password: string;
  verifySSL: boolean;
}

export interface DoordeckConfig {
  apiUrl: string;
  authToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface DoorMapping {
  unifiDoorId: string;
  unifiDoorName: string;
  doordeckDoorId: string;
  doordeckDoorName: string;
  enabled: boolean;
}

export interface AppConfig {
  unifi: UniFiConfig;
  doordeck: DoordeckConfig;
  doorMappings: DoorMapping[];
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableFileLogging: boolean;
    logPath?: string;
  };
  firstRun: boolean;
  minimizeToTray: boolean;
  startWithWindows: boolean;
}

export interface ServiceStatus {
  isRunning: boolean;
  isInstalled: boolean;
  pid?: number;
  uptime?: number;
  lastError?: string;
}

export interface Statistics {
  totalUnlocks: number;
  successfulUnlocks: number;
  failedUnlocks: number;
  lastUnlockTime?: string;
  errors24h: number;
  averageResponseTime: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectionStatus {
  unifi: {
    connected: boolean;
    lastCheck: string;
    error?: string;
  };
  doordeck: {
    connected: boolean;
    lastCheck: string;
    error?: string;
  };
}

export interface UniFiDoor {
  id: string;
  name: string;
  location?: string;
  status: 'online' | 'offline';
}

export interface DoordeckDoor {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Config operations
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',
  SAVE_CONFIG: 'config:save',
  RESET_CONFIG: 'config:reset',

  // Service operations
  SERVICE_START: 'service:start',
  SERVICE_STOP: 'service:stop',
  SERVICE_RESTART: 'service:restart',
  SERVICE_INSTALL: 'service:install',
  SERVICE_UNINSTALL: 'service:uninstall',
  SERVICE_STATUS: 'service:status',

  // Connection testing
  TEST_UNIFI_CONNECTION: 'test:unifi',
  TEST_DOORDECK_CONNECTION: 'test:doordeck',

  // Door operations
  DISCOVER_UNIFI_DOORS: 'doors:discover-unifi',
  DISCOVER_DOORDECK_DOORS: 'doors:discover-doordeck',
  SYNC_DOOR_MAPPINGS: 'doors:sync-mappings',

  // Statistics and monitoring
  GET_STATISTICS: 'stats:get',
  GET_CONNECTION_STATUS: 'status:connections',

  // Logging
  GET_LOGS: 'logs:get',
  CLEAR_LOGS: 'logs:clear',
  SUBSCRIBE_LOGS: 'logs:subscribe',
  UNSUBSCRIBE_LOGS: 'logs:unsubscribe',

  // Window operations
  MINIMIZE_TO_TRAY: 'window:minimize-tray',
  SHOW_WINDOW: 'window:show',

  // Setup wizard
  COMPLETE_SETUP: 'setup:complete',

  // Events (main -> renderer)
  LOG_ENTRY: 'event:log-entry',
  STATISTICS_UPDATE: 'event:statistics',
  SERVICE_STATUS_CHANGE: 'event:service-status',
  CONNECTION_STATUS_CHANGE: 'event:connection-status',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

// IPC Response wrapper
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Test connection results
export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
