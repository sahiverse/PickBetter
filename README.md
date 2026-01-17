# PickBetter - Nutrition App

A nutrition tracking application with AI-powered recommendations.

## Project Structure

```
pickbetter/
├── app/
│   ├── api/               # API routes
│   │   └── products.py    # Product-related endpoints
│   ├── models/            # Database models
│   │   └── product.py     # Product and nutrition models
│   ├── services/          # Business logic
│   │   ├── product_service.py  # Product service
│   │   └── openfoodfacts.py    # Open Food Facts API client
│   ├── config.py          # Application configuration
│   └── database.py        # Database connection and session management
├── migrations/            # Database migrations
├── tests/                 # Test files
│   └── __init__.py
├── .env.example           # Example environment variables
├── .gitignore            # Git ignore file
├── alembic.ini           # Alembic configuration
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pickbetter.git
   cd pickbetter
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Run the development server**
   ```bash
   uvicorn app.main:app --reload
   ```

## Development

- **Run tests**: `pytest`
- **Format code**: `black . && isort .`
- **Check types**: `mypy .`

## API Documentation

Once the server is running, visit:
- API Docs: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc