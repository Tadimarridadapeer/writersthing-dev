-- Writersthing Storage Row-Level Security (RLS) Recovery Schema
-- Execute this script in your Supabase SQL Editor to resolve all storage RLS upload errors!

-- =========================================================================
-- 1. INITIALIZE ALL STORAGE BUCKETS
-- =========================================================================

-- Create public 'profiles' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true) 
ON CONFLICT (id) DO NOTHING;

-- Create public 'covers' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true) 
ON CONFLICT (id) DO NOTHING;

-- Create public 'article-images' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('article-images', 'article-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create public 'blog-images' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create private 'books' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', false) 
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- 2. DROP CONFLICTING POLICIES IF ANY
-- =========================================================================

DROP POLICY IF EXISTS "Public covers select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated covers insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated covers update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated covers delete" ON storage.objects;

DROP POLICY IF EXISTS "Public article-images select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated article-images insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated article-images update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated article-images delete" ON storage.objects;

DROP POLICY IF EXISTS "Public blog-images select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated blog-images insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated blog-images update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated blog-images delete" ON storage.objects;

DROP POLICY IF EXISTS "Owner books select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated books insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated books update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated books delete" ON storage.objects;


-- =========================================================================
-- 3. APPLY SECURITY POLICIES FOR 'covers' BUCKET
-- =========================================================================

CREATE POLICY "Public covers select" ON storage.objects 
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Authenticated covers insert" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated covers update" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated covers delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);


-- =========================================================================
-- 4. APPLY SECURITY POLICIES FOR 'article-images' BUCKET
-- =========================================================================

CREATE POLICY "Public article-images select" ON storage.objects 
  FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated article-images insert" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'article-images' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated article-images update" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'article-images' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'article-images' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated article-images delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'article-images' AND split_part(name, '/', 1) = auth.uid()::text);


-- =========================================================================
-- 5. APPLY SECURITY POLICIES FOR 'blog-images' BUCKET
-- =========================================================================

CREATE POLICY "Public blog-images select" ON storage.objects 
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated blog-images insert" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'blog-images' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated blog-images update" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'blog-images' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'blog-images' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated blog-images delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'blog-images' AND split_part(name, '/', 1) = auth.uid()::text);


-- =========================================================================
-- 6. APPLY SECURITY POLICIES FOR 'books' BUCKET (PRIVATE MANUSCRIPTS)
-- =========================================================================

CREATE POLICY "Owner books select" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'books' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated books insert" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'books' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated books update" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'books' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'books' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY "Authenticated books delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'books' AND split_part(name, '/', 1) = auth.uid()::text);
