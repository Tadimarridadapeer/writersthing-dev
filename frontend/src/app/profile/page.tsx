"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
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
  Feather
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("Library");
  const [stats, setStats] = useState({ library: 0, bookmarks: 0, earnings: 0, followers: 0 });
  const [purchasedBooks, setPurchasedBooks] = useState<any[]>([]);
  const [myManuscripts, setMyManuscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login?redirect=/profile");
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        // 1. Fetch Stats, Library and Manuscripts
        const [libRes, authorRes, manuscriptRes] = await Promise.all([
          supabase.from("library").select("*, books(*)").eq("user_id", parsedUser.id),
          supabase.from("authors").select("*").eq("user_id", parsedUser.id).maybeSingle(),
          supabase.from("books").select("*").eq("author_id", parsedUser.id)
        ]);

        if (libRes.data) setPurchasedBooks(libRes.data.map(l => l.books));
        if (manuscriptRes.data) setMyManuscripts(manuscriptRes.data);
        
        setStats({
          library: libRes.data?.length || 0,
          bookmarks: 0,
          earnings: authorRes.data?.total_earnings || 0,
          followers: authorRes.data?.followers_count || 0
        });

      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Initializing Hub...</div>;
  if (!user) return null;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <main className="pt-40 pb-40">
        <div className="unified-axis">
          {/* Profile Header */}
          <header className="flex flex-col md:flex-row items-center gap-12 mb-24 pb-24 border-b border-zinc-100">
            <div className="relative group">
              <div className="w-40 h-40 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center text-5xl font-black text-zinc-200 overflow-hidden shadow-2xl">
                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <button className="absolute bottom-2 right-2 p-3 bg-black text-white rounded-full shadow-xl hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-5xl font-heading font-black uppercase tracking-tighter">{user.name}</h1>
                {user.role === "Admin" && (
                  <Link href="/admin" className="px-4 py-1 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 w-fit mx-auto md:mx-0">
                    <ShieldCheck size={10} /> Admin Access
                  </Link>
                )}
              </div>
              <p className="text-xl text-zinc-500 font-medium italic mb-8 max-w-xl">
                "{user.bio || "Crafting stories, exploring digital horizons."}"
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Link href="/dashboard/settings" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                  <Settings size={14} /> Edit Profile
                </Link>
                <Link href="/write" className="px-8 py-3 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
                  <Feather size={14} /> Publish Work
                </Link>
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
                
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mt-8 mb-2 px-6">Creator Hub</p>
                <ProfileNavBtn icon={<UploadCloud size={18} />} label="My Manuscripts" active={activeSection === "Manuscripts"} onClick={() => setActiveSection("Manuscripts")} />
                <ProfileNavBtn icon={<TrendingUp size={18} />} label="Sales Analytics" active={activeSection === "Analytics"} onClick={() => setActiveSection("Analytics")} />
                <ProfileNavBtn icon={<DollarSign size={18} />} label="Payouts" active={activeSection === "Payouts"} onClick={() => setActiveSection("Payouts")} />
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileNavBtn({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between px-6 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? "bg-black text-white shadow-xl translate-x-2" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
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

