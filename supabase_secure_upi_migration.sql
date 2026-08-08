-- Secure UPI Management Migration
-- Run this in the Supabase SQL Editor

-- 1. Modify users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active_upi_id TEXT,
ADD COLUMN IF NOT EXISTS is_upi_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_upi_change_at TIMESTAMP WITH TIME ZONE;

-- (Optional) If you want to drop the old upi_ids JSONB column, you can do so here:
-- ALTER TABLE public.users DROP COLUMN IF EXISTS upi_ids;

-- 2. Create upi_change_requests table
CREATE TABLE IF NOT EXISTS public.upi_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    old_upi_id TEXT,
    new_upi_id TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    activate_after TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    device_info TEXT
);

CREATE INDEX IF NOT EXISTS idx_upi_change_requests_user_id ON public.upi_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_upi_change_requests_status ON public.upi_change_requests(status);

-- 3. Create upi_audit_logs table
CREATE TABLE IF NOT EXISTS public.upi_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('setup', 'request_change', 'cancelled', 'activated')),
    previous_upi TEXT,
    new_upi TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    ip_address TEXT,
    device_info TEXT,
    status VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_upi_audit_logs_user_id ON public.upi_audit_logs(user_id);

-- 4. Create OTP table for UPI setup and change requests
CREATE TABLE IF NOT EXISTS public.upi_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('setup', 'change')),
    new_upi_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_upi_otps_user_id ON public.upi_otps(user_id);

-- 5. RLS Policies
-- Enable RLS
ALTER TABLE public.upi_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upi_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upi_otps ENABLE ROW LEVEL SECURITY;

-- Policies for upi_change_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own upi change requests') THEN
    CREATE POLICY "Users can view their own upi change requests" ON public.upi_change_requests FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own upi change requests') THEN
    CREATE POLICY "Users can insert their own upi change requests" ON public.upi_change_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own upi change requests') THEN
    CREATE POLICY "Users can update their own upi change requests" ON public.upi_change_requests FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies for upi_audit_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own upi audit logs') THEN
    CREATE POLICY "Users can view their own upi audit logs" ON public.upi_audit_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own upi audit logs') THEN
    CREATE POLICY "Users can insert their own upi audit logs" ON public.upi_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies for upi_otps (service role only for inserts, select/update for verify)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own upi otps') THEN
    CREATE POLICY "Users can view their own upi otps" ON public.upi_otps FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own upi otps') THEN
    CREATE POLICY "Users can update their own upi otps" ON public.upi_otps FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own upi otps') THEN
    CREATE POLICY "Users can insert their own upi otps" ON public.upi_otps FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
