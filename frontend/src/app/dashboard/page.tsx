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
  CheckCircle2
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatorForm, setCreatorForm] = useState({
    bio: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: ""
  });

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

      const { data: books } = await supabase.from("books").select("*").eq("author_id", userId);
      const { data: articles } = await supabase.from("articles").select("*").eq("author_id", userId);
      const { data: blogs } = await supabase.from("blogs").select("*").eq("author_id", userId);

      const standardizedBooks = (books || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        type: "Book",
        cover_url: b.cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
        category: b.category || "Novel",
        sales_count: b.sales_count || 0,
        avg_rating: b.avg_rating || 0.0,
        href: `/book/${b.id}`,
        created_at: b.created_at
      }));

      const standardizedArticles = (articles || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        type: "Article",
        cover_url: a.cover_url || "https://images.unsplash.com/photo-1457369804593-50c4113ef53c?auto=format&fit=crop&q=80&w=800",
        category: a.category || "Insight",
        sales_count: 0,
        avg_rating: 0.0,
        href: `/articles/${a.id}`,
        created_at: a.created_at
      }));

      const standardizedBlogs = (blogs || []).map((bl: any) => ({
        id: bl.id,
        title: bl.title,
        type: "Blog",
        cover_url: bl.cover_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800",
        category: "Personal",
        sales_count: 0,
        avg_rating: 0.0,
        href: `/blogs/${bl.id}`,
        created_at: bl.created_at
      }));

      const merged = [...standardizedBooks, ...standardizedArticles, ...standardizedBlogs].sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setMyManuscripts(merged);

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
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-10 border-b border-zinc-100">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-zinc-900 mb-2">Dashboard</h1>
            <p className="text-zinc-500 text-sm">
              Manage your publications, view analytics, and track your audience.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/profile"
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-black hover:bg-zinc-50 rounded-full transition-colors"
            >
              View Profile
            </Link>
            <button 
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

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
                  <StatCard title="Followers" value={followersCount} />
                  <StatCard title="Published" value={booksCount} />
                  <StatCard title="Avg Rating" value={avgRating > 0 ? avgRating : "-"} />
                  <StatCard title="Total Views" value={"-"} />
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
                        </div>
                        <Link href={m.href} className="text-xl font-serif tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors line-clamp-1">
                          {m.title}
                        </Link>
                        {m.type === "Book" && (
                          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                            <span className="flex items-center gap-1.5"><TrendingUp size={14} /> {m.sales_count || 0} Sales</span>
                            <span className="flex items-center gap-1.5"><Star size={14} /> {m.avg_rating || 0.00} Rating</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Published on {new Date(m.created_at).toLocaleDateString()}</span>
                        <Link href={`/write/${m.id}`} className="text-sm text-zinc-500 hover:text-black flex items-center gap-1 transition-colors">
                          Edit details <ChevronRight size={14} />
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
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="flex flex-col py-4 border-l-2 border-zinc-100 pl-6">
      <span className="text-sm font-medium text-zinc-500 mb-1">{title}</span>
      <span className="text-3xl font-serif tracking-tight text-zinc-900">{value}</span>
    </div>
  );
}
