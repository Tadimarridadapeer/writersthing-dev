-- ==========================================
-- PLATFORM SETTINGS (MAINTENANCE MODE)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce a single row
    is_maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'We are currently under maintenance. Please check back later.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the default single row if it doesn't exist
INSERT INTO public.platform_settings (id, is_maintenance_mode)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read the settings (so the frontend can check maintenance mode)
CREATE POLICY "Public can read platform settings" 
    ON public.platform_settings FOR SELECT 
    USING (true);

-- Only authenticated users (admins) can update the settings.
-- We rely on the Operations Portal frontend to check isSuperAdmin before allowing updates.
CREATE POLICY "Admins can update platform settings" 
    ON public.platform_settings FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Enable realtime for this table so the frontend updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
