/**
 * Custom error for camera permission denied
 */
class CameraPermissionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CameraPermissionError';
    }
}

/**
 * Custom error for camera not found
 */
class CameraNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CameraNotFoundError';
    }
}

/**
 * Custom error for scan timeout
 */
class ScanTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ScanTimeoutError';
    }
}

/**
 * BarcodeScanner - Handles camera-based barcode scanning
 */
class BarcodeScanner {
    /**
     * @param {Function} onScanSuccess - Callback when barcode detected
     * @param {Function} onScanError - Callback when error occurs
     */
    constructor(onScanSuccess, onScanError) {
        this.html5QrCode = new Html5Qrcode("reader");
        this.onScanSuccess = onScanSuccess;
        this.onScanError = onScanError;
        this.scanning = false;
        this.scanTimeout = null;
    }
    
    /**
     * Starts barcode scanner
     * @returns {Promise<boolean>} True if started successfully
     */
    async start() {
        // Check if already scanning
        if (this.scanning) {
            console.warn('Scanner already running');
            return false;
        }
        
        try {
            // Configure scanner
            const config = {
                fps: CONFIG.SCANNER.fps,
                qrbox: CONFIG.SCANNER.qrbox,
                aspectRatio: CONFIG.SCANNER.aspectRatio,
                formatsToSupport: CONFIG.SCANNER.formatsToSupport
            };
            
            // Configure camera (prefer back camera on mobile)
            const cameraConfig = {
                facingMode: "environment"  // Back camera
            };
            
            // Start camera
            await this.html5QrCode.start(
                cameraConfig,
                config,
                this._onScanSuccess.bind(this),
                this._onScanError.bind(this)
            );
            
            this.scanning = true;
            
            // Set timeout (30 seconds)
            this.scanTimeout = setTimeout(() => {
                this.stop();
                if (this.onScanError) {
                    this.onScanError(new ScanTimeoutError(CONFIG.MESSAGES.ERROR_TIMEOUT));
                }
            }, CONFIG.SCAN_TIMEOUT_MS);
            
            console.log('Scanner started successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to start scanner:', error);
            this.scanning = false;
            
            // Map browser errors to custom errors
            if (error.name === 'NotAllowedError') {
                throw new CameraPermissionError(CONFIG.MESSAGES.ERROR_CAMERA_DENIED);
            }
            if (error.name === 'NotFoundError') {
                throw new CameraNotFoundError('No camera found on device');
            }
            if (error.name === 'NotReadableError') {
                throw new Error('Camera is in use by another application');
            }
            
            throw error;
        }
    }
    
    /**
     * Stops barcode scanner
     */
    async stop() {
        if (!this.scanning) {
            return;
        }
        
        try {
            // Clear timeout
            if (this.scanTimeout) {
                clearTimeout(this.scanTimeout);
                this.scanTimeout = null;
            }
            
            // Stop camera
            await this.html5QrCode.stop();
            this.scanning = false;
            console.log('Scanner stopped');
            
        } catch (error) {
            console.error('Error stopping scanner:', error);
            this.scanning = false;
        }
    }
    
    /**
     * Returns current scanning state
     * @returns {boolean}
     */
    isScanning() {
        return this.scanning;
    }
    
    /**
     * Internal callback for successful scan
     * @private
     * @param {string} decodedText - The decoded barcode text
     * @param {Object} decodedResult - The decoded result object
     */
    _onScanSuccess(decodedText, decodedResult) {
        console.log('Barcode detected:', decodedText);
        
        // Stop scanner immediately
        this.stop();
        
        // Call user's success callback
        if (this.onScanSuccess) {
            this.onScanSuccess(decodedText);
        }
    }
    
    /**
     * Internal callback for scan errors
     * @private
     * @param {string|Error} error - The error that occurred
     */
    _onScanError(error) {
        // Ignore most errors - continuous scanning generates many false positives
        // Only log if it's not a common "no barcode found" error
        const errorString = error?.toString() || '';
        if (errorString && 
            !errorString.includes('No MultiFormat Readers') && 
            !errorString.includes('NotFoundException') &&
            !errorString.includes('No barcode or QR code detected') &&
            !errorString.includes('QR code parse error')) {
            console.warn('Scan error:', error);
        }
    }
}

/*
// ============================================
// TEST CODE - Uncomment to test scanner independently
// ============================================

console.log('Scanner test mode enabled');

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up test...');
    
    const testScanner = new BarcodeScanner(
        (barcode) => {
            console.log('✅ SCAN SUCCESS:', barcode);
            alert('Scanned: ' + barcode);
        },
        (error) => {
            console.error('❌ SCAN ERROR:', error);
            alert('Error: ' + error.message);
        }
    );
    
    // Test start button
    const startBtn = document.getElementById('start-scanner-btn');
    if (startBtn) {
        startBtn.onclick = async () => {
            console.log('Start button clicked');
            try {
                const started = await testScanner.start();
                console.log('Scanner started:', started);
            } catch (error) {
                console.error('Failed to start:', error);
                alert('Camera error: ' + error.message);
            }
        };
    }
    
    // Test stop button
    const stopBtn = document.getElementById('stop-scanner-btn');
    if (stopBtn) {
        stopBtn.onclick = () => {
            console.log('Stop button clicked');
            testScanner.stop();
        };
    }
    
    console.log('Test setup complete. Click "Start Scanner" to test.');
});

// ============================================
// END TEST CODE
// ============================================
*/
