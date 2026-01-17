"""Product data models for the PickBetter application."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, field_validator
from sqlmodel import SQLModel, Field as SQLField, Column, JSON, ARRAY, String


class TimestampModel(SQLModel):
    """Base model with timestamp fields."""
    created_at: Optional[datetime] = SQLField(
        default_factory=datetime.utcnow, nullable=False
    )
    updated_at: Optional[datetime] = SQLField(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
    )


class ProductBase(SQLModel):
    """Base product model with common fields."""
    barcode: str = SQLField(max_length=50, unique=True, index=True)
    name: str = SQLField(max_length=255, index=True)
    brand: Optional[str] = SQLField(max_length=255, index=True, nullable=True)
    category: Optional[str] = SQLField(max_length=100, index=True, nullable=True)
    package_size: Optional[float] = SQLField(nullable=True)
    serving_size: Optional[float] = SQLField(nullable=True)
    servings_per_package: Optional[float] = SQLField(nullable=True)
    image_url: Optional[str] = SQLField(nullable=True)
    ingredients_text: Optional[str] = SQLField(nullable=True)
    ingredients_list: Optional[List[Dict[str, Any]]] = SQLField(
        sa_column=Column(ARRAY(JSON)),
        default=None,
        nullable=True
    )
    allergens: Optional[List[Dict[str, Any]]] = SQLField(
        sa_column=Column(ARRAY(JSON)),
        default=None,
        nullable=True
    )
    is_vegan: Optional[bool] = SQLField(nullable=True)
    is_vegetarian: Optional[bool] = SQLField(nullable=True)
    is_gluten_free: Optional[bool] = SQLField(nullable=True)
    data_source: str = SQLField(default="openfoodfacts")
    data_quality_score: Optional[float] = SQLField(nullable=True)
    raw_nutrition_data: Optional[Dict[str, Any]] = SQLField(
        sa_column=Column(JSON),
        default=None,
        nullable=True
    )


class Product(ProductBase, TimestampModel, table=True):
    """Product database model."""
    __tablename__ = "products"
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    last_updated: datetime = SQLField(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
    )


class NormalizedNutritionBase(SQLModel):
    """Base normalized nutrition model."""
    calories_100g: Optional[float] = SQLField(nullable=True, index=True)
    carbs_100g: Optional[float] = SQLField(nullable=True, index=True)
    sugar_100g: Optional[float] = SQLField(nullable=True, index=True)
    fiber_100g: Optional[float] = SQLField(nullable=True, index=True)
    protein_100g: Optional[float] = SQLField(nullable=True, index=True)
    fat_100g: Optional[float] = SQLField(nullable=True, index=True)
    saturated_fat_100g: Optional[float] = SQLField(nullable=True, index=True)
    trans_fat_100g: Optional[float] = SQLField(nullable=True, index=True)
    sodium_100g: Optional[float] = SQLField(nullable=True, index=True)  # in mg
    salt_100g: Optional[float] = SQLField(nullable=True)
    general_health_score: Optional[float] = SQLField(nullable=True, index=True)
    nutri_grade: Optional[str] = SQLField(max_length=1, nullable=True)  # A-E


class NormalizedNutrition(NormalizedNutritionBase, table=True):
    """Normalized nutrition database model."""
    __tablename__ = "normalized_nutrition"
    
    id: Optional[int] = SQLField(default=None, primary_key=True)
    product_id: int = SQLField(foreign_key="products.id", unique=True)
    
    # Define the relationship
    product: Optional["Product"] = None


# Pydantic models for API requests/responses
class ProductCreate(ProductBase):
    """Model for creating a new product."""
    normalized_nutrition: Optional[NormalizedNutritionBase] = None


class ProductUpdate(SQLModel):
    """Model for updating a product."""
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    # Add other fields that can be updated


class ProductResponse(ProductBase):
    """Response model for product data."""
    id: int
    created_at: datetime
    updated_at: datetime
    last_updated: datetime
    normalized_nutrition: Optional[NormalizedNutritionBase] = None


class ProductListResponse(SQLModel):
    """Response model for a list of products with pagination."""
    items: List[ProductResponse]
    total: int
    page: int
    size: int