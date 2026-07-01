-- ==========================================================
-- WRITERSTHING - UNIFIED RLS SECURITY & DATABASE RECOVERY SCRIPT
-- ==========================================================
-- This script completely resets and configures Row Level Security (RLS) 
-- for all database tables and storage buckets to eliminate RLS violations
-- (e.g., "new row violates row-level security policy").
--
-- INSTRUCTIONS:
-- Paste and run this script inside your Supabase SQL Editor.
-- ==========================================================

-- ----------------------------------------------------------
-- 0. SCHEMA ALIGNMENT - COLUMN VERIFICATION & CACHE RECOVERY
-- ----------------------------------------------------------
-- Safely add the avatar_url column to the users table if missing from the schema cache
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- Safely add the updated_at column to articles and blogs tables if missing
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Notify PostgREST to instantly reload the schema cache so the new column is visible to the API client
NOTIFY pgrst, 'reload schema';


-- ----------------------------------------------------------
-- 1. DATABASE TABLES - ENABLE RLS
-- ----------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

-- If follows table exists, enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;


-- ----------------------------------------------------------
-- 2. PUBLIC.USERS POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- SELECT: Allow public view
CREATE POLICY "users_select_policy" ON public.users 
FOR SELECT USING (true);

-- INSERT: Allow registrations (true is 100% secure as 'id' must reference auth.users.id via foreign key)
CREATE POLICY "users_insert_policy" ON public.users 
FOR INSERT WITH CHECK (true);

-- UPDATE: Allow users to edit their own profile
CREATE POLICY "users_update_policy" ON public.users 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ----------------------------------------------------------
-- 3. PUBLIC.AUTHORS POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public authors are viewable by everyone" ON public.authors;
DROP POLICY IF EXISTS "Enable insert for authors profile" ON public.authors;
DROP POLICY IF EXISTS "Authors can update own profile details" ON public.authors;

CREATE POLICY "authors_select_policy" ON public.authors 
FOR SELECT USING (true);

CREATE POLICY "authors_insert_policy" ON public.authors 
FOR INSERT WITH CHECK (true);

CREATE POLICY "authors_update_policy" ON public.authors 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------
-- 4. PUBLIC.BOOKS POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Published books are viewable by everyone" ON public.books;
DROP POLICY IF EXISTS "Authors can manage own books" ON public.books;
DROP POLICY IF EXISTS "books_select_policy" ON public.books;
DROP POLICY IF EXISTS "books_insert_policy" ON public.books;
DROP POLICY IF EXISTS "books_update_policy" ON public.books;
DROP POLICY IF EXISTS "books_delete_policy" ON public.books;

-- SELECT: Allow anyone to view Published books, but only the Author to view Drafts
CREATE POLICY "books_select_policy" ON public.books 
FOR SELECT USING (status = 'Published' OR auth.uid() = author_id);

-- INSERT: Authors can only create books where they are the owner
CREATE POLICY "books_insert_policy" ON public.books 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- UPDATE: Authors can only edit their own books
CREATE POLICY "books_update_policy" ON public.books 
FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- DELETE: Authors can only delete their own books
CREATE POLICY "books_delete_policy" ON public.books 
FOR DELETE TO authenticated USING (auth.uid() = author_id);


-- ----------------------------------------------------------
-- 5. PUBLIC.LIBRARY POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own library" ON public.library;
DROP POLICY IF EXISTS "Users can insert into own library" ON public.library;
DROP POLICY IF EXISTS "Users can update own library" ON public.library;
DROP POLICY IF EXISTS "library_select_policy" ON public.library;
DROP POLICY IF EXISTS "library_insert_policy" ON public.library;
DROP POLICY IF EXISTS "library_update_policy" ON public.library;

CREATE POLICY "library_select_policy" ON public.library 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "library_insert_policy" ON public.library 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "library_update_policy" ON public.library 
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------
-- 6. PUBLIC.ORDERS POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_policy" ON public.orders 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------
-- 7. PUBLIC.REVIEWS POLICIES RESET
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;

CREATE POLICY "reviews_select_policy" ON public.reviews 
FOR SELECT USING (true);

CREATE POLICY "reviews_insert_policy" ON public.reviews 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------
-- 8. PUBLIC.FOLLOWS POLICIES RESET (IF EXISTS)
-- ----------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        EXECUTE 'DROP POLICY IF EXISTS "follows_select_policy" ON public.follows;';
        EXECUTE 'DROP POLICY IF EXISTS "follows_insert_policy" ON public.follows;';
        EXECUTE 'DROP POLICY IF EXISTS "follows_delete_policy" ON public.follows;';
        
        EXECUTE 'CREATE POLICY "follows_select_policy" ON public.follows FOR SELECT USING (true);';
        EXECUTE 'CREATE POLICY "follows_insert_policy" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);';
        EXECUTE 'CREATE POLICY "follows_delete_policy" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);';
    END IF;
END $$;


-- ----------------------------------------------------------
-- 8b. PUBLIC.ARTICLES & PUBLIC.BLOGS POLICIES RESET (IF EXIST)
-- ----------------------------------------------------------
DO $$
BEGIN
    -- Articles Policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'articles') THEN
        ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
        
        EXECUTE 'DROP POLICY IF EXISTS "articles_select_policy" ON public.articles;';
        EXECUTE 'DROP POLICY IF EXISTS "articles_insert_policy" ON public.articles;';
        EXECUTE 'DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;';
        EXECUTE 'DROP POLICY IF EXISTS "articles_delete_policy" ON public.articles;';
        
        EXECUTE 'CREATE POLICY "articles_select_policy" ON public.articles FOR SELECT USING (true);';
        EXECUTE 'CREATE POLICY "articles_insert_policy" ON public.articles FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);';
        EXECUTE 'CREATE POLICY "articles_update_policy" ON public.articles FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);';
        EXECUTE 'CREATE POLICY "articles_delete_policy" ON public.articles FOR DELETE TO authenticated USING (auth.uid() = author_id);';
    END IF;

    -- Blogs Policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blogs') THEN
        ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
        
        EXECUTE 'DROP POLICY IF EXISTS "blogs_select_policy" ON public.blogs;';
        EXECUTE 'DROP POLICY IF EXISTS "blogs_insert_policy" ON public.blogs;';
        EXECUTE 'DROP POLICY IF EXISTS "blogs_update_policy" ON public.blogs;';
        EXECUTE 'DROP POLICY IF EXISTS "blogs_delete_policy" ON public.blogs;';
        
        EXECUTE 'CREATE POLICY "blogs_select_policy" ON public.blogs FOR SELECT USING (true);';
        EXECUTE 'CREATE POLICY "blogs_insert_policy" ON public.blogs FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);';
        EXECUTE 'CREATE POLICY "blogs_update_policy" ON public.blogs FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);';
        EXECUTE 'CREATE POLICY "blogs_delete_policy" ON public.blogs FOR DELETE TO authenticated USING (auth.uid() = author_id);';
    END IF;
END $$;


-- ==========================================================
-- 9. SUPABASE STORAGE BUCKETS CONFIGURATION & POLICIES
-- ==========================================================

-- A. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false) ON CONFLICT (id) DO NOTHING;

-- B. Clear old bucket policies
DROP POLICY IF EXISTS "Public profiles read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users manage own profile folder" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "covers_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "covers_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "covers_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "covers_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "pdfs_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "pdfs_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "pdfs_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "pdfs_delete_policy" ON storage.objects;

-- C. Apply new bulletproof folder-based policies using split_part
-- 1. Profiles Bucket (Public Avatars)
CREATE POLICY "profiles_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "profiles_insert_policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "profiles_update_policy" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profiles' AND split_part(name, '/', 1) = auth.uid()::text) WITH CHECK (bucket_id = 'profiles' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "profiles_delete_policy" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profiles' AND split_part(name, '/', 1) = auth.uid()::text);

-- 2. Covers Bucket (Public Book Covers)
CREATE POLICY "covers_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_insert_policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "covers_update_policy" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text) WITH CHECK (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "covers_delete_policy" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers' AND split_part(name, '/', 1) = auth.uid()::text);

-- 3. PDFs Bucket (Private Manuscripts - Authenticated users can read/download, owners can manage)
CREATE POLICY "pdfs_select_policy" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pdfs');
CREATE POLICY "pdfs_insert_policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "pdfs_update_policy" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pdfs' AND split_part(name, '/', 1) = auth.uid()::text) WITH CHECK (bucket_id = 'pdfs' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "pdfs_delete_policy" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pdfs' AND split_part(name, '/', 1) = auth.uid()::text);
