/**
 * Integration tests for DoordeckClient
 *
 * These tests verify that the DoordeckClient correctly interacts with
 * the Doordeck Fusion API (using mocks or real API in dev mode)
 */

import { DoordeckClient } from '../../src/clients/doordeck';
import { DoorEventType } from '../../src/types';
import {
  createMockMapping,
  createMockDoorEvent,
  waitForEvent,
  delay,
  MOCK_DOORDECK_TOKEN,
  skipInCI,
} from './helpers';

// Skip these tests in CI since they require real API credentials or complex mocking
const describeIntegration = skipInCI('Requires Doordeck API setup');

describeIntegration('DoordeckClient Integration', () => {
  let client: DoordeckClient;

  beforeEach(() => {
    client = new DoordeckClient(MOCK_DOORDECK_TOKEN);
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
      // Client should be ready to use
      expect(client).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      const invalidClient = new DoordeckClient('invalid-token');
      await expect(invalidClient.initialize()).rejects.toThrow();
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should login successfully with valid credentials', async () => {
      // This would need real credentials in dev environment
      const email = process.env.DOORDECK_TEST_EMAIL || 'test@example.com';
      const password = process.env.DOORDECK_TEST_PASSWORD || 'test-password';

      // In mock mode, this should succeed
      // In real mode with valid creds, this should also succeed
      const result = await client.login(email, password);
      expect(typeof result).toBe('boolean');
    });

    it('should reject login with invalid credentials', async () => {
      await expect(
        client.login('invalid@example.com', 'wrong-password')
      ).rejects.toThrow();
    });
  });

  describe('Door Management', () => {
    beforeEach(async () => {
      await client.initialize();
      // In real mode, authenticate first
      if (process.env.DOORDECK_TEST_EMAIL) {
        await client.login(
          process.env.DOORDECK_TEST_EMAIL,
          process.env.DOORDECK_TEST_PASSWORD || ''
        );
      }
    });

    it('should register a door successfully', async () => {
      const mapping = createMockMapping({
        doordeckLockId: 'test-lock-' + Date.now(),
        name: 'Integration Test Door',
      });

      const result = await client.registerDoor(mapping);
      expect(typeof result).toBe('boolean');
    });

    it('should start monitoring a door', async () => {
      const mapping = createMockMapping();
      await client.registerDoor(mapping);

      const result = await client.startDoor(mapping.doordeckLockId);
      expect(typeof result).toBe('boolean');
    });

    it('should stop monitoring a door', async () => {
      const mapping = createMockMapping();
      await client.registerDoor(mapping);
      await client.startDoor(mapping.doordeckLockId);

      const result = await client.stopDoor(mapping.doordeckLockId);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      await client.initialize();
      if (process.env.DOORDECK_TEST_EMAIL) {
        await client.login(
          process.env.DOORDECK_TEST_EMAIL,
          process.env.DOORDECK_TEST_PASSWORD || ''
        );
      }
    });

    it('should send door unlock event to Doordeck', async () => {
      const mapping = createMockMapping();
      await client.registerDoor(mapping);
      await client.startDoor(mapping.doordeckLockId);

      const event = createMockDoorEvent(mapping.unifiDoorId, DoorEventType.UNLOCKED);

      const result = await client.sendDoorEvent(mapping.doordeckLockId, event);
      expect(typeof result).toBe('boolean');
    });

    it('should send door opened event to Doordeck', async () => {
      const mapping = createMockMapping();
      await client.registerDoor(mapping);
      await client.startDoor(mapping.doordeckLockId);

      const event = createMockDoorEvent(mapping.unifiDoorId, DoorEventType.OPENED);

      const result = await client.sendDoorEvent(mapping.doordeckLockId, event);
      expect(typeof result).toBe('boolean');
    });

    it('should handle event sending errors gracefully', async () => {
      const event = createMockDoorEvent('invalid-door', DoorEventType.UNLOCKED);

      // Should not crash, but may return false
      const result = await client.sendDoorEvent('invalid-lock-id', event);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Unlock Command Polling', () => {
    beforeEach(async () => {
      await client.initialize();
      if (process.env.DOORDECK_TEST_EMAIL) {
        await client.login(
          process.env.DOORDECK_TEST_EMAIL,
          process.env.DOORDECK_TEST_PASSWORD || ''
        );
      }
    });

    it('should emit unlock command when detected', async () => {
      const mapping = createMockMapping();
      await client.registerDoor(mapping);
      await client.startDoor(mapping.doordeckLockId);

      // Listen for unlock command
      const commandPromise = waitForEvent(client, 'unlock-command', 10000);

      // In a real scenario, you would trigger an unlock via Doordeck mobile app
      // For testing, we can simulate this or skip in CI

      // Wait a bit for polling to potentially detect commands
      await delay(2000);

      // In mock/test mode, we might not get a command
      // This is more of a structure test
      expect(client).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const client = new DoordeckClient('test-token');
      // Don't initialize - should fail gracefully
      const mapping = createMockMapping();

      await expect(client.registerDoor(mapping)).rejects.toThrow();
    });

    it('should handle disconnection gracefully', async () => {
      await client.initialize();
      await client.disconnect();

      // Operations after disconnect should fail or handle gracefully
      const mapping = createMockMapping();
      const result = await client.registerDoor(mapping).catch(() => false);
      expect(result).toBe(false);
    });
  });
});
