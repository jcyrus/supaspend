# 🚀 Deployment Guide

This guide will help you deploy your SupaSpend monorepo to production using Vercel (frontend) and Railway (backend).

## 📋 **Prerequisites**

- [ ] GitHub repository with your code
- [ ] Vercel account
- [ ] Railway account
- [ ] Supabase project with production database

## 🚂 **Step 1: Deploy Backend to Railway**

### 1.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### 1.2 Deploy NestJS API

1. **Create New Project** in Railway
2. **Connect GitHub Repository**
3. **Select** `supaspend` repository
4. **Set Root Directory** to `apps/api`
5. **Configure Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=4444
   SUPABASE_URL=your-production-supabase-url
   SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   FRONTEND_URL=https://your-app.vercel.app
   ```

### 1.3 Configure Build Settings

Railway should auto-detect the build configuration from `railway.toml`, but verify:

- **Build Command**: `yarn build`
- **Start Command**: `yarn start:prod`
- **Health Check Path**: `/health`
- **Node.js Version**: 20.x (specified in configuration files)

### 1.3a Troubleshooting Node.js Version Issues

If you encounter the error: `The engine "node" is incompatible with this module. Expected version ">= 20". Got "18.x"`

**Solution Options:**

**Option A: Force Node.js 20 (Recommended)**

1. Railway should use Node.js 20 from the configuration files
2. If it doesn't work, add environment variable in Railway dashboard:
   - `NODE_VERSION = 20`
3. Redeploy the service

**Option B: Downgrade NestJS for Node.js 18**

```bash
# Run the downgrade script locally
./scripts/downgrade-nestjs.sh

# Redeploy on Railway
```

**Option C: Manual Railway Dashboard Fix**

1. Go to Railway Dashboard → Your Service → Settings
2. Add Environment Variable: `NODE_VERSION = 20`
3. Trigger a new deployment

### 1.4 Get Your API URL

After deployment, Railway will provide a URL like:

```
https://supaspend-api-production-xxxx.up.railway.app
```

Save this URL - you'll need it for Vercel configuration.

## ⚡ **Step 2: Deploy Frontend to Vercel**

### 2.1 Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. **Import Git Repository**
3. **Select** your `supaspend` repository
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave empty (monorepo auto-detected)
   - **Build Command**: `yarn build:shared && cd apps/web && yarn build`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `yarn install`

### 2.2 Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_API_URL=https://your-railway-api-url.up.railway.app
```

### 2.3 Update Domain Settings

1. **Custom Domain** (optional): Add your custom domain
2. **Update CORS**: Go back to Railway and update `FRONTEND_URL` environment variable with your Vercel URL

## 🔄 **Step 3: Final Configuration**

### 3.1 Update vercel.json

Update the rewrite URL in `/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/v2/:path*",
      "destination": "https://your-actual-railway-url.up.railway.app/:path*"
    }
  ]
}
```

### 3.2 Test Deployment

1. **Check Frontend**: Visit your Vercel URL
2. **Check Backend**: Visit `https://your-railway-url.up.railway.app/health`
3. **Test Integration**: Verify frontend can communicate with backend

## 🧪 **Step 4: Verification Checklist**

### Backend (Railway)

- [ ] API responds at `/health` endpoint
- [ ] Environment variables configured
- [ ] CORS allows your frontend domain
- [ ] Build completes successfully
- [ ] Health checks passing

### Frontend (Vercel)

- [ ] App loads without errors
- [ ] Environment variables configured
- [ ] API calls reach backend successfully
- [ ] Authentication works
- [ ] All pages render correctly

### Database (Supabase)

- [ ] Production database setup complete
- [ ] RLS policies active
- [ ] Service role key configured
- [ ] Connection from both apps working

## 🔧 **Step 5: Post-Deployment**

### 5.1 Monitor Deployments

- **Railway**: Monitor logs and metrics in Railway dashboard
- **Vercel**: Check function logs and analytics in Vercel dashboard
- **Supabase**: Monitor database performance and queries

### 5.2 Set Up Domain (Optional)

1. **Purchase domain** from your preferred registrar
2. **Configure Vercel**: Add custom domain in Vercel dashboard
3. **Update Railway**: Update `FRONTEND_URL` environment variable
4. **Update Supabase**: Add domain to allowed origins if needed

### 5.3 Enable Auto-Deployments

Both platforms support automatic deployments:

- **Vercel**: Auto-deploys on `main` branch push
- **Railway**: Auto-deploys on `main` branch push to `apps/api`

## 📊 **Cost Estimation**

### Development (Free Tier)

- **Vercel**: Free (Hobby plan)
- **Railway**: $5/month (500 hours included)
- **Supabase**: Free tier
- **Total**: ~$5/month

### Production

- **Vercel**: $20/month (Pro plan)
- **Railway**: $5-20/month (based on usage)
- **Supabase**: $25/month (Pro plan)
- **Total**: $50-65/month

## 🚨 **Troubleshooting**

### Common Issues

#### CORS Errors

- Verify `FRONTEND_URL` in Railway environment variables
- Check Vercel domain is correct
- Ensure wildcard domains are configured correctly

#### Build Failures

```bash
# Railway build issues
yarn build:shared  # Run this first
yarn build        # Then build API

# Vercel build issues
yarn install      # Ensure all dependencies installed
yarn build:shared # Build shared package first
```

#### Environment Variables

- Double-check all URLs and keys
- Ensure production Supabase project is used
- Verify environment variable names match exactly

#### Health Check Failures

- Verify `/health` endpoint works locally
- Check Railway logs for startup errors
- Ensure port 4444 is used consistently

## 📞 **Support**

If you encounter issues:

1. **Check deployment logs** in Railway and Vercel dashboards
2. **Verify environment variables** are set correctly
3. **Test locally** with production environment variables
4. **Check CORS configuration** between frontend and backend

## 🎉 **Success!**

Once deployed, you'll have:

- ✅ **Production-ready monorepo** with separate frontend/backend
- ✅ **Auto-deployments** on code changes
- ✅ **Scalable architecture** with professional hosting
- ✅ **Health monitoring** and error tracking
- ✅ **Custom domains** support

Your SupaSpend app is now ready for production! 🚀
