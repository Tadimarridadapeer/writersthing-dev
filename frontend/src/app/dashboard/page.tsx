"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  Loader2, 
  Users, 
  BookOpen, 
  Star, 
  TrendingUp, 
  ChevronRight,
  X,
  CheckCircle2,
  Heart,
  MessageSquare,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [dbUser, setDbUser] = useState<any>(null);
  const [reputation, setReputation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myManuscripts, setMyManuscripts] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal state for creator onboarding
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatorForm, setCreatorForm] = useState({
    bio: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: ""
  });

  // Modal state for engagement details
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: "likes" | "comments" | "saves" | "followers";
    title: string;
    data: any[];
  } | null>(null);

  const fetchDashboardData = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (userData) {
        setDbUser(userData);
      }

      const { data: repData } = await supabase
        .from("author_reputation")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (repData) {
        setReputation(repData);
      }

      // 1. Resolve author profile record
      const { data: authorData } = await supabase
        .from("authors")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const authorId = authorData?.id;

      let books: any[] = [];
      let articles: any[] = [];
      let blogs: any[] = [];

      if (authorId) {
        const [booksRes, articlesRes, blogsRes] = await Promise.all([
          supabase.from("books").select("*").eq("author_id", authorId),
          supabase.from("articles").select("*").eq("author_id", authorId),
          supabase.from("blogs").select("*").eq("author_id", authorId)
        ]);

        if (booksRes.data) books = booksRes.data;
        if (articlesRes.data) articles = articlesRes.data;
        if (blogsRes.data) blogs = blogsRes.data;
      }

      // 2. Gather all manuscript IDs
      const bookIds = books.map((b: any) => b.id);
      const articleIds = articles.map((a: any) => a.id);
      const blogIds = blogs.map((bl: any) => bl.id);
      const allIds = [...bookIds, ...articleIds, ...blogIds];

      // 3. Batch query engagement statistics with user profile expansion
      let likesData: any[] = [];
      let savesData: any[] = [];
      let commentsData: any[] = [];
      let impressionsData: any[] = [];

      if (allIds.length > 0) {
        const [likesRes, savesRes, commentsRes, impressionsRes] = await Promise.all([
          supabase.from("likes").select("*, users:user_id(name, avatar_url)").in("content_id", allIds),
          supabase.from("saves").select("*, users:user_id(name, avatar_url)").in("content_id", allIds),
          supabase.from("comments").select("*, users:user_id(name, avatar_url)").in("content_id", allIds),
          supabase.from("impressions").select("id, content_id").in("content_id", allIds)
        ]);

        if (likesRes.data) likesData = likesRes.data;
        if (savesRes.data) savesData = savesRes.data;
        if (commentsRes.data) commentsData = commentsRes.data;
        if (impressionsRes.data) impressionsData = impressionsRes.data;
      }

      const standardizedBooks = (books || []).map((b: any) => {
        const status = b.status || "Draft";
        return {
          id: b.id,
          title: b.title,
          type: "Book",
          cover_url: b.cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
          category: b.category || "Novel",
          sales_count: b.sales_count || 0,
          avg_rating: b.avg_rating || 0.0,
          href: `/book/${b.id}`,
          created_at: b.created_at,
          likes: likesData.filter((l: any) => l.content_id === b.id),
          saves: savesData.filter((s: any) => s.content_id === b.id),
          comments: commentsData.filter((c: any) => c.content_id === b.id),
          impressions_count: impressionsData.filter((i: any) => i.content_id === b.id).length,
          status,
          content: ""
        };
      });

      const standardizedArticles = (articles || []).map((a: any) => {
        const isDraft = a.content && (a.content.startsWith("[DRAFT]\n") || a.content === "[DRAFT]");
        const status = isDraft ? "Draft" : "Published";
        return {
          id: a.id,
          title: a.title,
          type: "Article",
          cover_url: a.cover_url || "https://images.unsplash.com/photo-1457369804593-50c4113ef53c?auto=format&fit=crop&q=80&w=800",
          category: a.category || "Insight",
          sales_count: 0,
          avg_rating: 0.0,
          href: `/articles/${a.id}`,
          created_at: a.created_at,
          likes: likesData.filter((l: any) => l.content_id === a.id),
          saves: savesData.filter((s: any) => s.content_id === a.id),
          comments: commentsData.filter((c: any) => c.content_id === a.id),
          impressions_count: impressionsData.filter((i: any) => i.content_id === a.id).length,
          status,
          content: a.content || ""
        };
      });

      const standardizedBlogs = (blogs || []).map((bl: any) => {
        const isDraft = bl.content && (bl.content.startsWith("[DRAFT]\n") || bl.content === "[DRAFT]");
        const status = isDraft ? "Draft" : "Published";
        return {
          id: bl.id,
          title: bl.title,
          type: "Blog",
          cover_url: bl.cover_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800",
          category: "Personal",
          sales_count: 0,
          avg_rating: 0.0,
          href: `/blogs/${bl.id}`,
          created_at: bl.created_at,
          likes: likesData.filter((l: any) => l.content_id === bl.id),
          saves: savesData.filter((s: any) => s.content_id === bl.id),
          comments: commentsData.filter((c: any) => c.content_id === bl.id),
          impressions_count: impressionsData.filter((i: any) => i.content_id === bl.id).length,
          status,
          content: bl.content || ""
        };
      });

      const merged = [...standardizedBooks, ...standardizedArticles, ...standardizedBlogs].sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setMyManuscripts(merged);

      // Fetch followers list
      const { data: followersRes } = await supabase
        .from("follows")
        .select("*, users:follower_id(name, avatar_url)")
        .eq("following_id", userId)
        .order("created_at", { ascending: false });

      if (followersRes) {
        setFollowers(followersRes);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData(user.id);
    } else if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, authLoading]);

  // Real-time followers and statistical updates subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`dashboard-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        () => fetchDashboardData(user.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => fetchDashboardData(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleBecomeCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Initialize author profile record
      const { error: authorErr } = await supabase
        .from("authors")
        .insert({
          user_id: user.id,
          bank_name: creatorForm.bankName,
          account_holder_name: creatorForm.accountName,
          bank_account_number: creatorForm.accountNumber,
          bank_ifsc_code: creatorForm.ifscCode,
          total_earnings: 0.00,
          followers_count: 0
        });

      // If it's a duplicate or already exists, we ignore or handle it smoothly.
      if (authorErr && authorErr.code !== '23505') throw authorErr;

      // 2. Update bio in users table
      if (creatorForm.bio) {
        await supabase
          .from("users")
          .update({ bio: creatorForm.bio })
          .eq("id", user.id);
      }

      // 3. Update user role in users table (this may fail if schema cache is out of sync, we catch it gracefully)
      const { error: userErr } = await supabase
        .from("users")
        .update({ role: "Author" })
        .eq("id", user.id);
        
      if (userErr) {
        console.warn("Could not update user role. Your Supabase schema cache might need reloading.", userErr);
        // We do not throw here, so the onboarding can still technically succeed.
      }

      // Update local storage token values to match session
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.role = "Author";
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      setToast({ message: "Welcome to the Partner Program!", type: "success" });
      setIsModalOpen(false);
      
      // Refresh page details
      await fetchDashboardData(user.id);

    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Failed to initialize creator profile.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-zinc-300" size={32} />
        <p className="text-sm font-medium text-zinc-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user || !dbUser) return null;

  const isCreator = dbUser.role === "Author" || dbUser.role === "Admin";
  const followersCount = reputation?.followers_count || 0;
  const avgRating = reputation?.avg_rating || 0.00;
  const booksCount = myManuscripts.length;

  return (
    <div className="bg-white min-h-screen pt-12 pb-24 font-sans text-zinc-900">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        {/* Premium Beautified Author Hero Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full rounded-3xl bg-gradient-to-br from-violet-750 via-indigo-900 to-zinc-950 text-white p-6 md:p-8 overflow-hidden shadow-2xl border border-indigo-500/20 mb-12"
        >
          {/* Blueprint background grid */}
          <div 
            className="absolute inset-0 pointer-events-none select-none opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-600 rounded-full blur-3xl opacity-20 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600 rounded-full blur-3xl opacity-15 pointer-events-none" />

          {/* Card Layout */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Author Profile Info */}
            <div className="flex items-center gap-6">
              {/* Profile Image with Glow Ring */}
              <div className="relative group shrink-0 select-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-400 to-indigo-400 rounded-full blur-md opacity-45 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
                <img 
                  src={dbUser.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} 
                  alt={dbUser.name} 
                  className="relative w-20 h-20 rounded-full object-cover border-2 border-white shadow-xl scale-[1.02]"
                />
              </div>

              {/* Text Information */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase leading-none text-white">
                    {dbUser.name}
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-200 border border-violet-500/30 px-2.5 py-0.5 rounded-full shadow-sm select-none">
                    {reputation?.reputation_level || dbUser.role}
                  </span>
                </div>
                
                <p className="text-[10px] text-zinc-300 font-mono tracking-wide select-text">
                  {dbUser.email}
                </p>

                {dbUser.bio && (
                  <p className="text-xs text-zinc-200 italic font-medium max-w-md line-clamp-2 leading-relaxed pt-1 border-l border-indigo-500/30 pl-3">
                    "{dbUser.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-row md:flex-col gap-3 self-end md:self-center shrink-0 w-full md:w-auto">
              <Link 
                href="/profile"
                className="w-full md:w-40 py-3 bg-white hover:bg-zinc-100 text-indigo-950 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all select-none shadow-lg"
              >
                View Profile
              </Link>
              <button 
                onClick={signOut}
                className="w-full md:w-40 py-3 bg-indigo-950/40 hover:bg-red-950/20 text-zinc-305 hover:text-red-400 border border-indigo-800/40 hover:border-red-900/30 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] select-none"
              >
                <LogOut size={12} /> Sign out
              </button>
            </div>

          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mt-12 space-y-16">
          <AnimatePresence mode="wait">
            {!isCreator ? (
              /* Reader -> Author Onboarding */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center max-w-xl mx-auto"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="text-zinc-400" size={24} />
                </div>
                <h2 className="text-3xl font-serif tracking-tight mb-4 text-zinc-900">Join the Partner Program</h2>
                <p className="text-zinc-500 text-base mb-10 leading-relaxed">
                  Start publishing your manuscripts, share your stories with a global audience, and earn 90% royalties on your sales directly to your bank account.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-3 bg-black hover:bg-zinc-800 text-white rounded-full font-medium text-sm transition-all"
                >
                  Apply to be a Creator
                </button>
              </motion.div>
            ) : (
              /* Creator Analytics */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard 
                    title="Followers" 
                    value={followersCount} 
                    onClick={() => setDetailModal({
                      isOpen: true,
                      type: "followers",
                      title: "Your Profile",
                      data: followers
                    })}
                  />
                  <StatCard title="Published" value={booksCount} />
                  <StatCard title="Avg Rating" value={avgRating > 0 ? avgRating : "-"} />
                  <StatCard title="Total Views" value={myManuscripts.reduce((sum, m) => sum + (m.impressions_count || 0), 0)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Publications Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Your Stories</h3>
            </div>
            
            <div className="space-y-6">
              {myManuscripts.length > 0 ? (
                myManuscripts.map((m) => (
                  <div key={`${m.type}-${m.id}`} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-zinc-100 group">
                    <div className="w-24 h-32 bg-zinc-100 rounded-md overflow-hidden shrink-0">
                      <img src={m.cover_url || "/placeholder-cover.jpg"} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between py-1 flex-grow">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{m.type}</span>
                          <span className="text-xs text-zinc-400">{m.category || "General"}</span>
                          {m.status === "Draft" && (
                            <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-250 px-2 py-0.5 rounded-full select-none">
                              Draft
                            </span>
                          )}
                        </div>
                        <Link 
                          href={m.status === "Draft" ? `/write/${m.id}` : m.href} 
                          className="text-xl font-serif tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors line-clamp-1"
                        >
                          {m.title}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-500">
                          {/* Views Count */}
                          <div className="flex items-center gap-1 bg-zinc-50 px-2.5 py-1 rounded-full cursor-default border border-zinc-100">
                            <TrendingUp size={13} className="text-zinc-400" />
                            <span className="font-medium text-zinc-600">{m.impressions_count || 0} views</span>
                          </div>

                          {/* Likes Button */}
                          <button
                            onClick={() => setDetailModal({
                              isOpen: true,
                              type: "likes",
                              title: m.title,
                              data: m.likes || []
                            })}
                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full transition-all border border-rose-100"
                          >
                            <Heart size={13} className="fill-rose-500 text-rose-500" />
                            <span className="font-semibold">{m.likes?.length || 0} likes</span>
                          </button>

                          {/* Comments Button */}
                          <button
                            onClick={() => setDetailModal({
                              isOpen: true,
                              type: "comments",
                              title: m.title,
                              data: m.comments || []
                            })}
                            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full transition-all border border-blue-100"
                          >
                            <MessageSquare size={13} className="text-blue-500" />
                            <span className="font-semibold">{m.comments?.length || 0} comments</span>
                          </button>

                          {/* Saves Button */}
                          <button
                            onClick={() => setDetailModal({
                              isOpen: true,
                              type: "saves",
                              title: m.title,
                              data: m.saves || []
                            })}
                            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full transition-all border border-amber-100"
                          >
                            <Bookmark size={13} className="fill-amber-500 text-amber-500" />
                            <span className="font-semibold">{m.saves?.length || 0} saved</span>
                          </button>

                          {m.type === "Book" && (
                            <div className="flex items-center gap-4 text-xs text-zinc-500 ml-2">
                              <span className="flex items-center gap-1"><TrendingUp size={13} /> {m.sales_count || 0} Sales</span>
                              <span className="flex items-center gap-1"><Star size={13} className="text-amber-500 fill-amber-500" /> {m.avg_rating || 0.00} Rating</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center justify-between w-full">
                        <span className="text-xs text-zinc-400">
                          {m.status === "Draft" ? "Last updated " : "Published on "}
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                        <Link 
                          href={`/write/${m.id}`} 
                          className={`text-sm flex items-center gap-1.5 transition-colors font-bold ${
                            m.status === "Draft"
                              ? "text-amber-700 hover:text-amber-850 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-sm"
                              : "text-zinc-500 hover:text-black"
                          }`}
                        >
                          {m.status === "Draft" ? "Resume Writing" : "Edit details"} <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-zinc-500 text-sm">You haven't published any stories yet.</p>
                  <Link href="/write" className="mt-4 inline-block text-sm font-medium text-black hover:underline">
                    Start writing
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h3 className="text-xl font-serif tracking-tight text-zinc-900">Creator Application</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleBecomeCreator} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Author Bio</label>
                  <textarea 
                    value={creatorForm.bio}
                    onChange={(e) => setCreatorForm({...creatorForm, bio: e.target.value})}
                    placeholder="Tell your readers about yourself..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none"
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Payout Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Bank Name</label>
                    <input 
                      type="text"
                      value={creatorForm.bankName}
                      onChange={(e) => setCreatorForm({...creatorForm, bankName: e.target.value})}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Account Holder Name</label>
                    <input 
                      type="text"
                      value={creatorForm.accountName}
                      onChange={(e) => setCreatorForm({...creatorForm, accountName: e.target.value})}
                      placeholder="Name exactly as it appears on bank account"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Account Number</label>
                      <input 
                        type="password"
                        value={creatorForm.accountNumber}
                        onChange={(e) => setCreatorForm({...creatorForm, accountNumber: e.target.value})}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">IFSC Code</label>
                      <input 
                        type="text"
                        value={creatorForm.ifscCode}
                        onChange={(e) => setCreatorForm({...creatorForm, ifscCode: e.target.value})}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 uppercase"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 size={16} /> Complete Setup</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 shadow-lg rounded-full flex items-center gap-3 ${
              toast.type === "success" 
                ? "bg-zinc-900 text-white" 
                : "bg-red-500 text-white"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engagement Detail Modal */}
      <AnimatePresence>
        {detailModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <div>
                  <h3 className="text-xl font-serif tracking-tight text-zinc-900 capitalize">
                    {detailModal.type}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {detailModal.type === "followers" 
                      ? "Readers and writers following your work" 
                      : `On "${detailModal.title}"`}
                  </p>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 hover:bg-zinc-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {detailModal.data.length > 0 ? (
                  detailModal.data.map((item: any) => {
                    const userName = item.users?.name || "Anonymous Reader";
                    const avatarUrl = item.users?.avatar_url;
                    const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-zinc-50 last:border-b-0 last:pb-0">
                        <img
                          src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                          alt={userName}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-100 shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-sm font-semibold text-zinc-900 truncate">{userName}</h4>
                            <span className="text-[10px] text-zinc-400 shrink-0">{dateStr}</span>
                          </div>
                          
                          {detailModal.type === "comments" && (
                            <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100/50 break-words font-medium">
                              {item.comment_text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-zinc-400 text-sm">No engagement activity recorded yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, onClick }: { title: string, value: string | number, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col py-4 border-l-2 border-zinc-100 pl-6 transition-all ${
        onClick 
          ? "cursor-pointer hover:border-violet-505 hover:bg-zinc-50/30 hover:pl-8 group relative" 
          : ""
      }`}
    >
      <span className={`text-sm font-medium text-zinc-500 mb-1 transition-colors ${onClick ? "group-hover:text-violet-600" : ""}`}>{title}</span>
      <span className="text-3xl font-serif tracking-tight text-zinc-900">{value}</span>
      {onClick && (
        <span className="absolute bottom-1 right-2 text-[8px] font-black uppercase tracking-widest text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
          View List
        </span>
      )}
    </div>
  );
}
