-- Writersthing Supabase Database Schema - Hire Writer Feature Update

-- 1. Updates to Users table
-- Adding flags for Verified, Available for Hire
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified_writer BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS available_for_hire BOOLEAN DEFAULT FALSE;

-- 2. Writer Services Table
CREATE TABLE IF NOT EXISTS public.writer_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  writer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  starting_price DECIMAL(10, 2) NOT NULL,
  experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Hire Requests Table
CREATE TABLE IF NOT EXISTS public.hire_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  writer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  project_category TEXT NOT NULL,
  project_summary TEXT NOT NULL,
  phone_number TEXT,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  expected_deadline TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Viewed', 'Accepted', 'Rejected', 'Cancelled', 'Completed', 'Archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Future Architecture Schemas (Prepared but no UI right now)

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hire_request_id UUID REFERENCES public.hire_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hire_request_id UUID REFERENCES public.hire_requests(id) ON DELETE CASCADE,
  terms TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Signed', 'Completed', 'Disputed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.writer_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Escrow', 'Released', 'Refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.writer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hire_request_id UUID REFERENCES public.hire_requests(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  writer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.writer_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  writer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Unavailable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) - Basic Setup for new tables
ALTER TABLE public.writer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_requests ENABLE ROW LEVEL SECURITY;

-- Policies for writer_services
CREATE POLICY "Public services are viewable by everyone" ON public.writer_services FOR SELECT USING (true);
CREATE POLICY "Writers can manage own services" ON public.writer_services FOR ALL USING (auth.uid() = writer_id);

-- Policies for hire_requests
CREATE POLICY "Users can view requests they sent or received" ON public.hire_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = writer_id);
CREATE POLICY "Users can insert hire requests" ON public.hire_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Participants can update hire requests" ON public.hire_requests FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = writer_id);
