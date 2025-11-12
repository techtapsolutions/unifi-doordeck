/**
 * Configuration Manager
 * Handles reading and writing bridge configuration
 */

import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import type { BridgeConfig, ConfigValidationResult } from '../shared/types';

const CONFIG_FILE_NAME = 'config.json';

export class ConfigManager {
  private configPath: string;

  constructor() {
    // Store config in app data directory
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, CONFIG_FILE_NAME);
  }

  /**
   * Get current configuration
   */
  async getConfig(): Promise<BridgeConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Return default config if file doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.getDefaultConfig();
      }
      throw error;
    }
  }

  /**
   * Set configuration
   */
  async setConfig(config: Partial<BridgeConfig>): Promise<void> {
    // Merge with existing config
    const currentConfig = await this.getConfig();
    const newConfig = this.mergeConfig(currentConfig, config);

    // Validate before saving
    const validation = await this.validateConfig(newConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Write to file
    await fs.writeFile(this.configPath, JSON.stringify(newConfig, null, 2), 'utf8');
  }

  /**
   * Validate configuration
   */
  async validateConfig(config: Partial<BridgeConfig>): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // UniFi validation
    if (config.unifi) {
      if (!config.unifi.host) {
        errors.push('UniFi host is required');
      }

      const hasApiKey = !!config.unifi.apiKey;
      const hasUsernamePassword =
        !!config.unifi.username && !!config.unifi.password;

      if (!hasApiKey && !hasUsernamePassword) {
        errors.push(
          'UniFi authentication is required: either apiKey OR (username AND password)'
        );
      }
    } else {
      errors.push('UniFi configuration is required');
    }

    // Doordeck validation
    if (config.doordeck) {
      if (!config.doordeck.email) {
        errors.push('Doordeck email is required');
      } else if (!this.isValidEmail(config.doordeck.email)) {
        errors.push('Invalid Doordeck email format');
      }

      if (!config.doordeck.password) {
        errors.push('Doordeck password is required');
      }
    } else {
      errors.push('Doordeck configuration is required');
    }

    // Warnings
    if (config.security?.apiAuthEnabled === false) {
      warnings.push('API authentication is disabled - consider enabling for security');
    }

    if (config.logging?.level === 'debug') {
      warnings.push('Debug logging enabled - may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): BridgeConfig {
    return {
      unifi: {
        host: '',
        port: 443,
      },
      doordeck: {
        email: '',
        password: '',
      },
      logging: {
        level: 'info',
        fileLogging: true,
        maxFileSize: 10485760, // 10MB
        maxFiles: 5,
      },
      security: {
        apiAuthEnabled: true,
        autoMigrateCredentials: false,
        logSanitization: true,
      },
      server: {
        port: 3000,
        enabled: true,
      },
    };
  }

  /**
   * Deep merge two configurations
   */
  private mergeConfig(
    current: BridgeConfig,
    update: Partial<BridgeConfig>
  ): BridgeConfig {
    return {
      ...current,
      ...update,
      unifi: {
        ...current.unifi,
        ...update.unifi,
      },
      doordeck: {
        ...current.doordeck,
        ...update.doordeck,
      },
      logging: {
        ...current.logging,
        ...update.logging,
      },
      security: {
        ...current.security,
        ...update.security,
      },
      server: {
        ...current.server,
        ...update.server,
      },
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}
