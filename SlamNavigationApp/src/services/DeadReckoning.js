import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { filter } from 'rxjs/operators';

/**
 * Dead Reckoning service for sensor fusion
 * Combines IMU data (accelerometer, gyroscope) with SLAM for improved positioning
 */
class DeadReckoning {
  constructor() {
    // Position state
    this.velocity = { x: 0, y: 0, z: 0 };
    this.position = { x: 0, y: 0, z: 0 };
    this.orientation = { x: 0, y: 0, z: 0 };
    
    // Raw sensor data
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    
    // Timing
    this.lastTimestamp = null;
    this.startTime = null;
    
    // Subscriptions
    this.accSubscription = null;
    this.gyroSubscription = null;
    
    // Calibration
    this.accelBias = { x: 0, y: 0, z: 0 };
    this.gyroBias = { x: 0, y: 0, z: 0 };
    this.isCalibrated = false;
    
    // Listeners
    this.listeners = [];
    
    // Configuration
    this.updateRate = 100; // Hz
    this.gravityMagnitude = 9.81; // m/s^2
  }

  /**
   * Start dead reckoning with sensor fusion
   * @param {Object} options - Configuration options
   */
  start(options = {}) {
    console.log('[DeadReckoning] Starting sensor fusion...');
    
    const { updateRate = 100, calibrate = true } = options;
    this.updateRate = updateRate;
    
    // Set sensor update intervals
    setUpdateIntervalForType(SensorTypes.accelerometer, 1000 / this.updateRate);
    setUpdateIntervalForType(SensorTypes.gyroscope, 1000 / this.updateRate);
    
    this.startTime = Date.now();
    this.lastTimestamp = null;
    
    // Subscribe to accelerometer
    this.accSubscription = accelerometer
      .pipe(filter(() => true))
      .subscribe(
        ({ x, y, z, timestamp }) => {
          this.handleAccelerometerData({ x, y, z }, timestamp);
        },
        error => {
          console.error('[DeadReckoning] Accelerometer error:', error);
        }
      );

    // Subscribe to gyroscope
    this.gyroSubscription = gyroscope
      .pipe(filter(() => true))
      .subscribe(
        ({ x, y, z, timestamp }) => {
          this.handleGyroscopeData({ x, y, z }, timestamp);
        },
        error => {
          console.error('[DeadReckoning] Gyroscope error:', error);
        }
      );

    console.log('[DeadReckoning] Sensor fusion started');
  }

  /**
   * Handle accelerometer data
   * @private
   */
  handleAccelerometerData(acceleration, timestamp) {
    // Store raw acceleration
    this.acceleration = { ...acceleration };
    
    // Remove bias if calibrated
    if (this.isCalibrated) {
      acceleration.x -= this.accelBias.x;
      acceleration.y -= this.accelBias.y;
      acceleration.z -= this.accelBias.z;
    }
    
    // Update position using double integration
    this.updatePosition(acceleration, timestamp);
  }

  /**
   * Handle gyroscope data
   * @private
   */
  handleGyroscopeData(angularVelocity, timestamp) {
    // Store raw angular velocity
    this.angularVelocity = { ...angularVelocity };
    
    // Remove bias if calibrated
    if (this.isCalibrated) {
      angularVelocity.x -= this.gyroBias.x;
      angularVelocity.y -= this.gyroBias.y;
      angularVelocity.z -= this.gyroBias.z;
    }
    
    // Update orientation
    this.updateOrientation(angularVelocity, timestamp);
  }

  /**
   * Update position using acceleration data
   * @private
   */
  updatePosition(acceleration, timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }

    const dt = (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
    
    // Remove gravity component (simplified - assumes phone is upright)
    const accel = {
      x: acceleration.x,
      y: acceleration.y,
      z: acceleration.z - this.gravityMagnitude,
    };

    // Integrate acceleration to get velocity (v = v0 + a*dt)
    this.velocity.x += accel.x * dt;
    this.velocity.y += accel.y * dt;
    this.velocity.z += accel.z * dt;

    // Integrate velocity to get position (s = s0 + v*dt)
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    this.lastTimestamp = timestamp;
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Update orientation using gyroscope data
   * @private
   */
  updateOrientation(angularVelocity, timestamp) {
    if (!this.lastTimestamp) {
      return;
    }

    const dt = (timestamp - this.lastTimestamp) / 1000;

    // Integrate angular velocity to get orientation (θ = θ0 + ω*dt)
    this.orientation.x += angularVelocity.x * dt;
    this.orientation.y += angularVelocity.y * dt;
    this.orientation.z += angularVelocity.z * dt;
  }

  /**
   * Calibrate sensors by calculating bias
   * @param {number} duration - Calibration duration in milliseconds
   * @returns {Promise<boolean>}
   */
  async calibrate(duration = 2000) {
    console.log('[DeadReckoning] Calibrating sensors...');
    
    const samples = {
      accel: [],
      gyro: [],
    };

    // Collect samples
    const accSub = accelerometer.subscribe(({ x, y, z }) => {
      samples.accel.push({ x, y, z });
    });

    const gyroSub = gyroscope.subscribe(({ x, y, z }) => {
      samples.gyro.push({ x, y, z });
    });

    // Wait for calibration period
    await new Promise(resolve => setTimeout(resolve, duration));

    // Unsubscribe
    accSub.unsubscribe();
    gyroSub.unsubscribe();

    // Calculate average bias
    if (samples.accel.length > 0) {
      this.accelBias = {
        x: samples.accel.reduce((sum, s) => sum + s.x, 0) / samples.accel.length,
        y: samples.accel.reduce((sum, s) => sum + s.y, 0) / samples.accel.length,
        z: samples.accel.reduce((sum, s) => sum + s.z, 0) / samples.accel.length - this.gravityMagnitude,
      };
    }

    if (samples.gyro.length > 0) {
      this.gyroBias = {
        x: samples.gyro.reduce((sum, s) => sum + s.x, 0) / samples.gyro.length,
        y: samples.gyro.reduce((sum, s) => sum + s.y, 0) / samples.gyro.length,
        z: samples.gyro.reduce((sum, s) => sum + s.z, 0) / samples.gyro.length,
      };
    }

    this.isCalibrated = true;
    console.log('[DeadReckoning] Calibration complete');
    console.log('[DeadReckoning] Accel bias:', this.accelBias);
    console.log('[DeadReckoning] Gyro bias:', this.gyroBias);

    return true;
  }

  /**
   * Reset position and velocity
   */
  resetPosition() {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.position = { x: 0, y: 0, z: 0 };
    this.orientation = { x: 0, y: 0, z: 0 };
    this.lastTimestamp = null;
    console.log('[DeadReckoning] Position reset');
  }

  /**
   * Fuse with SLAM pose data
   * @param {Object} slamPose - Pose from SLAM system
   */
  fuseWithSlam(slamPose) {
    // Simple fusion: use SLAM position as ground truth and reset drift
    if (slamPose && slamPose.position) {
      this.position = {
        x: slamPose.position[0],
        y: slamPose.position[1],
        z: slamPose.position[2],
      };
      
      // Reset velocity to reduce drift
      this.velocity = { x: 0, y: 0, z: 0 };
      
      console.log('[DeadReckoning] Fused with SLAM pose');
    }
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      orientation: { ...this.orientation },
      acceleration: { ...this.acceleration },
      angularVelocity: { ...this.angularVelocity },
      isCalibrated: this.isCalibrated,
    };
  }

  /**
   * Add listener for state updates
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners of state update
   * @private
   */
  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[DeadReckoning] Listener error:', error);
      }
    });
  }

  /**
   * Stop dead reckoning
   */
  stop() {
    if (this.accSubscription) {
      this.accSubscription.unsubscribe();
      this.accSubscription = null;
    }

    if (this.gyroSubscription) {
      this.gyroSubscription.unsubscribe();
      this.gyroSubscription = null;
    }

    console.log('[DeadReckoning] Sensor fusion stopped');
  }
}

// Export singleton instance
export default new DeadReckoning();
