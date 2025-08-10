-- Fix the wallet creation function to remove the non-existent balance column
CREATE OR REPLACE FUNCTION public.create_user_wallet(
  p_user_id UUID,
  p_currency currency_type,
  p_name TEXT,
  p_is_default BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  wallet_result RECORD;
BEGIN
  -- Insert the wallet (no balance column - calculated from transactions)
  INSERT INTO public.wallets (user_id, currency, name, is_default)
  VALUES (p_user_id, p_currency, p_name, p_is_default)
  RETURNING * INTO wallet_result;
  
  -- Return the created wallet as JSON
  RETURN row_to_json(wallet_result);
END;
$$;
