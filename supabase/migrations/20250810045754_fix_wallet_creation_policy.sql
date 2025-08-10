-- Fix wallet creation RLS policy that was blocking admin wallet creation
-- The original policy only checked if user was admin, but didn't allow creating wallets for managed users

-- Drop the existing policy
DROP POLICY IF EXISTS "admins_create_wallets" ON public.wallets;

-- Create the fixed policy that allows proper wallet creation
CREATE POLICY "admins_create_wallets" ON public.wallets 
FOR INSERT WITH CHECK (
  -- Users can create wallets for themselves
  (auth.uid() = user_id) OR
  -- Admins can create wallets for users they created
  (EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])
    AND (
      -- Superadmins can create for anyone
      admin_user.role = 'superadmin'::user_role OR
      -- Admins can create for users they created or themselves
      EXISTS (SELECT 1 FROM public.users target_user WHERE target_user.id = user_id AND (target_user.created_by = auth.uid() OR target_user.id = auth.uid()))
    )
  ))
);
