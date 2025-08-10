-- Add the missing trigger to automatically create user profiles when auth users are created
-- This trigger was missing from the database, causing user creation failures

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
