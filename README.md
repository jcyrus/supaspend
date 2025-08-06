# Petty Cash Tracker - Complete Admin-Controlled Expense Management System

A comprehensive Next.js expense tracking application with admin-only account creation, fund management, and complete transaction history. This system provides a full financial management solution for organizations with administrative oversight.

## 🌟 Core Features

### User Management

- **Admin-Only Account Creation**: Only admins can create new user accounts
- **Role-Based Access Control**: User, Admin, and Superadmin roles
- **User Relationship Tracking**: Admins can only manage users they created
- **Automatic Profile Creation**: Seamless user onboarding

### Expense Tracking

- **Complete Expense Management**: Add, edit, delete, and categorize expenses
- **Advanced Filtering**: Filter by date range, category, amount, and user
- **Edit History Tracking**: Complete audit trail with reason tracking
- **Inline Editing**: Quick expense modifications with approval workflows

### Fund Management

- **Balance Tracking**: Real-time user balance management
- **Admin Fund Deposits**: Secure fund allocation to users
- **Automatic Deductions**: Expenses automatically deduct from user balance
- **Negative Balance Support**: Configurable overdraft capabilities
- **Complete Transaction History**: Detailed audit trail for all fund movements

### Reporting & Analytics

- **Visual Dashboard**: Real-time expense overview and analytics
- **Advanced Reports**: Comprehensive reporting with admin/user views
- **Data Export**: CSV export with complete user and transaction data
- **Transaction Insights**: Detailed transaction analysis and filtering

### Interface Features

- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Modern UI**: Clean, professional shadcn-based design
- **Dark/Light Theme**: User preference theme switching
- **Role-Based Navigation**: Dynamic menu items based on permissions
- **Real-time Updates**: Live balance and transaction updates

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Git

### 1. Database Setup

Run the complete database setup script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of DATABASE_SETUP.sql
-- This single file contains everything you need:
-- - All table schemas
-- - Transaction-based balance calculation functions
-- - Optimized indexes for performance
-- - Row Level Security (RLS) policies
-- - Proper grants and permissions
```

**Key Database Features:**

- ✅ **Transaction-Based Balance Calculation**: Balance calculated from actual transaction history, not stored values
- ✅ **Consistency**: Admin and user views always show the same balance
- ✅ **Performance**: Optimized with proper indexes
- ✅ **Security**: Full RLS policies implemented
- ✅ **Auditability**: Complete transaction history preserved

**Balance Calculation Logic:**

```
User Balance = SUM(fund_in + deposit) - SUM(expense + fund_out + withdrawal)
```

The `user_balances` table exists for compatibility but is not used for calculations. All balance queries use the `get_user_balance()` function which calculates from the `fund_transactions` table.

### 2. Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Installation & Launch

```bash
# Clone the repository
git clone <your-repo-url>
cd supaspend

# Install dependencies
npm install

# Run development server
npm run dev

# For production
npm run build
npm start
```

### 4. Create Your First Admin

1. Sign up for an account in the application
2. In Supabase SQL Editor, promote yourself to admin:

```sql
SELECT public.change_user_role('your-email@example.com', 'admin');
```

3. Verify your setup:

```sql
SELECT * FROM public.get_user_info('your-email@example.com');
```

## 👥 User Roles & Permissions

### User (Default)

- Manage personal expenses
- View personal balance and transaction history
- Create, edit, delete own expenses
- Access personal dashboard and reports

### Admin

- All user permissions
- Create new user accounts
- Manage users they created
- Add funds to user accounts
- View aggregated reports for managed users
- Export user data and reports

### Superadmin

- All admin permissions
- Manage all users in the system
- Promote users to admin roles
- Access system-wide reports
- Full database access and controls

## 💰 Fund Management Workflow

### For Administrators:

1. **User Creation**: Create new user accounts through admin interface
2. **Fund Allocation**: Deposit funds to user accounts with descriptions
3. **Balance Monitoring**: View real-time balances and transaction history
4. **Expense Oversight**: Monitor user spending and balance changes

### For Users:

1. **Balance Awareness**: View current balance on dashboard and forms
2. **Expense Creation**: Add expenses with automatic balance deduction
3. **Balance Tracking**: Monitor spending against available funds
4. **Transaction History**: Review complete spending and fund history

### Automatic Features:

- **Balance Initialization**: New users start with $0.00 balance
- **Transaction Recording**: All fund movements automatically logged
- **Expense Integration**: Balance updates with expense creation/modification
- **Admin Attribution**: All fund deposits linked to authorizing admin

## 📊 Transaction System

### Expense Transactions

- **Creation**: Automatic balance deduction and transaction logging
- **Updates**: Balance adjustments with complete change tracking
- **Deletions**: Automatic refunds with transaction records
- **Edit History**: Complete audit trail with reasons and timestamps

### Fund Transactions

- **Deposits**: Admin-initiated fund additions with descriptions
- **Withdrawals**: Expense-triggered balance deductions
- **Adjustments**: Balance corrections with full audit trail
- **Reporting**: Complete transaction history with filtering

### Security Features

- **Row Level Security**: Users see only their own data
- **Admin Permissions**: Scoped access to created users only
- **Audit Trails**: Immutable transaction history
- **Permission Validation**: Server-side authorization for all operations

## 🏗️ Architecture

### Frontend

- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Responsive Design**: Mobile-first responsive layout

### Backend

- **Supabase**: PostgreSQL database with Row Level Security
- **API Routes**: Next.js API routes for server-side logic
- **Real-time Updates**: Supabase real-time subscriptions
- **Secure Functions**: PostgreSQL functions for complex operations

### Security

- **Row Level Security**: Database-level data isolation
- **Authentication**: Supabase Auth with email/password
- **Authorization**: Role-based access control
- **Data Validation**: Client and server-side validation

## 📁 Project Structure

The project follows a modular, feature-based architecture for maintainability and scalability:

```
src/
├── app/                    # App Router pages (thin page components)
│   ├── admin/users/        # User management (7 lines - delegates to features)
│   ├── auth/login/         # Authentication pages
│   ├── dashboard/          # Main dashboard
│   ├── expenses/new/       # Expense creation
│   ├── transactions/       # Transaction history
│   ├── reports/           # Reporting interface
│   └── api/               # API endpoints
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── admin/         # Admin functionality components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── transactions/  # Transaction management components
│   │   └── reports/       # Report generation components
│   ├── shared/            # Reusable components across features
│   │   ├── LoadingStates.tsx    # Loading spinners & skeletons
│   │   ├── StatusComponents.tsx # Empty states & status messages
│   │   ├── CurrencyComponents.tsx # Currency display components
│   │   └── TransactionFilters.tsx # Reusable filter interface
│   └── ui/                # Base UI components (shadcn/ui)
├── hooks/
│   └── api/               # Custom hooks for API management
│       ├── useExpenses.ts # Expense CRUD operations
│       ├── useBalance.ts  # Balance management
│       └── useAdminUsers.ts # User management
├── lib/
│   ├── constants/         # App-wide constants
│   │   └── app.ts        # Categories, roles, etc.
│   ├── utils/            # Utility functions
│   │   ├── currency.ts   # Currency formatting & colors
│   │   ├── date.ts       # Date formatting utilities
│   │   └── validation.ts # Form validation helpers
│   ├── auth-utils.ts     # Authentication utilities
│   └── supabase/         # Supabase configuration
├── contexts/             # React contexts
└── types/               # TypeScript type definitions
```

### 🏗️ Architecture Principles

This project has been refactored to follow modern React development patterns:

#### **Component Organization**

- **Page Components**: Thin routing components that delegate to feature components
- **Feature Components**: Domain-specific functionality grouped together
- **Shared Components**: Reusable UI elements used across features
- **Single Responsibility**: Each component has one clear purpose

#### **Custom Hooks Pattern**

All API interactions use custom hooks for consistent patterns:

```typescript
// Example usage
const { expenses, loading, error, updateExpense, deleteExpense } =
  useExpenses();
const { balance, fetchBalance } = useBalance();
const { users, fetchUsers, deleteUser } = useAdminUsers();
```

#### **Utility Functions**

Common operations are centralized and reusable:

```typescript
import { formatCurrency, getBalanceColor, formatDate } from "@/lib/utils";

// Consistent formatting everywhere
const display = formatCurrency(amount);
const color = getBalanceColor(balance);
const date = formatDate(transaction.created_at);
```

#### **Component Composition**

Large components are broken into smaller, focused pieces:

```typescript
// Before: 854-line AdminUsersPage
// After: Composed of focused components
<AdminUsersPageContent>
  <CreateUserForm onSuccess={handleSuccess} />
  <UsersTable users={users} onFundUser={handleFund} />
  <FundUserModal user={selectedUser} onSuccess={refetch} />
</AdminUsersPageContent>
```

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles with admin relationships and roles
- **expenses**: Expense records with user attribution
- **user_balances**: Current balance tracking for each user
- **fund_transactions**: Complete transaction history
- **expense_edit_history**: Audit trail for expense modifications

### Key Functions

- **get_user_balance()**: Transaction-based balance calculation (single source of truth)
- **change_user_role()**: User role management
- **add_user_funds()**: Admin fund allocation with transaction recording
- **get_admin_users_with_balances()**: User relationship queries with consistent balance calculation
- **deduct_user_funds()**: Automatic expense processing with balance updates

### Security Policies

- Row Level Security on all user data
- Admin scoped access to created users
- Superadmin system-wide access
- Automatic audit trail creation

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
```

### Code Quality

- **ESLint**: Code linting and formatting
- **TypeScript**: Full type checking
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Testing

```bash
npm run test         # Run test suite
npm run test:watch   # Watch mode testing
npm run test:coverage # Coverage reports
```

## 🚨 Troubleshooting

### Common Issues

1. **"Error fetching user profile"**

   - Solution: User profile auto-creation should resolve this
   - Check: Verify database triggers are installed

2. **Admin navigation not showing**

   - Solution: Verify user role with `get_user_info()` function
   - Check: Ensure admin permissions are properly set

3. **Balance not updating**

   - Solution: Check database triggers and RLS policies
   - Verify: Fund management SQL setup completed

4. **RLS policy errors**
   - Solution: Verify `DATABASE_SETUP.sql` was run successfully
   - Check: User authentication and session state

### Debug Commands

```sql
-- Check user role and profile
SELECT * FROM public.get_user_info('your-email@example.com');

-- Verify admin relationships
SELECT * FROM public.get_admin_users('your-admin-id');

-- Check balance and transactions
SELECT * FROM public.get_user_balance('user-id');
SELECT * FROM public.get_user_fund_transactions('user-id');

-- Test admin functions
SELECT * FROM public.get_admin_user_expenses('admin-id');
```

### Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Component Caching**: React component memoization
- **API Optimization**: Efficient data fetching patterns
- **Image Optimization**: Next.js automatic image optimization

## 🔐 Security Considerations

### Data Protection

- **Row Level Security**: Database-level data isolation
- **Input Validation**: Comprehensive client/server validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization

### Access Control

- **Role-Based Permissions**: Hierarchical access control
- **Session Management**: Secure authentication sessions
- **API Security**: Authenticated API endpoints
- **Audit Logging**: Complete action audit trails

## 📈 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
```

### Database Migration (Production)

1. Create production Supabase project
2. Run `DATABASE_SETUP.sql` in production SQL editor
3. Create first admin user
4. Test all functionality

### Post-Deployment Checklist

- [ ] Database setup completed successfully
- [ ] Environment variables configured
- [ ] First admin user created and verified
- [ ] Authentication flow working
- [ ] User creation/management functional
- [ ] Fund management operational
- [ ] Reports and exports working
- [ ] All permissions tested

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards & Patterns

This project follows specific architectural patterns for consistency and maintainability:

#### **Adding New Features**

1. **Create feature-specific components** in `/components/features/[feature-name]/`
2. **Use custom hooks** for API operations (see `/hooks/api/` for examples)
3. **Leverage shared components** from `/components/shared/` for common UI
4. **Keep page components thin** - they should mostly delegate to feature components

#### **Component Guidelines**

- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Break large components into smaller, composable pieces
- **Consistent Naming**: Use descriptive names that indicate purpose
- **TypeScript**: Maintain 100% type coverage with proper interfaces

#### **Utility Functions**

- **Add reusable functions** to appropriate files in `/lib/utils/`
- **Export through main utils** file for consistent imports
- **Document complex functions** with JSDoc comments
- **Write pure functions** where possible for easier testing

#### **API Patterns**

All API interactions should follow the established hook pattern:

```typescript
// Custom hook structure
export function useFeature() {
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // API call logic
      setState((prev) => ({ ...prev, data: result, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  }, []);

  return { ...state, fetchData, refetch: fetchData };
}
```

#### **Breaking Down Large Components**

When refactoring large components (>200 lines), follow this pattern:

1. **Identify concerns** - What different things is the component doing?
2. **Extract components** - Create focused sub-components for each concern
3. **Create custom hooks** - Move API logic to reusable hooks
4. **Use composition** - Combine smaller components in a parent orchestrator

Example of good component breakdown:

```
LargeFeaturePage (was 800+ lines)
├── FeaturePageContent.tsx (50 lines - orchestration)
├── FeatureForm.tsx (120 lines - form handling)
├── FeatureTable.tsx (80 lines - data display)
├── FeatureModal.tsx (100 lines - modal interactions)
└── useFeature.ts (custom hook for API)
```

## 📄 License

MIT License - feel free to use for your projects.

## 🆘 Support

For support, please:

1. Check the troubleshooting section above
2. Review the database logs in Supabase
3. Verify all setup steps were completed
4. Open an issue with detailed error information

---

**Built with ❤️ using Next.js, Supabase, and TypeScript**
