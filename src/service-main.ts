/**
 * Windows Service Entry Point
 *
 * This is the main entry point for the UniFi-Doordeck Bridge when running as a Windows Service.
 * It does NOT include the web server - that's part of the Electron UI.
 */

import { ConfigLoader } from './config';
import { logger } from './utils/logger';
import { BridgeService } from './services/bridge';
import { ServiceAPI } from './service/service-api';
import { ConfigWatcher } from './service/config-watcher';

// Global service instances
let bridgeService: BridgeService | null = null;
let serviceAPI: ServiceAPI | null = null;
let configWatcher: ConfigWatcher | null = null;
let isShuttingDown = false;

async function main() {
  try {
    logger.info('Starting UniFi-Doordeck Bridge Service...');

    // Load configuration from file
    const configPath = process.env.CONFIG_PATH || 'C:\\ProgramData\\UniFi-Doordeck-Bridge\\config.json';
    logger.info(`Loading configuration from: ${configPath}`);

    const config = ConfigLoader.loadConfig(configPath);
    logger.info('Configuration loaded successfully');

    // Create bridge service
    bridgeService = new BridgeService();

    // Set up event listeners
    setupEventListeners();

    // Initialize and start bridge service
    await bridgeService.initialize(config);
    await bridgeService.start();

    logger.info('Bridge service started successfully');

    // Start REST API for UI communication
    serviceAPI = new ServiceAPI(bridgeService, config);
    await serviceAPI.start();

    const apiPort = config.server?.port || 9090;
    logger.info(`Service API started on http://127.0.0.1:${apiPort}`);

    // Start config file watcher for hot-reload
    configWatcher = new ConfigWatcher(configPath, async (newConfig) => {
      logger.info('Configuration file changed, reloading...');
      try {
        await bridgeService?.stop();
        await bridgeService?.initialize(newConfig);
        await bridgeService?.start();
        logger.info('Configuration reloaded successfully');
      } catch (error) {
        logger.error('Failed to reload configuration:', error);
      }
    });

    configWatcher.start();
    logger.info('Configuration file watcher started');

    // Log statistics periodically
    setInterval(() => {
      if (!isShuttingDown && bridgeService) {
        const stats = bridgeService.getStats();
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
    process.exit(1);
  }
}

function setupEventListeners() {
  if (!bridgeService) return;

  bridgeService.on('started', () => {
    logger.info('Bridge service started event received');
  });

  bridgeService.on('stopped', () => {
    logger.info('Bridge service stopped event received');
  });

  bridgeService.on('error', (error) => {
    logger.error('Bridge service error:', error);
  });

  bridgeService.on('state-changed', ({ previous, current }) => {
    logger.info(`Bridge state transition: ${previous} → ${current}`);
  });

  bridgeService.on('doors-synced', (count) => {
    logger.info(`Door sync completed: ${count} doors`);
  });

  bridgeService.on('health-changed', ({ component, status, health }) => {
    logger.info(`Health status changed for ${component}: ${status}`, {
      message: health.message,
      consecutiveFailures: health.consecutiveFailures,
    });
  });
}

// Handle graceful shutdown
async function shutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal} signal, shutting down gracefully...`);

  try {
    // Stop config watcher
    if (configWatcher) {
      configWatcher.stop();
      logger.info('Config watcher stopped');
    }

    // Stop REST API
    if (serviceAPI) {
      await serviceAPI.stop();
      logger.info('Service API stopped');
    }

    // Stop bridge service
    if (bridgeService) {
      await bridgeService.stop();
      logger.info('Bridge service stopped');
    }

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

// Start the service
main();
