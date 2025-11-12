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
 * Complete bridge configuration
 */
export interface BridgeConfig {
  unifi: UniFiConfig;
  doordeck: DoordeckConfig;
  logging?: LoggingConfig;
  security?: SecurityConfig;
  server?: ServerConfig;
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
 * Door information
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
 * Door mapping
 */
export interface DoorMapping {
  unifiDoorId: string;
  doordeckLockId: string;
  name: string;
  siteId: string;
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
 * IPC Channel names for Electron IPC communication
 */
export enum IPCChannel {
  // Configuration
  GET_CONFIG = 'config:get',
  SET_CONFIG = 'config:set',
  VALIDATE_CONFIG = 'config:validate',

  // Service control
  SERVICE_START = 'service:start',
  SERVICE_STOP = 'service:stop',
  SERVICE_RESTART = 'service:restart',
  SERVICE_STATUS = 'service:status',
  SERVICE_HEALTH = 'service:health',

  // Doors
  DOORS_LIST = 'doors:list',
  DOORS_DISCOVER = 'doors:discover',
  DOOR_UNLOCK = 'door:unlock',
  DOOR_MAP = 'door:map',
  DOOR_UNMAP = 'door:unmap',

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
  SETUP_COMPLETE = 'setup:complete',
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
export type SetupStep = 'welcome' | 'unifi' | 'doordeck' | 'doors' | 'complete';

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
