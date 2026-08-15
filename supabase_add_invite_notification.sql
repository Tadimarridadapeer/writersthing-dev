DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the check constraint name for the 'type' column on 'notifications' table
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%type % IN (%';

    -- If found, drop the constraint
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Add the new constraint including 'invite'
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like', 'comment', 'follow', 'invite'));
END $$;
