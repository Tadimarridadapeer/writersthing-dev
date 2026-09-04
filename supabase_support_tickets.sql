CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('PAYMENT_FAILED', 'WITHDRAWAL_FAILED', 'SYSTEM_ERROR', 'USER_REPORT')),
    reference_id TEXT, -- ID of the payment or withdrawal (TEXT to handle mixed uuid/text IDs)
    user_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage support tickets"
ON public.support_tickets FOR ALL
USING (true);

-- Trigger function for Failed Payments
CREATE OR REPLACE FUNCTION trigger_failed_payment_ticket()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'FAILED' AND (OLD.status IS DISTINCT FROM 'FAILED') THEN
        INSERT INTO public.support_tickets (ticket_type, reference_id, user_id, title, description)
        VALUES (
            'PAYMENT_FAILED',
            NEW.id::text,
            NEW.user_id,
            'Payment Failed - ' || COALESCE(NEW.order_id, 'Unknown Order'),
            'Amount: ' || NEW.amount || ' ' || NEW.currency
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_failed ON public.payments;
CREATE TRIGGER on_payment_failed
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION trigger_failed_payment_ticket();

-- Trigger function for Failed Withdrawals
CREATE OR REPLACE FUNCTION trigger_failed_withdrawal_ticket()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Failed' AND (OLD.status IS DISTINCT FROM 'Failed') THEN
        INSERT INTO public.support_tickets (ticket_type, reference_id, user_id, title, description)
        VALUES (
            'WITHDRAWAL_FAILED',
            NEW.id::text,
            NEW.author_id,
            'Withdrawal Failed - ' || NEW.amount,
            'Reason: ' || COALESCE(NEW.failure_reason, 'Unknown') || ' | UPI: ' || NEW.upi_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_withdrawal_failed ON public.withdrawals;
CREATE TRIGGER on_withdrawal_failed
AFTER UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION trigger_failed_withdrawal_ticket();
