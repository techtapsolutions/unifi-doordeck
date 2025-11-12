# UniFi-Doordeck Bridge - API Documentation

Developer reference for extending and integrating with the UniFi-Doordeck Bridge.

## Table of Contents

- [Overview](#overview)
- [BridgeService API](#bridgeservice-api)
- [DoordeckClient API](#doordeckclient-api)
- [UniFiClient API](#unificlient-api)
- [Event System](#event-system)
- [Configuration Schema](#configuration-schema)
- [Extending the Bridge](#extending-the-bridge)
- [Testing](#testing)

---

## Overview

The UniFi-Doordeck Bridge exposes several TypeScript/JavaScript APIs for extension and integration. All APIs are TypeScript-first with full type definitions.

###

 **Import Paths**

```typescript
import { BridgeService } from './services/bridge';
import { DoordeckClient } from './clients/doordeck';
import { UniFiClient } from './clients/unifi';
import { ConfigLoader, BridgeConfig } from './config';
import { logger } from './utils/logger';
```

---

## BridgeService API

Main orchestration service managing the bridge lifecycle.

### Class: `BridgeService`

**Location**: `src/services/bridge/BridgeService.ts`

#### Constructor

```typescript
constructor()
```

Creates a new bridge service instance.

**Example**:
```typescript
const bridge = new BridgeService();
```

#### Methods

##### `initialize(config: BridgeConfig): Promise<void>`

Initialize the bridge with configuration.

**Parameters**:
- `config` - Bridge configuration object

**Throws**:
- `Error` - If configuration is invalid
- `Error` - If initialization fails

**Example**:
```typescript
const config = ConfigLoader.loadConfig('./config.json');
await bridge.initialize(config);
```

##### `start(): Promise<void>`

Start the bridge service.

**Preconditions**:
- Must call `initialize()` first

**Throws**:
- `Error` - If not initialized
- `Error` - If already running

**Example**:
```typescript
await bridge.start();
```

##### `stop(): Promise<void>`

Stop the bridge service gracefully.

**Example**:
```typescript
await bridge.stop();
```

##### `getState(): BridgeState`

Get current bridge state.

**Returns**: `BridgeState` enum value

**States**:
```typescript
enum BridgeState {
  STOPPED = 'stopped',
  INITIALIZING = 'initializing',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}
```

**Example**:
```typescript
const state = bridge.getState();
console.log(`Bridge is ${state}`);
```

##### `getStats(): BridgeStatistics`

Get current bridge statistics.

**Returns**: `BridgeStatistics` object

**Example**:
```typescript
const stats = bridge.getStats();
console.log(`Unlocks processed: ${stats.unlocksProcessed}`);
console.log(`Events forwarded: ${stats.eventsForwarded}`);
```

#### Events

BridgeService extends `EventEmitter` and emits the following events:

##### `'started'`

Emitted when bridge starts successfully.

```typescript
bridge.on('started', () => {
  console.log('Bridge started');
});
```

##### `'stopped'`

Emitted when bridge stops.

```typescript
bridge.on('stopped', () => {
  console.log('Bridge stopped');
});
```

##### `'error'`

Emitted on critical errors.

```typescript
bridge.on('error', (error: Error) => {
  console.error('Bridge error:', error);
});
```

##### `'state-changed'`

Emitted on state transitions.

```typescript
bridge.on('state-changed', ({ previous, current }) => {
  console.log(`State: ${previous} → ${current}`);
});
```

##### `'doors-synced'`

Emitted after door synchronization.

```typescript
bridge.on('doors-synced', (count: number) => {
  console.log(`Synced ${count} doors`);
});
```

##### `'health-changed'`

Emitted when component health changes.

```typescript
bridge.on('health-changed', ({ component, status, health }) => {
  console.log(`${component}: ${status}`);
});
```

#### Types

##### `BridgeStatistics`

```typescript
interface BridgeStatistics {
  state: BridgeState;
  uptime: number;              // milliseconds
  activeMappings: number;      // number of door mappings
  unlocksProcessed: number;    // total unlock commands
  eventsForwarded: number;     // total events forwarded
  errors: number;              // total errors
  lastError: Error | null;     // most recent error
}
```

---

## DoordeckClient API

Client for interacting with Doordeck Cloud.

### Class: `DoordeckClient`

**Location**: `src/clients/doordeck/DoordeckClient.ts`

#### Constructor

```typescript
constructor()
```

Creates a new Doordeck client instance.

#### Methods

##### `setUniFiCredentials(config: UniFiConfig): void`

Configure UniFi controller credentials for door registration.

**Parameters**:
- `config` - UniFi configuration

**Example**:
```typescript
client.setUniFiCredentials({
  host: '192.168.1.100',
  username: 'admin',
  password: 'password',
  port: 443,
  verifySsl: true
});
```

##### `authenticate(config: DoordeckConfig): Promise<void>`

Authenticate with Doordeck API.

**Parameters**:
- `config` - Doordeck credentials

**Throws**:
- `Error` - If authentication fails

**Example**:
```typescript
await client.authenticate({
  apiToken: 'dd_token',
  email: 'admin@example.com',
  password: 'password'
});
```

##### `registerDoor(mapping: DoorMapping): Promise<void>`

Register a door with Doordeck.

**Parameters**:
- `mapping` - Door mapping with UniFi door details

**Throws**:
- `Error` - If registration fails

**Example**:
```typescript
await client.registerDoor({
  unifiDoorId: 'door-123',
  doordeckLockId: 'lock-456',
  name: 'Front Door',
  siteId: 'site-789'
});
```

##### `getDoorStatus(lockId: string): Promise<LockStatus>`

Query door/lock status.

**Parameters**:
- `lockId` - Doordeck lock ID

**Returns**: `LockStatus` object

**Example**:
```typescript
const status = await client.getDoorStatus('lock-456');
console.log(`Lock is ${status.state}`);
```

##### `forwardEvent(event: DoordeckEvent): Promise<void>`

Forward door event to Doordeck Cloud.

**Parameters**:
- `event` - Formatted Doordeck event

**Example**:
```typescript
await client.forwardEvent({
  lockId: 'lock-456',
  eventType: 'DOOR_OPENED',
  timestamp: new Date(),
  metadata: { doorName: 'Front Door' }
});
```

#### Events

##### `'unlock-command'`

Emitted when unlock command is detected.

```typescript
client.on('unlock-command', ({ lockId, timestamp }) => {
  console.log(`Unlock requested for ${lockId}`);
});
```

#### Types

##### `DoorMapping`

```typescript
interface DoorMapping {
  id: string;
  unifiDoorId: string;
  doordeckLockId: string;
  name: string;
  siteId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

##### `LockStatus`

```typescript
interface LockStatus {
  lockId: string;
  state: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN';
  lastUpdate: Date;
}
```

##### `DoordeckEvent`

```typescript
interface DoordeckEvent {
  lockId: string;
  eventType: DoorEventType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

enum DoorEventType {
  DOOR_OPENED = 'DOOR_OPENED',
  DOOR_CLOSED = 'DOOR_CLOSED',
  DOOR_UNLOCKED = 'DOOR_UNLOCKED',
  DOOR_LOCKED = 'DOOR_LOCKED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DOOR_FORCED_OPEN = 'DOOR_FORCED_OPEN',
  DOOR_HELD_OPEN = 'DOOR_HELD_OPEN'
}
```

---

## UniFiClient API

Client for interacting with UniFi Access controllers.

### Class: `UniFiClient`

**Location**: `src/clients/unifi/UniFiClient.ts`

#### Constructor

```typescript
constructor(
  reconnectDelay?: number,
  maxRetries?: number
)
```

**Parameters**:
- `reconnectDelay` - Milliseconds between reconnect attempts (default: 5000)
- `maxRetries` - Maximum reconnection attempts (default: 3)

#### Methods

##### `connect(config: UniFiConfig): Promise<void>`

Connect to UniFi Access controller.

**Parameters**:
- `config` - UniFi connection configuration

**Throws**:
- `Error` - If connection fails

**Example**:
```typescript
await unifiClient.connect({
  host: '192.168.1.100',
  port: 443,
  username: 'admin',
  password: 'password',
  verifySsl: true
});
```

##### `disconnect(): Promise<void>`

Disconnect from controller.

**Example**:
```typescript
await unifiClient.disconnect();
```

##### `getDoors(): Promise<UniFiDoor[]>`

Get list of all doors from controller.

**Returns**: Array of door objects

**Example**:
```typescript
const doors = await unifiClient.getDoors();
doors.forEach(door => {
  console.log(`${door.name} (${door.id})`);
});
```

##### `unlockDoor(doorId: string, duration?: number): Promise<void>`

Unlock a door.

**Parameters**:
- `doorId` - UniFi door ID
- `duration` - Optional unlock duration in seconds (default: controller setting)

**Throws**:
- `Error` - If unlock fails

**Example**:
```typescript
await unifiClient.unlockDoor('door-123', 10);
```

##### `lockDoor(doorId: string): Promise<void>`

Lock a door.

**Parameters**:
- `doorId` - UniFi door ID

**Example**:
```typescript
await unifiClient.lockDoor('door-123');
```

##### `getDoorStatus(doorId: string): Promise<DoorStatus>`

Get current door status.

**Parameters**:
- `doorId` - UniFi door ID

**Returns**: Door status object

**Example**:
```typescript
const status = await unifiClient.getDoorStatus('door-123');
console.log(`Door is ${status.state}`);
```

#### Events

##### `'connected'`

Emitted when connection is established.

```typescript
unifiClient.on('connected', () => {
  console.log('Connected to UniFi Access');
});
```

##### `'disconnected'`

Emitted when connection is lost.

```typescript
unifiClient.on('disconnected', () => {
  console.log('Disconnected from UniFi Access');
});
```

##### `'door-event'`

Emitted for all door events.

```typescript
unifiClient.on('door-event', (event: DoorEvent) => {
  console.log(`${event.doorId}: ${event.eventType}`);
});
```

#### Types

##### `UniFiDoor`

```typescript
interface UniFiDoor {
  id: string;
  name: string;
  siteId: string;
  location?: string;
  status: 'online' | 'offline';
  lockType: 'magnetic' | 'electric_strike' | 'motorized';
}
```

##### `DoorStatus`

```typescript
interface DoorStatus {
  doorId: string;
  state: 'locked' | 'unlocked' | 'unknown';
  position: 'open' | 'closed' | 'unknown';
  lastActivity: Date;
}
```

##### `DoorEvent`

```typescript
interface DoorEvent {
  doorId: string;
  eventType: UniFiEventType;
  timestamp: Date;
  userId?: string;
  credentialId?: string;
  metadata?: Record<string, any>;
}

enum UniFiEventType {
  DOOR_OPENED = 'door_opened',
  DOOR_CLOSED = 'door_closed',
  DOOR_UNLOCKED = 'door_unlocked',
  DOOR_LOCKED = 'door_locked',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  DOOR_FORCED = 'door_forced',
  DOOR_HELD_OPEN = 'door_held_open'
}
```

---

## Event System

The bridge uses Node.js EventEmitter for internal communication.

### Custom Event Handler

Add custom event handlers to extend functionality:

```typescript
import { BridgeService } from './services/bridge';

const bridge = new BridgeService();

// Custom unlock handler
bridge.on('unlock-command', async ({ lockId, doorId }) => {
  console.log(`Custom handler: Unlocking ${doorId}`);

  // Your custom logic
  await sendNotification(`Door ${doorId} unlocked`);
  await logToDatabase(lockId, doorId, new Date());
});

// Custom event handler
bridge.on('door-event', async (event) => {
  if (event.eventType === 'ACCESS_DENIED') {
    console.warn(`Access denied at ${event.doorId}`);

    // Your custom logic
    await sendSecurityAlert(event);
  }
});
```

### Event Filtering

Filter events before processing:

```typescript
import { EventTranslator } from './services/events';

class CustomEventTranslator extends EventTranslator {
  protected shouldForwardEvent(event: DoorEvent): boolean {
    // Only forward events during business hours
    const hour = new Date().getHours();
    if (hour < 8 || hour > 18) {
      return false;
    }

    return super.shouldForwardEvent(event);
  }
}
```

---

## Configuration Schema

### TypeScript Interfaces

Complete configuration type definitions:

```typescript
interface BridgeConfig {
  unifi: UniFiConfig;
  doordeck: DoordeckConfig;
  logging?: LoggingConfig;
  healthMonitor?: HealthMonitorConfig;
  circuitBreaker?: CircuitBreakerConfig;
  retry?: RetryConfig;
  eventTranslator?: EventTranslatorConfig;
}

interface UniFiConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  verifySsl?: boolean;
  reconnectDelay?: number;
  maxRetries?: number;
}

interface DoordeckConfig {
  apiToken: string;
  refreshToken?: string;
  email: string;
  password: string;
  debug?: boolean;
}

interface LoggingConfig {
  level?: 'error' | 'warn' | 'info' | 'debug';
  fileLogging?: boolean;
  logDirectory?: string;
  maxFileSize?: number;
  maxFiles?: number;
  consoleLogging?: boolean;
}

interface HealthMonitorConfig {
  enabled?: boolean;
  checkInterval?: number;
  failureThreshold?: number;
  timeout?: number;
}

interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
}

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

interface EventTranslatorConfig {
  deduplicationWindow?: number;
  maxQueueSize?: number;
  processingDelay?: number;
}
```

### Validation

Validate configuration programmatically:

```typescript
import { validateConfig } from './config';

const validation = validateConfig(config);

if (!validation.isValid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => {
    console.error(`  - ${error}`);
  });
  process.exit(1);
}
```

---

## Extending the Bridge

### Custom Client Integration

Add support for other access control systems:

```typescript
import { EventEmitter } from 'events';

class CustomAccessClient extends EventEmitter {
  async connect(config: CustomConfig): Promise<void> {
    // Connection logic
    this.emit('connected');
  }

  async getDoors(): Promise<Door[]> {
    // Get doors from your system
  }

  async unlockDoor(doorId: string): Promise<void> {
    // Unlock logic
    this.emit('door-unlocked', { doorId });
  }
}

// Use in bridge
import { BridgeService } from './services/bridge';

const bridge = new BridgeService();
const customClient = new CustomAccessClient();

// Replace UniFi client
bridge.setAccessClient(customClient);
```

### Custom Door Mapping

Implement custom door mapping logic:

```typescript
interface CustomDoorMapper {
  mapDoor(unifiDoor: UniFiDoor): DoorMapping;
  findDoorByLockId(lockId: string): DoorMapping | null;
  findDoorByUniFiId(doorId: string): DoorMapping | null;
}

class LocationBasedMapper implements CustomDoorMapper {
  mapDoor(unifiDoor: UniFiDoor): DoorMapping {
    return {
      id: generateId(),
      unifiDoorId: unifiDoor.id,
      doordeckLockId: generateLockId(unifiDoor.location),
      name: `${unifiDoor.location} - ${unifiDoor.name}`,
      siteId: unifiDoor.siteId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
```

### Middleware Pattern

Add middleware for request/response processing:

```typescript
type Middleware = (context: Context, next: () => Promise<void>) => Promise<void>;

class BridgeWithMiddleware extends BridgeService {
  private middleware: Middleware[] = [];

  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  protected async handleUnlockCommand(command: UnlockCommand): Promise<void> {
    const context = { command, startTime: Date.now() };

    const execute = async (index: number): Promise<void> => {
      if (index >= this.middleware.length) {
        return super.handleUnlockCommand(command);
      }

      await this.middleware[index](context, () => execute(index + 1));
    };

    await execute(0);
  }
}

// Usage
const bridge = new BridgeWithMiddleware();

// Logging middleware
bridge.use(async (context, next) => {
  console.log(`Unlock command: ${context.command.lockId}`);
  await next();
  console.log(`Completed in ${Date.now() - context.startTime}ms`);
});

// Authentication middleware
bridge.use(async (context, next) => {
  if (!isAuthorized(context.command.userId)) {
    throw new Error('Unauthorized');
  }
  await next();
});
```

---

## Testing

### Unit Testing

Example test using Jest:

```typescript
import { BridgeService } from '../services/bridge';
import { ConfigLoader } from '../config';

describe('BridgeService', () => {
  let bridge: BridgeService;

  beforeEach(() => {
    bridge = new BridgeService();
  });

  afterEach(async () => {
    if (bridge.getState() !== 'stopped') {
      await bridge.stop();
    }
  });

  it('should initialize with valid config', async () => {
    const config = ConfigLoader.loadConfig('./config.example.json');
    await expect(bridge.initialize(config)).resolves.not.toThrow();
  });

  it('should transition states correctly', async () => {
    const config = ConfigLoader.loadConfig('./config.example.json');
    await bridge.initialize(config);

    expect(bridge.getState()).toBe('stopped');

    await bridge.start();
    expect(bridge.getState()).toBe('running');

    await bridge.stop();
    expect(bridge.getState()).toBe('stopped');
  });

  it('should emit events', async () => {
    const config = ConfigLoader.loadConfig('./config.example.json');
    await bridge.initialize(config);

    const stateChanges: string[] = [];
    bridge.on('state-changed', ({ current }) => {
      stateChanges.push(current);
    });

    await bridge.start();
    await bridge.stop();

    expect(stateChanges).toEqual(['starting', 'running', 'stopping', 'stopped']);
  });
});
```

### Integration Testing

Test with real services:

```typescript
describe('UniFi Integration', () => {
  it('should connect to controller', async () => {
    const client = new UniFiClient();

    await client.connect({
      host: process.env.UNIFI_HOST!,
      username: process.env.UNIFI_USERNAME!,
      password: process.env.UNIFI_PASSWORD!
    });

    const doors = await client.getDoors();
    expect(doors.length).toBeGreaterThan(0);

    await client.disconnect();
  });
});
```

### Mocking

Mock external dependencies:

```typescript
jest.mock('../clients/unifi', () => ({
  UniFiClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    getDoors: jest.fn().mockResolvedValue([
      { id: 'door-1', name: 'Front Door', siteId: 'site-1' }
    ]),
    unlockDoor: jest.fn().mockResolvedValue(undefined)
  }))
}));
```

---

## See Also

- [Architecture Overview](ARCHITECTURE.md) - System design
- [Configuration Reference](CONFIGURATION.md) - All settings
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [Installation Guide](INSTALLATION.md) - Setup procedures

---

**Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: UniFi-Doordeck Bridge Team
