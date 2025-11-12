import { ConfigLoader } from './config';
import { logger } from './utils/logger';
import { BridgeService } from './services/bridge';
import { WebServer } from './services/web';

// Global service instances
let bridgeService: BridgeService | null = null;
let webServer: WebServer | null = null;

async function main() {
  try {
    logger.info('Starting UniFi-Doordeck Bridge...');

    // Load configuration from file or environment
    const configPath = process.env.CONFIG_PATH || './config.json';
    const config = ConfigLoader.loadConfig(configPath);
    logger.info('Configuration loaded successfully');

    // Create bridge service
    bridgeService = new BridgeService();

    // Set up event listeners
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

    // Initialize and start bridge service
    await bridgeService.initialize(config);
    await bridgeService.start();

    logger.info('UniFi-Doordeck Bridge started successfully');

    // Start web interface
    webServer = new WebServer(config);

    // Provide status callback to web server
    webServer.setStatusCallback(() => {
      const stats = bridgeService?.getStats();
      return {
        service: 'running',
        unifi: stats?.state === 'running' ? 'connected' : 'disconnected',
        doordeck: stats?.state === 'running' ? 'connected' : 'disconnected',
        stats: stats
      };
    });

    await webServer.start();
    logger.info('Web interface available at http://localhost:' + (config.server?.port || 3000));

    // Log statistics periodically
    setInterval(() => {
      const stats = bridgeService?.getStats();
      if (stats) {
        logger.info('Bridge statistics:', {
          state: stats.state,
          activeMappings: stats.activeMappings,
          unlocksProcessed: stats.unlocksProcessed,
          eventsForwarded: stats.eventsForwarded,
          errors: stats.errors,
        });
      }
    }, 60000); // Every minute
  } catch (error) {
    logger.error('Failed to start bridge:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  if (webServer) {
    await webServer.stop();
  }
  if (bridgeService) {
    await bridgeService.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  if (webServer) {
    await webServer.stop();
  }
  if (bridgeService) {
    await bridgeService.stop();
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the application
main();
