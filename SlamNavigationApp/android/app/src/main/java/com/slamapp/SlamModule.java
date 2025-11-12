package com.slamapp;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import android.util.Log;

/**
 * React Native native module for ORB-SLAM3 integration
 * Provides JavaScript interface to native SLAM functionality
 */
public class SlamModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SlamModule";
    private static final String MODULE_NAME = "SlamModule";
    
    // Load native library
    static {
        try {
            System.loadLibrary("orb_slam3");
            Log.i(TAG, "Native library loaded successfully");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native library: " + e.getMessage());
        }
    }

    public SlamModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Initialize ORB-SLAM3 system with vocabulary and settings files
     * @param vocabPath Path to ORB vocabulary file
     * @param settingsPath Path to SLAM settings YAML file
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void initializeSlam(String vocabPath, String settingsPath, Promise promise) {
        Log.i(TAG, "Initializing SLAM system");
        Log.i(TAG, "Vocabulary path: " + vocabPath);
        Log.i(TAG, "Settings path: " + settingsPath);
        
        try {
            initializeSlamNative(vocabPath, settingsPath);
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "SLAM initialized successfully");
            
            promise.resolve(result);
            Log.i(TAG, "SLAM initialization successful");
            
        } catch (Exception e) {
            Log.e(TAG, "SLAM initialization failed: " + e.getMessage());
            promise.reject("INIT_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Process a camera frame through ORB-SLAM3
     * @param imageData Base64 encoded image or file path
     * @param timestamp Frame timestamp in seconds
     * @param promise Promise to resolve with pose data
     */
    @ReactMethod
    public void processFrame(String imageData, double timestamp, Promise promise) {
        try {
            float[] pose = processFrameNative(imageData, timestamp);
            
            if (pose == null || pose.length != 7) {
                promise.reject("PROCESS_ERROR", "Invalid pose data returned");
                return;
            }
            
            WritableMap result = Arguments.createMap();
            
            // Position [x, y, z]
            WritableArray position = Arguments.createArray();
            position.pushDouble(pose[0]);
            position.pushDouble(pose[1]);
            position.pushDouble(pose[2]);
            
            // Orientation quaternion [qx, qy, qz, qw]
            WritableArray orientation = Arguments.createArray();
            orientation.pushDouble(pose[3]);
            orientation.pushDouble(pose[4]);
            orientation.pushDouble(pose[5]);
            orientation.pushDouble(pose[6]);
            
            result.putArray("position", position);
            result.putArray("orientation", orientation);
            result.putDouble("timestamp", timestamp);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Frame processing failed: " + e.getMessage());
            promise.reject("PROCESS_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Reset the SLAM system
     * @param promise Promise to resolve
     */
    @ReactMethod
    public void reset(Promise promise) {
        try {
            resetNative();
            promise.resolve(true);
            Log.i(TAG, "SLAM system reset");
        } catch (Exception e) {
            Log.e(TAG, "Reset failed: " + e.getMessage());
            promise.reject("RESET_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Shutdown the SLAM system
     * @param promise Promise to resolve
     */
    @ReactMethod
    public void shutdown(Promise promise) {
        try {
            shutdownNative();
            promise.resolve(true);
            Log.i(TAG, "SLAM system shutdown");
        } catch (Exception e) {
            Log.e(TAG, "Shutdown failed: " + e.getMessage());
            promise.reject("SHUTDOWN_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Get current tracking state
     * @param promise Promise to resolve with state
     */
    @ReactMethod
    public void getTrackingState(Promise promise) {
        try {
            int state = getTrackingStateNative();
            
            WritableMap result = Arguments.createMap();
            result.putInt("state", state);
            result.putString("stateName", getStateName(state));
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Get tracking state failed: " + e.getMessage());
            promise.reject("STATE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Convert tracking state code to human-readable name
     */
    private String getStateName(int state) {
        switch (state) {
            case 0: return "NO_IMAGES_YET";
            case 1: return "NOT_INITIALIZED";
            case 2: return "OK";
            case 3: return "LOST";
            default: return "UNKNOWN";
        }
    }

    // Native method declarations
    private native void initializeSlamNative(String vocabPath, String settingsPath);
    private native float[] processFrameNative(String imageData, double timestamp);
    private native void resetNative();
    private native void shutdownNative();
    private native int getTrackingStateNative();
}
