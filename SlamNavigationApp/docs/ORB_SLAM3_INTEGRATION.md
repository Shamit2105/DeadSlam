# ORB-SLAM3 Integration Guide

## Step-by-Step Integration

### 1. Download ORB-SLAM3

```bash
git clone https://github.com/UZ-SLAMLab/ORB_SLAM3.git
cd ORB_SLAM3
```

### 2. Prepare Android Build Environment

Install required tools:
- Android Studio with NDK
- CMake 3.18.1+
- Android SDK API 24+

### 3. Build Third-Party Dependencies for Android

#### Build Eigen3

```bash
cd ORB_SLAM3/Thirdparty/
git clone https://gitlab.com/libeigen/eigen.git
cd eigen
mkdir build_android && cd build_android

cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-24 \
  -DCMAKE_INSTALL_PREFIX=../install

make install
```

#### Build DBoW2

```bash
cd ORB_SLAM3/Thirdparty/DBoW2
mkdir build_android && cd build_android

cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-24 \
  -DCMAKE_BUILD_TYPE=Release

make -j4
```

#### Build g2o

```bash
cd ORB_SLAM3/Thirdparty/g2o
mkdir build_android && cd build_android

cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-24 \
  -DCMAKE_BUILD_TYPE=Release \
  -DEIGEN3_INCLUDE_DIR=../../eigen/install/include/eigen3

make -j4
```

### 4. Setup OpenCV for Android

Download OpenCV Android SDK:

```bash
wget https://github.com/opencv/opencv/releases/download/4.5.5/opencv-4.5.5-android-sdk.zip
unzip opencv-4.5.5-android-sdk.zip
mv OpenCV-android-sdk SlamNavigationApp/android/app/src/main/cpp/opencv-android-sdk
```

### 5. Copy ORB-SLAM3 Source Files

```bash
# Copy source files
cp -r ORB_SLAM3/src/* SlamNavigationApp/android/app/src/main/cpp/orb-slam3-wrapper/

# Copy headers
cp -r ORB_SLAM3/include/* SlamNavigationApp/android/app/src/main/cpp/orb-slam3-wrapper/include/

# Copy third-party libraries
mkdir -p SlamNavigationApp/android/app/src/main/cpp/orb-slam3-wrapper/Thirdparty
cp -r ORB_SLAM3/Thirdparty/DBoW2/build_android/*.so SlamNavigationApp/android/app/src/main/cpp/orb-slam3-wrapper/Thirdparty/
cp -r ORB_SLAM3/Thirdparty/g2o/build_android/*.so SlamNavigationApp/android/app/src/main/cpp/orb-slam3-wrapper/Thirdparty/
```

### 6. Update CMakeLists.txt

Edit `android/app/src/main/cpp/CMakeLists.txt`:

```cmake
# Add OpenCV
set(OpenCV_DIR "${CMAKE_SOURCE_DIR}/opencv-android-sdk/sdk/native/jni")
find_package(OpenCV REQUIRED)

# Add Eigen
set(EIGEN3_INCLUDE_DIR "${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Thirdparty/eigen/install/include/eigen3")
include_directories(${EIGEN3_INCLUDE_DIR})

# Add all ORB-SLAM3 source files
file(GLOB ORB_SLAM3_SOURCES "${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/*.cc")

add_library(orb_slam3 SHARED
    ${CMAKE_SOURCE_DIR}/slam-module/SlamWrapper.cpp
    ${ORB_SLAM3_SOURCES}
)

# Link all libraries
target_link_libraries(orb_slam3
    ${log-lib}
    ${android-lib}
    ${OpenCV_LIBS}
    ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Thirdparty/libDBoW2.so
    ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Thirdparty/libg2o.so
)
```

### 7. Update SlamWrapper.cpp

Replace simulation code with actual ORB-SLAM3:

```cpp
#include "System.h"

static ORB_SLAM3::System* g_pSLAM = nullptr;

JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_initializeSlamNative(...) {
    const char* vocabPathStr = env->GetStringUTFChars(vocabPath, nullptr);
    const char* settingsPathStr = env->GetStringUTFChars(settingsPath, nullptr);
    
    g_pSLAM = new ORB_SLAM3::System(
        vocabPathStr,
        settingsPathStr,
        ORB_SLAM3::System::MONOCULAR,
        true  // Use viewer (set false for headless)
    );
    
    env->ReleaseStringUTFChars(vocabPath, vocabPathStr);
    env->ReleaseStringUTFChars(settingsPath, settingsPathStr);
}

JNIEXPORT jfloatArray JNICALL
Java_com_slamapp_SlamModule_processFrameNative(...) {
    const char* imageDataStr = env->GetStringUTFChars(imageData, nullptr);
    
    // Load image
    cv::Mat frame = cv::imread(imageDataStr, cv::IMREAD_GRAYSCALE);
    
    // Process through SLAM
    cv::Mat Tcw = g_pSLAM->TrackMonocular(frame, timestamp);
    
    // Extract pose
    float pose[7];
    if (!Tcw.empty()) {
        // Extract translation
        pose[0] = Tcw.at<float>(0, 3);
        pose[1] = Tcw.at<float>(1, 3);
        pose[2] = Tcw.at<float>(2, 3);
        
        // Convert rotation matrix to quaternion
        // ... quaternion conversion code ...
    }
    
    jfloatArray result = env->NewFloatArray(7);
    env->SetFloatArrayRegion(result, 0, 7, pose);
    
    env->ReleaseStringUTFChars(imageData, imageDataStr);
    return result;
}
```

### 8. Download ORB Vocabulary

```bash
cd SlamNavigationApp
wget https://github.com/UZ-SLAMLab/ORB_SLAM3/raw/master/Vocabulary/ORBvoc.txt.tar.gz
tar -xf ORBvoc.txt.tar.gz
```

### 9. Create Camera Settings File

Create `settings.yaml` with your phone's camera parameters:

```yaml
%YAML:1.0

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

ORBextractor.nFeatures: 1000
ORBextractor.scaleFactor: 1.2
ORBextractor.nLevels: 8
```

### 10. Build and Test

```bash
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk

# Push required files
adb push ORBvoc.txt /sdcard/Android/data/com.slamapp/files/
adb push settings.yaml /sdcard/Android/data/com.slamapp/files/
```

## Camera Calibration

Use OpenCV to calibrate your phone camera:

```python
import cv2
import numpy as np

# Checkerboard dimensions
CHECKERBOARD = (7, 9)
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

# Prepare object points
objp = np.zeros((CHECKERBOARD[0] * CHECKERBOARD[1], 3), np.float32)
objp[:, :2] = np.mgrid[0:CHECKERBOARD[0], 0:CHECKERBOARD[1]].T.reshape(-1, 2)

# Arrays to store points
objpoints = []
imgpoints = []

# Capture images and find corners
# ... calibration code ...

# Calibrate camera
ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)

# Print results
print("Camera matrix:\n", mtx)
print("Distortion coefficients:\n", dist)
```

Update `settings.yaml` with calibration results.

## Troubleshooting

### Build Errors

**"OpenCV not found"**
- Download OpenCV Android SDK
- Update CMakeLists.txt with correct path

**"Undefined reference to g2o"**
- Rebuild g2o for Android
- Check library path in CMakeLists.txt

**"DBoW2 linking error"**
- Ensure DBoW2 is built for same ABI (arm64-v8a)
- Verify .so files are in correct location

### Runtime Errors

**"Failed to load vocabulary"**
- Check ORBvoc.txt exists on device
- Verify file permissions

**"SLAM initialization failed"**
- Check settings.yaml format
- Verify camera parameters are correct

**"Segmentation fault"**
- Check NDK version compatibility
- Verify all dependencies are built for same platform

## Performance Tips

1. **Reduce Feature Count**: Start with 500-800 features
2. **Lower Resolution**: Use 640x480 instead of 1080p
3. **Optimize ORB Parameters**: Tune for mobile hardware
4. **Use NEON**: Enable ARM NEON optimizations
5. **Profile**: Use Android Profiler to find bottlenecks

## Resources

- [ORB-SLAM3 Paper](https://arxiv.org/abs/2007.11898)
- [Android NDK Guide](https://developer.android.com/ndk/guides)
- [OpenCV Android Tutorial](https://docs.opencv.org/4.5.5/d5/df8/tutorial_dev_with_OCV_on_Android.html)
