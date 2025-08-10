#!/bin/bash

# 🔍 Check project health and configuration

echo "🏥 SupaSpend Health Check"
echo "========================"

# Check monorepo structure
echo "📁 Checking project structure..."
REQUIRED_DIRS=("apps/web" "apps/api" "packages/shared" "database" "docs" "scripts")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir - Missing!"
    fi
done

# Check required files
echo ""
echo "📄 Checking configuration files..."
REQUIRED_FILES=("package.json" "turbo.json" "vercel.json" "apps/api/railway.toml" "yarn.lock")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - Missing!"
    fi
done

# Check environment files
echo ""
echo "🔐 Checking environment configuration..."
ENV_FILES=("apps/web/.env.local" "apps/api/.env" "apps/web/.env.example" "apps/api/.env.example")
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "⚠️  $file - Not found (may be needed)"
    fi
done

# Check for common issues
echo ""
echo "🕵️ Checking for common issues..."

# Check for multiple lock files
LOCK_FILES=$(find . -name "package-lock.json" -o -name "yarn.lock" | grep -v "./yarn.lock")
if [ -z "$LOCK_FILES" ]; then
    echo "✅ No duplicate lock files"
else
    echo "⚠️  Found duplicate lock files:"
    echo "$LOCK_FILES"
fi

# Check for build artifacts in wrong places
if [ -d ".next" ] || [ -d ".turbo" ]; then
    echo "⚠️  Build artifacts found in root (should be cleaned)"
else
    echo "✅ No build artifacts in root"
fi

# Check git status
echo ""
echo "📋 Git status:"
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    UNTRACKED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo "   Branch: $BRANCH"
    echo "   Modified files: $UNTRACKED"
else
    echo "❌ Not a git repository"
fi

echo ""
echo "🎯 Health check complete!"
