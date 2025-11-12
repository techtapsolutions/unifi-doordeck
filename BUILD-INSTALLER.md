# Building the Windows Installer

This guide shows how to build both EXE (NSIS) and MSI installers for the UniFi-Doordeck Bridge.

## Option 1: NSIS Installer (.exe) - Recommended ✅

The NSIS installer is already configured and ready to build.

### Prerequisites

1. **Node.js 20+** installed on Windows VM
2. **NSIS 3.09** installer tool
3. **Project files** copied to Windows VM

### Step 1: Install NSIS

**Download NSIS:**
1. Go to: https://sourceforge.net/projects/nsis/files/NSIS%203/3.09/
2. Download: `nsis-3.09-setup.exe`
3. Run installer as Administrator
4. Install to default location: `C:\Program Files (x86)\NSIS`
5. Click "Finish"

**Verify installation:**
```cmd
"C:\Program Files (x86)\NSIS\makensis.exe" /VERSION
```

Should output: `v3.09`

### Step 2: Prepare Project

**Open Command Prompt as Administrator:**
```cmd
cd path\to\unifi-doordeck-bridge
```

**Install dependencies:**
```cmd
npm install
```

**Build TypeScript:**
```cmd
npm run build
```

### Step 3: Build the Installer

**Option A: Using npm script (recommended):**
```cmd
npm run installer:build:win
```

**Option B: Manual build:**
```cmd
cd installer
"C:\Program Files (x86)\NSIS\makensis.exe" unifi-doordeck-bridge.nsi
```

### Step 4: Locate the Installer

The installer will be created in the `installer\` directory:

```cmd
dir installer\*.exe
```

**Expected output:**
```
UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

The version (0.1.0) is automatically read from `package.json`.

### Step 5: Test the Installer

**Run the installer:**
1. Right-click `UniFi-Doordeck-Bridge-Setup-0.1.0.exe`
2. Select "Run as administrator"
3. Follow installation wizard
4. Installer will:
   - Copy program files to `C:\Program Files\UniFi-Doordeck-Bridge`
   - Install Node.js dependencies
   - Register Windows Service
   - Create Start Menu shortcuts
   - Create configuration directory

**Verify installation:**
```cmd
sc query "UniFi-Doordeck-Bridge"
```

Should show service is installed.

### What the NSIS Installer Includes

✅ **Core Features:**
- Complete application installation
- Node.js dependencies installation
- Windows Service registration
- Start Menu shortcuts (Configure, View Logs, Start/Stop Service)
- Configuration wizard on finish
- Automatic uninstaller creation

✅ **Installation Locations:**
- Program files: `C:\Program Files\UniFi-Doordeck-Bridge`
- Configuration: `C:\ProgramData\UniFi-Doordeck-Bridge`
- Logs: `C:\ProgramData\UniFi-Doordeck-Bridge\logs`

✅ **Start Menu Shortcuts:**
- Configure (opens config.json)
- View Logs
- Start Service
- Stop Service
- Restart Service
- Service Manager
- Uninstall

### Customizing the Installer

**Change company name:**

Edit `installer/unifi-doordeck-bridge.nsi`:
```nsis
!define PRODUCT_PUBLISHER "Your Company Name"  ← Change this
```

**Change website:**
```nsis
!define PRODUCT_WEB_SITE "https://github.com/your-org/unifi-doordeck-bridge"
```

**Add custom icon:**

Place your icon file in `installer/assets/icon.ico` and the installer will use it automatically.

**Add custom graphics:**

Replace these files:
- `installer/assets/header.bmp` (150x57 pixels)
- `installer/assets/welcome.bmp` (164x314 pixels)

## Option 2: WiX Toolset Installer (.msi)

MSI installers are preferred in enterprise environments and integrate with Group Policy.

### Step 1: Install WiX Toolset

**Download WiX:**
1. Go to: https://github.com/wixtoolset/wix3/releases/latest
2. Download: `wix314.exe` (or latest version)
3. Run installer
4. Install to default location

**Add to PATH:**
```cmd
setx PATH "%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin"
```

Close and reopen Command Prompt for PATH to update.

**Verify installation:**
```cmd
candle -?
```

### Step 2: Create WiX Configuration

Create `installer/product.wxs`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <?define ProductVersion="!(bind.FileVersion.MainExecutable)" ?>

  <Product
    Id="*"
    Name="UniFi-Doordeck Bridge"
    Language="1033"
    Version="0.1.0"
    Manufacturer="Your Company Name"
    UpgradeCode="E9C5E5F9-8B5A-4A5E-9F3E-5C8D7F6E4D3C">

    <Package
      InstallerVersion="200"
      Compressed="yes"
      InstallScope="perMachine"
      Description="UniFi-Doordeck Bridge Installer"
      Comments="Bridges UniFi Access with Doordeck Cloud"/>

    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <!-- Installation directory -->
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFiles64Folder">
        <Directory Id="INSTALLFOLDER" Name="UniFi-Doordeck-Bridge">

          <!-- Program Files -->
          <Component Id="MainApplication" Guid="A1B2C3D4-E5F6-7890-ABCD-EF1234567890">
            <File Id="MainExecutable" Source="..\dist\index.js" KeyPath="yes" />
            <File Source="..\package.json" />
            <File Source="..\LICENSE" />
            <File Source="..\README.md" />

            <!-- Service installation -->
            <ServiceInstall
              Id="ServiceInstaller"
              Name="UniFi-Doordeck-Bridge"
              DisplayName="UniFi-Doordeck Bridge"
              Description="Bridges UniFi Access controllers with Doordeck Cloud platform"
              Start="auto"
              Type="ownProcess"
              ErrorControl="normal"
              Arguments='"[INSTALLFOLDER]dist\service\wrapper.js"'
            />

            <ServiceControl
              Id="ServiceController"
              Name="UniFi-Doordeck-Bridge"
              Start="install"
              Stop="both"
              Remove="uninstall"
            />
          </Component>

          <!-- Distribution files -->
          <Directory Id="DistFolder" Name="dist">
            <Component Id="DistFiles" Guid="B2C3D4E5-F6A7-8901-BCDE-F12345678901">
              <File Source="..\dist\*.*" />
            </Component>
          </Directory>

        </Directory>
      </Directory>

      <!-- ProgramData directory -->
      <Directory Id="CommonAppDataFolder">
        <Directory Id="DataFolder" Name="UniFi-Doordeck-Bridge">
          <Component Id="DataDirectory" Guid="C3D4E5F6-A7B8-9012-CDEF-123456789012">
            <CreateFolder>
              <Permission User="Everyone" GenericAll="yes" />
            </CreateFolder>
            <File Id="ConfigExample" Source="..\config.example.json" Name="config.json" />

            <Directory Id="LogsFolder" Name="logs">
              <CreateFolder />
            </Directory>
          </Component>
        </Directory>
      </Directory>

      <!-- Start Menu shortcuts -->
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="UniFi-Doordeck Bridge">
          <Component Id="StartMenuShortcuts" Guid="D4E5F6A7-B8C9-0123-DEFG-234567890123">
            <Shortcut
              Id="ConfigShortcut"
              Name="Configure"
              Target="[SystemFolder]notepad.exe"
              Arguments="[DataFolder]config.json"
              WorkingDirectory="DataFolder"
            />
            <Shortcut
              Id="ViewLogsShortcut"
              Name="View Logs"
              Target="[DataFolder]logs"
              WorkingDirectory="DataFolder"
            />
            <Shortcut
              Id="UninstallShortcut"
              Name="Uninstall"
              Target="[SystemFolder]msiexec.exe"
              Arguments="/x [ProductCode]"
            />
            <RemoveFolder Id="ApplicationProgramsFolder" On="uninstall"/>
            <RegistryValue Root="HKCU" Key="Software\UniFi-Doordeck-Bridge" Name="installed" Type="integer" Value="1" KeyPath="yes"/>
          </Component>
        </Directory>
      </Directory>
    </Directory>

    <!-- Features -->
    <Feature Id="ProductFeature" Title="UniFi-Doordeck Bridge" Level="1">
      <ComponentRef Id="MainApplication" />
      <ComponentRef Id="DistFiles" />
      <ComponentRef Id="DataDirectory" />
      <ComponentRef Id="StartMenuShortcuts" />
    </Feature>

    <!-- UI -->
    <UIRef Id="WixUI_InstallDir" />
    <Property Id="WIXUI_INSTALLDIR" Value="INSTALLFOLDER" />
    <WixVariable Id="WixUILicenseRtf" Value="License.rtf" />

  </Product>
</Wix>
```

### Step 3: Create License File

Create `installer/License.rtf`:

```rtf
{\rtf1\ansi\deff0
{\fonttbl{\f0 Times New Roman;}}
\f0\fs24
MIT License

Copyright (c) 2025 Your Company Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
}
```

### Step 4: Build MSI Installer

**Compile WiX source:**
```cmd
cd installer
candle product.wxs
```

**Link into MSI:**
```cmd
light -ext WixUIExtension -out UniFi-Doordeck-Bridge-0.1.0.msi product.wixobj
```

**Or use combined command:**
```cmd
candle product.wxs && light -ext WixUIExtension -out UniFi-Doordeck-Bridge-0.1.0.msi product.wixobj
```

### Step 5: Test MSI Installer

**Install:**
```cmd
msiexec /i UniFi-Doordeck-Bridge-0.1.0.msi /qn /l*v install.log
```

**Install with UI:**
```cmd
msiexec /i UniFi-Doordeck-Bridge-0.1.0.msi /l*v install.log
```

**Uninstall:**
```cmd
msiexec /x UniFi-Doordeck-Bridge-0.1.0.msi /qn
```

### MSI vs NSIS Comparison

| Feature | NSIS (.exe) | WiX (.msi) |
|---------|-------------|------------|
| **Setup complexity** | Simple | Complex |
| **Enterprise deployment** | Limited | Excellent (Group Policy) |
| **Customization** | Very flexible | Structured |
| **Build time** | Fast | Slower |
| **File size** | Smaller | Larger |
| **Repair/Rollback** | No | Yes |
| **Silent install** | Yes | Yes |
| **Already configured** | ✅ Yes | ❌ No |

**Recommendation:** Use NSIS (.exe) for now since it's already configured. Switch to MSI if you need enterprise deployment features.

## Quick Build Commands

### NSIS (.exe) - Recommended
```cmd
npm run installer:build:win
```
Output: `installer\UniFi-Doordeck-Bridge-Setup-0.1.0.exe`

### WiX (.msi) - After setup
```cmd
cd installer
candle product.wxs && light -ext WixUIExtension -out UniFi-Doordeck-Bridge-0.1.0.msi product.wixobj
```
Output: `installer\UniFi-Doordeck-Bridge-0.1.0.msi`

## Adding to npm scripts

Add to `package.json`:

```json
{
  "scripts": {
    "installer:build:nsis": "npm run installer:prepare && cd installer && \"C:\\Program Files (x86)\\NSIS\\makensis.exe\" unifi-doordeck-bridge.nsi",
    "installer:build:msi": "cd installer && candle product.wxs && light -ext WixUIExtension -out UniFi-Doordeck-Bridge.msi product.wixobj",
    "installer:build:all": "npm run installer:build:nsis && npm run installer:build:msi"
  }
}
```

## Troubleshooting

### NSIS: "Can't find makensis"

**Error:**
```
'makensis' is not recognized as an internal or external command
```

**Solution:**
```cmd
set PATH=%PATH%;C:\Program Files (x86)\NSIS
```

Or use full path in command.

### WiX: "Can't find candle"

**Error:**
```
'candle' is not recognized as an internal or external command
```

**Solution:**
```cmd
setx PATH "%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin"
```

Close and reopen Command Prompt.

### Build fails: "dist folder not found"

**Error:**
```
File not found: ..\dist\index.js
```

**Solution:**
```cmd
npm run build
```

### Service installation fails in MSI

**Error:**
```
Service failed to install
```

**Solution:**
- Run msiexec as Administrator
- Check service isn't already running
- Review install.log for details

## Next Steps

After building the installer:

1. **Test on clean Windows VM:**
   - No Node.js installed
   - No previous installation
   - Verify complete installation works

2. **Test upgrade scenario:**
   - Install version 0.1.0
   - Build version 0.1.1
   - Install over existing version
   - Verify config preserved

3. **Test uninstallation:**
   - Verify service removed
   - Verify files removed
   - Check for leftover registry entries

4. **Sign the installer** (for production):
   - Obtain code signing certificate
   - Use signtool.exe to sign
   - Prevents Windows SmartScreen warnings

## Code Signing (Optional)

To avoid Windows SmartScreen warnings:

```cmd
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com UniFi-Doordeck-Bridge-Setup-0.1.0.exe
```

Or add to GitHub Actions workflow for automatic signing.
