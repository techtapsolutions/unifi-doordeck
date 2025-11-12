/**
 * Type definitions for the UniFi-Doordeck Bridge
 */

import { BridgeConfig } from '../config';

/**
 * Bridge service state
 */
export enum ServiceState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error',
}

/**
 * Door mapping between Doordeck and UniFi
 */
export interface DoorMapping {
  /** Unique mapping ID */
  id: string;

  /** Doordeck lock ID */
  doordeckLockId: string;

  /** UniFi Access door device ID */
  unifiDoorId: string;

  /** Doordeck site ID */
  siteId: string;

  /** Friendly name for the door */
  name: string;

  /** Whether this mapping is active */
  enabled: boolean;

  /** Metadata for additional information */
  metadata?: Record<string, unknown>;

  /** When this mapping was created */
  createdAt: Date;

  /** When this mapping was last updated */
  updatedAt: Date;
}

/**
 * Door event types
 */
export enum DoorEventType {
  UNLOCKED = 'unlocked',
  LOCKED = 'locked',
  OPENED = 'opened',
  CLOSED = 'closed',
  FORCED = 'forced',
  HELD_OPEN = 'held_open',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
}

/**
 * Door event from UniFi Access
 */
export interface UniFiDoorEvent {
  /** UniFi door device ID */
  doorId: string;

  /** Event type */
  type: DoorEventType;

  /** Timestamp of the event */
  timestamp: Date;

  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Unlock command from Doordeck
 */
export interface UnlockCommand {
  /** Doordeck lock ID */
  lockId: string;

  /** User who initiated the unlock */
  userId?: string;

  /** Timestamp of the command */
  timestamp: Date;

  /** Additional command data */
  data?: Record<string, unknown>;
}

/**
 * Bridge statistics
 */
export interface BridgeStats {
  /** Current service state */
  state: ServiceState;

  /** When the service started */
  startedAt?: Date;

  /** Number of active door mappings */
  activeMappings: number;

  /** Total unlock commands processed */
  unlocksProcessed: number;

  /** Total events forwarded to Doordeck */
  eventsForwarded: number;

  /** Number of errors encountered */
  errors: number;

  /** Last error message */
  lastError?: string;
}

/**
 * Client interface for Doordeck
 */
export interface IDoordeckClient {
  /** Initialize the client */
  initialize(): Promise<void>;

  /** Authenticate with Doordeck */
  login(email: string, password: string): Promise<boolean>;

  /** Register a door with Doordeck */
  registerDoor(mapping: DoorMapping): Promise<boolean>;

  /** Start monitoring a door for events */
  startDoor(lockId: string): Promise<boolean>;

  /** Stop monitoring a door */
  stopDoor(lockId: string): Promise<boolean>;

  /** Send door event to Doordeck */
  sendDoorEvent(lockId: string, event: UniFiDoorEvent): Promise<boolean>;

  /** Cleanup and disconnect */
  disconnect(): Promise<void>;
}

/**
 * Client interface for UniFi Access
 */
export interface IUniFiClient {
  /** Initialize the client */
  initialize(): Promise<void>;

  /** Authenticate with UniFi Access controller */
  login(host: string, username: string, password: string): Promise<boolean>;

  /** Discover all doors from the controller */
  discoverDoors(): Promise<UniFiDoor[]>;

  /** Unlock a specific door */
  unlock(doorId: string): Promise<boolean>;

  /** Get door status */
  getDoorStatus(doorId: string): Promise<UniFiDoorStatus | null>;

  /** Start listening for door events */
  startEventListener(callback: (event: UniFiDoorEvent) => void): void;

  /** Stop listening for door events */
  stopEventListener(): void;

  /** Cleanup and disconnect */
  disconnect(): Promise<void>;
}

/**
 * UniFi door information
 */
export interface UniFiDoor {
  /** Door device ID */
  id: string;

  /** Door name */
  name: string;

  /** Floor location */
  floor?: string;

  /** Additional door metadata */
  metadata?: Record<string, unknown>;
}

/**
 * UniFi door status
 */
export interface UniFiDoorStatus {
  /** Door ID */
  doorId: string;

  /** Is the door currently unlocked */
  isUnlocked: boolean;

  /** Is the door currently open */
  isOpen: boolean;

  /** Last status update timestamp */
  lastUpdate: Date;
}

/**
 * Bridge service interface
 */
export interface IBridgeService {
  /** Initialize the bridge service */
  initialize(config: BridgeConfig): Promise<void>;

  /** Start the bridge service */
  start(): Promise<void>;

  /** Stop the bridge service */
  stop(): Promise<void>;

  /** Get current service statistics */
  getStats(): BridgeStats;

  /** Get current service state */
  getState(): ServiceState;

  /** Sync doors from UniFi to Doordeck */
  syncDoors(): Promise<void>;
}
