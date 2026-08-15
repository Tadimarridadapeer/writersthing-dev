CREATE OR REPLACE FUNCTION public.assign_founding_writer(
    p_full_name TEXT,
    p_email TEXT,
    p_invited_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_founder_number INTEGER;
BEGIN
    -- Check if author already has a Founding Writer record (by email)
    SELECT founder_number INTO v_founder_number
    FROM public.founding_writers
    WHERE email_address = p_email;

    IF FOUND THEN
        -- If the user already has a number, return it and do not generate a new one
        RETURN v_founder_number;
    END IF;

    -- Lock the table to prevent concurrent assignment of the same slot
    LOCK TABLE public.founding_writers IN EXCLUSIVE MODE;

    -- Find the lowest available number between 1 and 100
    SELECT num INTO v_founder_number
    FROM generate_series(1, 100) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.founding_writers fw WHERE fw.founder_number = s.num
    )
    ORDER BY num
    LIMIT 1;

    IF v_founder_number IS NULL THEN
        RAISE EXCEPTION 'All 100 Founding Writer slots are currently occupied.';
    END IF;

    -- Insert the new founding writer
    INSERT INTO public.founding_writers (
        founder_number,
        full_name,
        email_address,
        status,
        invited_by
    ) VALUES (
        v_founder_number,
        p_full_name,
        p_email,
        'Invited',
        p_invited_by
    );

    RETURN v_founder_number;
END;
$$;

-- Also reload the schema cache so postgrest API picks up the new RPC function immediately
NOTIFY pgrst, 'reload schema';
