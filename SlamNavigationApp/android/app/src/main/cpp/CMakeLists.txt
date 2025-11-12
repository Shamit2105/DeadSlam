cmake_minimum_required(VERSION 3.18.1)

project("slamapp")

# Set C++ standard
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14 -frtti -fexceptions -Wall")

# Find OpenCV package (must be installed or prebuilt for Android)
# set(OpenCV_DIR "${CMAKE_SOURCE_DIR}/opencv-android-sdk/sdk/native/jni")
# find_package(OpenCV REQUIRED)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/slam-module
    ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper
    ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/include
    # ${OpenCV_INCLUDE_DIRS}
)

# Add ORB-SLAM3 wrapper source files
set(SLAM_WRAPPER_SOURCES
    ${CMAKE_SOURCE_DIR}/slam-module/SlamWrapper.cpp
    # Add ORB-SLAM3 source files here when integrated:
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/System.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Tracking.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/LocalMapping.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/LoopClosing.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/ORBextractor.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/ORBmatcher.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Frame.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/KeyFrame.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Map.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/MapPoint.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Optimizer.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/PnPsolver.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Converter.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/KeyFrameDatabase.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Sim3Solver.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Initializer.cc
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Viewer.cc
)

# Create shared library
add_library(orb_slam3 SHARED ${SLAM_WRAPPER_SOURCES})

# Find required Android libraries
find_library(log-lib log)
find_library(android-lib android)
find_library(EGL-lib EGL)
find_library(GLESv2-lib GLESv2)

# Link libraries
target_link_libraries(orb_slam3
    ${log-lib}
    ${android-lib}
    ${EGL-lib}
    ${GLESv2-lib}
    # ${OpenCV_LIBS}
    # When ORB-SLAM3 is integrated, add these dependencies:
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Thirdparty/DBoW2/lib/libDBoW2.so
    # ${CMAKE_SOURCE_DIR}/orb-slam3-wrapper/Thirdparty/g2o/lib/libg2o.so
)

# Set output directory
set_target_properties(orb_slam3 PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}"
)
