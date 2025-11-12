LOCAL_PATH := $(call my-dir)

# ORB-SLAM3 module
include $(CLEAR_VARS)

LOCAL_MODULE := orb_slam3

# Source files
LOCAL_SRC_FILES := \
    slam-module/SlamWrapper.cpp

# Include paths
LOCAL_C_INCLUDES := \
    $(LOCAL_PATH)/slam-module \
    $(LOCAL_PATH)/orb-slam3-wrapper \
    $(LOCAL_PATH)/orb-slam3-wrapper/include

# Compiler flags
LOCAL_CFLAGS := -std=c++14 -frtti -fexceptions -O3 -DNDEBUG
LOCAL_CPPFLAGS := -std=c++14 -frtti -fexceptions -O3 -DNDEBUG

# Link libraries
LOCAL_LDLIBS := -llog -landroid -lEGL -lGLESv2 -lm -lstdc++

# Link OpenCV (when available)
# LOCAL_SHARED_LIBRARIES := opencv_java4

include $(BUILD_SHARED_LIBRARY)

# Import OpenCV (uncomment when OpenCV is added to project)
# $(call import-add-path, $(LOCAL_PATH)/../../opencv-android-sdk/sdk/native/jni)
# $(call import-module, OpenCV)
