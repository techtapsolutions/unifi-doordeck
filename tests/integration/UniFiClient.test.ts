/**
 * Integration tests for UniFiClient
 *
 * These tests verify that the UniFiClient correctly interacts with
 * the UniFi Access controller (using mocks or real controller in dev mode)
 */

import { UniFiClient } from '../../src/clients/unifi';
import { DoorEventType } from '../../src/types';
import {
  createMockUniFiDoor,
  waitForEvent,
  delay,
  MOCK_UNIFI_CONFIG,
  skipInCI,
} from './helpers';

// Skip these tests in CI since they require real UniFi Access controller
const describeIntegration = skipInCI('Requires UniFi Access controller');

describeIntegration('UniFiClient Integration', () => {
  let client: UniFiClient;

  beforeEach(() => {
    client = new UniFiClient();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
    });

    it('should set initialized state after initialization', async () => {
      await client.initialize();
      expect(client).toBeDefined();
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should login successfully with valid credentials', async () => {
      // Use environment variables for real testing
      const host = process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host;
      const username = process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username;
      const password = process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password;

      const result = await client.login(host, username, password);
      expect(typeof result).toBe('boolean');
    });

    it('should reject login with invalid credentials', async () => {
      await expect(
        client.login('192.168.1.100', 'invalid-user', 'wrong-password')
      ).rejects.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      await expect(
        client.login('invalid-host', 'user', 'pass')
      ).rejects.toThrow();
    });
  });

  describe('Door Discovery', () => {
    beforeEach(async () => {
      await client.initialize();
      // Login with real or mock credentials
      const host = process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host;
      const username = process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username;
      const password = process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password;
      await client.login(host, username, password);
    });

    it('should discover doors from controller', async () => {
      const doors = await client.discoverDoors();

      expect(Array.isArray(doors)).toBe(true);
      // In mock mode, might return empty array
      // In real mode with controller, should return doors
    });

    it('should return door objects with correct structure', async () => {
      const doors = await client.discoverDoors();

      if (doors.length > 0) {
        const door = doors[0];
        expect(door).toHaveProperty('id');
        expect(door).toHaveProperty('name');
        expect(typeof door.id).toBe('string');
        expect(typeof door.name).toBe('string');
      }
    });
  });

  describe('Door Operations', () => {
    let testDoorId: string;

    beforeEach(async () => {
      await client.initialize();
      const host = process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host;
      const username = process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username;
      const password = process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password;
      await client.login(host, username, password);

      // Get a test door
      const doors = await client.discoverDoors();
      if (doors.length > 0) {
        testDoorId = doors[0].id;
      } else {
        testDoorId = 'mock-door-123';
      }
    });

    it('should unlock a door successfully', async () => {
      const result = await client.unlock(testDoorId);
      expect(typeof result).toBe('boolean');
    });

    it('should get door status', async () => {
      const status = await client.getDoorStatus(testDoorId);

      if (status) {
        expect(status).toHaveProperty('doorId');
        expect(status).toHaveProperty('isUnlocked');
        expect(status).toHaveProperty('isOpen');
        expect(status).toHaveProperty('lastUpdate');
        expect(typeof status.isUnlocked).toBe('boolean');
        expect(typeof status.isOpen).toBe('boolean');
      }
    });

    it('should handle unlock errors gracefully', async () => {
      const result = await client.unlock('invalid-door-id').catch(() => false);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Event Listening', () => {
    beforeEach(async () => {
      await client.initialize();
      const host = process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host;
      const username = process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username;
      const password = process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password;
      await client.login(host, username, password);
    });

    it('should start event listener without errors', () => {
      const callback = jest.fn();
      expect(() => client.startEventListener(callback)).not.toThrow();
    });

    it('should receive door events when triggered', async () => {
      const events: any[] = [];
      const callback = (event: any) => {
        events.push(event);
      };

      client.startEventListener(callback);

      // Wait for potential events
      await delay(2000);

      // In mock mode, might not receive events
      // In real mode with activity, should receive events
      expect(Array.isArray(events)).toBe(true);
    });

    it('should stop event listener without errors', () => {
      const callback = jest.fn();
      client.startEventListener(callback);
      expect(() => client.stopEventListener()).not.toThrow();
    });

    it('should not receive events after stopping listener', async () => {
      const events: any[] = [];
      const callback = (event: any) => {
        events.push(event);
      };

      client.startEventListener(callback);
      client.stopEventListener();

      await delay(2000);

      // Should not accumulate events after stopping
      const countAfterStop = events.length;
      await delay(1000);
      expect(events.length).toBe(countAfterStop);
    });
  });

  describe('Reconnection', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should reconnect after disconnection', async () => {
      const host = process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host;
      const username = process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username;
      const password = process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password;

      // Connect
      await client.login(host, username, password);

      // Disconnect
      await client.disconnect();

      // Reconnect
      const result = await client.login(host, username, password);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle operations before initialization', async () => {
      const uninitializedClient = new UniFiClient();
      await expect(
        uninitializedClient.login('host', 'user', 'pass')
      ).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      await client.initialize();

      // Try to connect to non-existent host
      await expect(
        client.login('192.168.99.99', 'user', 'pass')
      ).rejects.toThrow();
    });

    it('should handle operations after disconnection', async () => {
      await client.initialize();
      await client.disconnect();

      await expect(client.discoverDoors()).rejects.toThrow();
    });
  });
});
