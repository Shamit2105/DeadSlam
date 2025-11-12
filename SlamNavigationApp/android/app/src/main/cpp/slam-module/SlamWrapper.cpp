#include "SlamWrapper.h"
#include <opencv2/opencv.hpp>
#include <opencv2/core/core.hpp>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <sstream>
#include <mutex>
#include <memory>

// Note: In production, include actual ORB-SLAM3 headers
// #include "System.h"
// #include "Frame.h"
// #include "Tracking.h"

// Global SLAM system pointer (would be ORB_SLAM3::System*)
static void* g_pSLAM = nullptr;
static std::mutex g_slamMutex;
static bool g_isInitialized = false;
static int g_trackingState = 0;

// Simulated pose for demonstration (in production, this comes from ORB-SLAM3)
static float g_currentPose[7] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f};

/**
 * Convert base64 encoded string to cv::Mat
 */
cv::Mat base64ToMat(const std::string& base64Data) {
    // Decode base64 to binary
    std::vector<uchar> data;
    // In production, use proper base64 decoding library
    // For now, simplified version
    
    // Decode and create Mat from binary data
    cv::Mat img = cv::imdecode(data, cv::IMREAD_GRAYSCALE);
    return img;
}

/**
 * Load image from file path
 */
cv::Mat loadImage(const std::string& imagePath) {
    cv::Mat img = cv::imread(imagePath, cv::IMREAD_GRAYSCALE);
    if (img.empty()) {
        LOGE("Failed to load image from: %s", imagePath.c_str());
    }
    return img;
}

JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_initializeSlamNative(
    JNIEnv *env, 
    jobject instance, 
    jstring vocabPath, 
    jstring settingsPath
) {
    std::lock_guard<std::mutex> lock(g_slamMutex);
    
    const char* vocabPathStr = env->GetStringUTFChars(vocabPath, nullptr);
    const char* settingsPathStr = env->GetStringUTFChars(settingsPath, nullptr);
    
    LOGI("Initializing ORB-SLAM3");
    LOGI("Vocabulary: %s", vocabPathStr);
    LOGI("Settings: %s", settingsPathStr);
    
    try {
        // In production, initialize ORB-SLAM3:
        // g_pSLAM = new ORB_SLAM3::System(
        //     vocabPathStr, 
        //     settingsPathStr, 
        //     ORB_SLAM3::System::MONOCULAR, 
        //     true
        // );
        
        g_isInitialized = true;
        g_trackingState = 1; // NOT_INITIALIZED
        
        LOGI("ORB-SLAM3 initialized successfully");
        
    } catch (const std::exception& e) {
        LOGE("Failed to initialize ORB-SLAM3: %s", e.what());
        g_isInitialized = false;
    }
    
    env->ReleaseStringUTFChars(vocabPath, vocabPathStr);
    env->ReleaseStringUTFChars(settingsPath, settingsPathStr);
}

JNIEXPORT jfloatArray JNICALL
Java_com_slamapp_SlamModule_processFrameNative(
    JNIEnv *env, 
    jobject instance, 
    jstring imageData, 
    jdouble timestamp
) {
    std::lock_guard<std::mutex> lock(g_slamMutex);
    
    if (!g_isInitialized) {
        LOGE("SLAM system not initialized");
        return nullptr;
    }
    
    const char* imageDataStr = env->GetStringUTFChars(imageData, nullptr);
    std::string imageStr(imageDataStr);
    env->ReleaseStringUTFChars(imageData, imageDataStr);
    
    LOGD("Processing frame at timestamp: %f", timestamp);
    
    // Load image
    cv::Mat frame;
    if (imageStr.find("data:image") != std::string::npos) {
        // Base64 encoded image
        frame = base64ToMat(imageStr);
    } else {
        // File path
        frame = loadImage(imageStr);
    }
    
    if (frame.empty()) {
        LOGE("Invalid frame data");
        return nullptr;
    }
    
    // In production, process frame through ORB-SLAM3:
    // cv::Mat Tcw = ((ORB_SLAM3::System*)g_pSLAM)->TrackMonocular(frame, timestamp);
    
    // Simulate pose update (in production, extract from Tcw matrix)
    // For demonstration, increment position slightly
    g_currentPose[0] += 0.001f; // x
    g_currentPose[1] += 0.001f; // y
    g_currentPose[2] += 0.001f; // z
    
    // Update tracking state
    g_trackingState = 2; // OK
    
    // Create result array [x, y, z, qx, qy, qz, qw]
    jfloatArray result = env->NewFloatArray(7);
    env->SetFloatArrayRegion(result, 0, 7, g_currentPose);
    
    LOGD("Pose: [%.3f, %.3f, %.3f]", g_currentPose[0], g_currentPose[1], g_currentPose[2]);
    
    return result;
}

JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_resetNative(
    JNIEnv *env, 
    jobject instance
) {
    std::lock_guard<std::mutex> lock(g_slamMutex);
    
    LOGI("Resetting SLAM system");
    
    if (g_pSLAM) {
        // In production:
        // ((ORB_SLAM3::System*)g_pSLAM)->Reset();
    }
    
    // Reset pose
    for (int i = 0; i < 6; i++) {
        g_currentPose[i] = 0.0f;
    }
    g_currentPose[6] = 1.0f; // qw
    
    g_trackingState = 1; // NOT_INITIALIZED
}

JNIEXPORT void JNICALL
Java_com_slamapp_SlamModule_shutdownNative(
    JNIEnv *env, 
    jobject instance
) {
    std::lock_guard<std::mutex> lock(g_slamMutex);
    
    LOGI("Shutting down SLAM system");
    
    if (g_pSLAM) {
        // In production:
        // ((ORB_SLAM3::System*)g_pSLAM)->Shutdown();
        // delete (ORB_SLAM3::System*)g_pSLAM;
        g_pSLAM = nullptr;
    }
    
    g_isInitialized = false;
    g_trackingState = 0;
}

JNIEXPORT jint JNICALL
Java_com_slamapp_SlamModule_getTrackingStateNative(
    JNIEnv *env, 
    jobject instance
) {
    std::lock_guard<std::mutex> lock(g_slamMutex);
    return g_trackingState;
}
