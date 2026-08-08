-- RLS Policies for Antigravity Writers Thing

-- 1. NOTIFICATIONS
-- Enable RLS
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- 2. SAVES (Bookmarks)
ALTER TABLE IF EXISTS saves ENABLE ROW LEVEL SECURITY;

-- Users can see their own saved items
CREATE POLICY "Users can view their own saves"
ON saves FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saves
CREATE POLICY "Users can create saves"
ON saves FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can delete their own saves"
ON saves FOR DELETE
USING (auth.uid() = user_id);

-- 3. LIKES
ALTER TABLE IF EXISTS likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see likes (needed for counts)
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
USING (true);

-- Users can add a like
CREATE POLICY "Users can insert likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- 4. REVIEWS
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- Users can create a review
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
USING (auth.uid() = user_id);
