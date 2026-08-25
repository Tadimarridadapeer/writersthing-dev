-- 0. CLEANUP OLD FAULTY TRIGGERS & ENABLE REALTIME
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
DROP TRIGGER IF EXISTS on_save_created ON public.saves;

-- Enable Realtime for notifications so the UI dropdown updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 1. Fix Comment Notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment() RETURNS TRIGGER AS $$
DECLARE
    owner_author_id UUID;
    owner_user_id UUID;
    content_title TEXT;
    resolved_type TEXT;
BEGIN
    resolved_type := NEW.content_type;
    
    -- Handle fallback 'article' content_type used by the frontend for stories/blogs
    IF NEW.content_type = 'article' THEN
        -- Try stories first
        SELECT author_id, title INTO owner_author_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
        IF owner_author_id IS NOT NULL THEN
            resolved_type := 'story';
        ELSE
            SELECT author_id, title INTO owner_author_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
            IF owner_author_id IS NOT NULL THEN
                resolved_type := 'blog';
            END IF;
        END IF;
    ELSIF NEW.content_type = 'book' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.books WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'story' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'blog' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
    END IF;

    -- Look up the actual auth user_id of the author from the authors table
    IF owner_author_id IS NOT NULL THEN
        SELECT user_id INTO owner_user_id FROM public.authors WHERE id = owner_author_id;
    END IF;

    -- Only notify if valid owner and not self-comment
    IF owner_user_id IS NOT NULL AND owner_user_id != NEW.user_id THEN
        INSERT INTO public.notifications(user_id, actor_id, type, target_type, target_id, target_url, metadata)
        VALUES (owner_user_id, NEW.user_id, 'new_comment', resolved_type, NEW.content_id::text, 
                CASE WHEN resolved_type = 'story' THEN '/stories/' || NEW.content_id
                     WHEN resolved_type = 'book' THEN '/book/' || NEW.content_id
                     WHEN resolved_type = 'blog' THEN '/blogs/' || NEW.content_id
                     ELSE '/' || resolved_type || 's/' || NEW.content_id
                END, 
                jsonb_build_object('title', content_title, 'text', substring(NEW.comment_text, 1, 50)));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 2. Fix Like Notifications
CREATE OR REPLACE FUNCTION public.notify_on_like() RETURNS TRIGGER AS $$
DECLARE
    owner_author_id UUID;
    owner_user_id UUID;
    content_title TEXT;
    resolved_type TEXT;
BEGIN
    resolved_type := NEW.content_type;
    
    -- Handle fallback 'article' content_type used by the frontend for stories/blogs
    IF NEW.content_type = 'article' THEN
        -- Try stories first
        SELECT author_id, title INTO owner_author_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
        IF owner_author_id IS NOT NULL THEN
            resolved_type := 'story';
        ELSE
            SELECT author_id, title INTO owner_author_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
            IF owner_author_id IS NOT NULL THEN
                resolved_type := 'blog';
            END IF;
        END IF;
    ELSIF NEW.content_type = 'book' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.books WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'story' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.stories WHERE id::text = NEW.content_id::text;
    ELSIF NEW.content_type = 'blog' THEN
        SELECT author_id, title INTO owner_author_id, content_title FROM public.blogs WHERE id::text = NEW.content_id::text;
    END IF;

    -- Look up the actual auth user_id of the author from the authors table
    IF owner_author_id IS NOT NULL THEN
        SELECT user_id INTO owner_user_id FROM public.authors WHERE id = owner_author_id;
    END IF;

    -- Only notify if valid owner and not self-like
    IF owner_user_id IS NOT NULL AND owner_user_id != NEW.user_id THEN
        -- Prevent spam duplicate likes
        DELETE FROM public.notifications 
        WHERE user_id = owner_user_id 
          AND actor_id = NEW.user_id 
          AND type = 'new_like' 
          AND target_id = NEW.content_id::text
          AND is_read = false;

        INSERT INTO public.notifications(user_id, actor_id, type, target_type, target_id, target_url, metadata)
        VALUES (owner_user_id, NEW.user_id, 'new_like', resolved_type, NEW.content_id::text, 
                CASE WHEN resolved_type = 'story' THEN '/stories/' || NEW.content_id
                     WHEN resolved_type = 'book' THEN '/book/' || NEW.content_id
                     WHEN resolved_type = 'blog' THEN '/blogs/' || NEW.content_id
                     ELSE '/' || resolved_type || 's/' || NEW.content_id
                END, 
                jsonb_build_object('title', content_title));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
CREATE TRIGGER trg_notify_on_like
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();
