# Doordeck Headless SDK - Findings and Analysis

## Test Results: ✅ SUCCESS

The Doordeck Headless SDK (v0.160.0) has been successfully tested and validated for use in our UniFi-Doordeck bridge project.

## Summary

- **SDK Version**: 0.160.0
- **Platform**: JavaScript/TypeScript (Kotlin Multiplatform compiled to JS)
- **NPM Package**: `@doordeck/doordeck-headless-sdk`
- **Test Status**: ✅ All tests passed
- **Authentication**: Requires real Fusion instance (not tested with live credentials)

## Key Findings

### 1. SDK Initialization

The SDK can be successfully initialized in Node.js environment with a custom SecureStorage implementation:

```typescript
import { com } from '@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk';

// Create custom SecureStorage for Node.js
const secureStorage = new NodeSecureStorage(); // See tests/doordeck-sdk-test.ts

const sdkConfig = new com.doordeck.multiplatform.sdk.config.SdkConfig.Builder()
  .setFusionHost('http://localhost:8080')
  .setSecureStorageOverride(secureStorage as unknown as com.doordeck.multiplatform.sdk.storage.SecureStorage)
  .setDebugLogging(true)
  .build();

const doordeck = await com.doordeck.multiplatform.sdk.KDoordeckFactory.initialize(sdkConfig);
```

### 2. Fusion Resource API Methods

The following Fusion API methods are available and accessible:

#### Authentication
- **`login(email: string, password: string)`** → `Promise<FusionLoginResponse>`
  - Returns: `{ authToken: string }`

#### Integration Management
- **`getIntegrationType()`** → `Promise<IntegrationTypeResponse>`
  - Get the type of integration configured

- **`getIntegrationConfiguration(type: string)`** → `Promise<IntegrationConfigurationResponse[]>`
  - Get configuration for a specific integration type

#### Door Management
- **`enableDoor(name: string, siteId: string, controller: LockController)`** → `Promise<any>`
  - Register a new door with Doordeck
  - Requires a controller implementation

- **`deleteDoor(deviceId: string)`** → `Promise<any>`
  - Remove a door from Doordeck

- **`getDoorStatus(deviceId: string)`** → `Promise<DoorStateResponse>`
  - Get current state of a door

- **`startDoor(deviceId: string)`** → `Promise<any>`
  - Start monitoring door events

- **`stopDoor(deviceId: string)`** → `Promise<any>`
  - Stop monitoring door events

### 3. Available Controller Types

The SDK includes implementations for the following access control systems:

| Controller | System |
|-----------|--------|
| AlpetaController | Alpeta |
| AmagController | AMAG |
| AssaAbloyController | Assa Abloy |
| AvigilonController | Avigilon |
| AxisController | Axis |
| CCureController | CCure |
| DemoController | Demo/Testing |
| GallagherController | Gallagher Command Centre |
| GenetecController | Genetec |
| LenelController | LenelS2 |
| MitrefinchController | Mitrefinch |
| PaxtonNet2Controller | Paxton Net2 |
| Paxton10Controller | Paxton10 |
| IntegraV1Controller | Integra V1 |
| IntegraV2Controller | Integra V2 |
| PacController | PAC |
| TdsiExgardeController | TDSI Exgarde |
| TdsiGardisController | TDSI Gardis |
| ZktecoController | ZKTeco |

**⚠️ IMPORTANT**: UniFi Access is NOT in the list. We need to create our own controller implementation.

### 4. Node.js Compatibility

#### Challenge: Browser-Specific APIs
The SDK is built for Kotlin Multiplatform and targets both browser and Node.js. However, it expects `localStorage` by default, which is only available in browsers.

#### Solution: Custom SecureStorage
We implemented a custom `NodeSecureStorage` class that provides the required interface:

```typescript
class NodeSecureStorage {
  private storage = new Map<string, unknown>();

  // Implement all required methods:
  // - setApiEnvironment / getApiEnvironment
  // - addCloudAuthToken / getCloudAuthToken
  // - addCloudRefreshToken / getCloudRefreshToken
  // - setFusionHost / getFusionHost
  // - addFusionAuthToken / getFusionAuthToken
  // - addPublicKey / getPublicKey
  // - addPrivateKey / getPrivateKey
  // - setKeyPairVerified / getKeyPairVerified
  // - addUserId / getUserId
  // - addUserEmail / getUserEmail
  // - addCertificateChain / getCertificateChain
  // - clear
}
```

**For production**, this should use Windows Credential Manager (DPAPI) for secure encrypted storage.

### 5. Architecture Implications

#### How Our Bridge Will Work

```
┌─────────────────┐
│  Doordeck Cloud │
│   (Mobile App)  │
└────────┬────────┘
         │ Fusion API calls
         │ (unlock, status)
         ▼
┌─────────────────────────────┐
│  UniFi-Doordeck Bridge      │
│  (Our Software)             │
│                             │
│  ┌────────────────────────┐ │
│  │ Doordeck SDK Client    │ │
│  │ - Fusion API login     │ │
│  │ - enableDoor()         │ │
│  │ - startDoor()          │ │
│  │ - getDoorStatus()      │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ UniFi Access Client    │ │
│  │ - Discover doors       │ │
│  │ - Unlock/lock          │ │
│  │ - Event listener       │ │
│  └────────────────────────┘ │
└──────────────┬──────────────┘
               │ REST + WebSocket
               ▼
        ┌──────────────┐
        │ UniFi Access │
        │  Controller  │
        └──────────────┘
```

#### Implementation Strategy

1. **Create UniFiController** (similar to PaxtonNet2Controller, GallagherController, etc.)
   - This will need to be done at the bridge level, not in the SDK
   - We'll pass controller configuration to `enableDoor()`

2. **Implement Fusion Resource APIs**
   - Use `login()` to authenticate with Fusion (if needed)
   - Use `enableDoor()` to register UniFi doors
   - Use `startDoor()` to begin event monitoring
   - Use `getDoorStatus()` to query current state

3. **Event Flow**
   - Bridge receives unlock command from Doordeck Cloud via Fusion API
   - Bridge translates to UniFi Access API call
   - UniFi unlocks physical door
   - UniFi sends event via WebSocket
   - Bridge sends event back to Doordeck Cloud

### 6. Next Steps

#### Immediate (Phase 1):
1. ✅ Research Doordeck SDK - **DONE**
2. ✅ Test SDK initialization - **DONE**
3. 🔄 Research UniFi Access API (hjdhjd/unifi-access or custom)

#### Phase 2:
4. Create DoordeckClient module (`src/clients/doordeck/`)
5. Create UniFiClient module (`src/clients/unifi/`)
6. Implement bridge service logic
7. Create door mapping system

### 7. Important Notes

- **Authentication**: We need actual Fusion credentials to test the full authentication flow
- **Fusion Host**: Need to determine if we connect to Doordeck Cloud directly or need a local Fusion instance
- **Controller Type**: UniFi Access is not a built-in controller type - we'll need to create our own implementation
- **SecureStorage**: Production implementation must use Windows Credential Manager for security
- **WebSocket**: The SDK likely uses WebSocket for real-time events from Doordeck Cloud

### 8. Questions to Clarify

1. Do we need a local Fusion instance, or do we connect directly to Doordeck Cloud?
2. How do we register a new controller type (UniFi Access) with Doordeck?
3. What's the authentication flow? (API tokens vs email/password)
4. How does the Fusion API receive unlock commands from Doordeck Cloud? (WebSocket, polling, or callback?)

## Test Script Location

See `tests/doordeck-sdk-test.ts` for the complete working test implementation.

## Documentation

- SDK TypeScript Definitions: `node_modules/@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk.d.ts`
- Official Docs (redirects): https://doordeck.github.io/docs/category/kotlin-multiplatform-sdk/
