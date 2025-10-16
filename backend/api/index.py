from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io
import os
from datetime import datetime
from typing import Optional
import requests
import aiohttp
import asyncio
from pydantic import BaseModel

app = FastAPI(
    title="Crop Disease Prediction API",
    description="Amazing Kuku - Poultry Disease Prediction API",
    version="1.0.0"
)

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
