/**
 * Connection Testers for Setup Wizard
 * Tests UniFi and Doordeck connections without requiring the bridge service
 * Also provides door discovery functionality for setup wizard
 */

import https from 'https';
import { readFileSync } from 'fs';
import type { UniFiConfig, DoordeckConfig, Door } from '../shared/types';

interface UniFiDevice {
  unique_id: string;
  name: string;
  device_type: string;
  door?: {
    unique_id: string;
    name: string;
    full_name: string;
    floor_id?: string;
  };
  location?: {
    unique_id: string;
    name: string;
    full_name: string;
  };
}

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
      path: '/proxy/access/api/v2/devices',
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

/**
 * Discover doors from UniFi Access controller
 */
export async function discoverUniFiDoors(config: UniFiConfig): Promise<{ success: boolean; doors?: Door[]; error?: string }> {
  try {
    console.log('[DoorDiscovery] Starting door discovery...');
    console.log('[DoorDiscovery] Config:', {
      host: config.host,
      port: config.port || 443,
      hasApiKey: !!config.apiKey,
      skipSSL: config.skipSSLVerification,
    });

    // Validate required fields
    if (!config.host) {
      console.error('[DoorDiscovery] No host provided');
      return { success: false, error: 'Host is required' };
    }

    if (!config.apiKey) {
      console.error('[DoorDiscovery] No API key provided');
      return { success: false, error: 'API key is required for door discovery' };
    }

    return new Promise((resolve) => {
      // Create HTTPS agent
      const agentOptions: https.AgentOptions = {
        rejectUnauthorized: !config.skipSSLVerification,
      };

      // Load custom CA certificate if provided
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

      console.log('[DoorDiscovery] Making API request to:', `https://${config.host}:${port}/proxy/access/api/v2/devices`);

      // Fetch devices from UniFi Access API
      const options: https.RequestOptions = {
        hostname: config.host,
        port,
        path: '/proxy/access/api/v2/devices',
        method: 'GET',
        headers: {
          'X-API-KEY': config.apiKey,
          'Accept': 'application/json',
        },
        agent,
        timeout: 15000, // 15 second timeout
      };

      const req = https.request(options, (res) => {
        console.log('[DoorDiscovery] Got response status:', res.statusCode);
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              console.log('[DoorDiscovery] Response data:', data);
              const response = JSON.parse(data);
              const devices: UniFiDevice[] = response.data || [];

              console.log('[DoorDiscovery] Found', devices.length, 'devices');
              console.log('[DoorDiscovery] Devices:', JSON.stringify(devices, null, 2));

              // Extract doors from devices
              const doors: Door[] = [];

              for (const device of devices) {
                console.log('[DoorDiscovery] Checking device:', {
                  name: device.name,
                  type: device.device_type,
                  hasDoor: !!device.door,
                  hasLocation: !!device.location,
                });

                // Check if device has a door property
                if (device.door) {
                  console.log('[DoorDiscovery] Found door via door property:', device.door.name);
                  doors.push({
                    id: device.door.unique_id,
                    name: device.door.full_name || device.door.name,
                    floor: device.door.floor_id,
                    metadata: {
                      device_id: device.unique_id,
                      device_name: device.name,
                      device_type: device.device_type,
                    },
                  });
                }
                // Also check location property for door locations
                else if (device.location && device.device_type === 'UA_Door') {
                  console.log('[DoorDiscovery] Found door via location property:', device.location.name);
                  doors.push({
                    id: device.location.unique_id,
                    name: device.location.full_name || device.location.name,
                    metadata: {
                      device_id: device.unique_id,
                      device_name: device.name,
                      device_type: device.device_type,
                    },
                  });
                }
              }

              console.log('[DoorDiscovery] Total doors found:', doors.length);
              console.log('[DoorDiscovery] Doors:', JSON.stringify(doors, null, 2));

              resolve({
                success: true,
                doors,
              });
            } catch (error) {
              console.error('[DoorDiscovery] Failed to parse response:', error);
              console.error('[DoorDiscovery] Raw data:', data);
              resolve({
                success: false,
                error: `Failed to parse devices: ${error instanceof Error ? error.message : String(error)}`,
              });
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.error('[DoorDiscovery] Authentication failed');
            console.error('[DoorDiscovery] Response:', data);
            resolve({
              success: false,
              error: 'Authentication failed. Please check your API key.',
            });
          } else {
            console.error('[DoorDiscovery] HTTP error:', res.statusCode);
            console.error('[DoorDiscovery] Response:', data);
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${data}`,
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('[DoorDiscovery] Request error:', error);
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
        } else {
          resolve({
            success: false,
            error: error.message,
          });
        }
      });

      req.on('timeout', () => {
        console.error('[DoorDiscovery] Request timed out');
        req.destroy();
        resolve({
          success: false,
          error: 'Connection timed out after 15 seconds.',
        });
      });

      req.end();
    });
  } catch (error) {
    console.error('[DoorDiscovery] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Door discovery failed',
    };
  }
}
