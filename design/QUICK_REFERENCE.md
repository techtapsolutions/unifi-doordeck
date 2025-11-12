# Quick Reference Guide

## Design Tokens Quick Reference

### Colors

```css
/* Dark Theme */
--bg-primary: #1E1E1E
--bg-secondary: #2D2D2D
--bg-tertiary: #3C3C3C

--text-primary: #FFFFFF
--text-secondary: #B4B4B4
--text-tertiary: #808080

--accent: #0078D4
--success: #4CAF50
--warning: #FFA726
--error: #F44336
--info: #2196F3

/* Light Theme */
--bg-primary: #FFFFFF
--bg-secondary: #F5F5F5
--bg-tertiary: #E8E8E8

--text-primary: #1E1E1E
--text-secondary: #616161
--text-tertiary: #9E9E9E
```

### Typography

```css
/* Sizes */
H1: 32px / 600 (Semibold)
H2: 24px / 600 (Semibold)
H3: 20px / 500 (Medium)
Body Large: 16px / 400 (Regular)
Body: 14px / 400 (Regular)
Small: 12px / 400 (Regular)
Caption: 11px / 400 (Regular)

/* Font Family */
font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
```

### Spacing

```css
XXS: 4px
XS:  8px
S:   12px
M:   16px
L:   24px
XL:  32px
XXL: 48px
```

### Border Radius

```css
sm: 2px
md: 4px   /* Default for most UI */
lg: 8px   /* Cards, panels */
xl: 12px  /* Large cards, modals */
```

### Shadows

```css
/* Dark Theme */
sm: 0 1px 2px rgba(0,0,0,0.3)
md: 0 4px 6px rgba(0,0,0,0.4)
lg: 0 10px 15px rgba(0,0,0,0.5)

/* Light Theme */
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.07)
lg: 0 10px 15px rgba(0,0,0,0.1)
```

---

## Component Props Quick Reference

### Button

```typescript
<Button
  variant="primary" | "secondary" | "destructive" | "ghost" | "link"
  size="small" | "medium" | "large"
  disabled={boolean}
  loading={boolean}
  icon={ReactNode}
  onClick={() => void}
>
  Label
</Button>
```

### Input

```typescript
<Input
  type="text" | "password" | "email" | "url" | "number"
  value={string}
  onChange={(value) => void}
  label="Field Label"
  error="Error message"
  helperText="Helper text"
  disabled={boolean}
  required={boolean}
/>
```

### Card

```typescript
<Card variant="default" | "elevated" | "interactive">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

### Modal

```typescript
<Modal
  isOpen={boolean}
  onClose={() => void}
  title="Modal Title"
  size="small" | "medium" | "large"
  footer={<>Buttons</>}
>
  Content
</Modal>
```

### StatusIndicator

```typescript
<StatusIndicator
  status="success" | "warning" | "error" | "info" | "unknown"
  label="Status text"
  showLabel={boolean}
  animated={boolean}
/>
```

---

## IPC API Quick Reference

### Service Control

```typescript
// Start service
await window.bridgeAPI.service.start();

// Stop service
await window.bridgeAPI.service.stop();

// Get status
const status = await window.bridgeAPI.service.getStatus();
// Returns: { running: boolean, uptime: number, ... }
```

### Doors

```typescript
// Get all doors
const doors = await window.bridgeAPI.doors.list();
// Returns: Door[]

// Unlock door
await window.bridgeAPI.doors.unlock(doorId);

// Sync doors from UniFi
await window.bridgeAPI.doors.sync();
```

### Logs

```typescript
// Get logs with filters
const logs = await window.bridgeAPI.logs.get({
  level: ['error', 'warning'],
  timeRange: 'last-hour',
  search: 'connection'
});

// Export logs
await window.bridgeAPI.logs.export('csv');
```

### Settings

```typescript
// Get settings
const settings = await window.bridgeAPI.settings.get();

// Update settings
await window.bridgeAPI.settings.update({
  theme: 'dark',
  autoRefresh: true
});

// Test connection
const result = await window.bridgeAPI.settings.test('unifi');
// Returns: { success: boolean, error?: string, ... }
```

### Event Listeners

```typescript
// Service status changes
window.bridgeAPI.on.serviceStatus((status) => {
  console.log('Service status:', status);
});

// Door events
window.bridgeAPI.on.doorEvent((event) => {
  console.log('Door event:', event);
});

// Log entries
window.bridgeAPI.on.logEntry((entry) => {
  console.log('New log:', entry);
});
```

---

## Common Patterns

### Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await window.bridgeAPI.someAction();
    showToast({ variant: 'success', title: 'Success!' });
  } catch (error) {
    showToast({ variant: 'error', title: 'Failed', message: error.message });
  } finally {
    setLoading(false);
  }
};

<Button loading={loading} onClick={handleAction}>
  Action
</Button>
```

### Form Validation

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (values: FormData) => {
  const newErrors: Record<string, string> = {};

  if (!values.url) {
    newErrors.url = 'URL is required';
  } else if (!isValidUrl(values.url)) {
    newErrors.url = 'Please enter a valid URL';
  }

  return newErrors;
};

const handleSubmit = () => {
  const validationErrors = validate(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  // Submit...
};

<Input
  value={formData.url}
  onChange={(value) => setFormData({ ...formData, url: value })}
  error={errors.url}
/>
```

### Modal Confirmation

```typescript
const [showConfirm, setShowConfirm] = useState(false);

const handleUnlock = () => {
  setShowConfirm(true);
};

const confirmUnlock = async () => {
  await window.bridgeAPI.doors.unlock(doorId);
  setShowConfirm(false);
};

<Button onClick={handleUnlock}>Unlock</Button>

<Modal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Door Unlock"
  footer={
    <>
      <Button variant="secondary" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={confirmUnlock}>
        Unlock Now
      </Button>
    </>
  }
>
  <p>You are about to unlock: <strong>{doorName}</strong></p>
</Modal>
```

### Toast Notifications

```typescript
import { useToast } from '@/hooks/useToast';

const { showToast } = useToast();

// Success
showToast({
  variant: 'success',
  title: 'Door Unlocked',
  message: 'Main Lobby unlocked successfully',
  duration: 5000
});

// Error
showToast({
  variant: 'error',
  title: 'Connection Failed',
  message: 'Unable to connect to UniFi Controller',
  duration: 0, // No auto-dismiss
  action: {
    label: 'Retry',
    onClick: retryConnection
  }
});

// Info
showToast({
  variant: 'info',
  title: 'Sync Started',
  message: 'Synchronizing doors from UniFi...'
});
```

### Auto-Refresh

```typescript
useEffect(() => {
  const fetchData = async () => {
    const data = await window.bridgeAPI.doors.list();
    setDoors(data);
  };

  // Initial fetch
  fetchData();

  // Auto-refresh every 30 seconds
  const interval = setInterval(fetchData, 30000);

  return () => clearInterval(interval);
}, []);
```

---

## Status Indicators

### Visual Representation

```
● Green  - Operational, Connected, Success
● Yellow - Warning, Degraded Performance
● Red    - Error, Disconnected, Failed
● Gray   - Unknown, Inactive, Disabled
● Blue   - Info, In Progress (animated pulse)
```

### Usage

```typescript
// Service status
<StatusIndicator status="success" label="Running" />

// Connection status
<StatusIndicator status="error" label="Disconnected" />

// In-progress operation
<StatusIndicator status="info" label="Syncing..." animated />
```

---

## Keyboard Shortcuts

### Global

```
Ctrl+D  - Dashboard
Ctrl+L  - Logs
Ctrl+S  - Settings
Ctrl+R  - Refresh/Reload
F5      - Refresh data
Escape  - Cancel/Close dialog
Enter   - Confirm primary action
```

### Navigation

```
Tab       - Next focusable element
Shift+Tab - Previous focusable element
Arrow Keys - Navigate lists/tabs
Space     - Activate checkbox/toggle
Enter     - Activate button/link
```

---

## Accessibility Checklist

```
□ All images have alt text or aria-hidden
□ All interactive elements keyboard accessible
□ Focus indicators visible
□ Form inputs have associated labels
□ Error messages announced to screen readers
□ Color contrast meets WCAG AA (4.5:1 for normal text)
□ Touch targets minimum 44x44px
□ Loading states announced
□ No keyboard traps
□ Logical tab order
```

---

## File Locations

```
Design Documentation:
/design/USER_FLOWS.md
/design/WIREFRAMES.md
/design/DESIGN_SYSTEM.md
/design/COMPONENT_BREAKDOWN.md
/design/TECH_STACK_RECOMMENDATION.md
/design/IMPLEMENTATION_PLAN.md

Implementation (Future):
/electron/main/            - Main process
/electron/preload/         - Preload scripts
/electron/renderer/src/    - React app
/shared/                   - Shared code (CLI + GUI)
```

---

## Testing Utilities

### Component Testing

```typescript
import { render, fireEvent, screen } from '@testing-library/react';

test('button calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText('Click me'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);

  expect(results).toHaveNoViolations();
});
```

---

## Common TypeScript Types

```typescript
// Door
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

// Log Entry
interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: Date;
  message: string;
  details?: Record<string, any>;
  source?: string;
}

// Service Status
interface ServiceStatus {
  running: boolean;
  uptime: number;
  startedAt?: Date;
}

// Connection Status
interface ConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  error?: string;
  latency?: number;
}
```

---

## Build Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build for production
npm run package          # Package into executable
npm run dist             # Create installer

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

---

## Environment Variables

```bash
# Development
NODE_ENV=development
VITE_API_URL=http://localhost:3000

# Production
NODE_ENV=production
CONFIG_ENCRYPTION_KEY=your-encryption-key
```

---

## Debugging Tips

### Main Process Debugging

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Electron: Main",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": [".", "--remote-debugging-port=9223"]
}
```

### Renderer Process Debugging

Open DevTools in Electron window:
```typescript
// In development
mainWindow.webContents.openDevTools();
```

Or press: `Ctrl+Shift+I`

### IPC Debugging

```typescript
// Log all IPC calls
ipcMain.handle('*', (event, ...args) => {
  console.log('IPC call:', event.channel, args);
});
```

---

## Performance Monitoring

```typescript
// Measure render time
import { Profiler } from 'react';

<Profiler
  id="ComponentName"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} took ${actualDuration}ms`);
  }}
>
  <Component />
</Profiler>
```

```typescript
// Monitor memory usage
if (process.type === 'renderer') {
  setInterval(() => {
    console.log('Memory:', performance.memory);
  }, 10000);
}
```

---

## Common Issues & Solutions

### Issue: IPC not working
**Solution:** Check preload script is loaded and contextIsolation is enabled

### Issue: Styles not applying
**Solution:** Ensure Tailwind CSS processed, check theme class on html element

### Issue: Component not re-rendering
**Solution:** Verify state updates are creating new objects, not mutating

### Issue: Memory leak
**Solution:** Clean up event listeners, intervals, subscriptions in useEffect cleanup

### Issue: Build fails
**Solution:** Clear node_modules and dist, reinstall dependencies, check TypeScript errors

---

**Quick Reference Version:** 1.0
**Last Updated:** January 2025
**For:** UniFi-Doordeck Bridge GUI Development Team
