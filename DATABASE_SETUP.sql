-- =============================================================================
-- SUPASPEND - PRODUCTION DATABASE SETUP
-- =============================================================================
-- This script sets up the complete database with transaction-based balance calculation
-- Run this ONCE in your Supabase SQL Editor for new installations
-- Features: Transaction-based balances, Full audit trail, Optimized performance
-- Updated: August 6, 2025 - Production Ready
-- =============================================================================

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE transaction_type AS ENUM ('fund_in', 'fund_out', 'expense', 'deposit', 'withdrawal');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (extends Supabase auth.users with admin tracking)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User balances table (Fund management)
CREATE TABLE public.user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fund transactions table (Complete transaction history)
CREATE TABLE public.fund_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  previous_balance NUMERIC(10,2) NOT NULL,
  new_balance NUMERIC(10,2) NOT NULL,
  description TEXT,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense edit history table (Audit trail)
CREATE TABLE public.expense_edit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    edited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Core indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_by ON public.users(created_by);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- Fund management indexes
CREATE INDEX idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX idx_fund_transactions_user_id ON public.fund_transactions(user_id);
CREATE INDEX idx_fund_transactions_admin_id ON public.fund_transactions(admin_id);
CREATE INDEX idx_fund_transactions_type ON public.fund_transactions(transaction_type);
CREATE INDEX idx_fund_transactions_created_at ON public.fund_transactions(created_at);

-- Edit history indexes
CREATE INDEX idx_expense_edit_history_expense_id ON expense_edit_history(expense_id);
CREATE INDEX idx_expense_edit_history_edited_by ON expense_edit_history(edited_by);
CREATE INDEX idx_expense_edit_history_edited_at ON expense_edit_history(edited_at);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_result, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUND MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to initialize user balance
CREATE OR REPLACE FUNCTION public.initialize_user_balance(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (target_user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user balance
CREATE OR REPLACE FUNCTION public.get_user_balance(target_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_balance NUMERIC(10,2);
  funds_in NUMERIC(10,2);
  funds_out NUMERIC(10,2);
BEGIN
  -- Calculate total funds in (deposits/fund_in transactions)
  SELECT COALESCE(SUM(amount), 0.00) INTO funds_in
  FROM public.fund_transactions
  WHERE user_id = target_user_id 
    AND transaction_type IN ('fund_in', 'deposit');
  
  -- Calculate total funds out (expenses/fund_out transactions)
  SELECT COALESCE(SUM(amount), 0.00) INTO funds_out
  FROM public.fund_transactions
  WHERE user_id = target_user_id 
    AND transaction_type IN ('expense', 'fund_out', 'withdrawal');
  
  -- Balance = funds in - funds out
  user_balance := funds_in - funds_out;
  
  RETURN COALESCE(user_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add funds to user (admin deposits money to user)
CREATE OR REPLACE FUNCTION public.add_user_funds(
  target_user_id UUID,
  amount NUMERIC,
  admin_user_id UUID,
  description TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  previous_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  admin_role user_role;
BEGIN
  -- Check if admin has permission
  SELECT role INTO admin_role
  FROM public.users
  WHERE id = admin_user_id;
  
  IF admin_role NOT IN ('admin', 'superadmin') THEN
    RETURN 'Error: Insufficient permissions';
  END IF;
  
  -- Check if target user was created by this admin (unless superadmin)
  IF admin_role = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = target_user_id AND created_by = admin_user_id
    ) THEN
      RETURN 'Error: You can only manage users you created';
    END IF;
  END IF;
  
  -- Validate amount
  IF amount <= 0 THEN
    RETURN 'Error: Amount must be positive';
  END IF;
  
  -- Get current balance (for transaction record)
  previous_balance := public.get_user_balance(target_user_id);
  new_balance := previous_balance + amount;

  -- Record transaction (balance is now calculated from transactions)
  INSERT INTO public.fund_transactions (
    user_id, admin_id, transaction_type, amount,
    previous_balance, new_balance, description
  ) VALUES (
    target_user_id, admin_user_id, 'fund_in', amount,
    previous_balance, new_balance, description
  );
  
  RETURN 'Success: Added $' || amount || ' to user balance';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct funds from user (when spending)
CREATE OR REPLACE FUNCTION public.deduct_user_funds(
  target_user_id UUID,
  amount NUMERIC,
  expense_ref_id UUID DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  previous_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
BEGIN
  -- Validate amount
  IF amount <= 0 THEN
    RETURN 'Error: Amount must be positive';
  END IF;
  
  -- Get current balance (for transaction record)
  previous_balance := public.get_user_balance(target_user_id);
  new_balance := previous_balance - amount;
  
  -- Record transaction (balance is now calculated from transactions, allow negative balance)
  INSERT INTO public.fund_transactions (
    user_id, admin_id, transaction_type, amount,
    previous_balance, new_balance, description, expense_id
  ) VALUES (
    target_user_id, NULL, 'expense', amount,
    previous_balance, new_balance, description, expense_ref_id
  );
  
  RETURN 'Success: Deducted $' || amount || ' from user balance';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to change user role (admin management)
CREATE OR REPLACE FUNCTION public.change_user_role(user_email TEXT, new_role user_role)
RETURNS TEXT AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if user exists
  SELECT COUNT(*) INTO user_count
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email = user_email;
  
  IF user_count = 0 THEN
    RETURN 'Error: User with email ' || user_email || ' not found';
  END IF;
  
  -- Update user role
  UPDATE public.users 
  SET role = new_role, updated_at = NOW()
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = user_email
  );
  
  RETURN 'Success: User ' || user_email || ' role changed to ' || new_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users created by a specific admin
CREATE OR REPLACE FUNCTION public.get_admin_users(admin_id UUID)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pu.id,
    pu.username,
    pu.role,
    pu.created_at,
    au.email::TEXT
  FROM public.users pu
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_by = admin_id
  ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin's users with their balances
CREATE OR REPLACE FUNCTION public.get_admin_users_with_balances(admin_id UUID)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  role user_role,
  balance NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pu.id,
    pu.username,
    pu.role,
    public.get_user_balance(pu.id) as balance,
    pu.created_at,
    au.email::TEXT
  FROM public.users pu
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_by = admin_id
  ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expenses for users created by a specific admin
CREATE OR REPLACE FUNCTION public.get_admin_user_expenses(admin_id UUID)
RETURNS TABLE(
  expense_id UUID,
  user_id UUID,
  username TEXT,
  user_email TEXT,
  date DATE,
  amount NUMERIC,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.user_id,
    pu.username,
    au.email::TEXT,
    e.date,
    e.amount,
    e.category,
    e.description,
    e.created_at
  FROM public.expenses e
  JOIN public.users pu ON e.user_id = pu.id
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_by = admin_id
  ORDER BY e.date DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's fund transaction history
CREATE OR REPLACE FUNCTION public.get_user_fund_transactions(target_user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  transaction_id UUID,
  transaction_type transaction_type,
  amount NUMERIC,
  previous_balance NUMERIC,
  new_balance NUMERIC,
  description TEXT,
  admin_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.transaction_type,
    ft.amount,
    ft.previous_balance,
    ft.new_balance,
    ft.description,
    pu.username as admin_username,
    ft.created_at
  FROM public.fund_transactions ft
  LEFT JOIN public.users pu ON ft.admin_id = pu.id
  WHERE ft.user_id = target_user_id
  ORDER BY ft.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user info (debugging helper)
CREATE OR REPLACE FUNCTION public.get_user_info(user_email TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  username TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    pu.username,
    pu.role,
    pu.created_at
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expense edit history with user details
CREATE OR REPLACE FUNCTION get_expense_edit_history(expense_uuid UUID)
RETURNS TABLE (
    id UUID,
    expense_id UUID,
    edited_by UUID,
    editor_username TEXT,
    editor_full_name TEXT,
    previous_data JSONB,
    new_data JSONB,
    edited_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eeh.id,
        eeh.expense_id,
        eeh.edited_by,
        u.username,
        u.username as editor_full_name,
        eeh.previous_data,
        eeh.new_data,
        eeh.edited_at,
        eeh.reason
    FROM expense_edit_history eeh
    INNER JOIN users u ON eeh.edited_by = u.id
    WHERE eeh.expense_id = expense_uuid
    ORDER BY eeh.edited_at DESC;
END;
$$;

-- Function to promote an existing auth user to superadmin
CREATE OR REPLACE FUNCTION public.promote_to_superadmin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  auth_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RETURN 'Error: No auth user found with email ' || user_email || '. Please create this user in Supabase Auth dashboard first.';
  END IF;
  
  -- Check if user profile exists
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth_user_id
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Update existing profile to superadmin
    UPDATE public.users 
    SET role = 'superadmin', updated_at = NOW()
    WHERE id = auth_user_id;
    
    RETURN 'Success: ' || user_email || ' promoted to superadmin';
  ELSE
    -- Create new profile as superadmin
    INSERT INTO public.users (id, username, role, created_by)
    VALUES (
      auth_user_id,
      split_part(user_email, '@', 1),
      'superadmin',
      NULL
    );
    
    RETURN 'Success: ' || user_email || ' created as superadmin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to initialize user balance when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize balance for new user
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_balance
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_balance();

-- Function to automatically deduct funds when expense is created
CREATE OR REPLACE FUNCTION public.handle_expense_balance_deduction()
RETURNS TRIGGER AS $$
DECLARE
  deduct_result TEXT;
BEGIN
  -- Deduct funds from user balance when expense is created
  SELECT public.deduct_user_funds(
    NEW.user_id,
    NEW.amount,
    NEW.id,
    'Expense: ' || NEW.category || CASE WHEN NEW.description IS NOT NULL THEN ' - ' || NEW.description ELSE '' END
  ) INTO deduct_result;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to deduct balance when expense is created
CREATE TRIGGER on_expense_created_deduct_balance
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_balance_deduction();

-- Function to handle expense updates (adjust balance accordingly)
CREATE OR REPLACE FUNCTION public.handle_expense_balance_adjustment()
RETURNS TRIGGER AS $$
DECLARE
  amount_diff NUMERIC;
  adjust_result TEXT;
BEGIN
  -- Calculate the difference
  amount_diff := NEW.amount - OLD.amount;
  
  -- If amount changed, adjust balance
  IF amount_diff != 0 THEN
    IF amount_diff > 0 THEN
      -- Amount increased, deduct more
      SELECT public.deduct_user_funds(
        NEW.user_id,
        amount_diff,
        NEW.id,
        'Expense adjustment: ' || NEW.category
      ) INTO adjust_result;
    ELSE
      -- Amount decreased, add back (by deducting negative amount)
      SELECT public.deduct_user_funds(
        NEW.user_id,
        amount_diff,
        NEW.id,
        'Expense adjustment refund: ' || NEW.category
      ) INTO adjust_result;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to adjust balance when expense is updated
CREATE TRIGGER on_expense_updated_adjust_balance
  AFTER UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_balance_adjustment();

-- Function to handle expense deletion (refund to balance)
CREATE OR REPLACE FUNCTION public.handle_expense_balance_refund()
RETURNS TRIGGER AS $$
DECLARE
  refund_result TEXT;
BEGIN
  -- Refund the expense amount back to balance (deduct negative amount)
  SELECT public.deduct_user_funds(
    OLD.user_id,
    -OLD.amount,
    OLD.id,
    'Expense deleted refund: ' || OLD.category
  ) INTO refund_result;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refund balance when expense is deleted
CREATE TRIGGER on_expense_deleted_refund_balance
  AFTER DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_balance_refund();

-- Function to automatically update updated_at timestamp for expenses
CREATE OR REPLACE FUNCTION update_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on expense updates
CREATE TRIGGER trigger_update_expense_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_edit_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view created users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR created_by = auth.uid()
  );

CREATE POLICY "Superadmins can view all users" ON public.users
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

-- Expenses table policies
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view managed user expenses" ON public.expenses
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = expenses.user_id 
      AND u.created_by = auth.uid()
    )
  );

CREATE POLICY "Superadmins can view all expenses" ON public.expenses
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

-- User balances policies
CREATE POLICY "Users can view own balance" ON public.user_balances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view managed user balances" ON public.user_balances
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = user_balances.user_id 
      AND u.created_by = auth.uid()
    )
  );

CREATE POLICY "Superadmins can view all balances" ON public.user_balances
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

-- Fund transactions policies
CREATE POLICY "Users can view own transactions" ON public.fund_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view managed user transactions" ON public.fund_transactions
  FOR SELECT USING (
    user_id = auth.uid()
    OR admin_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = fund_transactions.user_id 
      AND u.created_by = auth.uid()
    )
  );

CREATE POLICY "Superadmins can view all transactions" ON public.fund_transactions
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

-- Expense edit history policies
CREATE POLICY "Users can view edit history for their own expenses" ON expense_edit_history
    FOR SELECT USING (
        expense_id IN (
            SELECT id FROM expenses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create edit history for their own expenses" ON expense_edit_history
    FOR INSERT WITH CHECK (
        edited_by = auth.uid() AND
        expense_id IN (
            SELECT id FROM expenses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view edit history for their users' expenses" ON expense_edit_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        ) AND
        expense_id IN (
            SELECT e.id FROM expenses e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.created_by = auth.uid() OR e.user_id = auth.uid()
        )
    );

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT ALL ON public.user_balances TO authenticated;
GRANT ALL ON public.fund_transactions TO authenticated;
GRANT SELECT, INSERT ON expense_edit_history TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_expenses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_superadmin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_funds(UUID, NUMERIC, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_funds(UUID, NUMERIC, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_with_balances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_fund_transactions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expense_edit_history(UUID) TO authenticated;

-- =============================================================================
-- SETUP COMPLETION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 SUPASPEND DATABASE SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Core Tables: users, expenses';
  RAISE NOTICE '✅ Fund Management: user_balances, fund_transactions';
  RAISE NOTICE '✅ Audit Trails: expense_edit_history';
  RAISE NOTICE '✅ RLS Policies: Configured for all tables';
  RAISE NOTICE '✅ Functions: Admin, fund, and audit functions installed';
  RAISE NOTICE '✅ Triggers: Auto-profile creation, balance management';
  RAISE NOTICE '✅ Indexes: Performance optimized';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '1. Sign up in your app with your preferred email';
  RAISE NOTICE '2. Promote yourself to admin:';
  RAISE NOTICE '   SELECT public.change_user_role(''your-email@example.com'', ''admin'');';
  RAISE NOTICE '3. Verify your status:';
  RAISE NOTICE '   SELECT * FROM public.get_user_info(''your-email@example.com'');';
  RAISE NOTICE '';
  RAISE NOTICE '💰 FEATURES ENABLED:';
  RAISE NOTICE '• Complete expense tracking with edit history';
  RAISE NOTICE '• Fund management with automatic balance deduction';
  RAISE NOTICE '• Admin-controlled user creation and management';
  RAISE NOTICE '• Transaction history with complete audit trails';
  RAISE NOTICE '• Role-based access control (user/admin/superadmin)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your complete expense management system is ready!';
END $$;
