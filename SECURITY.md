# Security Documentation

## Overview

The UniFi-Doordeck Bridge implements comprehensive security measures to protect sensitive credentials, prevent unauthorized access, and ensure secure communication between UniFi Access controllers and Doordeck Cloud.

## Security Features

### 1. Secure Credential Storage

**Problem**: Storing API keys, passwords, and tokens in plaintext configuration files poses a critical security risk.

**Solution**: All sensitive credentials are stored using platform-native secure storage:

- **Windows**: Windows Credential Manager
- **macOS**: Keychain
- **Linux**: libsecret
- **Fallback**: AES-256-GCM encrypted file storage

#### Credentials Protected

- UniFi API Key
- UniFi Password (legacy authentication)
- Doordeck Email
- Doordeck Password
- Doordeck API Token
- Doordeck Refresh Token
- REST API Authentication Key

#### Implementation

```typescript
import { CredentialManager, CredentialType } from './security/CredentialManager';

const credentialManager = CredentialManager.getInstance();

// Store credential
await credentialManager.setCredential(
  CredentialType.UNIFI_API_KEY,
  'your-api-key'
);

// Retrieve credential
const apiKey = await credentialManager.getCredential(
  CredentialType.UNIFI_API_KEY
);
```

### 2. SSL/TLS Certificate Verification

**Problem**: Disabling SSL verification (commonly done for self-signed certificates) opens the door to man-in-the-middle attacks.

**Solution**: SSL verification is mandatory and cannot be disabled. Self-signed certificates are supported via custom CA certificate configuration.

#### Configuration

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "caCertPath": "/path/to/custom-ca.pem"
  }
}
```

#### Features

- SSL verification always enabled
- Support for custom CA certificates
- Proper certificate chain validation
- Protection against MITM attacks

### 3. Log Sanitization

**Problem**: Sensitive data can leak through log files, exposing credentials to anyone with access to logs.

**Solution**: Automatic sanitization of all log output to redact sensitive information.

#### Data Redacted

- API keys and tokens
- Passwords and secrets
- Email addresses (in credential contexts)
- JWT tokens
- Private keys (PEM format)
- Credit card numbers
- Connection strings with embedded credentials

#### Pattern Detection

The log sanitizer uses multiple detection methods:

- **Pattern matching**: Regular expressions to detect sensitive patterns
- **Field name matching**: Redaction of known sensitive field names
- **Recursive sanitization**: Deep sanitization of nested objects

#### Example

```typescript
// Input log
logger.info('Config loaded', {
  apiKey: 'abc123secret',
  password: 'mypassword'
});

// Sanitized output
logger.info('Config loaded', {
  apiKey: '[REDACTED]',
  password: '[REDACTED]'
});
```

### 4. REST API Authentication

**Problem**: Unauthenticated REST API allows anyone on the network to access and control the bridge.

**Solution**: API key authentication required for all sensitive endpoints.

#### Authentication Methods

**Bearer Token (Recommended)**:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/status
```

**X-API-Key Header**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/api/status
```

**Query Parameter** (less secure):
```bash
curl "http://localhost:3000/api/status?apiKey=YOUR_API_KEY"
```

#### Protected Endpoints

- `GET /api/config` - Get configuration
- `POST /api/config` - Update configuration
- `GET /api/status` - Get service status
- `GET /api/logs` - View logs
- `GET /api/test` - Test connections
- `POST /api/service/*` - Service control
- `GET /api/auth/key` - Get API key (requires existing auth)

#### Public Endpoints

- `GET /api/health` - Health check (no authentication required)

#### API Key Management

**Get API Key**:
```bash
curl -H "Authorization: Bearer YOUR_CURRENT_KEY" \
  http://localhost:3000/api/auth/key
```

**Regenerate API Key** (programmatic):
```typescript
import { regenerateApiKey } from './security/ApiAuth';

const newApiKey = await regenerateApiKey();
console.log('New API key:', newApiKey);
```

### 5. Configuration Security

#### Secure Configuration Fields

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "caCertPath": "/path/to/ca.pem",
    "_credentialsInSecureStorage": true
  },
  "doordeck": {
    "_credentialsInSecureStorage": true
  },
  "security": {
    "apiAuthEnabled": true,
    "logSanitization": true,
    "autoMigrateCredentials": false
  },
  "siteId": "site-custom-id"
}
```

#### Security Options

- `apiAuthEnabled`: Enable/disable API authentication (default: true)
- `logSanitization`: Enable/disable log sanitization (default: true)
- `autoMigrateCredentials`: Automatically migrate plaintext credentials (default: false)

## Migration Guide

### Migrating from Plaintext Configuration

If you have an existing installation with plaintext credentials in `config.json`, use the migration tool:

#### Dry Run (Test Migration)

```bash
npm run migrate-credentials -- --dry-run
```

#### Perform Migration

```bash
npm run migrate-credentials
```

#### Custom Configuration Path

```bash
npm run migrate-credentials /path/to/config.json
```

#### Migration Process

1. **Backup**: Creates timestamped backup of original config
2. **Extract**: Identifies all plaintext credentials
3. **Store**: Saves credentials to secure storage
4. **Update**: Removes plaintext credentials from config file
5. **Verify**: Confirms migration success

#### Post-Migration

After migration:
- Credentials are stored in platform-native secure storage
- Configuration file contains `_credentialsInSecureStorage: true` markers
- Original config backup saved with timestamp
- Service automatically loads credentials from secure storage

## Security Best Practices

### Credential Management

1. **Never commit credentials** to version control
2. **Use environment variables** for development/testing only
3. **Rotate credentials regularly** (especially after team changes)
4. **Use API keys** instead of username/password where possible
5. **Limit credential access** to necessary personnel only

### Network Security

1. **Use SSL/TLS** for all communications
2. **Validate certificates** - never disable SSL verification
3. **Use custom CA certificates** for self-signed certificates
4. **Restrict API access** to trusted networks
5. **Enable firewall rules** to limit access to bridge ports

### Configuration Security

1. **Set restrictive file permissions** on config files (0600)
2. **Store configuration** in secure locations
3. **Encrypt backups** containing configuration
4. **Review logs regularly** for security events
5. **Update dependencies** to patch security vulnerabilities

### Operational Security

1. **Monitor API access** for unauthorized attempts
2. **Review logs** for suspicious activity
3. **Implement rate limiting** for API endpoints
4. **Use strong API keys** (auto-generated recommended)
5. **Audit access logs** regularly

## Threat Model

### Threats Mitigated

| Threat | Mitigation | Severity |
|--------|-----------|----------|
| Plaintext credential storage | Secure credential storage | **CRITICAL** |
| SSL/TLS bypass | Mandatory SSL verification | **CRITICAL** |
| Credential leakage via logs | Log sanitization | **HIGH** |
| Unauthorized API access | API key authentication | **HIGH** |
| Man-in-the-middle attacks | SSL certificate verification | **HIGH** |
| Configuration file exposure | Credential separation | **MEDIUM** |

### Residual Risks

1. **Compromised system**: If the host system is compromised, credentials in secure storage may be accessible
2. **Insider threats**: Users with system access can retrieve credentials
3. **Physical access**: Physical access to the system may allow credential extraction
4. **Supply chain attacks**: Compromised dependencies could expose credentials

### Risk Mitigation

- **System hardening**: Follow OS-specific security guidelines
- **Access control**: Implement principle of least privilege
- **Physical security**: Secure server hardware
- **Dependency management**: Regular security audits and updates

## Security Incident Response

### Suspected Credential Compromise

1. **Immediate Actions**:
   - Regenerate API keys
   - Change UniFi and Doordeck passwords
   - Review access logs for unauthorized activity
   - Disconnect bridge from network if necessary

2. **Investigation**:
   - Review logs for suspicious activity
   - Check for unauthorized configuration changes
   - Audit door access events
   - Identify compromise vector

3. **Recovery**:
   - Update all credentials
   - Patch vulnerabilities
   - Restore from clean backup if needed
   - Document incident and lessons learned

### API Key Regeneration

```typescript
// Programmatic regeneration
import { regenerateApiKey } from './security/ApiAuth';

const newKey = await regenerateApiKey();
console.log('New API key:', newKey);
```

```bash
# Command-line regeneration
npm run regenerate-api-key
```

### Clearing All Credentials

```typescript
import { CredentialManager } from './security/CredentialManager';

const credentialManager = CredentialManager.getInstance();
await credentialManager.clearAllCredentials();
```

## Compliance

### Data Protection

- Credentials stored using platform-native secure storage
- Automatic redaction of sensitive data in logs
- No plaintext storage of passwords or API keys
- Secure transmission using SSL/TLS

### Audit Trail

- All API access logged (with sanitization)
- Configuration changes tracked
- Door access events recorded
- Error conditions logged

### Access Control

- API authentication required
- Role-based access (future enhancement)
- Credential segregation
- Principle of least privilege

## Security Updates

### Update Policy

- Security patches applied promptly
- Dependencies reviewed regularly
- Security advisories monitored
- CVE tracking for dependencies

### Reporting Security Issues

To report security vulnerabilities:

1. **Do not** open public GitHub issues for security issues
2. Email security concerns to: [security contact]
3. Include detailed description and reproduction steps
4. Allow reasonable time for fix before public disclosure

## Security Checklist

### Deployment

- [ ] Migrate plaintext credentials to secure storage
- [ ] Enable SSL/TLS certificate verification
- [ ] Configure API authentication
- [ ] Set restrictive file permissions (0600)
- [ ] Review and configure security options
- [ ] Test credential recovery
- [ ] Document API keys securely

### Operations

- [ ] Monitor API access logs
- [ ] Review security logs weekly
- [ ] Rotate credentials quarterly
- [ ] Update dependencies monthly
- [ ] Test backup/recovery procedures
- [ ] Audit access controls
- [ ] Review firewall rules

### Maintenance

- [ ] Apply security patches within 7 days
- [ ] Update dependencies regularly
- [ ] Review security advisories
- [ ] Test disaster recovery
- [ ] Update documentation
- [ ] Train personnel on security practices

## Additional Resources

### Documentation

- [Credential Manager API](./src/security/CredentialManager.ts)
- [Log Sanitizer API](./src/security/LogSanitizer.ts)
- [API Authentication](./src/security/ApiAuth.ts)

### Security Tools

- **Migration Tool**: `scripts/migrate-credentials.ts`
- **API Key Management**: Built into REST API
- **Credential Management**: Programmatic API

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)

---

**Last Updated**: 2025-01-21
**Version**: 0.1.0
**Security Contact**: [To be configured]
