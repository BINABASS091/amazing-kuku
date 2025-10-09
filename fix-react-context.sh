#!/bin/bash

# Clean up
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json dist .vite

# Install required dependencies
echo "📦 Installing dependencies..."
npm install

# Create a minimal Vite config
echo "⚙️  Creating minimal Vite config..."
cat > vite.config.ts << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    })
  ]
});
EOL

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Done! Try running 'npm run dev' to start the development server."
