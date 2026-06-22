-- Writersthing Reader Engagement Schema Migration
-- Execute this script in your Supabase SQL Editor to establish social systems.

-- =========================================================================
-- 1. LIKES SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT CHECK (content_type IN ('book', 'article', 'blog')) NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_like_per_user_content UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS likes_content_idx ON public.likes(content_id);
CREATE INDEX IF NOT EXISTS likes_user_idx ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;

CREATE POLICY "likes_select_policy" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_policy" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_policy" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- 2. COMMENTS & RATINGS SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT CHECK (content_type IN ('book', 'article', 'blog')) NOT NULL,
  content_id UUID NOT NULL,
  comment_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure comments table has the rating column and supports optional comment text for existing databases
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.comments ALTER COLUMN comment_text DROP NOT NULL;

CREATE INDEX IF NOT EXISTS comments_content_idx ON public.comments(content_id);
CREATE INDEX IF NOT EXISTS comments_user_idx ON public.comments(user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_update_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON public.comments;

CREATE POLICY "comments_select_policy" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_policy" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_policy" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_policy" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- 3. SAVES (BOOKMARKS) SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT CHECK (content_type IN ('book', 'article', 'blog')) NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_save_per_user_content UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS saves_content_idx ON public.saves(content_id);
CREATE INDEX IF NOT EXISTS saves_user_idx ON public.saves(user_id);

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saves_select_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_insert_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_delete_policy" ON public.saves;

CREATE POLICY "saves_select_policy" ON public.saves FOR SELECT USING (true);
CREATE POLICY "saves_insert_policy" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete_policy" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- 4. IMPRESSIONS (PAGE VIEWS) SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT CHECK (content_type IN ('book', 'article', 'blog')) NOT NULL,
  content_id UUID NOT NULL,
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS impressions_content_idx ON public.impressions(content_id);

ALTER TABLE public.impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impressions_select_policy" ON public.impressions;
DROP POLICY IF EXISTS "impressions_insert_policy" ON public.impressions;

CREATE POLICY "impressions_select_policy" ON public.impressions FOR SELECT USING (true);
CREATE POLICY "impressions_insert_policy" ON public.impressions FOR INSERT WITH CHECK (true);

-- Enable realtime sync on all engagement tables safely
DO $$
BEGIN
  -- 1. Ensure the publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- 2. Add likes to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' 
      AND n.nspname = 'public' 
      AND c.relname = 'likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;

  -- 3. Add comments to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' 
      AND n.nspname = 'public' 
      AND c.relname = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;

  -- 4. Add saves to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' 
      AND n.nspname = 'public' 
      AND c.relname = 'saves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saves;
  END IF;

  -- 5. Add impressions to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' 
      AND n.nspname = 'public' 
      AND c.relname = 'impressions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.impressions;
  END IF;
END $$;

-- Notify PostgREST to instantly reload schema cache
NOTIFY pgrst, 'reload schema';
