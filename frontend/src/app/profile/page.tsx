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
  ShieldAlert,
  Feather,
  Loader2,
  LogOut,
  Sparkles,
  Image as ImageIcon,
  X,
  Star,
  Bell,
  Check,
  Globe,
  BarChart2,
  ShoppingBag,
  Trash2,
  Plus,
  Minus
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { uploadAvatar } from "@/lib/avatar";
import { ensureAuthorProfile } from "@/lib/author";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { OptimizedImage } from "@/components/OptimizedImage";
import TranslationDrawer from "@/components/TranslationDrawer";
import { useRouter } from "next/navigation";
import { useBookmarks } from "@/hooks/useBookmarks";
import UpiManagementModal from "@/components/UpiManagementModal";
import FoundingBadge from "@/components/ui/FoundingBadge";

export default function ProfilePage() {
  const router = useRouter();
  const { bookmarks, lists, toggleBookmark } = useBookmarks();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("Library");
  const [stats, setStats] = useState({ library: 0, bookmarks: 0, earnings: 0, followers: 0, following: 0 });
  const [founderInvite, setFounderInvite] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [activeUpiId, setActiveUpiId] = useState<string | null>(null);
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [lastUpiChange, setLastUpiChange] = useState<string | null>(null);
  const [pendingUpiRequest, setPendingUpiRequest] = useState<any>(null);
  
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiModalMode, setUpiModalMode] = useState<'setup' | 'change'>('setup');
  
  const fetchUpiData = async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch user profile UPI data
      const { data: userData } = await supabase
        .from("users")
        .select("active_upi_id, is_upi_verified, last_upi_change_at")
        .eq("id", user.id)
        .single();
      
      if (userData) {
        setActiveUpiId(userData.active_upi_id);
        setIsUpiVerified(userData.is_upi_verified);
        setLastUpiChange(userData.last_upi_change_at);
      }

      // 2. Fetch pending request
      const { data: requests } = await supabase
        .from("upi_change_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending");
      
      if (requests && requests.length > 0) {
        setPendingUpiRequest(requests[0]);
      } else {
        setPendingUpiRequest(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUpiData();
  }, [user]);

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

  // Borderless Reading States
  const [translationDrawerOpen, setTranslationDrawerOpen] = useState(false);
  const [drawerContentId, setDrawerContentId] = useState("");

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

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeToAuthor = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to upgrade your profile to Author & Reader? This will allow you to publish books, stories, and blogs.")) {
      return;
    }
    
    setIsUpgrading(true);
    setToast(null);
    try {
      // 1. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { role: "Author" }
      });
      if (authError) throw authError;

      // 2. Ensure author profile in database
      await ensureAuthorProfile(supabase, user.id);

      // 3. Sync local storage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.role = "Author";
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      setToast({ message: "Successfully upgraded to Author & Reader! Unlocking features...", type: "success" });
      
      // Reload page after a delay to refresh Navbar and state layout cleanly
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error("Upgrade error:", err);
      setToast({ message: err.message || "Failed to upgrade account.", type: "error" });
    } finally {
      setIsUpgrading(false);
    }
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
  const [libraryFilter, setLibraryFilter] = useState<"all" | "book" | "story" | "blog">("all");
  const [bookmarkFilter, setBookmarkFilter] = useState<"all" | "book" | "story" | "blog">("all");
  const [likeFilter, setLikeFilter] = useState<"all" | "book" | "story" | "blog">("all");
  const { cart, updateQuantity, removeFromCart, clearCart, cartCount, cartSubtotal } = useCart();
  const [readedItems, setReadedItems] = useState<any[]>([]);
  const [publishedItems, setPublishedItems] = useState<any[]>([]);

  const isContentDraft = (item: any) => {
    const details = item.details;
    if (!details) return false;
    return details.status === "Draft" || details.status === "draft" || (details.content && details.content.startsWith("[DRAFT]")) || (details.body && details.body.startsWith("[DRAFT]"));
  };
  const isCreator = publishedItems.filter((item) => !isContentDraft(item)).length > 0;
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

  function toOriginalId(uuid: string): string {
    if (!uuid) return uuid;
    if (typeof uuid === "string" && uuid.startsWith("00000000-0000-4000-8000-")) {
      const hex = uuid.replace("00000000-0000-4000-8000-", "");
      try {
        const str = Buffer.from(hex, "hex").toString("utf8").replace(/\0/g, "");
        if (str) return str;
      } catch (e) {}
    }
    return uuid;
  }

  const fetchItemsDetails = async (items: any[]) => {
    if (!items || !items.length) return [];

    const isStory = (type: string) => ["story", "article", "post"].includes(type?.toLowerCase());
    const isBlog = (type: string) => ["blog"].includes(type?.toLowerCase());
    const isBook = (type: string) => ["book"].includes(type?.toLowerCase());

    const bookRawIds = items.filter(i => isBook(i.content_type)).map(i => i.content_id);
    const storyRawIds = items.filter(i => isStory(i.content_type)).map(i => i.content_id);
    const blogRawIds = items.filter(i => isBlog(i.content_type)).map(i => i.content_id);

    const bookIds = Array.from(new Set(bookRawIds.flatMap(id => [id, toOriginalId(id)]))).filter(Boolean);
    const storyIds = Array.from(new Set(storyRawIds.flatMap(id => [id, toOriginalId(id)]))).filter(Boolean);
    const blogIds = Array.from(new Set(blogRawIds.flatMap(id => [id, toOriginalId(id)]))).filter(Boolean);

    const [booksRes, storiesRes, manuscriptsRes, blogsRes] = await Promise.all([
      bookIds.length 
        ? supabase.from("books").select("*, authors:author_id(*, users:user_id(name))").in("id", bookIds) 
        : Promise.resolve({ data: [] }),
      storyIds.length 
        ? supabase.from("stories").select("*, authors:author_id(*, users:user_id(name))").in("id", storyIds) 
        : Promise.resolve({ data: [] }),
      storyIds.length
        ? supabase.from("manuscripts").select("*").in("id", storyIds)
        : Promise.resolve({ data: [] }),
      blogIds.length 
        ? supabase.from("blogs").select("*, authors:author_id(*, users:user_id(name))").in("id", blogIds) 
        : Promise.resolve({ data: [] })
    ]);

    const booksMap = new Map();
    (booksRes.data || []).forEach((b: any) => {
      booksMap.set(b.id, { ...b, type: "book" });
    });

    const storiesMap = new Map();
    (storiesRes.data || []).forEach((s: any) => {
      storiesMap.set(s.id, { ...s, type: "story" });
    });

    const manuscriptsMap = new Map();
    (manuscriptsRes.data || []).forEach((m: any) => {
      manuscriptsMap.set(m.id, { ...m, type: "story" });
    });

    const blogsMap = new Map();
    (blogsRes.data || []).forEach((b: any) => {
      blogsMap.set(b.id, { ...b, type: "blog" });
    });

    return items.map(item => {
      let details = null;
      const targetId = item.content_id;
      const origId = toOriginalId(targetId);

      if (isBook(item.content_type)) {
        details = booksMap.get(targetId) || booksMap.get(origId);
      } else if (isStory(item.content_type)) {
        details = storiesMap.get(targetId) || storiesMap.get(origId) || manuscriptsMap.get(targetId) || manuscriptsMap.get(origId);
        if (!details) {
          details = {
            id: origId || targetId,
            title: item.title || `Story #${origId || targetId}`,
            body: item.description || "A captivating story from Writersthing.",
            cover_image: item.cover_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800",
            work_type: "story",
            type: "story"
          };
        }
      } else if (isBlog(item.content_type)) {
        details = blogsMap.get(targetId) || blogsMap.get(origId);
      }

      const normalizedContentType = isStory(item.content_type) 
        ? "story" 
        : isBlog(item.content_type) 
        ? "blog" 
        : isBook(item.content_type) 
        ? "book" 
        : item.content_type;

      return details ? { ...item, content_type: normalizedContentType, details } : null;
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
    if (!parsedUser.role) {
      parsedUser.role = "Author";
    }
    setUser(parsedUser);

    try {
      // Set initial bio
      if (parsedUser.bio) {
        setBio(parsedUser.bio);
      }
      
      // Update from database to get latest info including bio
      supabase.from('users').select('*').eq('id', parsedUser.id).single().then(({ data }: any) => {
        if (data) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          if (data.bio) setBio(data.bio);
        }
      });

      // Fetch stats and library in parallel
      const [libRes, authorRes, manuscriptRes, savesRes, likesRes, impRes, followersCountRes, followingCountRes, founderRes] = await Promise.all([
        supabase.from("library").select("*, books(*, authors:author_id(*, users:user_id(name)))").eq("user_id", parsedUser.id),
        supabase.from("authors").select("*").eq("user_id", parsedUser.id).maybeSingle(),
        supabase.from("books").select("*").eq("author_id", parsedUser.id),
        supabase.from("saves").select("*").eq("user_id", parsedUser.id),
        supabase.from("likes").select("*").eq("user_id", parsedUser.id),
        supabase.from("impressions").select("*").eq("viewer_id", parsedUser.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", parsedUser.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", parsedUser.id),
        supabase.from("founding_writers").select("*").eq("user_id", parsedUser.id).eq("status", "accepted").maybeSingle()
      ]);

      if (founderRes.data) setFounderInvite(founderRes.data);

      if (libRes.error) {
        console.warn("Library table error:", libRes.error.message);
        if (libRes.error.code === "PGRST205") setHasLibraryError(true);
      } else if (libRes.data) {
        setPurchasedBooks(libRes.data.map((l: any) => l.books).filter(Boolean));
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

      // Merge saved stories and items into My Library
      if (savesRes.data && savesRes.data.length > 0) {
        const seen = new Set(readedSaves.map((i: any) => `${i.content_type}-${i.content_id}`));
        savesRes.data.forEach((save: any) => {
          const key = `${save.content_type}-${save.content_id}`;
          if (!seen.has(key)) {
            seen.add(key);
            readedSaves.push({
              content_type: save.content_type,
              content_id: save.content_id,
              created_at: save.created_at || new Date().toISOString()
            });
          }
        });
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
          const [pubBooksRes, pubStoriesRes, pubBlogsRes] = await Promise.all([
            supabase.from("books").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", parsedUser.id),
            supabase.from("stories").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", authorProfile.id),
            supabase.from("blogs").select("*, authors:author_id(*, users:user_id(name))").eq("author_id", authorProfile.id)
          ]);
          
          const books = (pubBooksRes.data || []).map((b: any) => ({ ...b, type: "book", content_type: "book", details: b }));
          const stories = (pubStoriesRes.data || []).map((a: any) => ({ ...a, type: "story", content_type: "story", details: a }));
          const blogs = (pubBlogsRes.data || []).map((b: any) => ({ ...b, type: "blog", content_type: "blog", details: b }));
          
          setPublishedItems([...books, ...stories, ...blogs]);
        }
      }

      const libraryCount = libRes.data?.length || 0;
      const bookmarksCount = savesRes.data?.length || 0;

      setStats({
        library: libraryCount,
        bookmarks: bookmarksCount,
        earnings: authorRes.data?.total_earnings || 0,
        followers: followersCountRes.count || 0,
        following: followingCountRes.count || 0
      });

    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      if (!isCreator && activeSection === "Analytics") {
        setActiveSection("Library");
      }
    }
  }, [activeSection, isCreator, loading]);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Initializing Hub...</div>;
  if (!user) return null;

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-4 md:pt-8 pb-12 md:pb-20">
        <div className="unified-axis max-w-6xl">
          {/* Profile Header */}
          <header className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-zinc-100">
            <div className="relative" style={{ userSelect: 'none' }}>
              {/* Avatar circle */}
              <div className="w-32 h-32 md:w-36 md:h-36 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center text-4xl font-bold text-zinc-300 overflow-hidden shadow-xl relative">
                {user.user_metadata?.avatar_url || user.avatar_url ? (
                  <OptimizedImage src={user.user_metadata?.avatar_url || user.avatar_url} alt="Profile" variant="profile" className="w-full h-full" />
                ) : (
                  (user.user_metadata?.name || user.name || user.email || 'U').charAt(0).toUpperCase()
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
                <h1 className="text-2xl md:text-4xl font-heading font-bold tracking-tight text-zinc-900">{user.name}</h1>
                
                {reputation && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-full w-fit mx-auto md:mx-0">
                    <Sparkles size={11} className="text-zinc-600 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                      {reputation.reputation_level} ({reputation.reputation_score} pts)
                    </span>
                  </div>
                )}

                {user.role === "Admin" && (
                  <Link href="/admin" className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 w-fit mx-auto md:mx-0 hover:scale-105 transition-all">
                    <ShieldCheck size={10} /> Admin Access
                  </Link>
                )}
              </div>
              <p className="text-lg text-zinc-600 font-normal mb-6 max-w-xl whitespace-pre-wrap">
                {user.bio || "Crafting stories, exploring digital horizons."}
              </p>
              
              {/* Founding Writer Card */}
              {founderInvite && (
                <div className="flex items-center gap-4 p-4 mb-6 bg-zinc-50 border border-zinc-100 rounded-sm shadow-inner max-w-xl mx-auto md:mx-0 select-none">
                  <FoundingBadge founderNumber={founderInvite.founder_number ? parseInt(founderInvite.founder_number.replace('#', '')) : null} isFoundingWriter={true} className="relative scale-110" size={48} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Founding Writer</p>
                    <p className="text-sm font-bold text-zinc-800">Founder {founderInvite.founder_number}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">One of the earliest members of Writersthing. Accepted on {new Date(founderInvite.accepted_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-center md:justify-start gap-8 mt-4 mb-8 text-sm select-none">
                {user?.role !== "Reader" && (
                  <>
                    <button 
                      onClick={fetchFollowers} 
                      className="font-medium hover:text-black transition-colors flex items-center gap-2 group cursor-pointer border-0 bg-transparent p-0"
                    >
                      <span className="font-heading font-semibold text-lg text-zinc-800 group-hover:text-black transition-colors">{stats.followers}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Followers</span>
                    </button>
                    <div className="w-px h-5 bg-zinc-200 my-auto" />
                  </>
                )}
                <button 
                  onClick={fetchFollowing} 
                  className="font-medium hover:text-black transition-colors flex items-center gap-2 group cursor-pointer border-0 bg-transparent p-0"
                >
                  <span className="font-heading font-semibold text-lg text-zinc-800 group-hover:text-black transition-colors">{stats.following}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Following</span>
                </button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button onClick={() => setActiveSection("Settings")} className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2 cursor-pointer">
                  <Settings size={14} /> Edit Profile
                </button>
                {user?.role === "Reader" ? (
                  <button
                    onClick={handleUpgradeToAuthor}
                    disabled={isUpgrading}
                    className="px-8 py-3 bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpgrading ? <Loader2 size={14} className="animate-spin" /> : <Feather size={14} />}
                    {isUpgrading ? "Upgrading..." : "Become an Author"}
                  </button>
                ) : (
                  <Link href="/editor" className="px-8 py-3 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
                    <Feather size={14} /> Publish Work
                  </Link>
                )}
              </div>

            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Unified Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <nav className="flex flex-col gap-2 sticky top-40">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-2 px-6">Reader Tools</p>
                <ProfileNavBtn icon={<Bell size={18} />} label="Notifications" active={activeSection === "Notifications"} onClick={() => setActiveSection("Notifications")} />
                <ProfileNavBtn icon={<Star size={18} />} label="Reviews" active={activeSection === "Reviews"} onClick={() => setActiveSection("Reviews")} />
                <ProfileNavBtn icon={<Book size={18} />} label="My Library" active={activeSection === "Library"} onClick={() => setActiveSection("Library")} />
                <ProfileNavBtn icon={<Bookmark size={18} />} label="Bookmarks" active={activeSection === "Bookmarks"} onClick={() => setActiveSection("Bookmarks")} />
                <ProfileNavBtn icon={<Heart size={18} />} label="Liked Content" active={activeSection === "Likes"} onClick={() => setActiveSection("Likes")} />
                <ProfileNavBtn icon={<ShoppingBag size={18} />} label="My Cart" active={activeSection === "Cart"} onClick={() => setActiveSection("Cart")} />
                {isCreator && (
                  <ProfileNavBtn icon={<BarChart2 size={18} />} label="Analytics" active={activeSection === "Analytics"} onClick={() => setActiveSection("Analytics")} />
                )}
                {user?.role !== "Reader" && (
                  <ProfileNavBtn icon={<Settings size={18} />} label="Settings" active={activeSection === "Settings"} onClick={() => setActiveSection("Settings")} />
                )}
                <ProfileNavBtn icon={<Sparkles size={18} />} label="Preferences" active={activeSection === "Preferences"} onClick={() => setActiveSection("Preferences")} />
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
                            { value: "story", label: "Stories" },
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
                            if (libraryPerspective === "reader") {
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  {filtered.map((item) => {
                                    const details = item.details;
                                    if (!details) return null;
                                    const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                    const isStory = item.content_type === "story" || details.cover_image !== undefined || details.thumbnail_url !== undefined;
                                    const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                    let badge = "CONTENT";
                                    let link = "";
                                    let cover = details.cover_url || details.cover_image || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                    if (isBook) {
                                      badge = "BOOK";
                                      link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                    } else if (isStory) {
                                      badge = "STORY";
                                      link = `/stories/${details.id}`;
                                    } else if (isBlog) {
                                      badge = "BLOG";
                                      link = `/blogs/${details.id}`;
                                    }

                                    return (
                                      <div key={item.id || `${item.content_type}-${item.content_id}-${details.id}`} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                        <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                          <OptimizedImage src={cover} alt={details.title} variant="book-cover" className="w-full h-full" />
                                          <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between">
                                          <div>
                                            <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {getAuthorName(details)}</p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Link href={link} className="flex-grow text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                              Read Now
                                            </Link>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <Link href="/marketplace" className="border-2 border-dashed border-zinc-200 rounded-sm flex flex-col items-center justify-center p-12 text-zinc-300 hover:border-black hover:text-black transition-all gap-4 min-h-[160px]">
                                    <Book size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Explore Marketplace</span>
                                  </Link>
                                </div>
                              );
                            } else {
                              // Render Author Portfolio
                              const drafts = filtered.filter(isContentDraft);
                              const published = filtered.filter(item => !isContentDraft(item));


                              const renderCard = (item: any, isDraft: boolean) => {
                                const details = item.details;
                                if (!details) return null;
                                const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                const isStory = item.content_type === "story" || details.cover_image !== undefined || details.thumbnail_url !== undefined;
                                const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                let badge = "CONTENT";
                                let link = "";
                                let cover = details.cover_url || details.cover_image || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                if (isBook) {
                                  badge = "BOOK";
                                  link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                } else if (isStory) {
                                  badge = isDraft ? "DRAFT" : "STORY";
                                  link = isDraft ? `/write/${details.id}` : `/stories/${details.id}`;
                                } else if (isBlog) {
                                  badge = isDraft ? "DRAFT" : "BLOG";
                                  link = isDraft ? `/write/${details.id}` : `/blogs/${details.id}`;
                                }

                                return (
                                  <div key={item.id || `${item.content_type}-${item.content_id}-${details.id}`} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                    <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                        <OptimizedImage src={cover} alt={details.title} variant="book-cover" className="w-full h-full" />
                                      <span className={`absolute top-2 left-2 px-2 py-0.5 text-[7px] font-black tracking-widest ${isDraft ? 'bg-amber-500 text-white' : 'bg-black text-white'}`}>{badge}</span>
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between">
                                      <div>
                                        <h3 className="font-heading font-bold text-xl mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {getAuthorName(details)}</p>
                                        <button 
                                          onClick={() => { setDrawerContentId(details.id); setTranslationDrawerOpen(true); }}
                                          className="mt-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-black"
                                        >
                                          <Globe size={10} /> Translate
                                        </button>
                                      </div>
                                      <div className="flex gap-2">
                                        <Link href={link} className="flex-grow text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                                          {isDraft ? "Edit Draft" : "Read Now"}
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <div className="space-y-12">
                                  {drafts.length > 0 && (
                                    <div>
                                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> My Drafts ({drafts.length})
                                      </h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {drafts.map(d => renderCard(d, true))}
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" /> Published Works ({published.length})
                                    </h3>
                                    {published.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {published.map(p => renderCard(p, false))}
                                      </div>
                                    ) : (
                                      <div className="py-12 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed">
                                        <p className="text-zinc-400 font-medium italic text-xs">No published works found.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
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
                                    {(libraryFilter === "all" || libraryFilter === "story") && (
                                      <Link href="/stories" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Read Stories</Link>
                                    )}
                                    {(libraryFilter === "all" || libraryFilter === "blog") && (
                                      <Link href="/blogs" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Discover Blogs</Link>
                                    )}
                                  </div>
                                ) : (
                                  <Link href="/editor" className="px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">
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
                      <div className="text-center py-20 bg-zinc-50 border border-zinc-100 rounded-sm">
                        <p className="text-red-500 font-medium italic mb-4">Table 'saves' is missing from the database.</p>
                      </div>
                    ) : bookmarkedItems.length === 0 ? (
                      <div className="text-center py-20 bg-zinc-50 border border-zinc-100 rounded-sm">
                        <Bookmark className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-black uppercase tracking-tight text-black mb-2">No bookmarks yet</h3>
                        <p className="text-sm font-medium text-zinc-500">Save your favorite stories and books to read them later.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h2 className="text-xl font-black uppercase tracking-tight border-b border-zinc-100 pb-2">Saved Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {bookmarkedItems.map((item) => {
                            const details = item.details;
                            if (!details) return null;
                            const isBook = item.content_type === "book" || details.cover_url !== undefined;
                            const isStory = item.content_type === "story" || details.cover_image !== undefined || details.thumbnail_url !== undefined;
                            const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                            let badge = "CONTENT";
                            let link = "";
                            let cover = details.cover_url || details.cover_image || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                            if (isBook) {
                              badge = "BOOK";
                              link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                            } else if (isStory) {
                              badge = "STORY";
                              link = `/stories/${details.id}`;
                            } else if (isBlog) {
                              badge = "BLOG";
                              link = `/blogs/${details.id}`;
                            }

                            return (
                              <div key={item.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all relative">
                                <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                  <OptimizedImage src={cover} alt={details.title} variant="book-cover" className="w-full h-full" />
                                  <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                                </div>
                                <div className="flex-grow flex flex-col justify-between">
                                  <div>
                                    <h3 className="font-heading font-bold text-sm mb-1 uppercase tracking-tight leading-none line-clamp-2">{details.title}</h3>
                                    <p className="text-xs font-medium text-zinc-500 line-clamp-2 mb-3">{details.description || details.body || "No description available."}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Link
                                      href={link}
                                      className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-sm hover:bg-zinc-800 transition-colors"
                                    >
                                      Read Now
                                    </Link>
                                    <button
                                      onClick={() => handleUnsave(item.id)}
                                      className="text-[9px] font-black uppercase tracking-widest border border-red-200 text-red-500 px-4 py-2 rounded-sm hover:bg-red-50 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                            { value: "story", label: "Stories" },
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
                            if (likeFilter === "story") return ["story", "article", "post"].includes(item.content_type?.toLowerCase());
                            return item.content_type === likeFilter;
                          });

                          if (filtered.length > 0) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {filtered.map((item) => {
                                  const details = item.details;
                                  if (!details) return null;
                                  const isBook = item.content_type === "book" || details.cover_url !== undefined;
                                  const isStory = item.content_type === "story" || details.cover_image !== undefined || details.thumbnail_url !== undefined;
                                  const isBlog = item.content_type === "blog" || details.banner_url !== undefined;

                                  let badge = "CONTENT";
                                  let link = "";
                                  let cover = details.cover_url || details.cover_image || details.thumbnail_url || details.banner_url || "/placeholder-cover.jpg";

                                  if (isBook) {
                                    badge = "BOOK";
                                    link = `/read/pdf?id=${details.id}&title=${encodeURIComponent(details.title)}`;
                                  } else if (isStory) {
                                    badge = "STORY";
                                    link = `/stories/${details.id}`;
                                  } else if (isBlog) {
                                    badge = "BLOG";
                                    link = `/blogs/${details.id}`;
                                  }

                                  return (
                                    <div key={item.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                                      <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative">
                                          <OptimizedImage src={cover} alt={details.title} variant="book-cover" className="w-full h-full" />
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
                                  {(likeFilter === "all" || likeFilter === "story") && (
                                    <Link href="/stories" className="px-8 py-3 border border-black text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black hover:text-white transition-all">Read Stories</Link>
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

                  {activeSection === "Cart" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                        <div>
                          <h2 className="font-heading font-black text-2xl uppercase tracking-tight">My Shopping Cart ({cartCount})</h2>
                          <p className="text-xs text-zinc-400 font-medium">Manage items added to your cart or proceed to checkout.</p>
                        </div>
                        <Link href="/cart" className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2">
                          Full Cart View <ArrowRight size={14} />
                        </Link>
                      </div>

                      {cart.length === 0 ? (
                        <div className="py-16 text-center space-y-4 border border-dashed border-zinc-200 rounded-xl p-8">
                          <ShoppingBag size={32} className="text-zinc-300 mx-auto" />
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Your cart is currently empty</p>
                          <Link href="/marketplace" className="inline-block px-6 py-2.5 border border-zinc-200 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">
                            Browse Marketplace
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <div key={item.id} className="p-4 border border-zinc-100 rounded-xl bg-zinc-50 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-16 bg-zinc-200 rounded-lg overflow-hidden shrink-0">
                                  <OptimizedImage src={item.cover_url || "/placeholder-cover.jpg"} alt={item.title} variant="book-cover" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <h4 className="font-heading font-bold text-base uppercase tracking-tight">{item.title}</h4>
                                  <p className="text-xs text-zinc-400">by {item.author_name || "Author"}</p>
                                  <p className="text-xs font-black text-zinc-900 mt-1">${item.price.toFixed(2)} x {item.quantity}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border border-zinc-200 bg-white rounded-lg flex items-center justify-center text-xs font-bold hover:bg-zinc-100 cursor-pointer">-</button>
                                <span className="text-xs font-black">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border border-zinc-200 bg-white rounded-lg flex items-center justify-center text-xs font-bold hover:bg-zinc-100 cursor-pointer">+</button>
                                <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg ml-2 cursor-pointer" title="Remove"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          ))}

                          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                            <div>
                              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Subtotal</span>
                              <p className="text-xl font-black text-zinc-900">${cartSubtotal.toFixed(2)}</p>
                            </div>
                            <Link href="/cart" className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                              Proceed to Checkout
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === "Preferences" && (
                    <PreferencesSettings />
                  )}

                  {activeSection === "Analytics" && isCreator && (() => {
                    const nonDrafts = publishedItems.filter((i) => !isContentDraft(i));
                    const storiesReach = nonDrafts.filter((i) => i.type === "story").reduce((acc, s) => acc + (s.views || 0), 0);
                    const blogsReach = nonDrafts.filter((i) => i.type === "blog").reduce((acc, b) => acc + (b.views || 0), 0);
                    const totalSales = nonDrafts.filter((i) => i.type === "book").reduce((acc, b) => acc + (b.sales_count || 0), 0);
                    const totalRevenue = nonDrafts.filter((i) => i.type === "book").reduce((acc, b) => acc + ((b.price || 0) * (b.sales_count || 0)), 0);
                    const totalLikes = nonDrafts.reduce((acc, i) => acc + (i.likes_count || 0), 0);
                    const totalComments = nonDrafts.reduce((acc, i) => acc + (i.comments_count || 0), 0);

                    return (
                      <div className="space-y-12">
                        <div>
                          <h2 className="text-2xl font-heading font-black uppercase tracking-tight mb-6 pb-4 border-b border-zinc-100">Profile & Audience Reach</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <AnalyticsCard title="Blogs Reach" value={blogsReach} unit="Views" />
                            <AnalyticsCard title="Stories Reach" value={storiesReach} unit="Views" />
                            <AnalyticsCard title="Total Followers" value={stats.followers} unit="Accounts" />
                          </div>
                        </div>

                        <div>
                          <h2 className="text-2xl font-heading font-black uppercase tracking-tight mb-6 pb-4 border-b border-zinc-100">Sales Analytics</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <AnalyticsCard title="Total Books Sold" value={totalSales} unit="Units" />
                            <AnalyticsCard title="Gross Revenue" value={`₹${totalRevenue.toLocaleString()}`} unit="INR" />
                            <AnalyticsCard title="Avg. Retention" value="N/A" unit="Rate" />
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-100 p-12 rounded-sm text-center">
                          <TrendingUp size={48} className="mx-auto text-zinc-200 mb-6" />
                          <h3 className="text-2xl font-heading font-black uppercase tracking-tight mb-4">Total Engagement</h3>
                          <div className="grid grid-cols-2 max-w-sm mx-auto gap-8 mb-8">
                            <div>
                              <p className="text-3xl font-black text-black">{totalLikes}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">Likes</p>
                            </div>
                            <div>
                              <p className="text-3xl font-black text-black">{totalComments}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">Comments</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {activeSection === "Settings" && (
                    <div className="bg-white border border-zinc-150 p-8 md:p-12 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-left space-y-12">
                      <div>
                        <h3 className="font-heading font-black text-2xl uppercase tracking-tight mb-2">Profile Settings</h3>
                        <p className="text-xs text-zinc-400 italic">Manage your account information and payout preferences.</p>
                      </div>

                      {/* Section 1: Account Information */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pb-2 border-b border-zinc-100">1. Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Display Name</span>
                            <span className="text-sm font-bold text-zinc-900 block bg-zinc-50 border border-zinc-100 p-4 rounded-sm select-none">{user.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Email Address</span>
                            <span className="text-sm font-bold text-zinc-900 block bg-zinc-50 border border-zinc-100 p-4 rounded-sm select-none">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 1.5: Public Profile */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pb-2 border-b border-zinc-100">1.5 Public Profile</h4>
                        <div className="max-w-2xl space-y-4">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Author Bio (500-1000 words recommended)</span>
                            <textarea 
                              value={bio}
                              onChange={(e) => {
                                setBio(e.target.value);
                                e.target.style.height = "150px";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              placeholder="Tell your readers about yourself, your writing journey, and what they can expect from your books..."
                              className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-sm outline-none text-sm min-h-[150px] overflow-hidden focus:border-black transition-colors"
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {bio.trim() ? bio.trim().split(/\s+/).length : 0} Words
                              </span>
                              <button 
                                onClick={async () => {
                                  setSavingBio(true);
                                  try {
                                    const res = await fetch("/api/user/update-bio", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ userId: user.id, bio })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setToast({ message: "Bio updated successfully", type: "success" });
                                      setUser({ ...user, bio });
                                      localStorage.setItem("user", JSON.stringify({ ...user, bio }));
                                    } else {
                                      setToast({ message: data.error || "Failed to save bio", type: "error" });
                                    }
                                  } catch (e) {
                                    setToast({ message: "An error occurred", type: "error" });
                                  } finally {
                                    setSavingBio(false);
                                  }
                                }}
                                disabled={savingBio}
                                className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors rounded-sm disabled:opacity-50"
                              >
                                {savingBio ? "Saving..." : "Save Bio"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Secure UPI Payment Settings */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pb-2 border-b border-zinc-100">2. Secure Payout Settings</h4>
                        <div className="max-w-xl space-y-6">
                          
                          {/* State 1: No UPI Setup */}
                          {!activeUpiId && !pendingUpiRequest && (
                            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-sm">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center shrink-0">
                                  <ShieldCheck size={18} className="text-zinc-400" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-zinc-900 mb-1">Setup Payout UPI</h5>
                                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">
                                    You need a verified UPI ID to receive royalty payouts from your published manuscripts.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setUpiModalMode('setup');
                                      setIsUpiModalOpen(true);
                                    }}
                                    className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors rounded-sm shadow-sm"
                                  >
                                    Verify & Save UPI
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* State 2 & 4: Verified UPI / Cooldown Active */}
                          {activeUpiId && !pendingUpiRequest && (
                            <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Current Payout UPI</label>
                              <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-sm font-bold text-zinc-900 tracking-wide">{activeUpiId.replace(/^(.{2}).*(@.*)$/, "$1***$2")}</span>
                                  {isUpiVerified && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 rounded-sm border border-green-100 flex items-center gap-1">
                                      <Check size={10} /> Verified
                                    </span>
                                  )}
                                </div>
                                <div>
                                  {lastUpiChange && (Date.now() - new Date(lastUpiChange).getTime()) / (1000 * 60 * 60 * 24) < 30 ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                      Cooldown: {Math.ceil(30 - (Date.now() - new Date(lastUpiChange).getTime()) / (1000 * 60 * 60 * 24))} days left
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setUpiModalMode('change');
                                        setIsUpiModalOpen(true);
                                      }}
                                      className="text-[9px] font-black uppercase tracking-widest text-black hover:text-zinc-600 transition-colors"
                                    >
                                      Request Change
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium leading-relaxed">
                                For security, changing your UPI requires password verification, email OTP, and a 24-hour security hold.
                              </p>
                            </div>
                          )}

                          {/* State 3: Pending Request */}
                          {pendingUpiRequest && (
                            <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Current Payout UPI</label>
                              <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-sm opacity-75">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-sm font-bold text-zinc-900 tracking-wide">{activeUpiId?.replace(/^(.{2}).*(@.*)$/, "$1***$2") || 'None'}</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 rounded-sm border border-green-100">Active</span>
                                </div>
                              </div>

                              <div className="p-4 bg-orange-50 border border-orange-200 rounded-sm mt-4">
                                <div className="flex items-start gap-3">
                                  <ShieldAlert className="text-orange-500 shrink-0" size={16} />
                                  <div>
                                    <h5 className="text-xs font-bold text-orange-900 mb-1">Security Hold Active</h5>
                                    <p className="text-[10px] text-orange-700 leading-relaxed mb-3">
                                      A request to change your UPI ID to <strong>{pendingUpiRequest.new_upi_id}</strong> is pending. It will be activated automatically on {new Date(pendingUpiRequest.activate_after).toLocaleString()}.
                                    </p>
                                    <button
                                      onClick={async () => {
                                        if (confirm("Are you sure you want to cancel the pending UPI change request?")) {
                                          try {
                                            const res = await fetch("/api/upi/cancel-change", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ userId: user.id }),
                                            });
                                            if (res.ok) {
                                              setToast({ message: "UPI change request cancelled", type: "success" });
                                              fetchUpiData();
                                            } else {
                                              setToast({ message: "Failed to cancel request", type: "error" });
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          }
                                        }
                                      }}
                                      className="px-4 py-2 bg-orange-100 text-orange-800 text-[9px] font-black uppercase tracking-widest hover:bg-orange-200 transition-colors rounded-sm"
                                    >
                                      Cancel Request
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <UpiManagementModal
                        isOpen={isUpiModalOpen}
                        mode={upiModalMode}
                        userEmail={user?.email || ""}
                        userId={user?.id || ""}
                        onClose={() => setIsUpiModalOpen(false)}
                        onSuccess={() => {
                          setIsUpiModalOpen(false);
                          setToast({ 
                            message: upiModalMode === 'setup' ? "UPI ID verified successfully" : "UPI change request created. Check email.", 
                            type: "success" 
                          });
                          fetchUpiData();
                        }}
                      />

                      {/* Section 3: Session Management */}
                      <div className="space-y-6 pt-6 border-t border-zinc-100">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">3. Session Options</h4>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400 leading-relaxed font-medium">Log out from your current device profile session.</p>
                        </div>
                        <button 
                          onClick={handleLogout}
                          className="px-8 py-4 border border-zinc-950 hover:bg-zinc-950 hover:text-white text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-[1.01] rounded-sm cursor-pointer"
                        >
                          <LogOut size={14} /> Log Out from Device
                        </button>
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
                      <OptimizedImage 
                        src={item.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                        alt={item.name} 
                        variant="profile"
                        className="w-10 h-10 rounded-full border border-zinc-100 shrink-0" 
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

      {/* Translation Drawer */}
      <TranslationDrawer 
        isOpen={translationDrawerOpen} 
        onClose={() => setTranslationDrawerOpen(false)} 
        contentId={drawerContentId} 
        originalLanguage="en" 
      />

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

export function PreferencesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");
  const [userId, setUserId] = useState<string | null>(null);
  
  // Notification Preferences
  const [likeEmailsEnabled, setLikeEmailsEnabled] = useState(true);
  const [commentEmailsEnabled, setCommentEmailsEnabled] = useState(true);

  const INTERESTS_LIST = [
    "Artificial Intelligence", "Technology", "Programming", "Data Science", 
    "Business", "Entrepreneurship", "Self Help", "Psychology", 
    "Finance", "Design", "History", "Science", 
    "Health", "Fitness", "Romance", "Mystery", 
    "Thriller", "Fantasy", "Horror", "Biography", 
    "Philosophy", "Poetry", "Education", "Comics", 
    "Travel", "Cooking"
  ];

  const CONTENT_TYPES_LIST = [
    "Books", "Stories", "Blogs", "Short Reads", 
    "Learning Series", "Personal Essays", "Writing Tips", "Book Recommendations"
  ];

  const GOALS_LIST = [
    "Read more books", "Learn new skills", "Improve my knowledge",
    "Learn AI", "Discover new writers", "Publish my own books",
    "Write blogs", "Become an author", "Build a reading habit",
    "Get daily inspiration", "Support independent writers"
  ];

  useEffect(() => {
    // Load role and ID
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || "Author");
        setUserId(parsed.id);
        setPreferredLanguage(parsed.preferred_reading_language || "en");
      } catch (e) {
        console.error(e);
      }
    }

    fetch("/api/user/preferences")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setInterests(data.interests || []);
          setContentTypes(data.contentTypes || []);
          setGoals(data.goals || []);
        }
      })
      .catch(err => {
        console.error(err);
      });

    fetch("/api/user/notification-preferences")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setLikeEmailsEnabled(data.like_emails_enabled ?? true);
          setCommentEmailsEnabled(data.comment_emails_enabled ?? true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);


  const filteredGoals = GOALS_LIST.filter(goal => {
    if (userRole === "Reader") {
      return goal !== "Publish my own books" && 
             goal !== "Write blogs" && 
             goal !== "Become an author";
    }
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, contentTypes, goals })
      });
      if (!res.ok) throw new Error("Failed to save preferences");

      // Save notification preferences
      const notifRes = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          like_emails_enabled: likeEmailsEnabled,
          comment_emails_enabled: commentEmailsEnabled
        })
      });
      
      const notifData = await notifRes.json();
      if (!notifRes.ok && notifData.error) {
        if (notifData.error.includes("Database migration required")) {
          console.warn("Notification preferences not saved - migration pending");
        } else {
          throw new Error(notifData.error);
        }
      }

      // Save language separately
      if (userId) {
        import("@/lib/supabase").then(({ supabase }) => {
          supabase.from("users").update({ preferred_reading_language: preferredLanguage }).eq("id", userId).then(({ error }: { error: any }) => {
            if (error) console.error("Error saving language", error);
            else {
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.preferred_reading_language = preferredLanguage;
                localStorage.setItem("user", JSON.stringify(parsed));
              }
            }
          });
        });
      }
      setMessage({ text: "Preferences updated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (list: string[], setList: any, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin text-zinc-300 mx-auto" size={32} /></div>;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-heading font-black uppercase tracking-tight mb-2">Preferred Reading Language</h2>
        <p className="text-sm text-zinc-500 mb-6">Select the language you want to read manuscripts in. We will translate stories automatically if they are available.</p>
        <select
          value={preferredLanguage}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          className="w-full md:w-1/2 bg-zinc-50 border border-zinc-200 p-4 text-xs font-bold uppercase tracking-widest outline-none transition-all placeholder:text-zinc-300 text-zinc-900 rounded-sm cursor-pointer"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="te">Telugu</option>
          <option value="ta">Tamil</option>
          <option value="kn">Kannada</option>
          <option value="ml">Malayalam</option>
          <option value="mr">Marathi</option>
          <option value="gu">Gujarati</option>
          <option value="pa">Punjabi</option>
          <option value="ur">Urdu</option>
          <option value="bn">Bengali</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-heading font-black uppercase tracking-tight mb-2">Reading Interests</h2>
        <p className="text-sm text-zinc-500 mb-6">Update the topics you want to see more of in your feed.</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS_LIST.map(interest => {
            const isSelected = interests.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggle(interests, setInterests, interest)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border-2
                  ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-heading font-black uppercase tracking-tight mb-2">Preferred Content</h2>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES_LIST.map(type => {
            const isSelected = contentTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggle(contentTypes, setContentTypes, type)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border-2
                  ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-heading font-black uppercase tracking-tight mb-2">Your Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGoals.map(goal => {
            const isSelected = goals.includes(goal);
            return (
              <label key={goal} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-sm cursor-pointer hover:bg-zinc-50">
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggle(goals, setGoals, goal)} 
                  className="w-4 h-4 accent-black" 
                />
                <span className="text-sm font-semibold text-zinc-700">{goal}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-heading font-black uppercase tracking-tight mb-2">Email Notifications</h2>
        <p className="text-sm text-zinc-500 mb-6">Manage when you receive emails about interactions on your stories.</p>
        <div className="grid grid-cols-1 gap-4 max-w-md">
          <label className="flex items-center justify-between p-4 border border-zinc-200 rounded-sm cursor-pointer hover:bg-zinc-50 transition-colors">
            <div>
              <span className="text-sm font-bold text-zinc-900 block">Story Likes</span>
              <span className="text-[10px] font-medium text-zinc-500">Get notified when someone likes your story</span>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${likeEmailsEnabled ? 'bg-black' : 'bg-zinc-200'}`}>
              <input type="checkbox" className="sr-only" checked={likeEmailsEnabled} onChange={() => setLikeEmailsEnabled(!likeEmailsEnabled)} />
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${likeEmailsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
          <label className="flex items-center justify-between p-4 border border-zinc-200 rounded-sm cursor-pointer hover:bg-zinc-50 transition-colors">
            <div>
              <span className="text-sm font-bold text-zinc-900 block">Story Comments</span>
              <span className="text-[10px] font-medium text-zinc-500">Get notified when someone comments on your story</span>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${commentEmailsEnabled ? 'bg-black' : 'bg-zinc-200'}`}>
              <input type="checkbox" className="sr-only" checked={commentEmailsEnabled} onChange={() => setCommentEmailsEnabled(!commentEmailsEnabled)} />
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${commentEmailsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-200 flex items-center justify-between">
        {message ? (
          <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        ) : <div />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
