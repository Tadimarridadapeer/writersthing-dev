import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// A server-only service to create notifications bypassing RLS securely, 
// using the service role key to ensure system notifications always succeed.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type NotificationType = 
  | 'new_follower' | 'new_review' | 'new_rating' | 'new_comment'
  | 'reply_to_comment' | 'book_published' | 'story_published'
  | 'blog_published' | 'article_published' | 'author_published'
  | 'bookmark_milestone' | 'reading_completed' | 'system_alert';

export type NotificationPriority = 'info' | 'success' | 'warning' | 'important';

export interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  targetType?: string;
  targetId?: string;
  targetUrl?: string;
  metadata?: Record<string, any>;
}

export const NotificationService = {
  /**
   * Creates a notification for a user. Bypasses RLS using the service role key.
   */
  async create(params: CreateNotificationParams) {
    try {
      const { userId, actorId, type, priority = 'info', targetType, targetId, targetUrl, metadata = {} } = params;

      // 1. Check if user has preferences disabled (future proofing)
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("in_app_enabled, preferences")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs && prefs.in_app_enabled === false) {
        return { success: true, skipped: true, reason: 'in_app_notifications_disabled' };
      }
      
      // If fine-grained preferences exist for this type
      if (prefs && prefs.preferences && typeof prefs.preferences === 'object') {
        const typePref = (prefs.preferences as Record<string, any>)[type];
        if (typePref === false) {
           return { success: true, skipped: true, reason: 'type_disabled_by_user' };
        }
      }

      // 2. Insert the notification
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          actor_id: actorId,
          type,
          priority,
          target_type: targetType,
          target_id: targetId,
          target_url: targetUrl,
          metadata
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      logger.error("NotificationService.create Error", { error: error.message, params });
      return { success: false, error: error.message };
    }
  },

  /**
   * Creates notifications in bulk for multiple users (e.g. author publishes content to all followers)
   */
  async createBulk(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    try {
      if (userIds.length === 0) return { success: true };

      const { actorId, type, priority = 'info', targetType, targetId, targetUrl, metadata = {} } = params;

      const payload = userIds.map(uid => ({
        user_id: uid,
        actor_id: actorId,
        type,
        priority,
        target_type: targetType,
        target_id: targetId,
        target_url: targetUrl,
        metadata
      }));

      // NOTE: Does not currently batch-check preferences for simplicity, 
      // but in a massive system this would involve a JOIN.
      
      const { error } = await supabase
        .from("notifications")
        .insert(payload);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      logger.error("NotificationService.createBulk Error", { error: error.message });
      return { success: false, error: error.message };
    }
  }
};
