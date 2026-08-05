-- Migration: Replace bank_details with upi_id in users table
-- Run this in Supabase SQL Editor

-- Step 1: Add upi_id column to users table (stores JSON array of UPI IDs)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS upi_ids JSONB DEFAULT '[]'::jsonb;

-- Step 2: Remove old bank columns from users table (if they exist)
ALTER TABLE public.users
DROP COLUMN IF EXISTS bank_details,
DROP COLUMN IF EXISTS bank_account_number,
DROP COLUMN IF EXISTS bank_ifsc_code,
DROP COLUMN IF EXISTS bank_name;

-- Step 3: Add upi_id column to books table (replaces bank_details)
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Step 4: Remove bank_details from books table
ALTER TABLE public.books
DROP COLUMN IF EXISTS bank_details;

-- Step 5: Create index for fast UPI lookups
CREATE INDEX IF NOT EXISTS idx_users_upi_ids ON public.users USING gin(upi_ids);

-- Step 6: RLS policy - only owner can manage their UPI IDs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_upi_self_update'
  ) THEN
    CREATE POLICY users_upi_self_update ON public.users
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
