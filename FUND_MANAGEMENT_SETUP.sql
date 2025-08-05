-- =============================================================================
-- FUND MANAGEMENT EXTENSION FOR PETTY CASH TRACKER
-- =============================================================================
-- This adds fund management capabilities to the existing petty cash tracker
-- Run this AFTER the COMPLETE_SETUP.sql has been executed
-- =============================================================================

-- Create enum type for transaction types
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'expense');

-- =============================================================================
-- NEW TABLES FOR FUND MANAGEMENT
-- =============================================================================

-- User balances table
CREATE TABLE public.user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fund transactions table
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

-- Create indexes for better performance
CREATE INDEX idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX idx_fund_transactions_user_id ON public.fund_transactions(user_id);
CREATE INDEX idx_fund_transactions_admin_id ON public.fund_transactions(admin_id);
CREATE INDEX idx_fund_transactions_type ON public.fund_transactions(transaction_type);
CREATE INDEX idx_fund_transactions_created_at ON public.fund_transactions(created_at);

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
BEGIN
  -- Initialize balance if it doesn't exist
  PERFORM public.initialize_user_balance(target_user_id);
  
  SELECT balance INTO user_balance
  FROM public.user_balances
  WHERE user_id = target_user_id;
  
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
  
  -- Get current balance
  previous_balance := public.get_user_balance(target_user_id);
  new_balance := previous_balance + amount;
  
  -- Update balance
  UPDATE public.user_balances
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Record transaction
  INSERT INTO public.fund_transactions (
    user_id, admin_id, transaction_type, amount,
    previous_balance, new_balance, description
  ) VALUES (
    target_user_id, admin_user_id, 'deposit', amount,
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
  
  -- Get current balance
  previous_balance := public.get_user_balance(target_user_id);
  new_balance := previous_balance - amount;
  
  -- Update balance (allow negative balance as per requirements)
  UPDATE public.user_balances
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Record transaction
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
    COALESCE(ub.balance, 0.00) as balance,
    pu.created_at,
    au.email::TEXT
  FROM public.users pu
  JOIN auth.users au ON pu.id = au.id
  LEFT JOIN public.user_balances ub ON pu.id = ub.user_id
  WHERE pu.created_by = admin_id
  ORDER BY pu.created_at DESC;
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

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update updated_at timestamp on user_balances
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

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

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant necessary permissions
GRANT ALL ON public.user_balances TO authenticated;
GRANT ALL ON public.fund_transactions TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.initialize_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_funds(UUID, NUMERIC, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_funds(UUID, NUMERIC, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_with_balances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_fund_transactions(UUID, INTEGER) TO authenticated;

-- =============================================================================
-- UPDATE EXISTING EXPENSES TRIGGER
-- =============================================================================

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
  
  -- Log the result (optional, for debugging)
  -- RAISE NOTICE 'Balance deduction result: %', deduct_result;
  
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

-- =============================================================================
-- SETUP COMPLETION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '💰 FUND MANAGEMENT SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created: user_balances, fund_transactions';
  RAISE NOTICE '✅ Functions installed for fund management';
  RAISE NOTICE '✅ Automatic balance deduction on expenses';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Triggers for balance initialization';
  RAISE NOTICE '';
  RAISE NOTICE '💡 FEATURES ADDED:';
  RAISE NOTICE '• Admins can deposit funds to users they created';
  RAISE NOTICE '• Users balance is automatically deducted on expenses';
  RAISE NOTICE '• Negative balances are allowed';
  RAISE NOTICE '• Complete transaction history tracking';
  RAISE NOTICE '• Balance information in admin views';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Fund management is now ready for your petty cash tracker!';
END $$;
