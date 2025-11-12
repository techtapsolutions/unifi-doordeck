# UniFi-Doordeck Bridge - Component Breakdown

## Component Architecture

### Component Hierarchy

```
App
├── SetupWizard (first-run only)
│   ├── WelcomeScreen
│   ├── UniFiConfigScreen
│   │   ├── ConnectionForm
│   │   └── ConnectionTest
│   ├── DoordeckAuthScreen
│   │   └── OAuthFlow
│   ├── ConnectivityTestScreen
│   │   ├── TestRunner
│   │   └── DeviceList
│   └── SetupCompleteScreen
│
└── MainApp
    ├── AppShell
    │   ├── TitleBar
    │   ├── Sidebar
    │   │   └── NavigationItem[]
    │   ├── MainContent
    │   │   └── [Route-based views]
    │   └── StatusBar
    │
    ├── Views
    │   ├── Dashboard
    │   │   ├── ServiceStatusCard
    │   │   ├── ConnectionsCard
    │   │   ├── DoorsOverviewCard
    │   │   │   └── ActivityList
    │   │   └── QuickActionsCard
    │   │
    │   ├── DoorsView
    │   │   ├── DoorsToolbar
    │   │   │   ├── SearchInput
    │   │   │   ├── FilterDropdown
    │   │   │   └── RefreshButton
    │   │   └── DoorsList
    │   │       └── DoorCard[]
    │   │           ├── DoorInfo
    │   │           ├── StatusIndicator
    │   │           └── DoorActions
    │   │
    │   ├── LogsView
    │   │   ├── LogsToolbar
    │   │   │   ├── FilterControls
    │   │   │   ├── SearchInput
    │   │   │   ├── AutoRefreshToggle
    │   │   │   └── ExportButton
    │   │   ├── LogTable
    │   │   │   └── LogEntry[]
    │   │   └── StatisticsPanel
    │   │
    │   ├── SettingsView
    │   │   ├── SettingsTabs
    │   │   ├── UniFiSettingsTab
    │   │   │   └── UniFiForm
    │   │   ├── DoordeckSettingsTab
    │   │   │   └── DoordeckAccountInfo
    │   │   ├── SyncSettingsTab
    │   │   ├── AppearanceSettingsTab
    │   │   │   ├── ThemeSelector
    │   │   │   └── NotificationSettings
    │   │   └── AdvancedSettingsTab
    │   │
    │   └── AboutView
    │       ├── VersionInfo
    │       ├── LicenseInfo
    │       └── SupportLinks
    │
    ├── Shared UI Components
    │   ├── Button
    │   ├── Input
    │   ├── Card
    │   ├── Modal
    │   ├── Toast
    │   ├── StatusIndicator
    │   ├── LoadingSpinner
    │   ├── Skeleton
    │   ├── Checkbox
    │   ├── Radio
    │   ├── Toggle
    │   ├── Dropdown
    │   ├── Tabs
    │   ├── Tooltip
    │   └── EmptyState
    │
    └── SystemTray
        ├── TrayIcon (OS-specific)
        ├── TrayMenu
        └── TrayNotifications
```

---

## Detailed Component Specifications

### 1. Core Layout Components

#### AppShell

**Purpose:** Main application container that holds the sidebar, content area, and status bar.

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}
```

**State:**
- `sidebarCollapsed: boolean` - Whether sidebar is collapsed to icon-only view
- `currentRoute: string` - Active navigation route
- `userInfo: UserInfo` - Current authenticated user details

**Responsibilities:**
- Provide consistent layout across all views
- Handle sidebar collapse/expand
- Manage global keyboard shortcuts
- Provide theme context to all children

---

#### Sidebar

**Purpose:** Navigation menu for switching between main application views.

**Props:**
```typescript
interface SidebarProps {
  collapsed?: boolean;
  activeRoute: string;
  onNavigate: (route: string) => void;
  userInfo?: UserInfo;
}
```

**Navigation Items:**
```typescript
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', route: '/' },
  { id: 'doors', label: 'Doors', icon: 'door', route: '/doors' },
  { id: 'logs', label: 'Logs & Monitoring', icon: 'document_text', route: '/logs' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  { id: 'about', label: 'About', icon: 'info', route: '/about' },
];
```

**Interactions:**
- Click to navigate
- Keyboard navigation (Arrow keys, Enter)
- Show tooltips when collapsed
- Highlight active route

---

#### StatusBar

**Purpose:** Display real-time status information at bottom of app.

**Props:**
```typescript
interface StatusBarProps {
  lastSyncTime?: Date;
  eventsToday: number;
  version: string;
  connectionStatus: 'connected' | 'disconnected' | 'degraded';
}
```

**Display:**
- Last sync time (relative: "30 seconds ago")
- Event count for current day
- Application version
- Connection status indicator

---

### 2. Dashboard Components

#### ServiceStatusCard

**Purpose:** Display bridge service status and uptime.

**Props:**
```typescript
interface ServiceStatusCardProps {
  status: 'running' | 'stopped' | 'error';
  startedAt?: Date;
  onRestart: () => void;
}
```

**Displays:**
- Status indicator (green/red/yellow dot + text)
- Uptime duration
- Restart service button
- Service health metrics

---

#### ConnectionsCard

**Purpose:** Show UniFi and Doordeck connection status.

**Props:**
```typescript
interface ConnectionsCardProps {
  unifiStatus: ConnectionStatus;
  doordeckStatus: ConnectionStatus;
  onTestConnection: (service: 'unifi' | 'doordeck') => void;
}

interface ConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  error?: string;
  latency?: number;
}
```

**Displays:**
- Two status rows (UniFi, Doordeck)
- Connection indicators
- Last checked time
- Error messages if disconnected
- Test connection buttons

---

#### DoorsOverviewCard

**Purpose:** Summary of all doors and recent activity.

**Props:**
```typescript
interface DoorsOverviewCardProps {
  totalDoors: number;
  connectedDoors: number;
  recentActivity: DoorEvent[];
  onViewAllDoors: () => void;
  onViewAllActivity: () => void;
}

interface DoorEvent {
  id: string;
  doorName: string;
  event: 'unlocked' | 'locked' | 'failed';
  timestamp: Date;
  userName?: string;
}
```

**Features:**
- Door count summary
- Scrollable activity list (last 5 events)
- Event icons and status colors
- Links to full doors and logs views

---

#### QuickActionsCard

**Purpose:** Provide shortcuts to common actions.

**Props:**
```typescript
interface QuickActionsCardProps {
  onManualUnlock: () => void;
  onSyncDoors: () => void;
  onExportLogs: () => void;
}
```

**Actions:**
- Manual door unlock (opens door selector)
- Force sync doors from UniFi
- Export logs to file

---

### 3. Doors View Components

#### DoorCard

**Purpose:** Display individual door information and controls.

**Props:**
```typescript
interface DoorCardProps {
  door: Door;
  onUnlock: (doorId: string) => void;
  onViewHistory: (doorId: string) => void;
  onSettings: (doorId: string) => void;
}

interface Door {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'unknown';
  lastActivity?: Date;
  unifiDevice: {
    model: string;
    mac: string;
  };
  doordeckLock: string;
  eventsToday: number;
  error?: string;
}
```

**Layout:**
```
┌─ Door Name ────────────────────────────┐
│                                         │
│ Status: ● Connected   Last: 2 min ago  │
│                                         │
│ UniFi Device: UA-Pro-01 (MAC: ...)     │
│ Doordeck Lock: lobby-main-entrance     │
│                                         │
│ Recent Events: 47 unlocks today        │
│                                         │
│ [Unlock] [View History] [Settings]     │
│                                         │
└─────────────────────────────────────────┘
```

**States:**
- Connected (green indicator)
- Disconnected (red indicator, show error)
- Unlocking (loading state, disable button)

---

#### DoorsToolbar

**Purpose:** Search, filter, and refresh doors list.

**Props:**
```typescript
interface DoorsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterOption: 'all' | 'connected' | 'disconnected' | 'active';
  onFilterChange: (option: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}
```

**Features:**
- Search input with debounce (300ms)
- Filter dropdown
- Refresh button with loading state
- Results count display

---

### 4. Logs View Components

#### LogTable

**Purpose:** Display filterable, searchable log entries.

**Props:**
```typescript
interface LogTableProps {
  logs: LogEntry[];
  loading: boolean;
  onLoadMore?: () => void;
  autoRefresh: boolean;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: Date;
  message: string;
  details?: Record<string, any>;
  source?: string;
}
```

**Features:**
- Virtual scrolling for performance (react-window)
- Color-coded log levels
- Expandable entries for details
- Auto-scroll to bottom (when enabled)
- Infinite scroll for historical logs

**Log Level Colors:**
- Info: Blue
- Warning: Yellow
- Error: Red
- Debug: Gray

---

#### LogsToolbar

**Purpose:** Filter and search log entries.

**Props:**
```typescript
interface LogsToolbarProps {
  levelFilter: LogLevel[];
  timeRangeFilter: TimeRange;
  sourceFilter?: string;
  searchQuery: string;
  autoRefresh: boolean;
  onLevelFilterChange: (levels: LogLevel[]) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onSearchChange: (query: string) => void;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onExport: () => void;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type TimeRange = 'last-hour' | 'last-day' | 'last-week' | 'custom';
```

**Controls:**
- Multi-select level filter
- Time range dropdown
- Source filter (Bridge, UniFi, Doordeck)
- Search input
- Auto-refresh toggle (with interval indicator)
- Export button (CSV, JSON, TXT)

---

### 5. Settings View Components

#### SettingsTabs

**Purpose:** Organize settings into logical groups.

**Tabs:**
1. UniFi - Controller connection settings
2. Doordeck - Authentication and account
3. Sync - Synchronization intervals and behavior
4. Appearance - Theme and UI preferences
5. Advanced - Logging, service, and data management

**Pattern:**
```typescript
interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasUnsavedChanges: boolean;
}
```

---

#### UniFiForm

**Purpose:** Configure UniFi Controller connection.

**Props:**
```typescript
interface UniFiFormProps {
  config: UniFiConfig;
  onChange: (config: UniFiConfig) => void;
  onTest: () => Promise<TestResult>;
  onSave: () => Promise<void>;
}

interface UniFiConfig {
  url: string;
  authMethod: 'password' | 'apikey';
  username?: string;
  password?: string;
  apiKey?: string;
  verifySSL: boolean;
}

interface TestResult {
  success: boolean;
  error?: string;
  latency?: number;
  controllerVersion?: string;
}
```

**Validation:**
- URL format validation
- Required fields based on auth method
- Test connection before save
- Show connection status

---

#### ThemeSelector

**Purpose:** Choose application theme.

**Props:**
```typescript
interface ThemeSelectorProps {
  currentTheme: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}
```

**Features:**
- Radio buttons for theme selection
- Preview card showing current theme
- Instant preview on change
- Persists to local storage

---

### 6. Setup Wizard Components

#### WizardProgress

**Purpose:** Show setup progress across steps.

**Props:**
```typescript
interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
}

interface WizardStep {
  id: string;
  label: string;
  completed: boolean;
}
```

**Display:**
```
● UniFi Setup    ○ Doordeck Login    ○ Test    ○ Done
  (current)        (pending)         (pending)  (pending)

✓ UniFi Setup    ● Doordeck Login    ○ Test    ○ Done
  (completed)      (current)         (pending)  (pending)
```

---

#### ConnectionTest

**Purpose:** Test UniFi connection with real-time feedback.

**Props:**
```typescript
interface ConnectionTestProps {
  config: UniFiConfig;
  onTestComplete: (result: TestResult) => void;
}
```

**States:**
1. Idle - Show "Test Connection" button
2. Testing - Show spinner, "Testing connection..."
3. Success - Show checkmark, connection details
4. Error - Show error icon, error message, retry button

---

#### OAuthFlow

**Purpose:** Handle Doordeck OAuth authentication.

**Props:**
```typescript
interface OAuthFlowProps {
  onAuthComplete: (token: AuthToken) => void;
  onAuthError: (error: Error) => void;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userInfo: {
    email: string;
    name: string;
    organization: string;
  };
}
```

**Flow:**
1. Show "Login with Doordeck" button
2. Open browser for OAuth
3. Listen for callback
4. Display success with user info
5. Handle errors gracefully

---

### 7. Shared UI Components

#### Button

**Full Specification:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  children: React.ReactNode;
}
```

**Usage Examples:**
```tsx
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

<Button variant="destructive" icon={<LockOpen />} loading={isUnlocking}>
  Unlock Door
</Button>

<Button variant="ghost" size="small" iconPosition="left">
  <RefreshIcon /> Refresh
</Button>
```

---

#### Input

**Full Specification:**
```typescript
interface InputProps {
  type?: 'text' | 'password' | 'email' | 'url' | 'number' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onIconClick?: () => void;
  showPasswordToggle?: boolean; // for password type
}
```

**Features:**
- Floating label pattern
- Error state with message
- Helper text below input
- Character counter for maxLength
- Password visibility toggle
- Icon support (search, clear, etc.)

---

#### Modal

**Full Specification:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

**Features:**
- Focus trap
- Body scroll lock
- Escape key handling
- Overlay click handling
- Return focus to trigger element
- Stacking support (z-index management)

**Usage Example:**
```tsx
<Modal
  isOpen={showUnlockConfirm}
  onClose={() => setShowUnlockConfirm(false)}
  title="Confirm Door Unlock"
  size="medium"
  footer={
    <>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button variant="destructive" onClick={onConfirm}>Unlock Now</Button>
    </>
  }
>
  <p>You are about to unlock: <strong>{doorName}</strong></p>
  <p>This action will be logged.</p>
</Modal>
```

---

#### Toast

**Full Specification:**
```typescript
interface ToastProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

// Toast Manager Context
interface ToastContextValue {
  showToast: (props: ToastProps) => void;
  dismissToast: (id: string) => void;
}
```

**Usage:**
```tsx
const { showToast } = useToast();

showToast({
  variant: 'success',
  title: 'Door Unlocked',
  message: 'Main Lobby unlocked successfully',
  duration: 5000,
});

showToast({
  variant: 'error',
  title: 'Connection Failed',
  message: 'Unable to connect to UniFi Controller',
  duration: 0, // Manual dismiss
  action: {
    label: 'Retry',
    onClick: retryConnection,
  },
});
```

---

#### StatusIndicator

**Full Specification:**
```typescript
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'unknown';
  label?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean; // pulse animation
  tooltip?: string;
}
```

**Variants:**
```tsx
{/* Dot only */}
<StatusIndicator status="success" />

{/* With inline label */}
<StatusIndicator status="success" label="Connected" showLabel />

{/* Animated for in-progress */}
<StatusIndicator status="info" label="Syncing..." animated />

{/* With tooltip */}
<StatusIndicator
  status="error"
  tooltip="Connection failed: Timeout after 10s"
/>
```

---

#### EmptyState

**Purpose:** Show when no data is available.

**Props:**
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={<DoorIcon />}
  title="No Doors Found"
  description="No UniFi Access doors were discovered. Check your UniFi Controller configuration."
  action={{
    label: 'Refresh Doors',
    onClick: handleRefresh,
  }}
/>
```

---

### 8. System Tray Components

#### TrayIcon (Platform-Specific)

**Purpose:** Display status in system tray.

**Props:**
```typescript
interface TrayIconProps {
  status: 'operational' | 'warning' | 'error' | 'stopped';
  onShowApp: () => void;
  onExit: () => void;
}
```

**Icon States:**
- Operational: Green icon
- Warning: Yellow icon
- Error: Red icon
- Stopped: Gray icon

**Implementation:**
- Electron: `Tray` module
- WPF: `NotifyIcon` component
- Tauri: System tray API

---

#### TrayMenu

**Purpose:** Context menu for tray icon.

**Props:**
```typescript
interface TrayMenuProps {
  serviceStatus: ServiceStatus;
  recentActivity: DoorEvent[];
  onShowDashboard: () => void;
  onToggleService: () => void;
  onRestartService: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}
```

**Menu Structure:**
```
● Bridge Running - All Systems OK
─────────────────────────────────
Show Dashboard               Ctrl+D
─────────────────────────────────
Recent Activity                   ▶
─────────────────────────────────
Stop Bridge Service
Restart Bridge Service
─────────────────────────────────
Settings
About
─────────────────────────────────
Exit
```

---

## State Management Architecture

### Global State (Context/Redux)

```typescript
interface AppState {
  // Authentication
  auth: {
    unifi: UniFiAuth;
    doordeck: DoordeckAuth;
  };

  // Service Status
  service: {
    running: boolean;
    uptime: number;
    lastSync: Date;
  };

  // Connections
  connections: {
    unifi: ConnectionStatus;
    doordeck: ConnectionStatus;
  };

  // Doors
  doors: {
    list: Door[];
    loading: boolean;
    error?: string;
  };

  // Logs
  logs: {
    entries: LogEntry[];
    filters: LogFilters;
    autoRefresh: boolean;
  };

  // Settings
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationSettings;
    advanced: AdvancedSettings;
  };

  // UI State
  ui: {
    sidebarCollapsed: boolean;
    activeRoute: string;
  };
}
```

### Actions

```typescript
// Service Actions
serviceActions = {
  startService: () => void;
  stopService: () => void;
  restartService: () => void;
};

// Door Actions
doorActions = {
  fetchDoors: () => Promise<Door[]>;
  unlockDoor: (doorId: string, reason?: string) => Promise<void>;
  syncDoors: () => Promise<void>;
};

// Log Actions
logActions = {
  fetchLogs: (filters: LogFilters) => Promise<LogEntry[]>;
  exportLogs: (format: 'csv' | 'json' | 'txt') => Promise<void>;
  clearLogs: () => Promise<void>;
};

// Settings Actions
settingsActions = {
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  testConnection: (service: 'unifi' | 'doordeck') => Promise<TestResult>;
};
```

---

## Data Flow Patterns

### 1. Initial Load
```
App Start
  ↓
Check if first run
  ↓ (yes)
Show Setup Wizard
  ↓ (completed)
Save config → Start service
  ↓ (no, already configured)
Load saved config
  ↓
Start bridge service
  ↓
Establish connections (UniFi, Doordeck)
  ↓
Fetch initial door list
  ↓
Show Dashboard
```

### 2. Door Unlock Flow
```
User clicks "Unlock" on door card
  ↓
Show confirmation modal
  ↓
User confirms
  ↓
Send unlock command to bridge service
  ↓ (success)
Update door status
Show success toast
Create log entry
  ↓ (error)
Show error modal with details
Create error log entry
```

### 3. Connection Monitoring
```
Bridge service running
  ↓
Periodic health checks (every 30s)
  ↓
Test UniFi connection
Test Doordeck connection
  ↓
Update connection status in state
  ↓ (status changed)
Update UI indicators
Show notification (if disconnected)
Update system tray icon
```

### 4. Log Streaming
```
Bridge service generates logs
  ↓
Send to main process (IPC)
  ↓
Append to in-memory log buffer
  ↓ (if logs view open && auto-refresh)
Update logs list
Scroll to bottom (if at bottom)
  ↓
Persist to log file (rotating)
```

---

## Error Handling Patterns

### User-Facing Errors

**Network Errors:**
```typescript
{
  title: "Connection Failed",
  message: "Unable to connect to UniFi Controller",
  details: "Connection timeout after 10 seconds",
  suggestions: [
    "Check network connectivity",
    "Verify UniFi Controller is running",
    "Check firewall settings"
  ],
  actions: [
    { label: "Retry", action: retryConnection },
    { label: "Settings", action: openSettings }
  ]
}
```

**Authentication Errors:**
```typescript
{
  title: "Authentication Failed",
  message: "Invalid API key or credentials",
  details: "HTTP 401 Unauthorized",
  suggestions: [
    "Verify your API key is correct",
    "Check if your account has proper permissions",
    "Try re-authenticating"
  ],
  actions: [
    { label: "Update Credentials", action: openSettings }
  ]
}
```

**Door Operation Errors:**
```typescript
{
  title: "Door Unlock Failed",
  message: "Unable to unlock Emergency Exit",
  details: "Device not responding",
  suggestions: [
    "Check if the door controller is online",
    "Verify network connectivity",
    "Check door controller power"
  ],
  actions: [
    { label: "Retry", action: retryUnlock },
    { label: "View Logs", action: openLogs }
  ]
}
```

---

## Performance Optimizations

### Virtualization
- Use `react-window` for logs list (>100 entries)
- Use `react-window` for doors list (>50 doors)
- Lazy load door details on expand

### Debouncing
- Search inputs: 300ms debounce
- Filter changes: Immediate
- Window resize: 150ms debounce

### Memoization
```typescript
// Memoize expensive computations
const filteredDoors = useMemo(() => {
  return doors.filter(door =>
    door.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(door =>
    filterOption === 'all' || door.status === filterOption
  );
}, [doors, searchQuery, filterOption]);

// Memoize callbacks
const handleUnlock = useCallback((doorId: string) => {
  dispatch(unlockDoor(doorId));
}, [dispatch]);
```

### Code Splitting
```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./views/Dashboard'));
const DoorsView = lazy(() => import('./views/DoorsView'));
const LogsView = lazy(() => import('./views/LogsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
```

---

## Testing Strategy

### Unit Tests
- All shared components (Button, Input, Modal, etc.)
- Utility functions
- State reducers
- API service functions

### Integration Tests
- Wizard flow (all steps)
- Settings save and validation
- Door unlock flow
- Log filtering and search

### E2E Tests
- Complete setup wizard
- Dashboard → Unlock door → Verify log entry
- Connection failure handling
- Theme switching

### Accessibility Tests
- Keyboard navigation through all screens
- Screen reader announcements
- Focus management in modals
- Color contrast validation

This component breakdown provides a comprehensive blueprint for implementing the UniFi-Doordeck Bridge GUI application.
