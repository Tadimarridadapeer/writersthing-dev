-- Create reading_lists table
CREATE TABLE IF NOT EXISTS public.reading_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Drop old bookmarks if it exists with the wrong schema
DROP TABLE IF EXISTS public.bookmarks;

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES public.reading_lists(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, content_type, content_id)
);

-- RLS for reading_lists
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reading lists" ON public.reading_lists;
CREATE POLICY "Users can view own reading lists" ON public.reading_lists
  FOR SELECT USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can insert own reading lists" ON public.reading_lists;
CREATE POLICY "Users can insert own reading lists" ON public.reading_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading lists" ON public.reading_lists;
CREATE POLICY "Users can update own reading lists" ON public.reading_lists
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reading lists" ON public.reading_lists;
CREATE POLICY "Users can delete own reading lists" ON public.reading_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can update own bookmarks" ON public.bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to create default reading lists on new user
CREATE OR REPLACE FUNCTION public.create_default_reading_lists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.reading_lists (user_id, name, is_default)
  VALUES 
    (NEW.id, 'Read Later', true),
    (NEW.id, 'Currently Reading', false),
    (NEW.id, 'Favorites', false),
    (NEW.id, 'Finished Reading', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create for existing users if we want
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.reading_lists WHERE user_id = u.id AND name = 'Read Later') THEN
      INSERT INTO public.reading_lists (user_id, name, is_default)
      VALUES 
        (u.id, 'Read Later', true),
        (u.id, 'Currently Reading', false),
        (u.id, 'Favorites', false),
        (u.id, 'Finished Reading', false);
    END IF;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_reading_lists ON public.users;
CREATE TRIGGER on_auth_user_created_reading_lists
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_reading_lists();

-- Notify PostgREST to instantly reload schema cache
NOTIFY pgrst, 'reload schema';
