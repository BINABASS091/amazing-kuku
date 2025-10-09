#!/bin/bash
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "Cleaning npm cache..."
npm cache clean --force

echo "Installing dependencies..."
npm install

echo "Building the application..."
npm run build
