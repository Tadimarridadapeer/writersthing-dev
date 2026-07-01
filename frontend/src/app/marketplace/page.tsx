"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bookmark, MoreHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

function MarketplaceContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get("type");
  const initialFeedType = typeParam === "Book" ? "books" : 
                          typeParam === "Article" ? "articles" : 
                          typeParam === "Blog" ? "blogs" : "all";
                          
  const [books, setBooks] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<{ interests: string[], contentTypes: string[], goals: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"all" | "books" | "articles" | "blogs">(initialFeedType);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Keep feedType in sync with URL changes
  useEffect(() => {
    if (typeParam === "Book") setFeedType("books");
    else if (typeParam === "Article") setFeedType("articles");
    else if (typeParam === "Blog") setFeedType("blogs");
    else setFeedType("all");
  }, [typeParam]);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        if (user) {
          const prefRes = await fetch("/api/user/preferences");
          if (prefRes.ok) {
            const prefData = await prefRes.json();
            setPreferences(prefData);
          }
        }

        const booksRes = await fetch("/api/books");
        const booksData = await booksRes.json();
        setBooks(Array.isArray(booksData) ? booksData : []);

        const articlesRes = await fetch("/api/articles?type=Article");
        const articlesData = await articlesRes.json();
        setArticles(Array.isArray(articlesData) ? articlesData : []);

        const blogsRes = await fetch("/api/articles?type=Blog");
        const blogsData = await blogsRes.json();
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
      } catch (err) {
        console.error("Marketplace fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const mergedFeed = [
    ...books.map(b => ({ id: b.id, title: b.title, type: "Book", description: b.description || "An immersive book exploring captivating themes and rich narratives.", category: b.category || "Novel", cover: b.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800", author: b.authors?.users?.name || b.authors?.name || b.author?.name || (user && user.id === b.authors?.user_id ? (user.name || "Unknown") : "Unknown") || "Unknown", url: `/book/${b.id}`, date: b.created_at, price: b.price || 99 })),
    ...articles.map(a => ({ id: a.id, title: a.title, type: "Article", description: a.description || "A deep dive into professional insights and industry knowledge.", category: a.category || "Insight", cover: a.cover_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800", author: a.authors?.name || "Unknown", url: `/articles/${a.id}`, date: a.created_at, price: a.price || 0 })),
    ...blogs.map(bl => ({ id: bl.id, title: bl.title, type: "Blog", description: bl.description || "A personal take and casual exploration of interesting concepts.", category: "Personal", cover: bl.cover_url || "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800", author: bl.authors?.name || "Unknown", url: `/blogs/${bl.id}`, date: bl.created_at, price: bl.price || 0 }))
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredFeed = mergedFeed.filter(item => {
    if (feedType === "all") return true;
    if (feedType === "books") return item.type === "Book";
    if (feedType === "articles") return item.type === "Article";
    if (feedType === "blogs") return item.type === "Blog";
    return true;
  });

  const staffPicks = mergedFeed.slice(0, 4);

  return (
    <div className="flex bg-white">
      <div className="unified-axis max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-24 pt-6 md:pt-12 pb-8 md:pb-12">
        
        {/* MAIN FEED */}
        <div className="lg:col-span-8">
          <header className="mb-10 mt-6">
            {preferences?.interests && preferences.interests.length > 0 ? (
              <div className="mb-8">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Personalized for you</span>
                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight uppercase">Because you like <span className="text-primary italic">{preferences.interests[0]}</span></h1>
              </div>
            ) : (
              <h1 className="text-4xl font-heading font-black tracking-tight uppercase mb-8">Marketplace</h1>
            )}
            
            {/* Tabs and Actions */}
            <div className="flex justify-between items-end border-b border-zinc-150 relative">
              <div className="flex gap-8">
                {(["all", "books", "articles", "blogs"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFeedType(t)}
                    className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-all ${
                      feedType === t ? "text-black border-b-2 border-black" : "text-zinc-400 hover:text-black"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
            </div>
          </header>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 italic">No content available at the moment.</div>
          ) : (
            <div className="flex flex-col">
              {filteredFeed.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.url} className="group py-8 border-b border-zinc-100 flex gap-6 md:gap-12 items-center">
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-black uppercase text-zinc-500 border border-zinc-200 shadow-sm">
                        {item.author ? item.author[0] : "?"}
                      </div>
                      <span className="text-sm font-semibold text-zinc-800">{item.author || "Unknown"}</span>
                      <span className="text-zinc-400 text-xs">in</span>
                      <span className="text-sm font-semibold text-zinc-800">{item.category}</span>
                    </div>

                    <h2 className="text-xl md:text-[22px] font-bold font-heading tracking-tight mb-2 group-hover:text-zinc-600 transition-colors line-clamp-2 leading-tight">
                      {item.title}
                    </h2>
                    
                    <p className="text-sm md:text-base text-zinc-500 font-serif leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-3">
                        <span>{new Date(item.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="bg-zinc-100 px-2 py-1 rounded-sm text-[9px] font-black tracking-widest uppercase text-zinc-600">{item.type}</span>
                        {item.type === "Book" && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="font-bold text-black border-b border-black">₹{item.price}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            alert("Saved to reading list!");
                          }}
                          className="hover:text-black transition-colors"
                        >
                          <Bookmark size={18} strokeWidth={1.5} />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenu(activeMenu === `${item.type}-${item.id}` ? null : `${item.type}-${item.id}`);
                            }}
                            className="hover:text-black transition-colors"
                          >
                            <MoreHorizontal size={18} strokeWidth={1.5} />
                          </button>
                          
                          {activeMenu === `${item.type}-${item.id}` && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-xl rounded-sm py-2 z-50 text-sm font-medium text-zinc-600">
                              <button 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  const url = window.location.origin + '/' + (item.type.toLowerCase() === 'book' ? 'book' : item.type.toLowerCase() + 's') + '/' + item.id;
                                  navigator.clipboard.writeText(url);
                                  setToast({ message: "Link copied to clipboard!", type: "success" }); 
                                  setActiveMenu(null); 
                                }} 
                                className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors"
                              >
                                Share story...
                              </button>
                              <div className="h-px bg-zinc-100 my-1" />
                              <button 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  setToast({ message: `Following ${item.author}`, type: "success" }); 
                                  setActiveMenu(null); 
                                }} 
                                className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors"
                              >
                                Follow author
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-28 md:w-32 lg:w-40 shrink-0 aspect-[16/10] bg-zinc-100 overflow-hidden shadow-sm">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover grayscale hover:grayscale-0 group-hover:grayscale-0 transition-all duration-700 hover:scale-105 group-hover:scale-105" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 hidden lg:block pt-12 pl-12 border-l border-zinc-100 relative">
          <div className="sticky top-12">
            
            {/* Staff Picks */}
            <div className="mb-12">
              <h3 className="font-black text-sm mb-6 text-black tracking-tight">Staff Picks</h3>
              {staffPicks.map(pick => (
                <Link key={`pick-${pick.id}`} href={pick.url} className="block mb-6 group">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-black uppercase text-zinc-500 border border-zinc-200">
                      {pick.author ? pick.author[0] : "?"}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-700 truncate max-w-[120px]">{pick.author || "Unknown"}</span>
                  </div>
                  <h4 className="font-bold font-heading text-[15px] leading-snug group-hover:text-zinc-600 transition-colors line-clamp-2">{pick.title}</h4>
                </Link>
              ))}
              <Link href="#" className="text-sm text-green-700 hover:text-green-800 font-medium">See the full list</Link>
            </div>

            {/* Recommended Topics */}
            <div className="mb-12">
              <h3 className="font-black text-sm mb-6 tracking-tight">Recommended topics</h3>
              <div className="flex flex-wrap gap-2.5">
                {["Fiction", "Self Improvement", "Programming", "Politics", "Technology", "History", "Relationships", "Data Science"].map(topic => (
                  <button key={topic} className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm font-medium rounded-full text-zinc-800">
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Blogs vs Articles Section (Based on Image) */}
            <div className="p-6 bg-[#eaeaf7] border border-[#d6d6ed] rounded-lg shadow-inner">
              <h3 className="font-heading font-black text-xl text-[#0b16a2] mb-6 text-center leading-tight">
                <span className="text-[#3245db] italic">Blogs</span> Vs. <span className="text-[#3245db]">Articles</span>:<br />What Are the Differences?
              </h3>
              
              <div className="flex flex-col gap-4 text-[11px] leading-relaxed">
                <div className="bg-[#b9c8f0] border-2 border-black rounded-sm p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-black uppercase tracking-widest text-center border-b-2 border-black pb-2 mb-3">Blogs ✍️</h4>
                  <ul className="list-disc pl-4 space-y-2 text-black">
                    <li>Casual, <strong>conversational tone</strong></li>
                    <li><strong>Flexible</strong> structure</li>
                    <li><strong>Shares opinions</strong>, tips, or updates</li>
                    <li>Short to medium length <strong>(300-1,200 words)</strong></li>
                    <li>Few or <strong>no citations</strong></li>
                    <li>Published on <strong>sites</strong>, personal sites, or informal media</li>
                    <li>Covers topics at a <strong>surface or moderate depth</strong></li>
                    <li>Aimed at <strong>casual or general audiences</strong></li>
                    <li>Often optimized for <strong>SEO and traffic</strong></li>
                    <li><strong>Credibility varies</strong> by author/site</li>
                  </ul>
                </div>

                <div className="bg-[#b9b8df] border-2 border-black rounded-sm p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-black uppercase tracking-widest text-center border-b-2 border-black pb-2 mb-3">Articles 🎓</h4>
                  <ul className="list-disc pl-4 space-y-2 text-black">
                    <li><strong>Formal</strong>, objective tone</li>
                    <li>Follows a <strong>strict structure</strong></li>
                    <li><strong>Presents</strong> research, analysis, or evidence-based insights</li>
                    <li>Longer and in-depth <strong>(1,500-5,000+ words)</strong></li>
                    <li>Includes <strong>proper citations and references</strong></li>
                    <li>Published in <strong>journals, news outlets</strong>, or official documents</li>
                    <li>Deeply explores and <strong>explains complex topics</strong></li>
                    <li>Targeted at <strong>serious readers</strong></li>
                    <li>Focuses more on <strong>quality, accuracy, and credibility</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-12 pt-6 border-t border-zinc-200 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 font-medium">
              <Link href="#" className="hover:text-zinc-800 transition-colors">Help</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Status</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">About</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Careers</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Blog</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Text to speech</Link>
              <Link href="#" className="hover:text-zinc-800 transition-colors">Teams</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[400] flex items-center gap-3 bg-white px-6 py-4 border border-zinc-200 shadow-2xl rounded-full"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
