-- =============================================================================
-- PETTY CASH TRACKER - COMPLETE DATABASE SETUP FOR EMPTY DATABASE
-- =============================================================================
-- This is designed for a FRESH/EMPTY Supabase database
-- Run this ONCE in your Supabase SQL Editor
-- =============================================================================
-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users table (extends Supabase auth.users with admin tracking)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_by ON public.users(created_by);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to change user role (admin management)
CREATE OR REPLACE FUNCTION public.change_user_role(user_email TEXT, new_role user_role)
RETURNS TEXT AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if user exists
  SELECT COUNT(*) INTO user_count
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email = user_email;
  
  IF user_count = 0 THEN
    RETURN 'Error: User with email ' || user_email || ' not found';
  END IF;
  
  -- Update user role
  UPDATE public.users 
  SET role = new_role, updated_at = NOW()
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = user_email
  );
  
  RETURN 'Success: User ' || user_email || ' role changed to ' || new_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users created by a specific admin
CREATE OR REPLACE FUNCTION public.get_admin_users(admin_id UUID)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pu.id,
    pu.username,
    pu.role,
    pu.created_at,
    au.email::TEXT
  FROM public.users pu
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_by = admin_id
  ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expenses for users created by a specific admin
CREATE OR REPLACE FUNCTION public.get_admin_user_expenses(admin_id UUID)
RETURNS TABLE(
  expense_id UUID,
  user_id UUID,
  username TEXT,
  user_email TEXT,
  date DATE,
  amount NUMERIC,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.user_id,
    pu.username,
    au.email::TEXT,
    e.date,
    e.amount,
    e.category,
    e.description,
    e.created_at
  FROM public.expenses e
  JOIN public.users pu ON e.user_id = pu.id
  JOIN auth.users au ON pu.id = au.id
  WHERE pu.created_by = admin_id
  ORDER BY e.date DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user info (debugging helper)
CREATE OR REPLACE FUNCTION public.get_user_info(user_email TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  username TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    pu.username,
    pu.role,
    pu.created_at
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely get current user role (prevents RLS recursion)
-- This function bypasses RLS to avoid circular dependencies during setup
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  -- Use a security definer function that bypasses RLS
  SELECT role INTO user_role_result
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_result, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS (Create before RLS policies)
-- =============================================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - BASIC SETUP
-- =============================================================================

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Basic Users table policies (no function dependencies)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view created users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR created_by = auth.uid()
  );

-- Basic Expenses table policies (no function dependencies)
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view managed user expenses" ON public.expenses
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = expenses.user_id 
      AND u.created_by = auth.uid()
    )
  );

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.expenses TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_expenses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_superadmin(TEXT) TO authenticated;

-- =============================================================================
-- ADVANCED RLS POLICIES (Add superadmin policies now that functions exist)
-- =============================================================================

-- Add superadmin policies that use the get_current_user_role function
CREATE POLICY "Superadmins can view all users" ON public.users
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

CREATE POLICY "Superadmins can view all expenses" ON public.expenses
  FOR SELECT USING (
    public.get_current_user_role() = 'superadmin'
  );

-- =============================================================================
-- SEED DATA - FIRST SUPERADMIN USER
-- =============================================================================

-- Function to promote an existing auth user to superadmin
CREATE OR REPLACE FUNCTION public.promote_to_superadmin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  auth_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RETURN 'Error: No auth user found with email ' || user_email || '. Please create this user in Supabase Auth dashboard first.';
  END IF;
  
  -- Check if user profile exists
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth_user_id
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Update existing profile to superadmin
    UPDATE public.users 
    SET role = 'superadmin', updated_at = NOW()
    WHERE id = auth_user_id;
    
    RETURN 'Success: ' || user_email || ' promoted to superadmin';
  ELSE
    -- Create new profile as superadmin
    INSERT INTO public.users (id, username, role, created_by)
    VALUES (
      auth_user_id,
      split_part(user_email, '@', 1),
      'superadmin',
      NULL
    );
    
    RETURN 'Success: ' || user_email || ' created as superadmin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup instructions for creating your first superadmin
DO $$
DECLARE
  admin_email TEXT := 'admin@yourcompany.com';  -- CHANGE THIS TO YOUR EMAIL
BEGIN
  RAISE NOTICE '🔐 SUPERADMIN SETUP READY!';
  RAISE NOTICE '';
  RAISE NOTICE '📧 TO CREATE YOUR FIRST SUPERADMIN:';
  RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '2. Click "Add User" and create user with email: %', admin_email;
  RAISE NOTICE '3. After creating the auth user, run this command:';
  RAISE NOTICE '   SELECT public.promote_to_superadmin(''%'');', admin_email;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 ALTERNATIVE METHODS:';
  RAISE NOTICE '• Use existing auth user: SELECT public.promote_to_superadmin(''existing-email@company.com'');';
  RAISE NOTICE '• Or use the general function: SELECT public.change_user_role(''email@company.com'', ''superadmin'');';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- SETUP COMPLETION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 PETTY CASH TRACKER SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created: users, expenses';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Admin functions installed';
  RAISE NOTICE '✅ Auto-profile creation enabled';
  RAISE NOTICE '✅ Superadmin seed prepared';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS TO CREATE YOUR SUPERADMIN:';
  RAISE NOTICE '1. Sign up in your app with your preferred email';
  RAISE NOTICE '2. Promote yourself to superadmin:';
  RAISE NOTICE '   SELECT public.change_user_role(''your-email@example.com'', ''superadmin'');';
  RAISE NOTICE '3. Verify your superadmin status:';
  RAISE NOTICE '   SELECT * FROM public.get_user_info(''your-email@example.com'');';
  RAISE NOTICE '';
  RAISE NOTICE '� ADMIN WORKFLOW:';
  RAISE NOTICE '• Superadmin can create admins and view all data';
  RAISE NOTICE '• Admins can create users and manage their data';
  RAISE NOTICE '• Users can only manage their own expenses';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your admin-controlled expense tracker is ready!';
END $$;
