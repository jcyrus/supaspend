# SupaSpend - Expense Management System

A modern monorepo expense management application built with Next.js 15 frontend, NestJS backend, and Supabase.

## 🏗️ Architecture

This is a **Turborepo monorepo** containing:

- **Frontend**: Next.js 15 app with TypeScript (`apps/web`)
- **Backend**: NestJS API server (`apps/api`)
- **Shared**: Common types, utilities, and constants (`packages/shared`)

## Features

- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 💰 **Multi-Currency Support** - USD, VND, IDR, PHP currencies
- 👥 **User Management** - Admin can create and manage users
- 💼 **Wallet System** - Multi-wallet support per user
- 📊 **Expense Tracking** - Create, edit, and track expenses
- 💸 **Fund Management** - Admins can fund user accounts
- 📈 **Reports** - Comprehensive reporting and analytics
- 🔒 **Role-Based Access** - User, Admin, and Superadmin roles
- 🧪 **Built-in Testing** - API testing suite and database validation

## Tech Stack

- **Monorepo**: Turborepo with Yarn workspaces
- **Frontend**: Next.js 15 with TypeScript (Port 3333)
- **Backend**: NestJS with TypeScript (Port 4444)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Package Manager**: Yarn with workspaces

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd supaspend
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Create environment files for both apps:

   ```bash
   # Frontend environment
   cp apps/web/.env.example apps/web/.env.local

   # Backend environment
   cp apps/api/.env.example apps/api/.env
   ```

   Update the environment files with your Supabase credentials:

   **apps/web/.env.local:**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_API_URL=http://localhost:4444
   ```

   **apps/api/.env:**

   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=4444
   ```

4. **Set up the database**

   Run the consolidated database setup script:

   ```bash
   # Using Supabase CLI (recommended)
   supabase db reset

   # Or directly with psql
   psql -h your-db-host -U postgres -d your-database -f database/DATABASE_SETUP.sql
   ```

5. **Build shared packages**

   ```bash
   yarn build:shared
   ```

6. **Start development servers**

   Option 1 - Start both apps simultaneously:

   ```bash
   yarn dev
   ```

   Option 2 - Start individually:

   ```bash
   # Terminal 1 - API Server (Port 4444)
   yarn dev:api

   # Terminal 2 - Web App (Port 3333)
   yarn dev:web
   ```

7. **Access the applications**
   - **Frontend**: [http://localhost:3333](http://localhost:3333)
   - **Backend API**: [http://localhost:4444](http://localhost:4444)

8. **Create first admin user**
   - Go to your Supabase Dashboard → Authentication → Users
   - Click "Add user" and create your admin account
   - Or sign up through the frontend app

9. **Promote first user to admin**

   After creating your account, promote yourself to admin using SQL:

   ```sql
   -- Replace with your actual email address
   SELECT public.change_user_role('your-email@example.com', 'admin');
   ```

## Monorepo Structure

```
supaspend/
├── apps/
│   ├── web/                 # Next.js frontend (Port 3333)
│   │   ├── src/
│   │   │   ├── app/         # Next.js app router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Frontend utilities
│   │   │   └── types/       # Frontend-specific types
│   │   ├── public/
│   │   └── package.json
│   └── api/                 # NestJS backend (Port 4444)
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── main.ts
│       │   ├── health/      # Health check endpoints
│       │   └── modules/     # API modules (auth, users, etc.)
│       ├── railway.toml     # Railway deployment config
│       └── package.json
├── packages/
│   └── shared/              # Shared code between apps
│       ├── src/
│       │   ├── types/       # Database types and schemas
│       │   ├── utils/       # Common utilities
│       │   └── constants/   # App constants
│       └── package.json
├── database/                # Database setup and migration files
│   ├── DATABASE_SETUP.sql   # Complete database schema
│   ├── validate_database_setup.sql # Validation script
│   └── README.md           # Database documentation
├── docs/                   # Project documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── README.md          # Documentation index
├── scripts/                # Development and utility scripts
│   ├── verify-deployment.sh # Pre-deployment verification
│   ├── clean.sh           # Environment cleanup
│   └── health-check.sh    # Project health check
├── supabase/              # Supabase CLI files (development)
│   └── migrations/        # Database migrations
├── turbo.json             # Turborepo configuration
├── vercel.json            # Vercel deployment config
├── package.json           # Root workspace configuration
└── yarn.lock             # Yarn lockfile
```

## Development Scripts

### Root Level Commands

```bash
# Install all dependencies
yarn install

# Start both frontend and backend
yarn dev

# Build all packages and apps
yarn build

# Start individual apps
yarn dev:web        # Start frontend only (port 3333)
yarn dev:api        # Start backend only (port 4444)

# Build specific packages
yarn build:shared   # Build shared package
yarn build:web      # Build frontend
yarn build:api      # Build backend

# Clean all build artifacts
yarn clean

# Lint all packages
yarn lint
```

### App-Specific Commands

```bash
# Frontend (apps/web)
cd apps/web
yarn dev            # Start Next.js dev server
yarn build          # Build for production
yarn start          # Start production server
yarn lint           # Lint frontend code

# Backend (apps/api)
cd apps/api
yarn dev            # Start NestJS dev server
yarn build          # Build for production
yarn start:prod     # Start production server
yarn test           # Run tests

# Shared Package (packages/shared)
cd packages/shared
yarn build          # Build shared types and utilities
yarn dev            # Watch mode for development
```

## Project Architecture

### Frontend (apps/web)

- **Next.js 15** with App Router
- **Port**: 3333
- **Purpose**: User interface and client-side functionality
- **Key Features**:
  - Server-side rendering
  - API route integration (transitioning to NestJS)
  - shadcn/ui components
  - Tailwind CSS styling

### Backend (apps/api)

- **NestJS** with TypeScript
- **Port**: 4444
- **Purpose**: API server and business logic
- **Key Features**:
  - RESTful API endpoints
  - Supabase integration
  - CORS enabled for frontend
  - Modular architecture

### Shared Package (packages/shared)

- **Purpose**: Code shared between frontend and backend
- **Contents**:
  - Database types from Supabase
  - API request/response schemas
  - Common utilities (currency, date formatting)
  - Application constants
  - Validation schemas

## API Migration Status

🚧 **Currently migrating from Next.js API routes to NestJS backend**

### Completed

- ✅ Monorepo setup with Turborepo
- ✅ Frontend running on port 3333
- ✅ Backend scaffold running on port 4444
- ✅ Shared package with types and utilities
- ✅ CORS configuration for frontend-backend communication

### In Progress

- 🔄 Migrating authentication endpoints
- 🔄 User management APIs
- 🔄 Expense tracking endpoints
- 🔄 Fund management APIs

### Next.js API Routes (Legacy - being migrated)

- `apps/web/src/app/api/*` - Original API routes (will be removed)

### NestJS API Endpoints (New)

- `apps/api/src/modules/*` - New structured API modules

## Database Setup

This project uses a **single consolidated SQL script** for easy setup:

- **`database/DATABASE_SETUP.sql`** - Complete database schema
  - All tables, enums, and indexes
  - Security functions with RLS policies
  - User management triggers
  - Wallet creation functions
  - Transaction management

### Key Database Features

- ✅ **Single-script installation** for new developers
- ✅ **Complete RLS security** with role-based access
- ✅ **Automatic user profile creation** via triggers
- ✅ **Multi-currency wallet system** with balance calculations
- ✅ **Audit trails** for all transactions
- ✅ **Foreign key constraints** for data integrity

## Key Features

### User Management

- Admins can create users with different roles
- Automatic wallet creation for new users
- Profile management with role-based permissions

### Wallet System

- Multiple wallets per user (different currencies)
- Real-time balance calculations
- Transaction history tracking
- Secure wallet creation via database functions

### Expense Management

- Create and categorize expenses
- Edit history with audit trails
- Wallet-based expense deduction

### Fund Management

- Admin funding capabilities
- Transaction logging
- Balance reconciliation

### Security

- Row Level Security (RLS) policies
- Service role access for admin operations
- Secure database functions with SECURITY DEFINER
- Complete audit trails

## Development Tools

### API Testing (Legacy)

- **Legacy URL**: `http://localhost:3333/test-api` (Next.js routes)
- **New API Base**: `http://localhost:4444` (NestJS endpoints)

### Environment Configuration

Each app has its own environment configuration:

**Frontend (apps/web/.env.local):**

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_API_URL=http://localhost:4444
```

**Backend (apps/api/.env):**

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PORT=4444
CORS_ORIGIN=http://localhost:3333
```

## API Architecture

### Current State (Transition Period)

**Legacy Next.js API Routes (apps/web/src/app/api/):**

- Still active during migration
- Will be deprecated as NestJS endpoints are completed

**New NestJS API (apps/api/src/):**

- Modern, scalable architecture
- Proper separation of concerns
- Module-based organization

### API Endpoints (Migration Status)

#### Completed NestJS Endpoints

- `GET /` - Health check endpoint

#### Legacy Next.js Routes (Being Migrated)

- `POST /api/auth/*` - Authentication endpoints
- `GET /api/balance` - User balance information
- `GET/POST /api/transactions/expenses` - Expense management
- `GET /api/admin/users` - User management (Admin only)
- `POST /api/admin/funds` - Fund management (Admin only)
- `GET /api/admin/wallets` - Wallet management (Admin only)

#### Migration Priority

1. **Authentication endpoints** - Core security functionality
2. **User management** - Admin operations
3. **Balance and wallet operations** - Core financial features
4. **Expense management** - Main user functionality
5. **Reporting endpoints** - Analytics features

## Troubleshooting

### Common Issues

#### Port Conflicts

- Frontend: Make sure port 3333 is available
- Backend: Make sure port 4444 is available
- Check with: `lsof -i :3333` and `lsof -i :4444`

#### Monorepo Issues

```bash
# Clear all node_modules and reinstall
yarn clean
yarn install

# Rebuild shared package
yarn build:shared

# Restart development servers
yarn dev
```

#### Environment Variables

- Ensure both apps have proper `.env` files
- Frontend: `apps/web/.env.local`
- Backend: `apps/api/.env`
- Shared Supabase URLs must match

#### CORS Errors

- Verify backend CORS is configured for frontend port
- Check `apps/api/src/main.ts` CORS settings
- Ensure `NEXT_PUBLIC_API_URL` points to correct backend

### Debug Commands

**Check app status:**

```bash
# Check if ports are in use
lsof -i :3333 # Frontend
lsof -i :4444 # Backend

# Test API health
curl http://localhost:4444

# Check frontend
curl http://localhost:3333
```

**Database debugging:**

```sql
-- Check user setup
SELECT * FROM public.get_user_info('your-email@example.com');

-- Verify admin role
SELECT role FROM public.users WHERE id = auth.uid();

-- Check wallet creation
SELECT * FROM public.wallets WHERE user_id = auth.uid();

-- Test balance function
SELECT public.get_user_balance(auth.uid());
```

## Production Deployment

### Frontend (Vercel/Netlify)

1. **Build the frontend app**

   ```bash
   yarn build:shared
   yarn build:web
   ```

2. **Deploy apps/web directory**
   - Set build command: `yarn build`
   - Set output directory: `apps/web/.next`
   - Add environment variables

### Backend (Railway/Heroku/DigitalOcean)

1. **Build the backend app**

   ```bash
   yarn build:shared
   yarn build:api
   ```

2. **Deploy apps/api directory**
   - Set build command: `yarn build`
   - Set start command: `yarn start:prod`
   - Add environment variables
   - Set PORT environment variable

### Environment Variables for Production

**Frontend:**

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

**Backend:**

```env
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
PORT=80
CORS_ORIGIN=https://your-frontend-domain.com
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Set up development environment**
   ```bash
   yarn install
   yarn build:shared
   yarn dev
   ```
4. **Make your changes**
   - Frontend changes: `apps/web/`
   - Backend changes: `apps/api/`
   - Shared code: `packages/shared/`
5. **Test your changes**
   - Test both frontend and backend
   - Verify API integration
   - Check database functions if applicable
6. **Submit a pull request**

### Development Guidelines

- **Code Standards**: Follow TypeScript best practices
- **Monorepo**: Test changes across all affected packages
- **API Design**: RESTful endpoints with proper HTTP status codes
- **Database**: Use proper RLS policies and secure functions
- **Documentation**: Update README for significant changes

## License

This project is licensed under the MIT License.

## ✨ What's New in v2.0 (Monorepo)

### 🏗️ Architecture Improvements

- **Turborepo**: Monorepo with efficient build caching
- **Separated Concerns**: Frontend (3333) and Backend (4444) on different ports
- **Shared Package**: Common types, utilities, and constants
- **Yarn Workspaces**: Better dependency management

### 🚀 Development Experience

- **Hot Reload**: Both apps with independent development
- **Type Safety**: Shared types between frontend and backend
- **Build Optimization**: Parallel builds with Turborepo
- **Modular Backend**: NestJS with proper module structure

### 📦 Package Structure

```
📁 apps/
  📁 web/        # Next.js Frontend (Port 3333)
  📁 api/        # NestJS Backend (Port 4444)
📁 packages/
  📁 shared/     # Common code and types
```

### 🔄 Migration Status

- ✅ **Infrastructure**: Complete monorepo setup
- ✅ **Frontend**: Next.js app migrated and running
- ✅ **Backend**: NestJS scaffold with CORS configured
- ✅ **Shared**: Types and utilities extracted
- 🔄 **APIs**: Migrating from Next.js routes to NestJS
- ⏳ **Integration**: Frontend-backend API integration

## 🚀 Quick Start Summary

```bash
# 1. Install dependencies
yarn install

# 2. Set up environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Build shared package
yarn build:shared

# 4. Start development
yarn dev
```

**✨ Ready to develop!**

- Frontend: http://localhost:3333
- Backend: http://localhost:4444

---

**Built with ❤️ using modern monorepo architecture**
