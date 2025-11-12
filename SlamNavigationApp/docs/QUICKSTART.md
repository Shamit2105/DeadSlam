# Quick Start Guide

## Installation (5 minutes)

### 1. Prerequisites Check

```powershell
# Check Node.js
node --version  # Should be v16+

# Check npm
npm --version   # Should be v7+

# Check Android SDK
$env:ANDROID_HOME  # Should point to Android SDK

# Check Java
java -version  # Should be Java 11+
```

### 2. Install Dependencies

```powershell
cd SlamNavigationApp
npm install
```

### 3. Prepare Configuration Files

**Download files:**
- ORBvoc.txt (vocabulary file, ~100 MB)
- settings.yaml (camera calibration)

**Push to device:**

```powershell
adb push ORBvoc.txt /sdcard/Android/data/com.slamapp/files/
adb push settings.yaml /sdcard/Android/data/com.slamapp/files/
```

### 4. Build & Run

```powershell
# Build native code
cd android
.\gradlew assembleDebug
cd ..

# Start Metro bundler
npm start

# In new terminal, run on device
npm run android
```

## First Run

1. **Grant Permissions** - Allow camera and storage access
2. **Wait for Initialization** - App loads SLAM system
3. **Calibrate Sensors** - Keep phone still for 2 seconds
4. **Start Tracking** - Tap "Start Tracking" button
5. **Move Phone** - Slowly move with good lighting

## Expected Results

- **FPS**: 10-20 frames per second
- **Latency**: < 200ms per frame
- **Tracking**: Should show "OK" state
- **Position**: Updates in real-time

## Troubleshooting First Run

### "Files not found"
```powershell
# Verify files exist
adb shell ls -la /sdcard/Android/data/com.slamapp/files/

# If missing, push again
adb push ORBvoc.txt /sdcard/Android/data/com.slamapp/files/
```

### "Camera not working"
```powershell
# Check permissions
adb shell pm grant com.slamapp android.permission.CAMERA

# Restart app
adb shell am force-stop com.slamapp
```

### "Build failed"
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### "Can't connect to device"
```powershell
# Check device connection
adb devices

# Enable USB debugging on phone
# Settings > Developer Options > USB Debugging
```

## Development Workflow

### Make Changes
```powershell
# Edit JS files
# Hot reload: Shake device > "Reload"

# Edit native files
cd android
.\gradlew assembleDebug
npm run android
```

### View Logs
```powershell
# Filter SLAM logs
adb logcat | Select-String "SLAM|ORB"

# All app logs
adb logcat | Select-String "com.slamapp"
```

### Debug
```powershell
# React Native debugger
npm start
# Shake device > "Debug"

# Native debugging
# Open android/ in Android Studio
# Run > Debug 'app'
```

## Next Steps

1. **Calibrate Camera** - See `docs/CAMERA_CALIBRATION.md`
2. **Integrate ORB-SLAM3** - See `docs/ORB_SLAM3_INTEGRATION.md`
3. **Optimize Performance** - Tune settings.yaml
4. **Add Features** - Map saving, loop closure, etc.

## Common Commands

```powershell
# Build debug APK
npm run build-debug

# Build release APK
npm run build-release

# Install APK
npm run install-apk

# Clean everything
npm run clean
cd android
.\gradlew clean
cd ..
Remove-Item -Recurse -Force node_modules
npm install
```

## Getting Help

- Check README.md for detailed documentation
- Review logs with `adb logcat`
- See troubleshooting section in README.md
- Check ORB-SLAM3 issues on GitHub
