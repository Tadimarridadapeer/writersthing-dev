-- Enable uuid-ossp if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
    content_id UUID,
    content_type TEXT CHECK (content_type IN ('book', 'story', 'blog')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Allow system/users to create notifications (or rely on triggers with service role privilege)
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own notifications (e.g. marking as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Delete notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- TRIGGER FOR LIKES
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- We need to find the author of the content
    IF NEW.content_type = 'book' THEN
        SELECT author_id INTO target_user_id FROM public.books WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'story' THEN
        -- stories author_id is a UUID referencing authors.id, so we need to get user_id from authors table
        SELECT user_id INTO target_user_id FROM public.authors WHERE id = (SELECT author_id FROM public.stories WHERE id = NEW.content_id);
    ELSIF NEW.content_type = 'blog' THEN
        SELECT user_id INTO target_user_id FROM public.authors WHERE id = (SELECT author_id FROM public.blogs WHERE id = NEW.content_id);
    END IF;

    -- Only create notification if it's not the user liking their own content
    IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, content_id, content_type)
        VALUES (target_user_id, NEW.user_id, 'like', NEW.content_id, NEW.content_type);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();

-- TRIGGER FOR COMMENTS
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    IF NEW.content_type = 'book' THEN
        SELECT author_id INTO target_user_id FROM public.books WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'story' THEN
        SELECT user_id INTO target_user_id FROM public.authors WHERE id = (SELECT author_id FROM public.stories WHERE id = NEW.content_id);
    ELSIF NEW.content_type = 'blog' THEN
        SELECT user_id INTO target_user_id FROM public.authors WHERE id = (SELECT author_id FROM public.blogs WHERE id = NEW.content_id);
    END IF;

    IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, content_id, content_type)
        VALUES (target_user_id, NEW.user_id, 'comment', NEW.content_id, NEW.content_type);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();

-- TRIGGER FOR FOLLOWS
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.following_id != NEW.follower_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type)
        VALUES (NEW.following_id, NEW.follower_id, 'follow');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_follow();
