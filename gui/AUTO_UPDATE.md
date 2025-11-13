# Auto-Update System

## Overview

The UniFi-Doordeck Bridge GUI includes a built-in auto-update system powered by `electron-updater`. This allows users to receive new versions automatically without manual downloads.

## Features

- ✅ **Automatic Update Checks**: Checks for updates on startup and can be triggered manually
- ✅ **Background Downloads**: Updates download in the background without interrupting work
- ✅ **Progress Tracking**: Real-time download progress with speed and size information
- ✅ **User Control**: Users choose when to install updates
- ✅ **Code Signing Verification**: Ensures updates are authentic and unmodified
- ✅ **Release Notes**: Displays changelog for each update
- ✅ **Graceful Fallback**: Works even if update servers are unavailable

## How It Works

### Update Flow

1. **Check**: App checks for updates on startup (after 5-second delay)
2. **Notify**: If update available, notification appears with version and release notes
3. **Download**: User clicks "Download Update" - downloads in background
4. **Install**: Once downloaded, user can restart now or install on next restart
5. **Apply**: Update installs and app restarts with new version

### Update Checking

- **On Startup**: Automatic check 5 seconds after app starts
- **Manual**: Users can click "Check for Updates" button in Dashboard
- **Silent**: No interruption if already up-to-date

## Configuration

### 1. Update Server (package.json)

The `publish` configuration in `package.json` defines where updates are hosted:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_GITHUB_USERNAME",
        "repo": "YOUR_REPO_NAME",
        "releaseType": "release"
      }
    ]
  }
}
```

**Supported Providers:**

#### GitHub Releases (Recommended for Open Source)
```json
{
  "provider": "github",
  "owner": "your-org",
  "repo": "your-repo",
  "releaseType": "release"  // or "draft" or "prerelease"
}
```

#### Amazon S3
```json
{
  "provider": "s3",
  "bucket": "your-bucket",
  "region": "us-east-1",
  "path": "/updates"
}
```

#### Generic HTTP Server
```json
{
  "provider": "generic",
  "url": "https://updates.yourcompany.com"
}
```

#### Azure Blob Storage
```json
{
  "provider": "azure",
  "container": "updates",
  "account": "your-account"
}
```

### 2. Update Manager Settings

The `UpdateManager` class in `src/main/update-manager.ts` can be configured:

```typescript
autoUpdater.autoDownload = false;  // Don't auto-download (user confirms first)
autoUpdater.autoInstallOnAppQuit = true;  // Install when user quits app
```

**Options:**
- `autoDownload`: If true, downloads updates automatically without asking
- `autoInstallOnAppQuit`: If true, installs pending updates when app closes
- `allowDowngrade`: If true, allows installing older versions

## Publishing Updates

### Method 1: GitHub Releases (Recommended)

1. **Build the Application**
   ```bash
   npm run package:win
   ```

2. **Create GitHub Release**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Tag version: `v1.0.1` (must match version in package.json)
   - Release title: `Version 1.0.1`
   - Description: Add release notes (will be shown to users)

3. **Upload Artifacts**
   Upload these files from `release/` folder:
   - `UniFi-Doordeck Bridge-Setup-1.0.1.exe` (NSIS installer)
   - `UniFi-Doordeck Bridge-Setup-1.0.1.exe.blockmap` (delta updates)
   - `latest.yml` (update metadata)

4. **Publish Release**
   - Click "Publish release"
   - Users will be notified of the update on next app start

### Method 2: Automated with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
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
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run package:win

      - name: Publish to GitHub Releases
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx electron-builder --win --publish always
```

**Setup:**
1. Add secrets to GitHub repository:
   - `WIN_CSC_LINK_BASE64`: Base64-encoded certificate
   - `WIN_CSC_KEY_PASSWORD`: Certificate password

2. Create git tag and push:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. GitHub Actions will automatically build and create release

### Method 3: S3 Bucket

1. **Configure S3 Bucket**
   - Create S3 bucket: `my-app-updates`
   - Enable public read access for update files
   - Set CORS policy if serving from different domain

2. **Upload Artifacts**
   ```bash
   aws s3 sync release/ s3://my-app-updates/releases/ --exclude "*" --include "*.exe" --include "*.blockmap" --include "*.yml"
   ```

3. **Update package.json**
   ```json
   {
     "publish": {
       "provider": "s3",
       "bucket": "my-app-updates",
       "path": "/releases"
     }
   }
   ```

## Testing Updates

### 1. Test Locally with Dev Server

Start a local update server:

```bash
# Install http-server globally
npm install -g http-server

# Serve release folder
cd release
http-server -p 8080 --cors
```

Update `dev-app-update.yml` (create in project root):
```yaml
provider: generic
url: http://localhost:8080
```

Set environment variable:
```bash
# Windows PowerShell
$env:ELECTRON_UPDATER_CONFIG_PATH="$PWD/dev-app-update.yml"
```

Run app - it will check local server for updates.

### 2. Test with Different Versions

1. **Build version 1.0.0**
   - Set version in package.json: `"version": "1.0.0"`
   - Run: `npm run package:win`
   - Install the application

2. **Build version 1.0.1**
   - Update version: `"version": "1.0.1"`
   - Run: `npm run package:win`
   - Upload to test server or GitHub release

3. **Test Update Flow**
   - Launch version 1.0.0
   - Wait for update notification (or click "Check for Updates")
   - Click "Download Update"
   - Observe download progress
   - Click "Restart and Install Now"
   - Verify app restarts with version 1.0.1

### 3. Test Update Scenarios

**Scenario 1: Update Available**
- Expected: Notification appears, download works, install succeeds

**Scenario 2: Already Up-to-Date**
- Expected: "You are already running the latest version" message

**Scenario 3: Update Server Offline**
- Expected: Error message, app continues working normally

**Scenario 4: Download Interrupted**
- Expected: Resume download or show error, retry available

## Release Process Checklist

- [ ] 1. Update version in `package.json`
- [ ] 2. Update `CHANGELOG.md` with release notes
- [ ] 3. Run tests: `npm test`
- [ ] 4. Build application: `npm run build`
- [ ] 5. Package with code signing: `npm run package:win`
- [ ] 6. Test installer on clean machine
- [ ] 7. Create GitHub release with tag matching version
- [ ] 8. Upload build artifacts (exe, blockmap, yml)
- [ ] 9. Write release notes (shown to users)
- [ ] 10. Publish release
- [ ] 11. Verify update works from previous version
- [ ] 12. Monitor for user feedback

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

**Git Tags:**
- Format: `v1.0.1` (note the `v` prefix)
- Must match package.json version
- Required for automated workflows

## User Experience

### Update Notifications

**Update Available:**
- Modal appears with version number
- Shows release notes
- "Download Update" or "Remind Me Later" buttons

**Downloading:**
- Progress bar with percentage
- Transfer amount and speed
- No interruption to work

**Ready to Install:**
- Notification when download complete
- "Restart Now" or "Install on Next Restart" options
- Auto-installs on next app close

### Manual Check

Users can check for updates anytime:
1. Click "Check for Updates" in Dashboard header
2. If available: Download flow starts
3. If up-to-date: "You are already running the latest version" message

## Delta Updates

electron-updater supports delta updates (only downloading changed files):

**Benefits:**
- Faster downloads (only diff, not full installer)
- Less bandwidth usage
- Better for users with slow connections

**Requirements:**
- Keep previous versions' artifacts online
- Upload `.blockmap` files with each release
- Served via NSIS (not portable)

**How It Works:**
1. User has version 1.0.0 installed
2. Update to 1.0.1 available
3. electron-updater downloads diff (e.g., 2MB instead of 150MB)
4. Applies patch locally
5. Installs updated version

## Troubleshooting

### Update Check Fails

**Symptoms:** "Failed to check for updates" error

**Causes:**
- Update server is offline
- Incorrect publish configuration
- Network/firewall blocking requests
- GitHub API rate limit exceeded

**Solutions:**
1. Verify publish configuration in package.json
2. Check server/GitHub release is accessible
3. Test URL manually in browser
4. Check firewall/antivirus settings
5. For GitHub: Ensure release is published (not draft)

### Download Fails

**Symptoms:** Download starts but fails midway

**Causes:**
- Network interruption
- Server timeout
- Disk space full
- Antivirus blocking download

**Solutions:**
1. Retry download (built-in retry logic)
2. Check available disk space
3. Temporarily disable antivirus
4. Check server logs for errors

### Install Fails

**Symptoms:** Download complete but install fails

**Causes:**
- Insufficient permissions (need admin)
- App files are locked (app still running)
- Code signature verification failed
- Corrupted download

**Solutions:**
1. Ensure app fully closed before installing
2. Run as administrator
3. Verify code signing is correct
4. Re-download update

### Users Not Getting Updates

**Causes:**
- Old version doesn't have auto-update code
- publish configuration missing/wrong
- Firewall blocking update checks
- Users disabled auto-check

**Solutions:**
1. Verify old version has updater code
2. Double-check package.json publish config
3. Test update URL manually
4. Provide manual download link as fallback

## Security Considerations

### Code Signing (Critical!)

**Without code signing:**
- Updates will be rejected
- Windows SmartScreen warnings
- Users can't trust updates

**With code signing:**
- Updates verified automatically
- No warnings
- Secure update channel

See [CODE_SIGNING.md](CODE_SIGNING.md) for details.

### Signature Verification

electron-updater automatically verifies:
- Code signature matches publisher
- Files haven't been tampered
- Update is from trusted source

Set in package.json:
```json
{
  "win": {
    "verifyUpdateCodeSignature": true  // Set to true in production!
  }
}
```

### HTTPS Only

Always serve updates over HTTPS:
- Prevents man-in-the-middle attacks
- Required for security
- Use Let's Encrypt for free SSL

### Access Control

For private updates:
- Use S3 with pre-signed URLs
- Implement authentication in generic provider
- Use GitHub private releases with tokens

## Advanced Configuration

### Custom Update Server

Implement your own update server matching `latest.yml` format:

```yaml
version: 1.0.1
path: UniFi-Doordeck-Bridge-Setup-1.0.1.exe
sha512: <hash>
releaseDate: '2025-01-15T10:00:00.000Z'
releaseNotes: |
  ## What's New
  - Feature 1
  - Feature 2
  - Bug fix 3
```

Serve files:
- `latest.yml` - Update metadata
- `UniFi-Doordeck-Bridge-Setup-1.0.1.exe` - Installer
- `UniFi-Doordeck-Bridge-Setup-1.0.1.exe.blockmap` - Delta updates

### Staged Rollouts

Release to subset of users first:

1. **Use prerelease tags:**
   ```json
   {
     "publish": {
       "provider": "github",
       "releaseType": "prerelease"
     }
   }
   ```

2. **Or use multiple channels:**
   - Beta channel: `latest-beta.yml`
   - Stable channel: `latest.yml`
   - Configure channel in app settings

### Update Channels

Support multiple update channels (stable, beta, dev):

```typescript
// In update-manager.ts
autoUpdater.channel = 'beta';  // or 'stable', 'dev'
```

Different channels can have different versions:
- Stable: 1.0.1
- Beta: 1.1.0-beta.1
- Dev: 1.2.0-dev.5

## Monitoring

Track update metrics:

- Update check success rate
- Download completion rate
- Install success rate
- Time to update adoption
- Errors encountered

Use analytics or logging service to monitor:

```typescript
// In update-manager.ts
autoUpdater.on('update-available', (info) => {
  analytics.track('update_available', { version: info.version });
});

autoUpdater.on('update-downloaded', (info) => {
  analytics.track('update_downloaded', { version: info.version });
});
```

## FAQ

**Q: How often does it check for updates?**
A: On app startup (after 5 seconds). Users can also check manually.

**Q: Can users disable auto-updates?**
A: Currently no, but you can add a setting in the configuration.

**Q: What happens if update server is down?**
A: Update check silently fails, app continues working normally.

**Q: Do updates work offline?**
A: No, internet connection required to check for and download updates.

**Q: Can I force users to update?**
A: Technically yes, but not recommended. Users control when to install.

**Q: What about macOS/Linux?**
A: This app is Windows-only, but electron-updater supports all platforms.

**Q: How big are update downloads?**
A: With delta updates: typically 1-10MB. Full installer: ~150MB.

**Q: Can I rollback an update?**
A: Users can reinstall previous version manually. No automatic rollback.

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Code Signing Guide](CODE_SIGNING.md)
- [Electron Builder Publishing](https://www.electron.build/configuration/publish)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)

## Support

For issues with auto-updates:
1. Check this documentation
2. Review electron-updater logs in app logs
3. Test update URL manually
4. Check GitHub Issues for similar problems
5. Contact support with logs and error details
