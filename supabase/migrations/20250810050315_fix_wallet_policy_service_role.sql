-- Fix wallet creation policy to allow service role
-- The service role should be able to bypass RLS for admin operations

-- Drop the existing policy
DROP POLICY IF EXISTS "admins_create_wallets" ON public.wallets;

-- Create a new policy that allows service role access
CREATE POLICY "admins_create_wallets" ON public.wallets
FOR INSERT
WITH CHECK (
  -- Allow service role (no auth context) to insert
  auth.role() = 'service_role'
  OR
  -- Allow authenticated users who are admins to create wallets for users they manage
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.users managed_user
      WHERE managed_user.id = user_id
      AND managed_user.created_by = auth.uid()
    )
  )
);
