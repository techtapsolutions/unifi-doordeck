# Configuration Setup Guide

## Quick Start: Update Configuration to Use API Key

### Step 1: Update Config File

Run the configuration update script:

```bash
scripts\update-config-api-key.bat
```

This will:
- ✅ Create config directory if needed
- ✅ Backup existing config (if present)
- ✅ Install new config with UniFi OS API key

### Step 2: Add Doordeck Credentials

The config file is located at:
```
C:\ProgramData\UniFi-Doordeck-Bridge\config.json
```

Open it in a text editor and update these fields:

```json
{
  "doordeck": {
    "apiToken": "YOUR_DOORDECK_API_TOKEN_HERE",
    "email": "your-email@example.com",
    "password": "your-doordeck-password"
  }
}
```

### Step 3: Test the Service

```bash
scripts\test-service-startup.bat
```

You should see:
```
✅ Successfully connected to UniFi Access controller
✅ Using UniFi OS Client (API key authentication)
```

---

## UniFi Authentication Methods

### Method 1: API Key (Recommended for UDM-SE/UniFi OS)

**Current Configuration** ✅

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "apiKey": "YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY",
    "verifySsl": false
  }
}
```

**How to get your API key:**
1. Open UniFi Network Controller
2. Go to: Settings > Control Plane > Integrations
3. Click "Create New API Key"
4. Copy the generated key

**Benefits:**
- ✅ More secure (no username/password)
- ✅ Works with UniFi OS (UDM-SE, UDM Pro, etc.)
- ✅ Direct access to device endpoints
- ✅ Supports relay_unlock for door control

### Method 2: Username/Password (Legacy/Standalone)

For standalone UniFi Access controllers (not UDM):

```json
{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "username": "admin",
    "password": "your-password",
    "verifySsl": false
  }
}
```

**Note:** Leave `apiKey` field empty or remove it if using username/password.

---

## Discovered API Endpoints

### ✅ Working Endpoints (API v2)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/proxy/access/api/v2/devices` | GET | Get all devices (includes doors) |
| `/proxy/access/api/v2/users` | GET | Get all users |
| `/proxy/access/api/v2/visitors` | GET | Get all visitors |
| `/proxy/access/api/v2/device/{hub_id}/relay_unlock` | PUT | **Unlock door** 🔓 |

### Door Discovery

Doors are **embedded within device objects**:

```javascript
{
  "unique_id": "0cea148f6d58",
  "name": "UA-HUB-DOOR-6D58",
  "device_type": "UAH-DOOR",
  "door": {
    "unique_id": "5160d39c-a53a-4d54-b6b8-a5c9a63f2e94",
    "name": "214",
    "full_name": "EA LaBaya - 1F - 214",
    "location_type": "door"
  }
}
```

### Unlock Example

**Endpoint:**
```
PUT /proxy/access/api/v2/device/{hub_id}/relay_unlock
```

**Headers:**
```
X-API-KEY: YsDthCeGFAjlVgbdJ9Vc34mAamM7wFgY
Content-Type: application/json
```

**Response:**
```json
{
  "code": 1,
  "msg": "success",
  "data": "success"
}
```

---

## Testing

### Test Door Discovery
```bash
scripts\test-door-discovery.bat
```

### Test Door Unlock (⚠️ Will unlock the door!)
```bash
scripts\test-relay-unlock.bat
```

### Test Complete Service
```bash
scripts\test-service-startup.bat
```

---

## Troubleshooting

### Issue: "Bootstrap timeout"

**Symptom:**
```
Error during UniFi Access login: Bootstrap timeout
```

**Cause:** Service is using username/password authentication instead of API key.

**Fix:** Run `scripts\update-config-api-key.bat`

---

### Issue: "Failed to unlock door"

**Check:**
1. API key has `edit:space` permission
2. Door unlock is enabled in UniFi Access settings
3. Hub device (UAH-DOOR) is online

---

### Issue: "No doors found"

**Verify:**
1. UniFi Access is properly configured
2. Doors are assigned to hub devices
3. Check device structure: `scripts\explore-devices.bat`

---

## Next Steps

Once configured:

1. ✅ Doors will be auto-discovered from UniFi Access
2. ✅ Unlock commands from Doordeck will trigger relay_unlock
3. ✅ Door events will be forwarded to Doordeck Cloud
4. ✅ Bridge health monitoring active

See logs at: `./logs/bridge.log`
