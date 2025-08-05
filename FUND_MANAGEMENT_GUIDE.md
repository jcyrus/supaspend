# Fund Management Setup Guide

This guide will help you set up the fund management system for your petty cash tracker, which allows admins to deposit funds to users and automatically deduct expenses from their balance.

## Prerequisites

1. You must have already run the `COMPLETE_SETUP.sql` file to set up the basic petty cash tracker
2. You should have admin/superadmin access to your application
3. Your Supabase project should be properly configured

## Setup Steps

### 1. Run the Fund Management SQL Script

Execute the `FUND_MANAGEMENT_SETUP.sql` file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `FUND_MANAGEMENT_SETUP.sql`
4. Click "Run" to execute the script

### 2. Restart your application

After running the SQL script, restart your Next.js application to ensure all changes are loaded:

```bash
npm run dev
```

## Features Added

### For Admins:

- **Fund Management**: View users with their current balances
- **Add Funds**: Deposit money to users under their management
- **Transaction History**: View complete transaction history for each user
- **Balance Tracking**: See real-time balance updates

### For Users:

- **Balance Display**: See current balance on dashboard and expense form
- **Automatic Deduction**: Expenses automatically deduct from balance
- **Negative Balance**: System allows negative balances (configurable warnings)
- **Balance Preview**: See what balance will be after adding an expense

### Automatic Features:

- **Balance Initialization**: New users automatically get a $0.00 balance
- **Transaction Recording**: All fund movements are automatically logged
- **Expense Integration**: Creating, updating, or deleting expenses automatically adjusts balance
- **Admin Tracking**: All fund deposits are linked to the admin who made them

## How It Works

1. **Admin deposits funds**: Admin selects a user and adds funds with optional description
2. **User spends money**: When user creates an expense, the amount is automatically deducted from their balance
3. **Balance tracking**: All transactions are recorded with previous/new balance for audit trail
4. **Negative balances**: Users can spend more than their balance (admin configurable limits)

## API Endpoints Added

- `POST /api/admin/funds` - Add funds to a user
- `GET /api/admin/funds?userId=...` - Get user balance and transaction history
- `GET /api/admin/users-with-balances` - Get all users with their balances
- `GET /api/balance` - Get current user's balance and recent transactions

## Database Tables Added

- `user_balances` - Stores current balance for each user
- `fund_transactions` - Records all fund movements (deposits, expenses, etc.)

## Security Features

- **Row Level Security**: Users can only see their own balance and transactions
- **Admin Permissions**: Only admins can add funds to users they created
- **Superadmin Access**: Superadmins can see all balances and transactions
- **Audit Trail**: Complete transaction history with admin attribution

## Usage Examples

### Admin Adding Funds

1. Go to Admin → Users
2. Click the "+" button next to a user
3. Enter amount and optional description
4. Submit to add funds

### User Viewing Balance

1. Go to Dashboard to see current balance
2. Go to Add Expense to see balance and preview
3. Balance updates automatically after adding expenses

### Transaction History

1. Admin can click the history button next to any user
2. View complete transaction log with dates and descriptions
3. See balance changes over time

## Troubleshooting

### Balance not showing

- Ensure you've run the SQL script completely
- Check browser console for API errors
- Verify user has proper permissions

### Funds not adding

- Check admin has permission to manage the target user
- Verify positive amount is entered
- Check network tab for API errors

### Transactions not recording

- Ensure triggers are properly installed
- Check database logs for errors
- Verify RLS policies are working

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review the database logs in Supabase
3. Ensure all SQL functions and triggers are properly installed
4. Verify your user has the correct role (admin/superadmin)
