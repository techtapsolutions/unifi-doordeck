/**
 * UniFi OS API Client
 *
 * This client handles authentication and communication with UniFi OS controllers (UDM, Dream Machine)
 * using API keys instead of username/password.
 */

import https from 'https';
import { logger } from '../../utils/logger';
import type { UniFiConfig } from '../../config/types';

export interface UniFiOSDoor {
  unique_id: string;
  name: string;
  full_name: string;
  location_type: string;
  extra_type?: string;
  floor_id?: string;
  device_id?: string;
  is_bind_hub?: boolean;
  door_guard?: boolean;
  up_id?: string;
}

export interface UniFiOSDevice {
  unique_id: string;
  name: string;
  device_type: string;
  door?: UniFiOSDoor;
  location?: UniFiOSDoor;
  mac?: string;
  ip?: string;
  firmware_version?: string;
  adoptable_version?: string;
  version?: string;
  type?: string;
  model?: string;
}

export class UniFiOSClient {
  private host: string;
  private port: number;
  private apiKey: string;
  private agent: https.Agent;
  private doorToDeviceMap: Map<string, string> = new Map(); // Maps door unique_id to device unique_id

  constructor(config: UniFiConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for UniFi OS authentication');
    }

    this.host = config.host;
    this.port = config.port || 443;
    this.apiKey = config.apiKey;

    // Create HTTPS agent with mandatory SSL verification
    // SSL verification is always enabled for security
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: true, // Always verify SSL certificates
    };

    // Support custom CA certificates for self-signed certificates
    if (config.caCertPath) {
      try {
        const fs = require('fs');
        const ca = fs.readFileSync(config.caCertPath);
        agentOptions.ca = ca;
        logger.info(`Using custom CA certificate from: ${config.caCertPath}`);
      } catch (error) {
        logger.error(`Failed to load CA certificate from ${config.caCertPath}:`, error);
        throw new Error(
          `Failed to load CA certificate: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.agent = new https.Agent(agentOptions);
  }

  /**
   * Make an authenticated request to the UniFi OS API
   */
  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: this.host,
        port: this.port,
        path: `/proxy/access/api/v2${path}`,
        method,
        headers: {
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        agent: this.agent,
      };

      const req = https.request(options, (res) => {
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
   * Test the API key authentication
   */
  async testAuthentication(): Promise<boolean> {
    try {
      logger.info('Testing UniFi OS API key authentication...');

      // Try to get devices as a test
      const response = await this.request<{ data: UniFiOSDevice[] }>('GET', '/devices');

      logger.info(`Authentication successful! Found ${response.data?.length || 0} devices`);
      return true;
    } catch (error) {
      logger.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Get all devices
   */
  async getDevices(): Promise<UniFiOSDevice[]> {
    try {
      const response = await this.request<{ data: UniFiOSDevice[] }>('GET', '/devices');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to get devices:', error);
      throw error;
    }
  }

  /**
   * Get all doors
   *
   * Note: In UniFi OS API v2, doors are embedded within device objects.
   * This method extracts door information from devices and builds a mapping
   * between door IDs and hub device IDs for unlock operations.
   *
   * The unlock endpoint requires the UAH-DOOR (hub) device ID, not the reader device ID.
   */
  async getDoors(): Promise<UniFiOSDoor[]> {
    try {
      logger.info('Fetching doors from devices...');

      // Get all devices
      const devices = await this.getDevices();

      // Extract doors from devices and build door->hub device mapping
      const doorMap = new Map<string, UniFiOSDoor>();
      const doorToHubMap = new Map<string, string>(); // Maps door unique_id to hub device ID

      devices.forEach((device) => {
        if (device.door && device.door.unique_id) {
          const door = device.door;
          const doorId = door.unique_id;

          // Track the hub device (UAH-DOOR) for unlock operations
          if (device.device_type === 'UAH-DOOR') {
            doorToHubMap.set(doorId, device.unique_id);
            logger.debug(`Found hub for door ${door.name}: ${device.name} (${device.unique_id})`);
          }

          // Add device_id to door for reference
          door.device_id = device.unique_id;

          // Use Map to ensure unique doors (multiple devices can reference same door)
          if (!doorMap.has(doorId)) {
            doorMap.set(doorId, door);
            logger.debug(`Found door: ${door.full_name} (${doorId}) on device ${device.name}`);
          }
        }
      });

      // Update the door->device mapping with hub devices
      doorToHubMap.forEach((hubId, doorId) => {
        this.doorToDeviceMap.set(doorId, hubId);
      });

      const doors = Array.from(doorMap.values());
      logger.info(`Found ${doors.length} unique door(s) with ${doorToHubMap.size} hub mapping(s)`);

      return doors;
    } catch (error) {
      logger.error('Failed to get doors:', error);
      throw error;
    }
  }

  /**
   * Unlock a door
   *
   * Uses the relay_unlock endpoint discovered from UniFi Access API.
   * Endpoint: PUT /proxy/access/api/v2/device/{hub_id}/relay_unlock
   *
   * Note: Must call getDoors() first to populate the door->device mapping.
   */
  async unlockDoor(doorId: string): Promise<boolean> {
    try {
      logger.info(`Unlocking door: ${doorId}`);

      // Get the device ID associated with this door
      const deviceId = this.doorToDeviceMap.get(doorId);

      if (!deviceId) {
        // Try to refresh doors if mapping not found
        logger.warn('Door->Device mapping not found, refreshing doors...');
        await this.getDoors();

        const retryDeviceId = this.doorToDeviceMap.get(doorId);
        if (!retryDeviceId) {
          throw new Error(`No device found for door ${doorId}. Make sure the door exists.`);
        }
      }

      const hubDeviceId = this.doorToDeviceMap.get(doorId)!;

      // Use the relay_unlock endpoint
      // This is the working endpoint discovered from testing
      logger.debug(`Calling relay_unlock on hub device: ${hubDeviceId}`);

      const response = await this.request<{ code: number; msg: string; data: string }>(
        'PUT',
        `/device/${hubDeviceId}/relay_unlock`,
        {}
      );

      // Check response for success
      if (response.code === 1 || response.msg === 'success' || response.data === 'success') {
        logger.info(`Door ${doorId} unlocked successfully`);
        return true;
      } else {
        throw new Error(`Unlock failed: ${response.msg || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error(`Failed to unlock door ${doorId}:`, error);
      throw error;
    }
  }

  /**
   * Get door status
   *
   * Note: Since doors are embedded in devices, this method finds the
   * device containing the door and returns its door object.
   */
  async getDoorStatus(doorId: string): Promise<UniFiOSDoor | null> {
    try {
      // Get the device ID for this door
      const deviceId = this.doorToDeviceMap.get(doorId);

      if (!deviceId) {
        logger.warn('Door->Device mapping not found, refreshing doors...');
        await this.getDoors();
      }

      // Fetch all devices to get current status
      const devices = await this.getDevices();

      // Find the device containing this door
      const device = devices.find((d) => d.door?.unique_id === doorId);

      if (!device || !device.door) {
        throw new Error(`Door ${doorId} not found`);
      }

      return device.door;
    } catch (error) {
      logger.error(`Failed to get door status for ${doorId}:`, error);
      throw error;
    }
  }

  /**
   * Discover all doors (IUniFiClient interface compatibility)
   * Maps UniFiOSDoor format to standard UniFiDoor format
   */
  async discoverDoors(): Promise<Array<{ id: string; name: string; floor?: string; metadata?: Record<string, unknown> }>> {
    try {
      const osDoors = await this.getDoors();

      return osDoors.map((door) => ({
        id: door.unique_id,
        name: door.full_name || door.name,
        floor: door.floor_id,
        metadata: {
          location_type: door.location_type,
          extra_type: door.extra_type,
          device_id: door.device_id,
          is_bind_hub: door.is_bind_hub,
          door_guard: door.door_guard,
          up_id: door.up_id,
        },
      }));
    } catch (error) {
      logger.error('Failed to discover doors:', error);
      throw error;
    }
  }
}
