# Camera Calibration for Android SLAM App

This guide helps you calibrate your Android phone's camera for accurate SLAM tracking.

## Why Calibrate?

Camera calibration provides:
- **Intrinsic parameters**: Focal length, principal point
- **Distortion coefficients**: Lens distortion correction
- **Accurate scale**: Real-world metric measurements

## Tools Required

1. **Checkerboard pattern** (printable)
2. **OpenCV** with Python
3. **Your Android phone**

## Step 1: Print Calibration Pattern

Download and print a checkerboard pattern:
- 9x6 or 7x10 checkerboard recommended
- Print on A4 paper
- Mount on flat, rigid surface (cardboard)

Download pattern:
```
https://github.com/opencv/opencv/blob/master/doc/pattern.png
```

## Step 2: Capture Calibration Images

Using your phone's camera app:

1. Take 20-30 photos of the checkerboard from different:
   - Angles (tilted left, right, up, down)
   - Distances (close and far)
   - Positions (corners, center, edges)

2. Tips:
   - Good lighting (no shadows)
   - Sharp focus (not blurry)
   - Fill frame with pattern
   - Vary orientation and position

3. Transfer images to computer:
   ```powershell
   adb pull /sdcard/DCIM/Camera/IMG_*.jpg ./calibration_images/
   ```

## Step 3: Install OpenCV

```bash
pip install opencv-python numpy
```

## Step 4: Run Calibration Script

Save this as `calibrate_camera.py`:

```python
import cv2
import numpy as np
import glob
import yaml

# Checkerboard dimensions (internal corners)
CHECKERBOARD = (7, 9)  # Adjust to your pattern
square_size = 25.0  # Size of squares in mm

# Termination criteria for corner refinement
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

# Prepare object points (0,0,0), (1,0,0), (2,0,0) ... (6,8,0)
objp = np.zeros((CHECKERBOARD[0] * CHECKERBOARD[1], 3), np.float32)
objp[:, :2] = np.mgrid[0:CHECKERBOARD[0], 0:CHECKERBOARD[1]].T.reshape(-1, 2)
objp *= square_size

# Arrays to store object points and image points
objpoints = []  # 3D points in real world space
imgpoints = []  # 2D points in image plane

# Load calibration images
images = glob.glob('calibration_images/*.jpg')
print(f"Found {len(images)} calibration images")

successful = 0
for fname in images:
    img = cv2.imread(fname)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Find checkerboard corners
    ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, None)

    # If found, add object points and image points
    if ret:
        objpoints.append(objp)
        corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
        imgpoints.append(corners2)
        successful += 1

        # Draw and display corners
        cv2.drawChessboardCorners(img, CHECKERBOARD, corners2, ret)
        cv2.imshow('Checkerboard', img)
        cv2.waitKey(500)

print(f"Successfully processed {successful}/{len(images)} images")
cv2.destroyAllWindows()

if successful < 10:
    print("Warning: Less than 10 successful images. Add more images for better calibration.")
    exit(1)

# Calibrate camera
print("Calibrating camera...")
ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(
    objpoints, imgpoints, gray.shape[::-1], None, None
)

# Calculate reprojection error
mean_error = 0
for i in range(len(objpoints)):
    imgpoints2, _ = cv2.projectPoints(objpoints[i], rvecs[i], tvecs[i], mtx, dist)
    error = cv2.norm(imgpoints[i], imgpoints2, cv2.NORM_L2) / len(imgpoints2)
    mean_error += error

print(f"\nCalibration successful!")
print(f"Mean reprojection error: {mean_error / len(objpoints):.4f} pixels")
print(f"(Should be < 0.5 pixels for good calibration)")

# Extract calibration parameters
fx = mtx[0, 0]
fy = mtx[1, 1]
cx = mtx[0, 2]
cy = mtx[1, 2]

k1 = dist[0][0]
k2 = dist[0][1]
p1 = dist[0][2]
p2 = dist[0][3]
k3 = dist[0][4] if len(dist[0]) > 4 else 0.0

# Print results
print("\n" + "="*50)
print("Camera Calibration Results")
print("="*50)
print(f"Image size: {gray.shape[1]} x {gray.shape[0]}")
print(f"\nIntrinsic Matrix:")
print(f"  fx = {fx:.6f}")
print(f"  fy = {fy:.6f}")
print(f"  cx = {cx:.6f}")
print(f"  cy = {cy:.6f}")
print(f"\nDistortion Coefficients:")
print(f"  k1 = {k1:.8f}")
print(f"  k2 = {k2:.8f}")
print(f"  p1 = {p1:.8f}")
print(f"  p2 = {p2:.8e}")
print(f"  k3 = {k3:.8f}")

# Create settings.yaml
width, height = gray.shape[1], gray.shape[0]

settings = {
    'Camera.fx': float(fx),
    'Camera.fy': float(fy),
    'Camera.cx': float(cx),
    'Camera.cy': float(cy),
    'Camera.k1': float(k1),
    'Camera.k2': float(k2),
    'Camera.p1': float(p1),
    'Camera.p2': float(p2),
    'Camera.k3': float(k3),
    'Camera.width': width,
    'Camera.height': height,
    'Camera.fps': 30.0,
    'Camera.RGB': 1,
    'ORBextractor.nFeatures': 1000,
    'ORBextractor.scaleFactor': 1.2,
    'ORBextractor.nLevels': 8,
    'ORBextractor.iniThFAST': 20,
    'ORBextractor.minThFAST': 7,
}

# Write to YAML file
with open('settings.yaml', 'w') as f:
    f.write('%YAML:1.0\n\n')
    f.write('#--------------------------------------------------------------------------------------------\n')
    f.write('# Camera Calibration Results\n')
    f.write(f'# Generated from {successful} calibration images\n')
    f.write(f'# Mean reprojection error: {mean_error / len(objpoints):.4f} pixels\n')
    f.write('#--------------------------------------------------------------------------------------------\n\n')
    
    for key, value in settings.items():
        if isinstance(value, float):
            f.write(f'{key}: {value:.8f}\n')
        else:
            f.write(f'{key}: {value}\n')
        
        if key == 'Camera.RGB':
            f.write('\n#--------------------------------------------------------------------------------------------\n')
            f.write('# ORB Extractor Parameters\n')
            f.write('#--------------------------------------------------------------------------------------------\n\n')

print(f"\n✓ Calibration file saved to: settings.yaml")
print("\nNext steps:")
print("1. Copy settings.yaml to your phone:")
print("   adb push settings.yaml /sdcard/Android/data/com.slamapp/files/")
print("2. Use this file with the SLAM app")
```

## Step 5: Run Calibration

```bash
python calibrate_camera.py
```

Expected output:
```
Found 25 calibration images
Successfully processed 23/25 images
Calibrating camera...

Calibration successful!
Mean reprojection error: 0.3421 pixels

==================================================
Camera Calibration Results
==================================================
Image size: 1920 x 1080

Intrinsic Matrix:
  fx = 1234.567890
  fy = 1234.567890
  cx = 960.000000
  cy = 540.000000

Distortion Coefficients:
  k1 = -0.28340811
  k2 = 0.07395907
  p1 = 0.00019359
  p2 = 1.76187114e-05
  k3 = 0.00000000

✓ Calibration file saved to: settings.yaml
```

## Step 6: Validate Calibration

Test undistortion:

```python
import cv2
import numpy as np
import yaml

# Load calibration
with open('settings.yaml', 'r') as f:
    data = yaml.safe_load(f)

mtx = np.array([
    [data['Camera.fx'], 0, data['Camera.cx']],
    [0, data['Camera.fy'], data['Camera.cy']],
    [0, 0, 1]
])

dist = np.array([
    data['Camera.k1'],
    data['Camera.k2'],
    data['Camera.p1'],
    data['Camera.p2'],
    data['Camera.k3']
])

# Test on an image
img = cv2.imread('test_image.jpg')
h, w = img.shape[:2]
newcameramtx, roi = cv2.getOptimalNewCameraMatrix(mtx, dist, (w,h), 1, (w,h))

# Undistort
dst = cv2.undistort(img, mtx, dist, None, newcameramtx)

# Crop the image
x, y, w, h = roi
dst = dst[y:y+h, x:x+w]

cv2.imshow('Original', img)
cv2.imshow('Undistorted', dst)
cv2.waitKey(0)
```

Straight lines should appear straight in undistorted image.

## Step 7: Deploy to Phone

```powershell
adb push settings.yaml /sdcard/Android/data/com.slamapp/files/
```

## Troubleshooting

### "Checkerboard corners not found"
- Ensure good lighting
- Make sure pattern is flat
- Check CHECKERBOARD size matches your pattern
- Try different angles

### "Mean reprojection error > 1.0"
- Take more images (30-40)
- Ensure images are in focus
- Cover more of the image area
- Use larger checkerboard pattern

### "Calibration unstable"
- Increase number of images
- Ensure checkerboard is perfectly flat
- Use consistent lighting
- Avoid motion blur

## Alternative: Automatic Calibration

Some phones publish calibration data:

```bash
# Check phone's camera parameters
adb shell dumpsys media.camera | grep -i focal
```

Or use apps like:
- Camera Calibration (Android)
- OpenCamera (has calibration info)

## Tips for Best Results

1. **Image quality**:
   - 1080p or higher
   - Good lighting
   - Sharp focus

2. **Pattern coverage**:
   - Cover all image areas
   - Vary distance and angle
   - Include corners and edges

3. **Pattern accuracy**:
   - Print at actual size
   - Mount on rigid surface
   - Ensure it's flat

4. **Validation**:
   - Reprojection error < 0.5 pixels
   - Test undistortion visually
   - Compare with manufacturer specs

## References

- [OpenCV Camera Calibration](https://docs.opencv.org/4.5.5/dc/dbb/tutorial_py_calibration.html)
- [ORB-SLAM3 Configuration](https://github.com/UZ-SLAMLab/ORB_SLAM3)
- [Multiple Camera Calibration](https://www.mathworks.com/help/vision/ug/camera-calibration.html)
