# PickBetter - Barcode Scanner

A web-based barcode scanner for the PickBetter nutrition app that allows users to scan product barcodes and retrieve nutritional information.

## Description

This barcode scanner module integrates with the PickBetter FastAPI backend to provide users with instant access to nutritional information for scanned products. Users can either scan barcodes using their device camera or manually enter barcode numbers.

## Prerequisites

- FastAPI backend running at http://localhost:8000
- Modern browser with camera support
- Local development server to serve static files

## Setup

1. Ensure the FastAPI backend is running:
   ```bash
   cd /path/to/backend
   uvicorn main:app --reload
   ```

2. Serve this directory with a local server:
   ```bash
   cd pickbetter-scanner
   python -m http.server 3000
   # or
   npx serve .
   ```

3. Open in browser:
   ```
   http://localhost:3000
   ```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Barcode Scanning**: html5-qrcode library
- **API Communication**: Fetch API
- **Backend**: FastAPI (separate repository)

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Features

- 📷 Camera-based barcode scanning
- ⌨️ Manual barcode entry
- 🍎 Nutritional information display
- 📱 Mobile-responsive design
- ♿ Accessibility support
- ⚡ Fast API integration

## Status

**In Progress - Task 1 Complete**

✅ Project structure created  
✅ HTML foundation implemented  
✅ Configuration file set up  
✅ Placeholder files created  
⏳ CSS styling (Task 2)  
⏳ Barcode scanner implementation (Task 3)  
⏳ API integration (Task 4)  
⏳ UI management (Task 5)  
⏳ App orchestration (Task 6)  

## API Endpoint

- **GET** `/api/v1/products/{barcode}` - Retrieve product information by barcode

## Project Structure

```
pickbetter-scanner/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── config.js       # Configuration
│   ├── scanner.js      # Barcode scanner logic
│   ├── api.js         # API communication
│   ├── ui.js          # UI management
│   └── app.js         # Main application
└── README.md           # This file
```
