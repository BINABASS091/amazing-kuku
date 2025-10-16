#!/bin/bash

# Quick Render Setup Script
echo "🎯 Render Deployment Configuration"
echo "=================================="

if [ -z "$1" ]; then
    echo ""
    echo "📋 **Usage:**"
    echo "   ./configure-render.sh YOUR_RENDER_URL"
    echo ""
    echo "📝 **Example:**"
    echo "   ./configure-render.sh https://amazing-kuku-backend.onrender.com"
    echo ""
    echo "🔗 **Get your URL from Render after deployment completes**"
    exit 1
fi

RENDER_URL=$1

echo ""
echo "🔧 Configuring Amazing Kuku for Render backend..."
echo "Backend URL: $RENDER_URL"

# Update production environment
echo "📝 Updating .env.production..."
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$RENDER_URL|" .env.production

echo "✅ Configuration updated!"
echo ""
echo "🧪 Testing backend connectivity..."

# Test backend health
if command -v curl &> /dev/null; then
    echo "Testing: $RENDER_URL/health"
    if curl -s "$RENDER_URL/health" | grep -q "status"; then
        echo "✅ Backend is responding!"
    else
        echo "⚠️  Backend might still be starting up..."
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
echo "🌐 Your app will now use: $RENDER_URL"
