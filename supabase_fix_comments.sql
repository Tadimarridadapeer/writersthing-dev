-- Writersthing Comments Database Reconciler & Fix
-- Execute this script in your Supabase SQL Editor to resolve comment posting issues.

-- 1. Ensure comments table exists with flexible columns
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT DEFAULT 'story',
  content_id UUID,
  post_id TEXT,
  comment_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Safely add missing columns to pre-existing comments tables
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'story';
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS post_id TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.comments ALTER COLUMN comment_text DROP NOT NULL;

-- 3. Update constraint to allow 'story', 'book', 'article', 'blog', 'post'
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_content_type_check;
ALTER TABLE public.comments ADD CONSTRAINT comments_content_type_check CHECK (content_type IN ('book', 'article', 'blog', 'story', 'post'));

-- 4. Re-establish indices for speed
CREATE INDEX IF NOT EXISTS comments_content_idx ON public.comments(content_id);
CREATE INDEX IF NOT EXISTS comments_post_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_idx ON public.comments(user_id);

-- 5. Row-Level Security Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_update_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON public.comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;

CREATE POLICY "comments_select_policy" ON public.comments 
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON public.comments 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "comments_update_policy" ON public.comments 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy" ON public.comments 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
