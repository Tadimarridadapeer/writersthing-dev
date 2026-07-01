"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, User, Bookmark, Loader2, Heart, MessageSquare, Share2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

function renderMarkdown(content: string): string {
  if (!content) return "";
  
  // Escape HTML tags to prevent arbitrary code execution
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = html.split("\n");
  let result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "") {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3 class="text-xl font-bold font-heading mt-8 mb-4 text-zinc-900">${line.substring(4)}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2 class="text-2xl font-black font-heading mt-10 mb-5 text-zinc-900">${line.substring(3)}</h2>`);
    } else if (line.startsWith("# ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h1 class="text-3xl font-black font-heading mt-12 mb-6 text-zinc-900">${line.substring(2)}</h1>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        result.push('<ul class="list-disc pl-6 my-4 space-y-2 text-zinc-700">');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<p class="text-lg md:text-xl font-medium leading-relaxed text-zinc-650 mb-6">${line}</p>`);
    }
  }

  if (inList) result.push("</ul>");

  let parsedHtml = result.join("\n");

  // Inline styling: images, links, bold, italics
  parsedHtml = parsedHtml.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="w-full my-8 rounded-lg shadow-md border border-zinc-100 max-h-[500px] object-cover" />');
  parsedHtml = parsedHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-black underline font-bold hover:text-zinc-600">$1</a>');
  parsedHtml = parsedHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-zinc-900">$1</strong>');
  parsedHtml = parsedHtml.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-800">$1</em>');

  return parsedHtml;
}

export default function ArticlePost() {
  const params = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [article, setArticle] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Engagement states
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentRating, setCommentRating] = useState<number>(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const userObj = stored ? JSON.parse(stored) : null;
    if (userObj) setCurrentUser(userObj);
    fetchArticle(userObj);
  }, [params.id]);

  const fetchArticle = async (userObj: any) => {
    try {
      const res = await fetch(`/api/manuscripts/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch article");
      }
      const data = await res.json();
      setArticle(data);
      
      // Load engagement and follow data in parallel
      if (data.authorId) {
        fetchFollowData(data.authorId, userObj);
      }
      
      const articleUuid = params.id as string;
      fetchEngagementData(articleUuid, userObj);

    } catch (err) {
      console.error("Fetch article error:", err);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngagementData = async (articleId: string, userObj: any) => {
    try {
      // 1. Log view/impression
      await supabase.from("impressions").insert({
        content_type: "article",
        content_id: articleId,
        viewer_id: userObj?.id || null
      });

      // 2. Fetch likes count
      const { count: likes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("content_id", articleId);
      setLikesCount(likes || 0);

      if (userObj) {
        // 3. Check if current user liked it
        const { data: like } = await supabase
          .from("likes")
          .select("*")
          .eq("content_id", articleId)
          .eq("user_id", userObj.id)
          .maybeSingle();
        setIsLiked(!!like);

        // 4. Check if current user saved it
        const { data: save } = await supabase
          .from("saves")
          .select("*")
          .eq("content_id", articleId)
          .eq("user_id", userObj.id)
          .maybeSingle();
        setIsSaved(!!save);
      }

      // 5. Fetch comments
      const { data: comms } = await supabase
        .from("comments")
        .select("*, users:user_id(name, avatar_url)")
        .eq("content_id", articleId)
        .order("created_at", { ascending: true });
      if (comms) setComments(comms);

    } catch (err) {
      console.warn("Engagement tables not established yet. Run schema editor migration.", err);
    }
  };

  const fetchFollowData = async (authorId: string, userObj: any) => {
    try {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", authorId);
      setFollowersCount(count || 0);

      if (userObj) {
        const { data: follow } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", userObj.id)
          .eq("following_id", authorId)
          .maybeSingle();
        if (follow) setIsFollowing(true);
      }
    } catch (err) {
      console.error("Fetch follow error:", err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    if (!article?.authorId) return;
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", article.authorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: article.authorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    const articleUuid = params.id as string;
    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("content_id", articleUuid)
          .eq("user_id", currentUser.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("likes")
          .insert({
            content_type: "article",
            content_id: articleUuid,
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
    const articleUuid = params.id as string;
    try {
      if (isSaved) {
        await supabase
          .from("saves")
          .delete()
          .eq("content_id", articleUuid)
          .eq("user_id", currentUser.id);
        setIsSaved(false);
      } else {
        await supabase
          .from("saves")
          .insert({
            content_type: "article",
            content_id: articleUuid,
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
    const articleUuid = params.id as string;
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          content_type: "article",
          content_id: articleUuid,
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-200" size={48} /></div>;
  if (!article) return <div className="h-screen flex items-center justify-center italic text-zinc-400">Article not found</div>;

  const isDraftPost = article.content && (article.content.startsWith("[DRAFT]\n") || article.content === "[DRAFT]");
  const cleanContent = isDraftPost 
    ? (article.content.startsWith("[DRAFT]\n") ? article.content.substring(8) : "") 
    : (article.content || "");
  const isAuthor = currentUser && currentUser.id === article.authorId;

  if (isDraftPost && !isAuthor) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
        <h1 className="text-2xl font-heading font-bold uppercase tracking-tight text-amber-600">DRAFT ARTICLE</h1>
        <p className="text-zinc-500 font-medium">This article is a draft and is not published yet.</p>
        <Link href="/articles" className="px-8 py-3 bg-black text-white font-bold rounded-sm shadow-xl">
          Return to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-outfit text-zinc-900">
      <div className="pt-6 pb-24">
        <article className="unified-axis max-w-3xl">
          {isDraftPost && isAuthor && (
            <div className="mb-12 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-800">You are viewing a Draft</p>
                <p className="text-xs text-amber-600 font-medium">This story is only visible to you. Once you finish writing, you can publish it to make it public.</p>
              </div>
              <Link 
                href={`/write/${params.id}`} 
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl text-center shadow-md transition-all shrink-0"
              >
                Continue Writing
              </Link>
            </div>
          )}

          <Link href="/articles" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all mb-16">
            <ArrowLeft size={14} />
            Back to Articles
          </Link>

          <header className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Article / {article.category}</span>
              <div className="h-px w-8 bg-zinc-200" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-black tracking-tighter uppercase mb-6 md:mb-12 leading-[0.95]">
              {article.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-10 border-y border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black flex items-center justify-center rounded-full">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">
                    {article.authorId ? (
                      <Link href={`/authors/${article.authorId}`} className="hover:underline hover:text-zinc-600 transition-colors">
                        {article.author || "Writersthing Author"}
                      </Link>
                    ) : (
                      article.author || "Writersthing Author"
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                    {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : "Draft"}
                    {article.authorId && ` • ${followersCount} Followers`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {article.authorId && (
                  isAuthor ? (
                    <Link
                      href={`/write/${params.id}`}
                      className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-black bg-black text-white hover:bg-zinc-800 transition-all flex items-center justify-center"
                    >
                      Edit Story
                    </Link>
                  ) : (
                    <button 
                      onClick={handleFollow}
                      className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isFollowing 
                          ? "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300" 
                          : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )
                )}
                
                {/* Like Button */}
                <button 
                  onClick={handleLike}
                  className={`p-3.5 border transition-all rounded-xl ${
                    isLiked 
                      ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" 
                      : "border-zinc-100 hover:bg-zinc-50 text-zinc-500 hover:text-black"
                  }`}
                  title="Like article"
                >
                  <Heart size={16} className={isLiked ? "fill-rose-500 text-rose-500" : ""} />
                </button>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-6 py-3.5 border text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${
                    isSaved 
                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" 
                      : "border-black hover:bg-black hover:text-white"
                  }`}
                >
                  <Bookmark size={14} className={isSaved ? "fill-amber-500 text-amber-500" : ""} />
                  {isSaved ? "Saved Reference" : "Save Reference"}
                </button>
              </div>
            </div>
          </header>

          {article.cover_url && (
            <div className="w-full aspect-[21/9] md:aspect-[16/6] overflow-hidden my-12 bg-zinc-50 border border-zinc-100 rounded-sm">
              <img 
                src={article.cover_url} 
                alt={article.title} 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
          )}

          <div className="prose prose-zinc max-w-none mb-16" dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanContent) }} />

          {/* Calculate Average Rating */}
          {(() => {
            const ratedComments = comments.filter(c => c.rating);
            const avgRating = ratedComments.length > 0
              ? (ratedComments.reduce((sum, c) => sum + c.rating, 0) / ratedComments.length).toFixed(1)
              : null;

            return (
              <>
                {/* Social Stats Summary (Interactive) */}
                <div className="flex items-center gap-6 py-6 border-y border-zinc-100 text-sm text-zinc-500 mb-16 select-none">
                  <button 
                    onClick={handleLike} 
                    className={`flex items-center gap-1.5 transition-all ${isLiked ? "text-rose-600 font-bold" : "hover:text-black"}`}
                  >
                    <Heart size={16} className={`text-rose-500 ${isLiked ? "fill-rose-500" : ""}`} /> 
                    {likesCount} {likesCount === 1 ? "like" : "likes"}
                  </button>
                  <button 
                    onClick={handleSave} 
                    className={`flex items-center gap-1.5 transition-all ${isSaved ? "text-amber-600 font-bold" : "hover:text-black"}`}
                  >
                    <Bookmark size={16} className={`text-amber-500 ${isSaved ? "fill-amber-500" : ""}`} /> 
                    {isSaved ? "Saved reference" : "Save reference"}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-blue-500" /> 
                    {comments.length} comments
                  </span>
                  {avgRating && (
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded font-black">
                      ★ {avgRating} Avg Rating
                    </span>
                  )}
                </div>

                {/* Comments Section */}
                <section className="space-y-8">
                  <h3 className="text-2xl font-serif tracking-tight text-zinc-900 font-bold font-heading">Discussion ({comments.length})</h3>

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
                              className={star <= commentRating ? "text-yellow-500" : "text-zinc-300 hover:text-yellow-400"}
                            />
                          </button>
                        ))}
                      </div>
                      {commentRating > 0 && (
                        <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded uppercase tracking-widest">
                          {commentRating} Stars
                        </span>
                      )}
                    </div>

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your insights on this article..."
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 focus:border-black rounded-2xl text-sm focus:outline-none min-h-[100px] resize-none transition-colors"
                      required={commentRating === 0}
                    />
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded-full transition-all disabled:opacity-50"
                      >
                        {submittingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-6 pt-6">
                    {comments.length > 0 ? (
                      comments.map((comm) => {
                        const name = comm.users?.name || "Scholar";
                        const avatar = comm.users?.avatar_url;
                        return (
                          <div key={comm.id} className="flex gap-4 items-start bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200 shrink-0 uppercase">
                                {name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-900">{name}</span>
                                <span className="text-xs text-zinc-400">• {new Date(comm.created_at).toLocaleDateString()}</span>
                                {comm.rating && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-150 px-1.5 py-0.5 rounded">
                                    ★ {comm.rating}
                                  </span>
                                )}
                              </div>
                              {comm.comment_text && (
                                <p className="text-sm text-zinc-650 mt-2 leading-relaxed font-medium">{comm.comment_text}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-zinc-400 italic">No comments yet. Write a response to start the discussion!</p>
                    )}
                  </div>
                </section>
              </>
            );
          })()}
        </article>
      </div>
    </div>
  );
}
