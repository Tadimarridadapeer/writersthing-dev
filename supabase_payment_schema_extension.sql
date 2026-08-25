-- ==========================================
-- WRITER'S THING PAYMENT SCHEMA EXTENSION
-- ==========================================

-- 1. Purchases Table
-- Represents the successful financial transaction connecting a buyer to a book.
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = buyer_id);

-- 2. Author Earnings Table
-- Represents the breakdown of a purchase into gross amount, platform fee, and net author earnings.
CREATE TABLE IF NOT EXISTS public.author_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.authors(user_id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    gross_amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    gateway_fee DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'PAID', 'REFUNDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.author_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors can view own earnings" ON public.author_earnings FOR SELECT USING (auth.uid() = author_id);

-- 3. Modify existing tables if needed
-- We already have increment_author_balance in supabase_withdrawals.sql
-- We will link payouts (withdrawals) to author_earnings loosely, as payouts are aggregated withdrawals.
