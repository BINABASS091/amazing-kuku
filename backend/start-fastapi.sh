#!/bin/bash

echo "🐔 Starting Amazing Kuku Backend Server..."

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate the virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install FastAPI dependencies
echo "📋 Installing FastAPI dependencies..."
pip install --upgrade pip
pip install -r requirements-fastapi.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment file..."
    cat > .env << EOL
# FastAPI Configuration
DEBUG=True
HOST=0.0.0.0
PORT=8000

# External APIs
DISEASE_PREDICTION_API_URL=https://apipoultrydisease.onrender.com/predict/
EOL
fi

# Start the FastAPI server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔗 Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"

uvicorn main:app --reload --host 0.0.0.0 --port 8000
