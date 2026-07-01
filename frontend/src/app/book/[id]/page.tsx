"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Star,
  Zap,
  Info,
  BookOpen
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchBookData();
  }, [params.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`book-reviews-${params.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `book_id=eq.${params.id}` },
        () => {
          fetchBookData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const fetchBookData = async () => {
    try {
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", params.id)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, users:user_id(name, avatar_url)")
        .eq("book_id", params.id)
        .order("created_at", { ascending: false });
      
      if (reviewData) setReviews(reviewData);

      if (user && bookData) {
        const { data: follow } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", bookData.author_id)
          .single();
        if (follow) setIsFollowing(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    router.push("/marketplace");
  };

  const handleFollow = async () => {
    if (!user) return router.push("/login");
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", book.author_id);
        setIsFollowing(false);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: book.author_id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const submitReview = async () => {
    if (!user) return;
    try {
      if (editingReviewId) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: reviewText
          })
          .eq("id", editingReviewId);
        
        if (!error) {
          setEditingReviewId(null);
          setReviewText("");
          setRating(5);
          fetchBookData();
        }
      } else {
        const { error } = await supabase.from("reviews").insert({
          book_id: book.id,
          user_id: user.id,
          rating,
          comment: reviewText
        });
        if (!error) {
          setReviewText("");
          setRating(5);
          fetchBookData();
        }
      }
    } catch (err) {
      console.error("Review error:", err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);
      
      if (!error) {
        fetchBookData();
      }
    } catch (err) {
      console.error("Delete review error:", err);
    }
  };

  const handleStartEdit = (review: any) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setReviewText(review.comment || "");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(5);
    setReviewText("");
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Manuscript...</div>;
  if (!book) return <div className="min-h-screen bg-white flex items-center justify-center">Manuscript Not Found</div>;

  return (
    <div className="bg-white min-h-screen flex flex-col overflow-hidden">
      <div className="flex-grow flex items-center justify-center pt-6 pb-20 px-8 relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-zinc-50/50 -z-10 hidden lg:block" />

        <div className="unified-axis w-full max-w-6xl">
          <Link href="/marketplace" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all group mb-12">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Collection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-5 flex justify-center lg:justify-start">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-[3/4.5] w-full max-w-[380px] bg-zinc-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative group overflow-hidden border border-zinc-100"
              >
                <img 
                  src={book.cover_url || "/placeholder-cover.jpg"} 
                  alt={book.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
              </motion.div>
            </div>

            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Manuscript / {book.category}</span>
                  <div className="h-px w-8 bg-zinc-200" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Curated Selection</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-heading font-black tracking-tight uppercase mb-6 leading-tight">
                  {book.title}
                </h1>

                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-zinc-100">
                  <p className="text-lg font-medium italic text-zinc-400">by {book.users?.name || "Unknown"}</p>
                  <div className="flex text-zinc-900">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill={s <= (book.rating || 5) ? "currentColor" : "none"} />)}
                  </div>
                </div>

                <p className="text-lg font-medium leading-relaxed italic text-zinc-500 mb-12">
                  {book.description}
                </p>

                <div className="mt-12 flex flex-col gap-6">
                  <Link 
                    href={`/read/pdf?id=${book.id}&title=${encodeURIComponent(book.title)}`}
                    className="w-full py-6 border border-black text-black font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4 group"
                  >
                    <BookOpen size={16} /> Read PDF Manuscript
                  </Link>
                </div>

                <div className="bg-black text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8 rounded-sm shadow-2xl mt-12">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">Flat Rate Access</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-heading font-black tracking-tighter">₹{book.price}</span>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Digital Copy</span>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setIsAddedToCart(!isAddedToCart)}
                      className={`flex-1 md:flex-none px-8 py-5 font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 border ${
                        isAddedToCart ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-transparent border-zinc-700 text-white hover:bg-zinc-900"
                      }`}
                    >
                      <ShoppingBag size={14} />
                      {isAddedToCart ? "Added" : "Cart"}
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      className="flex-1 md:flex-none px-12 py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-zinc-100 transition-all flex items-center justify-center gap-3"
                    >
                      Buy Now <Zap size={14} fill="black" />
                    </button>
                  </div>
                </div>

                <div className="mt-20 pt-12 border-t border-zinc-100 flex items-center gap-8">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full overflow-hidden grayscale">
                    <img src={book.users?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} alt={book.users?.name} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-heading font-black uppercase tracking-tight">{book.users?.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium italic mb-4">{book.users?.bio || "Author of digital manuscripts"}</p>
                    <button 
                      onClick={handleFollow}
                      className={`text-[10px] font-black uppercase tracking-[0.3em] border-b pb-1 transition-all ${isFollowing ? "border-zinc-300 text-zinc-400" : "border-black text-black"}`}
                    >
                      {isFollowing ? "Following" : "Follow Author"}
                    </button>
                  </div>
                </div>

                <div className="mt-24">
                  <div className="flex justify-between items-end mb-12">
                    <h2 className="text-sm font-black uppercase tracking-widest">Reader Reviews ({reviews.length})</h2>
                  </div>

                  {user && (
                    <div className="mb-16 bg-zinc-50 p-8 rounded-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                        {editingReviewId ? "Edit your review" : "Write a review"}
                      </p>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)}>
                            <Star size={16} fill={s <= rating ? "black" : "none"} className={s <= rating ? "text-black" : "text-zinc-200"} />
                          </button>
                        ))}
                      </div>
                      <textarea 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your thoughts on this manuscript..."
                        className="w-full bg-white border border-zinc-100 p-4 rounded-sm outline-none focus:border-black transition-all italic text-sm mb-4"
                        rows={3}
                      />
                      <div className="flex items-center">
                        <button 
                          onClick={submitReview}
                          className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                          {editingReviewId ? "Update Review" : "Submit Review"}
                        </button>
                        {editingReviewId && (
                          <button 
                            onClick={handleCancelEdit}
                            className="px-8 py-3 border border-zinc-200 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all ml-4"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-12">
                    {reviews.length > 0 ? reviews.map((review) => (
                      <ReviewItem 
                        key={review.id}
                        review={review}
                        currentUser={user}
                        onEdit={() => handleStartEdit(review)}
                        onDelete={() => handleDeleteReview(review.id)}
                      />
                    )) : (
                      <p className="text-zinc-400 italic text-sm">No reviews yet. Be the first to share your thoughts.</p>
                    )}
                  </div>
                </div>

                <div className="mt-20 flex items-center gap-4 text-zinc-400">
                  <Info size={14} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Checkout powered by Razorpay</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review, currentUser, onEdit, onDelete }: any) {
  const reviewer = review.users || {};
  const isOwner = currentUser && currentUser.id === review.user_id;

  return (
    <div className="pb-10 border-b border-zinc-50 group/item">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-50 border border-zinc-100 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black">
            {reviewer.avatar_url ? (
              <img src={reviewer.avatar_url} className="w-full h-full object-cover" />
            ) : (
              (reviewer.name || "A").charAt(0)
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{reviewer.name || "Anonymous"}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex text-zinc-900">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={10} fill={s <= review.rating ? "currentColor" : "none"} className={s <= review.rating ? "" : "text-zinc-200"} />
            ))}
          </div>
          
          {isOwner && (
            <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <button 
                onClick={onEdit} 
                className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors cursor-pointer"
              >
                Edit
              </button>
              <span className="text-[8px] text-zinc-200">•</span>
              <button 
                onClick={onDelete} 
                className="text-[8px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-500 leading-relaxed italic mb-4">"{review.comment}"</p>
      <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
