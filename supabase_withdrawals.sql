ALTER TABLE public.authors 
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(12, 2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.authors(user_id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Rejected')),
  razorpay_payout_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view own withdrawals" ON public.withdrawals 
FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can request withdrawals" ON public.withdrawals 
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- RPC for atomic balance increment
CREATE OR REPLACE FUNCTION increment_author_balance(author_uuid UUID, amount_to_add DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.authors
  SET available_balance = COALESCE(available_balance, 0) + amount_to_add,
      total_earnings = COALESCE(total_earnings, 0) + amount_to_add
  WHERE user_id = author_uuid;
END;
$$ LANGUAGE plpgsql;
