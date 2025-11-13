# Code Signing Guide

## Overview

Code signing is essential for Windows applications to:
- Prevent "Unknown Publisher" warnings
- Pass Windows SmartScreen checks
- Build trust with users
- Ensure software integrity

This guide explains how to set up code signing for the UniFi-Doordeck Bridge GUI.

## Quick Start

### Development (No Certificate)

For development and testing, you can build without code signing:

```bash
npm run package:win
```

The build will succeed but display warnings about missing certificates. This is normal for development.

### Production (With Certificate)

For production releases, set environment variables before building:

**Windows PowerShell:**
```powershell
$env:WIN_CSC_LINK = "path\to\certificate.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-password"
npm run package:win
```

**Windows Command Prompt:**
```cmd
set WIN_CSC_LINK=path\to\certificate.pfx
set WIN_CSC_KEY_PASSWORD=your-password
npm run package:win
```

**Cross-platform (.env file):**
```bash
# Create .env file (add to .gitignore!)
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your-password
```

## Obtaining a Code Signing Certificate

### Option 1: Commercial Certificate Authorities (Recommended)

Purchase an EV (Extended Validation) or OV (Organization Validation) code signing certificate:

**Popular Certificate Authorities:**
- **DigiCert** - https://www.digicert.com/signing/code-signing-certificates
  - Price: ~$474/year (Standard), ~$629/year (EV)
  - Reputation: Excellent
  - Validation time: 3-5 days (Standard), 1-2 weeks (EV)

- **Sectigo (formerly Comodo)** - https://sectigo.com/ssl-certificates-tls/code-signing
  - Price: ~$200/year (Standard), ~$350/year (EV)
  - Reputation: Good
  - Validation time: 3-5 days (Standard), 1-2 weeks (EV)

- **GlobalSign** - https://www.globalsign.com/en/code-signing-certificate
  - Price: ~$249/year (Standard), ~$599/year (EV)
  - Reputation: Excellent
  - Validation time: 3-5 days (Standard), 1-2 weeks (EV)

- **SSL.com** - https://www.ssl.com/certificates/code-signing/
  - Price: ~$199/year (Standard), ~$399/year (EV)
  - Reputation: Good
  - Validation time: 2-3 days (Standard), 1 week (EV)

**What You'll Need:**
- Business registration documents
- D-U-N-S number (for EV certificates)
- Verified business email and phone
- Business address verification
- Government-issued ID

**EV vs Standard:**
- **EV Certificates**: Bypass SmartScreen immediately, require hardware token
- **Standard Certificates**: Require reputation building, software-based storage
- **Recommendation**: Start with Standard, upgrade to EV for production

### Option 2: Self-Signed Certificate (Testing Only)

For internal testing only (users will see warnings):

**Create self-signed certificate:**
```powershell
# Create certificate
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=Tech Tap Solutions, O=Tech Tap Solutions, C=US" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature `
    -CertStoreLocation Cert:\CurrentUser\My

# Export to PFX
$password = ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText
Export-PfxCertificate `
    -Cert $cert `
    -FilePath ".\self-signed-cert.pfx" `
    -Password $password
```

**Install for testing:**
```powershell
# Import to Trusted Root (admin required)
Import-PfxCertificate `
    -FilePath ".\self-signed-cert.pfx" `
    -CertStoreLocation Cert:\LocalMachine\Root `
    -Password $password
```

⚠️ **Warning:** Self-signed certificates should NEVER be distributed to end users.

## Configuration

The code signing configuration is in `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "${env.WIN_CSC_LINK}",
      "certificatePassword": "${env.WIN_CSC_KEY_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "signAndEditExecutable": true,
      "rfc3161TimeStampServer": "http://timestamp.digicert.com"
    }
  }
}
```

### Configuration Options

**certificateFile**: Path to .pfx certificate file
- Can be absolute or relative path
- Supports environment variable `WIN_CSC_LINK`

**certificatePassword**: Certificate password
- Use environment variable `WIN_CSC_KEY_PASSWORD`
- Never commit passwords to source control

**signingHashAlgorithms**: Hash algorithms to use
- `sha256` (recommended)
- `sha1` (deprecated, but some older systems require it)

**rfc3161TimeStampServer**: Timestamp server URL
- Ensures signature remains valid after certificate expires
- DigiCert: `http://timestamp.digicert.com`
- GlobalSign: `http://timestamp.globalsign.com/scripts/timstamp.dll`
- Sectigo: `http://timestamp.sectigo.com`

## CI/CD Integration

### GitHub Actions

Add secrets to your repository settings:

1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `WIN_CSC_LINK_BASE64`: Base64-encoded certificate file
   - `WIN_CSC_KEY_PASSWORD`: Certificate password

**Workflow example:**

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Decode certificate
        run: |
          $cert = [System.Convert]::FromBase64String("${{ secrets.WIN_CSC_LINK_BASE64 }}")
          [IO.File]::WriteAllBytes("cert.pfx", $cert)
        shell: pwsh

      - name: Build and sign
        env:
          WIN_CSC_LINK: cert.pfx
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run package:win

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: release/*.exe
```

**To encode certificate:**
```powershell
$bytes = [System.IO.File]::ReadAllBytes("path\to\certificate.pfx")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
# Paste into GitHub Secrets
```

### Azure Pipelines

```yaml
pool:
  vmImage: 'windows-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'

- script: npm ci
  displayName: 'Install dependencies'

- task: DownloadSecureFile@1
  name: certificate
  inputs:
    secureFile: 'code-signing-cert.pfx'

- script: npm run package:win
  displayName: 'Build and sign'
  env:
    WIN_CSC_LINK: $(certificate.secureFilePath)
    WIN_CSC_KEY_PASSWORD: $(WIN_CSC_KEY_PASSWORD)
```

## Best Practices

### Security

1. **Never commit certificates to source control**
   - Add to `.gitignore`:
     ```
     *.pfx
     *.p12
     certificate.pfx
     .env
     ```

2. **Use strong passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Protect certificate files**
   - Store in encrypted vault (Azure Key Vault, AWS Secrets Manager)
   - Limit access to authorized personnel only
   - Use hardware tokens for EV certificates

4. **Rotate certificates**
   - Set calendar reminders for renewal (90 days before expiry)
   - Test new certificates in staging before production

### Testing

1. **Test on clean Windows VM**
   - Verify no SmartScreen warnings
   - Check certificate details in installer properties
   - Test with Windows Defender enabled

2. **Verify signature**
   ```powershell
   # Check if file is signed
   Get-AuthenticodeSignature "path\to\Setup.exe"

   # Expected output:
   # Status: Valid
   # SignerCertificate: CN=Tech Tap Solutions
   ```

3. **Check timestamp**
   ```powershell
   # Verify timestamp is present
   signtool verify /pa /v "path\to\Setup.exe"
   ```

### Troubleshooting

**Error: "SignTool not found"**
- Install Windows SDK: https://developer.microsoft.com/windows/downloads/windows-sdk/
- Or install Visual Studio Build Tools

**Error: "Invalid certificate password"**
- Verify `WIN_CSC_KEY_PASSWORD` is correct
- Check for special characters that may need escaping

**Error: "Certificate has expired"**
- Renew certificate through your CA
- Update environment variables with new certificate

**Warning: "Timestamp server could not be reached"**
- Try alternate timestamp servers:
  - `http://timestamp.digicert.com`
  - `http://timestamp.globalsign.com/scripts/timstamp.dll`
  - `http://timestamp.sectigo.com`
- Check firewall/proxy settings

## SmartScreen Reputation

Even with a valid certificate, Windows SmartScreen may show warnings until your application builds reputation:

**How reputation is built:**
- Number of downloads
- Number of installations
- Age of certificate
- User feedback

**Tips to build reputation faster:**
- Use EV certificate (immediate trust)
- Distribute through Microsoft Store (pre-verified)
- Encourage users to report "Safe" in SmartScreen
- Maintain consistent signing (same certificate/publisher)

**Timeline:**
- **EV Certificate**: Instant reputation
- **Standard Certificate**: 2-6 weeks with consistent usage
- **No Certificate**: Always shows warnings

## Resources

- [Electron Builder Code Signing](https://www.electron.build/code-signing)
- [Microsoft Code Signing Overview](https://docs.microsoft.com/windows/security/threat-protection/windows-defender-application-control/use-code-signing-to-simplify-application-control-for-classic-windows-applications)
- [DigiCert Code Signing Guide](https://www.digicert.com/kb/code-signing/code-signing-guide.htm)
- [Windows SignTool Documentation](https://docs.microsoft.com/windows/win32/seccrypto/signtool)

## Support

If you encounter issues with code signing:

1. Check the [troubleshooting section](#troubleshooting) above
2. Verify your certificate with `Get-AuthenticodeSignature`
3. Review electron-builder logs in `release/builder-debug.yml`
4. Contact your certificate authority for certificate-specific issues

## Cost Comparison

| Provider | Standard (OV) | EV | Validation Time |
|----------|---------------|-----|-----------------|
| DigiCert | $474/year | $629/year | 3-5 days / 1-2 weeks |
| Sectigo | $200/year | $350/year | 3-5 days / 1-2 weeks |
| GlobalSign | $249/year | $599/year | 3-5 days / 1-2 weeks |
| SSL.com | $199/year | $399/year | 2-3 days / 1 week |

**Recommendation for production:**
- **Start**: Sectigo Standard ($200/year) for cost-effectiveness
- **Scale**: DigiCert EV ($629/year) when SmartScreen warnings become an issue
- **Enterprise**: DigiCert EV with multi-year purchase for volume discount
