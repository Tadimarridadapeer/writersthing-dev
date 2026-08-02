-- Writersthing Programs and Badges Schema

-- 1. Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_capacity INTEGER, -- NULL means unlimited
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert Founding Writers Program
INSERT INTO public.programs (name, description, max_capacity, current_count, is_active)
VALUES ('Founding Writers', 'The first 100 writers to join Writersthing', 100, 0, true)
ON CONFLICT (name) DO NOTHING;

-- 2. Program Applications Table
CREATE TABLE IF NOT EXISTS public.program_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  
  -- Google Form Fields
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  city TEXT,
  writer_type TEXT,
  experience TEXT,
  genres TEXT[],
  about TEXT,
  portfolio_link TEXT,
  published_before BOOLEAN,
  reason TEXT,
  expectations TEXT,
  provide_feedback BOOLEAN,
  join_community BOOLEAN,
  source TEXT,
  
  -- System Fields
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Unique constraint per program per email to avoid duplicates
  UNIQUE (program_id, email)
);

-- 3. User Badges Table (Permanent badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- e.g., 'founding_writer', 'beta_tester'
  badge_number INTEGER, -- e.g., 1 to 100 for Founding Writers
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- A user can only have one badge of a specific type
  UNIQUE (user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
DROP POLICY IF EXISTS "Allow public inserts to program_applications" ON public.program_applications;
DROP POLICY IF EXISTS "Admins can view and manage applications" ON public.program_applications;
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;


-- RLS Policies

-- Programs: Viewable by everyone
CREATE POLICY "Programs are viewable by everyone" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou
    JOIN public.roles r ON ou.role_id = r.id
    WHERE ou.id = auth.uid() AND (r.name = 'Admin' OR r.name = 'Super Admin')
  )
);

-- Program Applications: Inserts allowed (for webhook), viewing/managing restricted to Admin
CREATE POLICY "Allow public inserts to program_applications" ON public.program_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and manage applications" ON public.program_applications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou
    JOIN public.roles r ON ou.role_id = r.id
    WHERE ou.id = auth.uid() AND (r.name = 'Admin' OR r.name = 'Super Admin')
  )
);

-- User Badges: Viewable by everyone, managed by Admins
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou
    JOIN public.roles r ON ou.role_id = r.id
    WHERE ou.id = auth.uid() AND (r.name = 'Admin' OR r.name = 'Super Admin')
  )
);

NOTIFY pgrst, 'reload schema';
