# Crop Disease Prediction API

This is the backend service for the Crop Disease Prediction feature. It provides a REST API for making predictions on crop images.

## Setup Instructions

1. **Install Python Dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Add Your Model**
   - Place your trained model files in the `backend/models` directory
   - Update the `DiseasePredictor` class in `main.py` to load and use your model

3. **Start the Server**
   ```bash
   # Make the script executable if needed
   chmod +x start_server.sh
   
   # Start the server
   ./start_server.sh
   ```
   The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `POST /predict` - Make a prediction on an image
  - Parameters:
    - `file`: Image file to analyze
    - `crop_type`: (Optional) Type of crop in the image

## Environment Variables

Create a `.env` file in the backend directory with:

```
# FastAPI settings
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Add any other environment variables your model needs
```

## Testing the API

You can test the API using curl:

```bash
curl -X 'POST' \
  'http://localhost:8000/predict' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/image.jpg' \
  -F 'crop_type=tomato'
```

## Deployment

For production deployment, you might want to use a production-grade ASGI server like Gunicorn with Uvicorn workers:

```bash
pip install gunicorn

# Start with 4 worker processes
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```
