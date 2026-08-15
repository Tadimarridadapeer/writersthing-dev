"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  User, 
  BookOpen, 
  Clock, 
  Award, 
  Star,
  FileText,
  Heart,
  X,
  ShieldCheck,
  CheckCircle2,
  Check,
  DollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OptimizedImage } from "@/components/OptimizedImage";
import Badge from "@/components/ui/Badge";
import AvatarWithBadge from "@/components/AvatarWithBadge";
import HireWriterModal from "@/components/HireWriterModal";
import FoundingBadge from "@/components/ui/FoundingBadge";

export default function AuthorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorUser, setAuthorUser] = useState<any>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [authorBadges, setAuthorBadges] = useState<any[]>([]);
  const [writerServices, setWriterServices] = useState<any[]>([]);
  const [foundingWriterNumber, setFoundingWriterNumber] = useState<number | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [storys, setStorys] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"blogs" | "books" | "storys">("blogs");
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchAuthorData();
  }, [params.id]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      const authorId = params.id as string;
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // The URL ID could be a users.id OR an authors.id (blogs/storys FK → authors.id).
      // Try direct users lookup first; if that fails, resolve through the authors table.
      let resolvedUserId = authorId;

      const directUserRes = await supabase.from("users").select("*").eq("id", authorId).maybeSingle();

      if (!directUserRes.data) {
        // authorId might be an authors.id — look it up to get the real user_id
        const authorLookup = await supabase.from("authors").select("user_id").eq("id", authorId).maybeSingle();
        if (authorLookup.data?.user_id) {
          resolvedUserId = authorLookup.data.user_id;
        }
      }

      // Now fetch everything using the resolved user ID
      const [
        userRes,
        profileRes,
        followsCountRes,
        followStatusRes,
        badgesRes,
        servicesRes,
        founderRes
      ] = await Promise.all([
        directUserRes.data
          ? Promise.resolve(directUserRes)
          : supabase.from("users").select("*").eq("id", resolvedUserId).single(),
        supabase.from("authors").select("*").eq("user_id", resolvedUserId).maybeSingle(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", resolvedUserId),
        parsedUser ? supabase.from("follows").select("*").eq("follower_id", parsedUser.id).eq("following_id", resolvedUserId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("user_badges").select("*").eq("user_id", resolvedUserId),
        supabase.from("writer_services").select("*").eq("writer_id", resolvedUserId).order("created_at", { ascending: false }),
        supabase.from("founding_writers").select("id, founder_number").eq("user_id", resolvedUserId).ilike("status", "accepted").maybeSingle()
      ]);

      if (userRes.error || !userRes.data) {
        throw new Error("Author user not found");
      }
      
      setAuthorUser(userRes.data);
      setAuthorProfile(profileRes.data);
      setFollowersCount(followsCountRes.count || 0);
      setIsFollowing(!!followStatusRes.data);
      setAuthorBadges(badgesRes?.data || []);
      setWriterServices(servicesRes?.data || []);
      setFoundingWriterNumber(founderRes.data?.founder_number || null);

      // Books, blogs and storys query depends on author profileData ID
      if (profileRes.data) {
        const [booksDataRes, blogsDataRes, storysDataRes] = await Promise.all([
          supabase.from("books").select("*").eq("author_id", profileRes.data.id).eq("status", "Published").order("created_at", { ascending: false }),
          supabase.from("blogs").select("*").or(`author_id.eq.${profileRes.data.id},author_id.eq.${resolvedUserId}`).order("created_at", { ascending: false }),
          supabase.from("stories").select("*").or(`author_id.eq.${profileRes.data.id},author_id.eq.${resolvedUserId}`).order("created_at", { ascending: false })
        ]);
        
        setBooks(booksDataRes.data || []);
        setBlogs(blogsDataRes.data || []);
        setStorys(storysDataRes.data || []);
      } else {
        setBooks([]);
        setBlogs([]);
        setStorys([]);
      }
    } catch (err) {
      console.error("Error fetching author details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowersList = async () => {
    if (!authorUser?.id) return;
    setModalLoading(true);
    setShowFollowersModal(true);
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id, follower:follower_id(id, name, avatar_url)")
        .eq("following_id", authorUser.id);
      
      if (error) throw error;
      if (data) {
        setFollowersList(data.map((f: any) => f.follower));
      }
    } catch (err) {
      console.error("Error fetching followers list:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }
    try {
      const authorId = params.id as string;
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", authorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: authorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-outfit text-zinc-400">
        Loading Author Portfolio...
      </div>
    );
  }

  if (!authorUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-outfit text-zinc-400">
        Author Profile Not Found
      </div>
    );
  }

  const totalWorksCount = blogs.length + storys.length + books.length;

  return (
    <div className="bg-zinc-50/30 min-h-screen font-outfit text-zinc-900 pb-20">
      <div className="unified-axis max-w-5xl pt-10">
        
        {/* Breadcrumb Header */}
        <Link 
          href="/blogs" 
          className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all group mb-12"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Blogs
        </Link>

        {/* Author Header Profile Box */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm mb-12 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50/50 -z-10 rounded-bl-full" />
          
          {/* Avatar Display */}
          <div className="relative">
            {foundingWriterNumber !== null && (
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ margin: '-24px' }}>
                <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_20s_linear_infinite]">
                  <path 
                    id="curvePathAuthor" 
                    d="M 100 100 m -90 0 a 90 90 0 1 1 180 0 a 90 90 0 1 1 -180 0" 
                    fill="transparent" 
                  />
                  <text className="text-[12px] font-black uppercase tracking-[0.2em] fill-black">
                    <textPath href="#curvePathAuthor" startOffset="25%" textAnchor="middle">
                      FOUNDING WRITER
                    </textPath>
                    <textPath href="#curvePathAuthor" startOffset="75%" textAnchor="middle">
                      #{String(foundingWriterNumber).padStart(5, '0')}
                    </textPath>
                  </text>
                </svg>
              </div>
            )}
            <div className="w-24 h-24 bg-zinc-50 border-4 border-white rounded-full overflow-hidden flex-shrink-0 shadow-xl relative z-10">
              <AvatarWithBadge 
                userId={authorUser.id}
                avatarUrl={authorUser.avatar_url}
                name={authorUser.name}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Profile Text Details */}
          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-heading font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    {authorUser.name}
                    {authorUser.is_verified_writer && (
                      <span className="inline-flex items-center justify-center bg-black text-white rounded-full w-5 h-5 flex-shrink-0" title="Verified Author">
                        <Check size={12} strokeWidth={4} />
                      </span>
                    )}
                  </h1>
                </div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  {authorUser.role || "Author"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {authorUser.available_for_hire && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-200 bg-emerald-50 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available for Hire
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleFollow}
                  className={`px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.25em] transition-all ${
                    isFollowing 
                      ? "bg-zinc-100 border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                      : "bg-zinc-950 text-white hover:bg-zinc-800"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow Author"}
                </button>
                
                {(foundingWriterNumber !== null || authorUser.is_verified_writer || authorUser.available_for_hire) && (
                  <button 
                    onClick={() => setIsHireModalOpen(true)}
                    className="px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.25em] transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  >
                    Hire Writer
                  </button>
                )}
              </div>
            </div>

            {/* Author Biography */}
            <p className="text-sm font-medium leading-relaxed italic text-zinc-500 max-w-2xl mb-6">
              {authorProfile?.bio || authorUser.bio || "Writersthing digital creator shaping tomorrow's words."}
            </p>

            {/* Statistics Row */}
            <div className="flex items-center justify-center md:justify-start gap-8 pt-6 border-t border-zinc-50">
              <div 
                onClick={fetchFollowersList}
                className="text-center md:text-left cursor-pointer hover:opacity-80 transition-all group/stats"
              >
                <p className="text-xl font-heading font-black text-zinc-950 group-hover/stats:text-zinc-600 transition-colors">{followersCount}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover/stats:text-zinc-500 transition-colors">Followers</p>
              </div>
              <div className="h-6 w-px bg-zinc-100" />
              <div className="text-center md:text-left">
                <p className="text-xl font-heading font-black text-zinc-950">{totalWorksCount}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Total Works</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Services */}
        {writerServices.length > 0 && (
          <div className="mb-12 bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-heading font-black uppercase tracking-tight text-zinc-900 mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-indigo-500" /> Professional Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {writerServices.map(service => (
                <div key={service.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-black transition-colors">
                  <h3 className="text-sm font-bold text-zinc-900 mb-2">{service.service}</h3>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Starting Price</span>
                    <span className="text-sm font-black text-black">₹{service.starting_price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200/80 mb-10 flex-shrink-0">
          <button 
            onClick={() => setActiveTab("blogs")}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all mr-8 border-b-2 ${
              activeTab === "blogs" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Blogs ({blogs.length})
          </button>
          <button 
            onClick={() => setActiveTab("books")}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all mr-8 border-b-2 ${
              activeTab === "books" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Books ({books.length})
          </button>
          <button 
            onClick={() => setActiveTab("storys")}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "storys" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Stories ({storys.length})
          </button>
        </div>

        {/* Works Lists */}
        <div>
          
          {/* 1. Blogs tab */}
          {activeTab === "blogs" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {blogs.length > 0 ? (
                blogs.map(blogItem => (
                  <Link 
                    key={blogItem.id} 
                    href={`/blogs/${blogItem.id}`}
                    className="block bg-white border border-zinc-100 rounded-3xl p-6 hover:border-zinc-950 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <span className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {blogItem.category || "Blog"}
                      </span>
                      <span className="flex items-center gap-1.5 text-zinc-300 text-[9px] font-bold">
                        <Clock size={11} /> {new Date(blogItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-heading font-black uppercase tracking-tight mb-3 text-zinc-900 group-hover:text-black leading-tight">
                      {blogItem.title}
                    </h3>
                    
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed italic line-clamp-3">
                      {blogItem.content}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-16 bg-white border border-zinc-100 rounded-3xl text-zinc-400 italic text-sm">
                  No blog posts published yet.
                </div>
              )}
            </motion.div>
          )}

          {/* 2. Books Tab */}
          {activeTab === "books" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {books.length > 0 ? (
                books.map(bookItem => (
                  <Link 
                    key={bookItem.id} 
                    href={`/book/${bookItem.id}`}
                    className="block bg-white border border-zinc-100 rounded-3xl p-5 hover:border-zinc-950 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-[3/4.2] bg-zinc-50 border border-zinc-100/70 rounded-2xl overflow-hidden mb-4 relative shadow-sm">
                      <OptimizedImage 
                        src={bookItem.cover_url || "/placeholder-cover.jpg"} 
                        alt={bookItem.title}
                        variant="book-cover"
                        imageClassName="grayscale group-hover:grayscale-0 group-hover:scale-102 transition-all duration-700" 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                        {bookItem.category}
                      </span>
                      <span className="text-xs font-heading font-black text-zinc-950">
                        ₹{bookItem.price}
                      </span>
                    </div>

                    <h3 className="text-md font-heading font-black uppercase tracking-tight text-zinc-900 group-hover:text-black leading-tight line-clamp-1">
                      {bookItem.title}
                    </h3>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-16 bg-white border border-zinc-100 rounded-3xl text-zinc-400 italic text-sm">
                  No books published yet.
                </div>
              )}
            </motion.div>
          )}

          {/* 3. Storys Tab */}
          {activeTab === "storys" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {storys.length > 0 ? (
                storys.map(artItem => (
                  <Link 
                    key={artItem.id} 
                    href={`/stories/${artItem.id}`}
                    className="block bg-white border border-zinc-100 rounded-3xl p-6 hover:border-zinc-950 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <span className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {artItem.category || "Story"}
                      </span>
                      <span className="flex items-center gap-1.5 text-zinc-300 text-[9px] font-bold">
                        <Clock size={11} /> {new Date(artItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-heading font-black uppercase tracking-tight mb-3 text-zinc-900 group-hover:text-black leading-tight">
                      {artItem.title}
                    </h3>
                    
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed italic line-clamp-3">
                      {artItem.content}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-16 bg-white border border-zinc-100 rounded-3xl text-zinc-400 italic text-sm">
                  No storys published yet.
                </div>
              )}
            </motion.div>
          )}

        {/* Followers Modal Overlay */}
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 w-full max-w-sm flex flex-col max-h-[70vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">Followers</h3>
                <button 
                  onClick={() => setShowFollowersModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-50"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto mt-4 pr-1 flex-grow custom-scrollbar">
                {modalLoading ? (
                  <div className="text-center py-8 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Loading...
                  </div>
                ) : followersList.length > 0 ? (
                  <div className="space-y-3">
                    {followersList.map((follower) => (
                      <Link
                        key={follower.id}
                        href={`/authors/${follower.id}`}
                        onClick={() => setShowFollowersModal(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all group/item"
                      >
                        <OptimizedImage 
                          src={follower.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                          alt={follower.name} 
                          variant="profile"
                          className="w-8 h-8 rounded-full border border-zinc-200 flex-shrink-0" 
                        />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-800 truncate group-hover/item:text-black">
                            {follower.name || "Anonymous"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 italic text-xs text-center py-8">
                    No followers yet.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        </div>
        
        <HireWriterModal 
          isOpen={isHireModalOpen} 
          onClose={() => setIsHireModalOpen(false)} 
          writerId={authorUser.id} 
          writerName={authorUser.name} 
        />
      </div>
    </div>
  );
}
