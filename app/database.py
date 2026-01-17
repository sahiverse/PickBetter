"""Database connection and session management."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    poolclass=NullPool if settings.APP_ENV == "test" else None,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Base class for all models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function that yields database sessions.
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    from app.models.product import Product, NormalizedNutrition  # noqa: F401
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Create indexes
        # Create composite index for normalized_nutrition
        if not await conn.run_sync(
            lambda conn: conn.dialect.has_table(conn, "normalized_nutrition")
        ):
            await conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_nutrition_composite 
                ON normalized_nutrition (sugar_100g, sodium_100g, protein_100g, fiber_100g)
                """
            )


async def close_db() -> None:
    """Close database connection."""
    if engine:
        await engine.dispose()