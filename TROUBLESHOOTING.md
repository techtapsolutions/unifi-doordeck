# UniFi-Doordeck Bridge - Troubleshooting Guide

Comprehensive guide for diagnosing and resolving common issues with the UniFi-Doordeck Bridge.

## Table of Contents

- [Quick Diagnostic Steps](#quick-diagnostic-steps)
- [Service Issues](#service-issues)
- [Connection Issues](#connection-issues)
- [Authentication Issues](#authentication-issues)
- [Door Sync Issues](#door-sync-issues)
- [Unlock Command Issues](#unlock-command-issues)
- [Event Forwarding Issues](#event-forwarding-issues)
- [Performance Issues](#performance-issues)
- [Log Analysis](#log-analysis)
- [Advanced Debugging](#advanced-debugging)
- [FAQ](#faq)
- [Getting Help](#getting-help)

---

## Quick Diagnostic Steps

When encountering issues, follow these steps:

### 1. Check Service Status

```cmd
sc query "UniFi-Doordeck-Bridge"
```

**Expected**: `STATE: 4 RUNNING`

**If stopped**:
```cmd
sc start "UniFi-Doordeck-Bridge"
```

### 2. Review Recent Logs

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"
```

Look for `[error]` or `[warn]` entries in the last few minutes.

### 3. Verify Configuration

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

Check for:
- Valid JSON syntax
- Correct credentials
- Proper network settings

### 4. Test Network Connectivity

**UniFi Controller:**
```cmd
ping 192.168.1.100
curl https://192.168.1.100/api/health
```

**Doordeck API:**
```cmd
ping api.doordeck.com
curl https://api.doordeck.com/health
```

---

## Service Issues

### Service Won't Start

**Symptom:**
```
Error 1053: The service did not respond to the start or control request in a timely fashion
```

**Possible Causes & Solutions:**

#### 1. Configuration File Missing or Invalid

**Check:**
```cmd
dir "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
```

**Solution:**
- If missing, copy from example:
  ```cmd
  copy "C:\Program Files\UniFi-Doordeck-Bridge\config.example.json" ^
       "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
  ```
- Validate JSON syntax at https://jsonlint.com/

#### 2. Node.js Not Found

**Check:**
```cmd
node --version
```

**Solution:**
- Install Node.js 20 LTS from https://nodejs.org/
- Restart terminal after installation

#### 3. Missing Dependencies

**Check:**
```cmd
dir "C:\Program Files\UniFi-Doordeck-Bridge\node_modules"
```

**Solution:**
```cmd
cd "C:\Program Files\UniFi-Doordeck-Bridge"
npm install --production
```

#### 4. Permission Issues

**Solution:**
- Run Command Prompt as Administrator
- Check file permissions on:
  - `C:\Program Files\UniFi-Doordeck-Bridge`
  - `C:\ProgramData\UniFi-Doordeck-Bridge`

### Service Crashes Immediately

**Check Windows Event Viewer:**
1. Press `Win + R`, type `eventvwr`
2. Navigate to: Windows Logs → Application
3. Look for errors from "UniFi-Doordeck-Bridge"

**Common Errors:**

#### Error: "Cannot find module"

**Log Entry:**
```
Error: Cannot find module '@doordeck/doordeck-headless-sdk'
```

**Solution:**
```cmd
cd "C:\Program Files\UniFi-Doordeck-Bridge"
npm install --production
```

#### Error: "ECONNREFUSED"

**Log Entry:**
```
[error]: Failed to connect to UniFi Access: connect ECONNREFUSED 192.168.1.100:443
```

**Solutions**:
1. Verify UniFi controller is running
2. Check firewall settings
3. Verify `unifi.host` in config.json
4. Test connectivity: `ping 192.168.1.100`

### Service Runs But Does Nothing

**Check Log Output:**
```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find /i "started"
```

**Expected:**
```
[info]: UniFi-Doordeck Bridge started successfully
[info]: Door sync completed: 5 doors
```

**If missing "Door sync" message:**
- See [Door Sync Issues](#door-sync-issues)

**If missing "started" message:**
- Service may be stuck during initialization
- Check for errors in logs
- Restart service:
  ```cmd
  sc stop "UniFi-Doordeck-Bridge"
  timeout /t 5
  sc start "UniFi-Doordeck-Bridge"
  ```

---

## Connection Issues

### Cannot Connect to UniFi Controller

**Symptom:**
```
[error]: Failed to connect to UniFi Access: ECONNREFUSED
[error]: Failed to connect to UniFi Access: ETIMEDOUT
```

**Solutions:**

#### 1. Network Connectivity

**Test:**
```cmd
ping 192.168.1.100
```

**If ping fails:**
- Verify controller IP address
- Check network cables/WiFi
- Verify bridge server is on same network or has route to controller
- Check VPN if accessing remotely

#### 2. Firewall Blocking Connection

**Test:**
```cmd
telnet 192.168.1.100 443
```

**If connection refused:**
- Check Windows Firewall
- Check network firewall/ACLs
- Verify UniFi Access controller is running
- Check controller HTTPS is enabled

#### 3. SSL Certificate Issues

**Symptom:**
```
[error]: self signed certificate in certificate chain
```

**Solution:**
Set `verifySsl: false` in config.json (development only):
```json
{
  "unifi": {
    "host": "192.168.1.100",
    "verifySsl": false,
    ...
  }
}
```

**Production Solution:**
- Install proper SSL certificate on UniFi controller
- Or import self-signed cert to Windows Trusted Root

#### 4. Wrong Port

**Symptom:**
```
[error]: connect ECONNREFUSED 192.168.1.100:443
```

**Check UniFi Controller Port:**
- Default HTTPS: 443
- If changed, update config.json:
  ```json
  {
    "unifi": {
      "port": 8443,
      ...
    }
  }
  ```

### Cannot Connect to Doordeck API

**Symptom:**
```
[error]: Failed to authenticate with Doordeck: ENOTFOUND api.doordeck.com
[error]: Failed to authenticate with Doordeck: ETIMEDOUT
```

**Solutions:**

#### 1. DNS Resolution

**Test:**
```cmd
nslookup api.doordeck.com
```

**If fails:**
- Check DNS settings
- Try alternate DNS (8.8.8.8, 1.1.1.1)
- Check /etc/hosts file for conflicts

#### 2. Internet Connectivity

**Test:**
```cmd
ping 8.8.8.8
curl https://www.google.com
```

**If fails:**
- Check internet connection
- Verify proxy settings
- Check firewall outbound rules

#### 3. Proxy Configuration

If behind corporate proxy:

**Set proxy environment variables:**
```cmd
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080
```

**Or configure in Node.js:**
- Install: `npm install global-agent`
- Configure before bridge start

---

## Authentication Issues

### UniFi Authentication Failed

**Symptom:**
```
[error]: UniFi authentication failed: 401 Unauthorized
[error]: UniFi authentication failed: 403 Forbidden
```

**Solutions:**

#### 1. Wrong Credentials

**Verify:**
- Username is correct (case-sensitive)
- Password is correct
- User has admin privileges

**Test credentials manually:**
```powershell
$body = @{
  username = "admin"
  password = "your-password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://192.168.1.100/api/v1/developer/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -SkipCertificateCheck
```

#### 2. Account Locked

**Check UniFi Access UI:**
- Login to controller web interface
- Navigate to Users
- Verify account is not locked
- Reset password if necessary

#### 3. API Access Disabled

**Verify API is enabled:**
- Login to UniFi Access controller
- Check Settings → Advanced
- Ensure Developer API is enabled

### Doordeck Authentication Failed

**Symptom:**
```
[error]: Failed to authenticate with Doordeck: 401 Unauthorized
[error]: Failed to authenticate with Doordeck: Invalid credentials
```

**Solutions:**

#### 1. Wrong Credentials

**Verify:**
- Email address is correct
- Password is correct
- API token is valid

**Test manually:**
```powershell
$headers = @{"api-key" = "your-api-token"}
$body = @{
  email = "your-email@example.com"
  password = "your-password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.doordeck.com/auth/token" `
  -Method POST `
  -Headers $headers `
  -Body $body `
  -ContentType "application/json"
```

#### 2. Expired API Token

**Solution:**
- Contact Doordeck support to renew token
- Update config.json with new token
- Restart service

#### 3. Account Suspended

**Check:**
- Login to Doordeck web portal
- Verify account is active
- Contact Doordeck support if suspended

---

## Door Sync Issues

### No Doors Synced

**Symptom:**
```
[info]: Door sync completed: 0 doors
```

**Solutions:**

#### 1. No Doors in UniFi Access

**Verify:**
- Login to UniFi Access controller
- Navigate to Doors
- Ensure at least one door is configured

#### 2. User Lacks Permission

**Verify:**
- User has access to doors in UniFi Access
- Check user permissions in controller
- Try with admin account

#### 3. API Response Empty

**Debug:**
Enable debug logging in config.json:
```json
{
  "logging": {
    "level": "debug"
  }
}
```

Restart service and check logs for:
```
[debug]: UniFi API response: { doors: [] }
```

### Doors Sync But Don't Appear in Doordeck

**Symptom:**
- Bridge logs show doors discovered
- Doordeck app shows no locks

**Solutions:**

#### 1. Registration Failed

**Check logs for:**
```
[error]: Failed to register door with Doordeck: ...
```

**Common errors:**
- Invalid integration configuration
- Missing required door properties
- Doordeck API rate limiting

#### 2. Wrong Account

**Verify:**
- Using correct Doordeck account
- Doors registered to right organization
- Check Doordeck developer portal for registrations

---

## Unlock Command Issues

### Door Won't Unlock from App

**Symptom:**
- Tap unlock in Doordeck app
- Nothing happens
- No error shown

**Diagnostic Steps:**

#### 1. Check Bridge Logs

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find "unlock"
```

**Expected:**
```
[info]: Received unlock command for lock: abc123
[info]: Unlocking UniFi door: Front Door (door-456)
[info]: Door unlocked successfully
```

**If no "Received unlock command":**
- Bridge not receiving commands from Doordeck
- Check Doordeck connectivity
- Verify door is properly mapped

**If "Received" but no "Unlocking":**
- Door mapping issue
- Check door ID mapping in logs
- Verify door exists in UniFi

**If "Unlocking" but no "successfully":**
- UniFi API error
- Check subsequent error message
- Verify door is operational in UniFi Access

#### 2. Check UniFi Controller

- Login to UniFi Access web interface
- Navigate to Doors → Activity Log
- Check if unlock command was received
- Test manual unlock from web interface

#### 3. Check Physical Door

- Is door reader active (lights/sounds)?
- Is door lock mechanism functioning?
- Is door in normal mode (not lockdown)?
- Check door power supply

### Unlock Works But Door Doesn't Open

**Hardware issues:**

#### 1. Door Strike/Lock Mechanism

**Check:**
- Lock mechanism functioning properly
- Correct voltage/power to lock
- Lock actuation time sufficient
- Lock wiring correct

#### 2. Door Position

**Verify:**
- Door is properly closed
- Strike plate aligned
- No obstruction preventing operation

#### 3. Configuration

**Check UniFi Access settings:**
- Unlock duration (should be 5-10 seconds)
- Lock mode (magnetic vs electric strike)
- Fail-safe vs fail-secure mode

---

## Event Forwarding Issues

### Events Not Appearing in Doordeck App

**Symptom:**
- Door activity happens (open/close/access)
- Events don't show in Doordeck app history

**Solutions:**

#### 1. Check Bridge Logs

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find "event"
```

**Expected:**
```
[info]: Received UniFi event: door_opened (door-456)
[info]: Forwarding event to Doordeck: door_opened
[info]: Event forwarded successfully
```

**If no "Received UniFi event":**
- Bridge not receiving events from UniFi
- Check WebSocket connection
- Verify UniFi event stream is active

**If "Received" but no "Forwarding":**
- Event filtering or deduplication
- Check event translator configuration
- Verify door is mapped

**If "Forwarding" but no "successfully":**
- Doordeck API error
- Check subsequent error message
- Verify Doordeck connectivity

#### 2. Check Event Types

Not all UniFi events are forwarded to Doordeck:

**Forwarded events:**
- door_opened
- door_closed
- door_unlocked
- door_locked
- access_granted
- access_denied
- door_forced
- door_held_open

**Not forwarded:**
- System events
- Configuration changes
- User management events

#### 3. Check Deduplication

Events within deduplication window (default 5 seconds) are filtered:

**Check config:**
```json
{
  "eventTranslator": {
    "deduplicationWindow": 5000
  }
}
```

**To see all events:**
Set deduplicationWindow to 0 (not recommended for production)

---

## Performance Issues

### High CPU Usage

**Symptom:**
- Bridge process using >50% CPU consistently
- System slowdown

**Solutions:**

#### 1. Too Many Doors

**Check:**
- How many doors are configured?
- High door count increases processing

**Optimization:**
```json
{
  "eventTranslator": {
    "processingDelay": 200
  }
}
```

#### 2. Debug Logging Enabled

**Check config:**
```json
{
  "logging": {
    "level": "debug"  // Change to "info" or "warn"
  }
}
```

#### 3. Reconnection Loop

**Check logs for repeated:**
```
[error]: Connection lost
[info]: Attempting to reconnect...
```

**Solution:**
- Fix underlying connectivity issue
- Increase reconnectDelay
- Check network stability

### High Memory Usage

**Symptom:**
- Bridge using >500MB RAM
- Gradual memory increase over time

**Solutions:**

#### 1. Event Queue Buildup

**Check config:**
```json
{
  "eventTranslator": {
    "maxQueueSize": 1000  // Reduce if needed
  }
}
```

#### 2. Log File Accumulation

**Check log directory size:**
```cmd
dir "C:\ProgramData\UniFi-Doordeck-Bridge\logs"
```

**Solution:**
```json
{
  "logging": {
    "maxFiles": 5,
    "maxFileSize": 10485760
  }
}
```

#### 3. Memory Leak

**Restart service periodically:**
```cmd
schtasks /create /tn "Restart Bridge" /tr "sc stop UniFi-Doordeck-Bridge && timeout /t 10 && sc start UniFi-Doordeck-Bridge" /sc daily /st 03:00
```

### Slow Response Times

**Symptom:**
- Long delay between tap and unlock
- Events delayed

**Solutions:**

#### 1. Network Latency

**Test latency:**
```cmd
ping -n 10 192.168.1.100
```

**If high:**
- Check network congestion
- Check WiFi signal strength
- Consider wired connection

#### 2. API Rate Limiting

**Check logs for:**
```
[warn]: Rate limit exceeded, backing off...
```

**Solution:**
```json
{
  "eventTranslator": {
    "processingDelay": 500  // Increase delay
  }
}
```

#### 3. Circuit Breaker Open

**Check logs for:**
```
[warn]: Circuit breaker [UniFi] OPENED
```

**Solution:**
- Fix underlying connectivity issue
- Circuit will auto-recover after timeout
- Adjust circuit breaker settings if too sensitive

---

## Log Analysis

### Understanding Log Levels

**ERROR** - Critical failures requiring immediate attention
```
[error]: Failed to unlock door: UniFi API error
```

**WARN** - Potential issues that may need investigation
```
[warn]: Circuit breaker [Doordeck] transitioning to HALF_OPEN
```

**INFO** - Normal operational messages
```
[info]: Door sync completed: 5 doors
```

**DEBUG** - Detailed diagnostic information
```
[debug]: Sending unlock request for door: door-123
```

### Common Log Patterns

#### Successful Startup

```
[info]: Starting UniFi-Doordeck Bridge...
[info]: Configuration loaded successfully
[info]: Connected to UniFi Access Controller
[info]: Authenticated with Doordeck
[info]: Door sync completed: 5 doors
[info]: UniFi-Doordeck Bridge started successfully
```

#### Successful Unlock

```
[info]: Received unlock command for lock: abc123
[info]: Unlocking UniFi door: Front Door (door-456)
[info]: Door unlocked successfully
[info]: Received UniFi event: door_unlocked (door-456)
[info]: Forwarding event to Doordeck: door_unlocked
[info]: Event forwarded successfully
```

#### Connection Problems

```
[error]: Failed to connect to UniFi Access: ECONNREFUSED
[info]: Attempting to reconnect in 5000ms...
[info]: Retry attempt 1/3
[error]: Connection attempt failed: ECONNREFUSED
[warn]: Circuit breaker [UniFi] OPENED after 3 failures
```

### Analyzing Log Files

#### Find Recent Errors

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find "[error]" | more
```

#### Find Specific Door Activity

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find "door-456" | more
```

#### Count Events

```cmd
type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" | find /c "unlock"
```

#### View Last 50 Lines

```cmd
powershell Get-Content "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" -Tail 50
```

---

## Advanced Debugging

### Enable Debug Logging

**1. Edit config.json:**
```json
{
  "logging": {
    "level": "debug"
  },
  "doordeck": {
    "debug": true
  }
}
```

**2. Restart service:**
```cmd
sc stop "UniFi-Doordeck-Bridge"
timeout /t 5
sc start "UniFi-Doordeck-Bridge"
```

**3. Monitor logs in real-time:**
```cmd
powershell Get-Content "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log" -Wait -Tail 20
```

### Test Components Individually

#### Test UniFi Connection

Create `test-unifi.js`:
```javascript
const { UniFiClient } = require('./dist/clients/unifi');
const config = require('./config.json');

const client = new UniFiClient();
client.connect(config.unifi)
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Failed:', err));
```

Run:
```cmd
node test-unifi.js
```

#### Test Doordeck Authentication

Create `test-doordeck.js`:
```javascript
const { DoordeckClient } = require('./dist/clients/doordeck');
const config = require('./config.json');

const client = new DoordeckClient();
client.authenticate(config.doordeck)
  .then(() => console.log('Authenticated!'))
  .catch(err => console.error('Failed:', err));
```

Run:
```cmd
node test-doordeck.js
```

### Capture Network Traffic

Use Wireshark or Fiddler to inspect HTTP/WebSocket traffic:

**1. Install Wireshark:**
https://www.wireshark.org/

**2. Start capture on network interface**

**3. Filter traffic:**
```
tcp.port == 443
http.host contains "doordeck.com"
```

**4. Analyze requests/responses**

### Run in Development Mode

Stop service and run directly:

```cmd
sc stop "UniFi-Doordeck-Bridge"

cd "C:\Program Files\UniFi-Doordeck-Bridge"
set CONFIG_PATH=C:\ProgramData\UniFi-Doordeck-Bridge\config.json
node dist\index.js
```

This provides:
- Real-time console output
- Immediate error feedback
- Easier debugging with breakpoints

---

## FAQ

### Q: How often does the bridge check for unlock commands?

**A:** The bridge uses polling every 5 seconds by default. Commands are typically executed within 5-10 seconds of being initiated in the Doordeck app.

### Q: Can I run multiple bridges on the same network?

**A:** Yes, but each bridge should connect to different UniFi Access controllers or manage different sets of doors. Duplicate registrations will cause conflicts.

### Q: What happens if the bridge loses connection?

**A:** The bridge automatically attempts to reconnect using exponential backoff. Unlock commands during downtime will be lost (they are not queued by Doordeck). Events are queued locally and forwarded when connection is restored.

### Q: How do I update the bridge?

**A:**
1. Stop the service
2. Replace files in Program Files
3. Run `npm install --production`
4. Start the service

Or use the installer for the new version.

### Q: Can I use the bridge with a self-signed SSL certificate?

**A:** Yes, set `"verifySsl": false` in config.json. However, this is not recommended for production deployments.

### Q: How many doors can one bridge manage?

**A:** Tested with up to 20 doors. Performance depends on event frequency and network latency. For larger deployments, consider multiple bridges.

### Q: What happens to unlocks during an outage?

**A:** Commands initiated during an outage are lost. When the bridge reconnects, it continues processing new commands. Historical events are not retroactively synced.

### Q: Can I get support for UniFi Access issues?

**A:** UniFi Access support is provided by Ubiquiti. Visit https://help.ui.com/ for controller/hardware support. This bridge only provides integration support.

### Q: How do I backup my configuration?

**A:**
```cmd
copy "C:\ProgramData\UniFi-Doordeck-Bridge\config.json" "C:\Backups\bridge-config.json"
```

---

## Getting Help

### Before Requesting Help

Gather the following information:

1. **Bridge version:**
   ```cmd
   type "C:\Program Files\UniFi-Doordeck-Bridge\package.json" | find "version"
   ```

2. **Operating System:**
   ```cmd
   systeminfo | find "OS Name"
   systeminfo | find "OS Version"
   ```

3. **Node.js version:**
   ```cmd
   node --version
   ```

4. **Recent logs** (sanitize credentials):
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\logs\bridge.log"
   ```

5. **Configuration** (remove passwords):
   ```cmd
   type "C:\ProgramData\UniFi-Doordeck-Bridge\config.json"
   ```

### Support Channels

**Bridge Issues:**
- GitHub Issues: https://github.com/your-org/unifi-doordeck-bridge/issues
- Email: support@your-company.com

**Doordeck Platform:**
- Email: support@doordeck.com
- Documentation: https://developer.doordeck.com/

**UniFi Access:**
- Community: https://community.ui.com/
- Support: https://help.ui.com/

---

## See Also

- [Installation Guide](INSTALLATION.md) - Setup procedures
- [Configuration Reference](CONFIGURATION.md) - All configuration options
- [Architecture Overview](ARCHITECTURE.md) - System design
- [API Documentation](API.md) - Developer reference

---

**Version**: 1.0
**Last Updated**: 2025-10-20
**Author**: UniFi-Doordeck Bridge Team
