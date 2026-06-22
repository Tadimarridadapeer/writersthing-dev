"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  Check, 
  Sparkles,
  Flame,
  FileText,
  Bookmark,
  Heart,
  Smile,
  GraduationCap,
  HelpCircle,
  History,
  Atom,
  Shield,
  User,
  PenTool,
  Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";
import Link from "next/link";
interface FeedItem {
  id: string;
  title: string;
  type: "Book" | "Article" | "Blog";
  category: string;
  cover: string;
  author: string;
  url: string;
  price?: number;
  date: string;
  rating: number;
  likesCount: number;
  savesCount: number;
  trendingScore: number;
  description: string;
  genres: string[];
}

// Dynamically resolves genres/categories from title, category, and content keywords
function getGenreMatch(title: string, category: string, description: string): string[] {
  const matchedGenres: string[] = ["All Genres"];
  const textToSearch = `${title} ${category} ${description}`.toLowerCase();

  const genreKeywords: Record<string, string[]> = {
    "Love": ["love", "romance", "romantic", "relationship", "intimacy", "heart", "passion", "marriage", "couple", "women", "gender"],
    "Comedy": ["comedy", "humor", "lighthearted", "funny", "laugh", "joke", "satire", "amusing", "fun", "hilarious"],
    "Education": ["education", "learn", "code", "ai", "coding", "tutorial", "guide", "school", "teach", "intellectual", "academic", "brain", "program", "prompt", "study", "student", "knowledge"],
    "Mystery": ["mystery", "suspense", "puzzle", "crime", "detective", "secret", "thriller", "ghost", "horror", "murder", "clue"],
    "Fiction": ["fiction", "story", "novel", "speculative", "narrative", "fantasy", "sci-fi", "worldbuilding", "read", "book", "author", "write"],
    "History": ["history", "historical", "past", "ancient", "war", "legacy", "century", "victorian", "old", "timeline"],
    "Sci-Fi": ["sci-fi", "science fiction", "technology", "digital", "cyberpunk", "silicon", "space", "future", "ai", "prompt", "code", "coding", "robot", "virtual"],
    "Thriller": ["thriller", "action", "suspense", "tension", "dangerous", "escape", "gripping", "dark", "adventure"],
    "Biography": ["biography", "memoir", "life", "autobiography", "real person", "personal growth", "contentment", "self", "mind", "morning", "day", "happy", "feel"],
    "Poetry": ["poetry", "verse", "rhythmic", "poem", "poetic", "art", "creative"]
  };

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(kw => textToSearch.includes(kw))) {
      matchedGenres.push(genre);
    }
  }

  // Substring match fallbacks for database category
  for (const genre of Object.keys(genreKeywords)) {
    if (category.toLowerCase().includes(genre.toLowerCase()) && !matchedGenres.includes(genre)) {
      matchedGenres.push(genre);
    }
  }

  return matchedGenres;
}

// Category details with corresponding Lucide icons
const categoryMeta: Record<string, { icon: any; desc: string }> = {
  "All Genres": { icon: Globe, desc: "Browse everything published" },
  "Love": { icon: Heart, desc: "Romance and emotional tales" },
  "Comedy": { icon: Smile, desc: "Humor and lighthearted stories" },
  "Education": { icon: GraduationCap, desc: "Learning, insights & tutorials" },
  "Mystery": { icon: HelpCircle, desc: "Suspense, thrillers and puzzles" },
  "Fiction": { icon: Sparkles, desc: "Speculative & imaginative worlds" },
  "History": { icon: History, desc: "Historical events and narratives" },
  "Sci-Fi": { icon: Atom, desc: "Science fiction and technology" },
  "Thriller": { icon: Shield, desc: "Action-packed suspense stories" },
  "Biography": { icon: User, desc: "Real people and life achievements" },
  "Poetry": { icon: PenTool, desc: "Rhythmic and emotional verses" }
};

export default function ExplorePage() {
  const router = useRouter();
  
  // State variables
  const [books, setBooks] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [saves, setSaves] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  
  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Genres");

  // Fetch all items + popularity stats from Supabase/API on mount
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // 1. Fetch Books, Articles, and Blogs concurrently
        const [booksRes, articlesRes, blogsRes] = await Promise.all([
          fetch(getApiUrl("/api/books")).then(res => res.json()),
          fetch("/api/articles?type=Article").then(res => res.json()),
          fetch("/api/articles?type=Blog").then(res => res.json())
        ]);

        const booksData = booksRes || [];
        const articlesData = articlesRes || [];
        const blogsData = blogsRes || [];

        // 2. Extract content IDs to selectively query popularity statistics
        const contentIds = [
          ...booksData.map((b: any) => b.id),
          ...articlesData.map((a: any) => a.id),
          ...blogsData.map((bl: any) => bl.id)
        ].filter(Boolean);

        // 3. Query stats only for these active IDs to maximize query performance
        let likesData: any[] = [];
        let savesData: any[] = [];
        let commentsData: any[] = [];

        if (contentIds.length > 0) {
          const [likesRes, savesRes, commentsRes] = await Promise.all([
            supabase.from("likes").select("content_id").in("content_id", contentIds),
            supabase.from("saves").select("content_id").in("content_id", contentIds),
            supabase.from("comments").select("content_id, rating").in("content_id", contentIds).not("rating", "is", null)
          ]);
          likesData = likesRes.data || [];
          savesData = savesRes.data || [];
          commentsData = commentsRes.data || [];
        }

        setBooks(booksData);
        setArticles(articlesData);
        setBlogs(blogsData);
        setLikes(likesData);
        setSaves(savesData);
        setRatings(commentsData);
      } catch (err) {
        console.error("Explore content fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Merge, standardize, and calculate trending scores
  const mergedFeed: FeedItem[] = [
    ...books.map(b => {
      const bLikes = likes.filter(l => l.content_id === b.id).length;
      const bSaves = saves.filter(s => s.content_id === b.id).length;
      const bookRatings = ratings.filter(r => r.content_id === b.id);
      const rating = bookRatings.length > 0
        ? bookRatings.reduce((sum, r) => sum + r.rating, 0) / bookRatings.length
        : (Number(b.rating) || 0);

      // Formula: (likes * 10) + (saves * 15) + (rating * 20)
      const trendingScore = (bLikes * 10) + (bSaves * 15) + (rating * 20);
      const description = b.description || "";
      const genres = getGenreMatch(b.title, b.category || "Novel", description);

      return {
        id: b.id,
        title: b.title,
        type: "Book" as const,
        category: b.category || "Novel",
        cover: b.cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
        author: b.authors?.name || b.author?.name || "Unknown",
        url: `/book/${b.id}`,
        price: b.price || 99,
        date: b.created_at,
        rating: Number(rating.toFixed(1)),
        likesCount: bLikes,
        savesCount: bSaves,
        trendingScore,
        description,
        genres
      };
    }),
    ...articles.map(a => {
      const aLikes = likes.filter(l => l.content_id === a.id).length;
      const aSaves = saves.filter(s => s.content_id === a.id).length;
      const articleRatings = ratings.filter(r => r.content_id === a.id);
      const rating = articleRatings.length > 0
        ? articleRatings.reduce((sum, r) => sum + r.rating, 0) / articleRatings.length
        : 0;

      const trendingScore = (aLikes * 10) + (aSaves * 15) + (rating * 20);
      const description = a.description || "";
      const genres = getGenreMatch(a.title, a.category || "Insight", description);

      return {
        id: a.id,
        title: a.title,
        type: "Article" as const,
        category: a.category || "Insight",
        cover: a.cover_url || "https://images.unsplash.com/photo-1457369804593-50c4113ef53c?w=800",
        author: a.authors?.name || "Unknown",
        url: `/articles/${a.id}`,
        date: a.created_at,
        likesCount: aLikes,
        savesCount: aSaves,
        trendingScore,
        rating: Number(rating.toFixed(1)),
        description,
        genres
      };
    }),
    ...blogs.map(bl => {
      const blLikes = likes.filter(l => l.content_id === bl.id).length;
      const blSaves = saves.filter(s => s.content_id === bl.id).length;
      const blogRatings = ratings.filter(r => r.content_id === bl.id);
      const rating = blogRatings.length > 0
        ? blogRatings.reduce((sum, r) => sum + r.rating, 0) / blogRatings.length
        : 0;

      const trendingScore = (blLikes * 10) + (blSaves * 15) + (rating * 20);
      const description = bl.description || "";
      const genres = getGenreMatch(bl.title, "Blog", description);

      return {
        id: bl.id,
        title: bl.title,
        type: "Blog" as const,
        category: "Personal",
        cover: bl.cover_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
        author: bl.authors?.name || "Unknown",
        url: `/blogs/${bl.id}`,
        date: bl.created_at,
        likesCount: blLikes,
        savesCount: blSaves,
        trendingScore,
        rating: Number(rating.toFixed(1)),
        description,
        genres
      };
    })
  ];

  // Filter based on dropdown category using resolved genres array
  const filteredFeed = mergedFeed.filter(item => {
    if (selectedCategory === "All Genres") return true;
    return item.genres.includes(selectedCategory);
  });

  // Split into Trending (sorted by popularity score) and New Releases (sorted by date)
  const trendingItems = [...filteredFeed]
    .sort((a, b) => b.trendingScore - a.trendingScore)
    // Only items with some engagement or rating should count as trending
    .filter(item => item.trendingScore > 0)
    .slice(0, 3); // Top 3 trending items

  const newReleases = [...filteredFeed]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const handleStartReading = () => {
    if (selectedItem) {
      router.push(selectedItem.url);
    }
  };

  const SelectedIcon = categoryMeta[selectedCategory]?.icon || Globe;

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans pb-36">
      {/* Background blueprint dotted layout */}
      <div 
        className="absolute inset-0 pointer-events-none select-none opacity-40 -z-10"
        style={{
          backgroundImage: "radial-gradient(circle, #e4e4e7 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px"
        }}
      />

      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 relative">
        
        {/* Navigation back helper */}
        <div className="mb-10 flex items-center justify-between">
          <Link 
            href="/"
            className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Home
          </Link>
          <div className="text-[10px] font-mono text-zinc-450 bg-zinc-50 border border-zinc-150 rounded px-2.5 py-1">[WT_DISCOVER_03]</div>
        </div>

        {/* Title Header and Dropdown Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-zinc-100 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-[44px] font-heading font-black tracking-ultra-tight uppercase leading-none text-zinc-950">
              what would you like to read?
            </h1>
            <p className="text-sm text-zinc-400 font-medium tracking-wide">
              Select a genre to load curated trending books, blogs, and new releases.
            </p>
          </div>

          {/* Premium Custom Dropdown Selector */}
          <div className="relative shrink-0 select-none">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between gap-4 px-6 py-4 bg-black hover:bg-zinc-900 text-white rounded-full min-w-[240px] transition-all text-left text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <SelectedIcon size={15} className="text-zinc-300 animate-pulse" />
                <span>{selectedCategory}</span>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-zinc-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Click outside backdrop overlay */}
                  <div 
                    className="fixed inset-0 z-45" 
                    onClick={() => setIsOpen(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden z-50 py-2.5 max-h-[380px] overflow-y-auto"
                  >
                    <div className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-50 mb-1">
                      Choose Genre
                    </div>
                    {Object.keys(categoryMeta).map((cat) => {
                      const CatIcon = categoryMeta[cat].icon;
                      const isSelected = selectedCategory === cat;
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedItem(null); // Reset selection
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-xs transition-all text-left ${
                            isSelected 
                              ? "bg-zinc-50 text-black font-black" 
                              : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CatIcon size={14} className={isSelected ? "text-black" : "text-zinc-400"} />
                            <div className="flex flex-col">
                              <span className="font-bold uppercase tracking-wider">{cat}</span>
                              <span className="text-[9px] text-zinc-400 normal-case font-medium mt-0.5">{categoryMeta[cat].desc}</span>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-black stroke-[3]" />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content Loading & Display */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-zinc-300" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pouring archive data...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="py-24 text-center border border-zinc-150 bg-zinc-50/20 rounded-2xl">
            <BookOpen className="text-zinc-300 mx-auto mb-6" size={48} />
            <h3 className="font-heading font-black text-xl uppercase mb-2">No items found</h3>
            <p className="text-zinc-400 font-medium max-w-sm mx-auto italic text-sm px-6">
              No entries are currently listed under "{selectedCategory}". Please select another category.
            </p>
          </div>
        ) : (
          <div className="space-y-20">
            
            {/* SECTION A: TRENDING NOW */}
            {trendingItems.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                    <Sparkles size={16} className="fill-amber-500 text-amber-500 animate-pulse" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-800">
                    Trending in {selectedCategory === "All Genres" ? "WTHINGS" : selectedCategory}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trendingItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id && selectedItem?.type === item.type;
                    
                    return (
                      <div
                        key={`trending-${item.type}-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none bg-white ${
                          isSelected 
                            ? "border-black border-2 bg-zinc-50/50 shadow-2xl -translate-y-1" 
                            : "border-zinc-200/80 hover:border-zinc-400 hover:shadow-xl hover:-translate-y-1"
                        }`}
                      >
                        {/* Selection check badge */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-black text-white p-1.5 rounded-full z-20">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}

                        {/* Trending Indicator Ribbons */}
                        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                          <span className="bg-amber-400 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                            🔥 Trending
                          </span>
                        </div>

                        {/* Card Cover */}
                        <div className="aspect-[3/4.2] bg-zinc-50 overflow-hidden relative mb-5 rounded-xl border border-zinc-100">
                          <img 
                            src={item.cover} 
                            alt={item.title} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                          />
                          
                          {item.type === "Book" && (
                            <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                              ₹{item.price}
                            </span>
                          )}
                        </div>

                        {/* Social stats / popularity counts */}
                        <div className="flex items-center gap-3 mb-3 text-[10px] text-zinc-450 font-bold">
                          {item.likesCount > 0 && (
                            <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                              <Heart size={10} className="fill-rose-500 text-rose-500" /> {item.likesCount}
                            </span>
                          )}
                          {item.savesCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              <Bookmark size={10} className="fill-amber-500 text-amber-500" /> {item.savesCount}
                            </span>
                          )}
                          {item.rating !== undefined && item.rating > 0 && (
                            <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                              ⭐ {item.rating}
                            </span>
                          )}
                        </div>

                        {/* Card Details */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-sm">
                            {item.type}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 truncate max-w-[120px]">
                            {item.category}
                          </span>
                        </div>
                        
                        <h3 className="text-base font-heading font-black tracking-tight uppercase mb-2 leading-snug line-clamp-2 text-zinc-950">
                          {item.title}
                        </h3>
                        
                        <p className="text-xs font-semibold text-zinc-400 italic mt-auto">
                          by {item.author}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION B: NEW RELEASES */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-zinc-50 rounded-lg text-zinc-600 border border-zinc-200">
                  <Bookmark size={16} className="text-zinc-650" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-800">
                  New Releases & Publications
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {newReleases.map((item) => {
                  const isSelected = selectedItem?.id === item.id && selectedItem?.type === item.type;
                  
                  return (
                    <div
                      key={`new-${item.type}-${item.id}`}
                      onClick={() => setSelectedItem(item)}
                      className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none bg-white ${
                        isSelected 
                          ? "border-black border-2 bg-zinc-50/50 shadow-xl" 
                          : "border-zinc-200 hover:border-zinc-400 hover:shadow-md"
                      }`}
                    >
                      {/* Selection check badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-black text-white p-1.5 rounded-full z-20">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}

                      {/* Card Cover */}
                      <div className="aspect-[3/4.2] bg-zinc-50 overflow-hidden relative mb-5 rounded-lg border border-zinc-100">
                        <img 
                          src={item.cover} 
                          alt={item.title} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                        />
                        
                        {item.type === "Book" && (
                          <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                            ₹{item.price}
                          </span>
                        )}
                      </div>

                      {/* Stats for new card */}
                      <div className="flex items-center gap-3 mb-2.5 text-[9px] text-zinc-450 font-bold">
                        {item.likesCount > 0 && (
                          <span className="flex items-center gap-0.5 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded"><Heart size={9} className="fill-rose-500 text-rose-500" /> {item.likesCount}</span>
                        )}
                        {item.savesCount > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><Bookmark size={9} className="fill-amber-500 text-amber-500" /> {item.savesCount}</span>
                        )}
                        {item.rating !== undefined && item.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">⭐ {item.rating}</span>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-sm">
                          {item.type}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 truncate max-w-[120px]">
                          {item.category}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-heading font-black tracking-tight uppercase mb-2 leading-snug line-clamp-2 text-zinc-950">
                        {item.title}
                      </h3>
                      
                      <div className="mt-auto pt-3 border-t border-zinc-50 flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-400 italic">
                          by {item.author}
                        </p>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {new Date(item.date).toLocaleDateString(undefined, {month: "short", day: "numeric"})}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}
      </div>

      {/* Frame Bottom Fixed Start Reading Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-zinc-200 py-5 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
            {selectedItem 
              ? `Ready to Read: "${selectedItem.title}"` 
              : "Select a publication card from the grid above"
            }
          </span>
        </div>

        <button
          onClick={handleStartReading}
          disabled={!selectedItem}
          className={`w-full sm:w-auto px-12 py-3.5 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg select-none ${
            selectedItem 
              ? "bg-black hover:bg-zinc-800 text-white hover:scale-[1.03] active:scale-[0.97] cursor-pointer" 
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          }`}
        >
          <span>Start Reading</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
