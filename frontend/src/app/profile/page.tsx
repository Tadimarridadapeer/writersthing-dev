"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Book, 
  Bookmark, 
  History, 
  Settings, 
  Camera,
  ArrowRight,
  ChevronRight,
  Heart,
  UploadCloud,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Feather,
  Loader2,
  LogOut,
  Sparkles
} from "lucide-react";
import { uploadAvatar } from "@/lib/avatar";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("Library");
  const [stats, setStats] = useState({ library: 0, bookmarks: 0, earnings: 0, followers: 0, following: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [reputation, setReputation] = useState<any>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [socialList, setSocialList] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setToast(null);

    try {
      console.log("Profile Upload - Selected file:", file.name, file.size);
      const publicUrl = await uploadAvatar(file, user.id);
      
      if (publicUrl) {
        // Sync local page state
        const updatedUser = { ...user, avatar_url: publicUrl };
        setUser(updatedUser);
        
        // Sync localStorage fallback
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setToast({ message: "Profile picture updated successfully!", type: "success" });
      }
    } catch (err: any) {
      console.error("Profile Upload - Error:", err);
      setToast({ message: err.message || "Failed to upload image.", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Signout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };
  const [purchasedBooks, setPurchasedBooks] = useState<any[]>([]);
  const [myManuscripts, setMyManuscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login?redirect=/profile");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    try {
      // 1. Fetch Stats, Library and Manuscripts, and dynamic reputation view details
      const [libRes, authorRes, manuscriptRes, repRes] = await Promise.all([
        supabase.from("library").select("*, books(*)").eq("user_id", parsedUser.id),
        supabase.from("authors").select("*").eq("user_id", parsedUser.id).maybeSingle(),
        supabase.from("books").select("*").eq("author_id", parsedUser.id),
        supabase.from("author_reputation").select("*").eq("user_id", parsedUser.id).maybeSingle()
      ]);

      if (libRes.data) setPurchasedBooks(libRes.data.map(l => l.books));
      if (manuscriptRes.data) setMyManuscripts(manuscriptRes.data);
      
      if (repRes.data) {
        setReputation(repRes.data);
        setStats({
          library: libRes.data?.length || 0,
          bookmarks: 0,
          earnings: authorRes.data?.total_earnings || 0,
          followers: repRes.data.followers_count || 0,
          following: repRes.data.following_count || 0
        });
      } else {
        setStats({
          library: libRes.data?.length || 0,
          bookmarks: 0,
          earnings: authorRes.data?.total_earnings || 0,
          followers: authorRes.data?.followers_count || 0,
          following: 0
        });
      }

    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [router]);

  const fetchFollowers = async () => {
    setSocialLoading(true);
    setShowFollowersModal(true);
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id, follower:follower_id(id, name, avatar_url)")
        .eq("following_id", user.id);
      if (data) {
        setSocialList(data.map((f: any) => f.follower));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSocialLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setSocialLoading(true);
    setShowFollowingModal(true);
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id, following:following_id(id, name, avatar_url)")
        .eq("follower_id", user.id);
      if (data) {
        setSocialList(data.map((f: any) => f.following));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSocialUnfollow = async (targetId: string) => {
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
      
      if (!error) {
        setSocialList(prev => prev.filter(item => item.id !== targetId));
        // Refresh dynamic reputation data
        const { data: repData } = await supabase
          .from("author_reputation")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (repData) {
          setReputation(repData);
          setStats(prev => ({
            ...prev,
            followers: repData.followers_count,
            following: repData.following_count
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Initializing Hub...</div>;
  if (!user) return null;

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-8 pb-20">
        <div className="unified-axis">
          {/* Profile Header */}
          <header className="flex flex-col md:flex-row items-center gap-12 mb-24 pb-24 border-b border-zinc-100">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Click to upload profile photo">
              <div className="w-40 h-40 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center text-5xl font-black text-zinc-200 overflow-hidden shadow-2xl relative">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin text-white mb-2" size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Uploading...</span>
                  </div>
                )}
              </div>
              <button 
                type="button"
                className="absolute bottom-2 right-2 p-3 bg-black text-white rounded-full shadow-xl hover:scale-110 transition-all z-10"
                disabled={uploading}
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange} 
                disabled={uploading}
              />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 select-none">
                <h1 className="text-5xl font-heading font-black uppercase tracking-tighter">{user.name}</h1>
                
                {reputation && (
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full w-fit mx-auto md:mx-0">
                    <Sparkles size={11} className="text-zinc-600 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      {reputation.reputation_level} ({reputation.reputation_score} pts)
                    </span>
                  </div>
                )}

                {user.role === "Admin" && (
                  <Link href="/admin" className="px-4 py-1.5 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 w-fit mx-auto md:mx-0 hover:scale-105 transition-all">
                    <ShieldCheck size={10} /> Admin Access
                  </Link>
                )}
              </div>
              <p className="text-xl text-zinc-500 font-medium italic mb-6 max-w-xl">
                "{user.bio || "Crafting stories, exploring digital horizons."}"
              </p>
              
              {/* Clickable Social Followers/Following Row */}
              <div className="flex justify-center md:justify-start gap-8 mt-6 mb-8 text-sm select-none">
                <button 
                  onClick={fetchFollowers} 
                  className="font-medium hover:text-black transition-colors flex items-center gap-2 group cursor-pointer border-0 bg-transparent p-0"
                >
                  <span className="font-heading font-black text-xl text-black group-hover:scale-105 transition-transform">{stats.followers}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Followers</span>
                </button>
                <div className="w-px h-6 bg-zinc-100 my-auto" />
                <button 
                  onClick={fetchFollowing} 
                  className="font-medium hover:text-black transition-colors flex items-center gap-2 group cursor-pointer border-0 bg-transparent p-0"
                >
                  <span className="font-heading font-black text-xl text-black group-hover:scale-105 transition-transform">{stats.following}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Following</span>
                </button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Link href="/dashboard/settings" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                  <Settings size={14} /> Edit Profile
                </Link>
                <Link href="/write" className="px-8 py-3 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
                  <Feather size={14} /> Publish Work
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-8 py-3 border border-red-500 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 border-l border-zinc-100 pl-12 hidden lg:grid">
              <div className="text-center">
                <p className="text-5xl font-heading font-black tracking-tighter">{stats.library}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Library</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-heading font-black tracking-tighter">₹{stats.earnings.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Earnings</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Unified Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <nav className="flex flex-col gap-2 sticky top-40">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-2 px-6">Reader Tools</p>
                <ProfileNavBtn icon={<Book size={18} />} label="My Library" active={activeSection === "Library"} onClick={() => setActiveSection("Library")} />
                <ProfileNavBtn icon={<Bookmark size={18} />} label="Bookmarks" active={activeSection === "Bookmarks"} onClick={() => setActiveSection("Bookmarks")} />
                <ProfileNavBtn icon={<Heart size={18} />} label="Liked Content" active={activeSection === "Likes"} onClick={() => setActiveSection("Likes")} />
                
                {(user.role === "Author" || user.role === "Admin") && (
                  <>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mt-8 mb-2 px-6">Creator Hub</p>
                    <ProfileNavBtn icon={<UploadCloud size={18} />} label="My Manuscripts" active={activeSection === "Manuscripts"} onClick={() => setActiveSection("Manuscripts")} />
                    <ProfileNavBtn icon={<TrendingUp size={18} />} label="Sales Analytics" active={activeSection === "Analytics"} onClick={() => setActiveSection("Analytics")} />
                    <ProfileNavBtn icon={<DollarSign size={18} />} label="Payouts" active={activeSection === "Payouts"} onClick={() => setActiveSection("Payouts")} />
                    <ProfileNavBtn icon={<ShieldCheck size={18} />} label="Writersthing Pro" active={activeSection === "Pro"} onClick={() => setActiveSection("Pro")} />
                  </>
                )}
              </nav>
            </aside>

            {/* Unified Content Area */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeSection === "Library" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {purchasedBooks.map((book) => (
                        <div key={book.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                          <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden">
                            <img src={book.cover_url || "/placeholder-cover.jpg"} alt={book.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none">{book.title}</h3>
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {book.users?.name || "Unknown"}</p>
                            </div>
                            <Link href={`/read/pdf?id=${book.id}&title=${encodeURIComponent(book.title)}`} className="block text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                              Read Now
                            </Link>
                          </div>
                        </div>
                      ))}
                      <Link href="/marketplace" className="border-2 border-dashed border-zinc-200 rounded-sm flex flex-col items-center justify-center p-12 text-zinc-300 hover:border-black hover:text-black transition-all gap-4">
                        <Book size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Explore Marketplace</span>
                      </Link>
                    </div>
                  )}

                  {activeSection === "Manuscripts" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest">Your Published Works</h2>
                        <Link href="/write" className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-1">+ New Manuscript</Link>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {myManuscripts.length > 0 ? myManuscripts.map((m) => (
                          <div key={m.id} className="p-8 bg-zinc-50 border border-zinc-100 rounded-sm flex items-center justify-between group hover:border-black transition-all">
                            <div className="flex items-center gap-8">
                               <div className="w-12 h-16 bg-zinc-200 rounded-sm overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                  <img src={m.cover_url || "/placeholder-cover.jpg"} alt={m.title} className="w-full h-full object-cover" />
                               </div>
                               <div>
                                  <h3 className="font-heading font-bold text-xl">{m.title}</h3>
                                  <div className="flex items-center gap-4 mt-2">
                                     <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.status === 'Published' ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>{m.status}</span>
                                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{m.sales_count} Sales • ₹{m.price}</p>
                                  </div>
                               </div>
                            </div>
                            <Link href={`/book/${m.id}`} className="p-4 bg-white border border-zinc-100 rounded-sm hover:bg-black hover:text-white transition-all">
                              <ChevronRight size={18} />
                            </Link>
                          </div>
                        )) : (
                          <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed">
                            <p className="text-zinc-400 font-medium italic mb-6">You haven't shared any stories yet.</p>
                            <Link href="/write" className="px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm">Unshackle Your Narrative</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === "Analytics" && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <AnalyticsCard title="Monthly Sales" value={myManuscripts.reduce((acc, m) => acc + (m.sales_count || 0), 0)} unit="Units" />
                        <AnalyticsCard title="Gross Revenue" value={`₹${stats.earnings.toLocaleString()}`} unit="INR" />
                        <AnalyticsCard title="Avg. Retention" value="78%" unit="Rate" />
                      </div>

                      <div className="bg-zinc-50 border border-zinc-100 p-12 rounded-sm text-center">
                         <TrendingUp size={48} className="mx-auto text-zinc-200 mb-6" />
                         <h3 className="text-2xl font-heading font-black uppercase tracking-tight mb-4">Engagement Pulse</h3>
                         <p className="text-zinc-400 italic font-medium mb-8 max-w-sm mx-auto">Detailed audience breakdown and engagement metrics are processed every 24 hours.</p>
                         <div className="h-40 w-full bg-zinc-100/50 rounded-sm flex items-end gap-2 p-4">
                            {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
                              <div key={i} className="flex-grow bg-black/5 hover:bg-black transition-colors" style={{ height: `${h}%` }} />
                            ))}
                         </div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mt-4">Last 10 Days Activity</p>
                      </div>
                    </div>
                  )}

                  {activeSection === "Payouts" && (
                    <div className="space-y-12">
                      <div className="p-12 bg-black text-white rounded-sm shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Available for Withdrawal</p>
                          <p className="text-6xl font-heading font-black tracking-tighter">₹{stats.earnings.toLocaleString()}</p>
                        </div>
                        <button className="px-12 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Request Payout</button>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Payout History</h3>
                        <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-sm text-center">
                          <p className="text-zinc-300 italic font-medium">No previous payouts processed.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "Pro" && (
                    <div className="space-y-12">
                      {/* Eligibility Progress Card */}
                      <div className="p-12 border border-zinc-100 bg-zinc-50/50 rounded-sm relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100/50 rounded-full blur-[40px] -z-10" />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-zinc-100">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">Tier Eligibility Status</p>
                            <h3 className="text-3xl font-heading font-black uppercase tracking-tight">
                              {stats.followers >= 5 && (reputation?.avg_rating || 0) >= 4.0 && myManuscripts.length >= 2 && (reputation?.reputation_score || 0) >= 100 ? (
                                <span className="text-black flex items-center gap-2">
                                  <ShieldCheck className="text-black animate-pulse" size={24} /> Writersthing Pro Eligible
                                </span>
                              ) : (
                                "Pro Membership In Progress"
                              )}
                            </h3>
                          </div>
                          <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                            stats.followers >= 5 && (reputation?.avg_rating || 0) >= 4.0 && myManuscripts.length >= 2 && (reputation?.reputation_score || 0) >= 100
                              ? "bg-black text-white animate-bounce"
                              : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                          }`}>
                            {stats.followers >= 5 && (reputation?.avg_rating || 0) >= 4.0 && myManuscripts.length >= 2 && (reputation?.reputation_score || 0) >= 100
                              ? "Unlocked"
                              : "Locked"
                            }
                          </span>
                        </div>

                        {/* Metrics Progress bar */}
                        <div className="mb-10">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                            <span>Criteria Complete</span>
                            <span>
                              {Math.round(
                                (([stats.followers >= 5, (reputation?.avg_rating || 0) >= 4.0, myManuscripts.length >= 2, (reputation?.reputation_score || 0) >= 100].filter(Boolean).length) / 4) * 100
                              )}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-200/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all duration-1000" 
                              style={{ 
                                width: `${(([stats.followers >= 5, (reputation?.avg_rating || 0) >= 4.0, myManuscripts.length >= 2, (reputation?.reputation_score || 0) >= 100].filter(Boolean).length) / 4) * 100}%` 
                              }} 
                            />
                          </div>
                        </div>

                        {/* Itemized checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <MetricCheckitem label="5+ Active Followers" met={stats.followers >= 5} progress={`${stats.followers} / 5`} />
                          <MetricCheckitem label="4.0+ Average Rating" met={(reputation?.avg_rating || 0) >= 4.0} progress={`${reputation?.avg_rating || 0} / 4.0`} />
                          <MetricCheckitem label="2+ Shared Manuscripts" met={myManuscripts.length >= 2} progress={`${myManuscripts.length} / 2`} />
                          <MetricCheckitem label="100+ Reputation Score" met={(reputation?.reputation_score || 0) >= 100} progress={`${reputation?.reputation_score || 0} / 100`} />
                        </div>
                      </div>

                      {/* Premium Creator Benefits list */}
                      <div className="space-y-6 select-none">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Exclusive Creator Benefits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <BenefitItem title="90% Higher Royalty Share" desc="Keep a premium 90% of all ₹99 purchases. Direct author payouts with minimum administrative commissions." />
                          <BenefitItem title="Verified Creator Status" desc="Earn the coveted solid black verified shield on your profile and marketplace manuscripts." />
                          <BenefitItem title="Algorithmic Marketplace Boost" desc="Get featured priority visibility in the home page archives and active search filters." />
                          <BenefitItem title="Advanced Creator Analytics" desc="Access deep audience metrics, demographic distribution, and retention maps." />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Social Follows Modal Overlay */}
      {(showFollowersModal || showFollowingModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-zinc-100 p-8 rounded-sm shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-heading font-black text-xl uppercase tracking-tight">
                {showFollowersModal ? "Followers" : "Following"}
              </h3>
              <button 
                onClick={() => {
                  setShowFollowersModal(false);
                  setShowFollowingModal(false);
                  setSocialList([]);
                }}
                className="text-[10px] font-black uppercase tracking-widest border border-zinc-200 px-3 py-1.5 hover:border-black transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-6 pr-2">
              {socialLoading ? (
                <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-zinc-300 animate-pulse">
                  Querying database...
                </div>
              ) : socialList.length > 0 ? (
                socialList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/50 transition-all rounded-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-black">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          (item.name || "A").charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-black uppercase tracking-widest text-zinc-950">{item.name || "Anonymous"}</span>
                      </div>
                    </div>

                    {showFollowingModal && (
                      <button 
                        onClick={() => handleSocialUnfollow(item.id)}
                        className="px-4 py-2 border border-red-500 hover:bg-red-500 hover:text-white text-red-500 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Unfollow
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-400 italic text-sm border-2 border-dashed border-zinc-100 rounded-sm">
                  No active users to show.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-10 right-10 z-[200] px-8 py-5 shadow-2xl border flex items-center gap-4 ${
              toast.type === "success" 
                ? "bg-black border-zinc-800 text-white" 
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileNavBtn({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between px-6 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer ${active ? "bg-black text-white shadow-xl translate-x-2" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        {label}
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}

function AnalyticsCard({ title, value, unit }: any) {
  return (
    <div className="p-8 bg-white border border-zinc-100 rounded-sm shadow-sm group hover:border-black transition-all">
      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-heading font-black tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</p>
        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{unit}</p>
      </div>
    </div>
  );
}

function MetricCheckitem({ label, met, progress }: { label: string; met: boolean; progress: string }) {
  return (
    <div className="p-4 bg-white border border-zinc-100 rounded-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-bold ${met ? "bg-black border-black text-white" : "border-zinc-200 text-transparent"}`}>
          ✓
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">{label}</span>
      </div>
      <span className="text-[9px] font-mono text-zinc-400 font-bold">{progress}</span>
    </div>
  );
}

function BenefitItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-8 bg-zinc-50/50 border border-zinc-100 rounded-sm flex items-start gap-4">
      <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-xs font-black shrink-0">◆</div>
      <div>
        <h5 className="text-sm font-heading font-black uppercase tracking-tight mb-2">{title}</h5>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">{desc}</p>
      </div>
    </div>
  );
}
