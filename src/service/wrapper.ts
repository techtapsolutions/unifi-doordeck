/**
 * Windows Service Wrapper
 *
 * This module provides service lifecycle management for the UniFi-Doordeck Bridge
 * when running as a Windows Service.
 */

import { ConfigLoader } from '../config';
import { logger } from '../utils/logger';
import { BridgeService } from '../services/bridge';

/**
 * Service wrapper class
 */
export class ServiceWrapper {
  private bridgeService: BridgeService | null = null;
  private isShuttingDown = false;

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      logger.info('Windows Service starting...');

      // Load configuration
      const configPath = process.env.CONFIG_PATH || 'C:\\ProgramData\\UniFi-Doordeck-Bridge\\config.json';
      logger.info(`Loading configuration from: ${configPath}`);

      const config = ConfigLoader.loadConfig(configPath);
      logger.info('Configuration loaded successfully');

      // Create bridge service
      this.bridgeService = new BridgeService();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize and start bridge service
      await this.bridgeService.initialize(config);
      await this.bridgeService.start();

      logger.info('Windows Service started successfully');

      // Log statistics periodically
      setInterval(() => {
        if (!this.isShuttingDown && this.bridgeService) {
          const stats = this.bridgeService.getStats();
          logger.info('Bridge statistics:', {
            state: stats.state,
            activeMappings: stats.activeMappings,
            unlocksProcessed: stats.unlocksProcessed,
            eventsForwarded: stats.eventsForwarded,
            errors: stats.errors,
          });
        }
      }, 300000); // Every 5 minutes
    } catch (error) {
      logger.error('Failed to start service:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Service is already shutting down');
      return;
    }

    try {
      this.isShuttingDown = true;
      logger.info('Windows Service stopping...');

      if (this.bridgeService) {
        await this.bridgeService.stop();
        this.bridgeService = null;
      }

      logger.info('Windows Service stopped successfully');
    } catch (error) {
      logger.error('Error during service shutdown:', error);
      throw error;
    }
  }

  /**
   * Handle service restart
   */
  async restart(): Promise<void> {
    logger.info('Windows Service restarting...');
    await this.stop();
    await this.start();
  }

  /**
   * Set up event listeners for the bridge service
   */
  private setupEventListeners(): void {
    if (!this.bridgeService) {
      return;
    }

    this.bridgeService.on('started', () => {
      logger.info('Bridge service started event received');
    });

    this.bridgeService.on('stopped', () => {
      logger.info('Bridge service stopped event received');
    });

    this.bridgeService.on('error', (error) => {
      logger.error('Bridge service error:', error);
    });

    this.bridgeService.on('state-changed', ({ previous, current }) => {
      logger.info(`Bridge state transition: ${previous} → ${current}`);
    });

    this.bridgeService.on('doors-synced', (count) => {
      logger.info(`Door sync completed: ${count} doors`);
    });

    this.bridgeService.on('health-changed', ({ component, status, health }) => {
      logger.info(`Health status changed for ${component}: ${status}`, {
        message: health.message,
        consecutiveFailures: health.consecutiveFailures,
      });
    });
  }

  /**
   * Get current service status
   */
  getStatus(): {
    isRunning: boolean;
    bridgeState: string | null;
    uptime: number | null;
  } {
    return {
      isRunning: this.bridgeService !== null && !this.isShuttingDown,
      bridgeState: this.bridgeService?.getState() || null,
      uptime: this.bridgeService ? process.uptime() : null,
    };
  }
}

// Global service instance
const serviceWrapper = new ServiceWrapper();

// Handle Windows Service control signals
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal from Windows Service Manager');
  try {
    await serviceWrapper.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during SIGTERM shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  try {
    await serviceWrapper.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during SIGINT shutdown:', error);
    process.exit(1);
  }
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Try to shutdown gracefully
  serviceWrapper.stop().finally(() => {
    process.exit(1);
  });
});

// Start the service
serviceWrapper.start().catch((error) => {
  logger.error('Failed to start Windows Service:', error);
  process.exit(1);
});

export default serviceWrapper;
