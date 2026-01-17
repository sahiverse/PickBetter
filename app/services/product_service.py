"""Product service for handling product-related operations."""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy import select, update, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.product import (
    Product, 
    NormalizedNutrition, 
    ProductCreate, 
    ProductUpdate, 
    ProductResponse,
    NormalizedNutritionBase
)
from app.services.openfoodfacts import OpenFoodFactsClient

logger = logging.getLogger(__name__)
settings = get_settings()

class ProductService:
    """Service for product-related operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize the product service."""
        self.db = db
    
    async def get_by_barcode(
        self, 
        barcode: str, 
        force_refresh: bool = False
    ) -> Optional[ProductResponse]:
        """
        Get a product by its barcode, with cache-first strategy.
        
        Args:
            barcode: Product barcode
            force_refresh: If True, force refresh from Open Food Facts
            
        Returns:
            ProductResponse if found, None otherwise
        """
        # Check cache first if not forcing refresh
        if not force_refresh:
            product = await self._get_from_database(barcode)
            if product and self._is_fresh(product.last_updated):
                logger.debug(f"Returning cached product with barcode {barcode}")
                return await self._to_response(product)
        
        # If not in cache or force_refresh, fetch from Open Food Facts
        logger.debug(f"Fetching product {barcode} from Open Food Facts")
        async with OpenFoodFactsClient() as client:
            product_data = await client.get_product(barcode)
            
            if not product_data:
                logger.info(f"Product with barcode {barcode} not found in Open Food Facts")
                return None
                
            # Parse and save the product
            product = await self._create_or_update_product(product_data)
            return await self._to_response(product)
    
    async def search_products(
        self,
        query: str = None,
        category: str = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Search for products with optional filtering.
        
        Args:
            query: Search query string
            category: Filter by category
            page: Page number (1-based)
            page_size: Number of items per page
            
        Returns:
            Dictionary with products and pagination info
        """
        # Build the base query
        stmt = select(Product).options(
            selectinload(Product.normalized_nutrition)
        )
        
        # Apply filters
        conditions = []
        if query:
            conditions.append(
                or_(
                    Product.name.ilike(f"%{query}%"),
                    Product.brand.ilike(f"%{query}%"),
                    Product.category.ilike(f"%{query}%")
                )
            )
        if category:
            conditions.append(Product.category.ilike(f"%{category}%"))
        
        if conditions:
            stmt = stmt.where(and_(*conditions))
        
        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)
        
        # Execute query
        result = await self.db.execute(stmt)
        products = result.scalars().all()
        
        # Get total count for pagination
        count_stmt = select(Product)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total = (await self.db.execute(select([func.count()]).select_from(count_stmt.subquery()))).scalar()
        
        return {
            "items": [await self._to_response(p) for p in products],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    async def seed_from_openfoodfacts(
        self, 
        category: str, 
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Seed the database with products from Open Food Facts.
        
        Args:
            category: Category to seed products from
            limit: Maximum number of products to fetch
            
        Returns:
            Dictionary with seeding results
        """
        logger.info(f"Seeding up to {limit} products from category: {category}")
        
        async with OpenFoodFactsClient() as client:
            products, total = await client.search_products(category, page_size=min(limit, 1000))
            
            added = 0
            updated = 0
            skipped = 0
            errors = 0
            
            for product_data in products:
                try:
                    # Skip if missing required fields
                    if not product_data.get("code") or not product_data.get("product_name"):
                        skipped += 1
                        continue
                    
                    # Check if product already exists
                    existing = await self._get_from_database(product_data["code"])
                    
                    # Parse the product data
                    product = await self._parse_product_data(product_data)
                    
                    if existing:
                        # Update existing product
                        await self._update_product(existing, product)
                        updated += 1
                    else:
                        # Add new product
                        await self._add_product(product)
                        added += 1
                        
                except Exception as e:
                    logger.error(f"Error processing product {product_data.get('code')}: {e}", exc_info=True)
                    errors += 1
            
            # Commit the transaction
            await self.db.commit()
            
            return {
                "total_processed": len(products),
                "added": added,
                "updated": updated,
                "skipped": skipped,
                "errors": errors
            }
    
    async def _get_from_database(self, barcode: str) -> Optional[Product]:
        """Get a product from the database by barcode."""
        stmt = select(Product).where(Product.barcode == barcode).options(
            selectinload(Product.normalized_nutrition)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def _create_or_update_product(
        self, 
        product_data: Dict[str, Any]
    ) -> Product:
        """
        Create or update a product from Open Food Facts data.
        
        Args:
            product_data: Raw product data from Open Food Facts
            
        Returns:
            The created or updated Product instance
        """
        # Parse the product data
        product = await self._parse_product_data(product_data)
        
        # Check if product exists
        existing = await self._get_from_database(product.barcode)
        
        if existing:
            return await self._update_product(existing, product)
        else:
            return await self._add_product(product)
    
    async def _parse_product_data(self, product_data: Dict[str, Any]) -> ProductCreate:
        """Parse raw product data into a ProductCreate instance."""
        async with OpenFoodFactsClient() as client:
            return client.parse_product(product_data)
    
    async def _add_product(self, product: ProductCreate) -> Product:
        """Add a new product to the database."""
        # Create the product
        db_product = Product(**product.dict(exclude={"normalized_nutrition"}))
        
        # Add normalized nutrition if available
        if product.normalized_nutrition:
            db_nutrition = NormalizedNutrition(
                **product.normalized_nutrition.dict(),
                product=db_product
            )
            db_product.normalized_nutrition = db_nutrition
        
        self.db.add(db_product)
        await self.db.commit()
        await self.db.refresh(db_product)
        
        logger.info(f"Added new product: {db_product.name} ({db_product.barcode})")
        return db_product
    
    async def _update_product(
        self, 
        existing: Product, 
        new_data: ProductCreate
    ) -> Product:
        """Update an existing product with new data."""
        # Update product fields
        update_data = new_data.dict(exclude={"normalized_nutrition"}, exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        
        # Update or create normalized nutrition
        if new_data.normalized_nutrition:
            if existing.normalized_nutrition:
                # Update existing nutrition
                for field, value in new_data.normalized_nutrition.dict(exclude_unset=True).items():
                    setattr(existing.normalized_nutrition, field, value)
            else:
                # Create new nutrition
                existing.normalized_nutrition = NormalizedNutrition(
                    **new_data.normalized_nutrition.dict(),
                    product_id=existing.id
                )
        
        await self.db.commit()
        await self.db.refresh(existing)
        
        logger.debug(f"Updated product: {existing.name} ({existing.barcode})")
        return existing
    
    async def _to_response(self, product: Product) -> ProductResponse:
        """Convert a Product to a ProductResponse."""
        if not product:
            return None
            
        data = product.dict()
        
        # Add normalized nutrition if it exists
        if hasattr(product, 'normalized_nutrition') and product.normalized_nutrition:
            data['normalized_nutrition'] = NormalizedNutritionBase.from_orm(product.normalized_nutrition)
        
        return ProductResponse(**data)
    
    def _is_fresh(self, last_updated: datetime) -> bool:
        """Check if a product's data is fresh (less than 30 days old)."""
        if not last_updated:
            return False
            
        cache_days = settings.PRODUCT_CACHE_DAYS
        return (datetime.utcnow() - last_updated) < timedelta(days=cache_days)