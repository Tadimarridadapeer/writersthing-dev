-- Migration: Add Notification Settings to Users Table

DO $$ 
BEGIN
  -- Add like_emails_enabled column (default true)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='like_emails_enabled') THEN
    ALTER TABLE public.users ADD COLUMN like_emails_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add comment_emails_enabled column (default true)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='comment_emails_enabled') THEN
    ALTER TABLE public.users ADD COLUMN comment_emails_enabled BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Create unique index to prevent duplicate like notifications (type='like') from same actor on same content
  -- Assuming the notifications table has 'user_id', 'actor_id', 'content_id', 'type'
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications') THEN
    -- Check if index already exists
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_unique_like_notification') THEN
      -- Create a partial unique index for like notifications
      -- This ensures an actor can only have one 'like' notification per content
      -- We don't do this for comments because someone can comment multiple times
      EXECUTE 'CREATE UNIQUE INDEX idx_unique_like_notification ON public.notifications (user_id, actor_id, content_id) WHERE type = ''like''';
    END IF;
  END IF;
END $$;
