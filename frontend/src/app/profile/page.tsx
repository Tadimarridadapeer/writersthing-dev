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
  Sparkles,
  Image as ImageIcon,
  X
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
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Webcam modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Stop webcam stream helper
  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // Open webcam modal and start stream
  const handleCameraChoice = async () => {
    setShowAvatarMenu(false);
    setCapturedImage(null);
    setCameraReady(false);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setShowCameraModal(false);
      setToast({ message: 'Camera access was denied. Please allow camera permissions and try again.', type: 'error' });
    }
  };

  // Capture a still frame from the video
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Retake — restart the stream
  const handleRetake = async () => {
    setCapturedImage(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch {}
  };

  // Use the captured photo — convert dataURL to File and upload
  const handleUsePhoto = async () => {
    if (!capturedImage) return;
    setShowCameraModal(false);
    setUploading(true);
    setToast(null);
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const publicUrl = await uploadAvatar(file, user.id);
      if (publicUrl) {
        const updatedUser = { ...user, avatar_url: publicUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setToast({ message: 'Profile picture updated successfully!', type: 'success' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to upload photo.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Close camera modal cleanly
  const handleCloseCameraModal = () => {
    stopStream();
    setCapturedImage(null);
    setCameraReady(false);
    setShowCameraModal(false);
  };

  const handleAvatarClick = () => {
    if (!uploading) setShowAvatarMenu(prev => !prev);
  };

  const handleUploadChoice = () => {
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
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
  const [bookmarkedItems, setBookmarkedItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [hasLibraryError, setHasLibraryError] = useState(false);
  const [hasSavesError, setHasSavesError] = useState(false);
  const [hasLikesError, setHasLikesError] = useState(false);
  const [libraryPerspective, setLibraryPerspective] = useState<"reader" | "author">("reader");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "book" | "article" | "blog">("all");
  const [bookmarkFilter, setBookmarkFilter] = useState<"all" | "book" | "article" | "blog">("all");
  const [likeFilter, setLikeFilter] = useState<"all" | "book" | "article" | "blog">("all");
  const [readedItems, setReadedItems] = useState<any[]>([]);
  const [publishedItems, setPublishedItems] = useState<any[]>([]);
  const [hasImpressionsError, setHasImpressionsError] = useState(false);

  const getAuthorName = (book: any) => {
    if (!book) return "Unknown";
    if (typeof book.author === "string") return book.author;
    if (book.author?.name) return book.author.name;
    if (book.authors?.users?.name) return book.authors.users.name;
    if (book.users?.name) return book.users.name;
    if (book.author?.users?.name) return book.author.users.name;
    return "Unknown";
  };

  const fetchItemsDetails = async (items: any[]) => {
    if (!items || !items.length) return [];
    
    const bookIds = items.filter(i => i.content_type === "book").map(i => i.content_id);
    const articleIds = items.filter(i => i.content_type === "article").map(i => i.content_id);
    const blogIds = items.filter(i => i.content_type === "blog").map(i => i.content_id);
    
    const [booksRes, articlesRes, blogsRes] = await Promise.all([
      bookIds.length 
        ? supabase.from("books").select("*, authors:author_id(*, users:user_id(name))").in("id", bookIds) 
        : Promise.resolve({ data: [] }),
      articleIds.length 
        ? supabase.from("articles").select("*, authors:author_id(*, users:user_id(name))").in("id", articleIds) 
        : Promise.resolve({ data: [] }),
      blogIds.length 
        ? supabase.from("blogs").select("*, authors:author_id(*, users:user_id(name))").in("id", blogIds) 
        : Promise.resolve({ data: [] })
    ]);
    
    const booksMap = new Map((booksRes.data || []).map(b => [b.id, { ...b, type: "book" }]));
    const articlesMap = new Map((articlesRes.data || []).map(a => [a.id, { ...a, type: "article" }]));
    const blogsMap = new Map((blogsRes.data || []).map(b => [b.id, { ...b, type: "blog" }]));
    
    return items.map(item => {
      let details = null;
      if (item.content_type === "book") details = booksMap.get(item.content_id);
      else if (item.content_type === "article") details = articlesMap.get(item.content_id);
      else if (item.content_type === "blog") details = blogsMap.get(item.content_id);
      
      return details ? { ...item, details } : null;
    }).filter(Boolean);
  };

  const handleUnsave = async (saveId: string) => {
    try {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("id", saveId);
      if (!error) {
        setBookmarkedItems(prev => prev.filter(item => item.id !== saveId));
        setStats(prev => ({ ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) }));
        setToast({ message: "Bookmark removed successfully!", type: "success" });
      } else {
        setToast({ message: error.message, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleUnlike = async (likeId: string) => {
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);
      if (!error) {
        setLikedItems(prev => prev.filter(item => item.id !== likeId));
        setToast({ message: "Like removed successfully!", type: "success" });
      } else {
        setToast({ message: error.message, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const fetchProfileData = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login?redirect=/profile");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    try {
      // Fetch stats and library in parallel
      const [libRes, authorRes, manuscriptRes, repRes, savesRes, likesRes, impRes] = await Promise.all([
        supabase.from("library").select("*, books(*, authors:author_id(*, users:user_id(name)))").eq("user_id", parsedUser.id),
        supabase.from("authors").select("*").eq("user_id", parsedUser.id).maybeSingle(),
        supabase.from("books").select("*").eq("author_id", parsedUser.id),
        supabase.from("author_reputation").select("*").eq("user_id", parsedUser.id).maybeSingle(),
        supabase.from("saves").select("*").eq("user_id", parsedUser.id),
        supabase.from("likes").select("*").eq("user_id", parsedUser.id),
        supabase.from("impressions").select("*").eq("viewer_id", parsedUser.id).order("created_at", { ascending: false })
      ]);

      if (libRes.error) {
        console.warn("Library table error:", libRes.error.message);
        if (libRes.error.code === "PGRST205") setHasLibraryError(true);
      } else if (libRes.data) {
        setPurchasedBooks(libRes.data.map(l => l.books).filter(Boolean));
      }

      if (manuscriptRes.data) {
        setMyManuscripts(manuscriptRes.data);
      }

      if (savesRes.error) {
        console.warn("Saves table error:", savesRes.error.message);
        if (savesRes.error.code === "PGRST205") setHasSavesError(true);
      } else if (savesRes.data) {
        const resolvedSaves = await fetchItemsDetails(savesRes.data);
        setBookmarkedItems(resolvedSaves);
      }

      if (likesRes.error) {
        console.warn("Likes table error:", likesRes.error.message);
        if (likesRes.error.code === "PGRST205") setHasLikesError(true);
      } else if (likesRes.data) {
        const resolvedLikes = await fetchItemsDetails(likesRes.data);
        setLikedItems(resolvedLikes);
      }

      // 1. Process Readed Items (from impressions + library)
      if (impRes.error) {
        console.warn("Impressions table error:", impRes.error.message);
        if (impRes.error.code === "PGRST205") setHasImpressionsError(true);
      }

      let readedSaves: any[] = [];
      if (impRes.data && impRes.data.length > 0) {
        const seen = new Set();
        const uniqueImpressions = impRes.data.filter((imp: any) => {
          const key = `${imp.content_type}-${imp.content_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        readedSaves = uniqueImpressions;
      }

      // Merge purchased books that aren't already logged in impressions
      if (libRes.data) {
        libRes.data.forEach((lib: any) => {
          if (lib.books) {
            const exists = readedSaves.some(imp => imp.content_type === "book" && imp.content_id === lib.book_id);
            if (!exists) {
              readedSaves.push({
                content_type: "book",
                content_id: lib.book_id,
                created_at: lib.last_read || new Date().toISOString()
              });
            }
          }
        });
      }

      const resolvedReaded = await fetchItemsDetails(readedSaves);
      setReadedItems(resolvedReaded);

      // 2. Process Published Items (for Authors/Admins)
      if (parsedUser.role === "Author" || parsedUser.role === "Admin") {
        const { data: authorProfile } = await supabase
          .from("authors")
          .select("id")
          .eq("user_id", parsedUser.id)
          .maybeSingle();

        if (authorProfile) {
          const [pubBooksRes, pubArticlesRes, pubBlogsRes] = await Promise.all([
            supabase.from("books").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", parsedUser.id),
            supabase.from("articles").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", authorProfile.id),
            supabase.from("blogs").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", authorProfile.id)
          ]);
          
          const books = (pubBooksRes.data || []).map((b: any) => ({ ...b, type: "book", content_type: "book", details: b }));
          const articles = (pubArticlesRes.data || []).map((a: any) => ({ ...a, type: "article", content_type: "article", details: a }));
          const blogs = (pubBlogsRes.data || []).map((b: any) => ({ ...b, type: "blog", content_type: "blog", details: b }));
          
          setPublishedItems([...books, ...articles, ...blogs]);
        }
      }

      const libraryCount = libRes.data?.length || 0;
      const bookmarksCount = savesRes.data?.length || 0;
      
      if (repRes.data) {
        setReputation(repRes.data);
        setStats({
          library: libraryCount,
          bookmarks: bookmarksCount,
          earnings: authorRes.data?.total_earnings || 0,
          followers: repRes.data.followers_count || 0,
          following: repRes.data.following_count || 0
        });
      } else {
        setStats({
          library: libraryCount,
          bookmarks: bookmarksCount,
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
            <div className="relative" style={{ userSelect: 'none' }}>
              {/* Avatar circle */}
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

              {/* Camera toggle button */}
              <button 
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-2 right-2 p-3 bg-black text-white rounded-full shadow-xl hover:scale-110 transition-all z-10"
                disabled={uploading}
                title="Change profile photo"
              >
                <Camera size={18} />
              </button>

              {/* Options popup */}
              <AnimatePresence>
                {showAvatarMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-0 left-full ml-4 z-20 bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden w-48"
                  >
                    {/* close strip */}
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-zinc-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Change Photo</span>
                      <button onClick={() => setShowAvatarMenu(false)} className="text-zinc-300 hover:text-black transition-colors cursor-pointer">
                        <X size={12} />
                      </button>
                    </div>

                    {/* Camera option */}
                    <button
                      type="button"
                      onClick={handleCameraChoice}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-zinc-50 transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Camera</p>
                        <p className="text-[8px] text-zinc-400 mt-0.5">Take a photo now</p>
                      </div>
                    </button>

                    {/* Upload option */}
                    <button
                      type="button"
                      onClick={handleUploadChoice}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-zinc-50 transition-colors group border-t border-zinc-100 cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Upload</p>
                        <p className="text-[8px] text-zinc-400 mt-0.5">Choose from device</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden file input for Upload */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange} 
                disabled={uploading}
              />
              {/* Hidden canvas used to capture a frame from the webcam stream */}
              <canvas ref={canvasRef} className="hidden" />
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
                    hasLibraryError ? (
                      <div className="py-20 text-center bg-zinc-50 border border-red-100 rounded-sm border-dashed">
                        <p className="text-red-500 font-medium italic mb-4">Table 'library' (Reader Library) is missing from the database.</p>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">Please run the SQL migration script <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-black font-mono">supabase_schema.sql</code> in your Supabase SQL Editor to enable your library.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Perspective Toggle (only for Author/Admin) */}
                        {(user.role === "Author" || user.role === "Admin") && (
                          <div className="flex gap-2 mb-8 border-b border-zinc-100 pb-4 select-none">
                            <button
                              onClick={() => setLibraryPerspective("reader")}
                              className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                libraryPerspective === "reader"
                                  ? "bg-black text-white"
                                  : "bg-zinc-50 text-zinc-400 hover:text-black border border-zinc-100 hover:border-black"
                              }`}
                            >
                              Reader Library
                            </button>
                            <button
                              onClick={() => setLibraryPerspective("author")}
                              className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                libraryPerspective === "author"
                                  ? "bg-black text-white"
                                  : "bg-zinc-50 text-zinc-400 hover:text-black border border-zinc-100 hover:border-black"
                              }`}
                            >
                              Author Portfolio
                            </button>
                          </div>
                        )}

                        {/* Filter Pills */}
                        <div className="flex flex-wrap gap-2 mb-8 select-none">
                          {[
                            { value: "all", label: "All Content" },
                            { value: "book", label: "Books" },
                            { value: "article", label: "Articles" },
                            { value: "blog", label: "Blogs" }
                          ].map((f) => (
                            <button
                              key={f.value}
                              onClick={() => setLibraryFilter(f.value as any)}
                              className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all border rounded-full cursor-pointer ${
                                libraryFilter === f.value
                                  ? "bg-black border-black text-white"
                                  : "bg-white border-zinc-200 text-zinc-400 hover:text-black hover:border-black"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* List Render */}
                        {(() => {
                          const itemsToShow = libraryPerspective === "reader" ? readedItems : publishedItems;
                          const filtered = itemsToShow.filter(item => {
                            if (libraryFilter === "all") return true;
                            return item.content_type === libraryFilter;
                          });

                          if (filtered.length > 0) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {filtered.map((item) => {
                                  const details = item.details;
                                  if (!details) return null;
                                  const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                  const isArticle = item.content_type === "article" || details.thumbnail_url !== undefined;
                                  const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                  let badge = "CONTENT";
                                  let link = "";
                                  let cover = details.cover_url || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                  if (isBook) {
                                    badge = "BOOK";
                                    link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                  } else if (isArticle) {
                                    badge = "ARTICLE";
                                    link = `/articles/${details.id}`;
                                  } else if (isBlog) {
                                    badge = "BLOG";
                                    link = `/blogs/${details.id}`;
                                  }

                                  return (
                                    <div key={item.id || `${item.content_type}-${item.content_id}-${details.id}`} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                      <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                        <img src={cover} alt={details.title} className="w-full h-full object-cover" />
                                        <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                                      </div>
                                      <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                          <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {getAuthorName(details)}</p>
                                        </div>
                                        <Link href={link} className="block text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                          Read Now
                                        </Link>
                                      </div>
                                    </div>
                                  );
                                })}

                                {libraryPerspective === "reader" && (
                                  <Link href="/marketplace" className="border-2 border-dashed border-zinc-200 rounded-sm flex flex-col items-center justify-center p-12 text-zinc-300 hover:border-black hover:text-black transition-all gap-4 min-h-[160px]">
                                    <Book size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Explore Marketplace</span>
                                  </Link>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed flex flex-col items-center justify-center p-12">
                                <p className="text-zinc-400 font-medium italic mb-6">
                                  {libraryPerspective === "reader" 
                                    ? `Your library has no ${libraryFilter === "all" ? "content" : libraryFilter + "s"} yet.` 
                                    : `You haven't published any ${libraryFilter === "all" ? "works" : libraryFilter + "s"} yet.`}
                                </p>
                                {libraryPerspective === "reader" ? (
                                  <div className="flex flex-wrap gap-4 justify-center">
                                    {(libraryFilter === "all" || libraryFilter === "book") && (
                                      <Link href="/marketplace" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">Explore Marketplace</Link>
                                    )}
                                    {(libraryFilter === "all" || libraryFilter === "article") && (
                                      <Link href="/articles" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Read Articles</Link>
                                    )}
                                    {(libraryFilter === "all" || libraryFilter === "blog") && (
                                      <Link href="/blogs" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Discover Blogs</Link>
                                    )}
                                  </div>
                                ) : (
                                  <Link href="/write" className="px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">
                                    Publish Your First {libraryFilter === "all" ? "Work" : libraryFilter.toUpperCase()}
                                  </Link>
                                )}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )
                  )}

                  {activeSection === "Bookmarks" && (
                    hasSavesError ? (
                      <div className="py-20 text-center bg-zinc-50 border border-red-100 rounded-sm border-dashed">
                        <p className="text-red-500 font-medium italic mb-4">Table 'saves' (Bookmarks) is missing from the database.</p>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">Please run the SQL migration script <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-black font-mono">supabase_engagement_schema.sql</code> in your Supabase SQL Editor to enable bookmarks.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Filter Pills */}
                        <div className="flex flex-wrap gap-2 mb-8 select-none">
                          {[
                            { value: "all", label: "All Content" },
                            { value: "book", label: "Books" },
                            { value: "article", label: "Articles" },
                            { value: "blog", label: "Blogs" }
                          ].map((f) => (
                            <button
                              key={f.value}
                              onClick={() => setBookmarkFilter(f.value as any)}
                              className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all border rounded-full cursor-pointer ${
                                bookmarkFilter === f.value
                                  ? "bg-black border-black text-white"
                                  : "bg-white border-zinc-200 text-zinc-400 hover:text-black hover:border-black"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* List Render */}
                        {(() => {
                          const filtered = bookmarkedItems.filter(item => {
                            if (bookmarkFilter === "all") return true;
                            return item.content_type === bookmarkFilter;
                          });

                          if (filtered.length > 0) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {filtered.map((item) => {
                                  const details = item.details;
                                  if (!details) return null;
                                  const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                  const isArticle = item.content_type === "article" || details.thumbnail_url !== undefined;
                                  const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                  let badge = "CONTENT";
                                  let link = "";
                                  let cover = details.cover_url || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                  if (isBook) {
                                    badge = "BOOK";
                                    link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                  } else if (isArticle) {
                                    badge = "ARTICLE";
                                    link = `/articles/${details.id}`;
                                  } else if (isBlog) {
                                    badge = "BLOG";
                                    link = `/blogs/${details.id}`;
                                  }

                                  return (
                                    <div key={item.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                      <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                        <img src={cover} alt={details.title} className="w-full h-full object-cover" />
                                        <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                                      </div>
                                      <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                          <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {getAuthorName(details)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Link href={link} className="flex-grow block text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                            Read Now
                                          </Link>
                                          <button 
                                            onClick={(e) => { e.preventDefault(); handleUnsave(item.id); }}
                                            className="px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-sm text-zinc-600 hover:text-black transition-all"
                                            title="Remove bookmark"
                                          >
                                            <Bookmark size={14} className="fill-current text-zinc-600" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            return (
                              <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed flex flex-col items-center justify-center p-12">
                                <p className="text-zinc-400 font-medium italic mb-8">
                                  You haven't bookmarked any {bookmarkFilter === "all" ? "files" : bookmarkFilter + "s"} yet.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                  {(bookmarkFilter === "all" || bookmarkFilter === "book") && (
                                    <Link href="/marketplace" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">Browse Books</Link>
                                  )}
                                  {(bookmarkFilter === "all" || bookmarkFilter === "article") && (
                                    <Link href="/articles" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Read Articles</Link>
                                  )}
                                  {(bookmarkFilter === "all" || bookmarkFilter === "blog") && (
                                    <Link href="/blogs" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Discover Blogs</Link>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )
                  )}

                  {activeSection === "Likes" && (
                    hasLikesError ? (
                      <div className="py-20 text-center bg-zinc-50 border border-red-100 rounded-sm border-dashed">
                        <p className="text-red-500 font-medium italic mb-4">Table 'likes' (Likes) is missing from the database.</p>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">Please run the SQL migration script <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-black font-mono">supabase_engagement_schema.sql</code> in your Supabase SQL Editor to enable liked content.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Filter Pills */}
                        <div className="flex flex-wrap gap-2 mb-8 select-none">
                          {[
                            { value: "all", label: "All Content" },
                            { value: "book", label: "Books" },
                            { value: "article", label: "Articles" },
                            { value: "blog", label: "Blogs" }
                          ].map((f) => (
                            <button
                              key={f.value}
                              onClick={() => setLikeFilter(f.value as any)}
                              className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all border rounded-full cursor-pointer ${
                                likeFilter === f.value
                                  ? "bg-black border-black text-white"
                                  : "bg-white border-zinc-200 text-zinc-400 hover:text-black hover:border-black"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* List Render */}
                        {(() => {
                          const filtered = likedItems.filter(item => {
                            if (likeFilter === "all") return true;
                            return item.content_type === likeFilter;
                          });

                          if (filtered.length > 0) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {filtered.map((item) => {
                                  const details = item.details;
                                  if (!details) return null;
                                  const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                  const isArticle = item.content_type === "article" || details.thumbnail_url !== undefined;
                                  const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                  let badge = "CONTENT";
                                  let link = "";
                                  let cover = details.cover_url || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                  if (isBook) {
                                    badge = "BOOK";
                                    link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                  } else if (isArticle) {
                                    badge = "ARTICLE";
                                    link = `/articles/${details.id}`;
                                  } else if (isBlog) {
                                    badge = "BLOG";
                                    link = `/blogs/${details.id}`;
                                  }

                                  return (
                                    <div key={item.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                      <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                        <img src={cover} alt={details.title} className="w-full h-full object-cover" />
                                        <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                                      </div>
                                      <div className="flex-grow flex flex-col justify-between">
                                        <div>
                                          <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {getAuthorName(details)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Link href={link} className="flex-grow block text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                            Read Now
                                          </Link>
                                          <button 
                                            onClick={(e) => { e.preventDefault(); handleUnlike(item.id); }}
                                            className="px-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-sm text-rose-500 hover:text-rose-600 transition-all"
                                            title="Unlike"
                                          >
                                            <Heart size={14} className="fill-current text-rose-500" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            return (
                              <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed col-span-full flex flex-col items-center justify-center p-12">
                                <p className="text-zinc-400 font-medium italic mb-8">
                                  You haven't liked any {likeFilter === "all" ? "files" : likeFilter + "s"} yet.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                  {(likeFilter === "all" || likeFilter === "book") && (
                                    <Link href="/marketplace" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">Browse Books</Link>
                                  )}
                                  {(likeFilter === "all" || likeFilter === "article") && (
                                    <Link href="/articles" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Read Articles</Link>
                                  )}
                                  {(likeFilter === "all" || likeFilter === "blog") && (
                                    <Link href="/blogs" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Discover Blogs</Link>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )
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

      {/* ── Webcam Camera Modal ── */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseCameraModal(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-sm shadow-2xl overflow-hidden w-full max-w-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <Camera size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Take a Photo</p>
                    <p className="text-[9px] text-zinc-400">Position yourself and click Capture</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCameraModal}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>

              {/* Video / Preview Area */}
              <div className="relative bg-zinc-950 aspect-video flex items-center justify-center overflow-hidden">
                {/* Live video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    capturedImage ? 'hidden' : 'block'
                  }`}
                />

                {/* Captured snapshot preview */}
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Loading state before camera is ready */}
                {!cameraReady && !capturedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                    <Loader2 className="animate-spin" size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Starting camera...</span>
                  </div>
                )}

                {/* Overlay frame guide */}
                {cameraReady && !capturedImage && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-2 border-white/30 border-dashed" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="px-6 py-5 flex items-center justify-between bg-zinc-50 border-t border-zinc-100">
                {!capturedImage ? (
                  <>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      {cameraReady ? 'Ready — align your face in the circle' : 'Requesting camera access...'}
                    </p>
                    <button
                      onClick={handleCapture}
                      disabled={!cameraReady}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                    >
                      <Camera size={14} />
                      Capture
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRetake}
                      className="flex items-center gap-2 px-5 py-3 border border-zinc-300 text-zinc-700 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all cursor-pointer"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleUsePhoto}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                    >
                      <UploadCloud size={14} />
                      Use This Photo
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <img 
                        src={item.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                        alt={item.name} 
                        className="w-10 h-10 rounded-full object-cover border border-zinc-100 shrink-0" 
                      />
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
