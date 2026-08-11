-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous inserts (users subscribing)
CREATE POLICY "Enable insert for anonymous users" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow service role / admin full access
CREATE POLICY "Enable full access for service role"
ON public.newsletter_subscribers
USING (true)
WITH CHECK (true);
