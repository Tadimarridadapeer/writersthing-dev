-- =========================================================================================
-- OPERATIONS PORTAL - FOUNDING WRITERS SCHEMA
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.founding_writers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_number INTEGER UNIQUE CHECK (founder_number BETWEEN 1 AND 100),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Invited', 'Accepted', 'Inactive')),
    invited_by UUID REFERENCES public.operations_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.founding_writers ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage founding writers
CREATE POLICY "Super Admins can manage founding writers" ON public.founding_writers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou 
    JOIN public.roles r ON ou.role_id = r.id 
    WHERE ou.id = auth.uid() AND r.name = 'Super Admin'
  )
);

-- Admins might view them
CREATE POLICY "Admins can view founding writers" ON public.founding_writers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou 
    WHERE ou.id = auth.uid()
  )
);
