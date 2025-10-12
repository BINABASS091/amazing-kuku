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

app = FastAPI(title="Crop Disease Prediction API")

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
        Run prediction on an image using external API
        
        Args:
            image: PIL Image object
            
        Returns:
            dict: Prediction result with class and confidence
        """
        try:
            # Convert PIL image to bytes
            img_buffer = io.BytesIO()
            # Save as JPEG for compatibility
            image.save(img_buffer, format='JPEG', quality=95)
            img_buffer.seek(0)
            
            # Prepare multipart form data
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                form_data = aiohttp.FormData()
                form_data.add_field('file', img_buffer.getvalue(), 
                                  filename='image.jpg', 
                                  content_type='image/jpeg')
                
                print(f"Sending request to external API: {self.external_api_url}")
                
                async with session.post(self.external_api_url, data=form_data) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"External API response: {result}")
                        
                        # Parse the response and normalize the format
                        prediction = result.get("prediction", "Unknown")
                        confidence_str = result.get("confidence", "0%")
                        
                        # Extract numeric confidence value
                        confidence = float(confidence_str.replace("%", "")) / 100.0
                        
                        return {
                            "prediction": prediction,
                            "confidence": confidence,
                            "confidence_percentage": confidence_str,
                            "timestamp": datetime.utcnow().isoformat(),
                            "source": "external_api"
                        }
                    else:
                        error_text = await response.text()
                        print(f"External API error: {response.status} - {error_text}")
                        raise HTTPException(
                            status_code=502, 
                            detail=f"External API error: {response.status}"
                        )
                        
        except asyncio.TimeoutError:
            print("External API timeout")
            raise HTTPException(
                status_code=504, 
                detail="External API timeout - please try again"
            )
        except aiohttp.ClientError as e:
            print(f"External API connection error: {e}")
            raise HTTPException(
                status_code=502, 
                detail="Unable to connect to disease prediction service"
            )
        except Exception as e:
            print(f"Unexpected error in disease prediction: {e}")
            # Fallback to a simple response
            return {
                "prediction": "Unable to predict",
                "confidence": 0.0,
                "confidence_percentage": "0%",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "source": "fallback"
            }

# Initialize the predictor
predictor = DiseasePredictor()

@app.get("/")
async def root():
    return {
        "message": "Amazing Kuku - Poultry Disease Prediction API is running",
        "version": "1.0.0",
        "status": "healthy",
        "external_api": "https://apipoultrydisease.onrender.com"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test connectivity to external API
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.get("https://apipoultrydisease.onrender.com/docs") as response:
                external_api_status = "healthy" if response.status == 200 else "unhealthy"
    except:
        external_api_status = "unhealthy"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "external_api_status": external_api_status,
        "services": {
            "image_processing": "healthy",
            "disease_prediction": external_api_status
        }
    }

@app.post("/predict")
async def predict_disease(
    file: UploadFile = File(...),
    crop_type: Optional[str] = None
):
    print(f"Received prediction request for file: {file.filename}, crop_type: {crop_type}")
    
    # Check if the file is an image
    if not file.content_type.startswith('image/'):
        error_msg = f"File must be an image, got {file.content_type}"
        print(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        # Read image file
        contents = await file.read()
        print(f"Read {len(contents)} bytes from image")
        
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        print(f"Image loaded: {image.size[0]}x{image.size[1]} pixels")
        
        # Make prediction using external API
        print("Making prediction using external API...")
        result = await predictor.predict(image)
        print(f"Prediction result: {result}")
        
        # Add additional metadata
        result["filename"] = file.filename
        result["image_size"] = f"{image.size[0]}x{image.size[1]}"
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
