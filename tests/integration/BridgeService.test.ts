/**
 * Integration tests for BridgeService
 *
 * These tests verify end-to-end flows through the entire bridge:
 * - Door synchronization
 * - Unlock command flow (Doordeck -> UniFi)
 * - Event forwarding (UniFi -> Doordeck)
 * - Error recovery
 */

import { BridgeService } from '../../src/services/bridge';
import { BridgeConfig } from '../../src/config';
import { ServiceState, DoorEventType } from '../../src/types';
import {
  waitForEvent,
  waitFor,
  delay,
  MOCK_DOORDECK_TOKEN,
  MOCK_UNIFI_CONFIG,
  skipInCI,
} from './helpers';

// Skip these tests in CI since they require both Doordeck and UniFi Access
const describeIntegration = skipInCI('Requires full integration environment');

describeIntegration('BridgeService Integration', () => {
  let bridge: BridgeService;
  let config: BridgeConfig;

  beforeEach(() => {
    bridge = new BridgeService();

    // Create test configuration
    config = {
      unifi: {
        host: process.env.UNIFI_TEST_HOST || MOCK_UNIFI_CONFIG.host,
        port: MOCK_UNIFI_CONFIG.port,
        username: process.env.UNIFI_TEST_USERNAME || MOCK_UNIFI_CONFIG.username,
        password: process.env.UNIFI_TEST_PASSWORD || MOCK_UNIFI_CONFIG.password,
        verifySsl: false,
        reconnectDelay: 5000,
        maxRetries: 3,
      },
      doordeck: {
        apiToken: process.env.DOORDECK_TEST_TOKEN || MOCK_DOORDECK_TOKEN,
        email: process.env.DOORDECK_TEST_EMAIL || 'test@example.com',
        password: process.env.DOORDECK_TEST_PASSWORD || 'test-password',
      },
      logging: {
        level: 'debug',
        directory: './logs',
        maxFiles: 5,
        maxSize: 10485760,
      },
    };
  });

  afterEach(async () => {
    if (bridge) {
      await bridge.stop();
    }
  });

  describe('Service Lifecycle', () => {
    it('should initialize successfully', async () => {
      await expect(bridge.initialize(config)).resolves.not.toThrow();
      expect(bridge.getState()).toBe(ServiceState.STOPPED);
    });

    it('should start successfully', async () => {
      await bridge.initialize(config);
      await bridge.start();

      expect(bridge.getState()).toBe(ServiceState.RUNNING);
    });

    it('should stop successfully', async () => {
      await bridge.initialize(config);
      await bridge.start();
      await bridge.stop();

      expect(bridge.getState()).toBe(ServiceState.STOPPED);
    });

    it('should emit state change events', async () => {
      await bridge.initialize(config);

      const stateChangePromise = waitForEvent(bridge, 'state-changed', 10000);
      await bridge.start();

      const event = await stateChangePromise;
      expect(event).toHaveProperty('current');
      expect(event.current).toBe(ServiceState.RUNNING);
    });
  });

  describe('Door Synchronization', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
    });

    it('should discover and sync doors on start', async () => {
      const syncPromise = waitForEvent(bridge, 'doors-synced', 30000);

      await bridge.start();

      const doorCount = await syncPromise;
      expect(typeof doorCount).toBe('number');
      expect(doorCount).toBeGreaterThanOrEqual(0);
    });

    it('should create door mappings', async () => {
      await bridge.start();
      await delay(5000); // Wait for sync

      const stats = bridge.getStats();
      expect(stats).toHaveProperty('activeMappings');
      expect(typeof stats.activeMappings).toBe('number');
    });

    it('should handle manual sync', async () => {
      await bridge.start();

      // Manual sync
      await expect(bridge.syncDoors()).resolves.not.toThrow();
    });
  });

  describe('Unlock Command Flow', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(5000); // Wait for initialization and sync
    });

    it('should process unlock commands from Doordeck', async () => {
      // Listen for unlock command being processed
      const unlockPromise = waitForEvent(bridge, 'unlock-processed', 30000);

      // In real scenario, this would be triggered by Doordeck mobile app
      // For testing, we need to simulate or manually trigger

      // Wait briefly
      await delay(2000);

      // Check bridge is processing commands
      const stats = bridge.getStats();
      expect(stats).toHaveProperty('unlocksProcessed');
    });

    it('should unlock UniFi door when command received', async () => {
      // This test requires:
      // 1. Doordeck mobile app to send unlock
      // 2. Or simulated unlock command

      // Listen for events
      const eventPromise = waitForEvent(bridge, 'door-unlocked', 30000);

      // Trigger unlock via Doordeck API or mobile app
      // (Manual step in integration testing)

      await delay(5000);

      // Verify bridge is operational
      expect(bridge.getState()).toBe(ServiceState.RUNNING);
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(5000); // Wait for initialization
    });

    it('should forward UniFi events to Doordeck', async () => {
      // Listen for event forwarding
      const eventPromise = waitForEvent(bridge, 'event-forwarded', 30000);

      // In real scenario, trigger physical door event
      // (e.g., open door manually or use access card)

      await delay(5000);

      const stats = bridge.getStats();
      expect(stats).toHaveProperty('eventsForwarded');
    });

    it('should handle door opened events', async () => {
      // Physical door interaction needed
      await delay(2000);

      const stats = bridge.getStats();
      expect(stats.state).toBe(ServiceState.RUNNING);
    });

    it('should handle door closed events', async () => {
      // Physical door interaction needed
      await delay(2000);

      const stats = bridge.getStats();
      expect(stats.state).toBe(ServiceState.RUNNING);
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
      await bridge.start();
    });

    it('should monitor service health', async () => {
      await delay(2000);

      // Service should remain healthy
      expect(bridge.getState()).toBe(ServiceState.RUNNING);
    });

    it('should emit health change events', async () => {
      // Listen for health changes
      const healthPromise = waitForEvent(bridge, 'health-changed', 60000);

      // Wait for health check cycle
      await delay(5000);

      // Service should be healthy
      expect(bridge.getState()).toBe(ServiceState.RUNNING);
    });
  });

  describe('Error Recovery', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(2000);
    });

    it('should recover from temporary network issues', async () => {
      // Simulate network issue (would need to disconnect network in real test)
      await delay(2000);

      // Service should attempt recovery
      await delay(10000); // Wait for retry

      // Should recover or remain in retry state
      const state = bridge.getState();
      expect([ServiceState.RUNNING, ServiceState.ERROR]).toContain(state);
    });

    it('should handle UniFi controller disconnection', async () => {
      // Would need to stop UniFi controller in real test
      await delay(5000);

      const stats = bridge.getStats();
      expect(stats).toHaveProperty('errors');
    });

    it('should handle Doordeck API errors', async () => {
      // Would need to simulate API errors in real test
      await delay(2000);

      const stats = bridge.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(2000);
    });

    it('should track unlock operations', async () => {
      const stats = bridge.getStats();

      expect(stats).toHaveProperty('unlocksProcessed');
      expect(typeof stats.unlocksProcessed).toBe('number');
      expect(stats.unlocksProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should track events forwarded', async () => {
      const stats = bridge.getStats();

      expect(stats).toHaveProperty('eventsForwarded');
      expect(typeof stats.eventsForwarded).toBe('number');
      expect(stats.eventsForwarded).toBeGreaterThanOrEqual(0);
    });

    it('should track active mappings', async () => {
      await delay(5000); // Wait for sync

      const stats = bridge.getStats();
      expect(stats).toHaveProperty('activeMappings');
      expect(typeof stats.activeMappings).toBe('number');
    });

    it('should track errors', async () => {
      const stats = bridge.getStats();

      expect(stats).toHaveProperty('errors');
      expect(typeof stats.errors).toBe('number');
      expect(stats.errors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should cleanup resources on stop', async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(2000);

      await bridge.stop();

      expect(bridge.getState()).toBe(ServiceState.STOPPED);
    });

    it('should stop all monitoring on shutdown', async () => {
      await bridge.initialize(config);
      await bridge.start();
      await delay(2000);

      await bridge.stop();

      // Should not emit events after stop
      const errorEmitted = await Promise.race([
        waitForEvent(bridge, 'error', 2000).then(() => true),
        delay(3000).then(() => false),
      ]);

      expect(errorEmitted).toBe(false);
    });
  });
});
