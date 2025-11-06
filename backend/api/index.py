from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
import uuid
from dotenv import load_dotenv
from PIL import Image  # Add this import for image processing

# Load environment variables
load_dotenv()

# Import database and models
from database import engine, Base, get_db
from api.models import User, Farm  # Import our SQLAlchemy models

# Create database tables
Base.metadata.create_all(bind=engine)

# Import API routes
import api.auth_endpoints as auth_endpoints
import api.users as users
import api.farms as farms
from api.schemas import UserInDB
from api.auth import get_current_active_user

app = FastAPI(
    title="Amazing Kuku API",
    description="Poultry Farm Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_endpoints.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(farms.router, prefix="/api", tags=["farms"])

# Health check endpoint
@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Protected route example
@app.get("/api/protected-route", tags=["examples"])
async def protected_route(current_user: UserInDB = Depends(get_current_active_user)):
    return {
        "message": "This is a protected route",
        "user": current_user.email,
        "role": current_user.role
    }

# Run the application
if __name__ == "__main__":
    uvicorn.run("api.index:app", host="0.0.0.0", port=8000, reload=True)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiseasePredictor:
    def __init__(self):
        # External API endpoint for poultry disease prediction
        self.external_api_url = "https://apipoultrydisease.onrender.com/predict/"
        
    async def predict(self, image: Image.Image) -> dict:
        """
        Predict disease using external API
        """
        try:
            # Convert PIL Image to bytes
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            
            # Prepare the file for multipart upload
            files = {
                'file': ('image.jpg', img_buffer, 'image/jpeg')
            }
            
            # Make async request to external API
            async with aiohttp.ClientSession() as session:
                async with session.post(self.external_api_url, data=files) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"External API error: {error_text}"
                        )
                        
        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=503,
                detail=f"External API connection error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Prediction error: {str(e)}"
            )

# Initialize predictor
predictor = DiseasePredictor()

@app.get("/")
async def root():
    return {
        "message": "Amazing Kuku - Poultry Disease Prediction API is running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict/",
            "docs": "/docs"
        },
        "external_api": "https://apipoultrydisease.onrender.com",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    try:
        # Test external API connectivity
        async with aiohttp.ClientSession() as session:
            async with session.get("https://apipoultrydisease.onrender.com/", timeout=aiohttp.ClientTimeout(total=10)) as response:
                external_api_status = "operational" if response.status == 200 else "degraded"
    except:
        external_api_status = "unavailable"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "external_api_status": external_api_status,
        "services": {
            "disease_prediction": "operational",
            "image_processing": "operational"
        }
    }

@app.post("/predict/")
async def predict_disease(
    file: UploadFile = File(...),
    crop_type: Optional[str] = None
):
    """
    Predict poultry disease from uploaded image
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get prediction from external API
        prediction_result = await predictor.predict(image)
        
        # Prepare final result
        result = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "prediction": prediction_result,
            "external_api_used": "https://apipoultrydisease.onrender.com"
        }
        
        # Add crop type if provided
        if crop_type:
            result["crop_type"] = crop_type
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        error_msg = f"Error processing image: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Export app for Vercel
# This is the ASGI application that Vercel will use
handler = app

# For local development
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
