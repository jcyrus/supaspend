#!/bin/bash

# 🔧 NestJS Downgrade Script for Node.js 18 Compatibility
# Run this if Railway still can't use Node.js 20

echo "🔧 Downgrading NestJS for Node.js 18 compatibility..."

cd "$(dirname "$0")/../apps/api"

echo "📦 Installing Node.js 18 compatible versions..."

# Downgrade NestJS to version 10 (compatible with Node.js 18)
yarn add @nestjs/common@^10.0.0 @nestjs/core@^10.0.0 @nestjs/platform-express@^10.0.0
yarn add -D @nestjs/cli@^10.0.0 @nestjs/schematics@^10.0.0 @nestjs/testing@^10.0.0

# Update other related packages
yarn add @nestjs/swagger@^7.0.0 @nestjs/jwt@^10.0.0 @nestjs/passport@^10.0.0

echo "✅ NestJS downgraded to v10 (Node.js 18 compatible)"
echo "📋 Updated packages:"
echo "   - @nestjs/common: ^10.0.0"
echo "   - @nestjs/core: ^10.0.0" 
echo "   - @nestjs/platform-express: ^10.0.0"
echo ""
echo "🚂 Now try deploying to Railway again"
echo "   railway up"
