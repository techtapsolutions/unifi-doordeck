; UniFi-Doordeck Bridge - NSIS Installer Script
; Requires NSIS 3.x (https://nsis.sourceforge.io/)
;
; Build command: makensis unifi-doordeck-bridge.nsi

;--------------------------------
; Includes

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"

;--------------------------------
; General Configuration

!define PRODUCT_NAME "UniFi-Doordeck Bridge"

; Read version from package.json
!tempfile VersionFile
!system 'powershell -Command "(Get-Content ..\package.json | ConvertFrom-Json).version | Out-File -FilePath ${VersionFile} -Encoding ASCII -NoNewline"'
!define /file PRODUCT_VERSION ${VersionFile}
!delfile ${VersionFile}

!define PRODUCT_PUBLISHER "Tech Tap Solutions"
!define PRODUCT_WEB_SITE "https://github.com/techtap/unifi-doordeck-bridge"
!define PRODUCT_INSTALL_DIR "$PROGRAMFILES64\UniFi-Doordeck-Bridge"
!define PRODUCT_DATA_DIR $COMMONAPPDATA\UniFi-Doordeck-Bridge
!define SERVICE_NAME "UniFi-Doordeck-Bridge"

; Installer/Uninstaller names
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "UniFi-Doordeck-Bridge-Setup-${PRODUCT_VERSION}.exe"
InstallDir "${PRODUCT_INSTALL_DIR}"

; Request administrator privileges
RequestExecutionLevel admin

; Compression
SetCompressor /SOLID lzma

;--------------------------------
; Version Information

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "Copyright © 2025 ${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"

;--------------------------------
; Modern UI Configuration

!define MUI_ABORTWARNING

; Custom graphics (optional - comment out if assets don't exist)
; !define MUI_ICON "assets\icon.ico"
; !define MUI_UNICON "assets\icon.ico"
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
; !define MUI_WELCOMEFINISHPAGE_BITMAP "assets\welcome.bmp"

;--------------------------------
; Pages

; Installer pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch Configuration Wizard"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchConfigWizard"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Installer Sections

Section "Core Files" SecCore
  SectionIn RO ; Required section

  SetOutPath "$INSTDIR"

  ; Copy package files
  File "..\package.json"
  File "..\package-lock.json"
  File "..\LICENSE"
  File "..\README.md"

  ; Copy all built files with directory structure
  SetOutPath "$INSTDIR\dist"
  File /r "..\dist\*.*"

  ; Copy scripts
  SetOutPath "$INSTDIR\scripts"
  File "..\scripts\install-service.js"
  File "..\scripts\uninstall-service.js"

  ; Copy web UI files
  SetOutPath "$INSTDIR\ui"
  File "..\ui\index.html"
  File "..\ui\styles.css"
  File "..\ui\app.js"

  ; Copy example config
  SetOutPath "$INSTDIR"
  File "..\config.example.json"

  ; Create data directory
  CreateDirectory "${PRODUCT_DATA_DIR}"
  CreateDirectory "${PRODUCT_DATA_DIR}\logs"

  ; Copy config if it doesn't exist
  ${If} ${FileExists} "${PRODUCT_DATA_DIR}\config.json"
    DetailPrint "Configuration file already exists, skipping..."
  ${Else}
    CopyFiles "$INSTDIR\config.example.json" "${PRODUCT_DATA_DIR}\config.json"
  ${EndIf}

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Write registry keys
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "DisplayIcon" "$INSTDIR\dist\service\wrapper.js"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                   "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                     "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                     "NoRepair" 1

  ; Get install size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
                     "EstimatedSize" "$0"
SectionEnd

Section "Node.js Dependencies" SecNodeModules
  DetailPrint "Installing Node.js dependencies..."

  SetOutPath "$INSTDIR"

  ; Check if node_modules exists
  ${If} ${FileExists} "$INSTDIR\node_modules\*.*"
    DetailPrint "Dependencies already installed, skipping..."
  ${Else}
    ; Run npm install
    nsExec::ExecToLog 'cmd /c cd "$INSTDIR" && npm install --production --no-optional'
    Pop $0
    ${If} $0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Failed to install Node.js dependencies.$\n$\nPlease run 'npm install --production' manually in the installation directory."
    ${EndIf}
  ${EndIf}
SectionEnd

Section "Windows Service" SecService
  DetailPrint "Installing Windows Service..."

  SetOutPath "$INSTDIR"

  ; Check if service already exists
  nsExec::ExecToLog 'sc query "${SERVICE_NAME}"'
  Pop $0
  ${If} $0 == 0
    DetailPrint "Service already exists, skipping installation..."
  ${Else}
    ; Install service
    nsExec::ExecToLog 'cmd /c cd "$INSTDIR" && node scripts\install-service.js'
    Pop $0
    ${If} $0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Failed to install Windows Service.$\n$\nYou can install it manually by running:$\nnode scripts\install-service.js"
    ${Else}
      DetailPrint "Service installed successfully"
    ${EndIf}
  ${EndIf}
SectionEnd

Section "Start Menu Shortcuts" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"

  ; Configuration shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Configure.lnk" \
                 "notepad.exe" \
                 "${PRODUCT_DATA_DIR}\config.json" \
                 "" 0

  ; Logs folder shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\View Logs.lnk" \
                 "${PRODUCT_DATA_DIR}\logs" \
                 "" "" 0

  ; Start service shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Start Service.lnk" \
                 "sc.exe" \
                 'start "${SERVICE_NAME}"' \
                 "" 0

  ; Stop service shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Stop Service.lnk" \
                 "sc.exe" \
                 'stop "${SERVICE_NAME}"' \
                 "" 0

  ; Restart service shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Restart Service.lnk" \
                 "cmd.exe" \
                 '/c sc stop "${SERVICE_NAME}" && timeout /t 3 && sc start "${SERVICE_NAME}"' \
                 "" 0

  ; Services console shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Service Manager.lnk" \
                 "services.msc" \
                 "" "" 0

  ; Uninstall shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" \
                 "$INSTDIR\Uninstall.exe" \
                 "" "" 0

  ; README shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\README.lnk" \
                 "$INSTDIR\README.md" \
                 "" "" 0

  ; Web Interface shortcut
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Web Interface.lnk" \
                 "cmd.exe" \
                 '/c start http://localhost:3000' \
                 "" 0 SW_SHOWMINIMIZED
SectionEnd

Section "Documentation" SecDocs
  SetOutPath "$INSTDIR\docs"

  File /nonfatal "..\INSTALLATION.md"
  File /nonfatal "..\CONFIGURATION.md"
  File /nonfatal "..\TROUBLESHOOTING.md"
  File /nonfatal "..\ARCHITECTURE.md"
  ; File /nonfatal "..\SECURITY.md"  ; Commented out - file doesn't exist yet
SectionEnd

;--------------------------------
; Section Descriptions

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} \
    "Core bridge files and service wrapper (required)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecNodeModules} \
    "Install Node.js dependencies via npm (recommended)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecService} \
    "Register and install Windows Service (recommended)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} \
    "Create Start Menu shortcuts for easy access"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDocs} \
    "Install documentation files"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Installer Functions

Function .onInit
  ; Check Windows version (Windows 10+ required)
  ${If} ${AtLeastWin10}
    ; OK
  ${ElseIf} ${IsWin2016}
    ; OK
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "This application requires Windows 10 or Windows Server 2016 or later."
    Abort
  ${EndIf}

  ; Check for administrator privileges
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_OK|MB_ICONEXCLAMATION "Administrator privileges required.$\n$\nPlease run the installer as Administrator."
    Abort
  ${EndIf}

  ; Check if Node.js is installed
  nsExec::ExecToStack 'node --version'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_YESNO|MB_ICONEXCLAMATION "Node.js was not detected on your system.$\n$\nNode.js 20 LTS or later is required.$\n$\nDo you want to continue anyway?" IDYES +2
    Abort
  ${Else}
    ; Node.js found - display version
    DetailPrint "Found Node.js version: $1"
    DetailPrint "Note: Node.js 20 LTS or later is recommended"
  ${EndIf}
FunctionEnd

Function LaunchConfigWizard
  ; Open configuration file in default editor
  ExecShell "open" "${PRODUCT_DATA_DIR}\config.json"
FunctionEnd

;--------------------------------
; Uninstaller Section

Section "Uninstall"
  ; Stop service if running
  DetailPrint "Stopping service..."
  nsExec::ExecToLog 'sc stop "${SERVICE_NAME}"'
  Sleep 3000

  ; Uninstall service
  DetailPrint "Uninstalling service..."
  nsExec::ExecToLog 'sc delete "${SERVICE_NAME}"'

  ; Remove files
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\scripts"
  RMDir /r "$INSTDIR\docs"
  RMDir /r "$INSTDIR\node_modules"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\package-lock.json"
  Delete "$INSTDIR\config.example.json"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\README.md"

  ; Remove directory if empty
  RMDir "$INSTDIR"

  ; Remove Start Menu shortcuts
  RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"

  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

  ; Ask if user wants to remove configuration and logs
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to remove configuration and log files?$\n$\n${PRODUCT_DATA_DIR}" IDNO +3
  RMDir /r "${PRODUCT_DATA_DIR}"
  Goto +2
  DetailPrint "Configuration and logs preserved at: ${PRODUCT_DATA_DIR}"
SectionEnd

Function un.onInit
  ; Check for administrator privileges
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_OK|MB_ICONEXCLAMATION "Administrator privileges required.$\n$\nPlease run the uninstaller as Administrator."
    Abort
  ${EndIf}

  MessageBox MB_YESNO|MB_ICONQUESTION "Are you sure you want to uninstall ${PRODUCT_NAME}?" IDYES +2
  Abort
FunctionEnd
