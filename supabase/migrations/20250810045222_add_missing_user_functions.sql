-- Add the missing get_admin_users_with_balances function
-- This function is called by the API but was missing from the database

CREATE OR REPLACE FUNCTION public.get_admin_users_with_balances(admin_id UUID)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  role user_role,
  balance NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_users_with_balances(UUID) TO authenticated;
