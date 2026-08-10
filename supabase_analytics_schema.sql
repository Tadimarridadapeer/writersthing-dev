-- Create enum for content types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE content_type_enum AS ENUM ('book', 'story', 'blog');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for event types
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM ('view', 'read_completion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Analytics Events Table (Raw Tracking)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type content_type_enum NOT NULL,
    content_id UUID NOT NULL,
    event_type event_type_enum NOT NULL,
    viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT,
    device_type TEXT,
    country TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying and aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON public.analytics_events(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_viewer ON public.analytics_events(viewer_id);

-- 2. Daily Aggregates Table (Optimized for Dashboards)
CREATE TABLE IF NOT EXISTS public.analytics_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    content_type content_type_enum NOT NULL,
    content_id UUID NOT NULL,
    total_views INT DEFAULT 0,
    unique_readers INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, content_type, content_id)
);

-- Indexes for dashboards
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_aggregates(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_content ON public.analytics_daily_aggregates(content_type, content_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- Analytics Events RLS Policies
-- 1. Anyone can insert an event (tracking)
CREATE POLICY "Anyone can insert analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- 2. Users can only view events for their OWN content
-- We need to join with the respective tables to verify ownership
CREATE POLICY "Users can view analytics for their own books"
    ON public.analytics_events FOR SELECT
    USING (
        content_type = 'book' AND
        content_id IN (SELECT id FROM public.books WHERE author_id = auth.uid())
    );

CREATE POLICY "Users can view analytics for their own stories"
    ON public.analytics_events FOR SELECT
    USING (
        content_type = 'story' AND
        content_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
    );

CREATE POLICY "Users can view analytics for their own blogs"
    ON public.analytics_events FOR SELECT
    USING (
        content_type = 'blog' AND
        content_id IN (SELECT id FROM public.blogs WHERE author_id = auth.uid())
    );

-- Daily Aggregates RLS Policies (Read-Only for users)
CREATE POLICY "Users can view aggregates for their own books"
    ON public.analytics_daily_aggregates FOR SELECT
    USING (
        content_type = 'book' AND
        content_id IN (SELECT id FROM public.books WHERE author_id = auth.uid())
    );

CREATE POLICY "Users can view aggregates for their own stories"
    ON public.analytics_daily_aggregates FOR SELECT
    USING (
        content_type = 'story' AND
        content_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
    );

CREATE POLICY "Users can view aggregates for their own blogs"
    ON public.analytics_daily_aggregates FOR SELECT
    USING (
        content_type = 'blog' AND
        content_id IN (SELECT id FROM public.blogs WHERE author_id = auth.uid())
    );

-- Create a secure RPC function to log views (this prevents clients from sending fake aggregate data directly)
CREATE OR REPLACE FUNCTION log_content_view(
    p_content_type content_type_enum,
    p_content_id UUID,
    p_viewer_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.analytics_events (
        content_type, content_id, event_type, viewer_id, session_id, device_type, country, referrer
    ) VALUES (
        p_content_type, p_content_id, 'view', p_viewer_id, p_session_id, p_device_type, p_country, p_referrer
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
