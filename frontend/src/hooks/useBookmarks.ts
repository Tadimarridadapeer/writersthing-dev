import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export type BookmarkItem = {
  id: string;
  user_id: string;
  list_id: string;
  content_type: 'book' | 'blog' | 'story' | 'article';
  content_id: string;
  created_at: string;
  reading_lists?: { name: string };
};

export type ReadingList = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
};

// Global cache for bookmarks to share state across components (e.g. feed cards)
let globalBookmarks: BookmarkItem[] = [];
let globalLists: ReadingList[] = [];
let listeners: Set<() => void> = new Set();

const notifyListeners = () => listeners.forEach(l => l());

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(globalBookmarks);
  const [lists, setLists] = useState<ReadingList[]>(globalLists);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setBookmarks([...globalBookmarks]);
      setLists([...globalLists]);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const fetchListsAndBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listsRes, marksRes] = await Promise.all([
        fetch('/api/reading-lists'),
        fetch('/api/bookmarks')
      ]);
      
      if (listsRes.ok) {
        const { data } = await listsRes.json();
        globalLists = data || [];
      }
      if (marksRes.ok) {
        const { data } = await marksRes.json();
        globalBookmarks = data || [];
      }
      notifyListeners();
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && globalLists.length === 0) {
      fetchListsAndBookmarks();
    }
  }, [user, fetchListsAndBookmarks]);

  const toggleBookmark = async (contentType: string, contentId: string) => {
    if (!user) return { success: false, message: "Please log in to bookmark" };

    // Optimistic Update
    const existsIndex = globalBookmarks.findIndex(b => b.content_id === contentId && b.content_type === contentType);
    const wasBookmarked = existsIndex >= 0;
    
    // Backup for rollback
    const backup = [...globalBookmarks];

    if (wasBookmarked) {
      globalBookmarks = globalBookmarks.filter((_, i) => i !== existsIndex);
    } else {
      // Fake a temp bookmark
      const readLaterList = globalLists.find(l => l.name === 'Read Later');
      globalBookmarks = [{
        id: `temp-${Date.now()}`,
        user_id: user.id,
        list_id: readLaterList?.id || '',
        content_type: contentType as any,
        content_id: contentId,
        created_at: new Date().toISOString(),
        reading_lists: { name: 'Read Later' }
      }, ...globalBookmarks];
    }
    notifyListeners();

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', content_type: contentType, content_id: contentId })
      });
      
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      
      // Update temp id with real id if added
      if (data.status === 'added' && data.data) {
        globalBookmarks = globalBookmarks.map(b => b.content_id === contentId ? { ...data.data, reading_lists: { name: 'Read Later' } } : b);
        notifyListeners();
      }
      
      return { success: true, status: data.status, message: data.message };
    } catch (err) {
      // Rollback
      globalBookmarks = backup;
      notifyListeners();
      return { success: false, message: "Failed to update bookmark" };
    }
  };

  const isBookmarked = useCallback((contentType: string, contentId: string) => {
    return globalBookmarks.some(b => b.content_id === contentId && b.content_type === contentType);
  }, [bookmarks]); // Re-evaluate when bookmarks change

  return {
    bookmarks,
    lists,
    loading,
    toggleBookmark,
    isBookmarked,
    fetchListsAndBookmarks
  };
}
