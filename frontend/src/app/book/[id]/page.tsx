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
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const [followersCount, setFollowersCount] = useState(0);

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
      // Fetch book and reviews in parallel
      const [bookRes, reviewsRes] = await Promise.all([
        supabase
          .from("books")
          .select("*, authors:author_id(*, users:user_id(*))")
          .eq("id", params.id)
          .single(),
        supabase
          .from("reviews")
          .select("*, users:user_id(name, avatar_url)")
          .eq("book_id", params.id)
          .order("created_at", { ascending: false })
      ]);

      if (bookRes.error) throw bookRes.error;
      const bookData = bookRes.data;
      setBook(bookData);
      
      if (reviewsRes.data) setReviews(reviewsRes.data);

      if (bookData && bookData.authors?.user_id) {
        // Fetch follower information in parallel
        const [followRes, followersCountRes] = await Promise.all([
          user ? supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", bookData.authors.user_id)
            .maybeSingle() : Promise.resolve({ data: null }),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", bookData.authors.user_id)
        ]);

        if (followRes.data) setIsFollowing(true);
        setFollowersCount(followersCountRes.count || 0);
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
    if (!book.authors?.user_id) return;
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", book.authors.user_id);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: book.authors.user_id });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-outfit text-zinc-400">Loading Manuscript...</div>;
  if (!book) return <div className="min-h-screen bg-white flex items-center justify-center font-outfit text-zinc-400">Manuscript Not Found</div>;

  return (
    <div className="bg-zinc-50/40 min-h-[calc(100vh-96px)] lg:h-[calc(100vh-96px)] flex flex-col overflow-hidden font-outfit text-zinc-900">
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}} />

      <div className="flex-grow w-full max-w-7xl mx-auto h-full flex flex-col lg:flex-row overflow-hidden relative p-4 lg:p-6 gap-6 lg:gap-8">
        
        {/* Left Side: Cover Display */}
        <div className="lg:w-5/12 flex flex-col justify-between h-full relative bg-white border border-zinc-100 rounded-3xl p-6 lg:p-8 overflow-hidden shadow-sm flex-shrink-0">
          {/* Ambient Glow Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 pointer-events-none scale-110 transition-all duration-1000"
            style={{ backgroundImage: `url(${book.cover_url || "/placeholder-cover.jpg"})` }}
          />

          {/* Breadcrumb Header */}
          <div className="relative z-10">
            <Link 
              href="/marketplace" 
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Collection
            </Link>
          </div>

          {/* Cover Container */}
          <div className="flex-grow flex items-center justify-center relative my-6 z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="aspect-[3/4.5] w-full max-w-[280px] lg:max-w-[320px] bg-zinc-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative group overflow-hidden border border-zinc-100 rounded-lg"
            >
              <img 
                src={book.cover_url || "/placeholder-cover.jpg"} 
                alt={book.title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
            </motion.div>
          </div>

          {/* PDF Action Button */}
          <div className="relative z-10 w-full mt-auto">
            <Link 
              href={`/read/pdf?id=${book.id}&title=${encodeURIComponent(book.title)}`}
              className="w-full py-4 border border-zinc-900 text-zinc-950 font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-zinc-950 hover:text-white transition-all flex items-center justify-center gap-3 rounded-xl group"
            >
              <BookOpen size={14} className="group-hover:scale-110 transition-transform" /> Read PDF Manuscript
            </Link>
          </div>
        </div>

        {/* Right Side: Details, Tabs, Reviews, Purchase */}
        <div className="lg:w-7/12 flex flex-col h-full justify-between bg-white border border-zinc-100 rounded-3xl p-6 lg:p-8 overflow-hidden shadow-sm">
          
          {/* Header Area */}
          <div className="border-b border-zinc-100 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Manuscript / {book.category}</span>
              <div className="h-px w-6 bg-zinc-200" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Curated Selection</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight uppercase mb-3 leading-tight text-zinc-900">
              {book.title}
            </h1>

            <div className="flex items-center gap-4">
              <p className="text-sm font-medium italic text-zinc-400">by {book.authors?.users?.name || "Unknown"}</p>
              <div className="h-3 w-px bg-zinc-200" />
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={12} 
                    fill={s <= (book.rating || 5) ? "currentColor" : "none"} 
                    className={s <= (book.rating || 5) ? "text-amber-500" : "text-zinc-200"}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Tabs Navigation */}
          <div className="flex border-b border-zinc-100 mt-4 relative flex-shrink-0">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all mr-8 border-b-2 ${
                activeTab === "overview" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === "reviews" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 py-4 my-2 min-h-0">
            {activeTab === "overview" ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Book Description */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Synopsis</h3>
                  <p className="text-sm font-medium leading-relaxed italic text-zinc-600">
                    {book.description}
                  </p>
                </div>

                {/* Author Profile */}
                <div className="pt-6 border-t border-zinc-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full overflow-hidden grayscale border border-zinc-200 flex-shrink-0">
                    <img 
                      src={book.authors?.users?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} 
                      alt={book.authors?.users?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-md font-heading font-black uppercase tracking-tight text-zinc-900">{book.authors?.users?.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium italic mb-2">{book.authors?.bio || book.authors?.users?.bio || "Author of digital manuscripts"}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{followersCount} Followers</span>
                      <span className="text-zinc-200 text-xs">•</span>
                      <button 
                        onClick={handleFollow}
                        className={`text-[9px] font-black uppercase tracking-[0.25em] border-b pb-0.5 transition-all ${
                          isFollowing ? "border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-500" : "border-zinc-950 text-zinc-950 hover:text-zinc-700"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow Author"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Write a Review Block */}
                {user && (
                  <div className="bg-zinc-50/50 border border-zinc-100 p-5 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                      {editingReviewId ? "Edit your review" : "Write a review"}
                    </p>
                    <div className="flex gap-1.5 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                          <Star 
                            size={14} 
                            fill={s <= rating ? "currentColor" : "none"} 
                            className={s <= rating ? "text-zinc-900" : "text-zinc-200 hover:text-zinc-400"} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts on this manuscript..."
                      className="w-full bg-white border border-zinc-200/60 p-3 rounded-xl outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all italic text-xs mb-3"
                      rows={2}
                    />
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={submitReview}
                        className="px-5 py-2.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all rounded-lg"
                      >
                        {editingReviewId ? "Update" : "Submit"}
                      </button>
                      {editingReviewId && (
                        <button 
                          onClick={handleCancelEdit}
                          className="px-5 py-2.5 border border-zinc-200 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:border-zinc-900 hover:text-zinc-900 transition-all rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews Feed */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewItem 
                        key={review.id}
                        review={review}
                        currentUser={user}
                        onEdit={() => handleStartEdit(review)}
                        onDelete={() => handleDeleteReview(review.id)}
                      />
                    ))
                  ) : (
                    <p className="text-zinc-400 italic text-xs text-center py-6">No reviews yet. Be the first to share your thoughts.</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Checkout/Purchase Footer Card */}
          <div className="border-t border-zinc-100 pt-4 flex-shrink-0">
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between gap-6 rounded-2xl shadow-xl">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1">Flat Rate Access</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-heading font-black tracking-tighter">₹{book.price}</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Digital Copy</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddedToCart(!isAddedToCart)}
                  className={`px-5 py-3.5 font-black text-[9px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 border rounded-xl ${
                    isAddedToCart 
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-300" 
                      : "bg-transparent border-zinc-700 text-white hover:bg-zinc-900"
                  }`}
                >
                  <ShoppingBag size={12} />
                  {isAddedToCart ? "Added" : "Cart"}
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="px-8 py-3.5 bg-white text-zinc-950 font-black text-[9px] uppercase tracking-[0.25em] hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 rounded-xl"
                >
                  Buy Now <Zap size={12} fill="currentColor" />
                </button>
              </div>
            </div>

            {/* Secure Checkout Footer Text */}
            <div className="mt-3 flex items-center justify-center gap-2 text-zinc-400">
              <Info size={11} />
              <p className="text-[8px] font-black uppercase tracking-[0.2em]">Secure Checkout powered by Razorpay</p>
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
    <div className="p-4 bg-zinc-50/40 border border-zinc-100/80 rounded-2xl group/item transition-all hover:bg-zinc-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-100 border border-zinc-200/55 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-black text-zinc-500">
            {reviewer.avatar_url ? (
              <img src={reviewer.avatar_url} className="w-full h-full object-cover" />
            ) : (
              (reviewer.name || "A").charAt(0)
            )}
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800">{reviewer.name || "Anonymous"}</span>
            <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest mt-0.5">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                size={8} 
                fill={s <= review.rating ? "currentColor" : "none"} 
                className={s <= review.rating ? "text-amber-500" : "text-zinc-200"} 
              />
            ))}
          </div>
          
          {isOwner && (
            <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <button 
                onClick={onEdit} 
                className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
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
      <p className="text-xs font-medium text-zinc-600 leading-relaxed italic">"{review.comment}"</p>
    </div>
  );
}
