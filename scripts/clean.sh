#!/bin/bash

# 🧹 Clean build artifacts and reset development environment

echo "🧹 Cleaning SupaSpend Development Environment"
echo "============================================="

# Clean root level artifacts
echo "📁 Cleaning root artifacts..."
rm -rf .turbo .next

# Clean individual app artifacts
echo "🌐 Cleaning frontend..."
if [ -d "apps/web" ]; then
    cd apps/web
    rm -rf .next .turbo dist node_modules/.cache
    cd ../..
fi

echo "⚙️ Cleaning backend..."
if [ -d "apps/api" ]; then
    cd apps/api
    rm -rf dist .turbo node_modules/.cache
    cd ../..
fi

echo "📦 Cleaning shared package..."
if [ -d "packages/shared" ]; then
    cd packages/shared
    rm -rf dist .turbo node_modules/.cache
    cd ../..
fi

# Clean global node_modules cache
echo "🗑️ Cleaning node_modules caches..."
find . -name "node_modules/.cache" -type d -exec rm -rf {} + 2>/dev/null || true

echo "💎 Reinstalling dependencies..."
yarn install

echo "🔨 Rebuilding shared package..."
cd packages/shared && yarn build && cd ../..

echo "✅ Clean complete! Ready for development."
echo ""
echo "🚀 Start development with:"
echo "   yarn dev      # Start both apps"
echo "   yarn dev:web  # Start frontend only"
echo "   yarn dev:api  # Start backend only"
