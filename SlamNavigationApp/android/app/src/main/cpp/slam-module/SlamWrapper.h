#ifndef SLAM_WRAPPER_H
#define SLAM_WRAPPER_H

#include <jni.h>
#include <android/log.h>
#include <string>
#include <vector>

#define LOG_TAG "ORB_SLAM3"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize ORB-SLAM3 system with vocabulary and settings files
 * @param env JNI environment
 * @param instance Java object instance
 * @param vocabPath Path to ORB vocabulary file
 * @param settingsPath Path to SLAM settings YAML file
 */
JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_initializeSlamNative(
    JNIEnv *env, 
    jobject instance, 
    jstring vocabPath, 
    jstring settingsPath
);

/**
 * Process a single camera frame through ORB-SLAM3
 * @param env JNI environment
 * @param instance Java object instance
 * @param imageData Base64 encoded image data or file path
 * @param timestamp Frame timestamp in seconds
 * @return Float array containing [x, y, z, qx, qy, qz, qw] pose
 */
JNIEXPORT jfloatArray JNICALL
Java_com_slamapp_SlamModule_processFrameNative(
    JNIEnv *env, 
    jobject instance, 
    jstring imageData, 
    jdouble timestamp
);

/**
 * Reset the SLAM system
 * @param env JNI environment
 * @param instance Java object instance
 */
JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_resetNative(
    JNIEnv *env, 
    jobject instance
);

/**
 * Shutdown the SLAM system and release resources
 * @param env JNI environment
 * @param instance Java object instance
 */
JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_shutdownNative(
    JNIEnv *env, 
    jobject instance
);

/**
 * Get current tracking state
 * @param env JNI environment
 * @param instance Java object instance
 * @return Tracking state: 0=NO_IMAGES_YET, 1=NOT_INITIALIZED, 2=OK, 3=LOST
 */
JNIEXPORT jint JNICALL
Java_com_slamapp_SlamModule_getTrackingStateNative(
    JNIEnv *env, 
    jobject instance
);

#ifdef __cplusplus
}
#endif

#endif // SLAM_WRAPPER_H
