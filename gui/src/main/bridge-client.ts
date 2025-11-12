/**
 * Bridge Service Client
 * Communicates with the UniFi-Doordeck Bridge REST API
 */

import https from 'https';
import http from 'http';
import type {
  ServiceHealth,
  Door,
  DoorMapping,
  LogEntry,
  UniFiConfig,
  DoordeckConfig,
} from '../shared/types';

const DEFAULT_API_URL = 'http://localhost:3000';

export class BridgeServiceClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(apiUrl: string = DEFAULT_API_URL, apiKey?: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Make HTTP request to bridge service
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = new URL(path, this.apiUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
      };

      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Service control
   */
  async startService(): Promise<void> {
    // Service is expected to be running or started manually
    // This could be extended to use Windows Service API
    throw new Error('Service control not yet implemented');
  }

  async stopService(): Promise<void> {
    throw new Error('Service control not yet implemented');
  }

  async restartService(): Promise<void> {
    throw new Error('Service control not yet implemented');
  }

  async getServiceStatus(): Promise<string> {
    try {
      const health = await this.getServiceHealth();
      return health.status;
    } catch (error) {
      return 'stopped';
    }
  }

  async getServiceHealth(): Promise<ServiceHealth> {
    return this.request<ServiceHealth>('GET', '/api/health');
  }

  /**
   * Door operations
   */
  async listDoors(): Promise<Door[]> {
    return this.request<Door[]>('GET', '/api/doors');
  }

  async discoverDoors(): Promise<Door[]> {
    return this.request<Door[]>('POST', '/api/doors/discover');
  }

  async unlockDoor(doorId: string): Promise<void> {
    await this.request('POST', `/api/doors/${doorId}/unlock`);
  }

  async mapDoor(mapping: DoorMapping): Promise<void> {
    await this.request('POST', '/api/mappings', mapping);
  }

  async unmapDoor(unifiDoorId: string): Promise<void> {
    await this.request('DELETE', `/api/mappings/${unifiDoorId}`);
  }

  /**
   * Logs
   */
  async getLogs(limit: number = 100): Promise<LogEntry[]> {
    return this.request<LogEntry[]>('GET', `/api/logs?limit=${limit}`);
  }

  async clearLogs(): Promise<void> {
    await this.request('DELETE', '/api/logs');
  }

  /**
   * Setup wizard testing
   */
  async testUniFiConnection(config: UniFiConfig): Promise<boolean> {
    try {
      const result = await this.request<{ success: boolean }>(
        'POST',
        '/api/test/unifi',
        config
      );
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async testDoordeckConnection(config: DoordeckConfig): Promise<boolean> {
    try {
      const result = await this.request<{ success: boolean }>(
        'POST',
        '/api/test/doordeck',
        config
      );
      return result.success;
    } catch (error) {
      return false;
    }
  }
}
