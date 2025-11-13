# End-to-End Testing Guide
## UniFi-Doordeck Bridge - Door Mapping Webhook Flow

This guide walks through testing the complete integration from Doordeck webhook → door mapping lookup → UniFi unlock.

---

## 📋 Pre-requisites

### Required Systems
- ✅ **UniFi Access Controller** with at least 1 door configured
- ✅ **Doordeck Account** (free account at https://developer.doordeck.com)
- ✅ **Network Connectivity** between your computer and UniFi controller

### Required Credentials
- **UniFi Access:**
  - Host/IP address of controller
  - API Key (generated in UniFi Access console)

- **Doordeck:**
  - Email address
  - Password

---

## 🎯 Test Scenario

**Goal:** Verify that when a user unlocks via Doordeck, the webhook triggers the correct UniFi door.

**Flow:**
```
Doordeck Webhook → Bridge Service → Mapping Lookup → UniFi API → Physical Door
```

---

## 📝 Testing Steps

### Step 1: Build and Run the GUI Application

```bash
# Navigate to gui directory
cd gui/

# Install dependencies (if not already done)
npm install

# Build the application
npm run build

# Run in development mode
npm run dev
```

**Expected Result:** GUI application opens successfully

---

### Step 2: Complete Initial Setup

**If first run:**
1. Complete Setup Wizard:
   - Welcome screen → Next
   - Enter UniFi credentials (host, API key)
   - Test connection → Should show "Connected"
   - Enter Doordeck credentials (email, password)
   - Test connection → Should show "Connected"
   - Complete setup

**If already configured:**
1. GUI should load directly to Dashboard
2. Verify connections show as "Connected"

**Expected Result:** Dashboard loads showing service status and doors

---

### Step 3: Start the Bridge Service

The bridge service needs to be running to receive webhooks.

**Option A: Via GUI (if service controls implemented)**
1. Click "Start Service" button in Dashboard

**Option B: Manually start service**
```bash
# Navigate to gui directory
cd gui/

# Run the bridge service directly
npm run dev -- src/service/bridge-service.ts
```

**Expected Result:**
```
================================================================
UniFi-Doordeck Bridge Service Starting
Version: 0.1.0
Port: 34512
Config: /path/to/config.json
Logs: /path/to/logs/service.log
================================================================
INFO Configuration loaded successfully
INFO Bridge service listening on port 34512
INFO Service ready to accept requests
```

**Verify service is running:**
```bash
curl http://localhost:34512/health
```

**Expected Response:**
```json
{
  "status": "running",
  "uptime": 15,
  "unifiConnected": true,
  "doordeckConnected": true,
  "doorsMonitored": 0
}
```

---

### Step 4: Discover Doors from Both Systems

1. In the GUI, click **"Door Mappings"** button (top right)
2. Modal opens showing Door Mappings interface
3. Click **"Rediscover Doors"** button
4. Wait for discovery to complete (~5-10 seconds)

**Expected Result:**
- Stats cards show:
  - Active Mappings: 0 (if first time)
  - Unmapped UniFi Doors: [number of doors from controller]
  - Unmapped Doordeck Locks: [number of locks from account]
- Dropdown lists populate with discovered doors/locks

**Troubleshooting:**
- If no UniFi doors found → Check UniFi credentials and API key
- If no Doordeck locks found → Check Doordeck credentials
- Check service logs for errors:
  ```bash
  tail -f /path/to/logs/service.log
  ```

---

### Step 5: Create a Door Mapping

1. In Door Mappings modal:
   - **UniFi Door dropdown:** Select a door (e.g., "Main Entrance")
   - **Doordeck Lock dropdown:** Select corresponding lock
   - Click **"Create Mapping"** button

**Expected Result:**
- Success message (or silent success)
- Stats update: Active Mappings: 1
- New row appears in "Existing Mappings" table
- Selected door/lock disappear from dropdowns

**Verify mapping was saved:**
```bash
# Check the door-mappings.json file
cat ~/.unifi-doordeck-bridge-gui/door-mappings.json
# OR on Windows:
type %APPDATA%\unifi-doordeck-bridge-gui\door-mappings.json
```

**Expected File Contents:**
```json
{
  "mappings": [
    {
      "id": "mapping_abc123",
      "unifiDoorId": "64a1b2c3d4e5f6789abcdef0",
      "unifiDoorName": "Main Entrance",
      "doordeckLockId": "550e8400-e29b-41d4-a716-446655440000",
      "doordeckLockName": "Doordeck Main Door",
      "siteId": "default-site",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Step 6: Configure Webhook in Doordeck (Optional for now)

**Note:** For initial testing, we'll use manual webhook triggers. Real Doordeck webhook setup requires:
- Public IP or domain name
- Port forwarding/ngrok tunnel
- Webhook configuration in Doordeck dashboard

**For now, skip to Step 7** to test with manual webhook triggers.

---

### Step 7: Test Webhook with Manual Trigger

We'll simulate a Doordeck webhook using curl to verify the complete flow.

**Prepare the test:**
1. Note the Doordeck lock ID from your mapping (from Step 5)
2. Open a terminal

**Send test webhook (without signature verification):**

```bash
# First, disable signature verification (for testing)
# In Settings → Advanced → Uncheck "Verify Webhook Signatures"

# Send test webhook
curl -X POST http://localhost:34512/webhook/doordeck \
  -H "Content-Type: application/json" \
  -d '{
    "event": "door.unlock",
    "lock": {
      "id": "YOUR_DOORDECK_LOCK_ID_HERE"
    },
    "user": {
      "name": "Test User"
    },
    "timestamp": "2025-01-15T10:30:00Z"
  }'
```

**Replace `YOUR_DOORDECK_LOCK_ID_HERE`** with the actual Doordeck lock ID from your mapping.

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Door unlocked",
  "doorName": "Main Entrance",
  "doorId": "64a1b2c3d4e5f6789abcdef0"
}
```

**Expected Response (No Mapping Found):**
```json
{
  "error": "No door mapping found",
  "lockId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Please map this Doordeck lock to a UniFi door in the application settings"
}
```

**Expected Response (UniFi Error):**
```json
{
  "error": "Failed to unlock door"
}
```

---

### Step 8: Verify UniFi Door Unlocked

**Check service logs:**
```bash
tail -f /path/to/logs/service.log
```

**Expected Log Output (Success):**
```
2025-01-15T10:30:00.123Z [INFO] POST /webhook/doordeck
2025-01-15T10:30:00.124Z [INFO] [Webhook] Received Doordeck webhook { event: 'door.unlock', lock: { id: '550e8400...' } }
2025-01-15T10:30:00.125Z [INFO] [Webhook] Processing unlock request for lock: 550e8400-e29b-41d4-a716-446655440000, user: Test User
2025-01-15T10:30:00.126Z [INFO] [Webhook] Mapped Doordeck lock 550e8400... to UniFi door 64a1b2c3... (Main Entrance)
2025-01-15T10:30:00.500Z [INFO] [Webhook] Successfully unlocked door Main Entrance (64a1b2c3...) for user Test User
```

**Expected Log Output (No Mapping):**
```
2025-01-15T10:30:00.123Z [INFO] POST /webhook/doordeck
2025-01-15T10:30:00.124Z [INFO] [Webhook] Received Doordeck webhook { event: 'door.unlock', lock: { id: '550e8400...' } }
2025-01-15T10:30:00.125Z [INFO] [Webhook] Processing unlock request for lock: 550e8400-e29b-41d4-a716-446655440000, user: Test User
2025-01-15T10:30:00.126Z [ERROR] [Webhook] No door mapping found for Doordeck lock: 550e8400-e29b-41d4-a716-446655440000
2025-01-15T10:30:00.127Z [INFO] [Webhook] Please create a door mapping in the GUI (Settings > Door Mappings)
```

**Verify in UniFi Access:**
1. Open UniFi Access console
2. Go to Events/Logs
3. Look for unlock event for the mapped door
4. Should show API unlock event with timestamp matching webhook

---

### Step 9: Test with Signature Verification (Advanced)

**Enable signature verification:**
1. In GUI → Settings → Advanced
2. Check "Verify Webhook Signatures"
3. Enter a test secret (e.g., "test_secret_123")
4. Save

**Generate HMAC signature:**
```bash
# Create test payload file
echo -n '{
  "event": "door.unlock",
  "lock": {
    "id": "YOUR_DOORDECK_LOCK_ID_HERE"
  },
  "user": {
    "name": "Test User"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}' > payload.json

# Generate HMAC-SHA256 signature
openssl dgst -sha256 -hmac "test_secret_123" -hex payload.json

# Copy the signature hash (after "SHA256(payload.json)= ")
```

**Send webhook with signature:**
```bash
curl -X POST http://localhost:34512/webhook/doordeck \
  -H "Content-Type: application/json" \
  -H "X-Doordeck-Signature: PASTE_SIGNATURE_HERE" \
  -d @payload.json
```

**Expected Result:**
- With correct signature → Door unlocks (200 OK)
- With incorrect signature → 401 Unauthorized
- Without signature header → 401 Unauthorized

---

### Step 10: Test Error Scenarios

**Test 1: Unmapped Lock**
```bash
curl -X POST http://localhost:34512/webhook/doordeck \
  -H "Content-Type: application/json" \
  -d '{
    "event": "door.unlock",
    "lock": {
      "id": "FAKE_LOCK_ID_12345"
    }
  }'
```
**Expected:** 404 Not Found with "No door mapping found" error

**Test 2: Invalid Event Type**
```bash
curl -X POST http://localhost:34512/webhook/doordeck \
  -H "Content-Type: application/json" \
  -d '{
    "event": "door.lock",
    "lock": {
      "id": "YOUR_LOCK_ID"
    }
  }'
```
**Expected:** 200 OK with "Event received" (event acknowledged but not processed)

**Test 3: Missing Lock ID**
```bash
curl -X POST http://localhost:34512/webhook/doordeck \
  -H "Content-Type: application/json" \
  -d '{
    "event": "door.unlock"
  }'
```
**Expected:** 400 Bad Request with "Missing lock ID" error

---

## ✅ Success Criteria

All of the following should work:

- ✅ Service starts and listens on port 34512
- ✅ Health endpoint returns correct status
- ✅ UniFi doors are discovered
- ✅ Doordeck locks are discovered
- ✅ Door mapping can be created via GUI
- ✅ Mapping is persisted to JSON file
- ✅ Webhook receives POST requests
- ✅ Mapping lookup finds correct UniFi door
- ✅ UniFi unlock command executes
- ✅ Success response is returned
- ✅ Logs show complete flow
- ✅ UniFi Access shows unlock event
- ✅ Signature verification works (when enabled)
- ✅ Error handling works for unmapped locks

---

## 🐛 Troubleshooting

### Service Won't Start

**Symptom:** Service fails to start or exits immediately

**Solutions:**
1. Check if port 34512 is already in use:
   ```bash
   lsof -i :34512  # Mac/Linux
   netstat -ano | findstr :34512  # Windows
   ```
2. Check config file exists and is valid JSON
3. Check logs for error messages
4. Verify Node.js is installed: `node --version`

---

### No Doors Discovered from UniFi

**Symptom:** Unmapped UniFi Doors shows 0

**Solutions:**
1. Verify UniFi Access has doors configured
2. Test UniFi connection in Settings
3. Check API key has correct permissions
4. Check service logs for UniFi API errors
5. Try accessing UniFi API manually:
   ```bash
   curl -k https://YOUR_UNIFI_HOST/api/v1/developer/doors \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

### No Locks Discovered from Doordeck

**Symptom:** Unmapped Doordeck Locks shows 0

**Solutions:**
1. Verify Doordeck account has locks configured
2. Test Doordeck connection in Settings
3. Check email/password credentials
4. Check service logs for Doordeck API errors
5. Verify account at: https://developer.doordeck.com

---

### Webhook Returns 404 (No Mapping Found)

**Symptom:** Webhook response says "No door mapping found"

**Solutions:**
1. Verify mapping was created:
   - Check Door Mappings table in GUI
   - Check door-mappings.json file exists and has content
2. Verify lock ID in webhook matches mapping:
   - Copy lock ID from webhook payload
   - Compare to doordeckLockId in mapping
3. Check service logs for mapping lookup details

---

### UniFi Door Doesn't Unlock

**Symptom:** Webhook succeeds but door doesn't unlock

**Solutions:**
1. Check UniFi Access logs for unlock event
2. Verify door ID is correct:
   - List doors: `GET /api/v1/developer/doors`
   - Compare to mapping.unifiDoorId
3. Test unlock manually via UniFi API:
   ```bash
   curl -X POST https://YOUR_UNIFI_HOST/api/v1/developer/doors/DOOR_ID/unlock \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
4. Check door hardware:
   - Is door online in UniFi Access?
   - Is door lock mechanism working?
   - Check door reader status

---

### Signature Verification Fails

**Symptom:** 401 Unauthorized with "Invalid signature"

**Solutions:**
1. Verify secret matches:
   - Secret in Settings → Advanced
   - Secret used to generate HMAC
2. Verify signature is correct format:
   - Should be hex string (64 characters)
   - No "sha256=" prefix in signature
3. Verify payload is identical:
   - No extra whitespace
   - No newlines
   - Exact same JSON structure
4. Try disabling signature verification for testing

---

## 📊 Next Steps After Successful Test

Once end-to-end testing passes:

1. **Production Webhook Setup:**
   - Configure ngrok or port forwarding
   - Set up webhook in Doordeck dashboard
   - Test with real Doordeck mobile app

2. **Setup Wizard Integration:**
   - Add door mapping step to wizard
   - Let users create initial mappings during setup

3. **Additional Features:**
   - Add logs viewer to Dashboard
   - Add service control buttons (start/stop/restart)
   - Add door status monitoring
   - Add webhook event history

4. **Documentation:**
   - Update user guide with door mapping instructions
   - Add screenshots of Door Mappings UI
   - Document webhook configuration process

---

## 📝 Test Results Template

Use this template to record your test results:

```
=== END-TO-END TEST RESULTS ===
Date: 2025-01-15
Tester: [Your Name]

✅ / ❌ Step 1: GUI Application Started
✅ / ❌ Step 2: Initial Setup Completed
✅ / ❌ Step 3: Bridge Service Started (Port 34512)
✅ / ❌ Step 4: Doors Discovered (UniFi: X, Doordeck: Y)
✅ / ❌ Step 5: Door Mapping Created
✅ / ❌ Step 6: Webhook Configuration (Skipped for now)
✅ / ❌ Step 7: Manual Webhook Test Successful
✅ / ❌ Step 8: UniFi Door Unlocked
✅ / ❌ Step 9: Signature Verification Works
✅ / ❌ Step 10: Error Scenarios Handled

Notes:
- [Any observations or issues encountered]
- [Performance notes]
- [Suggestions for improvement]

Overall Result: PASS / FAIL
```

---

## 🎉 Success!

If all steps pass, congratulations! You now have a fully functional UniFi-Doordeck bridge with door mapping support.

The system can now:
- Receive webhooks from Doordeck
- Look up the correct UniFi door using mappings
- Execute unlock commands
- Handle errors gracefully
- Provide detailed logging for debugging

Ready for production deployment! 🚀
