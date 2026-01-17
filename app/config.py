"""Application configuration settings."""
from functools import lru_cache
from typing import Optional

from pydantic import PostgresDsn, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    API_PREFIX: str = "/api/v1"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Open Food Facts
    OPENFOODFACTS_API_URL: str = "https://world.openfoodfacts.org/api/v2"
    
    # Caching
    PRODUCT_CACHE_DAYS: int = 30
    
    # Database
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """Assemble the database connection string if not provided."""
        if isinstance(v, str):
            return v
        
        return PostgresDsn.build(
            scheme="postgresql",
            username="postgres",
            password=values.get("SUPABASE_SERVICE_KEY"),
            host=values["SUPABASE_URL"].replace("https://", ""),
            path=f"/postgres",
        )
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings.
    
    Returns:
        Settings: Application settings
    """
    return Settings()