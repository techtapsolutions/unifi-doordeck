# UniFi-Doordeck Bridge - Configuration Reference

Complete reference for all configuration parameters in the UniFi-Doordeck Bridge.

## Table of Contents

- [Configuration File Location](#configuration-file-location)
- [Configuration Structure](#configuration-structure)
- [UniFi Access Configuration](#unifi-access-configuration)
- [Doordeck Configuration](#doordeck-configuration)
- [Logging Configuration](#logging-configuration)
- [Health Monitor Configuration](#health-monitor-configuration)
- [Circuit Breaker Configuration](#circuit-breaker-configuration)
- [Retry Configuration](#retry-configuration)
- [Event Translator Configuration](#event-translator-configuration)
- [Environment Variables](#environment-variables)
- [Configuration Examples](#configuration-examples)
- [Validation](#validation)

---

## Configuration File Location

### Default Locations

**Windows Service:**
```
C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

**Manual Installation:**
```
./config.json (project root)
```

### Custom Location

Set via environment variable:
```cmd
set CONFIG_PATH=C:\path\to\config.json
```

Or via command line:
```cmd
node dist\index.js --config=C:\path\to\config.json
```

---

## Configuration Structure

The configuration file is a JSON document with the following top-level sections:

```json
{
  "unifi": { ... },           // UniFi Access controller settings
  "doordeck": { ... },        // Doordeck API credentials
  "logging": { ... },         // Logging configuration
  "healthMonitor": { ... },   // Health monitoring settings
  "circuitBreaker": { ... },  // Circuit breaker fault tolerance
  "retry": { ... },           // Retry logic configuration
  "eventTranslator": { ... }  // Event processing settings
}
```

---

## UniFi Access Configuration

Settings for connecting to UniFi Access controllers.

### Parameters

#### `host` (required)
- **Type**: `string`
- **Description**: IP address or hostname of UniFi Access controller
- **Examples**:
  - `"192.168.1.100"`
  - `"unifi-access.local"`
  - `"access.example.com"`
- **Validation**: Must be valid IP address or hostname

#### `port` (optional)
- **Type**: `number`
- **Default**: `443`
- **Description**: HTTPS port for UniFi Access API
- **Range**: `1-65535`
- **Example**: `443`

#### `username` (required)
- **Type**: `string`
- **Description**: Administrator username for UniFi Access
- **Example**: `"admin"`
- **Notes**: User must have admin privileges for API access

#### `password` (required)
- **Type**: `string`
- **Description**: Password for UniFi Access account
- **Example**: `"secure-password-123"`
- **Security**: Store in environment variable for production

#### `verifySsl` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Verify SSL/TLS certificates
- **Recommendation**: Set to `true` for production
- **Use Case**: Set to `false` for self-signed certificates in testing

#### `reconnectDelay` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `5000` (5 seconds)
- **Description**: Delay before reconnecting after connection loss
- **Range**: `>= 0`
- **Example**: `10000` for 10 second delay

#### `maxRetries` (optional)
- **Type**: `number`
- **Default**: `3`
- **Description**: Maximum connection retry attempts
- **Range**: `>= 0`
- **Example**: `5` for more resilient connections

### Example

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "port": 443,
    "username": "admin",
    "password": "MySecurePassword123!",
    "verifySsl": true,
    "reconnectDelay": 5000,
    "maxRetries": 3
  }
}
```

---

## Doordeck Configuration

Settings for authenticating with Doordeck Cloud.

### Parameters

#### `apiToken` (required)
- **Type**: `string`
- **Description**: Doordeck API token for authentication
- **Example**: `"dd_1234567890abcdef"`
- **Obtain**: Contact Doordeck support or developer portal
- **Security**: Store in environment variable for production

#### `email` (required)
- **Type**: `string`
- **Description**: Doordeck account email address
- **Example**: `"admin@example.com"`
- **Validation**: Must be valid email format

#### `password` (required)
- **Type**: `string`
- **Description**: Doordeck account password
- **Example**: `"SecurePassword456!"`
- **Security**: Store in environment variable for production

#### `refreshToken` (optional)
- **Type**: `string`
- **Default**: Auto-generated on first login
- **Description**: Refresh token for maintaining session
- **Notes**: Automatically managed by the bridge

#### `debug` (optional)
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable debug logging for Doordeck SDK
- **Use Case**: Set to `true` for troubleshooting API issues

### Example

```json
{
  "doordeck": {
    "apiToken": "dd_1234567890abcdef",
    "email": "admin@example.com",
    "password": "SecurePassword456!",
    "debug": false
  }
}
```

---

## Logging Configuration

Settings for application logging.

### Parameters

#### `level` (optional)
- **Type**: `string`
- **Default**: `"info"`
- **Options**: `"error"`, `"warn"`, `"info"`, `"debug"`
- **Description**: Minimum log level to output
- **Recommendations**:
  - Production: `"info"` or `"warn"`
  - Development: `"debug"`
  - Troubleshooting: `"debug"`

#### `fileLogging` (optional)
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable logging to files
- **Notes**: Console logging always enabled

#### `logDirectory` (optional)
- **Type**: `string`
- **Default**: `"C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs"` (Windows Service)
- **Description**: Directory for log files
- **Notes**: Directory must exist or be creatable

#### `maxFileSize` (optional)
- **Type**: `number` (bytes)
- **Default**: `10485760` (10 MB)
- **Description**: Maximum size of a single log file before rotation
- **Example**: `20971520` for 20 MB

#### `maxFiles` (optional)
- **Type**: `number`
- **Default**: `5`
- **Description**: Maximum number of rotated log files to keep
- **Range**: `>= 1`
- **Notes**: Older files are deleted when limit is reached

#### `consoleLogging` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable console output
- **Notes**: Useful to disable for Windows Service deployment

### Example

```json
{
  "logging": {
    "level": "info",
    "fileLogging": true,
    "logDirectory": "C:\\ProgramData\\UniFi-Doordeck-Bridge\\logs",
    "maxFileSize": 10485760,
    "maxFiles": 5,
    "consoleLogging": true
  }
}
```

---

## Health Monitor Configuration

Settings for monitoring component health.

### Parameters

#### `enabled` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable health monitoring
- **Recommendation**: Always enabled in production

#### `checkInterval` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `60000` (1 minute)
- **Description**: Interval between health checks
- **Range**: `> 0`
- **Recommendation**: 30-120 seconds for production

#### `failureThreshold` (optional)
- **Type**: `number`
- **Default**: `3`
- **Description**: Consecutive failures before marking component unhealthy
- **Range**: `>= 1`
- **Notes**: Higher values increase tolerance for transient failures

#### `timeout` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `5000` (5 seconds)
- **Description**: Timeout for individual health check
- **Range**: `> 0`
- **Recommendation**: 5-10 seconds for network checks

### Example

```json
{
  "healthMonitor": {
    "enabled": true,
    "checkInterval": 60000,
    "failureThreshold": 3,
    "timeout": 5000
  }
}
```

---

## Circuit Breaker Configuration

Settings for circuit breaker fault tolerance pattern.

### Parameters

#### `failureThreshold` (optional)
- **Type**: `number`
- **Default**: `5`
- **Description**: Number of failures before opening circuit
- **Range**: `>= 1`
- **Notes**: Circuit opens after this many consecutive failures

#### `successThreshold` (optional)
- **Type**: `number`
- **Default**: `2`
- **Description**: Successful calls required to close circuit
- **Range**: `>= 1`
- **Notes**: Applies when circuit is in HALF_OPEN state

#### `timeout` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `60000` (1 minute)
- **Description**: Time to wait before attempting recovery
- **Range**: `> 0`
- **Notes**: Circuit transitions from OPEN to HALF_OPEN after timeout

### Circuit States

1. **CLOSED** - Normal operation, requests pass through
2. **OPEN** - Too many failures, requests fail immediately
3. **HALF_OPEN** - Testing recovery, limited requests allowed

### Example

```json
{
  "circuitBreaker": {
    "failureThreshold": 5,
    "successThreshold": 2,
    "timeout": 60000
  }
}
```

---

## Retry Configuration

Settings for automatic retry logic with exponential backoff.

### Parameters

#### `maxAttempts` (optional)
- **Type**: `number`
- **Default**: `3`
- **Description**: Maximum retry attempts
- **Range**: `>= 1`
- **Notes**: Includes initial attempt (3 = 1 initial + 2 retries)

#### `initialDelay` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `1000` (1 second)
- **Description**: Initial delay before first retry
- **Range**: `> 0`
- **Notes**: Subsequent delays increase exponentially

#### `maxDelay` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `30000` (30 seconds)
- **Description**: Maximum delay between retries
- **Range**: `> 0`
- **Notes**: Caps exponential backoff growth

#### `backoffMultiplier` (optional)
- **Type**: `number`
- **Default**: `2`
- **Description**: Multiplier for exponential backoff
- **Range**: `> 0`
- **Formula**: `delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)`
- **Example**: With multiplier=2, delays are 1s, 2s, 4s, 8s, ...

### Retry Calculation Example

With default settings (initialDelay=1000, backoffMultiplier=2, maxDelay=30000):

| Attempt | Calculated Delay | Actual Delay (capped) |
|---------|------------------|----------------------|
| 1       | 1000ms          | 1000ms               |
| 2       | 2000ms          | 2000ms               |
| 3       | 4000ms          | 4000ms               |
| 4       | 8000ms          | 8000ms               |
| 5       | 16000ms         | 16000ms              |
| 6       | 32000ms         | 30000ms (capped)     |

### Example

```json
{
  "retry": {
    "maxAttempts": 3,
    "initialDelay": 1000,
    "maxDelay": 30000,
    "backoffMultiplier": 2
  }
}
```

---

## Event Translator Configuration

Settings for translating and processing events between UniFi and Doordeck.

### Parameters

#### `deduplicationWindow` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `5000` (5 seconds)
- **Description**: Time window for detecting duplicate events
- **Range**: `>= 0`
- **Notes**: Events with same ID within window are ignored

#### `maxQueueSize` (optional)
- **Type**: `number`
- **Default**: `1000`
- **Description**: Maximum queued events before dropping oldest
- **Range**: `>= 1`
- **Notes**: Prevents memory overflow during outages

#### `processingDelay` (optional)
- **Type**: `number` (milliseconds)
- **Default**: `100` (100ms)
- **Description**: Delay between processing batches
- **Range**: `>= 0`
- **Notes**: Rate limiting to prevent API throttling

### Example

```json
{
  "eventTranslator": {
    "deduplicationWindow": 5000,
    "maxQueueSize": 1000,
    "processingDelay": 100
  }
}
```

---

## Environment Variables

Override configuration using environment variables. Environment variables take precedence over config file values.

### UniFi Access Variables

```cmd
set UNIFI_HOST=192.168.1.100
set UNIFI_PORT=443
set UNIFI_USERNAME=admin
set UNIFI_PASSWORD=secure-password
set UNIFI_VERIFY_SSL=true
set UNIFI_RECONNECT_DELAY=5000
set UNIFI_MAX_RETRIES=3
```

### Doordeck Variables

```cmd
set DOORDECK_API_TOKEN=dd_1234567890abcdef
set DOORDECK_EMAIL=admin@example.com
set DOORDECK_PASSWORD=secure-password
set DOORDECK_DEBUG=false
```

### Logging Variables

```cmd
set LOG_LEVEL=info
set LOG_FILE_ENABLED=true
set LOG_DIRECTORY=C:\ProgramData\UniFi-Doordeck-Bridge\logs
set LOG_MAX_FILE_SIZE=10485760
set LOG_MAX_FILES=5
```

### Other Variables

```cmd
set CONFIG_PATH=C:\path\to\config.json
set NODE_ENV=production
```

---

## Configuration Examples

### Minimal Production Configuration

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "username": "admin",
    "password": "secure-password"
  },
  "doordeck": {
    "apiToken": "dd_1234567890abcdef",
    "email": "admin@example.com",
    "password": "secure-password"
  }
}
```

All other settings use defaults.

### Development Configuration

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "username": "admin",
    "password": "dev-password",
    "verifySsl": false
  },
  "doordeck": {
    "apiToken": "dd_dev_token",
    "email": "dev@example.com",
    "password": "dev-password",
    "debug": true
  },
  "logging": {
    "level": "debug",
    "fileLogging": true,
    "consoleLogging": true
  }
}
```

### High-Traffic Production Configuration

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "username": "admin",
    "password": "secure-password",
    "reconnectDelay": 10000,
    "maxRetries": 5
  },
  "doordeck": {
    "apiToken": "dd_production_token",
    "email": "production@example.com",
    "password": "secure-password"
  },
  "logging": {
    "level": "warn",
    "fileLogging": true,
    "maxFileSize": 20971520,
    "maxFiles": 10
  },
  "healthMonitor": {
    "checkInterval": 30000,
    "failureThreshold": 5
  },
  "circuitBreaker": {
    "failureThreshold": 10,
    "timeout": 120000
  },
  "retry": {
    "maxAttempts": 5,
    "maxDelay": 60000
  },
  "eventTranslator": {
    "maxQueueSize": 5000,
    "processingDelay": 50
  }
}
```

### Minimal Resource Configuration

For constrained environments:

```json
{
  "unifi": {
    "host": "192.168.1.100",
    "username": "admin",
    "password": "secure-password"
  },
  "doordeck": {
    "apiToken": "dd_token",
    "email": "admin@example.com",
    "password": "secure-password"
  },
  "logging": {
    "level": "error",
    "fileLogging": false
  },
  "healthMonitor": {
    "checkInterval": 300000
  },
  "eventTranslator": {
    "maxQueueSize": 100
  }
}
```

---

## Validation

The bridge validates configuration on startup.

### Validation Rules

**Required Fields:**
- `unifi.host`
- `unifi.username`
- `unifi.password`
- `doordeck.apiToken`
- `doordeck.email`
- `doordeck.password`

**Format Validation:**
- `unifi.host` - Valid IP or hostname
- `unifi.port` - Integer 1-65535
- `doordeck.email` - Valid email format
- `logging.level` - One of: error, warn, info, debug

**Range Validation:**
- All timeouts/delays must be > 0
- All thresholds must be >= 1
- All counts must be >= 0

### Validation Errors

Example error messages:

```
Configuration validation failed:
- UniFi host is required
- Invalid UniFi port: 99999 (must be 1-65535)
- Invalid Doordeck email: invalid-email
- Invalid log level: verbose (must be one of: error, warn, info, debug)
- Invalid retry max delay: -1000 (must be > 0)
```

### Testing Configuration

Test configuration before deployment:

```cmd
node dist/index.js --validate-config
```

Or programmatically:

```typescript
import { ConfigLoader, validateConfig } from './config';

const config = ConfigLoader.loadConfig('./config.json');
const validation = validateConfig(config);

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

---

## Best Practices

### Security

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data in production
3. **Rotate credentials** regularly
4. **Enable SSL verification** (`verifySsl: true`) in production
5. **Restrict file permissions** on config.json (Windows: Administrators only)

### Performance

1. **Adjust retry settings** based on network reliability
2. **Increase maxQueueSize** for high-traffic environments
3. **Reduce checkInterval** for critical deployments
4. **Use appropriate log levels** (warn/error in production)
5. **Enable file logging** for troubleshooting

### Reliability

1. **Configure health monitoring** for all deployments
2. **Use circuit breakers** to prevent cascade failures
3. **Set reasonable timeouts** based on network latency
4. **Monitor logs** for recurring errors
5. **Test configuration** before deploying changes

---

## See Also

- [Installation Guide](INSTALLATION.md) - Setup and deployment
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Architecture](ARCHITECTURE.md) - System design and components
- [API Documentation](API.md) - Developer reference

---

**Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: UniFi-Doordeck Bridge Team
