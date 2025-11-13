/**
 * UniFi-Doordeck Bridge Service
 * HTTP server that handles webhook events and door control
 */

import * as http from 'http';
import * as crypto from 'crypto';
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  BridgeConfig,
  ServiceHealth,
  LogEntry,
} from '../shared/types';
import {
  testUniFiConnection,
  testDoordeckConnection,
  discoverUniFiDoors,
  unlockUniFiDoor,
} from '../main/connection-testers';
import { getMappingByDoordeckLockId } from '../main/door-mapping-store';

// Service configuration
const PORT = 34512;
const CONFIG_DIR = process.env.APPDATA
  ? join(process.env.APPDATA, 'unifi-doordeck-bridge-gui')
  : join(process.env.HOME || '', '.unifi-doordeck-bridge-gui');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const LOG_DIR = join(CONFIG_DIR, 'logs');
const LOG_FILE = join(LOG_DIR, 'service.log');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Service state
let config: BridgeConfig | null = null;
let unifiConnected = false;
let doordeckConnected = false;
const startTime = Date.now();
const logs: LogEntry[] = [];

/**
 * Log message to file and memory
 */
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const argStr = args.length > 0 ? ' ' + JSON.stringify(args) : '';
  const logMessage = `${timestamp} [${level}] ${message}${argStr}\n`;

  // Write to file
  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }

  // Also output to console
  console.log(logMessage.trim());

  // Store in memory (keep last 100 entries)
  logs.push({
    timestamp,
    level: level.toLowerCase() as 'info' | 'warn' | 'error',
    message,
    metadata: args.length > 0 ? args[0] : undefined,
  });
  if (logs.length > 100) {
    logs.shift();
  }
}

/**
 * Load configuration from file
 */
function loadConfig(): BridgeConfig | null {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    log('ERROR', 'Failed to load config:', error);
  }
  return null;
}

/**
 * Test connections periodically
 */
async function updateConnectionStatus() {
  if (!config) {
    config = loadConfig();
  }

  if (config) {
    // Test UniFi
    if (config.unifi?.host && config.unifi?.apiKey) {
      const result = await testUniFiConnection(config.unifi);
      unifiConnected = result.success;
    } else {
      unifiConnected = false;
    }

    // Test Doordeck
    if (config.doordeck?.email && config.doordeck?.password) {
      const result = await testDoordeckConnection(config.doordeck);
      doordeckConnected = result.success;
    } else {
      doordeckConnected = false;
    }
  }
}

/**
 * Read request body as JSON, returning both raw and parsed body
 */
function readRequestBody(req: http.IncomingMessage): Promise<{ raw: string; parsed: any }> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve({ raw: body, parsed });
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    log('WARN', '[Webhook] No signature provided in request');
    return false;
  }

  try {
    // Remove any prefix like "sha256=" if present
    const sig = signature.replace(/^sha256=/, '');

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      log('WARN', '[Webhook] Signature length mismatch');
      return false;
    }

    const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      log('WARN', '[Webhook] Signature verification failed');
    }

    return isValid;
  } catch (error) {
    log('ERROR', '[Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * HTTP request handler
 */
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || '/';
  const method = req.method || 'GET';

  log('INFO', `${method} ${url}`);

  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health check
    if (url === '/health' && method === 'GET') {
      const health: ServiceHealth = {
        status: 'running',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        unifiConnected,
        doordeckConnected,
        doorsMonitored: 0, // TODO: Track monitored doors
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Status check
    if (url === '/status' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'running' }));
      return;
    }

    // List doors
    if (url === '/doors' && method === 'GET') {
      if (!config?.unifi) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'UniFi not configured' }));
        return;
      }

      const result = await discoverUniFiDoors(config.unifi);
      if (result.success && result.doors) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.doors));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error || 'Failed to discover doors' }));
      }
      return;
    }

    // Discover doors
    if (url === '/doors/discover' && method === 'POST') {
      if (!config?.unifi) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'UniFi not configured' }));
        return;
      }

      const result = await discoverUniFiDoors(config.unifi);
      if (result.success && result.doors) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.doors));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error || 'Failed to discover doors' }));
      }
      return;
    }

    // Unlock door
    if (url.startsWith('/doors/') && url.endsWith('/unlock') && method === 'POST') {
      const doorId = url.split('/')[2];

      if (!config?.unifi) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'UniFi not configured' }));
        return;
      }

      log('INFO', `Unlocking door: ${doorId}`);
      const result = await unlockUniFiDoor(config.unifi, doorId);

      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error || 'Failed to unlock door' }));
      }
      return;
    }

    // Get logs
    if (url.startsWith('/logs') && method === 'GET') {
      const urlObj = new URL(url, `http://localhost:${PORT}`);
      const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
      const recentLogs = logs.slice(-limit);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(recentLogs));
      return;
    }

    // Clear logs
    if (url === '/logs' && method === 'DELETE') {
      logs.length = 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Doordeck webhook endpoint
    if (url === '/webhook/doordeck' && method === 'POST') {
      try {
        const { raw: rawBody, parsed: body } = await readRequestBody(req);

        log('INFO', '[Webhook] Received Doordeck webhook', body);

        // Verify signature if webhook secret is configured
        if (config?.webhook?.verifySignature !== false && config?.webhook?.secret) {
          const signature = req.headers['x-doordeck-signature'] as string | undefined;

          if (!verifyWebhookSignature(rawBody, signature, config.webhook.secret)) {
            log('ERROR', '[Webhook] Signature verification failed - rejecting webhook');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid signature' }));
            return;
          }

          log('INFO', '[Webhook] Signature verified successfully');
        } else if (!config?.webhook?.secret) {
          log('WARN', '[Webhook] No webhook secret configured - signature verification skipped');
        }

        // Validate webhook payload
        if (!body || !body.event) {
          log('ERROR', '[Webhook] Invalid webhook payload - missing event');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid webhook payload' }));
          return;
        }

        // Process unlock event
        if (body.event === 'door.unlock' || body.event === 'lock.unlock') {
          const lockId = body.lock?.id || body.lockId;
          const userName = body.user?.name || body.userName || 'Unknown';

          if (!lockId) {
            log('ERROR', '[Webhook] Unlock event missing lock ID');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing lock ID' }));
            return;
          }

          log('INFO', `[Webhook] Processing unlock request for lock: ${lockId}, user: ${userName}`);

          // Look up mapped UniFi door using door mapping store
          const mapping = await getMappingByDoordeckLockId(lockId);

          if (!mapping) {
            log('ERROR', `[Webhook] No door mapping found for Doordeck lock: ${lockId}`);
            log('INFO', '[Webhook] Please create a door mapping in the GUI (Settings > Door Mappings)');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'No door mapping found',
              lockId,
              message: 'Please map this Doordeck lock to a UniFi door in the application settings'
            }));
            return;
          }

          const unifiDoorId = mapping.unifiDoorId;
          log('INFO', `[Webhook] Mapped Doordeck lock ${lockId} to UniFi door ${unifiDoorId} (${mapping.unifiDoorName})`);

          if (!config?.unifi) {
            log('ERROR', '[Webhook] UniFi not configured');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'UniFi not configured' }));
            return;
          }

          // Execute unlock
          const result = await unlockUniFiDoor(config.unifi, unifiDoorId);

          if (result.success) {
            log('INFO', `[Webhook] Successfully unlocked door ${mapping.unifiDoorName} (${unifiDoorId}) for user ${userName}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Door unlocked',
              doorName: mapping.unifiDoorName,
              doorId: unifiDoorId
            }));
          } else {
            log('ERROR', `[Webhook] Failed to unlock door ${mapping.unifiDoorName} (${unifiDoorId}):`, result.error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: result.error || 'Failed to unlock door' }));
          }
        } else {
          // Acknowledge other event types
          log('INFO', `[Webhook] Received event type: ${body.event} (not processed)`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Event received' }));
        }
      } catch (error) {
        log('ERROR', '[Webhook] Error processing webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error instanceof Error ? error.message : 'Webhook processing failed'
        }));
      }
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    log('ERROR', 'Request handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }));
  }
}

/**
 * Start the service
 */
function startService() {
  log('INFO', '='.repeat(60));
  log('INFO', 'UniFi-Doordeck Bridge Service Starting');
  log('INFO', `Version: 0.1.0`);
  log('INFO', `Port: ${PORT}`);
  log('INFO', `Config: ${CONFIG_FILE}`);
  log('INFO', `Logs: ${LOG_FILE}`);
  log('INFO', '='.repeat(60));

  // Load configuration
  config = loadConfig();
  if (!config) {
    log('WARN', 'No configuration found - service will wait for configuration');
  } else {
    log('INFO', 'Configuration loaded successfully');
  }

  // Start HTTP server
  const server = http.createServer(handleRequest);

  server.listen(PORT, () => {
    log('INFO', `Bridge service listening on port ${PORT}`);
    log('INFO', 'Service ready to accept requests');
  });

  // Update connection status every 30 seconds
  setInterval(updateConnectionStatus, 30000);
  updateConnectionStatus(); // Initial check

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('INFO', 'Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      log('INFO', 'Service stopped');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('INFO', 'Received SIGINT, shutting down gracefully...');
    server.close(() => {
      log('INFO', 'Service stopped');
      process.exit(0);
    });
  });
}

// Start the service
startService();
