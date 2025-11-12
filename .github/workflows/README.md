# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the UniFi-Doordeck Bridge project.

## Workflows

### Build Windows Installer (`build-installer.yml`)

Automatically builds the Windows installer (.exe) using NSIS.

**Triggers:**
- **Releases:** Automatically runs when a new release is created
- **Manual:** Can be triggered manually via GitHub Actions UI

**Process:**
1. Checkout code
2. Setup Node.js v20
3. Install dependencies
4. Run tests (continues on test failures for integration tests)
5. Build TypeScript project
6. Install NSIS
7. Build installer
8. Upload as artifact (available for 90 days)
9. Attach to release (if triggered by release)

**Artifacts:**
- Installer available as workflow artifact: `windows-installer`
- Filename: `UniFi-Doordeck-Bridge-Setup-X.X.X.exe`

## Usage

### Triggering a Build Manually

1. Go to: **Actions** → **Build Windows Installer**
2. Click: **Run workflow**
3. Select branch (usually `main`)
4. (Optional) Specify custom version number
5. Click: **Run workflow**

### Creating a Release

To automatically build and attach the installer to a release:

1. Create a new tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. Create release on GitHub:
   - Go to **Releases** → **Draft a new release**
   - Choose the tag: `v1.0.0`
   - Fill in release notes
   - Click **Publish release**

3. GitHub Actions will:
   - Build the installer
   - Attach it to the release automatically

### Downloading Artifacts

**From Workflow Run:**
1. Go to **Actions** → **Build Windows Installer**
2. Click on a workflow run
3. Scroll to **Artifacts**
4. Download `windows-installer`

**From Release:**
1. Go to **Releases**
2. Find your release
3. Download `UniFi-Doordeck-Bridge-Setup-X.X.X.exe` from Assets

## Requirements

- **GitHub Token:** Automatically provided (no setup needed)
- **Windows Runner:** GitHub-hosted `windows-latest`
- **NSIS:** Installed automatically during workflow

## Customization

### Changing Version

Version is automatically read from `package.json`. To change:

```bash
npm version 1.1.0
git push
git push --tags
```

### Modifying Workflow

Edit `.github/workflows/build-installer.yml`:

```yaml
# Change Node.js version
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to desired version

# Change artifact retention
- uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # Change to desired days (1-90)
```

## Troubleshooting

### Build Fails: NSIS Not Found

**Solution:** The workflow automatically installs NSIS. If it fails, check:
- SourceForge is accessible
- Download URL is valid
- Installation completed successfully

### Build Fails: Tests Failed

**Note:** Test failures don't stop the installer build (by design).
- Integration tests require real services and may fail in CI
- Check test logs to verify if failures are expected

### Installer Not Attached to Release

**Causes:**
- Release was created manually (not via tag push)
- Workflow didn't trigger
- Permissions issue

**Solution:**
- Ensure release is created with a tag
- Re-run the workflow manually
- Check GitHub token has release write permissions

### Artifact Not Found

**Causes:**
- Artifact expired (90 day retention)
- Build failed before artifact upload
- Wrong workflow run

**Solution:**
- Trigger a new build
- Download from latest successful run
- Check workflow logs for errors

## Security

### Secrets

No secrets are required for building the installer. GitHub automatically provides:
- `GITHUB_TOKEN` - For uploading to releases

### Code Signing

For production releases, add code signing:

1. Add certificate to repository secrets:
   - `CERT_FILE` - Base64 encoded certificate
   - `CERT_PASSWORD` - Certificate password

2. Update workflow:
   ```yaml
   - name: Sign installer
     run: |
       # Decode certificate
       $cert = [System.Convert]::FromBase64String("${{ secrets.CERT_FILE }}")
       [IO.File]::WriteAllBytes("cert.pfx", $cert)

       # Sign installer
       & "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe" sign `
         /f cert.pfx `
         /p "${{ secrets.CERT_PASSWORD }}" `
         /t http://timestamp.digicert.com `
         UniFi-Doordeck-Bridge-Setup-*.exe
     shell: pwsh
   ```

## Best Practices

1. **Tag Releases:** Always create releases from tags
2. **Semantic Versioning:** Use semver (1.0.0, 1.1.0, 2.0.0)
3. **Release Notes:** Include comprehensive changelog
4. **Test First:** Run tests locally before releasing
5. **Sign Installers:** Use code signing for production releases

## Support

For issues with GitHub Actions:
- **Workflow Logs:** Check detailed logs in Actions tab
- **GitHub Docs:** https://docs.github.com/en/actions
- **Project Issues:** https://github.com/your-org/unifi-doordeck-bridge/issues
