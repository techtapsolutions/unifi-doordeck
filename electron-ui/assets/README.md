# Assets Directory

This directory contains application assets including icons and images.

## Required Icons

### Application Icon
- `icon.ico` - Main application icon (256x256 recommended)
  - Used for: Window icon, taskbar, installer

### Tray Icons (16x16 or 32x32)
- `icons/running.ico` - Service running (green indicator)
- `icons/stopped.ico` - Service stopped (red indicator)
- `icons/error.ico` - Service error (yellow indicator)

## Creating Icons

### Windows ICO Format
You can create .ico files using:
- **Online tools**: https://convertio.co/png-ico/
- **GIMP**: Export as .ico with multiple sizes
- **Photoshop**: Save for Web as .ico

### Recommended Sizes
For best results, include multiple sizes in each .ico file:
- 16x16
- 24x24
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

## Placeholder Icons

Until you create custom icons, you can:

1. **Use default Windows icons** (temporary)
2. **Generate simple colored squares** for different states
3. **Download free icons** from:
   - https://icons8.com
   - https://www.flaticon.com
   - https://iconmonstr.com

## Design Guidelines

### Application Icon
- Simple, recognizable design
- Works at small sizes (16x16)
- Represents door access/security
- Blue/purple color scheme (matches UI)

### Tray Icons
- **Running**: Green circle or checkmark
- **Stopped**: Red circle or X
- **Error**: Yellow triangle with exclamation

Keep tray icons simple with high contrast for visibility.
