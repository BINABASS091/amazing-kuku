#!/bin/bash

# Remove existing build artifacts and dependencies
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json dist .vite

# Clear npm cache
echo "♻️  Clearing npm cache..."
npm cache clean --force

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install required Babel plugin
echo "🔧 Installing Babel plugin..."
npm install --save-dev @babel/plugin-transform-react-jsx

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Done! Try running 'npm run dev' to start the development server."
