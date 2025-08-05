# Petty Cash Tracker - Admin-Only Account Management

A Next.js expense tracking application with admin-only account creation and comprehensive user management features.

## Features

### Core Features

- **Expense Tracking**: Add, edit, and categorize expenses
- **Dashboard**: Real-time expense overview and analytics
- **Reports**: Visual charts and data export capabilities
- **Modern Sidebar Interface**: Collapsible sidebar with responsive design

### Admin Features

- **Admin-Only Account Creation**: Only admins can create new user accounts
- **User Management**: Admins can view and manage users they created
- **Admin Reports**: View aggregated data from all managed users
- **Role-Based Access**: User, Admin, and Superadmin roles

### Interface Features

- **Responsive Sidebar**: Desktop sidebar that collapses for more space
- **Mobile Navigation**: Touch-friendly mobile interface with slide-out menu
- **Role-Based Navigation**: Dynamic menu items based on user permissions
- **Modern shadcn Design**: Clean, professional interface design

## Quick Setup

### 1. Database Setup

Run the single SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of COMPLETE_SETUP.sql
-- This is the ONLY SQL file you need to run
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install and Run

```bash
npm install
npm run dev
```

### 4. Create Your First Admin

1. Sign up for an account in the app
2. In Supabase SQL Editor, promote yourself to admin:

```sql
SELECT public.change_user_role('your-email@example.com', 'admin');
```

3. Verify your setup:

```sql
SELECT * FROM public.get_user_info('your-email@example.com');
```

## User Roles

- **user**: Can manage their own expenses
- **admin**: Can create users and view reports for users they created
- **superadmin**: Full access to all users and data

## Admin Workflow

1. **Create Users**: Navigate to "Create User" (admin-only page)
2. **Manage Users**: View all created users in "Manage Users"
3. **View Reports**: Toggle between personal and admin views in Reports
4. **Export Data**: Download CSV reports with user information

## Architecture

### Security

- Row Level Security (RLS) policies ensure data isolation
- Admins only see users they created
- Users only see their own data
- Automatic user profile creation

### Key Components

- `/admin/users`: User management interface (admin-only user creation)
- Enhanced navigation with role-based items
- Admin reports with user aggregation

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   └── login/page.tsx          # Login page
│   ├── admin/
│   │   └── users/page.tsx          # User management
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── expenses/new/page.tsx       # Add expense
│   └── reports/page.tsx            # Reports with admin view
├── components/
│   ├── Navigation.tsx              # Role-based navigation
│   ├── DashboardContent.tsx        # Dashboard with auto-profile creation
│   ├── ReportsContent.tsx          # Reports with admin features
│   └── ExpenseForm.tsx             # Expense creation form
├── lib/
│   ├── auth-utils.ts               # Enhanced auth with admin functions
│   └── supabase/                   # Supabase client config
└── types/
    └── database.ts                 # TypeScript types
```

## Database Schema

### Tables

- `users`: User profiles with admin relationships
- `expenses`: Expense records linked to users

### Key Functions

- `change_user_role()`: Promote users to admin
- `get_admin_users()`: Get users created by admin
- `get_admin_user_expenses()`: Get expenses for managed users

## Development

### Build and Deploy

```bash
npm run build    # Build for production
npm start        # Start production server
```

### Debugging

- Check browser console for detailed error logs
- Use `get_user_info()` function to verify user setup
- RLS policies prevent unauthorized data access

## Support

### Common Issues

1. **"Error fetching user profile"**: User profile auto-creation should resolve this
2. **Admin navigation not showing**: Verify user role with `get_user_info()`
3. **RLS errors**: Check that `COMPLETE_SETUP.sql` was run successfully

### Database Verification

```sql
-- Check your role
SELECT * FROM public.get_user_info('your-email@example.com');

-- List all users (superadmin only)
SELECT * FROM public.users;

-- Test admin functions
SELECT * FROM public.get_admin_users('your-user-id');
```

## License

MIT License - feel free to use for your projects.
