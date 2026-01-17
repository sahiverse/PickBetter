"""API endpoints for product-related operations."""
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import ProductResponse, ProductListResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/{barcode}", response_model=ProductResponse)
async def get_product(
    barcode: str,
    force_refresh: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a product by its barcode.
    
    Implements a cache-first strategy:
    1. Check if product exists in the database and is fresh (<30 days old)
    2. If not found or force_refresh=True, fetch from Open Food Facts
    3. Parse and store the product data
    4. Return the product
    
    Args:
        barcode: Product barcode (EAN-13, UPC, etc.)
        force_refresh: If True, bypass cache and fetch fresh data from Open Food Facts
        
    Returns:
        Product data if found, 404 if not found
    """
    service = ProductService(db)
    product = await service.get_by_barcode(barcode, force_refresh=force_refresh)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with barcode {barcode} not found"
        )
    
    return product


@router.post("/seed/{category}")
async def seed_products(
    category: str,
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of products to fetch"),
    db: AsyncSession = Depends(get_db)
):
    """
    Seed the database with products from Open Food Facts.
    
    Args:
        category: Product category to seed (e.g., 'cereals', 'beverages')
        limit: Maximum number of products to fetch (1-1000)
        
    Returns:
        Dictionary with seeding results
    """
    if not category or len(category.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category must be at least 2 characters long"
        )
    
    service = ProductService(db)
    result = await service.seed_from_openfoodfacts(category=category, limit=limit)
    
    return {
        "status": "success",
        "message": f"Seeded {result['added']} new products, updated {result['updated']} existing ones",
        "data": result
    }


@router.get("/", response_model=ProductListResponse)
async def search_products(
    q: Optional[str] = Query(None, min_length=2, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for products with optional filtering.
    
    Args:
        q: Search query (searches in name, brand, and category)
        category: Filter by category
        page: Page number (1-based)
        page_size: Number of items per page (1-100)
        
    Returns:
        Paginated list of matching products
    """
    if not q and not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of 'q' or 'category' parameters is required"
        )
    
    service = ProductService(db)
    result = await service.search_products(
        query=q,
        category=category,
        page=page,
        page_size=page_size
    )
    
    return result


@router.get("/health/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "product-service"
    }