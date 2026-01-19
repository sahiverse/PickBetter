/**
 * Application configuration
 * Contains API endpoints, scanner settings, and UI messages
 */

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:8000/api/v1',
    API_TIMEOUT_MS: 10000,
    
    // Scanner Configuration
    SCANNER: {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,    // Most common grocery barcodes
            Html5QrcodeSupportedFormats.UPC_A,     // North American barcodes
            Html5QrcodeSupportedFormats.CODE_128   // General purpose
        ]
    },
    
    // Validation
    BARCODE_REGEX: /^\d{8,13}$/,
    
    // Timeouts
    SCAN_TIMEOUT_MS: 30000,  // 30 seconds
    
    // UI Messages
    MESSAGES: {
        SCAN_READY: 'Point camera at barcode',
        SCAN_SUCCESS: 'Barcode detected!',
        LOADING: 'Loading product...',
        ERROR_CAMERA_DENIED: 'Camera access denied. Please enable camera permissions.',
        ERROR_NOT_FOUND: 'Product not found in database.',
        ERROR_NETWORK: 'Connection error. Please try again.',
        ERROR_INVALID: 'Invalid barcode format. Must be 8-13 digits.',
        ERROR_TIMEOUT: 'Scan timeout. Please try again.'
    }
};

// Freeze the config to prevent accidental modifications
Object.freeze(CONFIG);
