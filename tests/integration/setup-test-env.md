# Integration Testing Setup Guide

This guide will help you set up your environment for integration testing with real Doordeck and UniFi Access services.

## Prerequisites

Before running integration tests, you need:

### 1. UniFi Access Controller

- **UniFi Access controller** running and accessible on your network
- **Admin credentials** for the controller
- **At least one door** configured in the system
- **Network access** from your test machine to the controller

**To verify:**
```bash
# Test connectivity to your controller
ping <your-unifi-controller-ip>

# Test HTTPS access
curl -k https://<your-unifi-controller-ip>
```

### 2. Doordeck Account

- **Doordeck developer account** or production account
- **API token** (contact Doordeck support if you don't have one)
- **Account credentials** (email and password)

**To get API token:**
1. Visit https://developer.doordeck.com
2. Or contact Doordeck support at support@doordeck.com
3. Or contact Sentry Interactive at https://portal.sentryinteractive.com

## Step-by-Step Setup

### Step 1: Create Environment File

Create a `.env` file in the project root:

```bash
cd /path/to/unifi-doordeck-bridge
cp .env.example .env
```

### Step 2: Configure UniFi Access Credentials

Edit `.env` and add your UniFi Access details:

```bash
# UniFi Access Controller
UNIFI_TEST_HOST=192.168.1.100          # Your controller IP
UNIFI_TEST_USERNAME=admin               # Admin username
UNIFI_TEST_PASSWORD=your-password       # Admin password
```

**Important:**
- Use the IP address or hostname of your UniFi Access controller
- Ensure the user has admin permissions
- The password should be the UniFi Access password (not UniFi Network)

### Step 3: Configure Doordeck Credentials

Add your Doordeck credentials to `.env`:

```bash
# Doordeck API
DOORDECK_TEST_TOKEN=dd_your_token      # API token from Doordeck
DOORDECK_TEST_EMAIL=you@example.com    # Your Doordeck account email
DOORDECK_TEST_PASSWORD=your-password   # Your Doordeck password
```

**Getting your API token:**
- Contact Doordeck support: support@doordeck.com
- Or use Sentry Interactive portal: https://portal.sentryinteractive.com
- Token should start with `dd_`

### Step 4: Load Environment Variables

The tests will automatically load `.env` if it exists. Alternatively, you can export them:

```bash
# Load from .env file
export $(cat .env | xargs)

# Or set them manually
export UNIFI_TEST_HOST=192.168.1.100
export UNIFI_TEST_USERNAME=admin
export UNIFI_TEST_PASSWORD=your-password
export DOORDECK_TEST_TOKEN=dd_your_token
export DOORDECK_TEST_EMAIL=you@example.com
export DOORDECK_TEST_PASSWORD=your-password
```

### Step 5: Disable CI Mode

Ensure integration tests won't skip:

```bash
# Unset CI variable if it's set
unset CI

# Or explicitly set it to false
export CI=false
```

### Step 6: Install dotenv Support

Install dotenv to automatically load .env file:

```bash
npm install --save-dev dotenv-cli
```

## Running Integration Tests

### Run All Integration Tests

```bash
# With dotenv
npx dotenv -e .env npm run test:integration

# Or if environment variables are already exported
npm run test:integration
```

### Run Specific Test Suites

```bash
# Test Doordeck client only
npx dotenv -e .env npx jest tests/integration/DoordeckClient.test.ts

# Test UniFi client only
npx dotenv -e .env npx jest tests/integration/UniFiClient.test.ts

# Test end-to-end bridge
npx dotenv -e .env npx jest tests/integration/BridgeService.test.ts
```

### Run with Verbose Output

```bash
npx dotenv -e .env npx jest tests/integration --verbose
```

## What to Expect

### First Run

When you first run integration tests:

1. **Connection Tests** - Verify connectivity to both services
2. **Authentication** - Log in to both UniFi Access and Doordeck
3. **Door Discovery** - Enumerate doors from UniFi Access
4. **Door Registration** - Register discovered doors with Doordeck
5. **Event Flow Tests** - Test unlock commands and event forwarding

### Success Indicators

✅ All tests pass
✅ Doors are discovered from UniFi Access
✅ Doors are registered with Doordeck
✅ Unlock commands work
✅ Events are forwarded

### Common Issues

#### Cannot Connect to UniFi Access

**Symptoms:**
```
Error: connect ETIMEDOUT
```

**Solutions:**
- Verify controller IP address is correct
- Check firewall allows port 443
- Ensure controller is running
- Try disabling SSL verification temporarily

#### Authentication Failed - UniFi

**Symptoms:**
```
Error: Authentication failed
```

**Solutions:**
- Verify username and password are correct
- Ensure user has admin permissions
- Check for special characters in password (escape them)
- Try logging in via UniFi Access web UI first

#### Cannot Connect to Doordeck

**Symptoms:**
```
Error: Invalid API token
```

**Solutions:**
- Verify API token is correct and starts with `dd_`
- Check token hasn't expired
- Ensure you're using the correct Doordeck environment
- Contact Doordeck support to verify token

#### Authentication Failed - Doordeck

**Symptoms:**
```
Error: Invalid credentials
```

**Solutions:**
- Verify email and password are correct
- Try logging in to Doordeck mobile app first
- Check account is active
- Reset password if needed

#### No Doors Found

**Symptoms:**
```
Warning: No doors discovered
```

**Solutions:**
- Verify doors exist in UniFi Access
- Check user has permission to view doors
- Ensure doors are properly configured
- Log in to UniFi Access web UI and verify doors appear

## Troubleshooting

### Enable Debug Logging

Add to your `.env`:

```bash
DEBUG=true
LOG_LEVEL=debug
```

### Test Individual Components

```bash
# Test just the connection
node -e "
const { UniFiClient } = require('./dist/clients/unifi');
const client = new UniFiClient();
client.initialize()
  .then(() => client.login(process.env.UNIFI_TEST_HOST, process.env.UNIFI_TEST_USERNAME, process.env.UNIFI_TEST_PASSWORD))
  .then(() => console.log('✅ Connected to UniFi Access'))
  .catch(err => console.error('❌ Error:', err.message));
"
```

### Check Network Connectivity

```bash
# Ping UniFi controller
ping -c 3 $UNIFI_TEST_HOST

# Test HTTPS
curl -k https://$UNIFI_TEST_HOST

# Check DNS
nslookup $UNIFI_TEST_HOST
```

### Verify Credentials

```bash
# Test UniFi Access login via web UI
open "https://$UNIFI_TEST_HOST"

# Test Doordeck login via mobile app
# Download Doordeck app and log in with your credentials
```

## Security Best Practices

1. **Never commit .env** - It's already in .gitignore
2. **Use strong passwords** - Especially for production
3. **Rotate credentials** - Regularly update API tokens
4. **Limit scope** - Use test-specific accounts if possible
5. **Monitor access** - Review logs for unauthorized attempts

## After Testing

Once tests pass successfully:

1. **Review results** - Check all test scenarios passed
2. **Verify door mappings** - Ensure doors synced correctly
3. **Test unlock flow** - Manually test unlocking via Doordeck app
4. **Check event forwarding** - Verify physical door events appear in Doordeck
5. **Document findings** - Note any issues or configuration requirements

## Next Steps

After successful integration testing:

1. **Stress Testing** - Test with multiple doors and rapid operations
2. **Security Audit** - Review credential storage and TLS usage
3. **Build Installer** - Create Windows deployment package
4. **Pilot Testing** - Deploy to test site with 1-2 doors
5. **Production Deployment** - Roll out to full production

## Getting Help

If you encounter issues:

1. **Check logs** - Look in `logs/bridge.log` for errors
2. **Review documentation** - See TROUBLESHOOTING.md
3. **Contact Doordeck** - support@doordeck.com
4. **Contact Sentry Interactive** - https://portal.sentryinteractive.com
5. **GitHub Issues** - Report bugs at https://github.com/your-org/unifi-doordeck-bridge/issues
