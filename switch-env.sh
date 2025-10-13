#!/bin/bash

# Amazing Kuku - Environment Switcher
echo "🐔 Amazing Kuku Environment Switcher"
echo "======================================"

if [ "$1" = "local" ]; then
    echo "🏠 Switching to LOCAL backend mode..."
    cp .env.local .env
    echo "✅ Now using: http://localhost:8000"
    echo "💡 Start your local backend with: cd backend && python main.py"
    
elif [ "$1" = "production" ]; then
    echo "🌐 Switching to PRODUCTION backend mode..."
    cp .env.production .env
    echo "✅ Now using: https://amazing-kuku-backend.railway.app"
    echo "💡 No local backend needed - using deployed backend"
    
else
    echo "Usage: ./switch-env.sh [local|production]"
    echo ""
    echo "Commands:"
    echo "  local      - Use local backend (localhost:8000)"
    echo "  production - Use deployed backend (Railway/Render)"
    echo ""
    echo "Current configuration:"
    if grep -q "localhost:8000" .env 2>/dev/null; then
        echo "📍 Mode: LOCAL backend"
    elif grep -q "railway.app\|render.com\|herokuapp.com" .env 2>/dev/null; then
        echo "📍 Mode: PRODUCTION backend"
    else
        echo "📍 Mode: Not configured"
    fi
    exit 1
fi

echo ""
echo "🚀 Ready to test! Run: npm run dev"
