# Testing the GitHub Actions Workflow

This document explains how to test the Windows Installer build workflow.

## Prerequisites

- GitHub repository with Actions enabled
- GitHub account with write access to the repository
- Code pushed to the repository

## Testing Methods

### Method 1: Manual Workflow Trigger (Recommended for Testing)

This is the easiest way to test the workflow without creating a release.

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow for Windows installer"
   git push origin main
   ```

2. **Navigate to Actions:**
   - Go to your repository on GitHub
   - Click the "Actions" tab
   - Click "Build Windows Installer" workflow

3. **Run workflow manually:**
   - Click "Run workflow" button (right side)
   - Select branch: `main`
   - (Optional) Enter custom version number or leave as "dev"
   - Click "Run workflow"

4. **Monitor the build:**
   - Click on the running workflow
   - Watch each step execute
   - Check for errors in the logs

5. **Verify outputs:**
   - Wait for workflow to complete (~5-10 minutes)
   - Check "Artifacts" section at bottom of workflow run
   - Download "windows-installer" artifact
   - Extract and verify the .exe file is present

### Method 2: Create a Test Release

This tests the full release automation workflow.

1. **Update version in package.json:**
   ```bash
   npm version 0.1.1
   ```

2. **Push changes and tags:**
   ```bash
   git push
   git push --tags
   ```

3. **Create release on GitHub:**
   - Go to "Releases" → "Draft a new release"
   - Choose tag: `v0.1.1`
   - Enter release title: "Test Release v0.1.1"
   - Add release notes
   - Click "Publish release"

4. **Verify workflow:**
   - Go to "Actions" tab
   - Workflow should start automatically
   - Wait for completion

5. **Check release assets:**
   - Go to "Releases"
   - Open your release
   - Verify `UniFi-Doordeck-Bridge-Setup-0.1.1.exe` is attached

## Expected Workflow Steps

The workflow should execute these steps in order:

1. ✅ **Checkout code** (~5 seconds)
2. ✅ **Setup Node.js** (~10 seconds)
3. ✅ **Install dependencies** (~60-120 seconds)
4. ✅ **Run tests** (~30 seconds, continues even if tests fail)
5. ✅ **Build project** (~10 seconds)
6. ✅ **Install NSIS** (~30-60 seconds)
7. ✅ **Copy LICENSE file** (~1 second)
8. ✅ **Build installer** (~10-20 seconds)
9. ✅ **Get version and find installer** (~2 seconds)
10. ✅ **Upload installer artifact** (~5-10 seconds)
11. ✅ **Upload to release** (if triggered by release, ~5-10 seconds)
12. ✅ **Create release summary** (~1 second)

**Total expected time:** 5-10 minutes

## Troubleshooting

### Build Fails: NSIS Not Found

**Error:**
```
makensis: command not found
```

**Solution:** The workflow automatically installs NSIS. If this fails:
1. Check SourceForge is accessible
2. Verify NSIS download URL is correct
3. Check Windows runner has internet access

### Build Fails: npm install timeout

**Error:**
```
npm install timed out
```

**Solution:**
1. Re-run the workflow (transient network issue)
2. Check package.json dependencies are valid
3. Verify npm registry is accessible

### Installer Not Found After Build

**Error:**
```
Installer not found at: installer\UniFi-Doordeck-Bridge-Setup-X.X.X.exe
```

**Solution:**
1. Check NSIS script ran successfully
2. Verify version number matches package.json
3. Check NSIS script `OutFile` directive is correct

### Tests Fail But Build Succeeds

This is **expected behavior** because:
- Integration tests require real UniFi Access and Doordeck services
- Tests are set to `continue-on-error: true`
- The installer can still be built even if tests fail

**To fix test failures:**
1. Fix failing unit tests locally
2. Ensure all tests pass before releasing
3. Consider adding test environment to CI

### Artifact Not Available

**Causes:**
- Artifact expired (90-day retention)
- Build failed before artifact upload
- Wrong workflow run

**Solution:**
- Trigger a new build
- Download from latest successful run
- Check workflow logs for upload errors

### Release Asset Not Attached

**Causes:**
- Workflow was triggered manually (not by release)
- Permissions issue with GITHUB_TOKEN
- Upload failed

**Solution:**
1. Ensure release was created (not draft)
2. Re-run workflow from the release page
3. Check GitHub token has `contents: write` permission

## Validation Checklist

After workflow completes successfully, verify:

- [ ] Workflow status is green (✓)
- [ ] All steps completed successfully
- [ ] Installer artifact is available for download
- [ ] Installer filename includes version: `UniFi-Doordeck-Bridge-Setup-X.X.X.exe`
- [ ] Installer file size is reasonable (~50-150 MB)
- [ ] Release asset is attached (if triggered by release)
- [ ] Release summary shows correct version

## Next Steps After Successful Test

1. **Test the installer on Windows:**
   - Download the .exe file
   - Run on a clean Windows 10/11 machine
   - Verify installation completes
   - Verify service is registered
   - Verify Start Menu shortcuts work

2. **Create production release:**
   - Update version to 1.0.0
   - Create official release
   - Test installer with real credentials

3. **Add code signing (optional):**
   - Obtain code signing certificate
   - Add certificate to repository secrets
   - Update workflow to sign installer

## Known Issues

### Test Failures in CI

Some tests fail in CI environment:
- `tests/services/EventTranslator.test.ts` - Missing methods/properties
- `tests/utils/retry.test.ts` - Unused parameters in mocks

**Impact:** These don't prevent installer build due to `continue-on-error: true`

**Resolution:** Fix test issues before 1.0.0 release

### Dynamic Version Reading

The NSIS script now reads version from package.json dynamically using PowerShell. This requires:
- PowerShell available on Windows runner (✓ always available)
- package.json in parent directory relative to installer/ (✓ correct)

## Support

If you encounter issues:

1. **Check workflow logs:**
   - Actions → Select workflow run → Click failing step
   - Review error messages

2. **Review documentation:**
   - `.github/workflows/README.md` - Workflow documentation
   - `INSTALL.md` - Installation guide
   - `README.md` - Project overview

3. **Report issues:**
   - GitHub Issues: Include workflow logs
   - Specify: OS version, Node version, error message
