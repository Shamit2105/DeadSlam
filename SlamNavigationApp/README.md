# SLAM Navigation App

Real-time Android application integrating **ORB-SLAM3** for Simultaneous Localization and Mapping (SLAM) with **Dead Reckoning** using smartphone IMU sensors.

## 🎯 Features

- **Real-time SLAM** using ORB-SLAM3 visual odometry
- **Sensor Fusion** combining camera and IMU (accelerometer, gyroscope)
- **Dead Reckoning** for continuous position tracking
- **6DOF Pose Estimation** (position + orientation)
- **Live Camera View** with pose overlay
- **React Native UI** with native C++ performance

## 📋 Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native |
| SLAM Engine | ORB-SLAM3 (C++) |
| Sensors | Camera + IMU (Accel, Gyro) |
| Platform | Android (API 24+) |
| Build System | CMake + Gradle |
| Language Bridge | JNI (Java Native Interface) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Native UI Layer           │
│   (SlamNavigator Component)             │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│     JavaScript Services Layer           │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ SlamService  │  │ DeadReckoning   │ │
│  └──────────────┘  └─────────────────┘ │
└────────────┬────────────────────────────┘
             │ React Native Bridge
┌────────────┴────────────────────────────┐
│      Java Native Module Layer           │
│  ┌──────────────────────────────────┐  │
│  │ SlamModule.java (JNI Bridge)     │  │
│  └──────────────────────────────────┘  │
└────────────┬────────────────────────────┘
             │ JNI
┌────────────┴────────────────────────────┐
│      Native C++ Layer (NDK)             │
│  ┌──────────────────────────────────┐  │
│  │ SlamWrapper.cpp                  │  │
│  │ ORB-SLAM3 Integration            │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📦 Project Structure

```
SlamNavigationApp/
├── android/
│   └── app/
│       ├── src/main/
│       │   ├── cpp/                    # Native C++ code
│       │   │   ├── slam-module/        # JNI wrapper
│       │   │   │   ├── SlamWrapper.h
│       │   │   │   └── SlamWrapper.cpp
│       │   │   ├── orb-slam3-wrapper/  # ORB-SLAM3 integration
│       │   │   ├── CMakeLists.txt      # CMake build config
│       │   │   ├── Android.mk          # NDK build config
│       │   │   └── Application.mk
│       │   ├── java/com/slamapp/       # Java bridge
│       │   │   ├── SlamModule.java
│       │   │   ├── SlamPackage.java
│       │   │   ├── MainActivity.java
│       │   │   └── MainApplication.java
│       │   └── AndroidManifest.xml
│       ├── build.gradle                # App build config
│       └── proguard-rules.pro
├── src/
│   ├── services/                       # Business logic
│   │   ├── SlamService.js             # SLAM interface
│   │   └── DeadReckoning.js           # Sensor fusion
│   └── components/                     # UI components
│       └── SlamNavigator.js           # Main app screen
├── App.js                              # Root component
├── index.js                            # Entry point
├── package.json                        # Dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v16+) and **npm** (v7+)
2. **Android Studio** with NDK
3. **React Native CLI**
4. **Android SDK** (API 24+)
5. **CMake** (3.18.1+)
6. **OpenCV for Android** (optional, for production)

### Step 1: Clone ORB-SLAM3

```bash
# Clone ORB-SLAM3 repository
git clone https://github.com/UZ-SLAMLab/ORB_SLAM3.git

# Study the source structure
cd ORB_SLAM3
ls -la
```

### Step 2: Install Dependencies

```bash
cd SlamNavigationApp

# Install Node.js dependencies
npm install

# For Windows (PowerShell):
npm install
```

### Step 3: Prepare ORB-SLAM3 Files

You need to integrate ORB-SLAM3 source files:

1. Copy ORB-SLAM3 source files to `android/app/src/main/cpp/orb-slam3-wrapper/`
2. Copy include files to `android/app/src/main/cpp/orb-slam3-wrapper/include/`
3. Copy vocabulary file (`ORBvoc.txt`) to device storage
4. Create settings YAML file for camera calibration

**Example settings.yaml:**

```yaml
%YAML:1.0

# Camera Parameters
Camera.fx: 458.654
Camera.fy: 457.296
Camera.cx: 367.215
Camera.cy: 248.375

Camera.k1: -0.28340811
Camera.k2: 0.07395907
Camera.p1: 0.00019359
Camera.p2: 1.76187114e-05

Camera.width: 640
Camera.height: 480
Camera.fps: 30.0

# ORB Parameters
ORBextractor.nFeatures: 1000
ORBextractor.scaleFactor: 1.2
ORBextractor.nLevels: 8
ORBextractor.iniThFAST: 20
ORBextractor.minThFAST: 7

# Viewer Parameters
Viewer.KeyFrameSize: 0.05
Viewer.KeyFrameLineWidth: 1
Viewer.GraphLineWidth: 0.9
Viewer.PointSize: 2
Viewer.CameraSize: 0.08
Viewer.CameraLineWidth: 3
Viewer.ViewpointX: 0
Viewer.ViewpointY: -0.7
Viewer.ViewpointZ: -1.8
Viewer.ViewpointF: 500
```

### Step 4: Build Native Code

```bash
cd android

# On Windows (PowerShell):
.\gradlew assembleDebug

# On Linux/Mac:
./gradlew assembleDebug
```

### Step 5: Run the App

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android device
npm run android
```

## 🔧 Configuration

### Camera Calibration

To get accurate SLAM results, calibrate your phone's camera:

1. Use OpenCV camera calibration tools
2. Update `settings.yaml` with your camera parameters
3. Place `settings.yaml` in app's document directory

### File Locations on Device

The app expects these files in the Android documents directory:

```
/storage/emulated/0/Android/data/com.slamapp/files/
├── ORBvoc.txt          # ORB vocabulary (required)
└── settings.yaml       # Camera settings (required)
```

**To push files to device:**

```bash
# On Windows (PowerShell):
adb push ORBvoc.txt /sdcard/Android/data/com.slamapp/files/
adb push settings.yaml /sdcard/Android/data/com.slamapp/files/
```

## 🎮 Usage

### Basic Operation

1. **Launch App** - Grant camera and storage permissions
2. **Calibration** - Keep phone still for 2 seconds (sensor calibration)
3. **Start Tracking** - Tap "Start Tracking" button
4. **View Pose** - Real-time position and orientation displayed
5. **Reset** - Tap "Reset" to reinitialize SLAM system

### UI Elements

- **Status Bar** (top): Tracking state, frame count, FPS
- **Pose Display** (middle): Position (x,y,z) and Quaternion (qx,qy,qz,qw)
- **Dead Reckoning** (middle): IMU-based position and velocity
- **Controls** (bottom): Start/Stop and Reset buttons

### Tracking States

| State | Description |
|-------|-------------|
| `NO_IMAGES_YET` | Waiting for first frame |
| `NOT_INITIALIZED` | System ready, not tracking |
| `OK` | Successfully tracking |
| `LOST` | Tracking lost, attempting recovery |

## 🔬 ORB-SLAM3 Integration

### Current Implementation

The current implementation provides a **framework** for ORB-SLAM3 integration:

- ✅ JNI wrapper infrastructure
- ✅ React Native bridge
- ✅ Camera and sensor integration
- ✅ Build system configuration
- ⚠️ Simulated SLAM (placeholder for actual ORB-SLAM3)

### Full ORB-SLAM3 Integration Steps

To integrate actual ORB-SLAM3:

1. **Copy Source Files**
   ```bash
   cp -r ORB_SLAM3/src/* android/app/src/main/cpp/orb-slam3-wrapper/
   cp -r ORB_SLAM3/include/* android/app/src/main/cpp/orb-slam3-wrapper/include/
   ```

2. **Add Dependencies**
   - DBoW2 (Bag of Words library)
   - g2o (Graph optimization)
   - Eigen3 (Linear algebra)
   - Pangolin (Visualization, optional for Android)

3. **Update CMakeLists.txt**
   - Uncomment ORB-SLAM3 source files
   - Add dependency libraries
   - Configure OpenCV linkage

4. **Implement Native Methods**
   
   In `SlamWrapper.cpp`, replace simulation code:
   
   ```cpp
   #include "System.h"
   
   ORB_SLAM3::System* g_pSLAM = nullptr;
   
   void initializeSlamNative(...) {
       g_pSLAM = new ORB_SLAM3::System(
           vocabPathStr, 
           settingsPathStr,
           ORB_SLAM3::System::MONOCULAR,
           true
       );
   }
   
   jfloatArray processFrameNative(...) {
       cv::Mat Tcw = g_pSLAM->TrackMonocular(frame, timestamp);
       // Extract pose from Tcw matrix
       // Convert to [x, y, z, qx, qy, qz, qw]
       return pose;
   }
   ```

5. **Build Dependencies**
   
   Build ORB-SLAM3 third-party libraries for Android:
   
   ```bash
   cd ORB_SLAM3/Thirdparty/DBoW2
   # Configure for Android NDK
   mkdir build && cd build
   cmake .. -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
            -DANDROID_ABI=arm64-v8a \
            -DANDROID_PLATFORM=android-24
   make -j4
   ```

## 📱 Dead Reckoning & Sensor Fusion

### How It Works

1. **IMU Data Collection**: Accelerometer and gyroscope at 100 Hz
2. **Sensor Calibration**: Remove bias during stationary period
3. **Double Integration**: Acceleration → Velocity → Position
4. **Orientation Tracking**: Integrate angular velocity
5. **SLAM Fusion**: Use SLAM pose as ground truth to correct drift

### Calibration

The app performs automatic sensor calibration:

- Collects 2 seconds of stationary data
- Calculates average bias for accelerometer and gyroscope
- Subtracts bias from subsequent measurements

### Drift Correction

Dead reckoning accumulates error over time. The app uses SLAM poses to:

- Reset position to SLAM estimate
- Zero out velocity to reduce drift
- Maintain continuity between SLAM updates

## 🛠️ Development

### Building Debug APK

```bash
cd android
# On Windows:
.\gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Building Release APK

```bash
cd android
# On Windows:
.\gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Installing on Device

```bash
npm run install-apk
# or
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Debugging

**View Logs:**
```bash
adb logcat | findstr "SlamModule\|ORB_SLAM3\|SlamNavigator\|DeadReckoning"
```

**React Native Debugger:**
```bash
npm start
# Then shake device and select "Debug"
```

## 📊 Performance Optimization

### Target Performance

- **Frame Rate**: 15-30 FPS
- **Latency**: < 100ms per frame
- **Memory**: < 500 MB
- **CPU**: < 70% on mid-range devices

### Optimization Tips

1. **Reduce Image Resolution**: 640x480 instead of full resolution
2. **Adjust ORB Features**: Fewer features = faster processing
3. **Frame Skipping**: Process every Nth frame
4. **Background Processing**: Use separate thread for SLAM
5. **Memory Management**: Reuse buffers, avoid allocations

### Configuration (settings.yaml)

```yaml
# Balanced performance
ORBextractor.nFeatures: 800      # Reduce from 1000
Camera.fps: 20.0                  # Lower target FPS
ORBextractor.scaleFactor: 1.2    # Keep default
ORBextractor.nLevels: 6          # Reduce from 8
```

## 🐛 Troubleshooting

### Common Issues

**1. "Native library not loaded"**
- Ensure NDK is installed
- Check `build.gradle` for correct ABI filters
- Verify CMakeLists.txt builds successfully

**2. "SLAM initialization failed"**
- Check ORBvoc.txt and settings.yaml exist
- Verify file paths are correct
- Check logcat for detailed errors

**3. "Camera permission denied"**
- Grant camera permission in Android settings
- Restart the app

**4. "Tracking state LOST"**
- Ensure good lighting conditions
- Move slowly with rich visual features
- Reset and reinitialize system

**5. High CPU/Battery usage**
- Reduce frame rate
- Lower image resolution
- Decrease ORB feature count

### Debug Commands

```bash
# Check if files exist on device
adb shell ls -la /sdcard/Android/data/com.slamapp/files/

# View real-time logs
adb logcat -c && adb logcat | findstr "SLAM"

# Check native library
adb shell run-as com.slamapp ls -la lib/

# Monitor performance
adb shell top | findstr com.slamapp
```

## 📚 Additional Resources

### ORB-SLAM3
- [Official Repository](https://github.com/UZ-SLAMLab/ORB_SLAM3)
- [Research Paper](https://arxiv.org/abs/2007.11898)
- [Documentation](https://github.com/UZ-SLAMLab/ORB_SLAM3/wiki)

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Native Camera](https://github.com/react-native-camera/react-native-camera)
- [React Native Sensors](https://github.com/react-native-sensors/react-native-sensors)

### Android NDK
- [NDK Guide](https://developer.android.com/ndk/guides)
- [JNI Tips](https://developer.android.com/training/articles/perf-jni)
- [CMake Documentation](https://cmake.org/cmake/help/latest/)

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Full ORB-SLAM3 integration
- OpenCV Android build integration
- Extended Kalman Filter for sensor fusion
- Loop closure detection
- Map saving/loading
- Multi-session mapping
- AR visualization overlay

## 📄 License

This project structure is MIT licensed. Note:

- **ORB-SLAM3**: GPLv3 License
- **React Native**: MIT License
- **OpenCV**: Apache 2.0 License

Ensure compliance with all dependency licenses.

## ✨ Credits

- **ORB-SLAM3**: UZ-SLAMLab, Universidad de Zaragoza
- **React Native**: Meta/Facebook
- **OpenCV**: OpenCV Team

## 📧 Support

For issues and questions:
- Check existing [Issues](https://github.com/yourusername/SlamNavigationApp/issues)
- Review troubleshooting section
- Check ORB-SLAM3 documentation

---

**Built with ❤️ for real-time mobile SLAM applications**
