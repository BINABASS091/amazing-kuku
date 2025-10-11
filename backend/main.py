from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io
import os
from datetime import datetime
from typing import Optional
import requests
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

# This is a placeholder for your model loading function
# Replace this with your actual model loading code
class DiseasePredictor:
    def __init__(self):
        # Initialize your model here
        self.model = None
        self.class_names = ["Healthy", "Diseased"]  # Update with your actual class names
        
    def predict(self, image: Image.Image) -> dict:
        """
        Run prediction on an image
        
        Args:
            image: PIL Image object
            
        Returns:
            dict: Prediction result with class and confidence
        """
        # Preprocess the image (resize, normalize, etc.)
        # This should match your model's expected input format
        processed_img = self.preprocess_image(image)
        
        # Run prediction (replace with your model's prediction code)
        # predictions = self.model.predict(processed_img)
        
        # For now, return a dummy prediction
        # Replace this with actual model inference
        import random
        predicted_class = random.choice(self.class_names)
        confidence = round(random.uniform(0.8, 0.99), 2)
        
        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess the image for the model"""
        # Resize to expected input size (update dimensions as needed)
        image = image.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(image) / 255.0
        
        # Add batch dimension if needed
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)
            
        return img_array

# Initialize the predictor
predictor = DiseasePredictor()

@app.get("/")
async def root():
    return {"message": "Crop Disease Prediction API is running"}

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
        
        # Make prediction
        print("Making prediction...")
        result = predictor.predict(image)
        print(f"Prediction result: {result}")
        
        # Add crop type to result if provided
        if crop_type:
            result["crop_type"] = crop_type
        
        # Add filename to result
        result["filename"] = file.filename
        
        return result
        
    except Exception as e:
        error_msg = f"Error processing image: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
