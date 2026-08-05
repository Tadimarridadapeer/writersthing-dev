-- Fix saves table schema, constraints, and RLS policies in Supabase
-- Execute this script in your Supabase SQL Editor to enable saved stories.

-- 1. Ensure saves table exists
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT DEFAULT 'article',
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drop strict check constraint on content_type if it exists to allow 'story'
ALTER TABLE public.saves DROP CONSTRAINT IF EXISTS saves_content_type_check;
ALTER TABLE public.saves ADD CONSTRAINT saves_content_type_check CHECK (content_type IN ('book', 'article', 'blog', 'story', 'post'));

-- 3. Ensure unique constraint per user & content
ALTER TABLE public.saves DROP CONSTRAINT IF EXISTS unique_save_per_user_content;
ALTER TABLE public.saves ADD CONSTRAINT unique_save_per_user_content UNIQUE (user_id, content_id);

-- 4. Enable RLS and set policies
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saves_select_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_insert_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_delete_policy" ON public.saves;

CREATE POLICY "saves_select_policy" ON public.saves FOR SELECT USING (true);
CREATE POLICY "saves_insert_policy" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "saves_delete_policy" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

NOTIFY pgrst, 'reload schema';
