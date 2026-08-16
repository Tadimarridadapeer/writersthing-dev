-- ==========================================
-- ADDING STORIES AND BLOGS TO WRITERSTHING
-- ==========================================

-- 1. Create Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  content_text TEXT, -- For short stories, content might be directly stored or rich text
  price DECIMAL(10, 2) DEFAULT 0.00, -- Stories might be free or paid
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Review', 'Published')),
  sales_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  content_html TEXT, -- Blogs usually use rich HTML content
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Review', 'Published')),
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Extend Existing Tables to Support Stories & Blogs
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blog_id UUID REFERENCES public.blogs(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 5. Add Policies
CREATE POLICY "Published stories are viewable by everyone" ON public.stories FOR SELECT USING (status = 'Published');
CREATE POLICY "Authors can manage own stories" ON public.stories FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Published blogs are viewable by everyone" ON public.blogs FOR SELECT USING (status = 'Published');
CREATE POLICY "Authors can manage own blogs" ON public.blogs FOR ALL USING (auth.uid() = author_id);


-- ==========================================
-- DEEP ENGAGEMENT ANALYTICS RPC
-- ==========================================

-- This function aggregates data across books, stories, and blogs to calculate "Deep Engagement"
CREATE OR REPLACE FUNCTION get_content_engagement(p_content_type TEXT)
RETURNS TABLE (
    content_id UUID,
    title TEXT,
    author_name TEXT,
    status TEXT,
    views_count BIGINT,
    sales_count BIGINT,
    bookmarks_count BIGINT,
    reviews_count BIGINT,
    avg_rating DECIMAL,
    engagement_score DECIMAL
) AS $$
BEGIN
    IF p_content_type = 'books' THEN
        RETURN QUERY
        SELECT 
            b.id AS content_id,
            b.title,
            u.name AS author_name,
            b.status,
            COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = b.id AND a.content_type = 'book' AND a.event_type = 'view'), 0) AS views_count,
            COALESCE((SELECT COUNT(*) FROM public.orders o WHERE o.book_id = b.id AND o.status = 'Success'), 0) AS sales_count,
            0::BIGINT AS bookmarks_count,
            0::BIGINT AS reviews_count,
            b.avg_rating,
            -- Calculate a deep engagement score: Views(1) + Sales(20)
            (
                COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = b.id AND a.content_type = 'book' AND a.event_type = 'view'), 0) * 1.0 +
                COALESCE((SELECT COUNT(*) FROM public.orders o WHERE o.book_id = b.id AND o.status = 'Success'), 0) * 20.0
            ) AS engagement_score
        FROM public.books b
        LEFT JOIN public.users u ON b.author_id = u.id
        ORDER BY engagement_score DESC;

    ELSIF p_content_type = 'stories' THEN
        RETURN QUERY
        SELECT 
            s.id AS content_id,
            s.title,
            u.name AS author_name,
            s.status,
            COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = s.id AND a.content_type = 'story' AND a.event_type = 'view'), 0) AS views_count,
            COALESCE((SELECT COUNT(*) FROM public.orders o WHERE o.story_id = s.id AND o.status = 'Success'), 0) AS sales_count,
            0::BIGINT AS bookmarks_count,
            0::BIGINT AS reviews_count,
            s.avg_rating,
            (
                COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = s.id AND a.content_type = 'story' AND a.event_type = 'view'), 0) * 1.0 +
                COALESCE((SELECT COUNT(*) FROM public.orders o WHERE o.story_id = s.id AND o.status = 'Success'), 0) * 20.0
            ) AS engagement_score
        FROM public.stories s
        LEFT JOIN public.users u ON s.author_id = u.id
        ORDER BY engagement_score DESC;

    ELSIF p_content_type = 'blogs' THEN
        RETURN QUERY
        SELECT 
            bl.id AS content_id,
            bl.title,
            u.name AS author_name,
            bl.status,
            COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = bl.id AND a.content_type = 'blog' AND a.event_type = 'view'), 0) AS views_count,
            0::BIGINT AS sales_count, -- Blogs typically don't have direct sales in this schema
            0::BIGINT AS bookmarks_count,
            0::BIGINT AS reviews_count,
            bl.avg_rating,
            (
                COALESCE((SELECT COUNT(*) FROM public.analytics_events a WHERE a.content_id = bl.id AND a.content_type = 'blog' AND a.event_type = 'view'), 0) * 1.0
            ) AS engagement_score
        FROM public.blogs bl
        LEFT JOIN public.users u ON bl.author_id = u.id
        ORDER BY engagement_score DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
