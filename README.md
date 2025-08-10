# SupaSpend - Expense Management System

A modern expense management application built with Next.js 15, Supabase, and TypeScript.

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

- **Frontend**: Next.js 15 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd supaspend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Set up the database (One-Script Setup)**

   Run the consolidated database setup script:

   ```bash
   # Using Supabase CLI (recommended)
   supabase db reset

   # Or directly with psql
   psql -h your-db-host -U postgres -d your-database -f DATABASE_SETUP.sql
   ```

5. **Validate the setup (Optional)**

   ```bash
   # Test database functions and structure
   psql -h your-db-host -U postgres -d your-database -f validate_database_setup.sql
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Create first admin user in Supabase**

   - Go to your Supabase Dashboard → Authentication → Users
   - Click "Add user" and create your admin account
   - Or sign up through the app at [http://localhost:3000](http://localhost:3000)

8. **Promote first user to admin**

   After creating your account, promote yourself to admin using SQL:

   ```sql
   -- Replace with your actual email address
   SELECT public.change_user_role('your-email@example.com', 'admin');
   ```

   Run this in your Supabase Dashboard → SQL Editor, then verify with:

   ```sql
   -- Verify admin role was set
   SELECT * FROM public.get_user_info('your-email@example.com');
   ```

## Database Setup

This project uses a **single consolidated SQL script** for easy setup:

- **`DATABASE_SETUP.sql`** - Complete database schema (Version 4.8)
  - All tables, enums, and indexes
  - Security functions with RLS policies
  - User management triggers
  - Wallet creation functions
  - Transaction management
- **`validate_database_setup.sql`** - Validation script to test:
  - Table existence
  - Function availability
  - Trigger functionality
  - RLS policies
  - Data integrity

### Key Database Features

- ✅ **Single-script installation** for new developers
- ✅ **Complete RLS security** with role-based access
- ✅ **Automatic user profile creation** via triggers
- ✅ **Multi-currency wallet system** with balance calculations
- ✅ **Audit trails** for all transactions
- ✅ **Foreign key constraints** for data integrity

## Development Tools

### API Testing Suite

Access the built-in API testing page:

- **URL**: `http://localhost:3000/test-api`
- **Features**:
  - Test all API endpoints
  - Real-time success/failure indicators
  - Detailed error messages
  - Performance timing
  - Automated test suites

### Database Validation

Run the validation script to ensure database health:

```bash
psql -h your-db-host -U postgres -d your-database -f validate_database_setup.sql
```

Tests include:

- Table structure validation
- Function existence checks
- Trigger functionality
- RLS policy verification
- Sample data insertion tests

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── test-api/       # API testing suite
│   ├── admin/          # Admin management pages
│   └── api/            # API routes
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── features/       # Feature-specific components
│   └── shared/         # Shared components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions

Database Files:
├── DATABASE_SETUP.sql           # Single setup script (v4.8)
├── validate_database_setup.sql  # Validation tests
└── supabase/migrations/         # Individual migrations
```

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

## API Routes

### Public Routes

- `POST /api/auth/*` - Authentication endpoints

### Protected Routes

- `GET /api/balance` - User balance information
- `GET/POST /api/transactions/expenses` - Expense management
- `GET /api/admin/users` - User management (Admin only)
- `POST /api/admin/funds` - Fund management (Admin only)
- `GET /api/admin/wallets` - Wallet management (Admin only)

### Development Routes

- `GET /test-api` - API testing suite (Development only)

## Troubleshooting

### Common Issues

1. **Wallet creation fails**: Run the database validation script to check function existence
2. **RLS policy errors**: Ensure service role key is correctly configured
3. **Trigger not working**: Verify auth.users table permissions
4. **Balance calculation errors**: Check transaction_type enum values

### Testing and Validation

Use the built-in tools:

- **API Test Page**: Test all endpoints at `/test-api`
- **Database Validation**: Run `validate_database_setup.sql`
- **Function Testing**: Check individual database functions

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Custom configurations
NEXT_PUBLIC_APP_NAME=SupaSpend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test using the API test suite (`/test-api`)
4. Validate database changes with `validate_database_setup.sql`
5. Make your changes
6. Submit a pull request

## License

This project is licensed under the MIT License.

## 🏗️ What's Included

### Database Schema (Single Script)

- **Users Table**: Extended with display_name and avatar_url fields
- **Multi-Currency Wallets**: Complete wallet management with currency support
- **Expense System**: Full CRUD with audit trails and edit history
- **Fund Management**: Transaction-based balance calculation
- **Security**: Comprehensive Row-Level Security policies
- **Storage**: Profile image bucket with proper access controls

### Frontend Components

- **Profile Page**: Complete profile management interface
- **Dashboard**: Real-time balance and transaction views
- **Admin Panel**: User and fund management tools
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Type Safety**: 100% TypeScript coverage

### API Routes

- **Profile Management**: `/api/profile` (GET, PUT)
- **User Management**: `/api/admin/users` (CRUD operations)
- **Fund Operations**: `/api/admin/funds` (transfer management)
- **Balance Tracking**: `/api/balance` (real-time calculations)
- **Expense Management**: Complete expense API suite

### Development Features

- **Hot Reload**: Next.js development server
- **Type Checking**: Comprehensive TypeScript integration
- **Linting**: ESLint with custom rules
- **Component Library**: Shadcn/ui integration

## 📁 Project Structure

```
src/
├── app/                     # Next.js app router
│   ├── api/                # API routes
│   ├── auth/               # Authentication
│   ├── dashboard/          # Main dashboard
│   ├── admin/              # Admin panel
│   └── ...
├── components/             # React components
│   ├── ui/                 # Base components
│   ├── features/           # Feature components
│   └── shared/             # Shared components
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
│   ├── supabase/           # Supabase config
│   └── utils/              # Helpers
└── types/                  # TypeScript types
```

## 🔧 Development

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

### Database Management

**Single Script Setup**: All database changes consolidated into `DATABASE_SETUP.sql`

For production updates:

1. Test changes in development Supabase project
2. Export incremental SQL changes
3. Apply via Supabase Dashboard SQL Editor
4. No multiple migration files needed

## 🚢 Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works on any Next.js-compatible platform:

- Netlify, Railway, DigitalOcean, AWS Amplify

## ✅ Production Checklist

### Database Setup

- [ ] Created new Supabase project
- [ ] Ran complete `DATABASE_SETUP.sql` script in SQL Editor
- [ ] Verified success messages appeared (no errors)
- [ ] Confirmed all tables, functions, and storage bucket created
- [ ] Checked RLS policies are active

### Environment Configuration

- [ ] Created `.env.local` from `.env.example`
- [ ] Added Supabase project URL
- [ ] Added Supabase anon key
- [ ] Added Supabase service role key
- [ ] Verified all keys are from same project

### Application Setup

- [ ] Installed dependencies with `npm install`
- [ ] Started dev server with `npm run dev`
- [ ] Confirmed app loads without errors
- [ ] Tested authentication flow

### Admin Setup

- [ ] Created first user through Supabase Dashboard (Authentication → Users) or app signup
- [ ] Promoted to admin via SQL command: `SELECT public.change_user_role('your-email@example.com', 'admin');`
- [ ] Verified admin navigation appears
- [ ] Tested user creation functionality

### Feature Testing

- [ ] Created test user successfully
- [ ] Added funds to test user
- [ ] Created and managed expenses
- [ ] Verified balance calculations
- [ ] Tested wallet management
- [ ] **Updated profile display name**
- [ ] **Uploaded profile photo**
- [ ] **Changed password successfully**

### Production Deployment

- [ ] Pushed code to GitHub repository
- [ ] Connected repository to Vercel
- [ ] Added environment variables in Vercel
- [ ] Deployed and tested production build

### Post-Deployment Verification

- [ ] User authentication working
- [ ] **Profile page accessible and functional**
- [ ] **Avatar upload working with storage**
- [ ] Admin can create users
- [ ] Fund management working
- [ ] Expense tracking functional
- [ ] Reports generating correctly
- [ ] RLS policies active
- [ ] API endpoints secured
- [ ] Mobile responsive

## 🐛 Troubleshooting

### Common Issues

#### "Row violates RLS policy" errors

- Ensure database setup completed successfully
- Verify user roles are set correctly
- Check admin permissions

#### Wallet creation fails

- Verify user creation API uses admin client
- Check `initialize_user_balance` function exists
- Ensure wallet limit (5 per user) not exceeded

#### Balance calculation issues

- Balances calculated from transactions, not stored
- Check `get_user_balance()` function working
- Verify transaction types are correct

### Debug Commands

Run these in Supabase SQL Editor:

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

### Getting Help

1. Check troubleshooting section above
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Test with fresh incognito session

## 🔒 Security Best Practices

### Environment Variables

- Never commit `.env.local`
- Use different projects for dev/production
- Rotate service role keys regularly

### Database Security

- RLS policies pre-configured
- Service role for admin operations only
- Regular permission audits

### API Security

- Authentication middleware on all routes
- Role-based access control
- Input validation on endpoints
- **Profile upload security with storage policies**

## 📊 Architecture

### Frontend

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** components

### Backend

- **Supabase** database and auth
- **PostgreSQL** with advanced features
- **Row Level Security** for protection
- **Real-time subscriptions**

### Database Design

- **Transaction-based balances**: Calculated from history
- **Multi-currency wallets**: Multiple currencies per user
- **Audit trails**: Complete change history
- **Optimized indexes**: Fast queries

## 📄 API Documentation

### User Management

- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/[id]` - Update user
- **`GET /api/profile` - Get current user profile**
- **`PUT /api/profile` - Update profile (display name, avatar)**

### Fund Management

- `POST /api/admin/funds` - Add funds
- `GET /api/balance` - Get balance
- `GET /api/transactions` - Transaction history

### Expense Management

- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

## 🔄 Updates & Maintenance

### Upgrading

1. **Backup database** (Supabase auto-backups)
2. **Test in development** first
3. **Run migration scripts** if provided
4. **Verify features** after update
5. **Update dependencies** with `npm update`

### Monitoring

- Monitor Supabase dashboard performance
- Check API response times
- Monitor error rates
- Track database query performance

## 📄 License

MIT License - feel free to use for your projects.

## 🆘 Support

For support, please:

1. Check the troubleshooting section above
2. Review the database logs in Supabase
3. Verify all setup steps were completed

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

### Code Standards

- **Single Responsibility**: One purpose per component
- **Composition**: Break large components into smaller ones
- **TypeScript**: 100% type coverage
- **Custom Hooks**: API interactions via hooks

## 📞 Support

For issues:

1. Check troubleshooting section
2. Review Supabase documentation
3. Check GitHub issues
4. Test with clean browser session

---

**Built with ❤️ for efficient expense management**

## 🏆 Production Ready Features

✅ **Single-Script Setup**: Complete database installation in one command  
✅ **Profile Management**: Display names, avatars, password changes  
✅ **Database**: Proven working structure with profile features integrated  
✅ **Security**: Complete RLS policies and authentication with storage controls  
✅ **Performance**: Optimized queries and indexes  
✅ **Documentation**: Comprehensive setup and troubleshooting  
✅ **Build**: Verified production build success  
✅ **Deployment**: Ready for Vercel, Netlify, or any platform

**⚡ 5-minute setup from zero to complete system with profiles! 🚀**
