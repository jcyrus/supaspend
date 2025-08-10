-- Replace the trigger function with a more robust version that includes error handling
-- This will help us identify what's failing

-- Drop the existing trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust handle_new_user function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Add some logging to help debug
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  
  -- Try to insert the user profile
  BEGIN
    INSERT INTO public.users (id, username, role, created_by)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      'user'::public.user_role,
      NULL
    );
    
    RAISE LOG 'Successfully created user profile for: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Failed to create user profile for %: % %', NEW.id, SQLSTATE, SQLERRM;
    
    -- Re-raise the exception to prevent auth user creation if profile creation fails
    RAISE;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
