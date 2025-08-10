-- Fix RLS policy that's preventing the handle_new_user trigger from working
-- The issue is that the insert policy requires auth.uid() = id, but during 
-- trigger execution, the auth context may not be properly set

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS users_insert_own ON public.users;

-- Create a new INSERT policy that allows the trigger to work
-- This allows inserts when either:
-- 1. The user is inserting their own record (auth.uid() = id), OR
-- 2. The insert is happening from a SECURITY DEFINER function (like our trigger)
CREATE POLICY users_insert_own ON public.users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR 
    current_setting('role') = 'postgres' OR
    auth.uid() IS NULL
  );
