-- Fix transaction type enum usage in functions
-- The enum uses 'fund_in'/'fund_out' not 'credit'/'debit'

-- Fix get_user_balance function to use correct enum values
CREATE OR REPLACE FUNCTION public.get_user_balance(target_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_balance NUMERIC DEFAULT 0;
BEGIN
  -- Calculate balance from fund_transactions using correct enum values
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'fund_in' THEN amount
      WHEN transaction_type = 'fund_out' THEN -amount
      ELSE 0
    END
  ), 0) INTO total_balance
  FROM public.fund_transactions
  WHERE user_id = target_user_id;
  
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
