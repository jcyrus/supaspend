-- Temporarily disable RLS on wallets table for service role operations
-- This is a more direct approach to solve the RLS issue

-- Create a function that explicitly sets the role context
CREATE OR REPLACE FUNCTION public.admin_create_wallet(
  p_user_id UUID,
  p_currency currency_type,
  p_name TEXT,
  p_is_default BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_result RECORD;
BEGIN
  -- Temporarily disable RLS for this session
  SET LOCAL row_security = off;
  
  -- Insert the wallet
  INSERT INTO public.wallets (user_id, currency, name, is_default)
  VALUES (p_user_id, p_currency, p_name, p_is_default)
  RETURNING * INTO wallet_result;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  -- Return the created wallet as JSON
  RETURN row_to_json(wallet_result);
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable RLS even on error
    SET LOCAL row_security = on;
    RAISE;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.admin_create_wallet(UUID, currency_type, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_wallet(UUID, currency_type, TEXT, BOOLEAN) TO service_role;
