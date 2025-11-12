import { BridgeConfig } from './types';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate bridge configuration
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: Partial<BridgeConfig>): ValidationResult {
  const errors: string[] = [];

  // Validate UniFi configuration
  if (!config.unifi) {
    errors.push('UniFi configuration is required');
  } else {
    if (!config.unifi.host) {
      errors.push('UniFi host is required');
    } else if (!isValidHostOrIP(config.unifi.host)) {
      errors.push(`Invalid UniFi host: ${config.unifi.host}`);
    }

    // Require EITHER apiKey OR (username AND password)
    const hasApiKey = !!config.unifi.apiKey;
    const hasUsernamePassword = !!config.unifi.username && !!config.unifi.password;

    if (!hasApiKey && !hasUsernamePassword) {
      errors.push('UniFi authentication is required: either apiKey OR (username AND password)');
    }

    // If using username/password, both must be provided
    if (!hasApiKey && config.unifi.username && !config.unifi.password) {
      errors.push('UniFi password is required when using username authentication');
    }

    if (!hasApiKey && !config.unifi.username && config.unifi.password) {
      errors.push('UniFi username is required when using password authentication');
    }

    if (config.unifi.port !== undefined) {
      if (!Number.isInteger(config.unifi.port) || config.unifi.port < 1 || config.unifi.port > 65535) {
        errors.push(`Invalid UniFi port: ${config.unifi.port} (must be 1-65535)`);
      }
    }

    if (config.unifi.reconnectDelay !== undefined && config.unifi.reconnectDelay < 0) {
      errors.push(`Invalid UniFi reconnect delay: ${config.unifi.reconnectDelay} (must be >= 0)`);
    }

    if (config.unifi.maxRetries !== undefined) {
      if (!Number.isInteger(config.unifi.maxRetries) || config.unifi.maxRetries < 0) {
        errors.push(`Invalid UniFi max retries: ${config.unifi.maxRetries} (must be >= 0)`);
      }
    }
  }

  // Validate Doordeck configuration
  if (!config.doordeck) {
    errors.push('Doordeck configuration is required');
  } else {
    // Email and password are required for Fusion API login
    if (!config.doordeck.email) {
      errors.push('Doordeck email is required');
    } else if (!isValidEmail(config.doordeck.email)) {
      errors.push(`Invalid Doordeck email: ${config.doordeck.email}`);
    }

    if (!config.doordeck.password) {
      errors.push('Doordeck password is required');
    }

    // apiToken and refreshToken are optional (generated from login)
  }

  // Validate logging configuration
  if (config.logging) {
    if (config.logging.level) {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      if (!validLevels.includes(config.logging.level)) {
        errors.push(
          `Invalid log level: ${config.logging.level} (must be one of: ${validLevels.join(', ')})`
        );
      }
    }

    if (config.logging.maxFileSize !== undefined && config.logging.maxFileSize <= 0) {
      errors.push(`Invalid max file size: ${config.logging.maxFileSize} (must be > 0)`);
    }

    if (config.logging.maxFiles !== undefined) {
      if (!Number.isInteger(config.logging.maxFiles) || config.logging.maxFiles < 1) {
        errors.push(`Invalid max files: ${config.logging.maxFiles} (must be >= 1)`);
      }
    }
  }

  // Validate health monitor configuration
  if (config.healthMonitor) {
    if (config.healthMonitor.checkInterval !== undefined && config.healthMonitor.checkInterval <= 0) {
      errors.push(
        `Invalid health check interval: ${config.healthMonitor.checkInterval} (must be > 0)`
      );
    }

    if (config.healthMonitor.failureThreshold !== undefined) {
      if (
        !Number.isInteger(config.healthMonitor.failureThreshold) ||
        config.healthMonitor.failureThreshold < 1
      ) {
        errors.push(
          `Invalid health failure threshold: ${config.healthMonitor.failureThreshold} (must be >= 1)`
        );
      }
    }

    if (config.healthMonitor.timeout !== undefined && config.healthMonitor.timeout <= 0) {
      errors.push(`Invalid health check timeout: ${config.healthMonitor.timeout} (must be > 0)`);
    }
  }

  // Validate circuit breaker configuration
  if (config.circuitBreaker) {
    if (config.circuitBreaker.failureThreshold !== undefined) {
      if (
        !Number.isInteger(config.circuitBreaker.failureThreshold) ||
        config.circuitBreaker.failureThreshold < 1
      ) {
        errors.push(
          `Invalid circuit breaker failure threshold: ${config.circuitBreaker.failureThreshold} (must be >= 1)`
        );
      }
    }

    if (config.circuitBreaker.successThreshold !== undefined) {
      if (
        !Number.isInteger(config.circuitBreaker.successThreshold) ||
        config.circuitBreaker.successThreshold < 1
      ) {
        errors.push(
          `Invalid circuit breaker success threshold: ${config.circuitBreaker.successThreshold} (must be >= 1)`
        );
      }
    }

    if (config.circuitBreaker.timeout !== undefined && config.circuitBreaker.timeout <= 0) {
      errors.push(
        `Invalid circuit breaker timeout: ${config.circuitBreaker.timeout} (must be > 0)`
      );
    }
  }

  // Validate retry configuration
  if (config.retry) {
    if (config.retry.maxAttempts !== undefined) {
      if (!Number.isInteger(config.retry.maxAttempts) || config.retry.maxAttempts < 1) {
        errors.push(`Invalid retry max attempts: ${config.retry.maxAttempts} (must be >= 1)`);
      }
    }

    if (config.retry.initialDelay !== undefined && config.retry.initialDelay <= 0) {
      errors.push(`Invalid retry initial delay: ${config.retry.initialDelay} (must be > 0)`);
    }

    if (config.retry.maxDelay !== undefined && config.retry.maxDelay <= 0) {
      errors.push(`Invalid retry max delay: ${config.retry.maxDelay} (must be > 0)`);
    }

    if (config.retry.backoffMultiplier !== undefined && config.retry.backoffMultiplier <= 0) {
      errors.push(
        `Invalid retry backoff multiplier: ${config.retry.backoffMultiplier} (must be > 0)`
      );
    }

    if (
      config.retry.initialDelay !== undefined &&
      config.retry.maxDelay !== undefined &&
      config.retry.initialDelay > config.retry.maxDelay
    ) {
      errors.push(
        `Retry initial delay (${config.retry.initialDelay}) cannot be greater than max delay (${config.retry.maxDelay})`
      );
    }
  }

  // Validate event translator configuration
  if (config.eventTranslator) {
    if (
      config.eventTranslator.deduplicationWindow !== undefined &&
      config.eventTranslator.deduplicationWindow < 0
    ) {
      errors.push(
        `Invalid deduplication window: ${config.eventTranslator.deduplicationWindow} (must be >= 0)`
      );
    }

    if (config.eventTranslator.maxQueueSize !== undefined) {
      if (
        !Number.isInteger(config.eventTranslator.maxQueueSize) ||
        config.eventTranslator.maxQueueSize < 1
      ) {
        errors.push(
          `Invalid max queue size: ${config.eventTranslator.maxQueueSize} (must be >= 1)`
        );
      }
    }

    if (
      config.eventTranslator.processingDelay !== undefined &&
      config.eventTranslator.processingDelay < 0
    ) {
      errors.push(
        `Invalid processing delay: ${config.eventTranslator.processingDelay} (must be >= 0)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate if string is a valid hostname or IP address
 */
function isValidHostOrIP(host: string): boolean {
  // Check if it's a valid IP address (simple check)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(host)) {
    // Validate each octet is 0-255
    const octets = host.split('.').map(Number);
    return octets.every((octet) => octet >= 0 && octet <= 255);
  }

  // Check if it's a valid hostname
  const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/;
  return hostnameRegex.test(host);
}

/**
 * Validate if string is a valid email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
