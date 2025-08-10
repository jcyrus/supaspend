#!/bin/bash

# 🧪 Pre-deployment verification script
# This script tests that everything is ready for deployment

echo "🚀 SupaSpend Deployment Verification"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo "❌ Please run this script from the monorepo root directory"
    exit 1
fi

echo "📁 Checking monorepo structure..."
if [ -d "apps/web" ] && [ -d "apps/api" ] && [ -d "packages/shared" ]; then
    echo "✅ Monorepo structure correct"
else
    echo "❌ Missing required directories"
    exit 1
fi

echo "📦 Installing dependencies..."
yarn install > /dev/null 2>&1

echo "🔨 Building shared package..."
cd packages/shared && yarn build > /dev/null 2>&1 && cd ../..

echo "🌐 Building frontend..."
yarn build:web > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "⚙️ Building backend..."
yarn build:api > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi

echo "🩺 Testing health check..."
# Start API in background for testing
cd apps/api
yarn start:prod > /dev/null 2>&1 &
API_PID=$!
cd ../..

# Wait for API to start
sleep 3

# Test health check
HEALTH_STATUS=$(curl -s http://localhost:4444/health | grep -o '"status":"ok"' || echo "failed")
if [ "$HEALTH_STATUS" = '"status":"ok"' ]; then
    echo "✅ Health check endpoint working"
else
    echo "❌ Health check failed"
fi

# Clean up
kill $API_PID 2>/dev/null

echo "📋 Checking required files..."
if [ -f "vercel.json" ]; then
    echo "✅ Vercel configuration found"
else
    echo "❌ Missing vercel.json"
fi

if [ -f "apps/api/railway.toml" ]; then
    echo "✅ Railway configuration found"
else
    echo "❌ Missing railway.toml"
fi

if [ -f "docs/DEPLOYMENT.md" ]; then
    echo "✅ Deployment guide found"
else
    echo "❌ Missing deployment guide"
fi

echo ""
echo "🎉 Verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Follow the DEPLOYMENT.md guide"
echo "3. Deploy to Railway (backend) and Vercel (frontend)"
echo ""
echo "🔗 Useful links:"
echo "   Railway: https://railway.app"
echo "   Vercel:  https://vercel.com"
echo "   Deployment Guide: docs/DEPLOYMENT.md"
