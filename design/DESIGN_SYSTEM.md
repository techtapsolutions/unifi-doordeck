# UniFi-Doordeck Bridge - Design System

## Design Principles

1. **Clarity First**: Users should understand system status at a glance
2. **Accessibility by Default**: WCAG 2.1 AA compliance is non-negotiable
3. **Professional & Trustworthy**: Enterprise-grade visual quality
4. **Windows Native Feel**: Respects Windows 11/10 design patterns
5. **Feedback Rich**: Clear feedback for every action and state
6. **Keyboard Power User Friendly**: Full keyboard navigation support

---

## Design Tokens

### Color System

#### Semantic Colors (Dark Theme)

```javascript
const darkTheme = {
  // Backgrounds
  background: {
    primary: '#1E1E1E',      // Main app background
    secondary: '#2D2D2D',    // Cards, panels
    tertiary: '#3C3C3C',     // Input fields, hover states
    overlay: 'rgba(0,0,0,0.6)', // Modal overlays
  },

  // Borders
  border: {
    default: '#484848',
    subtle: '#363636',
    focus: '#0078D4',
  },

  // Text
  text: {
    primary: '#FFFFFF',      // Main headings, important text
    secondary: '#B4B4B4',    // Body text, labels
    tertiary: '#808080',     // Captions, disabled text
    inverse: '#1E1E1E',      // Text on light backgrounds
  },

  // Status Colors
  status: {
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      background: 'rgba(76,175,80,0.1)',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
      background: 'rgba(255,167,38,0.1)',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
      background: 'rgba(244,67,54,0.1)',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      background: 'rgba(33,150,243,0.1)',
    },
  },

  // Accent/Brand
  primary: {
    main: '#0078D4',         // Windows blue
    light: '#2B88D8',
    dark: '#005A9E',
    background: 'rgba(0,120,212,0.1)',
  },

  // Interactive States
  interactive: {
    default: '#3C3C3C',
    hover: '#484848',
    active: '#545454',
    disabled: 'rgba(255,255,255,0.3)',
  },
};
```

#### Semantic Colors (Light Theme)

```javascript
const lightTheme = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#E8E8E8',
    overlay: 'rgba(0,0,0,0.4)',
  },

  // Borders
  border: {
    default: '#D0D0D0',
    subtle: '#E0E0E0',
    focus: '#0078D4',
  },

  // Text
  text: {
    primary: '#1E1E1E',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
  },

  // Status Colors
  status: {
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      background: 'rgba(76,175,80,0.08)',
    },
    warning: {
      main: '#FB8C00',
      light: '#FFA726',
      dark: '#E65100',
      background: 'rgba(251,140,0,0.08)',
    },
    error: {
      main: '#E53935',
      light: '#EF5350',
      dark: '#C62828',
      background: 'rgba(229,57,53,0.08)',
    },
    info: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#0D47A1',
      background: 'rgba(25,118,210,0.08)',
    },
  },

  // Accent/Brand
  primary: {
    main: '#0078D4',
    light: '#2B88D8',
    dark: '#005A9E',
    background: 'rgba(0,120,212,0.08)',
  },

  // Interactive States
  interactive: {
    default: '#F5F5F5',
    hover: '#E8E8E8',
    active: '#D0D0D0',
    disabled: 'rgba(0,0,0,0.3)',
  },
};
```

### Typography

```javascript
const typography = {
  // Font Families
  fontFamily: {
    primary: "'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    monospace: "'Cascadia Mono', 'Consolas', 'Courier New', monospace",
  },

  // Font Sizes
  fontSize: {
    h1: '32px',      // Page titles
    h2: '24px',      // Section headers
    h3: '20px',      // Card titles, subsections
    h4: '18px',      // Small headers
    bodyLarge: '16px',   // Emphasized body text
    body: '14px',        // Default body text
    bodySmall: '12px',   // Supporting text
    caption: '11px',     // Captions, metadata
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,      // Headings
    normal: 1.5,     // Body text
    relaxed: 1.7,    // Long-form content
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};
```

### Spacing Scale

```javascript
const spacing = {
  0: '0px',
  1: '4px',       // XXS - Tight spacing
  2: '8px',       // XS - Small gaps
  3: '12px',      // S - Compact spacing
  4: '16px',      // M - Standard spacing (base unit)
  5: '20px',      // Between M and L
  6: '24px',      // L - Section spacing
  8: '32px',      // XL - Large gaps
  10: '40px',     // XXL - Major sections
  12: '48px',     // XXXL - Page sections
  16: '64px',     // Huge spacing
};
```

### Border Radius

```javascript
const borderRadius = {
  none: '0px',
  sm: '2px',       // Subtle rounding
  md: '4px',       // Standard rounding (most UI)
  lg: '8px',       // Cards, panels
  xl: '12px',      // Large cards, modals
  full: '9999px',  // Pills, rounded buttons
};
```

### Shadows

```javascript
const shadows = {
  // Light Theme
  light: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.15)',
    focus: '0 0 0 3px rgba(0,120,212,0.3)',
  },

  // Dark Theme
  dark: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.4)',
    lg: '0 10px 15px rgba(0,0,0,0.5)',
    xl: '0 20px 25px rgba(0,0,0,0.6)',
    focus: '0 0 0 3px rgba(0,120,212,0.4)',
  },
};
```

### Z-Index Scale

```javascript
const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
};
```

### Animation & Transitions

```javascript
const animation = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing Functions
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',    // Ease in-out
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',            // Ease in
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',         // Ease out
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',       // Sharp
  },
};
```

---

## Component Library

### 1. Button Component

**Variants:**
- Primary: Main actions (blue background)
- Secondary: Alternative actions (gray background)
- Destructive: Dangerous actions (red background)
- Ghost: Tertiary actions (transparent background)
- Link: Text-only actions

**Sizes:**
- Small: 32px height, 12px text
- Medium: 40px height, 14px text (default)
- Large: 48px height, 16px text

**States:**
- Default
- Hover
- Active (pressed)
- Focus (keyboard)
- Disabled
- Loading

**Specifications:**

```css
/* Primary Button */
.button-primary {
  background: var(--color-primary-main);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  padding: 0 16px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 100ms ease-out;
}

.button-primary:hover {
  background: var(--color-primary-light);
}

.button-primary:active {
  background: var(--color-primary-dark);
  transform: translateY(1px);
}

.button-primary:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.button-primary:disabled {
  background: var(--color-interactive-disabled);
  cursor: not-allowed;
  opacity: 0.5;
}
```

**Accessibility:**
- Minimum target size: 40x40px (WCAG 2.5.5)
- Focus indicator always visible
- Loading state announced to screen readers
- Disabled state prevents interaction and announced

---

### 2. Input Field Component

**Variants:**
- Text
- Password (with show/hide toggle)
- URL
- Number
- Search (with icon)

**States:**
- Default
- Focus
- Error
- Disabled
- Read-only

**Specifications:**

```css
.input-field {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-family: var(--font-family-primary);
  transition: border-color 200ms, box-shadow 200ms;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.input-field:error {
  border-color: var(--color-status-error-main);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-background-secondary);
}
```

**Required Elements:**
- Label (always visible or placeholder)
- Error message container
- Help text container
- Character counter (if max length)

**Accessibility:**
- Label associated with input (for/id or aria-labelledby)
- Error messages in aria-describedby
- Required fields indicated visually and programmatically
- Autocomplete attributes where appropriate

---

### 3. Card Component

**Variants:**
- Default: Standard card with border
- Elevated: Card with shadow
- Outlined: Border emphasis
- Interactive: Hover effects

**Specifications:**

```css
.card {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-elevated {
  box-shadow: var(--shadow-md);
}

.card-interactive:hover {
  border-color: var(--color-border-default);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
}
```

**Structure:**
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <div class="card-actions"><!-- Optional actions --></div>
  </div>
  <div class="card-content">
    <!-- Main content -->
  </div>
  <div class="card-footer">
    <!-- Optional footer -->
  </div>
</div>
```

---

### 4. Status Indicator Component

**Purpose:** Show service/connection/door status at a glance

**Variants:**
- Dot: Small circular indicator
- Badge: With text label
- Banner: Full-width notification style

**States:**
- Operational (Green)
- Warning (Yellow)
- Error (Red)
- Unknown (Gray)
- In Progress (Blue, animated)

**Specifications:**

```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.operational {
  background: var(--color-status-success-main);
}

.status-dot.warning {
  background: var(--color-status-warning-main);
}

.status-dot.error {
  background: var(--color-status-error-main);
}

.status-dot.in-progress {
  background: var(--color-status-info-main);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Accessibility:**
- Never use color alone (include icon and text)
- Screen reader text for status (aria-label)
- Semantic HTML or ARIA roles

---

### 5. Navigation Sidebar Component

**Specifications:**

```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: var(--color-background-secondary);
  border-right: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 100ms;
  border-left: 3px solid transparent;
}

.sidebar-nav-item:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.sidebar-nav-item.active {
  background: var(--color-primary-background);
  color: var(--color-primary-main);
  border-left-color: var(--color-primary-main);
}

.sidebar-nav-item:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: -2px;
}
```

**Collapsed State:**
- Width: 64px
- Show icons only
- Tooltips on hover
- Expand on hover (optional)

---

### 6. Table/List Component

**Variants:**
- Simple list
- Data table (sortable columns)
- Interactive list (clickable rows)

**Specifications:**

```css
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table thead {
  background: var(--color-background-tertiary);
  border-bottom: 2px solid var(--color-border-default);
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 14px;
}

.data-table tbody tr:hover {
  background: var(--color-background-tertiary);
}

.data-table tbody tr.interactive {
  cursor: pointer;
}
```

**Features:**
- Sortable columns (with sort indicator)
- Row selection (checkbox)
- Row actions menu
- Empty state messaging
- Loading skeleton
- Pagination controls

---

### 7. Modal/Dialog Component

**Sizes:**
- Small: 400px width
- Medium: 600px width (default)
- Large: 800px width
- Full: 90vw width

**Specifications:**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal-backdrop);
  animation: fadeIn 200ms;
}

.modal {
  background: var(--color-background-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  max-height: 90vh;
  width: 90%;
  display: flex;
  flex-direction: column;
  z-index: var(--z-index-modal);
  animation: slideUp 200ms;
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Accessibility:**
- Focus trap (Tab cycles within modal)
- Escape key to close
- Focus returns to trigger element on close
- aria-modal="true"
- aria-labelledby pointing to title
- Body scroll lock when open

---

### 8. Toast/Notification Component

**Variants:**
- Success
- Warning
- Error
- Info

**Positions:**
- Top-right (default)
- Top-center
- Bottom-right
- Bottom-center

**Specifications:**

```css
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: var(--z-index-notification);
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 400px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: auto;
  animation: slideInRight 200ms;
}

.toast.success {
  border-left: 4px solid var(--color-status-success-main);
}

.toast.error {
  border-left: 4px solid var(--color-status-error-main);
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: var(--color-text-secondary);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Features:**
- Auto-dismiss (default 5 seconds)
- Progress bar showing time remaining
- Close button
- Action button (optional)
- Stacking behavior (max 3 visible)

---

### 9. Loading States

**Variants:**
- Spinner: For inline loading
- Skeleton: For content placeholders
- Progress bar: For deterministic progress

**Spinner Specifications:**

```css
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border-subtle);
  border-top-color: var(--color-primary-main);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Skeleton Specifications:**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-background-tertiary) 0%,
    var(--color-background-secondary) 50%,
    var(--color-background-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-text {
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-heading {
  height: 24px;
  margin-bottom: 16px;
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 10. Form Components

#### Checkbox

```css
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-tertiary);
  cursor: pointer;
  position: relative;
  transition: all 100ms;
}

.checkbox:checked {
  background: var(--color-primary-main);
  border-color: var(--color-primary-main);
}

.checkbox:checked::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

#### Radio Button

```css
.radio {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-default);
  border-radius: 50%;
  background: var(--color-background-tertiary);
  cursor: pointer;
  position: relative;
  transition: all 100ms;
}

.radio:checked {
  border-color: var(--color-primary-main);
}

.radio:checked::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary-main);
}
```

#### Toggle Switch

```css
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-background-tertiary);
  border-radius: 12px;
  cursor: pointer;
  transition: background 200ms;
  border: 2px solid var(--color-border-default);
}

.toggle.checked {
  background: var(--color-primary-main);
  border-color: var(--color-primary-main);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms;
}

.toggle.checked .toggle-thumb {
  transform: translateX(20px);
}
```

---

## Icon System

### Icon Library
- Use: Fluent UI System Icons (Microsoft's icon set)
- Size variants: 16px, 20px, 24px, 32px
- Style: Outlined (default), Filled (for active states)

### Common Icons Needed

```javascript
const iconMap = {
  // Navigation
  dashboard: 'home',
  doors: 'door',
  logs: 'document_text',
  settings: 'settings',
  about: 'info',

  // Status
  connected: 'checkmark_circle',
  disconnected: 'dismiss_circle',
  warning: 'warning',
  error: 'error_circle',
  info: 'info',

  // Actions
  unlock: 'lock_open',
  lock: 'lock_closed',
  refresh: 'arrow_clockwise',
  search: 'search',
  filter: 'filter',
  export: 'arrow_download',
  edit: 'edit',
  delete: 'delete',

  // UI
  close: 'dismiss',
  menu: 'navigation',
  chevronDown: 'chevron_down',
  chevronRight: 'chevron_right',
  more: 'more_horizontal',
};
```

### Icon Usage Guidelines
- Always include aria-label or aria-hidden="true"
- Use consistent sizing within contexts
- Maintain minimum 8px spacing from text
- Use filled variants for active/selected states
- Ensure 3:1 contrast ratio with background

---

## Layout Patterns

### Application Shell

```
┌─────────────────────────────────────────────┐
│  Title Bar (Custom or Native)              │
├───────────┬─────────────────────────────────┤
│           │                                 │
│  Sidebar  │  Main Content Area              │
│  (Fixed)  │  (Scrollable)                   │
│           │                                 │
│           │                                 │
│           │                                 │
│           ├─────────────────────────────────┤
│           │  Status Bar (Optional)          │
└───────────┴─────────────────────────────────┘
```

### Dashboard Grid

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}
```

### Form Layout

```css
.form-layout {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
}
```

---

## Responsive Design

### Breakpoints

```javascript
const breakpoints = {
  sm: '1024px',   // Minimum supported
  md: '1280px',   // Default comfortable size
  lg: '1600px',   // Large displays
  xl: '1920px',   // Ultra-wide
};
```

### Responsive Behaviors

**1024px (Small):**
- Sidebar collapses to icon-only (64px)
- Cards stack vertically
- Reduce padding (24px → 16px)
- Hide non-essential columns in tables

**1280px (Medium - Default):**
- Full sidebar (240px)
- 2-column card layouts
- Standard padding (24px)
- All table columns visible

**1600px+ (Large):**
- 3-column card layouts
- Expand content max-width to 1400px
- Add more dashboard widgets
- Show additional context/metadata

---

## Accessibility Checklist

### Visual
- [ ] All text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
- [ ] UI components meet 3:1 contrast ratio
- [ ] Focus indicators are always visible
- [ ] Information not conveyed by color alone
- [ ] Text resizable to 200% without loss of functionality

### Keyboard
- [ ] All functionality accessible via keyboard
- [ ] Logical tab order follows visual layout
- [ ] No keyboard traps
- [ ] Skip links provided for main navigation
- [ ] Custom components have appropriate keyboard handlers

### Screen Reader
- [ ] All images have alt text or aria-label
- [ ] Form inputs have associated labels
- [ ] ARIA landmarks used correctly
- [ ] Dynamic content changes announced
- [ ] Error messages programmatically associated

### Motor
- [ ] Touch targets minimum 44x44px
- [ ] Sufficient spacing between interactive elements
- [ ] No time-based interactions required
- [ ] Click targets are forgiving (generous padding)

---

## Performance Guidelines

### Rendering
- Use CSS transforms for animations (GPU accelerated)
- Implement virtual scrolling for long lists (>100 items)
- Lazy load images and heavy components
- Debounce search inputs (300ms)
- Use skeleton screens during data loading

### Bundle Size
- Code split by route
- Lazy load non-critical dependencies
- Tree-shake unused code
- Optimize icon imports (import only needed icons)

### Memory
- Clean up event listeners on unmount
- Unsubscribe from observables
- Clear intervals/timeouts
- Virtualize long lists to limit DOM nodes

---

## Testing Guidelines

### Visual Regression
- Screenshot tests for all component states
- Test both light and dark themes
- Test at all breakpoints
- Test with different text lengths

### Accessibility Testing
- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation testing
- Screen reader testing: NVDA (Windows), JAWS
- High contrast mode testing

### Cross-Browser
- Chrome (primary)
- Edge (primary - Windows default)
- Firefox (secondary)
- Test on Windows 10 and Windows 11

---

## Handoff Documentation

### For Developers

**Design Tokens:**
- All tokens exported as JSON/JavaScript
- CSS custom properties for runtime theming
- TypeScript types for token values

**Component Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**State Management:**
- Document which components are controlled vs uncontrolled
- Specify data fetching patterns
- Define error handling approach

**Assets:**
- SVG icons exported as React components
- Logo variants provided (light/dark theme)
- Favicon in multiple sizes

This design system provides a comprehensive foundation for building a professional, accessible, and maintainable Windows application.
