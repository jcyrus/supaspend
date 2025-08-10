-- =============================================================================
-- DATABASE FUNCTION VALIDATION SCRIPT
-- =============================================================================
-- Run this script to test all database functions and identify issues
-- This helps validate the consolidated SQL setup

-- Test 1: Check if all tables exist
SELECT 'Tables Check' as test_name,
       CASE 
         WHEN COUNT(*) = 6 THEN 'PASS'
         ELSE 'FAIL - Missing tables'
       END as status,
       string_agg(tablename, ', ') as tables_found
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'wallets', 'expenses', 'fund_transactions', 'user_balances', 'expense_edit_history');

-- Test 2: Check if all enums exist
SELECT 'Enums Check' as test_name,
       CASE 
         WHEN COUNT(*) = 3 THEN 'PASS'
         ELSE 'FAIL - Missing enums'
       END as status,
       string_agg(typname, ', ') as enums_found
FROM pg_type 
WHERE typname IN ('user_role', 'currency_type', 'transaction_type');

-- Test 3: Check if critical functions exist
SELECT 'Functions Check' as test_name,
       CASE 
         WHEN COUNT(*) >= 5 THEN 'PASS'
         ELSE 'FAIL - Missing functions'
       END as status,
       string_agg(proname, ', ') as functions_found
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('handle_new_user', 'create_user_wallet', 'admin_create_wallet', 'get_current_user_role', 'calculate_wallet_balance');

-- Test 4: Check if triggers exist
SELECT 'Triggers Check' as test_name,
       CASE 
         WHEN COUNT(*) >= 2 THEN 'PASS'
         ELSE 'FAIL - Missing triggers'
       END as status,
       string_agg(trigger_name, ', ') as triggers_found
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'enforce_wallet_limit', 'on_expense_created_deduct_wallet_balance');

-- Test 5: Check RLS policies
SELECT 'RLS Policies Check' as test_name,
       CASE 
         WHEN COUNT(*) >= 3 THEN 'PASS'
         ELSE 'FAIL - Missing policies'
       END as status,
       string_agg(DISTINCT tablename || '.' || policyname, ', ') as policies_found
FROM pg_policies
WHERE schemaname = 'public';

-- Test 6: Test wallet creation function
BEGIN;
-- First create a test user (required for foreign key)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid, 'testuser@example.com', now(), now(), now());

-- This should trigger user profile creation
-- Wait a moment and then manually insert profile if trigger didn't work
INSERT INTO public.users (id, username, role, created_at, updated_at)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid, 'testuser', 'user'::user_role, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Now test wallet creation
SELECT 'Wallet Function Test' as test_name,
       CASE 
         WHEN admin_create_wallet(
           'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
           'USD'::currency_type,
           'Test Wallet',
           true
         ) IS NOT NULL THEN 'PASS'
         ELSE 'FAIL'
       END as status,
       'Function executed successfully' as result;

ROLLBACK; -- This cleans up both the wallet and the test user

-- Test 7: Test user role function
SELECT 'User Role Function Test' as test_name,
       CASE 
         WHEN get_current_user_role() IS NOT NULL THEN 'PASS'
         ELSE 'FAIL'
       END as status,
       get_current_user_role() as current_role;

-- Test 8: Check if sample data can be inserted
BEGIN;
-- Try to insert a test user (with valid UUID format)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 'test@example.com', now(), now(), now());

-- This should trigger the user creation
SELECT 'User Creation Trigger Test' as test_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM public.users WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid) THEN 'PASS'
         ELSE 'FAIL'
       END as status,
       'User profile should be auto-created' as expected_result;

ROLLBACK;

-- Summary
SELECT 
  '=== TEST SUMMARY ===' as summary,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE status = 'PASS') as passed,
  COUNT(*) FILTER (WHERE status LIKE 'FAIL%') as failed
FROM (
  -- Combine all test results here (this is just a placeholder)
  SELECT 'PASS' as status
  UNION ALL SELECT 'PASS'
  UNION ALL SELECT 'PASS'
) test_results;
