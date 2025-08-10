-- Fix missing functions that are causing API errors
-- Ensure all functions exist with correct parameter order

-- Drop and recreate get_user_fund_transactions with correct signature
DROP FUNCTION IF EXISTS public.get_user_fund_transactions(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_fund_transactions(INTEGER, UUID);

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
    admin_user.username,
    ft.created_at
  FROM public.fund_transactions ft
  LEFT JOIN public.users admin_user ON ft.admin_id = admin_user.id
  WHERE ft.user_id = target_user_id
  ORDER BY ft.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_fund_transactions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_fund_transactions(UUID, INTEGER) TO service_role;

-- Also ensure get_user_balance function exists
CREATE OR REPLACE FUNCTION public.get_user_balance(target_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_balance NUMERIC DEFAULT 0;
BEGIN
  -- Calculate balance from fund_transactions
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'credit' THEN amount
      WHEN transaction_type = 'debit' THEN -amount
      ELSE 0
    END
  ), 0) INTO total_balance
  FROM public.fund_transactions
  WHERE user_id = target_user_id;
  
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for balance function
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID) TO service_role;
