#!/bin/bash

# 🚂 Railway Configuration Verification Script

echo "🚂 Railway Configuration Check"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "apps/api/package.json" ]; then
    echo "❌ Please run this script from the monorepo root directory"
    exit 1
fi

cd apps/api

echo "📋 Checking Railway configuration files..."

# Check railway.toml
if [ -f "railway.toml" ]; then
    echo "✅ railway.toml found"
    if grep -q "NODE_VERSION.*20" railway.toml; then
        echo "✅ Node.js 20 specified in railway.toml"
    else
        echo "⚠️  NODE_VERSION not set to 20 in railway.toml"
    fi
else
    echo "❌ railway.toml missing"
fi

# Check nixpacks.toml
if [ -f "nixpacks.toml" ]; then
    echo "✅ nixpacks.toml found"
else
    echo "❌ nixpacks.toml missing"
fi

# Check .nvmrc
if [ -f ".nvmrc" ]; then
    echo "✅ .nvmrc found ($(cat .nvmrc))"
else
    echo "❌ .nvmrc missing"
fi

# Check package.json engines
if grep -q '"engines"' package.json; then
    echo "✅ Node.js engine specified in package.json"
    grep -A3 '"engines"' package.json
else
    echo "❌ No engines specified in package.json"
fi

echo ""
echo "📦 Checking NestJS version compatibility..."
NESTJS_VERSION=$(grep '"@nestjs/core"' package.json | sed 's/.*"@nestjs\/core": "\([^"]*\)".*/\1/')
echo "   Current NestJS version: $NESTJS_VERSION"

if [[ $NESTJS_VERSION == ^11* ]] || [[ $NESTJS_VERSION == ^10* ]]; then
    echo "✅ NestJS version compatible"
else
    echo "⚠️  Check NestJS version compatibility"
fi

echo ""
echo "🔨 Testing build process..."
yarn build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
fi

echo ""
echo "🎯 Railway Deployment Readiness:"
echo "================================="
if [ -f "railway.toml" ] && [ -f ".nvmrc" ] && [ -f "nixpacks.toml" ] && grep -q '"engines"' package.json; then
    echo "✅ All configuration files present"
    echo "✅ Ready for Railway deployment"
    echo ""
    echo "📋 Next steps:"
    echo "1. Commit your changes: git add . && git commit -m 'Configure Railway for Node.js 20'"
    echo "2. Push to GitHub: git push"
    echo "3. Deploy to Railway: railway up"
else
    echo "❌ Missing configuration files"
    echo "   Run the Railway fix script to create missing files"
fi
