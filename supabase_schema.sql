-- Writersthing Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Syncs with Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Reader' CHECK (role IN ('Reader', 'Author', 'Admin')),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Authors Profile (Extended Details)
CREATE TABLE public.authors (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  total_earnings DECIMAL(12, 2) DEFAULT 0.00,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Books Table
CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  pdf_path TEXT, -- Storage path for PDFs
  price DECIMAL(10, 2) DEFAULT 99.00,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Review', 'Published')),
  sales_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Orders Table (Razorpay Integration)
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Reviews Table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Bookmarks Table
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  section_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. User Library
CREATE TABLE public.library (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  last_read TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, book_id)
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Published books are viewable by everyone" ON public.books FOR SELECT USING (status = 'Published');
CREATE POLICY "Authors can manage own books" ON public.books FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Users can view own library" ON public.library FOR SELECT USING (auth.uid() = user_id);

-- Storage Buckets (Manual setup in Supabase UI recommended)
-- Buckets: 'pdfs' (private), 'covers' (public), 'avatars' (public)
