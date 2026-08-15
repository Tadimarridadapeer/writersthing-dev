-- Drop the table if it exists so we can recreate it with the correct foreign key
DROP TABLE IF EXISTS public.reviews;

-- Create the reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    author_reply TEXT,
    moderation_status TEXT DEFAULT 'approved',
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    edited_at TIMESTAMP WITH TIME ZONE,
    is_verified_purchase BOOLEAN DEFAULT false,
    edit_count INTEGER DEFAULT 0,
    author_replied_at TIMESTAMP WITH TIME ZONE,

    -- A user can only review a specific content piece once
    UNIQUE(user_id, content_id, content_type)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved reviews
CREATE POLICY "Public can read approved reviews" 
ON public.reviews
FOR SELECT
USING (moderation_status = 'approved');

-- Allow service role / backend API to insert and update reviews bypassing RLS
CREATE POLICY "Service role can manage all reviews"
ON public.reviews
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own deleted/pending reviews
CREATE POLICY "Users can read their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: If you want clients to be able to vote directly (though they hit the API)
CREATE POLICY "Public can update helpful counts"
ON public.reviews
FOR UPDATE
USING (true)
WITH CHECK (true);
