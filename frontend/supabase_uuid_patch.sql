-- ==========================================
-- SUPABASE COLUMN TYPE PATCH
-- Run this in your Supabase SQL Editor
-- ==========================================

-- The frontend uses string slugs (like "my-blog-post") for URLs.
-- If your tables were created with content_id as UUID, they will throw 
-- a 400 Bad Request ("invalid input syntax for type uuid").
-- This script converts those columns to TEXT to allow string slugs.

ALTER TABLE comments ALTER COLUMN content_id TYPE TEXT USING content_id::text;
ALTER TABLE likes ALTER COLUMN content_id TYPE TEXT USING content_id::text;
ALTER TABLE saves ALTER COLUMN content_id TYPE TEXT USING content_id::text;
ALTER TABLE reviews ALTER COLUMN content_id TYPE TEXT USING content_id::text;

-- Reload schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
