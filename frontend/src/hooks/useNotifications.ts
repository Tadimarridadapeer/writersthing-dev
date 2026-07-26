import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export type NotificationItem = {
  id: string;
  user_id: string;
  actor_id?: string;
  type: string;
  priority: string;
  target_type?: string;
  target_id?: string;
  target_url?: string;
  is_read: boolean;
  is_archived: boolean;
  metadata: Record<string, any>;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

export function useNotifications(limit: number = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const filterRef = useRef('all');

  const fetchNotifications = useCallback(async (reset = false, filter = 'all') => {
    if (!user) return;
    
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
      filterRef.current = filter;
    }

    try {
      const res = await fetch(`/api/notifications?limit=${limit}&offset=${offsetRef.current}&type=${filter}`);
      if (res.ok) {
        const { data, unreadCount: count, count: total } = await res.json();
        
        if (reset) {
          setNotifications(data);
        } else {
          setNotifications(prev => [...prev, ...data]);
        }
        
        setUnreadCount(count);
        setHasMore(data.length === limit);
        offsetRef.current += limit;
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchNotifications(true);

    if (!user) return;

    // Supabase Realtime for cross-session/device sync
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          // Simplest reliable way to sync is to refetch on changes
          // You could optimize this to modify state directly, but refetching guarantees consistency
          fetchNotifications(true, filterRef.current);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  // Optimistic UI Actions
  const markAsRead = async (id: string) => {
    const backup = [...notifications];
    const backupCount = unreadCount;

    // Optimistic
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notification_id: id })
      });
      if (!res.ok) throw new Error("API failed");
    } catch (err) {
      // Rollback
      setNotifications(backup);
      setUnreadCount(backupCount);
    }
  };

  const markAllAsRead = async () => {
    const backup = [...notifications];
    const backupCount = unreadCount;

    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }) // no ids = all
      });
      if (!res.ok) throw new Error("API failed");
    } catch (err) {
      setNotifications(backup);
      setUnreadCount(backupCount);
    }
  };

  const deleteNotification = async (id: string) => {
    const backup = [...notifications];
    const item = notifications.find(n => n.id === id);
    const backupCount = unreadCount;

    // Optimistic
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (item && !item.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      if (!res.ok) throw new Error("API failed");
    } catch (err) {
      setNotifications(backup);
      setUnreadCount(backupCount);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore: () => fetchNotifications(false, filterRef.current),
    setFilter: (filter: string) => fetchNotifications(true, filter),
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
