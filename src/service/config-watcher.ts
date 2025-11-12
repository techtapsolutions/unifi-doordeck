/**
 * Configuration File Watcher
 *
 * Watches the configuration file for changes and triggers reload.
 * Implements debouncing to avoid thrashing on rapid changes.
 */

import * as fs from 'fs';
import { logger } from '../utils/logger';
import type { BridgeConfig } from '../config/types';

export class ConfigWatcher {
  private configPath: string;
  private watcher: fs.FSWatcher | null = null;
  private onChange: (config: BridgeConfig) => Promise<void>;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number = 1000;

  constructor(
    configPath: string,
    onChange: (config: BridgeConfig) => Promise<void>,
    debounceMs: number = 1000
  ) {
    this.configPath = configPath;
    this.onChange = onChange;
    this.debounceMs = debounceMs;
  }

  public start(): void {
    try {
      // Ensure config file exists
      if (!fs.existsSync(this.configPath)) {
        logger.warn(`Config file does not exist: ${this.configPath}`);
        return;
      }

      // Watch for changes
      this.watcher = fs.watch(this.configPath, (eventType) => {
        if (eventType === 'change') {
          this.handleChange();
        }
      });

      logger.info(`Watching config file for changes: ${this.configPath}`);
    } catch (error) {
      logger.error('Failed to start config watcher:', error);
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      logger.info('Config file watcher stopped');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private handleChange(): void {
    // Debounce rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.reloadConfig();
    }, this.debounceMs);
  }

  private async reloadConfig(): Promise<void> {
    try {
      logger.info('Config file changed, reloading...');

      // Read and parse new config
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const newConfig = JSON.parse(configData) as BridgeConfig;

      // Validate basic structure
      if (!newConfig.unifi || !newConfig.doordeck) {
        logger.error('Invalid configuration structure');
        return;
      }

      // Trigger reload callback
      await this.onChange(newConfig);

      logger.info('Configuration reloaded successfully');
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error('Configuration file has invalid JSON syntax:', error.message);
      } else {
        logger.error('Failed to reload configuration:', error);
      }
    }
  }
}
