# Vercel Deployment Configuration

## ✅ Current Configuration (Updated)

The `vercel.json` file is now configured correctly. However, if you encounter issues, use these manual settings in the Vercel dashboard:

## Build & Development Settings

### Option 1: Use vercel.json (Recommended)

The project now has a working `vercel.json` with:

```json
{
  "buildCommand": "yarn build:shared && yarn build:web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "yarn install"
}
```

### Option 2: Manual Dashboard Configuration

If you prefer to configure in the dashboard or remove `vercel.json`:

- **Framework Preset**: Next.js
- **Root Directory**: Leave empty (use repository root)
- **Build Command**: `yarn build:shared && yarn build:web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `yarn install`

## Environment Variables

Set these in Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_API_URL=https://your-railway-api-url.up.railway.app
```

## Troubleshooting

### If you get "Command not found" errors:

1. Make sure you're using the repository root (not `apps/web` as root directory)
2. Ensure the `build:shared` and `build:web` commands exist in root `package.json`
3. Try the manual build command: `cd packages/shared && yarn build && cd ../apps/web && yarn build`

### If you get function runtime errors:

- The simplified `vercel.json` should resolve this
- Alternatively, remove `vercel.json` and use dashboard-only configuration

## Available Build Commands

These commands are now available in the root package.json:

- `yarn build:shared` - Build shared package
- `yarn build:web` - Build web app
- `yarn build:api` - Build API app
- `yarn build` - Build all packages
