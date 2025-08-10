# 📚 Documentation

This directory contains all documentation for the SupaSpend project.

## 📋 Available Documentation

### [🚀 Deployment Guide](./DEPLOYMENT.md)

Complete guide for deploying SupaSpend to production using Vercel (frontend) and Railway (backend).

- Railway backend deployment
- Vercel frontend deployment
- Environment configuration
- Domain setup
- Troubleshooting

## 📁 Related Documentation

### Project Root

- [`README.md`](../README.md) - Main project documentation and setup
- [`database/README.md`](../database/README.md) - Database setup and migration guide

### Individual Apps

- [`apps/web/`](../apps/web/) - Next.js frontend documentation
- [`apps/api/`](../apps/api/) - NestJS backend documentation
- [`packages/shared/`](../packages/shared/) - Shared package documentation

## 🔧 Development Resources

### Scripts

- [`scripts/verify-deployment.sh`](../scripts/verify-deployment.sh) - Pre-deployment verification
- [`scripts/clean.sh`](../scripts/clean.sh) - Clean development environment
- [`scripts/health-check.sh`](../scripts/health-check.sh) - Project health check

### Configuration Files

- [`turbo.json`](../turbo.json) - Turborepo configuration
- [`vercel.json`](../vercel.json) - Vercel deployment configuration
- [`apps/api/railway.toml`](../apps/api/railway.toml) - Railway deployment configuration

## 🆘 Quick Reference

### Development Commands

```bash
# Start development
yarn dev                # Both apps
yarn dev:web           # Frontend only
yarn dev:api           # Backend only

# Build for production
yarn build             # All packages
yarn build:web         # Frontend only
yarn build:api         # Backend only

# Utility scripts
./scripts/health-check.sh     # Check project health
./scripts/clean.sh           # Clean and reset environment
./scripts/verify-deployment.sh # Pre-deployment verification
```

### Important URLs

- **Frontend Dev**: http://localhost:3333
- **Backend Dev**: http://localhost:4444
- **Health Check**: http://localhost:4444/health

### Environment Files

```
apps/web/.env.local      # Frontend environment
apps/api/.env            # Backend environment
```
