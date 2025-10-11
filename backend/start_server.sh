#!/bin/bash

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created virtual environment"
fi

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
echo "Starting FastAPI server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
