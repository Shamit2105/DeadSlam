import { NativeModules } from 'react-native';

const { SlamModule } = NativeModules;

/**
 * Service for managing ORB-SLAM3 functionality
 * Provides high-level interface for SLAM initialization and frame processing
 */
class SlamService {
  constructor() {
    this.isInitialized = false;
    this.currentPose = null;
    this.trackingState = 'NO_IMAGES_YET';
    this.listeners = [];
  }

  /**
   * Initialize ORB-SLAM3 with vocabulary and settings files
   * @param {string} vocabPath - Path to ORB vocabulary file
   * @param {string} settingsPath - Path to settings YAML file
   * @returns {Promise<boolean>}
   */
  async initialize(vocabPath, settingsPath) {
    try {
      console.log('[SlamService] Initializing SLAM system...');
      console.log('[SlamService] Vocabulary:', vocabPath);
      console.log('[SlamService] Settings:', settingsPath);

      const result = await SlamModule.initializeSlam(vocabPath, settingsPath);
      this.isInitialized = result.success;

      console.log('[SlamService] SLAM initialized successfully');
      return true;
    } catch (error) {
      console.error('[SlamService] Initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Process a camera frame through ORB-SLAM3
   * @param {string} imageData - Base64 encoded image or file path
   * @param {number} timestamp - Frame timestamp in seconds
   * @returns {Promise<Object>} Pose data with position and orientation
   */
  async processFrame(imageData, timestamp) {
    if (!this.isInitialized) {
      throw new Error('SLAM system not initialized. Call initialize() first.');
    }

    try {
      const result = await SlamModule.processFrame(imageData, timestamp);
      
      // Update current pose
      this.currentPose = {
        position: result.position,
        orientation: result.orientation,
        timestamp: result.timestamp,
      };

      // Notify listeners
      this.notifyListeners(this.currentPose);

      return this.currentPose;
    } catch (error) {
      console.error('[SlamService] Frame processing failed:', error);
      throw error;
    }
  }

  /**
   * Reset the SLAM system
   * @returns {Promise<boolean>}
   */
  async reset() {
    try {
      await SlamModule.reset();
      this.currentPose = null;
      this.trackingState = 'NOT_INITIALIZED';
      console.log('[SlamService] SLAM system reset');
      return true;
    } catch (error) {
      console.error('[SlamService] Reset failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown the SLAM system
   * @returns {Promise<boolean>}
   */
  async shutdown() {
    try {
      await SlamModule.shutdown();
      this.isInitialized = false;
      this.currentPose = null;
      console.log('[SlamService] SLAM system shutdown');
      return true;
    } catch (error) {
      console.error('[SlamService] Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Get current tracking state
   * @returns {Promise<Object>}
   */
  async getTrackingState() {
    try {
      const result = await SlamModule.getTrackingState();
      this.trackingState = result.stateName;
      return result;
    } catch (error) {
      console.error('[SlamService] Get tracking state failed:', error);
      throw error;
    }
  }

  /**
   * Get the current pose
   * @returns {Object|null} Current pose or null if not available
   */
  getCurrentPose() {
    return this.currentPose;
  }

  /**
   * Add listener for pose updates
   * @param {Function} callback - Callback function to receive pose updates
   * @returns {Function} Unsubscribe function
   */
  addPoseListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of pose update
   * @private
   */
  notifyListeners(pose) {
    this.listeners.forEach(callback => {
      try {
        callback(pose);
      } catch (error) {
        console.error('[SlamService] Listener error:', error);
      }
    });
  }

  /**
   * Check if SLAM is initialized
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
export default new SlamService();
