import {
  LoggingConfig,
  HealthMonitorConfig,
  CircuitBreakerConfig,
  RetryConfig,
  EventTranslatorConfig,
} from './types';

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: Required<LoggingConfig> = {
  level: 'info',
  fileLogging: false,
  logFilePath: './logs/bridge.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};

/**
 * Default health monitor configuration
 */
export const DEFAULT_HEALTH_MONITOR_CONFIG: Required<HealthMonitorConfig> = {
  enabled: true,
  checkInterval: 30000, // 30 seconds
  failureThreshold: 3,
  timeout: 5000, // 5 seconds
};

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Required<CircuitBreakerConfig> = {
  enabled: true,
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 60 seconds
};

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  enabled: true,
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Default event translator configuration
 */
export const DEFAULT_EVENT_TRANSLATOR_CONFIG: Required<EventTranslatorConfig> = {
  enabled: true,
  deduplicationWindow: 5000, // 5 seconds
  maxQueueSize: 1000,
  processingDelay: 1000, // 1 second
};

/**
 * Default UniFi configuration values (for optional fields)
 */
export const DEFAULT_UNIFI_CONFIG = {
  port: 443,
  verifySsl: true,
  reconnectDelay: 5000, // 5 seconds
  maxRetries: 3,
};

/**
 * Default Doordeck configuration values (for optional fields)
 */
export const DEFAULT_DOORDECK_CONFIG = {
  debug: false,
};
