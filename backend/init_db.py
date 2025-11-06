from database import engine, Base
from api.models import User, Farm

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
