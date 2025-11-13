/**
 * Shared types for GUI-Bridge communication
 * These types are used by both the Electron main process and renderer process
 */

/**
 * UniFi configuration
 */
export interface UniFiConfig {
  host: string;
  port?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  caCertPath?: string;
  skipSSLVerification?: boolean; // Skip SSL certificate verification (not recommended for production)
  reconnectDelay?: number;
  maxRetries?: number;
}

/**
 * Doordeck configuration
 */
export interface DoordeckConfig {
  email: string;
  password: string;
  apiToken?: string;
  refreshToken?: string;
  debug?: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  apiAuthEnabled?: boolean;
  autoMigrateCredentials?: boolean;
  logSanitization?: boolean;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level?: 'error' | 'warn' | 'info' | 'debug';
  fileLogging?: boolean;
  logFilePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  port?: number;
  enabled?: boolean;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  enabled?: boolean;
  secret?: string;
  publicHost?: string; // Public IP or domain name for webhook URL
  port?: number; // Service port (default: 34512)
  verifySignature?: boolean;
}

/**
 * Complete bridge configuration
 */
export interface BridgeConfig {
  unifi: UniFiConfig;
  doordeck: DoordeckConfig;
  logging?: LoggingConfig;
  security?: SecurityConfig;
  server?: ServerConfig;
  webhook?: WebhookConfig;
  siteId?: string;
}

/**
 * Service status
 */
export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Service health information
 */
export interface ServiceHealth {
  status: ServiceStatus;
  uptime?: number;
  unifiConnected: boolean;
  doordeckConnected: boolean;
  doorsMonitored: number;
  lastError?: string;
  lastErrorTime?: string;
}

/**
 * Door information (UniFi)
 */
export interface Door {
  id: string;
  name: string;
  floor?: string;
  metadata?: Record<string, unknown>;
  doordeckLockId?: string;
  isMonitored?: boolean;
}

/**
 * Doordeck lock information
 */
export interface DoordeckLock {
  id: string;
  name: string;
  description?: string;
  colour?: string;
  favourite?: boolean;
  siteId?: string;
}

/**
 * Door mapping between UniFi and Doordeck
 */
export interface DoorMapping {
  id: string; // Unique mapping ID
  unifiDoorId: string; // UniFi location/door ID
  unifiDoorName: string; // Display name from UniFi
  doordeckLockId: string; // Doordeck lock UUID
  doordeckLockName: string; // Display name from Doordeck
  siteId?: string; // UniFi site ID (for multi-site support)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update status information
 */
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

/**
 * Update availability info
 */
export interface UpdateAvailableInfo {
  version: string;
  releaseNotes: string;
  releaseDate?: string;
}

/**
 * Update downloaded info
 */
export interface UpdateDownloadedInfo {
  version: string;
}

/**
 * IPC Channel names for Electron IPC communication
 */
export enum IPCChannel {
  // Configuration
  GET_CONFIG = 'config:get',
  SET_CONFIG = 'config:set',
  VALIDATE_CONFIG = 'config:validate',

  // Service control
  SERVICE_INSTALL = 'service:install',
  SERVICE_UNINSTALL = 'service:uninstall',
  SERVICE_START = 'service:start',
  SERVICE_STOP = 'service:stop',
  SERVICE_RESTART = 'service:restart',
  SERVICE_STATUS = 'service:status',
  SERVICE_HEALTH = 'service:health',
  SERVICE_IS_INSTALLED = 'service:is-installed',

  // Doors
  DOORS_LIST = 'doors:list',
  DOORS_DISCOVER = 'doors:discover',
  DOOR_UNLOCK = 'door:unlock',

  // Door Mappings
  MAPPINGS_LIST = 'mappings:list',
  MAPPINGS_GET = 'mappings:get',
  MAPPINGS_CREATE = 'mappings:create',
  MAPPINGS_UPDATE = 'mappings:update',
  MAPPINGS_DELETE = 'mappings:delete',
  DOORDECK_LOCKS_LIST = 'doordeck:locks:list',

  // Logs
  LOGS_GET = 'logs:get',
  LOGS_CLEAR = 'logs:clear',
  LOGS_SUBSCRIBE = 'logs:subscribe',
  LOGS_UNSUBSCRIBE = 'logs:unsubscribe',

  // Events
  EVENT_SERVICE_STATUS = 'event:service:status',
  EVENT_DOOR_EVENT = 'event:door',
  EVENT_LOG = 'event:log',
  EVENT_ERROR = 'event:error',

  // Setup wizard
  SETUP_TEST_UNIFI = 'setup:test:unifi',
  SETUP_TEST_DOORDECK = 'setup:test:doordeck',
  SETUP_DISCOVER_DOORS = 'setup:discover:doors',
  SETUP_COMPLETE = 'setup:complete',

  // Auto-update
  UPDATE_CHECK = 'update:check',
  UPDATE_DOWNLOAD = 'update:download',
  UPDATE_INSTALL = 'update:install',
  UPDATE_GET_STATUS = 'update:get-status',

  // Update events
  EVENT_UPDATE_STATUS = 'event:update:status',
  EVENT_UPDATE_AVAILABLE = 'event:update:available',
  EVENT_UPDATE_DOWNLOADED = 'event:update:downloaded',
}

/**
 * API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Setup wizard step
 */
export type SetupStep = 'welcome' | 'unifi' | 'doordeck' | 'mapping' | 'complete';

/**
 * Setup wizard state
 */
export interface SetupState {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  config: Partial<BridgeConfig>;
  unifiTested: boolean;
  doordeckTested: boolean;
  discoveredDoors: Door[];
  mappedDoors: DoorMapping[];
}
