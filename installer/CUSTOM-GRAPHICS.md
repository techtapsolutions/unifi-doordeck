# Adding Custom Graphics to NSIS Installer (Optional)

The installer currently uses NSIS default graphics. You can add custom branding by creating these image files.

## Quick Fix - Default Graphics

**Current status:** ✅ Installer builds with NSIS default graphics

No action needed! The installer will work perfectly with the default NSIS look.

## Optional: Add Custom Branding

If you want to customize the installer appearance:

### Required Images

Create these files in the `installer/assets/` directory:

1. **icon.ico** (256x256 pixels)
   - Application icon
   - Used for installer and uninstaller
   - Format: ICO file with multiple sizes (16x16, 32x32, 48x48, 256x256)

2. **header.bmp** (150x57 pixels)
   - Header image for installer pages
   - Format: 24-bit BMP
   - Recommended colors: Match your brand

3. **welcome.bmp** (164x314 pixels)
   - Welcome/finish page sidebar image
   - Format: 24-bit BMP
   - Can include logo and branding

### Step 1: Create Assets Folder

```cmd
cd installer
mkdir assets
```

### Step 2: Add Your Images

Place your custom graphics:
- `installer/assets/icon.ico`
- `installer/assets/header.bmp`
- `installer/assets/welcome.bmp`

### Step 3: Enable Custom Graphics

Edit `installer/unifi-doordeck-bridge.nsi`, find this section:

```nsis
; Custom graphics (optional - comment out if assets don't exist)
; !define MUI_ICON "assets\icon.ico"
; !define MUI_UNICON "assets\icon.ico"
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
; !define MUI_WELCOMEFINISHPAGE_BITMAP "assets\welcome.bmp"
```

**Uncomment the lines** (remove the semicolons):

```nsis
; Custom graphics
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets\welcome.bmp"
```

### Step 4: Rebuild Installer

```cmd
npm run installer:build:win
```

## Creating Custom Graphics

### Icon (icon.ico)

**Tools:**
- Online: https://www.favicon-generator.org/ (can create .ico from PNG)
- Windows: IcoFX (free)
- Cross-platform: GIMP (can export as .ico)

**Recommended sizes in one .ico file:**
- 16x16
- 32x32
- 48x48
- 256x256

### Bitmaps (header.bmp, welcome.bmp)

**Tools:**
- Any image editor (Paint, Photoshop, GIMP, etc.)

**Requirements:**
- Must be 24-bit BMP format
- Exact dimensions required
- No transparency (BMP doesn't support it)

**Tips:**
- Use solid colors or gradients
- Keep text readable
- Match your brand colors
- Test on both light and dark backgrounds

## Quick Template Graphics

If you just want something better than defaults, use these free resources:

### Icons
- https://icons8.com/icons (free icons)
- https://www.flaticon.com/ (free icons)
- Use any PNG and convert to .ico

### Bitmaps
Create solid color backgrounds:
- Header (150x57): Company color with logo
- Welcome (164x314): Company color with larger logo

## Example: Simple Branded Installer

**Minimal branding with just colors:**

1. **icon.ico**: Company logo
2. **header.bmp**: Solid blue background (150x57)
3. **welcome.bmp**: Solid blue with white text "UniFi-Doordeck Bridge" (164x314)

This gives a professional look with minimal effort!

## Verify Custom Graphics

After adding custom graphics, build and check:

```cmd
npm run installer:build:win
```

**No errors?** ✅ Graphics loaded successfully!

**Errors about can't open file?**
- Check file paths
- Verify file formats (must be .ico and .bmp)
- Check dimensions match exactly

## Skip Custom Graphics

**Don't want to customize?**

Leave the custom graphics commented out! The default NSIS installer looks professional and works perfectly.

## Notes

- Custom graphics are **purely cosmetic**
- Installer functionality is identical with or without them
- Default NSIS graphics are professional and widely recognized
- Most important: Clear installation wizard flow (already done!)

**Recommendation:** Skip custom graphics until you need professional branding for distribution.
