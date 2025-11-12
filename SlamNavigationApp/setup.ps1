# SLAM Navigation App - Windows Setup Script
# Run this in PowerShell to set up the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SLAM Navigation App - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✓ Found $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ✗ Not found" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " ✓ Found v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ✗ Not found" -ForegroundColor Red
    exit 1
}

# Check Android SDK
Write-Host "Checking Android SDK..." -NoNewline
if ($env:ANDROID_HOME) {
    Write-Host " ✓ Found at $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host " ✗ ANDROID_HOME not set" -ForegroundColor Red
    Write-Host "Please install Android Studio and set ANDROID_HOME" -ForegroundColor Red
}

# Check Java
Write-Host "Checking Java..." -NoNewline
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host " ✓ Found" -ForegroundColor Green
} catch {
    Write-Host " ✗ Not found" -ForegroundColor Red
    Write-Host "Please install Java 11 or higher" -ForegroundColor Red
}

# Check adb
Write-Host "Checking adb..." -NoNewline
try {
    $adbVersion = adb version 2>&1 | Select-Object -First 1
    Write-Host " ✓ Found" -ForegroundColor Green
} catch {
    Write-Host " ✗ Not found" -ForegroundColor Red
    Write-Host "Please ensure Android SDK platform-tools are in PATH" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install npm dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check for Android device
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Android Device" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Looking for connected Android devices..." -ForegroundColor Yellow
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices) {
    Write-Host "✓ Found Android device(s):" -ForegroundColor Green
    adb devices
} else {
    Write-Host "⚠ No Android devices found" -ForegroundColor Yellow
    Write-Host "Please connect an Android device with USB debugging enabled" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Build the Android app:" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor Cyan
Write-Host "   .\gradlew assembleDebug" -ForegroundColor Cyan
Write-Host "   cd .." -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Prepare configuration files:" -ForegroundColor White
Write-Host "   - Download ORBvoc.txt from ORB-SLAM3 repository" -ForegroundColor Cyan
Write-Host "   - Update settings.yaml with camera calibration" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Push files to device:" -ForegroundColor White
Write-Host "   adb push ORBvoc.txt /sdcard/Android/data/com.slamapp/files/" -ForegroundColor Cyan
Write-Host "   adb push settings.yaml /sdcard/Android/data/com.slamapp/files/" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Run the app:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed instructions, see:" -ForegroundColor White
Write-Host "   - README.md (comprehensive guide)" -ForegroundColor Cyan
Write-Host "   - docs/QUICKSTART.md (quick start)" -ForegroundColor Cyan
Write-Host "   - docs/ORB_SLAM3_INTEGRATION.md (ORB-SLAM3 setup)" -ForegroundColor Cyan
Write-Host "   - PROJECT_STATUS.md (current status)" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
