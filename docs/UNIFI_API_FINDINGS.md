# UniFi Access API - Findings and Analysis

## Test Results: ✅ SUCCESS

The `unifi-access` library (v1.3.2) by hjdhjd has been successfully tested and validated for use in our UniFi-Doordeck bridge project.

## Summary

- **Library**: `unifi-access`
- **Version**: 1.3.2
- **Author**: hjdhjd
- **NPM Package**: `https://www.npmjs.com/package/unifi-access`
- **GitHub**: `https://github.com/hjdhjd/unifi-access`
- **Test Status**: ✅ All tests passed
- **License**: ISC
- **Authentication**: Requires real UniFi Access controller

## Key Findings

### 1. Library Overview

The `unifi-access` library is described as "A nearly complete implementation of the UniFi Access API." It provides:

- Native UniFi Access support
- TypeScript-first implementation (87.2% TypeScript, 12.8% JavaScript)
- EventEmitter-based architecture
- WebSocket support for real-time events
- Promise-based asynchronous API

### 2. Installation

```bash
npm install unifi-access
```

**Dependencies**: 8 additional packages installed
**Vulnerabilities**: 0 found

### 3. AccessApi Class

The main class is `AccessApi` which extends `EventEmitter`:

```typescript
import { AccessApi } from 'unifi-access';

const api = new AccessApi();
```

### 4. Authentication & Session Management

#### Login
```typescript
async login(host: string, username: string, password: string): Promise<boolean>
```

Establishes credentials for subsequent API calls. Must be called before `getBootstrap()`.

**Parameters**:
- `host`: Controller IP address or hostname
- `username`: UniFi Access username
- `password`: User password

**Returns**: `true` on success, `false` on failure

#### Logout
```typescript
async logout(): Promise<boolean>
```

Terminates the active session and clears credentials.

#### Reset
```typescript
async reset(): Promise<boolean>
```

Clears all cached data and credentials (more comprehensive than logout).

### 5. Data Retrieval & Bootstrap

#### getBootstrap
```typescript
async getBootstrap(): Promise<boolean>
```

Retrieves the complete system topology including:
- All devices
- All doors
- All floors
- Controller configuration

**Important**: After calling this method successfully:
- `api.devices` will contain all devices
- `api.doors` will contain all doors
- `api.floors` will contain all floors
- A `bootstrap` event is emitted

### 6. Available Properties

After successful `getBootstrap()`, the following properties are populated:

| Property | Type | Description |
|----------|------|-------------|
| `bootstrap` | `AccessBootstrapConfigInterface \| null` | Complete system topology data |
| `controller` | `AccessControllerConfigInterface \| null` | Hub configuration details |
| `devices` | `AccessDeviceConfigInterface[] \| null` | All connected devices |
| `doors` | `AccessDoorConfigInterface[] \| null` | Door configurations |
| `floors` | `AccessFloorConfigInterface[] \| null` | Floor layouts |
| `isAdminUser` | `boolean` | Permission level check |
| `name` | `string` | Formatted controller identifier |

### 7. Door Control Methods

#### Unlock Door
```typescript
async unlock(deviceId: string): Promise<boolean>
```

Activates door unlock command.

**Parameters**:
- `deviceId`: The unique identifier of the door device

**Returns**: `true` on success, `false` on failure

**Note**: There is no explicit `lock()` method visible in the API. UniFi Access doors auto-lock based on configured timers.

### 8. Device Operations

#### Get Device Name
```typescript
getDeviceName(deviceId: string): string
```

Returns a formatted device identifier (useful for logging and display).

#### Update Device
```typescript
async updateDevice<T>(deviceId: string, payload: T): Promise<boolean>
```

Modifies device configuration with type-safe payloads.

### 9. Event System

The `AccessApi` extends `EventEmitter` and emits several events:

#### Bootstrap Event
```typescript
api.on('bootstrap', () => {
  console.log('Bootstrap completed');
  console.log('Devices:', api.devices);
  console.log('Doors:', api.doors);
});
```

Triggered when `getBootstrap()` successfully retrieves topology data.

#### Message Event
```typescript
api.on('message', (packet: AccessEventPacket) => {
  console.log('Event received:', packet);
});
```

Raw event packets received via WebSocket for real-time updates.

### 10. API Endpoints

Valid endpoints for `retrieve()` and `getApiEndpoint()`:

- `bootstrap`: Complete system topology
- `device`: Device-specific operations
- `login`: Authentication endpoint
- `self`: Current user information
- `websocket`: Real-time event stream

### 11. Typical Workflow

```typescript
import { AccessApi } from 'unifi-access';

async function example() {
  // 1. Create instance
  const api = new AccessApi();

  // 2. Set up event listeners
  api.on('bootstrap', () => {
    console.log(`Found ${api.doors?.length || 0} doors`);
  });

  api.on('message', (event) => {
    console.log('Door event:', event);
  });

  // 3. Login
  const loginSuccess = await api.login(
    '192.168.1.1',  // Controller IP
    'username',
    'password'
  );

  if (!loginSuccess) {
    throw new Error('Login failed');
  }

  // 4. Get bootstrap data
  const bootstrapSuccess = await api.getBootstrap();

  if (!bootstrapSuccess) {
    throw new Error('Bootstrap failed');
  }

  // 5. List all doors
  api.doors?.forEach(door => {
    console.log(`Door: ${door.name} (${door.id})`);
  });

  // 6. Unlock a door
  if (api.doors && api.doors.length > 0) {
    const doorId = api.doors[0].id;
    const unlockSuccess = await api.unlock(doorId);
    console.log(`Unlock: ${unlockSuccess ? 'Success' : 'Failed'}`);
  }

  // 7. Logout
  await api.logout();
}
```

### 12. Integration with Doordeck

#### Bridge Architecture

Our bridge will act as a translator between Doordeck and UniFi Access:

```
Doordeck Cloud (Fusion API)
         ↕
UniFi-Doordeck Bridge
    ├─ DoordeckClient (uses doordeck-headless-sdk)
    └─ UniFiClient (uses unifi-access)
         ↕
UniFi Access Controller
         ↕
Physical Doors/Readers
```

#### Data Flow: Unlock Operation

1. **User taps phone** → Doordeck mobile app
2. **Unlock request** → Doordeck Cloud
3. **Fusion API call** → Bridge receives unlock command
4. **Bridge translates** → Determines which UniFi door
5. **`api.unlock(doorId)`** → UniFi Access controller
6. **Door unlocks** → Physical hardware activates
7. **Event emitted** → UniFi sends event via WebSocket
8. **Bridge listens** → Receives event from UniFi
9. **Status update** → Bridge sends event to Doordeck Cloud
10. **User notification** → Doordeck app shows "Unlocked"

#### Door Mapping

We'll need to maintain a mapping between:
- **Doordeck Lock ID** ↔ **UniFi Door ID**

Example mapping structure:
```typescript
interface DoorMapping {
  doordeckLockId: string;      // From Doordeck
  unifiDoorId: string;          // From UniFi Access
  name: string;                 // Friendly name
  siteId: string;               // Doordeck site ID
  enabled: boolean;             // Is this mapping active
}
```

### 13. Comparison with Doordeck SDK

| Feature | Doordeck SDK | UniFi Access |
|---------|-------------|--------------|
| **Language** | Kotlin → JavaScript | TypeScript |
| **Authentication** | Email/Password or Token | Username/Password |
| **Device Discovery** | Fusion API | Bootstrap method |
| **Door Control** | enableDoor(), startDoor() | unlock() |
| **Events** | Via Fusion API | EventEmitter + WebSocket |
| **Storage** | Custom SecureStorage required | None required |
| **Real-time** | Yes (Fusion API) | Yes (WebSocket) |

### 14. Implementation Considerations

#### Advantages of unifi-access Library

✅ **Well-maintained**: Latest version 1.3.2 (June 2025)
✅ **TypeScript-first**: Full type definitions
✅ **EventEmitter pattern**: Familiar Node.js pattern
✅ **No custom storage**: Simpler than Doordeck SDK
✅ **Active community**: Used in Homebridge plugins
✅ **Promise-based**: Modern async/await support

#### Potential Challenges

⚠️ **No explicit lock() method**: Doors auto-lock based on timers
⚠️ **Requires controller access**: Need local network access
⚠️ **Authentication storage**: We'll need to securely store credentials
⚠️ **Event filtering**: Need to filter relevant events from WebSocket stream
⚠️ **Error handling**: Need robust retry logic for network issues

### 15. Next Steps

#### Immediate (Phase 2):

1. ✅ Research and test unifi-access library - **DONE**
2. 🔄 Create UniFiClient module (`src/clients/unifi/`)
3. 🔄 Implement door discovery and mapping
4. 🔄 Implement unlock command handler
5. 🔄 Implement event listener for door status

#### Phase 3:

6. Integrate UniFiClient with DoordeckClient
7. Create bridge service orchestration
8. Implement door synchronization
9. Test end-to-end flow

### 16. Questions to Clarify

1. ✅ Does the unifi-access library support WebSocket? **YES**
2. ✅ Can we enumerate all doors? **YES** (via `api.doors`)
3. ❓ What events are emitted for door open/close/unlock/lock?
4. ❓ How do we handle multiple UniFi Access controllers?
5. ❓ What happens if controller connection is lost?
6. ❓ Can we get door status without unlocking?

### 17. Additional Resources

- **NPM Package**: https://www.npmjs.com/package/unifi-access
- **GitHub Repository**: https://github.com/hjdhjd/unifi-access
- **API Documentation**: https://github.com/hjdhjd/unifi-access/blob/main/docs/access-api.md
- **Related Projects**:
  - `homebridge-unifi-access`: Homebridge plugin using this library
  - `unifi-protect`: Sister library for UniFi Protect cameras

### 18. Test Script Location

See `tests/unifi-access-test.ts` for the complete working test implementation.

## Conclusion

The `unifi-access` library is a solid, production-ready solution for integrating with UniFi Access controllers. It provides all the functionality we need:

- ✅ Authentication and session management
- ✅ Door discovery via bootstrap
- ✅ Unlock command execution
- ✅ Real-time events via WebSocket
- ✅ TypeScript support

**Recommendation**: Use `unifi-access` library for our UniFi Access integration. No need for a custom implementation.
