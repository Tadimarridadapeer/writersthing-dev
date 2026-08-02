"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useReviews, ReviewItem } from "@/hooks/useReviews";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, MoreVertical, Edit, Trash } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import { formatDistanceToNow } from "date-fns";

interface ReviewSectionProps {
  contentId: string;
  contentType: string;
  authorId: string;
}

export function ReviewSection({ contentId, contentType, authorId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { 
    reviews, total, loading, hasMore, fetchMore, setSort, 
    currentSort, addReview, deleteReview, editReview, voteReview 
  } = useReviews(contentId, contentType);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = user?.id === authorId;
  const userHasReviewed = reviews.some(r => r.user_id === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return alert("Please select a rating");
    
    setSubmitting(true);
    const { success, error } = await addReview(rating, reviewText);
    setSubmitting(false);
    
    if (success) {
      setRating(0);
      setReviewText("");
    } else {
      alert(error || "Failed to post review");
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "submit"} // prevent form submit if just display
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            className={`focus:outline-none ${interactive ? "hover:scale-110 transition-transform cursor-pointer" : "cursor-default"}`}
          >
            <Star
              size={16}
              fill={star <= (interactive ? rating : value) ? "#eab308" : "none"}
              className={star <= (interactive ? rating : value) ? "text-yellow-500" : "text-zinc-300 hover:text-yellow-400"}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="mt-16 pt-8 border-t border-zinc-100">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-serif font-bold text-zinc-900 tracking-tight">
          Reviews <span className="text-zinc-400 text-lg font-normal">({total})</span>
        </h3>
        
        <select 
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {user && !userHasReviewed && !isAuthor && (
        <form onSubmit={handleSubmit} className="mb-12 space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Your Rating</span>
            {renderStars(0, true)}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think of this?"
            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm min-h-[100px] resize-none focus:outline-none focus:border-black transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !rating}
              className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-full disabled:opacity-50 hover:bg-zinc-800 transition-colors"
            >
              {submitting ? "Posting..." : "Post Review"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {loading && reviews.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
            <p className="text-sm text-zinc-500">No reviews yet. Be the first!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex gap-4 items-start group">
              <div className="shrink-0 relative">
                <AvatarWithBadge 
                  userId={review.user_id}
                  avatarUrl={review.actor?.avatar_url}
                  name={review.actor?.name || "U"}
                  className="w-10 h-10 rounded-full"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{review.actor?.name}</span>
                    {review.is_verified_purchase && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
                    )}
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      {review.edited_at && " (edited)"}
                    </span>
                  </div>
                  
                  {user?.id === review.user_id && (
                    <button 
                      onClick={() => deleteReview(review.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
                
                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>
                
                {review.review_text && (
                  <p className="text-sm text-zinc-700 font-serif leading-relaxed mb-4">
                    {review.review_text}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 select-none">
                  <button 
                    onClick={() => voteReview(review.id, 'helpful')}
                    className="flex items-center gap-1.5 hover:text-black transition-colors"
                  >
                    <ThumbsUp size={14} /> {review.helpful_count} Helpful
                  </button>
                  <button 
                    onClick={() => voteReview(review.id, 'not_helpful')}
                    className="flex items-center gap-1.5 hover:text-black transition-colors"
                  >
                    <ThumbsDown size={14} /> {review.not_helpful_count}
                  </button>
                  
                  {isAuthor && !review.author_reply && (
                    <button 
                      onClick={() => {
                        const reply = prompt("Enter your reply:");
                        if (reply) editReview(review.id, { author_reply: reply });
                      }}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors ml-auto"
                    >
                      <MessageSquare size={14} /> Reply
                    </button>
                  )}
                </div>

                {review.author_reply && (
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 ml-4 relative">
                    <div className="absolute -left-2 top-4 w-4 h-px bg-blue-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Author Response</p>
                    <p className="text-sm text-zinc-800">{review.author_reply}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {hasMore && reviews.length > 0 && (
          <div className="flex justify-center pt-4">
            <button 
              onClick={fetchMore}
              disabled={loading}
              className="px-6 py-2 border border-zinc-200 rounded-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-black hover:border-black transition-colors"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
