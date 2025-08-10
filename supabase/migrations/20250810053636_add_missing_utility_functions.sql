-- Add missing utility functions that are referenced but not created

-- Ensure get_current_user_role function exists
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_result, 'user'::user_role);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create calculate_wallet_balance function (missing from original setup)
CREATE OR REPLACE FUNCTION public.calculate_wallet_balance(wallet_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  balance_result NUMERIC DEFAULT 0;
  wallet_currency currency_type;
BEGIN
  -- Get wallet currency for validation
  SELECT currency INTO wallet_currency
  FROM public.wallets
  WHERE id = wallet_id_param;
  
  IF wallet_currency IS NULL THEN
    RETURN 0; -- Wallet doesn't exist
  END IF;
  
  -- Calculate balance from fund_transactions for this wallet's user
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'fund_in' THEN amount
      WHEN transaction_type = 'deposit' THEN amount
      WHEN transaction_type = 'fund_out' THEN -amount
      WHEN transaction_type = 'expense' THEN -amount
      WHEN transaction_type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0) INTO balance_result
  FROM public.fund_transactions ft
  JOIN public.wallets w ON ft.user_id = w.user_id
  WHERE w.id = wallet_id_param;
  
  RETURN balance_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_wallet_balance(UUID) TO service_role;
