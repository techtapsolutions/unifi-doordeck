# UniFi-Doordeck Bridge - Tech Stack Recommendation

## Executive Summary

**RECOMMENDED STACK: Electron + TypeScript + React**

This recommendation is based on your existing TypeScript/Node.js codebase, development velocity requirements, code reuse potential, and cross-platform maintenance considerations.

---

## Technology Stack Options Analysis

### Option 1: Electron (TypeScript + React) ⭐ RECOMMENDED

**Description:** Cross-platform desktop apps using web technologies with Chromium and Node.js runtime.

#### Pros
✅ **Maximum Code Reuse**
- Share 70-80% of business logic with existing Node.js backend
- Reuse TypeScript types and interfaces
- Share UniFi API and Doordeck API client code
- Common validation and error handling logic

✅ **Rapid Development**
- Rich ecosystem of React UI libraries
- Hot reload during development
- Familiar tech stack for web developers
- Extensive tooling and debugging support

✅ **Modern UI Capabilities**
- Native-looking Windows 11 UI with CSS
- Smooth animations and transitions
- Easy theming (dark/light mode)
- Rich component libraries (Radix UI, shadcn/ui, etc.)

✅ **Cross-Platform Future**
- Same codebase works on Windows, macOS, Linux
- Future-proof if cross-platform support needed
- Consistent behavior across platforms

✅ **Strong Ecosystem**
- `electron-builder` for packaging and auto-updates
- `electron-store` for persistent config
- `electron-log` for file logging
- Active community and extensive documentation

✅ **System Integration**
- System tray support (`Tray`)
- Native notifications
- Auto-start on boot
- Deep OS integration via Node.js APIs

#### Cons
❌ **Larger Bundle Size**
- Base app: ~120-150MB (includes Chromium runtime)
- Mitigated by: Single installer, user only downloads once

❌ **Memory Footprint**
- Higher RAM usage (~150-200MB idle)
- Mitigated by: Modern PCs have sufficient RAM, app runs as service

❌ **Startup Time**
- Slightly slower startup (1-2 seconds)
- Mitigated by: Auto-start on boot, runs in background

❌ **Not "True Native"**
- Web-based UI, not WPF/WinForms
- Mitigated by: Modern styling matches Windows 11 aesthetic

#### Technical Stack Details

```javascript
// Core Framework
- Electron: ^28.0.0
- Node.js: 20.x (bundled with Electron)
- TypeScript: ^5.3.0

// UI Framework
- React: ^18.2.0
- React Router: ^6.20.0

// State Management
- Zustand: ^4.4.0 (lightweight, simple)
  OR
- Redux Toolkit: ^2.0.0 (if complex state needed)

// UI Components
- Radix UI Primitives (headless, accessible)
- Tailwind CSS for styling
- Framer Motion for animations

// System Integration
- electron-store: Config persistence
- electron-log: File logging
- electron-updater: Auto-updates
- node-notifier: Enhanced notifications

// Build & Packaging
- electron-builder: Packaging, installers, auto-update
- Vite: Fast build tooling
- ESBuild: Fast TypeScript compilation

// Development
- electron-reload: Hot reload
- Concurrently: Run main/renderer processes
- ESLint + Prettier: Code quality
```

#### Project Structure
```
unifi-doordeck-bridge/
├── electron/
│   ├── main/
│   │   ├── index.ts              # Electron main process
│   │   ├── bridge-service.ts     # Bridge service logic (shared)
│   │   ├── tray.ts               # System tray management
│   │   ├── ipc-handlers.ts       # IPC communication
│   │   └── auto-updater.ts       # Update management
│   ├── preload/
│   │   └── index.ts              # Preload script (secure IPC)
│   └── renderer/
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── views/            # Main app views
│       │   ├── hooks/            # Custom React hooks
│       │   ├── store/            # State management
│       │   ├── styles/           # Global styles
│       │   └── App.tsx           # Root component
│       ├── index.html
│       └── vite.config.ts
├── shared/
│   ├── types/                    # Shared TypeScript types
│   ├── services/                 # Shared API clients
│   │   ├── unifi.ts
│   │   └── doordeck.ts
│   └── utils/                    # Shared utilities
├── package.json
└── electron-builder.yml          # Build configuration
```

#### Development Workflow
```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Package for Windows
npm run package:win

# Create installer
npm run dist:win
```

#### Code Reuse Example

**Shared Bridge Service Logic:**
```typescript
// shared/services/bridge-service.ts
export class BridgeService {
  private unifiClient: UniFiClient;
  private doordeckClient: DoordeckClient;

  async syncDoors(): Promise<Door[]> {
    // Same logic used in CLI and GUI
  }

  async unlockDoor(doorId: string): Promise<void> {
    // Same logic used in CLI and GUI
  }
}

// electron/main/index.ts (Main process)
import { BridgeService } from '../../shared/services/bridge-service';
const bridgeService = new BridgeService(config);

// CLI usage (if needed)
import { BridgeService } from './shared/services/bridge-service';
const bridgeService = new BridgeService(config);
```

#### IPC Communication Pattern

```typescript
// electron/preload/index.ts (Secure bridge)
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bridgeAPI', {
  // Service control
  startService: () => ipcRenderer.invoke('service:start'),
  stopService: () => ipcRenderer.invoke('service:stop'),

  // Doors
  getDoors: () => ipcRenderer.invoke('doors:list'),
  unlockDoor: (doorId: string) => ipcRenderer.invoke('doors:unlock', doorId),

  // Logs
  getLogs: (filters: LogFilters) => ipcRenderer.invoke('logs:get', filters),

  // Events (streaming from main to renderer)
  onServiceStatus: (callback) => {
    ipcRenderer.on('service:status', (_, status) => callback(status));
  },
  onDoorEvent: (callback) => {
    ipcRenderer.on('door:event', (_, event) => callback(event));
  },
});

// electron/renderer/src/hooks/useBridgeService.ts
export function useBridgeService() {
  const [status, setStatus] = useState<ServiceStatus>();

  useEffect(() => {
    window.bridgeAPI.onServiceStatus(setStatus);
  }, []);

  const unlockDoor = async (doorId: string) => {
    return window.bridgeAPI.unlockDoor(doorId);
  };

  return { status, unlockDoor };
}
```

#### Installer Configuration

```yaml
# electron-builder.yml
appId: com.doordeck.unifi-bridge
productName: UniFi-Doordeck Bridge
copyright: Copyright © 2024

directories:
  output: dist
  buildResources: resources

win:
  target:
    - nsis
    - portable
  artifactName: ${productName}-Setup-${version}.${ext}
  icon: resources/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: UniFi-Doordeck Bridge
  runAfterFinish: true
  installerIcon: resources/installer-icon.ico
  uninstallerIcon: resources/uninstaller-icon.ico

publish:
  provider: github
  owner: your-org
  repo: unifi-doordeck-bridge
```

---

### Option 2: WPF (C# + .NET)

**Description:** Windows Presentation Foundation - Microsoft's native Windows UI framework.

#### Pros
✅ **True Native Windows**
- Native look and feel
- Excellent Windows integration
- Smaller memory footprint (~50-80MB)
- Faster startup time

✅ **XAML for UI**
- Declarative UI markup
- Powerful data binding
- Rich styling and theming

✅ **System Integration**
- Deep Windows OS integration
- Native system tray
- Windows services integration

✅ **Performance**
- Better performance for CPU-intensive tasks
- Lower memory usage
- Direct Windows API access

#### Cons
❌ **No Code Reuse**
- Complete rewrite from TypeScript to C#
- Duplicate business logic
- Duplicate API clients (UniFi, Doordeck)
- Maintain two codebases

❌ **Windows Only**
- No cross-platform support
- Locked to Windows ecosystem

❌ **Learning Curve**
- Requires C# expertise
- XAML learning curve
- Different ecosystem from current codebase

❌ **Development Velocity**
- Slower initial development
- Less mature UI component libraries
- More boilerplate code

❌ **Maintenance Burden**
- Two separate codebases to maintain
- Risk of feature drift between CLI and GUI
- Double testing effort

#### Technical Stack
```
- .NET 8.0
- WPF (Windows Presentation Foundation)
- MVVM pattern
- CommunityToolkit.Mvvm
- MaterialDesignInXAML (UI components)
- Hardcodet.NotifyIcon.Wpf (system tray)
```

---

### Option 3: Tauri (Rust + Web UI)

**Description:** Lightweight alternative to Electron using Rust backend and web frontend.

#### Pros
✅ **Smallest Bundle Size**
- Base app: ~5-10MB
- Uses OS-native WebView (no Chromium bundle)
- Very lightweight

✅ **Performance**
- Rust backend = excellent performance
- Low memory footprint (~30-50MB)
- Fast startup time

✅ **Security**
- Rust's memory safety
- Secure IPC by default

✅ **Cross-Platform**
- Windows, macOS, Linux support
- Native OS integrations

#### Cons
❌ **Requires Rust Rewrite**
- Complete backend rewrite from Node.js to Rust
- Lose all existing TypeScript business logic
- Different ecosystem and tooling

❌ **Smaller Ecosystem**
- Newer framework (less mature)
- Fewer libraries and plugins
- Smaller community

❌ **Development Velocity**
- Slower development (Rust learning curve)
- More complex build process
- Less tooling support

❌ **WebView Inconsistencies**
- Different WebView versions on different Windows versions
- Potential compatibility issues
- Limited browser features vs Chromium

❌ **No Code Reuse**
- Cannot reuse existing Node.js bridge service
- Must reimplement all API clients in Rust
- Double maintenance burden

#### Technical Stack
```
- Tauri: ^2.0.0
- Rust: 1.75+
- React (frontend)
- TypeScript (frontend only)
```

---

## Detailed Comparison Matrix

| Criteria | Electron | WPF | Tauri | Weight |
|----------|----------|-----|-------|--------|
| **Development Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | High |
| **Code Reuse** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | Critical |
| **Bundle Size** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| **Memory Usage** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium |
| **UI Capabilities** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High |
| **Ecosystem** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | High |
| **Cross-Platform** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | Medium |
| **Maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Critical |
| **Auto-Updates** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| **System Integration** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| **Team Expertise** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | High |

**Scoring:**
- Electron: 48/55 (87%)
- WPF: 32/55 (58%)
- Tauri: 33/55 (60%)

---

## Recommendation Rationale

### Why Electron is the Best Choice

#### 1. Code Reuse (Critical Factor)
Your existing TypeScript/Node.js codebase represents significant investment:
- UniFi API client
- Doordeck API client
- Business logic for door synchronization
- Error handling and validation
- Configuration management

**With Electron:** Reuse 70-80% of this code in the GUI
**With WPF/Tauri:** Rewrite 100% in C#/Rust

**Impact:** Saves 2-4 weeks of development time and eliminates duplicate maintenance.

#### 2. Development Velocity
Time-to-market is critical for a bridge service GUI:
- **Electron:** 4-6 weeks to MVP
- **WPF:** 8-10 weeks to MVP
- **Tauri:** 10-12 weeks to MVP

#### 3. Maintenance Burden
Single codebase benefits:
- Bug fixes apply to both CLI and GUI
- Feature additions benefit both
- Single test suite
- Unified documentation

#### 4. Team Expertise
If your team knows TypeScript/Node.js:
- No context switching
- Leverage existing knowledge
- Faster onboarding for new developers

#### 5. Future-Proofing
Electron provides flexibility:
- Easy to add macOS/Linux support later
- Web version possible (shared React components)
- Mobile companion app (shared API clients)

#### 6. User Experience
Modern UI capabilities:
- Matches Windows 11 design language
- Smooth animations and transitions
- Rich data visualization options
- Excellent accessibility support

### When to Consider Alternatives

**Choose WPF if:**
- Performance is absolutely critical (embedded systems)
- Bundle size must be minimal (distributed via slow networks)
- Team has strong C# expertise and no TypeScript knowledge
- Windows-only forever (no cross-platform plans)

**Choose Tauri if:**
- Rust expertise on team
- Bundle size is critical business requirement
- Building multiple cross-platform apps (amortize learning curve)

---

## Implementation Recommendations

### Phase 1: Project Setup (Week 1)
1. Initialize Electron + Vite + React + TypeScript project
2. Configure electron-builder for Windows
3. Set up project structure with shared/ directory
4. Configure ESLint, Prettier, TypeScript
5. Set up development hot-reload workflow

### Phase 2: Core Architecture (Week 1-2)
1. Implement IPC communication layer
2. Move bridge service to shared module
3. Set up system tray integration
4. Implement auto-start functionality
5. Configure electron-store for settings persistence

### Phase 3: Setup Wizard (Week 2-3)
1. Build wizard UI components
2. Implement UniFi configuration flow
3. Implement Doordeck OAuth flow
4. Add connectivity testing
5. Handle first-run vs existing config

### Phase 4: Main Application (Week 3-5)
1. Build dashboard view
2. Implement doors management view
3. Build logs and monitoring view
4. Create settings view
5. Add about/help view

### Phase 5: Polish & Testing (Week 5-6)
1. Implement dark/light themes
2. Add accessibility features
3. Write automated tests
4. Create installers
5. Set up auto-update mechanism

### Phase 6: Deployment (Week 6)
1. Create installation packages
2. Set up GitHub releases
3. Test auto-update flow
4. Create user documentation
5. Beta testing with target users

---

## Build & Distribution

### Installer Types

**NSIS Installer (Recommended):**
- Professional installation wizard
- Custom branding
- Installation directory selection
- Start menu shortcuts
- Auto-start configuration
- Uninstaller included

**Portable Executable:**
- Single .exe file
- No installation required
- Useful for testing or restricted environments

### Auto-Update Strategy

```typescript
// electron/main/auto-updater.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify({
  title: 'Update Available',
  body: 'A new version of UniFi-Doordeck Bridge is available.'
});

// Publish releases to GitHub
// electron-builder automatically handles update downloads
```

**Update Flow:**
1. App checks for updates on launch (optional)
2. Download update in background
3. Show notification when ready
4. Install on next app restart

---

## Security Considerations

### Context Isolation
```javascript
// electron/main/index.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,  // Disable Node in renderer
    contextIsolation: true,   // Enable context isolation
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### Secure IPC
```typescript
// Use invoke/handle pattern (secure)
ipcMain.handle('doors:unlock', async (event, doorId) => {
  // Validate input
  if (!isValidDoorId(doorId)) {
    throw new Error('Invalid door ID');
  }

  return bridgeService.unlockDoor(doorId);
});

// Avoid send/on pattern (less secure)
// Don't expose raw Node.js APIs to renderer
```

### Credentials Storage
```typescript
// Use electron-store with encryption
import Store from 'electron-store';

const store = new Store({
  encryptionKey: 'your-encryption-key',
  name: 'config',
});

store.set('unifi.apiKey', apiKey); // Encrypted automatically
```

---

## Performance Optimization

### Renderer Process Optimization
```typescript
// Code splitting
const Dashboard = lazy(() => import('./views/Dashboard'));
const DoorsView = lazy(() => import('./views/DoorsView'));

// Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={logs.length}
  itemSize={50}
>
  {LogRow}
</FixedSizeList>
```

### Main Process Optimization
```typescript
// Use worker threads for CPU-intensive tasks
import { Worker } from 'worker_threads';

// Don't block main process with heavy operations
const worker = new Worker('./log-processor.js');
worker.postMessage({ logs: rawLogs });
```

---

## Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript + JavaScript Language Features
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

### Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    }
  ]
}
```

---

## Cost-Benefit Analysis

### Electron
**Development Cost:** $15,000 - $25,000 (4-6 weeks)
**Maintenance Cost:** $5,000/year (shared with CLI)
**Total Year 1:** $20,000 - $30,000

### WPF
**Development Cost:** $30,000 - $45,000 (8-10 weeks, complete rewrite)
**Maintenance Cost:** $10,000/year (separate codebase)
**Total Year 1:** $40,000 - $55,000

### Tauri
**Development Cost:** $35,000 - $50,000 (10-12 weeks, Rust rewrite)
**Maintenance Cost:** $10,000/year (separate codebase)
**Total Year 1:** $45,000 - $60,000

**ROI:** Electron saves $20,000-30,000 in Year 1 alone.

---

## Final Recommendation

**Choose Electron** for the UniFi-Doordeck Bridge GUI application.

### Key Decision Factors:
1. ✅ Maximum code reuse with existing TypeScript/Node.js codebase
2. ✅ Fastest time-to-market (4-6 weeks vs 8-12 weeks)
3. ✅ Single codebase maintenance (lower long-term costs)
4. ✅ Excellent modern UI capabilities
5. ✅ Rich ecosystem and tooling
6. ✅ Team expertise alignment
7. ✅ Future cross-platform flexibility

### Acceptable Trade-offs:
- Larger bundle size (120-150MB) - acceptable for modern systems
- Higher memory usage (150-200MB) - acceptable for dedicated service
- Not "true native" - mitigated by modern Windows 11 styling

### Next Steps:
1. Review this recommendation with development team
2. Set up Electron project structure
3. Begin Phase 1 implementation (Project Setup)
4. Schedule design review after Week 2

This recommendation optimizes for **development velocity**, **code maintainability**, and **total cost of ownership** while delivering a professional, modern user experience.
