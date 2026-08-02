-- Add the missing invited_by column to the existing founding_writers table
ALTER TABLE public.founding_writers
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Force PostgREST to reload the schema cache so the API recognizes the new column immediately
NOTIFY pgrst, 'reload schema';
