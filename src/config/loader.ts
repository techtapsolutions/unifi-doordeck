import * as fs from 'fs';
import * as path from 'path';
import { BridgeConfig, PartialBridgeConfig } from './types';
import {
  DEFAULT_LOGGING_CONFIG,
  DEFAULT_HEALTH_MONITOR_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_EVENT_TRANSLATOR_CONFIG,
  DEFAULT_UNIFI_CONFIG,
  DEFAULT_DOORDECK_CONFIG,
} from './defaults';
import { validateConfig } from './validator';

/**
 * Configuration loader that supports:
 * - JSON configuration files
 * - Environment variable overrides
 * - Default values
 * - Validation
 */
export class ConfigLoader {
  /**
   * Load configuration from file and environment variables
   *
   * @param configPath - Path to configuration file (JSON)
   * @returns Validated bridge configuration
   */
  static loadConfig(configPath?: string): BridgeConfig {
    let fileConfig: PartialBridgeConfig = {};

    // Load from file if path provided
    if (configPath) {
      fileConfig = this.loadFromFile(configPath);
    }

    // Load from environment variables
    const envConfig = this.loadFromEnv();

    // Merge configurations (env overrides file)
    const mergedConfig = this.mergeConfigs(fileConfig, envConfig);

    // Apply defaults
    const completeConfig = this.applyDefaults(mergedConfig);

    // Validate
    const validation = validateConfig(completeConfig);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed:\n${validation.errors.join('\n')}`);
    }

    return completeConfig;
  }

  /**
   * Load configuration from JSON file
   */
  private static loadFromFile(filePath: string): PartialBridgeConfig {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Configuration file not found: ${absolutePath}`);
      }

      const fileContents = fs.readFileSync(absolutePath, 'utf-8');
      const config = JSON.parse(fileContents);

      return config as PartialBridgeConfig;
    } catch (error) {
      throw new Error(
        `Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnv(): PartialBridgeConfig {
    const config: PartialBridgeConfig = {};

    // UniFi configuration
    if (process.env.UNIFI_HOST) {
      config.unifi = {
        host: process.env.UNIFI_HOST,
        username: process.env.UNIFI_USERNAME!,
        password: process.env.UNIFI_PASSWORD!,
        port: process.env.UNIFI_PORT ? parseInt(process.env.UNIFI_PORT, 10) : undefined,
        verifySsl: process.env.UNIFI_VERIFY_SSL
          ? process.env.UNIFI_VERIFY_SSL === 'true'
          : undefined,
        reconnectDelay: process.env.UNIFI_RECONNECT_DELAY
          ? parseInt(process.env.UNIFI_RECONNECT_DELAY, 10)
          : undefined,
        maxRetries: process.env.UNIFI_MAX_RETRIES
          ? parseInt(process.env.UNIFI_MAX_RETRIES, 10)
          : undefined,
      };
    }

    // Doordeck configuration
    if (process.env.DOORDECK_API_TOKEN) {
      config.doordeck = {
        apiToken: process.env.DOORDECK_API_TOKEN,
        refreshToken: process.env.DOORDECK_REFRESH_TOKEN,
        email: process.env.DOORDECK_EMAIL!,
        password: process.env.DOORDECK_PASSWORD!,
        debug: process.env.DOORDECK_DEBUG
          ? process.env.DOORDECK_DEBUG === 'true'
          : undefined,
      };
    }

    // Logging configuration
    if (process.env.LOG_LEVEL) {
      config.logging = {
        level: process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug',
        fileLogging: process.env.LOG_FILE_ENABLED
          ? process.env.LOG_FILE_ENABLED === 'true'
          : undefined,
        logFilePath: process.env.LOG_FILE_PATH,
        maxFileSize: process.env.LOG_MAX_FILE_SIZE
          ? parseInt(process.env.LOG_MAX_FILE_SIZE, 10)
          : undefined,
        maxFiles: process.env.LOG_MAX_FILES
          ? parseInt(process.env.LOG_MAX_FILES, 10)
          : undefined,
      };
    }

    // Health monitor configuration
    if (process.env.HEALTH_MONITOR_ENABLED !== undefined) {
      config.healthMonitor = {
        enabled: process.env.HEALTH_MONITOR_ENABLED === 'true',
        checkInterval: process.env.HEALTH_CHECK_INTERVAL
          ? parseInt(process.env.HEALTH_CHECK_INTERVAL, 10)
          : undefined,
        failureThreshold: process.env.HEALTH_FAILURE_THRESHOLD
          ? parseInt(process.env.HEALTH_FAILURE_THRESHOLD, 10)
          : undefined,
        timeout: process.env.HEALTH_CHECK_TIMEOUT
          ? parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10)
          : undefined,
      };
    }

    // Circuit breaker configuration
    if (process.env.CIRCUIT_BREAKER_ENABLED !== undefined) {
      config.circuitBreaker = {
        enabled: process.env.CIRCUIT_BREAKER_ENABLED === 'true',
        failureThreshold: process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD
          ? parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10)
          : undefined,
        successThreshold: process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD
          ? parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD, 10)
          : undefined,
        timeout: process.env.CIRCUIT_BREAKER_TIMEOUT
          ? parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10)
          : undefined,
      };
    }

    // Retry configuration
    if (process.env.RETRY_ENABLED !== undefined) {
      config.retry = {
        enabled: process.env.RETRY_ENABLED === 'true',
        maxAttempts: process.env.RETRY_MAX_ATTEMPTS
          ? parseInt(process.env.RETRY_MAX_ATTEMPTS, 10)
          : undefined,
        initialDelay: process.env.RETRY_INITIAL_DELAY
          ? parseInt(process.env.RETRY_INITIAL_DELAY, 10)
          : undefined,
        maxDelay: process.env.RETRY_MAX_DELAY
          ? parseInt(process.env.RETRY_MAX_DELAY, 10)
          : undefined,
        backoffMultiplier: process.env.RETRY_BACKOFF_MULTIPLIER
          ? parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER)
          : undefined,
      };
    }

    // Event translator configuration
    if (process.env.EVENT_TRANSLATOR_ENABLED !== undefined) {
      config.eventTranslator = {
        enabled: process.env.EVENT_TRANSLATOR_ENABLED === 'true',
        deduplicationWindow: process.env.EVENT_DEDUP_WINDOW
          ? parseInt(process.env.EVENT_DEDUP_WINDOW, 10)
          : undefined,
        maxQueueSize: process.env.EVENT_MAX_QUEUE_SIZE
          ? parseInt(process.env.EVENT_MAX_QUEUE_SIZE, 10)
          : undefined,
        processingDelay: process.env.EVENT_PROCESSING_DELAY
          ? parseInt(process.env.EVENT_PROCESSING_DELAY, 10)
          : undefined,
      };
    }

    return config;
  }

  /**
   * Merge two configurations (second overrides first)
   */
  private static mergeConfigs(
    base: PartialBridgeConfig,
    override: PartialBridgeConfig
  ): PartialBridgeConfig {
    return {
      unifi: { ...base.unifi, ...override.unifi },
      doordeck: { ...base.doordeck, ...override.doordeck },
      logging: { ...base.logging, ...override.logging },
      healthMonitor: { ...base.healthMonitor, ...override.healthMonitor },
      circuitBreaker: { ...base.circuitBreaker, ...override.circuitBreaker },
      retry: { ...base.retry, ...override.retry },
      eventTranslator: { ...base.eventTranslator, ...override.eventTranslator },
    };
  }

  /**
   * Apply default values to configuration
   */
  private static applyDefaults(config: PartialBridgeConfig): BridgeConfig {
    // Required fields validation is done in validator
    // Here we just apply defaults for optional fields

    const completeConfig: BridgeConfig = {
      unifi: {
        host: config.unifi?.host || '',
        ...DEFAULT_UNIFI_CONFIG,
        ...config.unifi,
      },
      doordeck: {
        email: config.doordeck?.email || '',
        password: config.doordeck?.password || '',
        ...DEFAULT_DOORDECK_CONFIG,
        ...config.doordeck,
      },
      logging: {
        ...DEFAULT_LOGGING_CONFIG,
        ...config.logging,
      },
      healthMonitor: {
        ...DEFAULT_HEALTH_MONITOR_CONFIG,
        ...config.healthMonitor,
      },
      circuitBreaker: {
        ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
        ...config.circuitBreaker,
      },
      retry: {
        ...DEFAULT_RETRY_CONFIG,
        ...config.retry,
      },
      eventTranslator: {
        ...DEFAULT_EVENT_TRANSLATOR_CONFIG,
        ...config.eventTranslator,
      },
    };

    return completeConfig;
  }
}
