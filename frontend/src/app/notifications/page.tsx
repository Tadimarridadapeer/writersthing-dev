"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bell, Check, Trash2 } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare, Star, UserPlus, FileText, Gift, Mail, Megaphone } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    hasMore, 
    fetchMore, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(20);

  const getIcon = (type: string, priority: string) => {
    switch (type) {
      case "new_like": return <Heart size={12} className="text-pink-500 fill-pink-500" />;
      case "new_comment": return <MessageSquare size={12} className="text-blue-500" />;
      case "new_follower": return <UserPlus size={12} className="text-emerald-500" />;
      case "new_review":
      case "new_rating": return <Star size={12} className="text-amber-500 fill-amber-500" />;
      case "book_published":
      case "story_published":
      case "blog_published": return <FileText size={12} className="text-purple-500" />;
      case "founder_invite": return <Gift size={12} className="text-amber-500" />;
      case "system_message": return <Megaphone size={12} className="text-red-500 fill-red-100" />;
      default: return <Bell size={12} className="text-zinc-500" />;
    }
  };

  const getMessage = (type: string, metadata: any) => {
    switch (type) {
      case "new_follower": return "started following you.";
      case "new_review": return "reviewed your work.";
      case "new_like": return metadata?.title ? 'liked your post "' + metadata.title + '".' : "liked your work.";
      case "new_rating": return "rated your work.";
      case "new_comment": 
        if (metadata?.text) {
          const truncated = metadata.text.length > 40 ? metadata.text.substring(0, 40) + '...' : metadata.text;
          return 'commented: "' + truncated + '"';
        }
        return metadata?.title ? 'commented on "' + metadata.title + '".' : "commented on your post.";
      case "reply_to_comment": return "replied to your comment.";
      case "book_published": return "published a new book: " + (metadata?.title || '');
      case "story_published": return "published a new story: " + (metadata?.title || '');
      case "blog_published": return "published a new blog: " + (metadata?.title || '');
      case "invite": return "invited you to become a Founding Writer.";
      case "system_message": return `Broadcast: ${metadata?.text || 'Announcement from Admins'}`;
      default: return "interacted with your profile.";
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    let destination = "";
    if (notification.target_url) {
      destination = notification.target_url;
    } else if (notification.target_type && notification.target_id) {
      if (notification.target_type === "book") destination = /book/ + notification.target_id;
      else if (notification.target_type === "story") destination = /stories/ + notification.target_id;
      else if (notification.target_type === "blog") destination = /blogs/ + notification.target_id;
      else if (notification.target_type === "profile") destination = /authors/ + notification.target_id;
    } else if (notification.type === "new_follower") {
      destination = "/profile";
    }
    
    if (destination) {
      if (notification.type === "new_comment" && !destination.includes("#")) {
        destination += "#comments";
      }
      router.push(destination);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-950 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24 pb-20 px-6">
          <p className="text-zinc-500">Please log in to view your notifications.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-950 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 px-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-zinc-900">Notifications</h1>
            <p className="text-sm text-zinc-500 mt-1">Stay updated on your interactions</p>
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={() => markAllAsRead()}
              className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-2 transition-colors"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={"flex items-start gap-4 p-5 rounded-2xl border transition-all " + (
                    !notification.is_read ? "bg-blue-50/20 border-blue-100" : "bg-white border-zinc-100"
                  )}
                >
                  <div className="relative flex-shrink-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    {notification.actor?.avatar_url ? (
                      <OptimizedImage src={notification.actor.avatar_url} alt="" variant="profile" className="w-12 h-12 rounded-full border border-zinc-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 text-lg border border-zinc-100">
                        {notification.actor?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-zinc-100">
                      {getIcon(notification.type, notification.priority)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    <p className="text-sm text-zinc-700 leading-snug">
                      <span className="font-bold text-black">{notification.actor?.name || "Someone"}</span>{" "}
                      {getMessage(notification.type, notification.metadata)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {hasMore && (
                <div className="pt-6 text-center">
                  <button 
                    onClick={fetchMore}
                    disabled={loading}
                    className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 text-xs font-black uppercase tracking-widest rounded-full hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : !loading && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                <Bell className="text-zinc-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">No notifications yet</h3>
              <p className="text-sm text-zinc-500">When people interact with you, you'll see it here.</p>
            </div>
          )}
          
          {loading && notifications.length === 0 && (
            <div className="py-20 text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full"></div>
                <div className="w-48 h-4 bg-zinc-100 rounded"></div>
                <div className="w-32 h-3 bg-zinc-100 rounded"></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
