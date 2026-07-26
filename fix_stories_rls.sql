-- ==========================================================
-- WRITERSTHING - FIX RLS FOR STORIES TABLE
-- ==========================================================
-- This script configures Row Level Security (RLS) for the "stories" table.
-- It resolves the "new row violates row-level security policy for table 'stories'" error.
--
-- INSTRUCTIONS:
-- Paste and run this script inside your Supabase SQL Editor.
-- ==========================================================

-- 1. Enable RLS on the stories table (if not already enabled)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_update_policy" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_policy" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.stories;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.stories;

-- 3. Create new RLS policies

-- SELECT: Allow anyone to view Published stories, or the Author (via authors table user_id mapping) or Admin to view Drafts
CREATE POLICY "stories_select_policy" ON public.stories 
FOR SELECT USING (
    status = 'Published' 
    OR author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid()) 
    OR public.is_admin()
);

-- INSERT: Authors can only create stories where they are the owner
CREATE POLICY "stories_insert_policy" ON public.stories 
FOR INSERT TO authenticated 
WITH CHECK (
    author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid())
);

-- UPDATE: Authors (or Admins) can edit stories
CREATE POLICY "stories_update_policy" ON public.stories 
FOR UPDATE TO authenticated 
USING (
    author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid()) 
    OR public.is_admin()
) 
WITH CHECK (
    author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid()) 
    OR public.is_admin()
);

-- DELETE: Authors (or Admins) can delete stories
CREATE POLICY "stories_delete_policy" ON public.stories 
FOR DELETE TO authenticated 
USING (
    author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid()) 
    OR public.is_admin()
);
