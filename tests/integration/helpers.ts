/**
 * Integration test helpers and utilities
 */

import { DoorMapping, UniFiDoor, DoorEventType } from '../../src/types';

/**
 * Create a mock door mapping for testing
 */
export function createMockMapping(overrides?: Partial<DoorMapping>): DoorMapping {
  return {
    id: 'mapping-test-123',
    doordeckLockId: 'lock-test-123',
    unifiDoorId: 'door-test-123',
    siteId: 'site-test-123',
    name: 'Test Door',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock UniFi door for testing
 */
export function createMockUniFiDoor(overrides?: Partial<UniFiDoor>): UniFiDoor {
  return {
    id: 'door-test-123',
    name: 'Test Door',
    floor: 'Ground Floor',
    metadata: {},
    ...overrides,
  };
}

/**
 * Create a mock door event for testing
 */
export function createMockDoorEvent(
  doorId: string,
  type: DoorEventType,
  timestamp?: Date
) {
  return {
    doorId,
    type,
    timestamp: timestamp || new Date(),
    data: {
      source: 'test',
      metadata: {},
    },
  };
}

/**
 * Wait for a specific amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, timeoutMessage = 'Timeout waiting for condition' } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await delay(interval);
  }

  throw new Error(timeoutMessage);
}

/**
 * Wait for an event to be emitted
 */
export function waitForEvent<T = any>(
  emitter: NodeJS.EventEmitter,
  event: string,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeListener(event, handler);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };

    emitter.once(event, handler);
  });
}

/**
 * Mock Doordeck API token
 */
export const MOCK_DOORDECK_TOKEN = 'dd_test_token_12345';

/**
 * Mock UniFi credentials
 */
export const MOCK_UNIFI_CONFIG = {
  host: '192.168.1.100',
  port: 443,
  username: 'test-admin',
  password: 'test-password',
  verifySsl: false,
};

/**
 * Check if we're running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true';
}

/**
 * Skip test if condition is true
 */
export function skipIf(condition: boolean, reason: string) {
  return condition ? describe.skip : describe;
}

/**
 * Skip test in CI environment
 */
export function skipInCI(reason: string) {
  return skipIf(isCI(), reason);
}
