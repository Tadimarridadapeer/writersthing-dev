-- ==========================================
-- SUPABASE FOREIGN KEY PATCH
-- Run this in your Supabase SQL Editor
-- ==========================================

-- The frontend uses .select("*, users:user_id(name, avatar_url)") 
-- PostgREST requires a Foreign Key constraint to perform this join.

ALTER TABLE comments 
  ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE likes 
  ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE saves 
  ADD CONSTRAINT saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews 
  ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Note: Also ensure actor_id on notifications points to users if you fetch the actor
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE;
