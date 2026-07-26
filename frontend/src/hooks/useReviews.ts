import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export type ReviewItem = {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  rating: number;
  review_text: string | null;
  author_reply: string | null;
  moderation_status: string;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  edited_at: string | null;
  is_verified_purchase?: boolean;
  is_verified_reader?: boolean;
  is_author_review?: boolean;
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

export function useReviews(contentId: string, contentType: string, initialLimit: number = 10) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const sortRef = useRef('newest');

  const fetchReviews = useCallback(async (reset = false, sort = 'newest') => {
    if (!contentId || !contentType) return;
    
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
      sortRef.current = sort;
    }

    try {
      const res = await fetch(`/api/reviews?content_id=${contentId}&content_type=${contentType}&limit=${initialLimit}&offset=${offsetRef.current}&sort=${sort}`);
      if (res.ok) {
        const { data, count } = await res.json();
        
        if (reset) {
          setReviews(data);
          setTotal(count);
        } else {
          setReviews(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === initialLimit);
        offsetRef.current += initialLimit;
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType, initialLimit]);

  useEffect(() => {
    fetchReviews(true, 'newest');
  }, [fetchReviews]);

  const addReview = async (rating: number, review_text: string) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, content_type: contentType, rating, review_text })
      });
      if (!res.ok) throw new Error("API failed");
      const { data } = await res.json();
      setReviews(prev => [data, ...prev]);
      setTotal(prev => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteReview = async (id: string) => {
    const backup = [...reviews];
    setReviews(prev => prev.filter(r => r.id !== id));
    setTotal(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/reviews?review_id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("API failed");
    } catch (err) {
      setReviews(backup);
      setTotal(prev => prev + 1);
    }
  };

  const voteReview = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    const backup = [...reviews];
    
    // Optimistic UI updates are complex because we need to know the previous state of the vote.
    // For simplicity without a local vote store, we'll just increment it optimistically.
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          [voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count']: r[voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] + 1
        };
      }
      return r;
    }));

    try {
      const res = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, vote_type: voteType })
      });
      if (!res.ok) throw new Error("API failed");
      
      // We could optionally refetch or apply exact return data
      const json = await res.json();
      if (json.action === 'removed' || json.action === 'switched') {
         // Silently refetch in background if they toggled to get exact sync
         // because optimistic increment was wrong if it was a toggle.
         fetchReviews(true, sortRef.current);
      }
    } catch (err) {
      setReviews(backup);
    }
  };

  const editReview = async (id: string, updates: { rating?: number, review_text?: string, author_reply?: string }) => {
     const backup = [...reviews];
     setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates, edited_at: new Date().toISOString() } : r));

     try {
       const res = await fetch('/api/reviews', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ review_id: id, ...updates })
       });
       if (!res.ok) throw new Error("API failed");
     } catch (err) {
       setReviews(backup);
     }
  };

  return {
    reviews,
    total,
    loading,
    hasMore,
    fetchMore: () => fetchReviews(false, sortRef.current),
    setSort: (sort: string) => fetchReviews(true, sort),
    currentSort: sortRef.current,
    addReview,
    deleteReview,
    editReview,
    voteReview
  };
}
