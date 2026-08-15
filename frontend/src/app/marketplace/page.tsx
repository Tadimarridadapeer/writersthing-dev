"use client";

import Link from "next/link";
import { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bookmark, MoreHorizontal, Search, X, ShoppingBag, Filter, ChevronDown, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RecommendationsPayload } from "@/types/recommendations";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ContinueReadingSection } from "@/components/ContinueReadingSection";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCart } from "@/hooks/useCart";
import { useFoundingWriters } from "@/context/FoundingWritersContext";
import HireWriterModal from "@/components/HireWriterModal";

function MarketplaceContent() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { founderMap } = useFoundingWriters();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get("type");
  const initialFeedType = typeParam === "Book" ? "books" : 
                          typeParam === "Story" ? "stories" : 
                          typeParam === "Blog" ? "blogs" : "all";
                          
  const [feed, setFeed] = useState<any[]>([]);
  const [fallbackFeed, setFallbackFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [recommendations, setRecommendations] = useState<RecommendationsPayload | null>(null);
  const [preferences, setPreferences] = useState<{ interests: string[], contentTypes: string[], goals: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"all" | "books" | "stories" | "blogs">(initialFeedType);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedWriterForHire, setSelectedWriterForHire] = useState<{ id: string, name: string } | null>(null);
  
  const AVAILABLE_CATEGORIES = [
    "Sci-Fi", "Fantasy", 
    "Mystery", "Romance", "Technology", "Business", 
    "Education", "Self Improvement", "Poetry", "History", "Others"
  ];
  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (typeParam === "Book") setFeedType("books");
    else if (typeParam === "Story") setFeedType("stories");
    else if (typeParam === "Blog") setFeedType("blogs");
    else setFeedType("all");
  }, [typeParam]);

  const fetchPaginatedData = useCallback(async (
    currentPage: number, 
    currentType: "all" | "books" | "stories" | "blogs", 
    currentSearch: string, 
    currentCategories: string[],
    isLoadMore = false
  ) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      if (currentSearch.trim() || currentType !== "all" || languageFilter !== "all" || currentCategories.length > 0) {
        // Fetch search/category specific data
        let endpoints: string[] = [];
        let params = `?page=${currentPage}&limit=20&search=${encodeURIComponent(currentSearch.trim())}`;
        if (languageFilter !== "all") params += `&lang=${languageFilter}`;
        if (currentCategories.length > 0) params += `&category=${encodeURIComponent(currentCategories.join(','))}`;

        
        if (currentType === "all") {
          endpoints = [`/api/books${params}`, `/api/stories${params}&type=Story`, `/api/stories${params}&type=Blog`];
        } else if (currentType === "books") {
          endpoints = [`/api/books${params}`];
        } else if (currentType === "stories") {
          endpoints = [`/api/stories${params}&type=Story`];
        } else if (currentType === "blogs") {
          endpoints = [`/api/stories${params}&type=Blog`];
        }

        const responses = await Promise.all(endpoints.map(ep => fetch(ep, { cache: 'no-store' }).then(res => res.json())));
        
        let newFeed: any[] = [];
        let anyHasMore = false;
        
        responses.forEach(res => {
          if (res.data && Array.isArray(res.data)) {
            newFeed = [...newFeed, ...res.data];
          }
          if (res.hasMore) anyHasMore = true;
        });

        // Sort the aggregated chunk to maintain chronological order
        newFeed.sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());

        if (isLoadMore) {
          setFeed(prev => [...prev, ...newFeed]);
        } else {
          setFeed(newFeed);
          if (newFeed.length === 0) {
            let fbEndpoints: string[] = [];
            if (currentType === "all") {
              fbEndpoints = [`/api/books?limit=5`, `/api/stories?limit=5&type=Story`];
            } else if (currentType === "books") {
              fbEndpoints = [`/api/books?limit=5`];
            } else if (currentType === "stories") {
              fbEndpoints = [`/api/stories?limit=5&type=Story`];
            } else if (currentType === "blogs") {
              fbEndpoints = [`/api/stories?limit=5&type=Blog`];
            }
            try {
              const fbRes = await Promise.all(fbEndpoints.map(ep => fetch(ep, { cache: 'no-store' }).then(res => res.json())));
              let fbFeed: any[] = [];
              fbRes.forEach(res => {
                if (res.data && Array.isArray(res.data)) {
                  fbFeed = [...fbFeed, ...res.data];
                }
              });
              fbFeed.sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());
              setFallbackFeed(fbFeed);
            } catch (fbErr) {
              console.error("Failed to fetch fallback feed", fbErr);
            }
          } else {
            setFallbackFeed([]);
          }
        }
        setHasMore(anyHasMore);

      } else {
        // Fetch recommendations for "all" without search
        const recRes = await fetch(`/api/recommendations?page=${currentPage}&limit=10`);
        if (recRes.ok) {
          const recData = await recRes.json();
          
          if (isLoadMore) {
            setRecommendations(prev => {
              if (!prev) return recData.data;
              
              // Append new items to existing sections if titles match, or add new sections
              const newSections = [...prev.sections];
              recData.data.sections.forEach((newSec: any) => {
                const existingIndex = newSections.findIndex(s => s.title === newSec.title);
                if (existingIndex >= 0) {
                  newSections[existingIndex].items = [...newSections[existingIndex].items, ...newSec.items];
                } else {
                  newSections.push(newSec);
                }
              });
              
              return { ...prev, sections: newSections };
            });
          } else {
            setRecommendations(recData.data);
            setPreferences(recData.data.preferences);
            
            // Extract a flat, deduplicated list of staff picks from the first few items for the sidebar
            const initialFeed: any[] = [];
            const seenIds = new Set();
            recData.data.sections.forEach((s: any) => {
              s.items.forEach((item: any) => {
                if (initialFeed.length < 10 && !seenIds.has(item.id)) {
                  initialFeed.push(item);
                  seenIds.add(item.id);
                }
              });
            });
            setFeed(initialFeed);
          }
          setHasMore(recData.hasMore);
        }
      }
    } catch (err) {
      console.error("Marketplace fetch error:", err);
    } finally {
      if (!isLoadMore) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  // Debounced search & feedType listener
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPaginatedData(1, feedType, searchQuery, selectedCategories, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, feedType, languageFilter, selectedCategories, fetchPaginatedData]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchPaginatedData(next, feedType, searchQuery, selectedCategories, true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/manuscripts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ message: `${type} deleted successfully!`, type: "success" });
        setFeed(prev => prev.filter(item => item.id !== id));
      } else {
        setToast({ message: `Failed to delete ${type}.`, type: "error" });
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const staffPicks = feed.slice(0, 4);

  const renderItem = (item: any) => {
    // Normalization because DB formats vs Recommendation formats differ slightly
    const mappedItem = {
      id: item.id,
      title: item.title,
      type: item.type || (item.price !== undefined ? "Book" : "Story"),
      description: item.description || item.body || item.content || "No description available.",
      category: item.category || "General",
      cover: item.cover_url || item.cover_image || item.banner_url || item.cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800",
      author: item.author || item.authors?.name || item.authors?.users?.name || "Unknown",
      author_id: item.author_id || item.authors?.user_id,
      url: item.url || (item.price !== undefined ? `/book/${item.id}` : (item.type === 'Blog' ? `/blogs/${item.id}` : `/stories/${item.id}`)),
      date: item.created_at || item.date || Date.now(),
      price: item.price || 0,
      isAuthor: item.isAuthor || (user && (user.id === item.author_id || user.id === item.authors?.user_id))
    };

    return (
      <Link key={`${mappedItem.type}-${mappedItem.id}`} href={mappedItem.url} className="group py-6 md:py-8 border-b border-zinc-100 flex gap-4 md:gap-12 items-start md:items-center">
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
            <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-black uppercase text-zinc-500 border border-zinc-200 shadow-sm">
              {mappedItem.author ? mappedItem.author[0] : "?"}
            </div>
            <span className="text-xs md:text-sm font-semibold text-zinc-800 truncate max-w-[100px] md:max-w-[200px] flex items-center gap-1.5">
              {mappedItem.author}
              {mappedItem.author_id && founderMap[mappedItem.author_id] && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black text-white text-[8px] font-black uppercase tracking-widest leading-none">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  #{String(founderMap[mappedItem.author_id]).padStart(5, '0')}
                </span>
              )}
            </span>
            <span className="text-zinc-400 text-xs shrink-0">in</span>
            <span className="text-xs md:text-sm font-semibold text-zinc-800 truncate max-w-[100px] md:max-w-[200px]">{mappedItem.category}</span>
          </div>

          <h2 className="text-lg md:text-[22px] font-bold font-heading tracking-tight mb-2 group-hover:text-zinc-600 transition-colors line-clamp-2 leading-tight">
            {mappedItem.title}
          </h2>
          
          <p className="text-sm md:text-base text-zinc-500 font-serif leading-relaxed mb-4 line-clamp-2 hidden sm:block">
            {mappedItem.description}
          </p>

          <div className="flex items-center justify-between text-[11px] md:text-xs text-zinc-500 w-full mt-2 sm:mt-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span className="shrink-0">{new Date(mappedItem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
              <span className="bg-zinc-100 px-2 py-1 rounded-sm text-[8px] md:text-[9px] font-black tracking-widest uppercase text-zinc-600 shrink-0">{mappedItem.type}</span>
              {mappedItem.type === "Book" && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                  <span className="font-bold text-black border-b border-black shrink-0">₹{mappedItem.price}</span>
                </>
              )}
            </div>
            <div className="flex gap-3 md:gap-4 items-center shrink-0 ml-2">
              <button 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const contentType = mappedItem.type.toLowerCase();
                  const { success, message } = await toggleBookmark(contentType, mappedItem.id);
                  if (success) {
                    setToast({ message, type: "success" });
                  } else {
                    setToast({ message, type: "error" });
                  }
                }}
                className={`transition-colors ${isBookmarked(mappedItem.type.toLowerCase(), mappedItem.id) ? 'text-amber-500' : 'hover:text-black'}`}
                title="Bookmark"
              >
                <Bookmark size={18} strokeWidth={1.5} className={isBookmarked(mappedItem.type.toLowerCase(), mappedItem.id) ? 'fill-amber-500' : ''} />
              </button>
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenu(activeMenu === `${mappedItem.type}-${mappedItem.id}` ? null : `${mappedItem.type}-${mappedItem.id}`);
                  }}
                  className="hover:text-black transition-colors"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
                
                {activeMenu === `${mappedItem.type}-${mappedItem.id}` && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-xl rounded-sm py-2 z-50 text-sm font-medium text-zinc-600">
                    {mappedItem.type === "Book" && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            addToCart({
                              id: mappedItem.id,
                              title: mappedItem.title,
                              price: mappedItem.price || 14.99,
                              cover_url: mappedItem.cover,
                              author_name: mappedItem.author
                            });
                            setToast({ message: `Added "${mappedItem.title}" to cart!`, type: "success" }); 
                            setActiveMenu(null); 
                          }} 
                          className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer font-bold text-black"
                        >
                          <ShoppingBag size={14} /> Add to Cart
                        </button>
                        <div className="h-px bg-zinc-100 my-1" />
                      </>
                    )}
                    {mappedItem.author_id && !mappedItem.isAuthor && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setSelectedWriterForHire({ id: mappedItem.author_id, name: mappedItem.author });
                            setActiveMenu(null); 
                          }} 
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer font-bold text-indigo-600"
                        >
                          ✨ Hire Writer
                        </button>
                        <div className="h-px bg-zinc-100 my-1" />
                      </>
                    )}
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        const url = window.location.origin + mappedItem.url;
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
                        setToast({ message: `Following ${mappedItem.author}`, type: "success" }); 
                        setActiveMenu(null); 
                      }} 
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors"
                    >
                      Follow author
                    </button>
                    {mappedItem.isAuthor && (
                      <>
                        <div className="h-px bg-zinc-100 my-1" />
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            handleDelete(mappedItem.id, mappedItem.type);
                            setActiveMenu(null); 
                          }} 
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 transition-colors"
                        >
                          Delete {mappedItem.type}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-20 md:w-32 lg:w-40 shrink-0 aspect-square md:aspect-[16/10] bg-zinc-100 overflow-hidden shadow-sm mt-1 md:mt-0 rounded-sm md:rounded-none relative">
          <OptimizedImage src={mappedItem.cover} alt={mappedItem.title} className="w-full h-full" variant={mappedItem.type === "Book" ? "book-cover" : "blog-thumbnail"} imageClassName="grayscale hover:grayscale-0 group-hover:grayscale-0 transition-all duration-700 hover:scale-105 group-hover:scale-105" />
        </div>
      </Link>
    );
  };

  return (
    <div className="flex bg-white">
      <div className="unified-axis max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-24 pt-6 md:pt-12 pb-8 md:pb-12">
        
        {/* MAIN FEED */}
        <div className="lg:col-span-8">
          {user && <ContinueReadingSection />}
          
          <header className="mb-10 mt-6">
            {preferences?.interests && preferences.interests.length > 0 ? (
              <div className="mb-8">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Personalized for you</span>
                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight uppercase">Because you like <span className="text-zinc-600 italic">{preferences.interests[0]}</span></h1>
              </div>
            ) : (
              <h1 className="text-4xl font-heading font-black tracking-tight uppercase mb-8">Marketplace</h1>
            )}

            {/* Search Bar Form */}
            <form 
              onSubmit={(e) => e.preventDefault()}
              className="mb-8 relative max-w-lg"
            >
              <button 
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-black transition-colors border-0 bg-transparent p-0 cursor-pointer flex items-center justify-center"
              >
                <Search size={18} />
              </button>
              <input
                type="text"
                placeholder="Search books, stories, blogs, categories or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 focus:border-black outline-none font-medium text-sm transition-all rounded-sm placeholder:text-zinc-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-black transition-colors border-0 bg-transparent p-0 cursor-pointer flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              )}
            </form>
            
            {/* Tabs and Actions */}
            <div className="flex items-end border-b border-zinc-150 relative">
              <div className="flex gap-8 items-center">
                {(["all", "books", "stories", "blogs"] as const).map((t) => (
                  <div key={t} className="flex items-center">
                    <button
                      onClick={() => {
                        setFeedType(t);
                        setSelectedCategories([]);
                      }}
                      className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-all ${
                        feedType === t ? "text-black border-b-2 border-black" : "text-zinc-400 hover:text-black"
                      }`}
                    >
                      {t}
                    </button>
                    {/* Show filter icon right beside the active tab if it's books or stories */}
                    {feedType === t && (t === "books" || t === "stories") && (
                      <div className="pb-3 relative ml-2">
                        <button
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm transition-colors ${selectedCategories.length > 0 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                          aria-label="Filter"
                        >
                          <Filter size={14} />
                          {selectedCategories.length > 0 && <span>({selectedCategories.length})</span>}
                        </button>
                        
                        <AnimatePresence>
                          {isFilterOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute left-0 top-full mt-2 w-64 bg-white border border-zinc-200 shadow-xl rounded-md py-3 z-[100]"
                            >
                              <div className="px-4 pb-2 mb-2 border-b border-zinc-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Categories</span>
                                {selectedCategories.length > 0 && (
                                  <button 
                                    onClick={() => setSelectedCategories([])}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto px-2 custom-scrollbar">
                                {AVAILABLE_CATEGORIES.map(category => (
                                  <button
                                    key={category}
                                    onClick={() => {
                                      setSelectedCategories(prev => 
                                        prev.includes(category) 
                                          ? prev.filter(c => c !== category)
                                          : [...prev, category]
                                      );
                                      setIsFilterOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-zinc-50 rounded-sm flex items-center justify-between group"
                                  >
                                    <span className={selectedCategories.includes(category) ? 'text-black font-bold' : 'text-zinc-600 group-hover:text-black'}>
                                      {category}
                                    </span>
                                    {selectedCategories.includes(category) && <Check size={14} className="text-black" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </header>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
          ) : searchQuery.trim() || feedType !== "all" ? (
            <div className="flex flex-col">
              {feed.length === 0 ? (
                <div className="w-full text-left -mt-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
                    {(searchQuery.trim() || selectedCategories.length > 0) 
                      ? "No exact matches found." 
                      : `No ${feedType === "all" ? "content" : feedType} available yet.`}
                  </p>

                  {fallbackFeed.length > 0 && (
                    <div className="flex flex-col">
                      <h3 className="text-lg font-black uppercase tracking-tight mb-0 border-b border-zinc-100 pb-2">Available {feedType === "all" ? "Content" : feedType}</h3>
                      <div className="flex flex-col">
                        {fallbackFeed.map(renderItem)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {feed.map(renderItem)}
                  
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <button 
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingMore && <Loader2 className="animate-spin" size={14} />}
                        {loadingMore ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {recommendations?.sections.map((section, idx) => (
                <div key={idx} className="flex flex-col">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-4 border-b border-zinc-100 pb-2">{section.title}</h2>
                  <div className="flex flex-col">
                    {section.items.map(renderItem)}
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingMore && <Loader2 className="animate-spin" size={14} />}
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 hidden lg:block pt-12 pl-12 border-l border-zinc-100 relative">
          <div className="sticky top-12">
            
            {/* Staff Picks */}
            <div className="mb-12">
              <h3 className="font-black text-sm mb-6 text-black tracking-tight">Staff Picks</h3>
              {staffPicks.map((pick: any) => {
                const url = pick.url || (pick.price !== undefined ? `/book/${pick.id}` : (pick.type === 'Blog' ? `/blogs/${pick.id}` : `/stories/${pick.id}`));
                const author = pick.author || pick.authors?.name || pick.authors?.users?.name || "Unknown";
                return (
                  <Link key={`pick-${pick.id}`} href={url} className="block mb-6 group">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-black uppercase text-zinc-500 border border-zinc-200">
                        {author ? author[0] : "?"}
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-700 truncate max-w-[120px]">{author}</span>
                    </div>
                    <h4 className="font-bold font-heading text-[15px] leading-snug group-hover:text-zinc-600 transition-colors line-clamp-2">{pick.title}</h4>
                  </Link>
                )
              })}
            </div>

            {/* Recommended Topics */}
            <div className="mb-12">
              <h3 className="font-black text-sm mb-6 tracking-tight">Recommended topics</h3>
              <div className="flex flex-wrap gap-2.5">
                {(preferences?.interests && preferences.interests.length > 0
                  ? preferences.interests 
                  : ["Fiction", "Self Improvement", "Programming", "Technology", "History"]
                ).map(topic => (
                  <button key={topic} className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm font-medium rounded-full text-zinc-800">
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-12 pt-6 border-t border-zinc-200 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 font-medium">
              <Link href="/about" className="hover:text-zinc-800 transition-colors">About</Link>
              <Link href="/for-writers" className="hover:text-zinc-800 transition-colors">For Writers</Link>
            </div>
          </div>
        </div>
      </div>

      {selectedWriterForHire && (
        <HireWriterModal 
          isOpen={!!selectedWriterForHire}
          onClose={() => setSelectedWriterForHire(null)}
          writerId={selectedWriterForHire.id}
          writerName={selectedWriterForHire.name}
        />
      )}

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
