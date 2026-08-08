-- Writersthing Cart Table Schema
-- Execute this in your Supabase SQL Editor to enable database cart persistence.

CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_book_cart UNIQUE (user_id, book_id)
);

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_select_policy" ON public.cart;
DROP POLICY IF EXISTS "cart_insert_policy" ON public.cart;
DROP POLICY IF EXISTS "cart_update_policy" ON public.cart;
DROP POLICY IF EXISTS "cart_delete_policy" ON public.cart;

CREATE POLICY "cart_select_policy" ON public.cart FOR SELECT USING (true);
CREATE POLICY "cart_insert_policy" ON public.cart FOR INSERT WITH CHECK (true);
CREATE POLICY "cart_update_policy" ON public.cart FOR UPDATE USING (true);
CREATE POLICY "cart_delete_policy" ON public.cart FOR DELETE USING (true);

NOTIFY pgrst, 'reload schema';
