-- Create story_translations table
CREATE TABLE IF NOT EXISTS public.story_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL,
    language_code TEXT NOT NULL,
    translated_title TEXT,
    translated_content TEXT,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(story_id, language_code)
);

-- Enable RLS
ALTER TABLE public.story_translations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to story_translations
CREATE POLICY "Enable read access for all users" ON public.story_translations
    FOR SELECT USING (true);

-- Allow authenticated users (or backend) to insert/update
CREATE POLICY "Enable insert access for authenticated users" ON public.story_translations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.story_translations
    FOR UPDATE USING (true);
