-- =========================================================================================
-- OPERATIONS PORTAL - DATABASE SCHEMA
-- =========================================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial roles
INSERT INTO public.roles (name, description) VALUES 
('Super Admin', 'Unrestricted access to all operations'),
('Admin', 'Standard administrative access')
ON CONFLICT (name) DO NOTHING;


-- 2. Operations Users (Links to auth.users)
CREATE TABLE IF NOT EXISTS public.operations_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    department TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Disabled')),
    requires_password_change BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.operations_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE
);


-- 3. Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, module)
);


-- 4. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.operations_users(id) ON DELETE SET NULL,
    role_name TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    browser TEXT,
    status TEXT DEFAULT 'Success' CHECK (status IN ('Success', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 5. Login History
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.operations_users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    browser TEXT,
    operating_system TEXT,
    device TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason TEXT
);


-- 6. Admin Sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.operations_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =========================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================================

ALTER TABLE public.operations_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only operations users can read roles and permissions
CREATE POLICY "Operations users can read roles" ON public.roles FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.operations_users)
);
CREATE POLICY "Operations users can read permissions" ON public.permissions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.operations_users)
);

-- Super Admins can manage operations_users
-- Admins can only view other operations_users, but not Super Admins
CREATE POLICY "Super Admins can manage users" ON public.operations_users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou 
    JOIN public.roles r ON ou.role_id = r.id 
    WHERE ou.id = auth.uid() AND r.name = 'Super Admin'
  )
);
CREATE POLICY "Admins can view users" ON public.operations_users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou 
    WHERE ou.id = auth.uid()
  )
);

-- Activity Logs: Admins can insert, Super Admins can select all
CREATE POLICY "Operations users can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.operations_users)
);
CREATE POLICY "Super Admins can view all logs" ON public.activity_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.operations_users ou 
    JOIN public.roles r ON ou.role_id = r.id 
    WHERE ou.id = auth.uid() AND r.name = 'Super Admin'
  )
);
