-- Add new columns to authors for UPI Cooldown and Verification
ALTER TABLE public.authors 
ADD COLUMN IF NOT EXISTS last_upi_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS upi_verified BOOLEAN DEFAULT false;
