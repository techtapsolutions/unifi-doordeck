# UniFi-Doordeck Bridge - Architecture Overview

Comprehensive technical documentation of the UniFi-Doordeck Bridge system architecture, design patterns, and implementation details.

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Design Patterns](#design-patterns)
- [Technology Stack](#technology-stack)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)
- [Error Handling & Resilience](#error-handling--resilience)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

The UniFi-Doordeck Bridge is a standalone Windows service that acts as a bidirectional translator between UniFi Access control systems and the Doordeck Cloud platform, enabling mobile credential access for UniFi Access-controlled doors.

###

 **Purpose**

Enable users to unlock UniFi Access doors using the Doordeck mobile app while maintaining full integration with existing access control infrastructure.

### **Key Capabilities**

- **Unlock Commands**: Doordeck mobile app → Cloud → Bridge → UniFi Access → Physical door
- **Event Forwarding**: Physical door events → UniFi Access → Bridge → Doordeck Cloud → Mobile app
- **Door Synchronization**: Automatic discovery and registration of UniFi doors with Doordeck
- **Health Monitoring**: Continuous monitoring of all system components
- **Fault Tolerance**: Automatic recovery from failures with circuit breakers and retry logic

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Doordeck Cloud                           │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Mobile App    │  │   REST API      │  │  Lock Registry  │ │
│  │  (User Taps)   │  │  (Commands)     │  │  (Door Status)  │ │
│  └────────┬───────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼───────────────────┼──────────────────────┼─────────┘
            │                   │                      │
            └───────────────────┼──────────────────────┘
                                │
                           HTTPS/WSS
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│           UniFi-Doordeck Bridge (Windows Service)               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Bridge Service (Core)                   │   │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │  Door Mapper  │  │ State Machine│  │Event Handler │ │   │
│  │  └───────────────┘  └──────────────┘  └──────────────┘ │   │
│  └──────────┬──────────────────┬─────────────────┬─────────┘   │
│             │                  │                 │             │
│   ┌─────────▼─────────┐  ┌────▼────────┐  ┌────▼──────────┐  │
│   │ DoordeckClient    │  │   Event     │  │  Command      │  │
│   │  - Auth           │  │ Translator  │  │  Listener     │  │
│   │  - Registration   │  │  - Map      │  │  - Polling    │  │
│   │  - API Calls      │  │  - Queue    │  │  - Execute    │  │
│   └───────────────────┘  │  - Forward  │  └───────────────┘  │
│                          └─────────────┘                      │
│   ┌──────────────────────────────────────────────────────┐   │
│   │            UniFiClient (Access Integration)          │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐│   │
│   │  │  REST API   │  │  WebSocket  │  │  Door CRUD   ││   │
│   │  │  (Auth)     │  │  (Events)   │  │  (Control)   ││   │
│   │  └─────────────┘  └─────────────┘  └──────────────┘│   │
│   └───────────────────────┬──────────────────────────────┘   │
│                           │                                   │
│   ┌───────────────────────┼───────────────────────────────┐  │
│   │          Resilience Layer                             │  │
│   │  ┌──────────────┐  ┌───────────────┐  ┌────────────┐│  │
│   │  │    Retry     │  │Circuit Breaker│  │   Health   ││  │
│   │  │   (Backoff)  │  │  (3 States)   │  │  Monitor   ││  │
│   │  └──────────────┘  └───────────────┘  └────────────┘│  │
│   └───────────────────────────────────────────────────────┘  │
└───────────────────────────┼───────────────────────────────────┘
                            │
                       HTTPS/WSS
                            │
┌───────────────────────────┼───────────────────────────────────┐
│              UniFi Access Controller                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  REST API   │  │  WebSocket  │  │   Door Registry     │  │
│  │  (Control)  │  │  (Events)   │  │   (5 doors)         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────────────┘  │
└─────────┼────────────────┼────────────────┼──────────────────┘
          │                │                │
┌─────────▼────────────────▼────────────────▼──────────────────┐
│                    Physical Hardware                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │Door Reader │  │Lock Strike │  │Door Sensor │  │  NFC   ││
│  │  (Badge)   │  │ (Solenoid) │  │ (Contact)  │  │  Tile  ││
│  └────────────┘  └────────────┘  └────────────┘  └────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Components

#### 1. BridgeService (Core Orchestrator)

**Location**: `src/services/bridge/BridgeService.ts`

**Responsibilities**:
- Lifecycle management (initialize, start, stop)
- Component coordination
- Event routing
- State management
- Statistics tracking

**Key Methods**:
```typescript
class BridgeService {
  async initialize(config: BridgeConfig): Promise<void>
  async start(): Promise<void>
  async stop(): Promise<void>

  private async syncDoors(): Promise<void>
  private handleUnlockCommand(command: UnlockCommand): Promise<void>
  private handleUniFiEvent(event: DoorEvent): Promise<void>

  getState(): BridgeState
  getStats(): BridgeStatistics
}
```

**State Machine**:
```
STOPPED → INITIALIZING → STARTING → RUNNING → STOPPING → STOPPED
```

#### 2. DoordeckClient

**Location**: `src/clients/doordeck/DoordeckClient.ts`

**Responsibilities**:
- Authentication with Doordeck API
- Door registration (Fusion API)
- Lock status queries
- Event forwarding

**Key Methods**:
```typescript
class DoordeckClient {
  async authenticate(): Promise<void>
  async registerDoor(door: DoorMapping): Promise<void>
  async getDoorStatus(lockId: string): Promise<LockStatus>
  async forwardEvent(event: DoordeckEvent): Promise<void>
}
```

**Authentication Flow**:
```
1. Login with email/password + API token
2. Receive access token + refresh token
3. Store tokens
4. Use access token for API calls
5. Refresh when expired (automatic)
```

#### 3. UniFiClient

**Location**: `src/clients/unifi/UniFiClient.ts`

**Responsibilities**:
- Connect to UniFi Access controller
- Authenticate and maintain session
- Door discovery and control
- Real-time event streaming (WebSocket)

**Key Methods**:
```typescript
class UniFiClient {
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async getDoors(): Promise<UniFiDoor[]>
  async unlockDoor(doorId: string): Promise<void>
  async lockDoor(doorId: string): Promise<void>

  on(event: 'door-event', handler: (event: DoorEvent) => void): void
}
```

**WebSocket Connection**:
```
1. Authenticate via REST API
2. Establish WebSocket connection
3. Subscribe to door events
4. Maintain heartbeat
5. Auto-reconnect on disconnect
```

#### 4. EventTranslator

**Location**: `src/services/events/EventTranslator.ts`

**Responsibilities**:
- Translate UniFi events to Doordeck format
- Event deduplication
- Event queuing for offline scenarios
- Rate limiting

**Event Mapping**:
```typescript
UniFi Event          → Doordeck Event
─────────────────────────────────────
door_opened          → DOOR_OPENED
door_closed          → DOOR_CLOSED
door_unlocked        → DOOR_UNLOCKED
door_locked          → DOOR_LOCKED
access_granted       → ACCESS_GRANTED
access_denied        → ACCESS_DENIED
door_forced          → DOOR_FORCED_OPEN
door_held_open       → DOOR_HELD_OPEN
```

#### 5. CommandListener

**Location**: `src/services/commands/CommandListener.ts`

**Responsibilities**:
- Poll Doordeck for unlock commands (every 5s)
- Emit unlock events to bridge
- Handle command queue

**Polling Strategy**:
```
1. Query getDoorStatus() for all locks
2. Detect status change (LOCKED → UNLOCKED)
3. Emit unlock-command event
4. Wait polling interval
5. Repeat
```

### Supporting Components

#### ConfigLoader

**Location**: `src/config/loader.ts`

**Features**:
- Load from file or environment variables
- Merge configuration sources
- Apply defaults
- Validate configuration

#### HealthMonitor

**Location**: `src/utils/healthMonitor.ts`

**Monitors**:
- UniFi connectivity
- Doordeck connectivity
- Door mapping integrity
- Memory usage
- Error rates

#### CircuitBreaker

**Location**: `src/utils/circuitBreaker.ts`

**States**:
- **CLOSED**: Normal operation
- **OPEN**: Failure threshold exceeded, requests fail fast
- **HALF_OPEN**: Testing recovery, limited requests

#### RetryWithBackoff

**Location**: `src/utils/retry.ts`

**Strategy**:
- Exponential backoff with jitter
- Configurable max attempts
- Per-operation configuration

---

## Data Flow Diagrams

### Unlock Command Flow

```
┌──────────┐
│   User   │
│  (Taps)  │
└────┬─────┘
     │ 1. Tap to unlock
     ▼
┌──────────────┐
│Doordeck App  │
│  (Mobile)    │
└────┬─────────┘
     │ 2. Send unlock request
     ▼
┌────────────────────┐
│  Doordeck Cloud    │
│  - Validate user   │
│  - Check perms     │
└────┬───────────────┘
     │ 3. Update lock status
     ▼
┌───────────────────────────┐
│  CommandListener (Bridge) │
│  - Polling every 5s       │
│  - Detect status change   │
└────┬──────────────────────┘
     │ 4. Emit unlock-command
     ▼
┌──────────────────────┐
│  BridgeService       │
│  - Lookup door ID    │
│  - Validate mapping  │
└────┬─────────────────┘
     │ 5. Call unlockDoor()
     ▼
┌───────────────────┐
│  UniFiClient      │
│  - HTTP POST      │
│  - /doors/X/unlock│
└────┬──────────────┘
     │ 6. Send unlock command
     ▼
┌─────────────────────┐
│ UniFi Controller    │
│  - Validate request │
│  - Send to hardware │
└────┬────────────────┘
     │ 7. Activate lock
     ▼
┌──────────────┐
│Physical Door │
│  (Unlocks)   │
└──────────────┘
```

**Timing**: Typical 5-10 seconds from tap to unlock.

### Event Forwarding Flow

```
┌──────────────┐
│Physical Door │
│  (Opens)     │
└────┬─────────┘
     │ 1. Door sensor triggered
     ▼
┌───────────────────┐
│ UniFi Controller  │
│  - Generate event │
│  - Send via WSS   │
└────┬──────────────┘
     │ 2. WebSocket message
     ▼
┌──────────────────┐
│  UniFiClient     │
│  - Parse event   │
│  - Emit locally  │
└────┬─────────────┘
     │ 3. 'door-event' emitted
     ▼
┌──────────────────────┐
│  BridgeService       │
│  - Route to handler  │
└────┬─────────────────┘
     │ 4. Pass to translator
     ▼
┌──────────────────────┐
│  EventTranslator     │
│  - Deduplicate       │
│  - Map event type    │
│  - Enrich metadata   │
│  - Queue if needed   │
└────┬─────────────────┘
     │ 5. Translated event
     ▼
┌──────────────────────┐
│  DoordeckClient      │
│  - POST /events      │
└────┬─────────────────┘
     │ 6. Forward to cloud
     ▼
┌──────────────────────┐
│  Doordeck Cloud      │
│  - Store event       │
│  - Notify users      │
└────┬─────────────────┘
     │ 7. Push notification
     ▼
┌──────────────┐
│Doordeck App  │
│  (Shows      │
│   "Door      │
│   Opened")   │
└──────────────┘
```

**Timing**: Typical 1-3 seconds from physical event to app notification.

### Door Sync Flow

```
┌──────────────────┐
│  BridgeService   │
│  (On startup)    │
└────┬─────────────┘
     │ 1. Call syncDoors()
     ▼
┌──────────────────┐
│  UniFiClient     │
│  GET /doors      │
└────┬─────────────┘
     │ 2. Return door list
     ▼
┌───────────────────────────┐
│  BridgeService            │
│  - Iterate each door      │
│  - Create door mapping    │
└────┬──────────────────────┘
     │ 3. For each door
     ▼
┌──────────────────────────┐
│  DoordeckClient          │
│  registerDoor()          │
│  - Create LockController │
│  - Call Fusion API       │
└────┬─────────────────────┘
     │ 4. Register with Doordeck
     ▼
┌──────────────────────┐
│  Doordeck Cloud      │
│  - Create lock entry │
│  - Return lock ID    │
└────┬─────────────────┘
     │ 5. Lock ID
     ▼
┌──────────────────────────┐
│  BridgeService           │
│  - Store mapping         │
│  - UniFi ID ↔ Lock ID    │
└──────────────────────────┘
```

**Timing**: Runs on startup, typically 1-5 seconds per door.

---

## Design Patterns

### 1. Event-Driven Architecture

**Pattern**: Observer/Event Emitter

**Implementation**:
```typescript
class UniFiClient extends EventEmitter {
  private handleWebSocketMessage(message: any): void {
    if (message.type === 'door_event') {
      this.emit('door-event', {
        doorId: message.doorId,
        eventType: message.eventType,
        timestamp: new Date()
      });
    }
  }
}

// Usage in BridgeService
this.unifiClient.on('door-event', (event) => {
  this.handleUniFiEvent(event);
});
```

**Benefits**:
- Loose coupling
- Asynchronous processing
- Easy to extend

### 2. Circuit Breaker Pattern

**Pattern**: Fault Tolerance

**Implementation**:
```typescript
enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Failures exceeded, fail fast
  HALF_OPEN // Testing recovery
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

**Use Cases**:
- UniFi API calls
- Doordeck API calls
- Database operations

### 3. Retry with Exponential Backoff

**Pattern**: Resilience

**Implementation**:
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < options.maxAttempts) {
        const delay = calculateDelay(attempt, options);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.initialDelay *
                          Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return cappedDelay + jitter;
}
```

**Benefits**:
- Handles transient failures
- Prevents thundering herd
- Configurable per operation

### 4. State Machine Pattern

**Pattern**: Lifecycle Management

**Implementation**:
```typescript
enum BridgeState {
  STOPPED = 'stopped',
  INITIALIZING = 'initializing',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

class BridgeService {
  private state: BridgeState = BridgeState.STOPPED;

  private async transition(newState: BridgeState): Promise<void> {
    const previousState = this.state;
    this.state = newState;

    this.emit('state-changed', {
      previous: previousState,
      current: newState
    });

    logger.info(`Bridge state: ${previousState} → ${newState}`);
  }

  async start(): Promise<void> {
    if (this.state !== BridgeState.STOPPED) {
      throw new Error(`Cannot start from state: ${this.state}`);
    }

    await this.transition(BridgeState.STARTING);
    // ... startup logic ...
    await this.transition(BridgeState.RUNNING);
  }
}
```

**Valid Transitions**:
```
STOPPED → INITIALIZING → STARTING → RUNNING
RUNNING → STOPPING → STOPPED
ANY → ERROR
ERROR → STOPPED (after manual intervention)
```

### 5. Adapter Pattern

**Pattern**: Third-Party Integration

**Implementation**:
```typescript
// UniFi Access Controller Adapter
interface LockController {
  baseUrl: string;
  doorId: string;
  // ... other properties
}

class UniFiController implements LockController {
  constructor(
    public baseUrl: string,
    public username: string,
    public password: string,
    public doorId: string,
    public port?: number,
    public verifySsl?: boolean
  ) {}

  validate(): string[] {
    const errors = [];
    if (!this.baseUrl) errors.push('baseUrl is required');
    if (!this.doorId) errors.push('doorId is required');
    return errors;
  }
}

// Used by Doordeck SDK
function createUniFiController(config, doorId): UniFiController {
  return new UniFiController(
    `https://${config.host}:${config.port}`,
    config.username,
    config.password,
    doorId,
    config.port,
    config.verifySsl
  );
}
```

**Benefits**:
- Decouples Doordeck SDK from UniFi specifics
- Allows SDK to work with UniFi controllers
- Matches existing controller patterns (Gallagher, Paxton, etc.)

---

## Technology Stack

### Runtime
- **Node.js**: 20 LTS
- **TypeScript**: 5.5.4
- **Platform**: Windows 10/11, Server 2016+

### Core Dependencies

**Integration SDKs**:
- `@doordeck/doordeck-headless-sdk@0.160.0` - Doordeck Fusion APIs
- `unifi-access@1.3.2` - UniFi Access API client

**Communication**:
- `ws@8.18.0` - WebSocket client for UniFi events

**Utilities**:
- `winston@3.14.2` - Logging framework
- `dotenv@16.4.5` - Environment variables

**Windows Service**:
- `node-windows@1.0.0-beta.8` - Service registration

### Development Dependencies
- `jest@29.7.0` - Testing framework
- `ts-jest@29.2.4` - TypeScript support for Jest
- `eslint@8.57.0` - Linting
- `prettier@3.3.3` - Code formatting
- `ts-node@10.9.2` - TypeScript execution

---

## Security Architecture

### Credential Management

**Storage**:
- Configuration file: `C:\ProgramData\UniFi-Doordeck-Bridge\config.json`
- File permissions: Administrators only (NTFS ACL)
- Environment variables: For production deployments

**Encryption**:
- All API communication over HTTPS/WSS
- TLS 1.2 minimum
- Certificate validation (configurable)

**Best Practices**:
```typescript
// Never log credentials
logger.debug('Authenticating', {
  host: config.host,
  username: config.username,
  // password: NEVER LOG THIS
});

// Use environment variables in production
const password = process.env.UNIFI_PASSWORD || config.unifi.password;
```

### API Security

**UniFi Access**:
- Session-based authentication
- Token refresh on expiration
- HTTPS only

**Doordeck**:
- API key + email/password
- JWT access tokens
- Automatic token refresh

### Audit Logging

**Logged Events**:
- All unlock commands
- Authentication attempts
- Configuration changes
- Errors and failures

**Log Format**:
```
2025-10-20 18:30:45 [info]: Unlock command: lock=abc123 user=john@example.com success=true
```

**Log Retention**:
- 5 files @ 10MB each (default)
- Rotated automatically
- Configurable retention

---

## Scalability & Performance

### Performance Characteristics

**Throughput**:
- Unlock commands: 1-2 per second sustained
- Events: 10-20 per second sustained
- Doors: 20+ doors per bridge (tested)

**Latency**:
- Unlock command: 5-10 seconds (Doordeck polling interval)
- Event forwarding: 1-3 seconds
- Health checks: 60 seconds interval

**Resource Usage**:
- Memory: ~200MB typical
- CPU: <5% typical, <20% peak
- Network: <1 Mbps typical

### Scaling Strategies

**Vertical Scaling**:
- Increase polling frequency for lower latency
- Increase max queue size for high traffic
- Adjust worker threads (Node.js)

**Horizontal Scaling**:
- Deploy multiple bridges for different controllers
- Partition doors across bridges
- Load balance at network level

**Optimization**:
```typescript
// Batch event processing
async processEventBatch(events: Event[]): Promise<void> {
  await Promise.all(
    events.map(event => this.forwardEvent(event))
  );
}

// Connection pooling
const pool = new ConnectionPool({
  min: 2,
  max: 10,
  idleTimeout: 30000
});
```

---

## Error Handling & Resilience

### Error Categories

**Transient Errors** (Retry):
- Network timeouts
- Temporary API failures
- Rate limiting

**Permanent Errors** (Fail):
- Invalid credentials
- Invalid configuration
- Missing resources

### Resilience Mechanisms

**Circuit Breaker** → Prevents cascading failures
**Retry with Backoff** → Handles transient errors
**Health Monitoring** → Detects failures early
**Event Queue** → Buffers during outages
**Graceful Degradation** → Continues partial operation

### Recovery Procedures

**Connection Loss**:
1. Circuit breaker opens
2. Retry with exponential backoff
3. After timeout, test connection (HALF_OPEN)
4. If successful, resume normal operation (CLOSED)
5. If failed, repeat

**Service Restart**:
1. Stop accepting new commands
2. Flush event queue
3. Close all connections
4. Wait for in-flight operations
5. Reload configuration
6. Reinitialize components
7. Reconnect to services
8. Resume operation

---

## Deployment Architecture

### Windows Service Deployment

```
C:\Program Files\UniFi-Doordeck-Bridge\
├── dist/                  # Compiled JavaScript
│   ├── index.js          # Main entry point
│   ├── service/          # Service wrapper
│   └── ...
├── node_modules/          # Dependencies
├── scripts/               # Install/uninstall scripts
├── package.json
└── ...

C:\ProgramData\UniFi-Doordeck-Bridge\
├── config.json           # Configuration
└── logs/                 # Log files
    └── bridge.log
```

### Service Configuration

**Service Name**: `UniFi-Doordeck-Bridge`
**Display Name**: UniFi-Doordeck Bridge
**Start Type**: Automatic
**Account**: LocalSystem
**Dependencies**: None

### High Availability Setup

```
┌─────────────────────────┐
│  Primary Bridge         │
│  (Active)               │
│  - Processes commands   │
│  - Forwards events      │
└────────┬────────────────┘
         │
    Failover
         │
┌────────▼────────────────┐
│  Secondary Bridge       │
│  (Standby)              │
│  - Monitors primary     │
│  - Takes over on fail   │
└─────────────────────────┘
```

**Failover Detection**:
- Heartbeat every 30 seconds
- Standby monitors heartbeat
- Takes over after 3 missed beats
- Prevents split-brain with lock file

---

## See Also

- [Installation Guide](INSTALLATION.md) - Deployment procedures
- [Configuration Reference](CONFIGURATION.md) - All settings
- [Troubleshooting](TROUBLESHOOTING.md) - Problem resolution
- [API Documentation](API.md) - Developer reference

---

**Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: UniFi-Doordeck Bridge Team
