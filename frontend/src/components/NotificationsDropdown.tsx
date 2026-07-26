"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Check, X, BookOpen, Star, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use the new scalable hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(10); // fetch top 10 for dropdown

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

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // Deep linking logic based on new schema
    if (notification.target_url) {
      router.push(notification.target_url);
    } else if (notification.target_type && notification.target_id) {
      if (notification.target_type === "book") router.push(`/book/${notification.target_id}`);
      else if (notification.target_type === "story") router.push(`/stories/${notification.target_id}`);
      else if (notification.target_type === "blog") router.push(`/blogs/${notification.target_id}`);
      else if (notification.target_type === "profile") router.push(`/authors/${notification.target_id}`);
    } else if (notification.type === "new_follower") {
      router.push("/profile");
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'important') return <AlertCircle size={14} className="text-red-500" />;
    switch (type) {
      case "new_rating": 
      case "new_review": return <Star size={14} className="text-yellow-500 fill-yellow-500" />;
      case "new_follower": return <UserPlus size={14} className="text-green-500" />;
      case "new_comment":
      case "reply_to_comment": return <MessageCircle size={14} className="text-blue-500" />;
      case "book_published":
      case "story_published":
      case "blog_published":
      case "article_published":
      case "author_published": return <BookOpen size={14} className="text-indigo-500" />;
      case "bookmark_milestone":
      case "reading_completed": return <Check size={14} className="text-emerald-500" />;
      default: return <Bell size={14} className="text-zinc-500" />;
    }
  };

  const getMessage = (type: string, metadata: any) => {
    switch (type) {
      case "new_follower": return "started following you";
      case "new_review": return "reviewed your work";
      case "new_rating": return "rated your work";
      case "new_comment": return "commented on your post";
      case "reply_to_comment": return "replied to your comment";
      case "book_published": return `published a new book: ${metadata.title || ''}`;
      case "story_published": return `published a new story: ${metadata.title || ''}`;
      case "blog_published": return `published a new blog: ${metadata.title || ''}`;
      case "reading_completed": return `You finished reading ${metadata.title || 'a book'}`;
      case "bookmark_milestone": return `You have 10 bookmarks in ${metadata.list_name || 'a list'}`;
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
                          <OptimizedImage src={notification.actor.avatar_url} alt="" variant="profile" className="w-10 h-10 rounded-full border border-zinc-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 text-sm border border-zinc-100">
                            {notification.actor?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          {getIcon(notification.type, notification.priority)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 leading-tight">
                          <span className="font-semibold text-black">{notification.actor?.name || "System"}</span> {getMessage(notification.type, notification.metadata)}.
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
                  
                  {/* View all link */}
                  <Link 
                    href="/profile?section=Notifications" 
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center p-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
