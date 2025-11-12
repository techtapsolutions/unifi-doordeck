/**
 * Service REST API
 *
 * Provides a simple REST API for the Electron UI to communicate with the service.
 * Runs on localhost only for security.
 */

import express, { Request, Response } from 'express';
import { BridgeService } from '../services/bridge';
import { logger } from '../utils/logger';
import type { BridgeConfig } from '../config/types';
import * as fs from 'fs';

export class ServiceAPI {
  private app: express.Application;
  private server: any;
  private bridgeService: BridgeService;
  private config: BridgeConfig;

  constructor(bridgeService: BridgeService, config: BridgeConfig) {
    this.bridgeService = bridgeService;
    this.config = config;
    this.app = express();

    // Middleware
    this.app.use(express.json());

    // CORS for localhost only
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    // Setup routes
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (_req: Request, res: Response) => {
      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Service status
    this.app.get('/api/status', (_req: Request, res: Response) => {
      try {
        const state = this.bridgeService.getState();
        const stats = this.bridgeService.getStats();

        return res.json({
          state,
          running: state === 'running',
          stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error getting status:', error);
        return res.status(500).json({ error: 'Failed to get status' });
      }
    });

    // Get statistics
    this.app.get('/api/stats', (_req: Request, res: Response) => {
      try {
        const stats = this.bridgeService.getStats();
        return res.json(stats);
      } catch (error) {
        logger.error('Error getting stats:', error);
        return res.status(500).json({ error: 'Failed to get statistics' });
      }
    });

    // Get config file path
    this.app.get('/api/config/path', (_req: Request, res: Response) => {
      const configPath = process.env.CONFIG_PATH || 'C:\\ProgramData\\UniFi-Doordeck-Bridge\\config.json';
      return res.json({ path: configPath });
    });

    // Get recent logs
    this.app.get('/api/service/logs', (req: Request, res: Response) => {
      try {
        const lines = parseInt(req.query.lines as string) || 100;
        const logPath = this.config.logging?.logFilePath ||
                        'C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs\\bridge.log';

        if (!fs.existsSync(logPath)) {
          return res.json({ logs: [], message: 'No logs available yet' });
        }

        const logData = fs.readFileSync(logPath, 'utf8');
        const logLines = logData.split('\n').filter(line => line.trim());
        const recentLogs = logLines.slice(-lines);

        return res.json({ logs: recentLogs, total: logLines.length });
      } catch (error) {
        logger.error('Error reading logs:', error);
        return res.status(500).json({ error: 'Failed to read logs' });
      }
    });

    // Restart service (requires stopping and starting bridge)
    this.app.post('/api/service/restart', async (_req: Request, res: Response) => {
      try {
        logger.info('Restart requested via API');

        // Stop and start bridge
        await this.bridgeService.stop();

        // Reload config
        const configPath = process.env.CONFIG_PATH || 'C:\\ProgramData\\UniFi-Doordeck-Bridge\\config.json';
        const ConfigLoader = require('../config').ConfigLoader;
        const newConfig = ConfigLoader.loadConfig(configPath);

        await this.bridgeService.initialize(newConfig);
        await this.bridgeService.start();

        return res.json({
          success: true,
          message: 'Service restarted successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error restarting service:', error);
        return res.status(500).json({ error: 'Failed to restart service' });
      }
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      return res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.config.server?.port || 9090;
      const host = '127.0.0.1'; // Localhost only for security

      this.server = this.app.listen(port, host, () => {
        logger.info(`Service API listening on http://${host}:${port}`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${port} is already in use`);
          reject(new Error(`Port ${port} is already in use`));
        } else {
          logger.error('Service API error:', error);
          reject(error);
        }
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Service API stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
