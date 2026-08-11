-- ==============================================================================
-- 🚀 THE ULTIMATE DATABASE FIX MIGRATION
-- Copy ALL text below and run it in the Supabase SQL Editor.
-- This script safely fixes the "400 Bad Request" and "500 Internal Error" issues.
-- ==============================================================================

DO $$
BEGIN
    -------------------------------------------------------------------------
    -- 1. FIX COLUMN TYPES (Changing UUID to TEXT for string slugs)
    -------------------------------------------------------------------------
    -- Comments
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'content_id') THEN
        ALTER TABLE comments ALTER COLUMN content_id TYPE TEXT USING content_id::text;
    END IF;

    -- Likes
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'content_id') THEN
        ALTER TABLE likes ALTER COLUMN content_id TYPE TEXT USING content_id::text;
    END IF;

    -- Saves
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'saves' AND column_name = 'content_id') THEN
        ALTER TABLE saves ALTER COLUMN content_id TYPE TEXT USING content_id::text;
    END IF;

    -- Reviews
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'content_id') THEN
        ALTER TABLE reviews ALTER COLUMN content_id TYPE TEXT USING content_id::text;
    END IF;

    -- Impressions
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'impressions' AND column_name = 'content_id') THEN
        ALTER TABLE impressions ALTER COLUMN content_id TYPE TEXT USING content_id::text;
    END IF;

    -------------------------------------------------------------------------
    -- 2. ADD MISSING FOREIGN KEYS SAFELY
    -------------------------------------------------------------------------
    -- Comments -> Users
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'comments_user_id_fkey') THEN
        ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Likes -> Users
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'likes_user_id_fkey') THEN
        ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Saves -> Users
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'saves_user_id_fkey') THEN
        ALTER TABLE saves ADD CONSTRAINT saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Reviews -> Users
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Notifications -> Users
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
        ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'notifications_actor_id_fkey') THEN
        ALTER TABLE notifications ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

END $$;

-- -------------------------------------------------------------------------
-- 3. REFRESH CACHE
-- -------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
