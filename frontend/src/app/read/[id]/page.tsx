"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, 
  Settings, 
  Menu,
  Bell,
  Moon,
  Sun,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Highlighter,
  MessageSquare,
  Download,
  Heart,
  X,
  Star
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ReaderPage() {
  const [progress, setProgress] = useState(45);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const isArtOfPrompt = id === "the-art-of-prompt";

  // Engagement states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentRating, setCommentRating] = useState<number>(0);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const userObj = stored ? JSON.parse(stored) : null;
    if (userObj) setCurrentUser(userObj);
    
    if (id) {
      fetchEngagementData(id as string, userObj);
    }
  }, [id]);

  const fetchEngagementData = async (bookId: string, userObj: any) => {
    try {
      // 1. Log view/impression
      await supabase.from("impressions").insert({
        content_type: "book",
        content_id: bookId,
        viewer_id: userObj?.id || null
      });

      // 2. Fetch likes count
      const { count: likes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("content_id", bookId);
      setLikesCount(likes || 0);

      if (userObj) {
        // 3. Check if current user liked it
        const { data: like } = await supabase
          .from("likes")
          .select("*")
          .eq("content_id", bookId)
          .eq("user_id", userObj.id)
          .maybeSingle();
        setIsLiked(!!like);

        // 4. Check if current user saved it
        const { data: save } = await supabase
          .from("saves")
          .select("*")
          .eq("content_id", bookId)
          .eq("user_id", userObj.id)
          .maybeSingle();
        setIsSaved(!!save);
      }

      // 5. Fetch comments
      const { data: comms } = await supabase
        .from("comments")
        .select("*, users:user_id(name, avatar_url)")
        .eq("content_id", bookId)
        .order("created_at", { ascending: true });
      if (comms) setComments(comms);

    } catch (err) {
      console.warn("Engagement tables not established yet. Run schema editor migration.", err);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    const bookId = id as string;
    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("content_id", bookId)
          .eq("user_id", currentUser.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("likes")
          .insert({
            content_type: "book",
            content_id: bookId,
            user_id: currentUser.id
          });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    const bookId = id as string;
    try {
      if (isSaved) {
        await supabase
          .from("saves")
          .delete()
          .eq("content_id", bookId)
          .eq("user_id", currentUser.id);
        setIsSaved(false);
      } else {
        await supabase
          .from("saves")
          .insert({
            content_type: "book",
            content_id: bookId,
            user_id: currentUser.id
          });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    if (!newComment.trim() && commentRating === 0) return;
    setSubmittingComment(true);
    const bookId = id as string;
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          content_type: "book",
          content_id: bookId,
          user_id: currentUser.id,
          comment_text: newComment.trim() || null,
          rating: commentRating > 0 ? commentRating : null
        })
        .select("*, users:user_id(name, avatar_url)")
        .single();

      if (error) throw error;
      
      if (data) {
        setComments(prev => [...prev, data]);
        setNewComment("");
        setCommentRating(0);
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const bookData = isArtOfPrompt ? {
    title: "THE ART OF PROMPT",
    author: "TADIMARRI DADAPEER",
    intro: "Why This Book Matters",
    content: `Today, students have access to powerful AI tools that can answer almost anything. But most students still struggle—not because information is unavailable, but because they don’t know how to ask the right questions.

That is where The Art of Prompt makes a difference.

This book is not just about using AI. It is about learning a skill that will stay valuable for life: the ability to think clearly and ask better questions.`,
    toc: ["Introduction", "Why This Book Matters", "What You Will Learn", "Practical Learning System", "Interactive Tools"],
    authorBio: "Tadimari Dadapeer is an educational visionary exploring the frontier of AI-assisted learning. He focuses on empowering students with the cognitive tools needed to navigate the digital age responsibly and effectively."
  } : {
    title: "The Alchemist of Neo-Tokyo",
    author: "Elena Vance",
    intro: "The Neon Gate",
    content: "The rain in Neo-Tokyo didn't just fall; it stained. It was a cocktail of heavy metals and neon light, washing over the carbon-fiber skyscrapers of the Shinjuku district. Kaito pulled his collar up, the sensors in his coat humming as they filtered the toxicity from the air.",
    toc: ["Introduction", "Chapter 4: The Neon Gate", "Chapter 5: Digital Ghosts", "Chapter 6: Final Protocol"],
    authorBio: "Elena Vance is a speculative fiction writer exploring the intersection of human consciousness and emerging technologies. Her work has been featured in The Manuscript Review and Wired Digital."
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black text-white" : "bg-[#FCFCFC] text-black"} transition-colors duration-500`}>
      {/* Top Navigation */}
      <header className={`fixed top-0 left-0 w-full h-20 border-b ${isDarkMode ? "border-zinc-900 bg-black" : "border-zinc-100 bg-white"} z-50 px-12 flex items-center justify-between`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading font-black text-2xl uppercase tracking-tighter italic">Writersthing</Link>
          <div className="h-6 w-px bg-zinc-200" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">READING:</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{bookData.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            <div className="w-32 h-1 bg-zinc-100 relative rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-black transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{progress}% READ</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-zinc-50 rounded-sm">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Bell size={18} className="text-zinc-400 cursor-pointer" />
            <div className="w-8 h-8 bg-zinc-100 rounded-sm overflow-hidden grayscale">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100" alt="User" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex pt-20">
        {/* Left Sidebar */}
        <aside className={`w-80 h-[calc(100vh-80px)] sticky top-20 p-12 border-r ${isDarkMode ? "border-zinc-900" : "border-zinc-100"}`}>
          <div className="mb-16">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">Table of Contents</h3>
            <nav className="space-y-4">
              {bookData.toc.map((item, i) => (
                <TOCLink key={i} title={item} active={i === 1} />
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 font-heading">Reading Tools</h3>
            <div className="space-y-4">
              <button 
                onClick={handleLike} 
                className="w-full flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-all cursor-pointer group rounded-sm bg-white dark:bg-zinc-900 shadow-sm text-left"
              >
                <div className="flex items-center gap-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
                  <Heart size={16} className={isLiked ? "fill-rose-500 text-rose-500 border-none" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isLiked ? "Liked Book" : "Like Book"}</span>
                </div>
                <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{likesCount}</span>
              </button>

              <button 
                onClick={handleSave} 
                className="w-full flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-all cursor-pointer group rounded-sm bg-white dark:bg-zinc-900 shadow-sm text-left"
              >
                <div className="flex items-center gap-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
                  <Bookmark size={16} className={isSaved ? "fill-amber-500 text-amber-500 border-none" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isSaved ? "Saved Book" : "Add Bookmark"}</span>
                </div>
                <ChevronRight size={14} className="text-zinc-200 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => setShowCommentsSidebar(true)} 
                className="w-full flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-all cursor-pointer group rounded-sm bg-white dark:bg-zinc-900 shadow-sm text-left"
              >
                <div className="flex items-center gap-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Reader Comments</span>
                </div>
                <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{comments.length}</span>
              </button>

              {isArtOfPrompt && <ToolLink icon={<Download size={16} />} label="Download E-Book" hasArrow />}
            </div>
          </div>
        </aside>

        {/* Reading Area */}
        <main className="flex-grow py-12 px-6 md:py-32 md:px-48 max-w-5xl">
          <article className="prose prose-zinc max-w-none">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6">Chapter One</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-ultra-tight uppercase mb-6 md:mb-12 leading-none">{bookData.intro}</h1>
            
            <div className="flex items-center gap-6 mb-20 border-b border-zinc-100 pb-12">
              <div className="w-10 h-10 bg-zinc-100 rounded-sm overflow-hidden grayscale">
                <img src={isArtOfPrompt ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} alt={bookData.author} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">{bookData.author}</p>
                <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest mt-1">Published 02 May 2026 • 15 Min Read</p>
              </div>
            </div>

            <div className={`space-y-10 text-xl leading-[1.8] font-body ${isDarkMode ? "text-zinc-300" : "text-zinc-800"} tracking-tight`}>
              <p className="first-letter:text-6xl md:first-letter:text-8xl first-letter:font-heading first-letter:font-black first-letter:float-left first-letter:mr-4 md:first-letter:mr-6 first-letter:leading-none">
                {bookData.content.split('\n')[0]}
              </p>
              
              {bookData.content.split('\n').filter(p => p.trim() !== "").slice(1).map((p, i) => (
                <p key={i}>{p}</p>
              ))}

              <blockquote className={`border-l-4 ${isDarkMode ? "border-white" : "border-black"} pl-6 md:pl-12 py-4 md:py-8 my-10 md:my-20 italic text-2xl md:text-4xl font-serif text-zinc-400 leading-tight`}>
                {isArtOfPrompt ? "Master the way you ask. Shape the way you learn." : '"The truth is never written in ink anymore. It\'s written in light, and light can be turned off."'}
              </blockquote>

              {!isArtOfPrompt && (
                <p>
                  He reached the gate—a shimmer of electromagnetic distortion that separated the residential sectors from the server farms. It was known as the Neon Gate, a threshold where biology ended and pure data began. To cross it was to surrender your history for a chance at immortality.
                </p>
              )}
            </div>

            <div className={`mt-40 p-20 ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100"} rounded-sm border flex items-center gap-12`}>
              <div className="w-32 h-32 bg-zinc-200 flex-shrink-0 grayscale rounded-sm overflow-hidden">
                <img src={isArtOfPrompt ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} alt={bookData.author} />
              </div>
              <div className="flex-grow">
                <h3 className="text-3xl font-heading font-black tracking-tight uppercase mb-4">{bookData.author}</h3>
                <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8">
                  {bookData.authorBio}
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105">Support Author</button>
                  <button className="px-8 py-3 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Follow Updates</button>
                </div>
              </div>
            </div>

            {/* Calculate Average Rating */}
            {(() => {
              const ratedComments = comments.filter(c => c.rating);
              const avgRating = ratedComments.length > 0
                ? (ratedComments.reduce((sum, c) => sum + c.rating, 0) / ratedComments.length).toFixed(1)
                : null;

              return (
                <div className="mt-24 border-t border-zinc-150 dark:border-zinc-800 pt-16">
                  {/* Social Stats Summary (Interactive) */}
                  <div className="flex items-center gap-6 py-6 border-y border-zinc-150 dark:border-zinc-850 text-sm text-zinc-550 dark:text-zinc-400 mb-16 select-none">
                    <button 
                      onClick={handleLike} 
                      className={`flex items-center gap-1.5 transition-all ${isLiked ? "text-rose-600 font-bold" : "hover:text-black dark:hover:text-white"}`}
                    >
                      <Heart size={16} className={`text-rose-500 ${isLiked ? "fill-rose-500" : ""}`} /> 
                      {likesCount} {likesCount === 1 ? "like" : "likes"}
                    </button>
                    <button 
                      onClick={handleSave} 
                      className={`flex items-center gap-1.5 transition-all ${isSaved ? "text-amber-600 font-bold" : "hover:text-black dark:hover:text-white"}`}
                    >
                      <Bookmark size={16} className={`text-amber-500 ${isSaved ? "fill-amber-500" : ""}`} /> 
                      {isSaved ? "Saved" : "Save book"}
                    </button>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={16} className="text-blue-500" /> 
                      {comments.length} comments
                    </span>
                    {avgRating && (
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 px-2.5 py-0.5 rounded font-black">
                        ★ {avgRating} Avg Rating
                      </span>
                    )}
                  </div>

                  {/* Comments Section */}
                  <section className="space-y-8">
                    <h3 className="text-2xl font-serif tracking-tight font-bold">Comments ({comments.length})</h3>

                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      {/* Star Rating Input */}
                      <div className="flex items-center gap-3 py-1 select-none">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Give a Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCommentRating(star)}
                              className="focus:outline-none hover:scale-110 transition-transform"
                            >
                              <Star
                                size={16}
                                fill={star <= commentRating ? "#eab308" : "none"}
                                className={star <= commentRating ? "text-yellow-500" : "text-zinc-300 dark:text-zinc-700 hover:text-yellow-400"}
                              />
                            </button>
                          ))}
                        </div>
                        {commentRating > 0 && (
                          <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 border border-amber-150 dark:border-amber-900 px-2 py-0.5 rounded uppercase tracking-widest">
                            {commentRating} Stars
                          </span>
                        )}
                      </div>

                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts on this book..."
                        className={`w-full px-5 py-4 rounded-2xl text-sm focus:outline-none min-h-[100px] resize-none transition-colors border ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 focus:border-zinc-750 text-white focus:ring-1 focus:ring-zinc-700" 
                            : "bg-zinc-50 border-zinc-200 focus:border-black text-zinc-900 focus:ring-1 focus:ring-black"
                        }`}
                        required={commentRating === 0}
                      />
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingComment}
                          className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-black uppercase tracking-widest rounded-full transition-all disabled:opacity-50"
                        >
                          {submittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </form>

                    <div className="space-y-6 pt-6">
                      {comments.length > 0 ? (
                        comments.map((comm) => {
                          const name = comm.users?.name || "Reader";
                          const avatar = comm.users?.avatar_url;
                          return (
                            <div key={comm.id} className={`flex gap-4 items-start p-5 rounded-2xl border ${
                              isDarkMode ? "bg-zinc-900/30 border-zinc-900" : "bg-zinc-50/50 border-zinc-100"
                            }`}>
                              {avatar ? (
                                <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 border border-zinc-205 dark:border-zinc-800 shrink-0 uppercase">
                                  {name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{name}</span>
                                  <span className="text-xs text-zinc-400">• {new Date(comm.created_at).toLocaleDateString()}</span>
                                  {comm.rating && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 border border-amber-150 dark:border-amber-900 px-1.5 py-0.5 rounded">
                                      ★ {comm.rating}
                                    </span>
                                  )}
                                </div>
                                {comm.comment_text && (
                                  <p className={`text-sm mt-2 leading-relaxed font-medium ${isDarkMode ? "text-zinc-300" : "text-zinc-650"}`}>{comm.comment_text}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-zinc-400 italic">No comments yet. Be the first to share your thoughts!</p>
                      )}
                    </div>
                  </section>
                </div>
              );
            })()}
          </article>
        </main>
      </div>

      {/* Sliding Comments Sidebar */}
      <AnimatePresence>
        {showCommentsSidebar && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowCommentsSidebar(false)} />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`w-96 h-full shadow-2xl flex flex-col relative z-10 ${
                isDarkMode ? "bg-zinc-950 border-l border-zinc-900 text-white" : "bg-white border-l border-zinc-100 text-zinc-900"
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b flex items-center justify-between ${
                isDarkMode ? "border-zinc-900" : "border-zinc-100"
              }`}>
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider font-heading">Comments ({comments.length})</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{bookData.title}</p>
                </div>
                <button
                  onClick={() => setShowCommentsSidebar(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? "hover:bg-zinc-900 text-zinc-400 hover:text-white" : "hover:bg-zinc-50 text-zinc-500 hover:text-black"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {comments.length > 0 ? (
                  comments.map((comm) => {
                    const name = comm.users?.name || "Reader";
                    const avatar = comm.users?.avatar_url;
                    return (
                      <div key={comm.id} className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-zinc-900/40 border-zinc-900" : "bg-zinc-50 border-zinc-100"
                      }`}>
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs border border-zinc-300 uppercase">
                              {name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-semibold">{name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {new Date(comm.created_at).toLocaleDateString()}
                              </span>
                              {comm.rating && (
                                <span className="flex items-center gap-0.5 text-[8px] font-black bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450 border border-amber-100 dark:border-amber-900/60 px-1 py-0.2 rounded">
                                  ★ {comm.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {comm.comment_text && (
                          <p className={`text-xs mt-3 leading-relaxed ${isDarkMode ? "text-zinc-300" : "text-zinc-600"}`}>
                            {comm.comment_text}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-center py-20">
                    <p className="text-xs text-zinc-400 italic font-medium">No comments yet. Write the first comment!</p>
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <div className={`p-6 border-t ${
                isDarkMode ? "border-zinc-900 bg-zinc-950" : "border-zinc-100 bg-white"
              }`}>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  {/* Star Rating Input */}
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-450">Give Rating:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCommentRating(star)}
                          className="focus:outline-none hover:scale-110 transition-transform"
                        >
                          <Star
                            size={12}
                            fill={star <= commentRating ? "#eab308" : "none"}
                            className={star <= commentRating ? "text-yellow-500" : "text-zinc-300 dark:text-zinc-650 hover:text-yellow-400"}
                          />
                        </button>
                      ))}
                    </div>
                    {commentRating > 0 && (
                      <span className="text-[8px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/60 px-1.5 py-0.2 rounded uppercase tracking-widest">
                        {commentRating} Stars
                      </span>
                    )}
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    className={`w-full p-4 rounded-xl text-xs resize-none min-h-[80px] focus:outline-none border ${
                      isDarkMode 
                        ? "bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-300"
                    }`}
                    required={commentRating === 0}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-black text-[9px] uppercase tracking-widest transition-all rounded-full hover:scale-[1.02] disabled:opacity-50"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TOCLink({ title, active }: any) {
  return (
    <div className={`flex items-center justify-between group cursor-pointer transition-colors ${active ? "text-black dark:text-white" : "text-zinc-400 hover:text-black dark:hover:text-white"}`}>
      <span className={`text-xs font-bold ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>{active ? `• ${title}` : title}</span>
      {active && <div className="h-0.5 w-8 bg-current" />}
    </div>
  );
}

function ToolLink({ icon, label, hasArrow, count }: any) {
  return (
    <div className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-all cursor-pointer group rounded-sm bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center gap-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {hasArrow && <ChevronRight size={14} className="text-zinc-200 group-hover:translate-x-1 transition-all" />}
      {count && <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>}
    </div>
  );
}
