/**
 * Connection Testers for Setup Wizard
 * Tests UniFi and Doordeck connections without requiring the bridge service
 */

import https from 'https';
import { readFileSync } from 'fs';
import type { UniFiConfig, DoordeckConfig } from '../shared/types';

/**
 * Test UniFi Access controller connection
 */
export async function testUniFiConnection(config: UniFiConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate required fields
    if (!config.host) {
      return { success: false, error: 'Host is required' };
    }

    if (config.apiKey) {
      // Test API key authentication
      return await testUniFiWithAPIKey(config);
    } else if (config.username && config.password) {
      // Test username/password authentication
      return await testUniFiWithPassword(config);
    } else {
      return { success: false, error: 'Either API key or username/password is required' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

/**
 * Test UniFi with API key
 */
async function testUniFiWithAPIKey(config: UniFiConfig): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Create HTTPS agent
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: !config.skipSSLVerification, // Skip verification if requested
    };

    // Load custom CA certificate if provided (ignored if skipSSLVerification is true)
    if (config.caCertPath && !config.skipSSLVerification) {
      try {
        const ca = readFileSync(config.caCertPath);
        agentOptions.ca = ca;
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to load CA certificate: ${error instanceof Error ? error.message : String(error)}`,
        });
        return;
      }
    }

    const agent = new https.Agent(agentOptions);
    const port = config.port || 443;

    // Test connection by fetching devices (minimal API call)
    const options: https.RequestOptions = {
      hostname: config.host,
      port,
      path: '/proxy/access/api/v2/device',
      method: 'GET',
      headers: {
        'X-API-KEY': config.apiKey!,
        'Accept': 'application/json',
      },
      agent,
      timeout: 10000, // 10 second timeout
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({
            success: false,
            error: 'Authentication failed. Please check your API key.',
          });
        } else {
          resolve({
            success: false,
            error: `HTTP ${res.statusCode}: ${data}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      if (error.message.includes('ECONNREFUSED')) {
        resolve({
          success: false,
          error: `Cannot connect to ${config.host}:${port}. Please check the host and port.`,
        });
      } else if (error.message.includes('ETIMEDOUT')) {
        resolve({
          success: false,
          error: 'Connection timed out. Please check your network connection.',
        });
      } else if (error.message.includes('CERT')) {
        resolve({
          success: false,
          error: 'SSL certificate verification failed. If using self-signed certificates, provide a CA certificate path.',
        });
      } else {
        resolve({
          success: false,
          error: error.message,
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timed out after 10 seconds.',
      });
    });

    req.end();
  });
}

/**
 * Test UniFi with username/password
 */
async function testUniFiWithPassword(config: UniFiConfig): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Create HTTPS agent
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: !config.skipSSLVerification, // Skip verification if requested
    };

    // Load custom CA certificate if provided (ignored if skipSSLVerification is true)
    if (config.caCertPath && !config.skipSSLVerification) {
      try {
        const ca = readFileSync(config.caCertPath);
        agentOptions.ca = ca;
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to load CA certificate: ${error instanceof Error ? error.message : String(error)}`,
        });
        return;
      }
    }

    const agent = new https.Agent(agentOptions);
    const port = config.port || 443;

    // Attempt login
    const loginData = JSON.stringify({
      username: config.username,
      password: config.password,
    });

    const options: https.RequestOptions = {
      hostname: config.host,
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
      },
      agent,
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else if (res.statusCode === 400 || res.statusCode === 401) {
          resolve({
            success: false,
            error: 'Invalid username or password.',
          });
        } else {
          resolve({
            success: false,
            error: `HTTP ${res.statusCode}: ${data}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      if (error.message.includes('ECONNREFUSED')) {
        resolve({
          success: false,
          error: `Cannot connect to ${config.host}:${port}. Please check the host and port.`,
        });
      } else if (error.message.includes('ETIMEDOUT')) {
        resolve({
          success: false,
          error: 'Connection timed out. Please check your network connection.',
        });
      } else if (error.message.includes('CERT')) {
        resolve({
          success: false,
          error: 'SSL certificate verification failed. If using self-signed certificates, provide a CA certificate path.',
        });
      } else {
        resolve({
          success: false,
          error: error.message,
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timed out after 10 seconds.',
      });
    });

    req.write(loginData);
    req.end();
  });
}

/**
 * Test Doordeck Cloud connection
 */
export async function testDoordeckConnection(config: DoordeckConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate required fields
    if (!config.email || !config.password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Test by attempting to get auth token
    return new Promise((resolve) => {
      const loginData = JSON.stringify({
        email: config.email,
        password: config.password,
      });

      const options: https.RequestOptions = {
        hostname: 'api.doordeck.com',
        port: 443,
        path: '/auth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true });
          } else if (res.statusCode === 401) {
            resolve({
              success: false,
              error: 'Invalid email or password.',
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${data}`,
            });
          }
        });
      });

      req.on('error', (error) => {
        if (error.message.includes('ENOTFOUND')) {
          resolve({
            success: false,
            error: 'Cannot reach Doordeck Cloud. Please check your internet connection.',
          });
        } else if (error.message.includes('ETIMEDOUT')) {
          resolve({
            success: false,
            error: 'Connection timed out. Please check your internet connection.',
          });
        } else {
          resolve({
            success: false,
            error: error.message,
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Connection timed out after 10 seconds.',
        });
      });

      req.write(loginData);
      req.end();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}
