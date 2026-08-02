-- Migration for Borderless Reading Feature

-- 1. Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('book', 'story', 'blog')),
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(content_id, language_code) -- Ensure one translation per content per language
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for translations
CREATE POLICY "Translations are viewable by everyone" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert translations" ON public.translations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update translations" ON public.translations FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. Add preferred_reading_language to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_reading_language TEXT DEFAULT 'en';

-- 3. Create translation_dictionary table
CREATE TABLE IF NOT EXISTS public.translation_dictionary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  language_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.translation_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dictionary viewable by author" ON public.translation_dictionary FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Dictionary insertable by author" ON public.translation_dictionary FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Dictionary updatable by author" ON public.translation_dictionary FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Dictionary deletable by author" ON public.translation_dictionary FOR DELETE USING (auth.uid() = author_id);
