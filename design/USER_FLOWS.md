# UniFi-Doordeck Bridge - User Flows

## Primary User Flows

### Flow 1: First-Time Setup (Critical Path)
```
Start Application (First Launch)
    ↓
Welcome Screen
    ├─ "Get Started" button
    ↓
UniFi Configuration Screen
    ├─ Enter UniFi Controller URL
    ├─ Enter Username/Password OR API Key
    ├─ "Test Connection" button
    │   ├─ Success: Enable "Next" button
    │   └─ Failure: Show error message, allow retry
    ↓
Doordeck Authentication Screen
    ├─ "Login with Doordeck" button (OAuth flow)
    │   └─ Opens browser for authentication
    ├─ Wait for authentication callback
    │   ├─ Success: Show authenticated user info
    │   └─ Failure: Show error message, allow retry
    ↓
Connectivity Test Screen
    ├─ Automatic tests running:
    │   ├─ UniFi API connectivity
    │   ├─ Doordeck API connectivity
    │   ├─ Door discovery
    │   └─ Bridge service health
    ├─ Progress indicators for each test
    ↓
Setup Complete Screen
    ├─ Summary of configuration
    ├─ "Launch Dashboard" button
    ↓
Main Dashboard
```

### Flow 2: Daily Monitoring (Most Frequent)
```
Launch Application (Subsequent launches)
    ↓
Main Dashboard
    ├─ View service status at a glance
    ├─ View connection indicators
    ├─ View door count and recent activity
    │
    ├─ Quick Actions:
    │   ├─ Manual door unlock (emergency)
    │   ├─ Restart service
    │   └─ View recent logs
    │
    └─ Navigation to other sections
```

### Flow 3: Manual Door Unlock (Emergency Use)
```
Dashboard OR Doors Screen
    ↓
Select specific door
    ↓
Click "Unlock" button
    ↓
Confirmation Dialog
    ├─ "This will unlock [Door Name] immediately"
    ├─ "Cancel" button
    ├─ "Unlock Now" button (primary, destructive style)
    ↓
Unlock command sent
    ↓
Status feedback
    ├─ Success: Toast notification "Door unlocked successfully"
    ├─ Failure: Error dialog with retry option
    └─ Log entry created
```

### Flow 4: Troubleshooting (IT Administrator)
```
Dashboard (notices connection issue)
    ↓
Click on error indicator
    ↓
Logs & Monitoring Screen
    ├─ View filtered logs for errors
    ├─ Review connection status details
    ├─ Check event history
    │
    ├─ Actions:
    │   ├─ Export logs for support
    │   ├─ Test connection manually
    │   └─ Navigate to Settings for reconfiguration
    ↓
Settings Screen (if needed)
    ├─ Update configuration
    ├─ Test new settings
    └─ Save changes → Returns to Dashboard
```

### Flow 5: Configuration Update
```
Dashboard
    ↓
Settings (Navigation)
    ↓
Settings Screen
    ├─ UniFi Settings Tab
    │   ├─ Modify URL/credentials
    │   └─ "Test Connection" button
    │
    ├─ Doordeck Settings Tab
    │   ├─ View current account
    │   └─ "Re-authenticate" button
    │
    ├─ Advanced Settings Tab
    │   ├─ Sync interval
    │   ├─ Logging level
    │   ├─ Auto-start options
    │   └─ Theme selection
    │
    └─ Actions:
        ├─ "Save Changes" button
        ├─ "Cancel" button (revert)
        └─ "Reset to Defaults" button
    ↓
Save confirmation
    ├─ "Settings saved successfully"
    └─ Return to Dashboard
```

### Flow 6: System Tray Interactions
```
Application running in background
    ↓
System Tray Icon (Status Indicator)
    ├─ Green: All systems operational
    ├─ Yellow: Warning/degraded
    └─ Red: Critical error
    ↓
Right-click tray icon
    ↓
Context Menu
    ├─ "Show Dashboard" (restores window)
    ├─ "Service Status: Running" (toggle to Start/Stop)
    ├─ "Recent Activity" submenu
    │   └─ Last 5 door events
    └─ "Exit" (closes application)
    ↓
Notification on events
    ├─ Connection lost
    ├─ Connection restored
    └─ Critical errors
```

## User Journey Map

### First-Time User (Building Manager - Non-Technical)

**Phase 1: Discovery & Installation**
- Downloads application from website
- Installs via standard Windows installer
- Launches application

**Phase 2: Initial Setup (10-15 minutes)**
- Welcomed by setup wizard
- Emotion: Cautious but hopeful
- Needs: Clear instructions, no technical jargon
- Pain Point: May not have UniFi credentials readily available
- Solution: Provide help text and links to documentation

**Phase 3: Daily Use (2-3 minutes/day)**
- Quick check of dashboard in morning
- Emotion: Confident, reassured
- Needs: Quick status visibility
- Success: Green indicators, no actions needed

**Phase 4: Emergency Unlock (Rare, high-stress)**
- Needs to unlock door immediately
- Emotion: Stressed, urgent
- Needs: Clear, fast path to door unlock
- Pain Point: Too many confirmation steps
- Solution: Single confirmation, large target buttons

**Phase 5: Troubleshooting (Occasional)**
- Notices error indicator
- Emotion: Concerned, possibly frustrated
- Needs: Clear error messages, suggested actions
- Pain Point: Technical error codes without context
- Solution: Plain language errors with resolution steps

## Accessibility Considerations

### Keyboard Navigation Flow
```
Tab Order Priority:
1. Primary action buttons (Next, Save, Unlock)
2. Form inputs (top to bottom)
3. Secondary actions (Cancel, Back)
4. Navigation menu items
5. Quick action buttons

Keyboard Shortcuts:
- Ctrl+D: Dashboard
- Ctrl+L: Logs
- Ctrl+S: Settings
- Ctrl+R: Refresh/Reload
- F5: Refresh data
- Escape: Cancel/Close dialog
- Enter: Confirm primary action
```

### Screen Reader Announcements
- Service status changes: "Bridge service connected successfully"
- Error states: "Error: Unable to connect to UniFi Controller. Check your network connection and credentials."
- Loading states: "Testing connection, please wait"
- Success confirmations: "Door Lobby unlocked successfully"

## Error Handling & Edge Cases

### Connection Failures
1. **UniFi Controller Unreachable**
   - Show clear error on dashboard
   - Provide "Test Connection" quick action
   - Suggest common solutions (network, credentials, firewall)

2. **Doordeck API Issues**
   - Distinguish between authentication and API errors
   - Provide re-authentication flow if token expired
   - Show retry mechanism with exponential backoff status

3. **No Doors Discovered**
   - Show empty state with helpful message
   - Provide troubleshooting steps
   - Link to documentation

### Data Loading States
- Show skeleton screens during initial load
- Use spinners for short operations (<2 seconds)
- Show progress bars for longer operations (>2 seconds)
- Provide cancel option for user-initiated long operations

## Success Metrics

### Usability Goals
- First-time setup completion rate: >90%
- Time to complete setup: <15 minutes (average user)
- Dashboard comprehension: User can identify service status within 3 seconds
- Manual unlock success rate: >95%
- Error resolution without support: >70%

### Accessibility Goals
- WCAG 2.1 AA compliance: 100%
- Keyboard-only navigation: All features accessible
- Screen reader compatibility: NVDA, JAWS tested
- High contrast mode: Full support
