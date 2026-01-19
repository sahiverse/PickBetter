/**
 * PickBetterApp - Main application orchestrator
 */
class PickBetterApp {
    constructor() {
        this.scanner = null;
        this.uiManager = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing PickBetter App...');
            
            // Initialize UI manager
            this.uiManager = uiManager;
            
            // Override UI callbacks
            this.uiManager.onStartScanner = () => this.handleStartScanner();
            this.uiManager.onStopScanner = () => this.handleStopScanner();
            this.uiManager.onSearchBarcode = () => this.handleSearchBarcode();
            
            // Initialize scanner
            this.scanner = new BarcodeScanner(
                (barcode) => this.handleScanSuccess(barcode),
                (error) => this.handleScanError(error)
            );
            
            // Set initial scan status
            this.uiManager.updateScanStatus(CONFIG.MESSAGES.SCAN_READY);
            
            this.isInitialized = true;
            console.log('PickBetter App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiManager.showErrorView('Failed to initialize application. Please refresh the page.');
        }
    }
    
    /**
     * Handle start scanner request
     */
    async handleStartScanner() {
        if (!this.scanner) {
            console.error('Scanner not initialized');
            return;
        }
        
        try {
            console.log('Starting scanner...');
            const started = await this.scanner.start();
            
            if (started) {
                // Update UI
                this.uiManager.updateScanStatus('Scanning...');
                if (this.uiManager.elements.startBtn) {
                    this.uiManager.elements.startBtn.classList.add('hidden');
                }
                if (this.uiManager.elements.stopBtn) {
                    this.uiManager.elements.stopBtn.classList.remove('hidden');
                }
            }
            
        } catch (error) {
            console.error('Failed to start scanner:', error);
            
            // Handle specific error types
            if (error.name === 'CameraPermissionError') {
                this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_CAMERA_DENIED);
            } else if (error.name === 'CameraNotFoundError') {
                this.uiManager.showErrorView('No camera found on this device.');
            } else if (error.name === 'ScanTimeoutError') {
                this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_TIMEOUT);
            } else {
                this.uiManager.showErrorView('Failed to start scanner: ' + error.message);
            }
        }
    }
    
    /**
     * Handle stop scanner request
     */
    async handleStopScanner() {
        if (!this.scanner) {
            console.error('Scanner not initialized');
            return;
        }
        
        try {
            console.log('Stopping scanner...');
            await this.scanner.stop();
            
            // Update UI
            this.uiManager.updateScanStatus(CONFIG.MESSAGES.SCAN_READY);
            if (this.uiManager.elements.startBtn) {
                this.uiManager.elements.startBtn.classList.remove('hidden');
            }
            if (this.uiManager.elements.stopBtn) {
                this.uiManager.elements.stopBtn.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Failed to stop scanner:', error);
        }
    }
    
    /**
     * Handle search barcode request
     */
    async handleSearchBarcode() {
        const barcode = this.uiManager.getBarcodeInput();
        
        if (!barcode) {
            console.log('No barcode entered');
            return;
        }
        
        // Validate input
        if (!this.uiManager.validateInput()) {
            console.log('Invalid barcode format');
            return;
        }
        
        console.log('Searching for barcode:', barcode);
        await this.fetchAndDisplayProduct(barcode);
    }
    
    /**
     * Handle successful barcode scan
     */
    async handleScanSuccess(barcode) {
        console.log('Barcode scanned successfully:', barcode);
        
        // Update UI
        this.uiManager.updateScanStatus(CONFIG.MESSAGES.SCAN_SUCCESS);
        if (this.uiManager.elements.startBtn) {
            this.uiManager.elements.startBtn.classList.add('hidden');
        }
        if (this.uiManager.elements.stopBtn) {
            this.uiManager.elements.stopBtn.classList.add('hidden');
        }
        
        // Fetch product data
        await this.fetchAndDisplayProduct(barcode);
    }
    
    /**
     * Handle scanner error
     */
    handleScanError(error) {
        console.error('Scanner error:', error);
        
        // Handle specific error types
        if (error.name === 'ScanTimeoutError') {
            this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_TIMEOUT);
        } else if (error.name === 'CameraPermissionError') {
            this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_CAMERA_DENIED);
        } else if (error.name === 'CameraNotFoundError') {
            this.uiManager.showErrorView('No camera found on this device.');
        } else {
            this.uiManager.showErrorView('Scanner error: ' + error.message);
        }
    }
    
    /**
     * Fetch product and display results
     */
    async fetchAndDisplayProduct(barcode) {
        try {
            // Show loading
            this.uiManager.showLoadingView(`Fetching product ${barcode}...`);
            
            // Fetch product from API
            const product = await fetchProduct(barcode);
            
            // Show results
            this.uiManager.showResultsView(product);
            
        } catch (error) {
            console.error('Failed to fetch product:', error);
            
            // Handle specific error types
            if (error.name === 'ValidationError') {
                this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_INVALID);
            } else if (error.name === 'ProductNotFoundError') {
                this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_NOT_FOUND);
            } else if (error.name === 'NetworkError') {
                this.uiManager.showErrorView(CONFIG.MESSAGES.ERROR_NETWORK);
            } else if (error.name === 'ServerError') {
                this.uiManager.showErrorView('Server error. Please try again later.');
            } else {
                this.uiManager.showErrorView('Error: ' + error.message);
            }
        }
    }
    
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            if (this.scanner && this.scanner.isScanning()) {
                await this.scanner.stop();
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing PickBetter App...');
    
    const app = new PickBetterApp();
    await app.initialize();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, pause scanner if running
            if (app.scanner && app.scanner.isScanning()) {
                app.scanner.stop();
            }
        }
    });
    
    console.log('PickBetter App ready!');
});
