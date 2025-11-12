# ✅ How to Run Setup Correctly

## ⚠️ IMPORTANT: Run from Project Directory

The setup script **must be run from the project directory**, not as Administrator from the Start menu.

---

## ✅ Correct Method

### **Option 1: From File Explorer (Recommended)**

1. Open File Explorer
2. Navigate to your project folder:
   ```
   C:\Users\ronalden\Desktop\DoorDeck
   ```
3. Find `setup-windows.bat`
4. **Right-click** on it
5. Select **"Run as administrator"**
6. ✅ Script will automatically use the correct directory

### **Option 2: From Command Prompt**

1. Open Command Prompt (regular, not as Admin)
2. Navigate to project:
   ```cmd
   cd C:\Users\ronalden\Desktop\DoorDeck
   ```
3. Run the script:
   ```cmd
   setup-windows.bat
   ```

---

## ❌ What NOT to Do

**DON'T** do this:
- ❌ Search for the file in Start Menu and run it
- ❌ Open Command Prompt as Admin first, then navigate
- ❌ Run from System32 directory

These methods change the working directory to `C:\Windows\System32` which breaks npm.

---

## 🔧 What I Fixed

All batch files now automatically change to the correct directory using:
```batch
cd /d "%~dp0"
```

This means:
- ✅ `setup-windows.bat` - Changes to project root
- ✅ `scripts\install-service.bat` - Changes to project root
- ✅ `scripts\uninstall-service.bat` - Changes to project root
- ✅ `scripts\service-status.bat` - Changes to project root

---

## 🎯 Try Again

On your Windows VM:

1. **Navigate to project folder in File Explorer:**
   ```
   C:\Users\ronalden\Desktop\DoorDeck
   ```

2. **Right-click `setup-windows.bat`**

3. **Select "Run as administrator"**

4. **Watch it work:**
   ```
   Working directory: C:\Users\ronalden\Desktop\DoorDeck
   Step 1/4: Installing dependencies...
   Step 2/4: Building service...
   Step 3/4: Creating configuration directory...
   Step 4/4: Creating default configuration...
   Setup Complete!
   ```

---

## 📋 Expected Output

```cmd
========================================
UniFi-Doordeck Bridge - Windows Setup
========================================

Working directory: C:\Users\ronalden\Desktop\DoorDeck

Checking Node.js installation...
Node.js version:
v22.21.0

Step 1/4: Installing dependencies...
added 21 packages, changed 32 packages, and audited 544 packages in 4s

Step 2/4: Building service...
✅ Compiled successfully!

Step 3/4: Creating configuration directory...
Created: C:\ProgramData\UniFi-Doordeck-Bridge

Step 4/4: Creating default configuration...
Created default config: C:\ProgramData\UniFi-Doordeck-Bridge\config.json

========================================
Setup Complete!
========================================
```

---

## 🐛 If Still Getting Errors

### **"Cannot find package.json"**
- The working directory is wrong
- Make sure you see: `Working directory: C:\Users\ronalden\Desktop\DoorDeck`
- If it shows `C:\Windows\System32`, the script didn't run correctly

### **Solution:**
```cmd
REM Method 1: Double-click from File Explorer
REM (in C:\Users\ronalden\Desktop\DoorDeck)

REM Method 2: From correct directory
cd C:\Users\ronalden\Desktop\DoorDeck
setup-windows.bat
```

---

## ✅ Verify Working Directory

The script now shows:
```
Working directory: C:\Users\ronalden\Desktop\DoorDeck
```

If you see this, you're good! If you see `System32`, something went wrong.

---

*Updated: 2025-10-21*
*Fix: All batch files now auto-navigate to correct directory*
