-- ==============================================================================
-- 🚀 FOUNDING WRITERS MIGRATION
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

DO $$
BEGIN
    -- 1. Create the table if it completely didn't exist before
    CREATE TABLE IF NOT EXISTS founding_writers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        founder_number TEXT,
        name TEXT,
        email_address TEXT UNIQUE NOT NULL,
        user_id UUID,
        status TEXT DEFAULT 'pending',
        invited_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ,
        declined_at TIMESTAMPTZ
    );

    -- 2. Add new columns to existing table safely (if it already existed)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'founding_writers' AND column_name = 'status') THEN
        ALTER TABLE founding_writers ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'founding_writers' AND column_name = 'user_id') THEN
        ALTER TABLE founding_writers ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'founding_writers' AND column_name = 'invited_at') THEN
        ALTER TABLE founding_writers ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'founding_writers' AND column_name = 'accepted_at') THEN
        ALTER TABLE founding_writers ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'founding_writers' AND column_name = 'declined_at') THEN
        ALTER TABLE founding_writers ADD COLUMN declined_at TIMESTAMPTZ;
    END IF;
    
    -- In case user_id wasn't a foreign key originally, add it safely
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'founding_writers_user_id_fkey') THEN
        ALTER TABLE founding_writers ADD CONSTRAINT founding_writers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

END $$;

NOTIFY pgrst, 'reload schema';
