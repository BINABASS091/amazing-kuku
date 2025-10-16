#!/bin/bash

# Configure Amazing Kuku for Vercel Backend
echo "🎯 Vercel Backend Configuration"
echo "==============================="

if [ -z "$1" ]; then
    echo ""
    echo "📋 **Usage:**"
    echo "   ./configure-vercel.sh YOUR_VERCEL_URL"
    echo ""
    echo "📝 **Example:**"
    echo "   ./configure-vercel.sh https://amazing-kuku-backend.vercel.app"
    echo ""
    echo "🔗 **Get your URL from Vercel after deployment completes**"
    exit 1
fi

VERCEL_URL=$1

echo ""
echo "🔧 Configuring Amazing Kuku for Vercel backend..."
echo "Backend URL: $VERCEL_URL"

# Update production environment
echo "📝 Updating .env.production..."
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$VERCEL_URL|" .env.production

echo "✅ Configuration updated!"
echo ""
echo "🧪 Testing backend connectivity..."

# Test backend health
if command -v curl &> /dev/null; then
    echo "Testing: $VERCEL_URL/health"
    if curl -s "$VERCEL_URL/health" | grep -q "status"; then
        echo "✅ Backend is responding!"
    else
        echo "⚠️  Backend might still be starting up (Vercel serverless functions can take a moment)..."
    fi
else
    echo "⚠️  curl not available - skipping connectivity test"
fi

echo ""
echo "🚀 **Ready to test!**"
echo ""
echo "Quick test commands:"
echo "   ./test-production.sh                    # Test with production backend"
echo "   ./switch-env.sh production && npm run dev  # Manual test"
echo ""
echo "🌐 Your app will now use: $VERCEL_URL"
