import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { requireApiAuth, optionalApiAuth, getApiKey } from '../../security/ApiAuth';
import { sanitizeObject } from '../../security/LogSanitizer';
import type { BridgeConfig } from '../../config/types';

export class WebServer {
    private app: express.Application;
    private server: any;
    private config: BridgeConfig;
    private statusCallback?: () => any;

    constructor(config: BridgeConfig) {
        this.config = config;
        this.app = express();

        // Middleware
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../../../ui')));

        // Setup routes
        this.setupRoutes();
    }

    /**
     * Set callback to get current service status
     */
    public setStatusCallback(callback: () => any): void {
        this.statusCallback = callback;
    }

    /**
     * Setup API routes
     */
    private setupRoutes(): void {
        // Health check (no auth required)
        this.app.get('/api/health', (_req: Request, res: Response) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Get API key (authenticated endpoint)
        this.app.get('/api/auth/key', requireApiAuth(), async (_req: Request, res: Response) => {
            try {
                const apiKey = await getApiKey();
                res.json({ apiKey });
            } catch (error) {
                logger.error('Error getting API key:', error);
                res.status(500).json({ error: 'Failed to get API key' });
            }
        });

        // Get current configuration (requires auth)
        this.app.get('/api/config', requireApiAuth(), (_req: Request, res: Response) => {
            try {
                const configPath = this.getConfigPath();
                if (!fs.existsSync(configPath)) {
                    return res.status(404).json({ error: 'Configuration file not found' });
                }

                const configData = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(configData);

                // Sanitize configuration before sending (removes all sensitive data)
                const sanitizedConfig = sanitizeObject(config);

                return res.json(sanitizedConfig);
            } catch (error) {
                logger.error('Error reading config:', error);
                return res.status(500).json({ error: 'Failed to read configuration' });
            }
        });

        // Update configuration (requires auth)
        this.app.post('/api/config', requireApiAuth(), (req: Request, res: Response) => {
            try {
                const newConfig = req.body;

                // Validate required fields
                if (!newConfig.unifi?.host || !newConfig.unifi?.username) {
                    return res.status(400).json({ error: 'UniFi host and username are required' });
                }

                if (!newConfig.doordeck?.apiKey) {
                    return res.status(400).json({ error: 'Doordeck API key is required' });
                }

                // Read existing config to preserve passwords if they're masked
                const configPath = this.getConfigPath();
                let existingConfig: any = {};

                if (fs.existsSync(configPath)) {
                    const configData = fs.readFileSync(configPath, 'utf8');
                    existingConfig = JSON.parse(configData);
                }

                // Preserve masked passwords
                if (newConfig.unifi?.password === '••••••••' && existingConfig.unifi?.password) {
                    newConfig.unifi.password = existingConfig.unifi.password;
                }
                if (newConfig.doordeck?.secretKey === '••••••••' && existingConfig.doordeck?.secretKey) {
                    newConfig.doordeck.secretKey = existingConfig.doordeck.secretKey;
                }

                // Write config
                fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
                logger.info('Configuration updated via web interface');

                return res.json({ success: true, message: 'Configuration saved' });
            } catch (error) {
                logger.error('Error saving config:', error);
                return res.status(500).json({ error: 'Failed to save configuration' });
            }
        });

        // Get service status (requires auth)
        this.app.get('/api/status', requireApiAuth(), (_req: Request, res: Response) => {
            try {
                if (this.statusCallback) {
                    const status = this.statusCallback();
                    return res.json(status);
                } else {
                    return res.json({
                        service: 'running',
                        unifi: 'unknown',
                        doordeck: 'unknown'
                    });
                }
            } catch (error) {
                logger.error('Error getting status:', error);
                return res.status(500).json({ error: 'Failed to get status' });
            }
        });

        // Service control endpoints (require auth)
        this.app.post('/api/service/start', requireApiAuth(), (_req: Request, res: Response) => {
            return res.json({ message: 'Use Windows Service Manager to start the service' });
        });

        this.app.post('/api/service/stop', requireApiAuth(), (_req: Request, res: Response) => {
            return res.json({ message: 'Use Windows Service Manager to stop the service' });
        });

        this.app.post('/api/service/restart', requireApiAuth(), (_req: Request, res: Response) => {
            return res.json({ message: 'Use Windows Service Manager to restart the service' });
        });

        // Test connections (requires auth)
        this.app.get('/api/test', requireApiAuth(), async (_req: Request, res: Response) => {
            // TODO: Implement actual connection testing
            return res.json({
                unifi: true,
                doordeck: true,
                message: 'Connection test not yet implemented'
            });
        });

        // Get logs (requires auth)
        this.app.get('/api/logs', requireApiAuth(), (req: Request, res: Response) => {
            try {
                const lines = parseInt(req.query.lines as string) || 100;
                const logPath = this.config.logging?.logFilePath ||
                                'C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs\\bridge.log';

                if (!fs.existsSync(logPath)) {
                    return res.send('No logs available yet');
                }

                // Read log file
                const logData = fs.readFileSync(logPath, 'utf8');
                const logLines = logData.split('\n');
                const recentLogs = logLines.slice(-lines).join('\n');

                return res.send(recentLogs);
            } catch (error) {
                logger.error('Error reading logs:', error);
                return res.status(500).send('Failed to read logs');
            }
        });

        // Serve index.html for all other routes (SPA)
        this.app.get('*', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../../../ui/index.html'));
        });
    }

    /**
     * Get configuration file path
     */
    private getConfigPath(): string {
        // Check for config in multiple locations
        const paths = [
            'C:\\ProgramData\\UniFi-Doordeck-Bridge\\config.json',
            path.join(process.cwd(), 'config.json'),
            path.join(__dirname, '../../../config.json')
        ];

        for (const configPath of paths) {
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        // Default to ProgramData location
        return paths[0];
    }

    /**
     * Start the web server
     */
    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            const port = this.config.server?.port || 3000;

            this.server = this.app.listen(port, () => {
                logger.info(`Web interface started on http://localhost:${port}`);
                resolve();
            });

            this.server.on('error', (error: any) => {
                if (error.code === 'EADDRINUSE') {
                    logger.error(`Port ${port} is already in use`);
                    reject(new Error(`Port ${port} is already in use`));
                } else {
                    logger.error('Web server error:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Stop the web server
     */
    public async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('Web interface stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
