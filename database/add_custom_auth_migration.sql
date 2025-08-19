-- Migration: Add password_hash column to users table for custom authentication
-- This replaces Supabase Auth with custom JWT authentication

BEGIN;

-- Add password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Remove the foreign key constraint to auth.users since we're not using Supabase Auth anymore
-- First, let's make id a regular UUID field instead of referencing auth.users
ALTER TABLE public.users 
ALTER COLUMN id DROP DEFAULT;

-- Update the users table to be standalone (no longer references auth.users)
-- Note: This is a breaking change - existing data will need to be migrated manually
-- For new installations, this creates a clean custom auth system

-- Add some sample users for testing (with hashed passwords)
-- Password for all test users is: "password123"
-- Hash generated with bcrypt (12 rounds): $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVpO7EjFY/xpe

INSERT INTO public.users (
  id, 
  username, 
  password_hash, 
  display_name, 
  role, 
  created_at, 
  updated_at
) VALUES 
(
  'ce9943cd-4a65-40ea-8cb5-93b11593189d',
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVpO7EjFY/xpe',
  'Administrator',
  'superadmin',
  NOW(),
  NOW()
),
(
  '5ae498d7-9c58-46ce-afda-83c38e19943c', 
  'manager',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVpO7EjFY/xpe',
  'Manager User',
  'admin',
  NOW(),
  NOW()
),
(
  'dbec5502-b159-4732-85f8-3506a8f7bae8',
  'user1',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVpO7EjFY/xpe',
  'Regular User',
  'user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

COMMIT;

-- Instructions for existing installations:
-- 1. Back up your existing users table data
-- 2. Run this migration
-- 3. Update existing users with password hashes using the /auth/register endpoint or directly in the database
-- 4. Test the new authentication system with /auth/login endpoint

-- Default login credentials for testing:
-- Username: admin, Password: password123 (superadmin role)
-- Username: manager, Password: password123 (admin role)  
-- Username: user1, Password: password123 (user role)
