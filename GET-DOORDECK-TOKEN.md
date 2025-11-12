# How to Set Up Doordeck Authentication

**IMPORTANT UPDATE**: You do NOT need an API token from Doordeck! The bridge uses Fusion API authentication which only requires a Doordeck account (email + password).

## Quick Answer

**All you need:**
- ✅ Doordeck account email
- ✅ Doordeck account password

The bridge will automatically generate an auth token when you log in with these credentials.

---

## Creating a Doordeck Account

If you don't already have a Doordeck account, here's how to create one:

## Option 1: Doordeck Developer Portal (Recommended)

1. **Visit the Doordeck Developer Portal**
   - URL: https://developer.doordeck.com
   - Create an account if you don't have one

2. **Request API Access**
   - Navigate to API Keys section
   - Generate a new API token
   - Token should start with `dd_`

3. **Save Your Credentials**
   - API Token
   - Your account email
   - Your account password

## Option 2: Contact Doordeck Support

If you don't have developer portal access:

**Email:** support@doordeck.com

**Request:**
```
Subject: API Token Request for UniFi Access Integration

Hello,

I am setting up the UniFi-Doordeck Bridge to integrate our UniFi Access
controller with Doordeck Cloud for mobile credential access control.

Could you please provide:
1. API token for development/testing
2. Any setup requirements or documentation
3. Information about Fusion integration program

Our setup:
- UniFi Access controller at: [your IP]
- Number of doors: [X]
- Use case: [Brief description]

Thank you!
```

## Option 3: Sentry Interactive Portal

If you're working with Sentry Interactive:

**Portal:** https://portal.sentryinteractive.com

1. Log in to your account
2. Navigate to API credentials
3. Request Doordeck integration credentials
4. Download or copy your API token

## Option 4: Doordeck Fusion Partner Program

For production deployments:

1. **Contact Doordeck Sales**
   - Website: https://www.doordeck.com
   - Email: sales@doordeck.com

2. **Discuss Fusion Integration**
   - Mention you're integrating UniFi Access
   - Ask about Fusion partner program
   - Request API credentials for integration

3. **Get Production Credentials**
   - Production API token
   - Webhook endpoints
   - Support contact information

## What You Need

For the UniFi-Doordeck Bridge to work, you need:

✅ **Doordeck Account Email** - Your registered email address
✅ **Doordeck Account Password** - Your account password
❌ **NO API Token Required** - The bridge generates this automatically via Fusion API login

Optional (for production deployments):
- **API Documentation** - Endpoints and integration guides
- **Webhook URLs** - For real-time event notifications
- **Support Contact** - Technical support email/phone

## Testing Without API Token

While waiting for your API token, you can still:

1. **Test UniFi Access Integration**
   ```bash
   node scripts/test-unifi-connection.js
   ```

2. **Run UniFi-Only Tests**
   ```bash
   # Create .env with just UniFi credentials
   cat > .env << EOF
   UNIFI_TEST_HOST=192.168.1.1
   UNIFI_TEST_USERNAME=admin
   UNIFI_TEST_PASSWORD=your-password
   CI=false
   EOF

   # Run UniFi-specific tests
   npx jest tests/integration/UniFiClient.test.ts
   ```

3. **Build the Installer**
   ```bash
   npm run build
   npm run installer:build
   ```

4. **Review Documentation**
   - Read through `INSTALLATION.md`
   - Review `ARCHITECTURE.md`
   - Check `CONFIGURATION.md`

## After Creating Your Account

Once you have your Doordeck account credentials:

1. **Run Setup Script**
   ```bash
   node scripts/setup-test-env.js
   ```

2. **Run Full Integration Tests**
   ```bash
   npm run test:integration
   ```

3. **Test End-to-End Flow**
   - Register doors with Doordeck
   - Test unlock commands from mobile app
   - Verify event forwarding

## Security Reminder

🔒 **Never commit your credentials to version control!**

- Credentials are in `.env` (which is gitignored)
- Use environment variables in production
- Use strong, unique passwords
- Don't share credentials in public channels
- Auth tokens are generated automatically and stored securely

## Questions?

If you have questions about getting API credentials:

- **Doordeck:** support@doordeck.com
- **Sentry Interactive:** https://portal.sentryinteractive.com
- **GitHub Issues:** (for technical integration questions)

## Next Steps

1. ✅ Create a Doordeck account (email + password)
2. ✅ Test UniFi integration: `node scripts/test-unifi-connection.js`
3. ✅ Run setup script with your credentials: `node scripts/setup-test-env.js`
4. ✅ Run full integration tests: `npm run test:integration`
5. ✅ Deploy to pilot site

**No API token registration needed!** Just create an account and you're ready to go.
