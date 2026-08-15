CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    target_type TEXT,
    target_id TEXT,
    target_url TEXT,
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Turn on Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Trigger: Follow Notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow() RETURNS TRIGGER AS $$
BEGIN
    -- Prevent self-notification
    IF NEW.follower_id = NEW.following_id THEN
        RETURN NEW;
    END IF;

    -- Avoid duplicate follow notifications if they spam follow/unfollow
    -- We delete any unread exact duplicate first
    DELETE FROM public.notifications 
    WHERE user_id = NEW.following_id 
      AND actor_id = NEW.follower_id 
      AND type = 'new_follower' 
      AND is_read = false;

    INSERT INTO public.notifications(user_id, actor_id, type, target_type, target_id, target_url)
    VALUES (NEW.following_id, NEW.follower_id, 'new_follower', 'profile', NEW.follower_id::text, '/authors/' || NEW.follower_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();


-- 4. Trigger: Like Notifications
CREATE OR REPLACE FUNCTION public.notify_on_like() RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    content_title TEXT;
BEGIN
    -- Determine owner based on content type
    IF NEW.content_type = 'book' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.books WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'story' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'blog' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
    END IF;

    -- Only notify if valid owner and not self-like
    IF owner_id IS NOT NULL AND owner_id != NEW.user_id THEN
        -- Prevent spam duplicate likes
        DELETE FROM public.notifications 
        WHERE user_id = owner_id 
          AND actor_id = NEW.user_id 
          AND type = 'new_like' 
          AND target_id = NEW.content_id::text
          AND is_read = false;

        INSERT INTO public.notifications(user_id, actor_id, type, target_type, target_id, target_url, metadata)
        VALUES (owner_id, NEW.user_id, 'new_like', NEW.content_type, NEW.content_id::text, 
                '/' || (CASE WHEN NEW.content_type = 'book' THEN 'book' ELSE NEW.content_type || 's' END) || '/' || NEW.content_id, 
                jsonb_build_object('title', content_title));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
CREATE TRIGGER trg_notify_on_like
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();


-- 5. Trigger: Comment Notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment() RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    content_title TEXT;
BEGIN
    -- Determine owner based on content type
    IF NEW.content_type = 'book' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.books WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'story' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'blog' THEN
        SELECT author_id, title INTO owner_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
    END IF;

    -- Only notify if valid owner and not self-comment
    IF owner_id IS NOT NULL AND owner_id != NEW.user_id THEN
        INSERT INTO public.notifications(user_id, actor_id, type, target_type, target_id, target_url, metadata)
        VALUES (owner_id, NEW.user_id, 'new_comment', NEW.content_type, NEW.content_id::text, 
                '/' || (CASE WHEN NEW.content_type = 'book' THEN 'book' ELSE NEW.content_type || 's' END) || '/' || NEW.content_id, 
                jsonb_build_object('title', content_title, 'text', substring(NEW.comment_text, 1, 50)));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
