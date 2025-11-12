/**
 * Configuration types for the UniFi-Doordeck bridge
 */

/**
 * UniFi Access configuration
 */
export interface UniFiConfig {
  /** UniFi Access controller host (IP or hostname) */
  host: string;

  /** UniFi Access controller port (default: 443) */
  port?: number;

  /** UniFi OS API Key (for UniFi OS / UDM / Dream Machine) */
  apiKey?: string;

  /** UniFi Access admin username (legacy authentication) */
  username?: string;

  /** UniFi Access admin password (legacy authentication) */
  password?: string;

  /**
   * Path to custom CA certificate for SSL verification
   * Required if using self-signed certificates
   * SSL verification is always enabled for security
   */
  caCertPath?: string;

  /** Reconnect delay in milliseconds (default: 5000) */
  reconnectDelay?: number;

  /** Maximum reconnection attempts (default: 3) */
  maxRetries?: number;

  /**
   * Marker indicating credentials are stored in secure storage
   * @internal
   */
  _credentialsInSecureStorage?: boolean;
}

/**
 * Doordeck configuration
 */
export interface DoordeckConfig {
  /** Doordeck API token (auto-generated from login) */
  apiToken?: string;

  /** Doordeck refresh token (optional) */
  refreshToken?: string;

  /** Doordeck Fusion API email */
  email: string;

  /** Doordeck Fusion API password */
  password: string;

  /** Enable debug logging for Doordeck SDK (default: false) */
  debug?: boolean;

  /**
   * Marker indicating credentials are stored in secure storage
   * @internal
   */
  _credentialsInSecureStorage?: boolean;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level (default: 'info') */
  level?: 'error' | 'warn' | 'info' | 'debug';

  /** Enable file logging (default: false) */
  fileLogging?: boolean;

  /** Log file path (default: './logs/bridge.log') */
  logFilePath?: string;

  /** Maximum log file size in bytes (default: 10MB) */
  maxFileSize?: number;

  /** Maximum number of log files to keep (default: 5) */
  maxFiles?: number;
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  /** Enable health monitoring (default: true) */
  enabled?: boolean;

  /** Health check interval in milliseconds (default: 30000) */
  checkInterval?: number;

  /** Failure threshold before marking unhealthy (default: 3) */
  failureThreshold?: number;

  /** Health check timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Enable circuit breaker (default: true) */
  enabled?: boolean;

  /** Failure threshold before opening circuit (default: 5) */
  failureThreshold?: number;

  /** Success threshold before closing circuit (default: 2) */
  successThreshold?: number;

  /** Timeout before transitioning to half-open in milliseconds (default: 60000) */
  timeout?: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Enable retry logic (default: true) */
  enabled?: boolean;

  /** Maximum retry attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;

  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;

  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
}

/**
 * Event translator configuration
 */
export interface EventTranslatorConfig {
  /** Enable event translation (default: true) */
  enabled?: boolean;

  /** Deduplication window in milliseconds (default: 5000) */
  deduplicationWindow?: number;

  /** Maximum queue size (default: 1000) */
  maxQueueSize?: number;

  /** Processing delay in milliseconds (default: 1000) */
  processingDelay?: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable API authentication (default: true) */
  apiAuthEnabled?: boolean;

  /** Enable automatic credential migration on startup (default: false) */
  autoMigrateCredentials?: boolean;

  /** Enable log sanitization (default: true) */
  logSanitization?: boolean;
}

/**
 * Web server configuration
 */
export interface ServerConfig {
  /** Web server port (default: 3000) */
  port?: number;

  /** Enable web interface (default: true) */
  enabled?: boolean;
}

/**
 * Complete bridge configuration
 */
export interface BridgeConfig {
  /** UniFi Access configuration */
  unifi: UniFiConfig;

  /** Doordeck configuration */
  doordeck: DoordeckConfig;

  /** Logging configuration */
  logging?: LoggingConfig;

  /** Security configuration */
  security?: SecurityConfig;

  /** Health monitoring configuration */
  healthMonitor?: HealthMonitorConfig;

  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;

  /** Retry configuration */
  retry?: RetryConfig;

  /** Event translator configuration */
  eventTranslator?: EventTranslatorConfig;

  /** Web server configuration */
  server?: ServerConfig;

  /**
   * Organization/Site ID for Doordeck integration
   * Auto-generated from organization if not specified
   */
  siteId?: string;
}

/**
 * Partial configuration for overrides
 */
export type PartialBridgeConfig = DeepPartial<BridgeConfig>;

/**
 * Helper type for deep partial
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
