import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import SlamService from '../services/SlamService';
import DeadReckoning from '../services/DeadReckoning';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

/**
 * Main SLAM Navigator component
 * Real-time camera view with SLAM tracking and dead reckoning
 */
const SlamNavigator = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [pose, setPose] = useState(null);
  const [drState, setDrState] = useState(null);
  const [trackingState, setTrackingState] = useState('NO_IMAGES_YET');
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  
  const cameraRef = useRef(null);
  const frameProcessingRef = useRef(false);
  const lastFrameTime = useRef(Date.now());
  const fpsCounter = useRef({ count: 0, lastTime: Date.now() });

  useEffect(() => {
    requestPermissions();
    initializeSystem();
    
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Request camera and sensor permissions
   */
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          Alert.alert('Permissions Required', 'Camera and storage permissions are required');
        }
      } catch (err) {
        console.error('Permission error:', err);
      }
    }
  };

  /**
   * Initialize SLAM and Dead Reckoning systems
   */
  const initializeSystem = async () => {
    try {
      console.log('[SlamNavigator] Initializing systems...');
      
      // Define paths (these should be bundled with the app or downloaded)
      const vocabPath = `${RNFS.DocumentDirectoryPath}/ORBvoc.txt`;
      const settingsPath = `${RNFS.DocumentDirectoryPath}/settings.yaml`;
      
      // Check if files exist
      const vocabExists = await RNFS.exists(vocabPath);
      const settingsExists = await RNFS.exists(settingsPath);
      
      if (!vocabExists || !settingsExists) {
        Alert.alert(
          'Configuration Missing',
          'ORB vocabulary and settings files are required. Please install them in the app documents directory.'
        );
        setIsInitializing(false);
        return;
      }
      
      // Initialize SLAM
      await SlamService.initialize(vocabPath, settingsPath);
      
      // Start Dead Reckoning with calibration
      DeadReckoning.start({ updateRate: 100, calibrate: false });
      
      // Calibrate sensors (keep phone still)
      Alert.alert(
        'Sensor Calibration',
        'Keep the phone still for 2 seconds to calibrate sensors',
        [
          {
            text: 'OK',
            onPress: async () => {
              await DeadReckoning.calibrate(2000);
              setIsInitializing(false);
              startContinuousProcessing();
            },
          },
        ]
      );
      
      // Subscribe to SLAM pose updates
      SlamService.addPoseListener(handlePoseUpdate);
      
      // Subscribe to Dead Reckoning updates
      DeadReckoning.addListener(handleDrUpdate);
      
    } catch (error) {
      console.error('[SlamNavigator] Initialization error:', error);
      Alert.alert('Initialization Error', error.message);
      setIsInitializing(false);
    }
  };

  /**
   * Handle SLAM pose updates
   */
  const handlePoseUpdate = (newPose) => {
    setPose(newPose);
    
    // Fuse with dead reckoning
    DeadReckoning.fuseWithSlam(newPose);
    
    // Update frame count and FPS
    setFrameCount(prev => prev + 1);
    updateFPS();
  };

  /**
   * Handle Dead Reckoning state updates
   */
  const handleDrUpdate = (state) => {
    setDrState(state);
  };

  /**
   * Update FPS counter
   */
  const updateFPS = () => {
    const now = Date.now();
    fpsCounter.current.count++;
    
    const elapsed = now - fpsCounter.current.lastTime;
    if (elapsed >= 1000) {
      const currentFps = (fpsCounter.current.count * 1000) / elapsed;
      setFps(currentFps.toFixed(1));
      fpsCounter.current.count = 0;
      fpsCounter.current.lastTime = now;
    }
  };

  /**
   * Start continuous frame processing
   */
  const startContinuousProcessing = () => {
    setIsTracking(true);
    processNextFrame();
  };

  /**
   * Process next camera frame
   */
  const processNextFrame = async () => {
    if (!isTracking || frameProcessingRef.current) {
      return;
    }

    frameProcessingRef.current = true;

    try {
      if (cameraRef.current) {
        // Capture frame
        const options = {
          quality: 0.5,
          base64: false,
          width: 640,
          height: 480,
          pauseAfterCapture: false,
        };
        
        const data = await cameraRef.current.takePictureAsync(options);
        const timestamp = Date.now() / 1000;
        
        // Process through SLAM
        await SlamService.processFrame(data.uri, timestamp);
        
        // Update tracking state
        const state = await SlamService.getTrackingState();
        setTrackingState(state.stateName);
        
        // Schedule next frame
        requestAnimationFrame(() => {
          frameProcessingRef.current = false;
          if (isTracking) {
            processNextFrame();
          }
        });
      }
    } catch (error) {
      console.error('[SlamNavigator] Frame processing error:', error);
      frameProcessingRef.current = false;
      
      // Continue processing despite errors
      if (isTracking) {
        setTimeout(() => processNextFrame(), 100);
      }
    }
  };

  /**
   * Toggle tracking on/off
   */
  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      frameProcessingRef.current = false;
    } else {
      startContinuousProcessing();
    }
  };

  /**
   * Reset SLAM system
   */
  const handleReset = async () => {
    try {
      await SlamService.reset();
      DeadReckoning.resetPosition();
      setPose(null);
      setFrameCount(0);
      setFps(0);
      Alert.alert('Success', 'SLAM system reset');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset SLAM system');
    }
  };

  /**
   * Cleanup on unmount
   */
  const cleanup = async () => {
    setIsTracking(false);
    DeadReckoning.stop();
    
    try {
      await SlamService.shutdown();
    } catch (error) {
      console.error('[SlamNavigator] Cleanup error:', error);
    }
  };

  /**
   * Render pose information
   */
  const renderPoseInfo = () => {
    if (!pose) {
      return <Text style={styles.infoText}>Waiting for first frame...</Text>;
    }

    const [x, y, z] = pose.position;
    const [qx, qy, qz, qw] = pose.orientation;

    return (
      <View>
        <Text style={styles.infoText}>
          Position: ({x.toFixed(3)}, {y.toFixed(3)}, {z.toFixed(3)})
        </Text>
        <Text style={styles.infoText}>
          Orientation: ({qx.toFixed(3)}, {qy.toFixed(3)}, {qz.toFixed(3)}, {qw.toFixed(3)})
        </Text>
      </View>
    );
  };

  /**
   * Render dead reckoning info
   */
  const renderDrInfo = () => {
    if (!drState) {
      return null;
    }

    return (
      <View style={styles.drContainer}>
        <Text style={styles.drText}>
          DR Position: ({drState.position.x.toFixed(3)}, {drState.position.y.toFixed(3)}, {drState.position.z.toFixed(3)})
        </Text>
        <Text style={styles.drText}>
          Velocity: ({drState.velocity.x.toFixed(2)}, {drState.velocity.y.toFixed(2)}, {drState.velocity.z.toFixed(2)})
        </Text>
      </View>
    );
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing SLAM System...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Camera Permission',
          message: 'We need camera access for SLAM',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }}
      />

      {/* Status overlay */}
      <View style={styles.statusOverlay}>
        <Text style={styles.statusText}>State: {trackingState}</Text>
        <Text style={styles.statusText}>Frames: {frameCount}</Text>
        <Text style={styles.statusText}>FPS: {fps}</Text>
      </View>

      {/* Pose information */}
      <View style={styles.poseOverlay}>
        {renderPoseInfo()}
        {renderDrInfo()}
      </View>

      {/* Control buttons */}
      <View style={styles.controlsOverlay}>
        <TouchableOpacity
          style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]}
          onPress={toggleTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonReset} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  statusOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  poseOverlay: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  drContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  drText: {
    color: '#4CAF50',
    fontSize: 11,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
  },
  buttonStop: {
    backgroundColor: '#F44336',
  },
  buttonReset: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SlamNavigator;
