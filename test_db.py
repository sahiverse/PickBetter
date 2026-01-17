from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test database connection
def test_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env file")
        return

    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            print("✅ Successfully connected to the database!")
    except Exception as e:
        print(f"❌ Failed to connect to the database: {e}")

if __name__ == "__main__":
    test_db_connection()
