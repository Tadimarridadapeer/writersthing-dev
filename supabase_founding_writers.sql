-- Create the founding_writers table (if not exists)
CREATE TABLE IF NOT EXISTS public.founding_writers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_number INTEGER UNIQUE NOT NULL CHECK (founder_number >= 1 AND founder_number <= 100),
  full_name TEXT NOT NULL,
  email_address TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Invited' CHECK (status IN ('Pending', 'Invited', 'Accepted', 'Inactive')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.founding_writers ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status bypassing RLS to prevent recursion issues
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operations_users ou
    JOIN public.roles r ON ou.role_id = r.id
    WHERE ou.id = auth.uid() AND (r.name = 'Admin' OR r.name = 'Super Admin')
  );
$$;

-- Safely drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public founding writers are viewable by everyone" ON public.founding_writers;
DROP POLICY IF EXISTS "Admins can manage founding writers" ON public.founding_writers;
DROP POLICY IF EXISTS "Admins can insert founding writers" ON public.founding_writers;
DROP POLICY IF EXISTS "Admins can update founding writers" ON public.founding_writers;
DROP POLICY IF EXISTS "Admins can delete founding writers" ON public.founding_writers;

-- Create separated explicit policies for maximum safety
CREATE POLICY "Public founding writers are viewable by everyone" ON public.founding_writers FOR SELECT USING (true);
CREATE POLICY "Admins can insert founding writers" ON public.founding_writers FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update founding writers" ON public.founding_writers FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete founding writers" ON public.founding_writers FOR DELETE USING (public.is_admin());

-- Force PostgREST to reload the schema cache so the API recognizes everything immediately
NOTIFY pgrst, 'reload schema';
