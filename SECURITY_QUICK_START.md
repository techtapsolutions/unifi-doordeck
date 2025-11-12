# Security Quick Start Guide

## For Developers

### Installing Secure Dependencies

```bash
# Windows
npm install credential-vault

# macOS/Linux
npm install keytar

# Or rely on fallback (works everywhere)
# No additional dependencies needed
```

### Using Secure Credential Storage

```typescript
import { CredentialManager, CredentialType } from './src/security/CredentialManager';

// Get instance
const credentialManager = CredentialManager.getInstance();

// Store a credential
await credentialManager.setCredential(
  CredentialType.UNIFI_API_KEY,
  'your-secret-key'
);

// Retrieve a credential
const apiKey = await credentialManager.getCredential(
  CredentialType.UNIFI_API_KEY
);

// Delete a credential
await credentialManager.deleteCredential(
  CredentialType.UNIFI_API_KEY
);
```

### Sanitizing Logs

```typescript
import { sanitizeLogMessage, sanitizeObject } from './src/security/LogSanitizer';

// Sanitize a string
const safe = sanitizeLogMessage('apiKey: abc123secret');
// Result: 'apiKey: [REDACTED]'

// Sanitize an object
const safeObj = sanitizeObject({
  username: 'user',
  password: 'secret',
  apiKey: 'key123'
});
// Result: { username: 'user', password: '[REDACTED]', apiKey: '[REDACTED]' }

// Logger automatically sanitizes
logger.info('Config', { apiKey: 'secret' });
// Logged as: 'Config { apiKey: '[REDACTED]' }'
```

### Protecting API Endpoints

```typescript
import { requireApiAuth, optionalApiAuth } from './src/security/ApiAuth';

// Require authentication
app.get('/api/secure', requireApiAuth(), (req, res) => {
  res.json({ data: 'sensitive information' });
});

// Optional authentication
app.get('/api/public', optionalApiAuth(), (req, res) => {
  res.json({ data: 'public information' });
});
```

### Configuration Best Practices

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
    "logSanitization": true
  },
  "siteId": "my-custom-site"
}
```

---

## For Administrators

### Initial Setup

1. **Install the application**
2. **Migrate existing credentials**:
   ```bash
   npm run security:migrate
   ```
3. **Get your API key**:
   ```bash
   # First start - check logs for auto-generated key
   npm start

   # Or retrieve via API (after authentication is set up)
   curl -H "Authorization: Bearer TEMP_KEY" \
     http://localhost:3000/api/auth/key
   ```

### Using the REST API

**Health Check** (no auth):
```bash
curl http://localhost:3000/api/health
```

**Get Status** (requires auth):
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/status
```

**Get Configuration** (requires auth):
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/config
```

**Update Configuration** (requires auth):
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"unifi": {"host": "192.168.1.1"}}' \
  http://localhost:3000/api/config
```

### Credential Management

**View Stored Credentials**:
```bash
# Check which credentials are in secure storage
# (This shows types, not actual values)
npm run credentials:list
```

**Clear All Credentials**:
```bash
npm run credentials:clear
```

**Regenerate API Key**:
```bash
npm run api-key:regenerate
```

---

## For Security Teams

### Security Checklist

**Installation**:
- [ ] Migrate plaintext credentials: `npm run security:migrate`
- [ ] Verify SSL certificates configured
- [ ] Review security configuration
- [ ] Set file permissions to 0600
- [ ] Document API key securely

**Ongoing Operations**:
- [ ] Review logs weekly for security events
- [ ] Rotate credentials quarterly
- [ ] Update dependencies monthly
- [ ] Test backup/recovery quarterly
- [ ] Audit access logs monthly

### Security Monitoring

**Check Logs for Security Events**:
```bash
# View recent logs
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/logs?lines=100"

# Or check log files directly
tail -f /path/to/logs/bridge.log
```

**Monitor API Access**:
- All API requests are logged with sanitization
- Failed authentication attempts are logged
- Configuration changes are audited

### Incident Response

**If API Key is Compromised**:
1. Regenerate API key immediately
2. Review access logs for unauthorized activity
3. Check for configuration changes
4. Update all clients with new key

**If Credentials are Compromised**:
1. Change passwords in UniFi and Doordeck immediately
2. Update credentials in secure storage
3. Review door access logs
4. Document incident

---

## Common Issues

### "Credential not found"

**Problem**: Credential not in secure storage

**Solution**:
```bash
# Re-run migration
npm run security:migrate

# Or set credential manually
node -e "
const { CredentialManager, CredentialType } = require('./dist/security/CredentialManager');
const cm = CredentialManager.getInstance();
cm.setCredential(CredentialType.UNIFI_API_KEY, 'your-key');
"
```

### "Authentication failed"

**Problem**: Invalid or missing API key

**Solution**:
```bash
# Check API key in logs (on first start)
npm start 2>&1 | grep "API key"

# Or regenerate
npm run api-key:regenerate
```

### "SSL certificate verification failed"

**Problem**: Self-signed certificate not trusted

**Solution**:
```json
{
  "unifi": {
    "caCertPath": "/path/to/ca.pem"
  }
}
```

---

## Additional Resources

- **Full Documentation**: [SECURITY.md](./SECURITY.md)
- **Implementation Details**: [SECURITY_FIXES_SUMMARY.md](./SECURITY_FIXES_SUMMARY.md)
- **API Reference**: See source code documentation

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-01-21
