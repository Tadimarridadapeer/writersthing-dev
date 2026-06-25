-- Writersthing Social + Creator Ecosystem Schema Migration
-- Execute this script in your Supabase SQL Editor to establish social systems.

-- =========================================================================
-- 1. FOLLOW SYSTEM SCHEMA
-- =========================================================================

-- Create follows table if not exists
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Prevent self-following database-wide
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Ensure follows are unique to prevent duplicate operations
CREATE UNIQUE INDEX IF NOT EXISTS follows_follower_following_idx ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

-- Enforce Row-Level Security on follows table
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Dynamic fine-grained policies for follows
DROP POLICY IF EXISTS "follows_select_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_policy" ON public.follows;

CREATE POLICY "follows_select_policy" ON public.follows 
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_policy" ON public.follows 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_policy" ON public.follows 
  FOR DELETE TO authenticated 
  USING (auth.uid() = follower_id);


-- =========================================================================
-- 2. REVIEWS & FEEDBACK SYSTEM SCHEMA
-- =========================================================================

-- Drop and recreate reviews table to enforce clean ratings and comments
DROP TABLE IF EXISTS public.reviews CASCADE;

CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT, -- maps to review_text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Enforce one review per user per book constraint database-wide
  CONSTRAINT one_review_per_book UNIQUE (user_id, book_id)
);

-- Indices for performance optimizations
CREATE INDEX IF NOT EXISTS reviews_book_idx ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews(user_id);

-- Enforce Row-Level Security on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Dynamic fine-grained policies for reviews
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_policy" ON public.reviews;

CREATE POLICY "reviews_select_policy" ON public.reviews 
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_policy" ON public.reviews 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_policy" ON public.reviews 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_policy" ON public.reviews 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);


-- =========================================================================
-- 3. AUTOMATIC BOOK RATING CALCULATOR TRIGGER
-- =========================================================================

CREATE OR REPLACE FUNCTION public.recalculate_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.books
    SET avg_rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM public.reviews
      WHERE book_id = OLD.book_id
    ), 0.00)
    WHERE id = OLD.book_id;
    RETURN OLD;
  ELSE
    UPDATE public.books
    SET avg_rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM public.reviews
      WHERE book_id = NEW.book_id
    ), 0.00)
    WHERE id = NEW.book_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_book_rating ON public.reviews;
CREATE TRIGGER trg_recalculate_book_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalculate_book_rating();


-- =========================================================================
-- 4. AUTOMATIC FOLLOWERS COUNT SYNCHRONIZATION TRIGGER
-- =========================================================================

CREATE OR REPLACE FUNCTION public.sync_author_followers()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.authors
    SET followers_count = COALESCE((
      SELECT COUNT(*)
      FROM public.follows
      WHERE following_id = OLD.following_id
    ), 0)
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  ELSE
    -- Ensure author record exists
    INSERT INTO public.authors (user_id, followers_count)
    VALUES (NEW.following_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.authors
    SET followers_count = COALESCE((
      SELECT COUNT(*)
      FROM public.follows
      WHERE following_id = NEW.following_id
    ), 0)
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_author_followers ON public.follows;
CREATE TRIGGER trg_sync_author_followers
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.sync_author_followers();


-- =========================================================================
-- 5. CREATOR REPUTATION ENGINE (DYNAMIC VIEW)
-- =========================================================================

CREATE OR REPLACE VIEW public.author_reputation AS
SELECT 
  u.id AS user_id,
  u.name AS author_name,
  u.avatar_url,
  COALESCE(a.followers_count, 0) AS followers_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM public.follows f 
    WHERE f.follower_id = u.id
  ), 0) AS following_count,
  COALESCE((
    SELECT ROUND(AVG(b.avg_rating), 2)
    FROM public.books b
    WHERE b.author_id = u.id AND b.status = 'Published'
  ), 0.00) AS avg_rating,
  COALESCE((
    SELECT COUNT(*)
    FROM public.books b
    WHERE b.author_id = u.id
  ), 0) AS uploads_count,
  COALESCE((
    SELECT SUM(b.sales_count)
    FROM public.books b
    WHERE b.author_id = u.id
  ), 0) AS total_sales,
  -- Reputation Score Formula:
  -- Score = (Followers * 5) + (Average Rating * 10) + (Published Books * 15) + (Sales Count * 2)
  (
    (COALESCE(a.followers_count, 0) * 5) +
    (COALESCE((
      SELECT AVG(b.avg_rating)
      FROM public.books b
      WHERE b.author_id = u.id AND b.status = 'Published'
    ), 0.0) * 10) +
    (COALESCE((
      SELECT COUNT(*)
      FROM public.books b
      WHERE b.author_id = u.id
    ), 0) * 15) +
    (COALESCE((
      SELECT SUM(b.sales_count)
      FROM public.books b
      WHERE b.author_id = u.id
    ), 0) * 2)
  )::INTEGER AS reputation_score,
  -- Dynamic Author Level Mapping
  CASE 
    WHEN (
      (COALESCE(a.followers_count, 0) * 5) +
      (COALESCE((
        SELECT AVG(b.avg_rating)
        FROM public.books b
        WHERE b.author_id = u.id AND b.status = 'Published'
      ), 0.0) * 10) +
      (COALESCE((
        SELECT COUNT(*)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 15) +
      (COALESCE((
        SELECT SUM(b.sales_count)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 2)
    ) < 20 THEN 'Emerging Writer'
    WHEN (
      (COALESCE(a.followers_count, 0) * 5) +
      (COALESCE((
        SELECT AVG(b.avg_rating)
        FROM public.books b
        WHERE b.author_id = u.id AND b.status = 'Published'
      ), 0.0) * 10) +
      (COALESCE((
        SELECT COUNT(*)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 15) +
      (COALESCE((
        SELECT SUM(b.sales_count)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 2)
    ) < 75 THEN 'Rising Creator'
    WHEN (
      (COALESCE(a.followers_count, 0) * 5) +
      (COALESCE((
        SELECT AVG(b.avg_rating)
        FROM public.books b
        WHERE b.author_id = u.id AND b.status = 'Published'
      ), 0.0) * 10) +
      (COALESCE((
        SELECT COUNT(*)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 15) +
      (COALESCE((
        SELECT SUM(b.sales_count)
        FROM public.books b
        WHERE b.author_id = u.id
      ), 0) * 2)
    ) < 200 THEN 'Featured Author'
    ELSE 'Writersthing Pro'
  END AS reputation_level
FROM public.users u
LEFT JOIN public.authors a ON u.id = a.user_id
WHERE u.role = 'Author' OR u.role = 'Admin';


-- =========================================================================
-- 6. ENABLE REALTIME SYNC ON SOCIAL TABLES
-- =========================================================================

-- Re-register publication configurations for real-time synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
