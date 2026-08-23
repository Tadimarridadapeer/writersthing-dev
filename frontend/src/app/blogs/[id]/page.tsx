"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User, Share2, Loader2, Heart, MessageSquare, Bookmark, Star, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DictionaryWrapper from "@/components/DictionaryWrapper";
import { ReviewSection } from "@/components/ReviewSection";
import LanguageSelector from "@/components/LanguageSelector";
import LikedByUsers, { LikedUser } from "@/components/LikedByUsers";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

function renderMarkdown(content: string): string {
  if (!content) return "";
  
  // If content is already HTML (from Rich Text Editor), do not escape or process as markdown
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  // Escape HTML tags for standard markdown to prevent arbitrary code execution
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = html.split("\n");
  let result = [];
  let inList = false;
  let currentParagraph: string[] = [];

  const closeParagraph = () => {
    if (currentParagraph.length > 0) {
      result.push(`<p>${currentParagraph.join(" ")}</p>`);
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "") {
      closeParagraph();
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      closeParagraph();
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3>${line.substring(4)}</h3>`);
    } else if (line.startsWith("## ")) {
      closeParagraph();
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2>${line.substring(3)}</h2>`);
    } else if (line.startsWith("# ")) {
      closeParagraph();
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h1>${line.substring(2)}</h1>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      closeParagraph();
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      currentParagraph.push(line);
    }
  }

  closeParagraph();
  if (inList) result.push("</ul>");

  let parsedHtml = result.join("\n");

  // Inline styling: images, links, bold, italics
  parsedHtml = parsedHtml.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');
  parsedHtml = parsedHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  parsedHtml = parsedHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  parsedHtml = parsedHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');

  return parsedHtml;
}

export default function BlogPost() {
  const params = useParams();
  const router = useRouter();
  useAnalyticsTracking("blog", params.id as string);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [blog, setBlog] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Engagement states
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentRating, setCommentRating] = useState<number>(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [translatedBlog, setTranslatedBlog] = useState<{ title?: string, content?: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const userObj = stored ? JSON.parse(stored) : null;
    if (userObj) setCurrentUser(userObj);
    fetchBlog(userObj);
  }, [params.id]);

  const fetchBlog = async (userObj: any) => {
    try {
      const res = await fetch(`/api/manuscripts/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch blog post");
      }
      const data = await res.json();
      setBlog(data);
      
      const savedLang = localStorage.getItem("preferredLanguage");
      if (savedLang && savedLang !== "en") {
        performTranslation(savedLang, data.title, data.content);
      }
      
      // Load engagement and follow data in parallel
      if (data.authorId) {
        fetchFollowData(data.authorId, userObj);
      }
      
      // data.id is the UUID of the blog post
      const blogUuid = params.id as string; // params.id is the UUID/slug
      fetchEngagementData(blogUuid, userObj);

    } catch (err) {
      console.error("Fetch blog error:", err);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

  const performTranslation = async (lang: string, title: string, content: string) => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: params.id,
          languageCode: lang,
          title: title,
          content: content
        })
      });
      const data = await res.json();
      if (data.status === 'completed') {
        setTranslatedBlog({
          title: data.title,
          content: data.content
        });
      } else if (data.status === 'pending') {
        console.warn("Translation is pending...");
      } else {
        console.error("Translation failed:", data.error || "Unknown error");
        setSelectedLanguage("en");
        localStorage.removeItem("preferredLanguage");
      }
    } catch (err) {
      console.error("Translation fetch error:", err);
      setSelectedLanguage("en");
      localStorage.removeItem("preferredLanguage");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem("preferredLanguage", code);
    if (code === "en") {
      setTranslatedBlog(null);
    } else if (blog) {
      performTranslation(code, blog.title, blog.content);
    }
  };

  const fetchEngagementData = async (blogId: string, userObj: any) => {
    try {
      // 1. Log view/impression
      await supabase.from("impressions").insert({
        content_type: "blog",
        content_id: blogId,
        viewer_id: userObj?.id || null
      });

      // 2. Fetch likes & liked users list via API with Supabase fallback
      try {
        const likesUrl = userObj?.id 
          ? `/api/likes?content_id=${blogId}&user_id=${userObj.id}` 
          : `/api/likes?content_id=${blogId}`;

        const likesRes = await fetch(likesUrl);
        if (likesRes.ok) {
          const likesData = await likesRes.json();
          setLikesCount(likesData.likesCount || 0);
          setIsLiked(!!likesData.isLiked);
          setLikedUsers(likesData.likedUsers || []);
        } else {
          throw new Error("API returned non-200");
        }
      } catch (apiErr) {
        const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogId)
          ? blogId
          : `00000000-0000-4000-8000-${Buffer.from(String(blogId)).toString("hex").padEnd(12, "0").slice(0, 12)}`;

        const { data: likesData } = await supabase
          .from("likes")
          .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
          .in("content_id", [blogId, validId])
          .order("created_at", { ascending: false });

        if (likesData) {
          setLikesCount(likesData.length);
          const mappedUsers = likesData.map((l: any) => {
            const u = Array.isArray(l.users) ? l.users[0] : l.users;
            return {
              id: l.user_id,
              name: u?.name || "Reader",
              avatar_url: u?.avatar_url || null,
              liked_at: l.created_at
            };
          });
          setLikedUsers(mappedUsers);
          if (userObj) {
            setIsLiked(mappedUsers.some((u: any) => u.id === userObj.id));
          }
        }
      }

      if (userObj) {
        // Check if current user saved it
        const { data: save } = await supabase
          .from("saves")
          .select("*")
          .eq("content_id", blogId)
          .eq("user_id", userObj.id)
          .maybeSingle();
        setIsSaved(!!save);
      }

      // 5. Fetch comments via API with Supabase fallback
      try {
        const commsRes = await fetch(`/api/comments?content_id=${blogId}`);
        if (commsRes.ok) {
          const commsData = await commsRes.json();
          if (commsData.comments) setComments(commsData.comments);
        } else {
          throw new Error("API returned non-200");
        }
      } catch (commsErr) {
        const { data: comms } = await supabase
          .from("comments")
          .select("*, users:user_id(name, avatar_url)")
          .or(`content_id.eq.${blogId},post_id.eq.${blogId}`)
          .order("created_at", { ascending: true });
        if (comms) setComments(comms);
      }

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
    if (!blog?.authorId) return;
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", blog.authorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: blog.authorId });
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
    const blogUuid = params.id as string;
    try {
      const currentUserName = currentUser.name || currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || "You";
      const currentUserAvatar = currentUser.avatar_url || currentUser.user_metadata?.avatar_url || null;

      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));

      if (newIsLiked) {
        setLikedUsers(prev => [
          {
            id: currentUser.id,
            name: currentUserName,
            avatar_url: currentUserAvatar,
            liked_at: new Date().toISOString()
          },
          ...prev.filter(u => u.id !== currentUser.id)
        ]);
      } else {
        setLikedUsers(prev => prev.filter(u => u.id !== currentUser.id));
      }

      // Call POST API for server-side toggle
      try {
        const res = await fetch(`/api/likes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: blogUuid, user_id: currentUser.id })
        });

        if (res.ok) {
          const data = await res.json();
          setIsLiked(data.isLiked);
          setLikesCount(data.likesCount);
          if (data.likedUsers) setLikedUsers(data.likedUsers);
        } else {
          throw new Error("API toggle failed");
        }
      } catch (apiErr) {
        const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogUuid)
          ? blogUuid
          : `00000000-0000-4000-8000-${Buffer.from(String(blogUuid)).toString("hex").padEnd(12, "0").slice(0, 12)}`;

        if (!newIsLiked) {
          await supabase
            .from("likes")
            .delete()
            .eq("content_id", validId)
            .eq("user_id", currentUser.id);
        } else {
          await supabase
            .from("likes")
            .insert({
              content_type: "article",
              content_id: validId,
              user_id: currentUser.id
            });
        }
      }
    } catch (err: any) {
      console.error("Like error:", err?.message || err);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    const blogUuid = params.id as string;
    const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogUuid)
      ? blogUuid
      : `00000000-0000-4000-8000-${Buffer.from(String(blogUuid)).toString("hex").padEnd(12, "0").slice(0, 12)}`;

    try {
      if (isSaved) {
        setIsSaved(false);
        await supabase
          .from("saves")
          .delete()
          .in("content_id", [blogUuid, validId])
          .eq("user_id", currentUser.id);
      } else {
        setIsSaved(true);
        await supabase
          .from("saves")
          .insert({
            content_type: "blog",
            content_id: validId,
            user_id: currentUser.id
          });
      }
    } catch (err: any) {
      console.error("Save error:", err?.message || err);
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
    const blogUuid = params.id as string;
    try {
      let postedComment = null;

      try {
        const res = await fetch(`/api/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: "blog",
            content_id: blogUuid,
            comment_text: newComment.trim() || null,
            rating: commentRating > 0 ? commentRating : null,
            user_id: currentUser.id
          })
        });

        if (res.ok) {
          const resData = await res.json();
          postedComment = resData.comment;
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "API POST error");
        }
      } catch (apiErr: any) {
        console.warn("API comment submit error, trying client fallback:", apiErr?.message || apiErr);
        const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogUuid)
          ? blogUuid
          : `00000000-0000-4000-8000-${Buffer.from(String(blogUuid)).toString("hex").padEnd(12, "0").slice(0, 12)}`;

        const { data, error } = await supabase
          .from("comments")
          .insert({
            content_type: "blog",
            content_id: validId,
            user_id: currentUser.id,
            comment_text: newComment.trim() || null,
            rating: commentRating > 0 ? commentRating : null
          })
          .select("*, users:user_id(name, avatar_url)")
          .single();

        if (error) throw new Error(error.message || JSON.stringify(error));
        postedComment = data;
      }

      if (postedComment) {
        if (!postedComment.users) {
          postedComment.users = {
            name: currentUser.name || currentUser.user_metadata?.name || "Reader",
            avatar_url: currentUser.avatar_url || currentUser.user_metadata?.avatar_url || null
          };
        }
        setComments(prev => [...prev, postedComment]);
        setNewComment("");
        setCommentRating(0);
      }
    } catch (err: any) {
      console.error("Comment submit error:", err?.message || JSON.stringify(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/manuscripts/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/marketplace");
      } else {
        alert("Failed to delete blog.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: blog?.title || "Writersthing Blog",
      text: "Check out this blog on Writersthing!",
      url: url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-200" size={48} /></div>;
  if (!blog) return <div className="h-screen flex items-center justify-center italic text-zinc-400">Story not found</div>;

  const isDraftPost = blog.content && (blog.content.startsWith("[DRAFT]\n") || blog.content === "[DRAFT]");
  const cleanContent = isDraftPost 
    ? (blog.content.startsWith("[DRAFT]\n") ? blog.content.substring(8) : "") 
    : (blog.content || "");
  const isAuthor = currentUser && currentUser.id === blog.authorId;

  if (isDraftPost && !isAuthor) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
        <h1 className="text-2xl font-heading font-bold uppercase tracking-tight text-amber-600">DRAFT STORY</h1>
        <p className="text-zinc-500 font-medium">This story is a draft and is not published yet.</p>
        <Link href="/marketplace" className="px-8 py-3 bg-black text-white font-bold rounded-sm shadow-xl">
          Return to Marketplace
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

          <button onClick={() => router.back()} className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all mb-16">
            <ArrowLeft size={14} />
            Back
          </button>

          <header className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-6">
              <span className="inline-block px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest">{blog.category}</span>
              {isTranslating && (
                <span className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <Loader2 size={12} className="animate-spin" />
                  Generating translation...
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black tracking-tighter uppercase mb-8 leading-[1.1]">
              {translatedBlog?.title || blog.title}
            </h1>
            
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              isTranslating={isTranslating}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-8 border-y border-zinc-100 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center rounded-full">
                  <User size={20} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">
                    {blog.authorId ? (
                      <Link href={`/authors/${blog.authorId}`} className="hover:underline hover:text-zinc-600 transition-colors">
                        {blog.author && blog.author !== "Writersthing Author" 
                          ? blog.author 
                          : (currentUser?.id === blog.authorId && (currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name) 
                              ? (currentUser.user_metadata.name || currentUser.user_metadata.full_name) 
                              : "Writersthing Author")}
                      </Link>
                    ) : (
                      blog.author || "Writersthing Author"
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium italic mt-0.5">
                    {blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString() : "Draft"}
                    {blog.authorId && ` • ${followersCount} Followers`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {blog.authorId && (
                  isAuthor ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/write/${params.id}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest border-black bg-black text-white hover:bg-zinc-800"
                      >
                        Edit Story
                      </Link>
                      <button
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest border-rose-600 text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleFollow}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${
                        isFollowing 
                          ? "border-black bg-black text-white" 
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-black hover:border-zinc-300"
                      }`}
                    >
                      {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )
                )}
                
                {/* Like Button */}
                <button 
                  onClick={handleLike}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${
                    isLiked 
                      ? "border-black bg-black text-white" 
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-black hover:border-zinc-300"
                  }`}
                  title="Like story"
                >
                  <Heart size={16} className={isLiked ? "fill-white" : ""} />
                  {isLiked ? "Liked" : "Like"}
                </button>
                
                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${
                    isSaved 
                      ? "border-black bg-black text-white" 
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-black hover:border-zinc-300"
                  }`}
                  title="Save to Library"
                >
                  <Bookmark size={16} className={isSaved ? "fill-white" : ""} />
                  {isSaved ? "Saved" : "Save"}
                </button>

                {/* Share Button (Reference) */}
                <button 
                  onClick={handleShare} 
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 transition-all text-xs font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-black hover:border-zinc-300"
                  title="Reference / Share"
                >
                  <Share2 size={16} />
                  Reference
                </button>
              </div>
            </div>
          </header>

          {blog.cover_url && (
            <div className="w-full aspect-[21/9] md:aspect-[16/6] overflow-hidden my-12 bg-zinc-50 border border-zinc-100 rounded-sm">
              <img 
                src={blog.cover_url} 
                alt={blog.title} 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
          )}

          <div className={`prose prose-lg md:prose-xl max-w-none mb-24 font-serif text-zinc-800 prose-headings:font-heading prose-headings:font-black prose-headings:text-black prose-p:font-serif prose-p:leading-[1.8] prose-p:tracking-[0.01em] prose-a:text-indigo-600 prose-blockquote:border-l-4 prose-blockquote:border-zinc-900 prose-blockquote:bg-zinc-50 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-zinc-700 prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto prose-strong:font-bold prose-strong:text-black ${isTranslating ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(translatedBlog?.content || cleanContent) }} />

          {/* Calculate Average Rating */}
          {(() => {
            const ratedComments = comments.filter(c => c.rating);
            const avgRating = ratedComments.length > 0
              ? (ratedComments.reduce((sum, c) => sum + c.rating, 0) / ratedComments.length).toFixed(1)
              : null;

            return (
              <>
                {/* Social Stats Summary & Liked By Component */}
                <div className="py-6 border-y border-zinc-100 mb-16 select-none space-y-4">
                  <LikedByUsers 
                    likedUsers={likedUsers} 
                    likesCount={likesCount} 
                    isLiked={isLiked} 
                    onLikeToggle={handleLike} 
                  />

                  <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 pt-2 border-t border-zinc-50">
                    <button 
                      onClick={handleLike} 
                      className={`flex items-center gap-1.5 transition-all ${isLiked ? "text-black font-bold" : "hover:text-black"}`}
                    >
                      <Heart size={16} className={`text-zinc-500 ${isLiked ? "fill-black text-black" : ""}`} /> 
                      {likesCount} {likesCount === 1 ? "like" : "likes"}
                    </button>
                    <button 
                      onClick={handleSave} 
                      className={`flex items-center gap-1.5 transition-all ${isSaved ? "text-black font-bold" : "hover:text-black"}`}
                    >
                      <Bookmark size={16} className={`text-zinc-500 ${isSaved ? "fill-black text-black" : ""}`} /> 
                      {isSaved ? "Saved" : "Save story"}
                    </button>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={16} className="text-zinc-500" /> 
                      {comments.length} comments
                    </span>
                    {avgRating && (
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded font-black">
                        ★ {avgRating} Avg Rating
                      </span>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <section className="space-y-8">
                  <h3 className="text-2xl font-serif tracking-tight text-zinc-900 font-bold">Comments ({comments.length})</h3>

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
                      placeholder="Share your thoughts on this story..."
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
                        const name = comm.users?.name || "Reader";
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
                      <p className="text-sm text-zinc-400 italic">No comments yet. Be the first to share your thoughts!</p>
                    )}
                  </div>
                </section>
              </>
            );
          })()}
          <ReviewSection contentId={blog.id} contentType="blog" authorId={blog.author_id} />
        </article>
      </div>
    </div>
  );
}
