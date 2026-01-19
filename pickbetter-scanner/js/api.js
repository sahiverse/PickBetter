/**
 * Error thrown when barcode format is invalid
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when product is not found (404)
 */
class ProductNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProductNotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Error thrown on network/connection errors
 */
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

/**
 * Error thrown on server errors (5xx)
 */
class ServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServerError';
    }
}

/**
 * Validates barcode format
 * @param {string} barcode - Barcode to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateBarcode(barcode) {
    // Check if barcode is a string
    if (typeof barcode !== 'string') {
        return false;
    }
    
    // Trim whitespace
    barcode = barcode.trim();
    
    // Check if matches regex: 8-13 digits
    return CONFIG.BARCODE_REGEX.test(barcode);
}

/**
 * Fetches product from backend API
 * @param {string} barcode - Product barcode (8-13 digits)
 * @returns {Promise<Object>} Product object with nutrition data
 * @throws {ValidationError} When barcode format is invalid
 * @throws {ProductNotFoundError} When product doesn't exist (404)
 * @throws {NetworkError} When network/server error occurs
 * @throws {ServerError} When server returns 5xx error
 */
async function fetchProduct(barcode) {
    // Step 1: Validate barcode format
    if (!validateBarcode(barcode)) {
        throw new ValidationError('Invalid barcode format. Must be 8-13 digits.');
    }
    
    // Trim barcode
    barcode = barcode.trim();
    
    // Step 2: Set up fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);
    
    try {
        console.log(`Fetching product: ${barcode}`);
        
        // Step 3: Make API request
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/products/${barcode}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            }
        );
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Step 4: Handle HTTP status codes
        if (!response.ok) {
            if (response.status === 404) {
                throw new ProductNotFoundError(`Product ${barcode} not found in database`);
            }
            if (response.status >= 500) {
                throw new ServerError(`Server error (${response.status}). Please try again later.`);
            }
            throw new NetworkError(`HTTP error ${response.status}`);
        }
        
        // Step 5: Parse JSON response
        const product = await response.json();
        
        console.log('Product fetched successfully:', product.name);
        
        // Step 6: Return product
        return product;
        
    } catch (error) {
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Handle abort (timeout)
        if (error.name === 'AbortError') {
            throw new NetworkError('Request timeout. Please check your connection.');
        }
        
        // Re-throw custom errors
        if (error instanceof ValidationError || 
            error instanceof ProductNotFoundError ||
            error instanceof ServerError ||
            error instanceof NetworkError) {
            throw error;
        }
        
        // Handle fetch errors (network issues, CORS, etc.)
        if (error instanceof TypeError) {
            throw new NetworkError('Network error. Is the backend running at ' + CONFIG.API_BASE_URL + '?');
        }
        
        // Unknown error
        throw new NetworkError(error.message || 'Unknown error occurred');
    }
}

/**
 * Expected Product Response Format from Backend API:
 * 
 * {
 *   "id": 1,
 *   "barcode": "3017620422003",
 *   "name": "Nutella",
 *   "brand": "Ferrero",
 *   "category": "Spreads",
 *   "image_url": "https://images.openfoodfacts.org/...",
 *   "package_size": 750.0,
 *   "serving_size": 15.0,
 *   "nutrition_per_100g": {
 *     "calories": 539.0,
 *     "sugar": 56.3,
 *     "sodium": 107.0,
 *     "protein": 6.3,
 *     "fat": 30.9,
 *     "fiber": 0.0
 *   },
 *   "allergens": ["nuts"],
 *   "is_vegan": false,
 *   "is_vegetarian": true,
 *   "data_source": "openfoodfacts",
 *   "last_updated": "2025-01-17T10:30:00"
 * }
 */

/*
// ============================================
// TEST CODE - Uncomment to test API independently
// ============================================

async function testAPI() {
    console.log('=== API Test Suite ===\n');
    
    // Test 1: Valid barcode (Nutella)
    console.log('Test 1: Valid barcode');
    try {
        const product = await fetchProduct('3017620422003');
        console.log('✅ PASS: Product fetched:', product.name);
    } catch (error) {
        console.error('❌ FAIL:', error.name, error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Invalid format
    console.log('Test 2: Invalid barcode format');
    try {
        await fetchProduct('abc123');
        console.error('❌ FAIL: Should have thrown ValidationError');
    } catch (error) {
        if (error.name === 'ValidationError') {
            console.log('✅ PASS: ValidationError caught:', error.message);
        } else {
            console.error('❌ FAIL: Wrong error type:', error.name);
        }
    }
    
    console.log('\n---\n');
    
    // Test 3: Product not found
    console.log('Test 3: Product not found (404)');
    try {
        await fetchProduct('9999999999999');
        console.error('❌ FAIL: Should have thrown ProductNotFoundError');
    } catch (error) {
        if (error.name === 'ProductNotFoundError') {
            console.log('✅ PASS: ProductNotFoundError caught:', error.message);
        } else {
            console.error('❌ FAIL: Wrong error type:', error.name);
        }
    }
    
    console.log('\n---\n');
    
    // Test 4: Network error (requires backend stopped)
    console.log('Test 4: Network error (make sure backend is STOPPED for this test)');
    try {
        await fetchProduct('3017620422003');
        console.log('ℹ️  Backend is running (expected if backend is up)');
    } catch (error) {
        if (error.name === 'NetworkError') {
            console.log('✅ PASS: NetworkError caught:', error.message);
        } else {
            console.error('❌ FAIL: Wrong error type:', error.name);
        }
    }
    
    console.log('\n=== Test Suite Complete ===');
}

// Run tests
console.log('API test mode enabled');
testAPI();

// ============================================
// END TEST CODE
// ============================================
*/
