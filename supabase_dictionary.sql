-- Create dictionary_cache table
CREATE TABLE IF NOT EXISTS public.dictionary_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    part_of_speech TEXT,
    definition TEXT,
    context_definition TEXT,
    synonyms JSONB,
    example TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dictionary_cache_word_language_key UNIQUE (word, language)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dictionary_cache_word ON public.dictionary_cache(word);
CREATE INDEX IF NOT EXISTS idx_dictionary_cache_language ON public.dictionary_cache(language);

-- Enable Row Level Security
ALTER TABLE public.dictionary_cache ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow public SELECT
CREATE POLICY "Allow public SELECT on dictionary_cache" 
    ON public.dictionary_cache FOR SELECT 
    USING (true);

-- Allow authenticated INSERT
CREATE POLICY "Allow authenticated INSERT on dictionary_cache" 
    ON public.dictionary_cache FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated UPDATE
CREATE POLICY "Allow authenticated UPDATE on dictionary_cache" 
    ON public.dictionary_cache FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated DELETE
CREATE POLICY "Allow authenticated DELETE on dictionary_cache" 
    ON public.dictionary_cache FOR DELETE 
    TO authenticated 
    USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
