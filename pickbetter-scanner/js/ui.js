/**
 * UIManager - Manages UI state and DOM interactions
 */
class UIManager {
    constructor() {
        this.elements = {
            startBtn: document.getElementById('start-scanner-btn'),
            stopBtn: document.getElementById('stop-scanner-btn'),
            searchBtn: document.getElementById('search-btn'),
            barcodeInput: document.getElementById('barcode-input'),
            inputValidation: document.getElementById('input-validation'),
            scanStatus: document.getElementById('scan-status'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            results: document.getElementById('results'),
            errorMessage: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-btn'),
            scanAnotherBtn: document.getElementById('scan-another-btn'),
            scanAnotherBtn2: document.getElementById('scan-another-btn-2'),
            loadingText: document.getElementById('loading-text'),
            productImage: document.getElementById('product-image'),
            productName: document.getElementById('product-name'),
            productBrand: document.getElementById('product-brand'),
            productCategory: document.getElementById('product-category'),
            calories: document.getElementById('calories'),
            protein: document.getElementById('protein'),
            carbs: document.getElementById('carbs'),
            sugar: document.getElementById('sugar'),
            fat: document.getElementById('fat'),
            fiber: document.getElementById('fiber'),
            sodium: document.getElementById('sodium')
        };
        
        this.currentView = 'scanner';
        this.initializeEventListeners();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Start scanner button
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                this.onStartScanner();
            });
        }
        
        // Stop scanner button
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => {
                this.onStopScanner();
            });
        }
        
        // Search button
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.onSearchBarcode();
            });
        }
        
        // Barcode input
        if (this.elements.barcodeInput) {
            this.elements.barcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onSearchBarcode();
                }
            });
            
            this.elements.barcodeInput.addEventListener('input', () => {
                this.validateInput();
            });
        }
        
        // Retry button
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => {
                this.showScannerView();
            });
        }
        
        // Scan another buttons
        if (this.elements.scanAnotherBtn) {
            this.elements.scanAnotherBtn.addEventListener('click', () => {
                this.showScannerView();
            });
        }
        
        if (this.elements.scanAnotherBtn2) {
            this.elements.scanAnotherBtn2.addEventListener('click', () => {
                this.showScannerView();
            });
        }
    }
    
    /**
     * Show scanner view
     */
    showScannerView() {
        this.hideAllSections();
        this.showSection('scanner-section');
        this.showSection('manual-input-section');
        this.currentView = 'scanner';
        this.clearInput();
    }
    
    /**
     * Show loading view
     */
    showLoadingView(message = CONFIG.MESSAGES.LOADING) {
        this.hideAllSections();
        this.showSection('loading');
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = message;
        }
        this.currentView = 'loading';
    }
    
    /**
     * Show error view
     */
    showErrorView(message) {
        this.hideAllSections();
        this.showSection('error');
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        this.currentView = 'error';
    }
    
    /**
     * Show results view
     */
    showResultsView(product) {
        this.hideAllSections();
        this.showSection('results');
        this.currentView = 'results';
        this.displayProduct(product);
    }
    
    /**
     * Display product information
     */
    displayProduct(product) {
        if (this.elements.productImage && product.image_url) {
            this.elements.productImage.src = product.image_url;
            this.elements.productImage.style.display = 'block';
        }
        
        if (this.elements.productName) {
            this.elements.productName.textContent = product.name || 'Unknown Product';
        }
        
        if (this.elements.productBrand) {
            this.elements.productBrand.textContent = product.brand || 'Unknown Brand';
        }
        
        if (this.elements.productCategory) {
            this.elements.productCategory.textContent = product.category || 'Uncategorized';
        }
        
        // Display nutrition information
        if (product.nutrition_per_100g) {
            const nutrition = product.nutrition_per_100g;
            
            if (this.elements.calories) {
                this.elements.calories.textContent = nutrition.calories ? `${nutrition.calories} kcal` : '-';
            }
            
            if (this.elements.protein) {
                this.elements.protein.textContent = nutrition.protein ? `${nutrition.protein} g` : '-';
            }
            
            if (this.elements.carbs) {
                this.elements.carbs.textContent = nutrition.carbohydrates ? `${nutrition.carbohydrates} g` : '-';
            }
            
            if (this.elements.sugar) {
                this.elements.sugar.textContent = nutrition.sugar ? `${nutrition.sugar} g` : '-';
            }
            
            if (this.elements.fat) {
                this.elements.fat.textContent = nutrition.fat ? `${nutrition.fat} g` : '-';
            }
            
            if (this.elements.fiber) {
                this.elements.fiber.textContent = nutrition.fiber ? `${nutrition.fiber} g` : '-';
            }
            
            if (this.elements.sodium) {
                this.elements.sodium.textContent = nutrition.sodium ? `${nutrition.sodium} mg` : '-';
            }
        }
    }
    
    /**
     * Update scan status
     */
    updateScanStatus(message) {
        if (this.elements.scanStatus) {
            this.elements.scanStatus.textContent = message;
        }
    }
    
    /**
     * Validate barcode input
     */
    validateInput() {
        const barcode = this.elements.barcodeInput.value.trim();
        
        if (!barcode) {
            this.clearValidation();
            return false;
        }
        
        if (!validateBarcode(barcode)) {
            this.showValidation(CONFIG.MESSAGES.ERROR_INVALID);
            return false;
        }
        
        this.clearValidation();
        return true;
    }
    
    /**
     * Show validation message
     */
    showValidation(message) {
        if (this.elements.inputValidation) {
            this.elements.inputValidation.textContent = message;
            this.elements.inputValidation.style.color = 'var(--error)';
        }
    }
    
    /**
     * Clear validation message
     */
    clearValidation() {
        if (this.elements.inputValidation) {
            this.elements.inputValidation.textContent = '';
        }
    }
    
    /**
     * Get barcode input value
     */
    getBarcodeInput() {
        return this.elements.barcodeInput ? this.elements.barcodeInput.value.trim() : '';
    }
    
    /**
     * Clear barcode input
     */
    clearInput() {
        if (this.elements.barcodeInput) {
            this.elements.barcodeInput.value = '';
        }
        this.clearValidation();
    }
    
    /**
     * Show/hide section
     */
    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
        }
    }
    
    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
        }
    }
    
    /**
     * Hide all sections
     */
    hideAllSections() {
        this.hideSection('scanner-section');
        this.hideSection('manual-input-section');
        this.hideSection('loading');
        this.hideSection('error');
        this.hideSection('results');
    }
    
    /**
     * Get current view
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Callback for start scanner
     */
    onStartScanner() {
        // This will be overridden by the main app
        console.log('UI: Start scanner requested');
    }
    
    /**
     * Callback for stop scanner
     */
    onStopScanner() {
        // This will be overridden by the main app
        console.log('UI: Stop scanner requested');
    }
    
    /**
     * Callback for search barcode
     */
    onSearchBarcode() {
        // This will be overridden by the main app
        console.log('UI: Search barcode requested');
    }
}

// Export UI manager
const uiManager = new UIManager();
