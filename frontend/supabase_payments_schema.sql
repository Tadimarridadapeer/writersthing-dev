-- Create payments table for Razorpay integration
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    payment_id TEXT UNIQUE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'RELEASED')),
    commission_amount NUMERIC NOT NULL,
    writer_amount NUMERIC NOT NULL,
    project_id UUID, 
    payout_status TEXT NOT NULL DEFAULT 'NOT_RELEASED' CHECK (payout_status IN ('NOT_RELEASED', 'READY', 'TRANSFERRED')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adding RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
    ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pending payments" ON public.payments;
CREATE POLICY "Users can update their own pending payments"
    ON public.payments
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'PENDING');
