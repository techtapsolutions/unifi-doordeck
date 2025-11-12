# Integration Tests

This directory contains integration tests that verify the UniFi-Doordeck Bridge works correctly with real or mocked external services.

## Test Structure

### Test Files

- **helpers.ts** - Shared test utilities, mocks, and helper functions
- **DoordeckClient.test.ts** - Tests for Doordeck Fusion API integration
- **UniFiClient.test.ts** - Tests for UniFi Access controller integration
- **BridgeService.test.ts** - End-to-end bridge service tests

## Running Integration Tests

### Quick Start (CI/Mock Mode)

Integration tests are skipped in CI by default since they require real services:

```bash
npm test
```

### Running with Real Services (Development)

To run integration tests against real Doordeck and UniFi Access services:

1. **Set up environment variables:**

```bash
# UniFi Access credentials
export UNIFI_TEST_HOST=192.168.1.100
export UNIFI_TEST_USERNAME=admin
export UNIFI_TEST_PASSWORD=your-password

# Doordeck credentials
export DOORDECK_TEST_TOKEN=dd_your_api_token
export DOORDECK_TEST_EMAIL=your@email.com
export DOORDECK_TEST_PASSWORD=your-password
```

2. **Run integration tests:**

```bash
# Run all tests including integration
npm run test:integration

# Run specific integration test file
npx jest tests/integration/DoordeckClient.test.ts

# Run with verbose output
npx jest tests/integration --verbose
```

### Running Individual Test Suites

```bash
# Test Doordeck client only
npx jest tests/integration/DoordeckClient.test.ts

# Test UniFi client only
npx jest tests/integration/UniFiClient.test.ts

# Test end-to-end bridge
npx jest tests/integration/BridgeService.test.ts
```

## Test Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UNIFI_TEST_HOST` | UniFi Access controller IP/hostname | For UniFi tests |
| `UNIFI_TEST_USERNAME` | UniFi Access admin username | For UniFi tests |
| `UNIFI_TEST_PASSWORD` | UniFi Access admin password | For UniFi tests |
| `DOORDECK_TEST_TOKEN` | Doordeck API token | For Doordeck tests |
| `DOORDECK_TEST_EMAIL` | Doordeck account email | For Doordeck tests |
| `DOORDECK_TEST_PASSWORD` | Doordeck account password | For Doordeck tests |
| `CI` | Set to 'true' to skip integration tests | Optional |

### Test Modes

#### 1. CI Mode (Default)
- Skips all integration tests
- Only runs unit tests
- No external dependencies required

```bash
CI=true npm test
```

#### 2. Mock Mode
- Uses mock responses
- No real services required
- Tests structure and error handling

```bash
npm test tests/integration
```

#### 3. Real Service Mode
- Connects to real Doordeck and UniFi services
- Requires valid credentials
- Full end-to-end testing

```bash
# Set environment variables first
npm run test:integration
```

## Test Scenarios

### DoordeckClient Integration

- **Initialization**: SDK setup and token validation
- **Authentication**: Login with email/password
- **Door Management**: Register, start, stop monitoring
- **Event Forwarding**: Send door events to Doordeck Cloud
- **Command Polling**: Detect unlock commands from mobile app
- **Error Handling**: Network errors, invalid credentials, disconnection

### UniFiClient Integration

- **Initialization**: Controller connection setup
- **Authentication**: Login with admin credentials
- **Door Discovery**: Enumerate doors from controller
- **Door Operations**: Unlock doors, get status
- **Event Listening**: Receive real-time door events
- **Reconnection**: Handle connection loss and recovery
- **Error Handling**: Invalid hosts, timeouts, API errors

### BridgeService End-to-End

- **Service Lifecycle**: Initialize, start, stop
- **Door Synchronization**: Auto-discover and map doors
- **Unlock Flow**: Doordeck app → Bridge → UniFi → Physical lock
- **Event Flow**: Physical door → UniFi → Bridge → Doordeck Cloud
- **Health Monitoring**: Component status tracking
- **Error Recovery**: Network failures, service restarts
- **Statistics**: Track operations and performance

## Writing New Integration Tests

### Guidelines

1. **Use skipInCI()** for tests requiring real services
2. **Use environment variables** for credentials
3. **Add fallback mocks** for CI/local testing
4. **Test error paths** alongside happy paths
5. **Use helper functions** from helpers.ts
6. **Add timeouts** for async operations
7. **Cleanup resources** in afterEach hooks

### Example Test

```typescript
import { skipInCI, waitForEvent, delay } from './helpers';

const describeIntegration = skipInCI('Requires real service');

describeIntegration('My Integration Test', () => {
  let client: MyClient;

  beforeEach(async () => {
    client = new MyClient();
    await client.initialize();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should perform operation', async () => {
    const result = await client.doSomething();
    expect(result).toBe(true);
  });
});
```

## Troubleshooting

### Tests Skip in CI

**Expected behavior** - Integration tests are designed to skip in CI environments. To run them:

```bash
unset CI  # Remove CI flag
npm test tests/integration
```

### Connection Timeouts

If tests timeout:
- Verify network connectivity
- Check firewall rules
- Increase timeout in test (default 5000ms)
- Verify service credentials

### Authentication Failures

If login fails:
- Verify credentials in environment variables
- Check API token validity
- Ensure account has proper permissions
- Check for IP whitelisting requirements

### No Doors Found

If door discovery returns empty:
- Verify doors exist in UniFi Access
- Check user has admin permissions
- Ensure controller is accessible
- Review controller logs

## Best Practices

1. **Keep credentials secure** - Never commit credentials to git
2. **Use .env files** - Store credentials in .env (gitignored)
3. **Test incrementally** - Start with unit tests, then integration
4. **Monitor resources** - Check for leaks in long-running tests
5. **Document assumptions** - Note any test prerequisites
6. **Clean up properly** - Always disconnect/cleanup in afterEach
7. **Test edge cases** - Network failures, invalid data, etc.

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test  # Skips integration tests in CI

  integration-tests:
    runs-on: windows-latest
    # Only run on main branch or manual trigger
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:integration
        env:
          UNIFI_TEST_HOST: ${{ secrets.UNIFI_TEST_HOST }}
          UNIFI_TEST_USERNAME: ${{ secrets.UNIFI_TEST_USERNAME }}
          UNIFI_TEST_PASSWORD: ${{ secrets.UNIFI_TEST_PASSWORD }}
          DOORDECK_TEST_TOKEN: ${{ secrets.DOORDECK_TEST_TOKEN }}
          DOORDECK_TEST_EMAIL: ${{ secrets.DOORDECK_TEST_EMAIL }}
          DOORDECK_TEST_PASSWORD: ${{ secrets.DOORDECK_TEST_PASSWORD }}
```

## Next Steps

After integration tests pass:
1. Run stress tests (see tests/stress)
2. Perform security audit
3. Test with pilot customers
4. Build production installer
5. Submit for Doordeck certification
