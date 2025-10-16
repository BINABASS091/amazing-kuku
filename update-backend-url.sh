#!/bin/bash

# Update Backend URL Script
if [ -z "$1" ]; then
    echo "Usage: ./update-backend-url.sh YOUR_BACKEND_URL"
    echo "Example: ./update-backend-url.sh https://amazing-kuku-backend.onrender.com"
    exit 1
fi

BACKEND_URL=$1

echo "🔧 Updating backend URL to: $BACKEND_URL"

# Update .env.production
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$BACKEND_URL|" .env.production

echo "✅ Updated .env.production"
echo "🧪 Testing backend connectivity..."

# Test backend
if command -v curl &> /dev/null; then
    echo "Testing: $BACKEND_URL/health"
    curl -s "$BACKEND_URL/health" || echo "⚠️  Backend not responding yet (may still be starting)"
fi

echo ""
echo "🚀 Ready to test! Run:"
echo "   ./test-production.sh"
echo ""
echo "📱 Or manually:"
echo "   ./switch-env.sh production"
echo "   npm run dev"
