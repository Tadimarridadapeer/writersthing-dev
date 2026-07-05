"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          fetchNotifications(); // refetch to get actor details
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(id, name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      
      setNotifications((prev) =>
        prev.map((n: any) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      setNotifications((prev) => prev.map((n: any) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.type === "follow") {
      router.push("/profile");
    } else if (notification.content_id && notification.content_type) {
      // route to the content (assuming /read/[id] for books/stories/blogs or similar)
      // Modify this depending on exact routing setup
      if (notification.content_type === "book") router.push(`/book/${notification.content_id}`);
      else if (notification.content_type === "story") router.push(`/stories/${notification.content_id}`);
      else if (notification.content_type === "blog") router.push(`/blogs/${notification.content_id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart size={14} className="text-red-500 fill-red-500" />;
      case "comment": return <MessageCircle size={14} className="text-blue-500" />;
      case "follow": return <UserPlus size={14} className="text-green-500" />;
      default: return <Bell size={14} className="text-zinc-500" />;
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "follow": return "started following you";
      default: return "interacted with your profile";
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-[28rem] bg-white border border-zinc-100 shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="font-heading font-bold text-sm tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-1 transition-colors"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-grow custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">
                  <Bell size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 flex gap-4 transition-colors hover:bg-zinc-50 ${!notification.is_read ? "bg-blue-50/20" : ""}`}
                    >
                      <div className="relative flex-shrink-0">
                        {notification.actor?.avatar_url ? (
                          <img src={notification.actor.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 text-sm border border-zinc-100">
                            {notification.actor?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          {getIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 leading-tight">
                          <span className="font-semibold text-black">{notification.actor?.name || "Someone"}</span> {getMessage(notification.type)}.
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-medium">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 self-center flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
