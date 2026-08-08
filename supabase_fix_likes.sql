-- Fix likes table schema, constraints, and RLS policies in Supabase
-- Execute this script in your Supabase SQL Editor to allow 'story' likes.

-- 1. Ensure likes table exists
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT DEFAULT 'article',
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drop strict check constraint on content_type if it exists to allow 'story'
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_content_type_check;
ALTER TABLE public.likes ADD CONSTRAINT likes_content_type_check CHECK (content_type IN ('book', 'article', 'blog', 'story', 'post'));

-- 3. Ensure unique constraint per user & content
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS unique_like_per_user_content;
ALTER TABLE public.likes ADD CONSTRAINT unique_like_per_user_content UNIQUE (user_id, content_id);

-- 4. Enable RLS and set policies
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;

CREATE POLICY "likes_select_policy" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_policy" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "likes_delete_policy" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

NOTIFY pgrst, 'reload schema';
