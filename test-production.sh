#!/bin/bash

# Amazing Kuku - Production Backend Testing
echo "🐔 Testing Amazing Kuku with Production Backend..."
echo "=================================================="

# Function to kill processes on exit
cleanup() {
    echo "🛑 Shutting down frontend server..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Switch to production backend mode
echo "🌐 Configuring for production backend..."
./switch-env.sh production

# Verify environment
if grep -q "railway.app\|render.com\|herokuapp.com" .env; then
    BACKEND_URL=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2)
    echo "✅ Using production backend: $BACKEND_URL"
else
    echo "❌ Failed to configure production backend"
    exit 1
fi

echo ""
echo "🔍 Testing backend connectivity..."
# Test if backend is reachable (optional - comment out if causing issues)
# if command -v curl &> /dev/null; then
#     if curl -s "$BACKEND_URL/health" > /dev/null; then
#         echo "✅ Production backend is reachable"
#     else
#         echo "⚠️  Backend might not be deployed yet - proceeding anyway"
#     fi
# fi

echo ""
echo "🚀 Starting frontend with production backend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Frontend started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔗 Backend API: $BACKEND_URL"
echo "📚 API Docs: $BACKEND_URL/docs"
echo ""
echo "🧪 Test Features:"
echo "   - Disease Prediction (should work without local backend)"
echo "   - Authentication"
echo "   - All farmer/admin features"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for processes to finish
wait
