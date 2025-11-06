from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_USER = os.getenv("DB_USER", "kuku_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "kuku123")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "kuku_db")

# Create database URL
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Connecting to database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Create SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create an inspector
try:
    inspector = inspect(engine)
    print("\nDatabase connection successful!")
    print("\nAvailable tables:")
    for table_name in inspector.get_table_names():
        print(f"- {table_name}")
    
    print("\nSchemas in the database:")
    for schema in inspector.get_schema_names():
        print(f"\nSchema: {schema}")
        print("Tables:")
        for table_name in inspector.get_table_names(schema=schema):
            print(f"- {table_name}")
    
except Exception as e:
    print(f"\nError connecting to the database: {e}")
