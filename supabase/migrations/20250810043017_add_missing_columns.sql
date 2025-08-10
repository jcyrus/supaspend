-- Add missing columns to match the DATABASE_SETUP.sql schema
-- These columns are referenced in functions but don't exist in the database

-- Add currency column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN currency currency_type NOT NULL DEFAULT 'USD';

-- Add transaction_type column to fund_transactions table  
ALTER TABLE public.fund_transactions 
ADD COLUMN transaction_type transaction_type NOT NULL DEFAULT 'fund_in';

-- Add missing index for wallets currency
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON public.wallets(currency);
