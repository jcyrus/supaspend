# Supaspend - Production Ready Expense Management System

A complete multi-currency petty cash management system built with Next.js and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)

### Setup Instructions

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd supaspend
   npm install
   ```

2. **Create Supabase project**

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for setup completion

3. **Setup database**

   - Open Supabase Dashboard → SQL Editor
   - Copy entire contents of `DATABASE_PRODUCTION_SETUP.sql`
   - Paste and run the SQL script
   - Wait for completion (success messages will appear)

4. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Find these in: Supabase Dashboard → Project Settings → API

5. **Start development**

   ```bash
   npm run dev
   ```

6. **Create admin account**

   - Sign up in the app
   - Run in Supabase SQL Editor:

   ```sql
   SELECT public.change_user_role('your-email@example.com', 'admin');
   ```

7. **Verify setup**
   ```sql
   SELECT * FROM public.get_user_info('your-email@example.com');
   ```

**🎉 Done! Your system is ready.**

## � Features

### Core Features

- **Multi-currency support**: USD, VND, IDR, PHP
- **Role-based access**: User, Admin, Superadmin
- **Wallet management**: Multiple wallets per user
- **Expense tracking**: Complete CRUD with audit trails
- **Fund management**: Admin-to-user transfers
- **Real-time balances**: Transaction-based calculation

### Security

- **Row Level Security (RLS)**: Database-level protection
- **Admin controls**: Admins manage only their created users
- **Audit trails**: Complete transaction history
- **API security**: Authenticated endpoints

### Admin Features

- **User management**: Create and manage users
- **Fund transfers**: Add/transfer money between accounts
- **Expense oversight**: View all user expenses
- **Reports**: Transaction history and analytics

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

For production updates:

1. Test in development Supabase project
2. Export SQL changes
3. Apply via Supabase Dashboard

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
- [ ] Ran `DATABASE_PRODUCTION_SETUP.sql` in SQL Editor
- [ ] Verified no errors in execution
- [ ] Confirmed all tables and functions created

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

- [ ] Created account through app signup
- [ ] Promoted to admin via SQL command
- [ ] Verified admin navigation appears
- [ ] Tested user creation functionality

### Feature Testing

- [ ] Created test user successfully
- [ ] Added funds to test user
- [ ] Created and managed expenses
- [ ] Verified balance calculations
- [ ] Tested wallet management

### Production Deployment

- [ ] Pushed code to GitHub repository
- [ ] Connected repository to Vercel
- [ ] Added environment variables in Vercel
- [ ] Deployed and tested production build

### Post-Deployment Verification

- [ ] User authentication working
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

✅ **Database**: Proven working structure based on production system  
✅ **Security**: Complete RLS policies and authentication  
✅ **Performance**: Optimized queries and indexes  
✅ **Documentation**: Comprehensive setup and troubleshooting  
✅ **Build**: Verified production build success  
✅ **Deployment**: Ready for Vercel, Netlify, or any platform

**30-minute setup from zero to working system! 🚀**
