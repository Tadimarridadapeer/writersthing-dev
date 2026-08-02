"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, 
  FileText, 
  Layout, 
  Library, 
  Upload, 
  Image as ImageIcon, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  X,
  Type,
  Plus,
  Feather,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Clock,
  Target,
  Eye
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import { getApiUrl } from "@/lib/config";
import { ensureAuthorProfile } from "@/lib/author";
import { useDraftManager } from "@/hooks/useDraftManager";

type ContentType = "Book" | "Blog" | "Story" | "Magazine";

// Reusable helper function to get current author and validate schema
async function getCurrentAuthor() {
  console.log("getCurrentAuthor - Initiating author validation flow");
  
  // 1. Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("getCurrentAuthor - Auth Error:", authError);
    throw new Error("Unable to retrieve authenticated user. Please log in again.");
  }
  
  console.log("getCurrentAuthor - Auth User ID:", user.id);
  console.log("getCurrentAuthor - Auth User Object:", user);

  // 2. Fetch users table record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
    
  console.log("getCurrentAuthor - Users Query Result:", userData);
  if (userError) {
    console.error("getCurrentAuthor - Users Query RLS/DB Error:", userError);
  }
  
  // 3. Ensure author table record using helper
  let authorData;
  try {
    authorData = await ensureAuthorProfile(supabase, user.id);
  } catch (authorError: any) {
    console.error("getCurrentAuthor - Authors Query/Create Error:", authorError);
    throw authorError;
  }

  console.log('Current User:', user);
  console.log('User ID:', user?.id);
  console.log('Authors Query Data:', authorData);

  if (!userData) {
    throw new Error(`Users record missing for auth ID ${user.id}. DB Error: ${userError?.message || "None"}`);
  }

  return {
    user: user,
    userRecord: userData,
    authorRecord: authorData
  };
}

function DraftStatusIndicator({ status, lastSaved }: { status: string, lastSaved: Date | null }) {
  if (status === 'saving') return <span className="text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Saving...</span>;
  if (status === 'saved' && lastSaved) return <span className="text-green-600/70 text-[10px] uppercase font-bold flex items-center gap-2"><CheckCircle2 size={12} /> Your item is drafted</span>;
  if (status === 'unsaved') return <span className="text-amber-600/70 text-[10px] uppercase font-bold flex items-center gap-2">Unsaved changes</span>;
  if (status === 'failed') return <span className="text-red-600/70 text-[10px] uppercase font-bold flex items-center gap-2">Save failed</span>;
  return null;
}

function WritePageContent() {
  const [step, setStep] = useState<"selection" | "form" | "success">("selection");
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateAuthorBtn, setShowCreateAuthorBtn] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const { status: draftStatus, lastSaved, errorMessage: draftError, currentId, triggerAutoSave, saveToDatabase, recoverLocalDraft, clearLocal } = useDraftManager(selectedType, draftIdParam);

  // Auto-Save Effect
  useEffect(() => {
    if (step === "form" && selectedType) {
      triggerAutoSave({
        type: selectedType,
        title,
        description,
        content,
        category,
        // Intentionally omit files from auto-save to prevent massive bandwidth usage
      });
    }
  }, [title, description, content, category, selectedType, step, triggerAutoSave]);

  // Initial Load & Local Recovery
  useEffect(() => {
    if (step === "form" && selectedType) {
      const local = recoverLocalDraft();
      if (local && window.confirm("We found an unsaved local draft for this item. Would you like to recover it?")) {
        setTitle(local.title || "");
        setDescription(local.description || "");
        setContent(local.content || "");
        setCategory(local.category || "");
      }
    }
  }, [step, selectedType]);

  const handleCreateAuthor = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");
      
      console.log("Attempting to automatically create authors record for user_id:", user.id);
      const { data, error } = await supabase.from('authors').insert({ user_id: user.id }).select();
      
      if (error && error.code !== '23505') {
        throw new Error(`DB Error creating author: ${error.message}`);
      }
      
      console.log("Author record creation result:", data);
      setErrorMessage("Author profile created successfully! You can now publish.");
      setShowCreateAuthorBtn(false);
    } catch (err: any) {
      console.error("handleCreateAuthor error:", err);
      setErrorMessage("Failed to create author profile: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === "Reader") {
          router.replace("/profile");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      const typeMap: Record<string, ContentType> = {
        "book": "Book",
        "blog": "Blog",
        "story": "Story",
        "magazine": "Magazine"
      };
      if (typeMap[typeParam.toLowerCase()]) {
        setSelectedType(typeMap[typeParam.toLowerCase()]);
        setStep("form");
      }
    }
  }, [searchParams]);

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type);
    setTitle("");
    setCategory("");
    setDescription("");
    setContent("");
    setTags("");
    setCoverFile(null);
    setPdfFile(null);
    setErrorMessage("");
    setStep("form");
  };

  const handleBack = () => {
    setStep("selection");
    setSelectedType(null);
    router.replace("/editor");
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!title || !pdfFile) {
      setErrorMessage("A Title and PDF Manuscript are required to publish a book.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      // Backend API handles the rest (auth validation, author lookup, storage upload, metadata insert)
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      if (coverFile) formData.append("coverFile", coverFile);
      if (pdfFile) formData.append("pdfFile", pdfFile);

      const publishedId = await saveToDatabase({
        type: "Book",
        title,
        description,
        category,
        content: "",
        coverFile,
        pdfFile
      }, true);

      setCreatedId(publishedId);
      setStep("success");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      if (err.message && err.message.includes("Authors record missing")) {
        setShowCreateAuthorBtn(true);
      } else {
        setShowCreateAuthorBtn(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStorySubmit = async (
    storyTitle: string,
    storyCategory: string,
    storyTags: string[],
    storyThumbnail: File | null,
    storyContent: string,
    isDraft: boolean = false
  ) => {
    setErrorMessage("");

    if (!storyTitle.trim()) {
      setErrorMessage("Please enter a title before saving.");
      return;
    }

    if (!isDraft && !storyContent.trim()) {
      setErrorMessage("Please write some content before publishing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Authentication required. Please log in.");
      
      const authorProfile = await getCurrentAuthor();
      const userId = authorProfile.user.id;

      let thumbnailUrl = "";
      if (storyThumbnail) {
        const ext = storyThumbnail.name.split(".").pop();
        const imgPath = `${userId}/${Date.now()}-story.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(imgPath, storyThumbnail);
        
        if (uploadError) throw new Error("Thumbnail Upload Failed: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from("story-images")
          .getPublicUrl(imgPath);
        thumbnailUrl = publicUrl;
      }

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: storyTitle,
          description: storyContent.replace(/<[^>]*>?/gm, '').substring(0, 160) + "...",
          content: isDraft ? `[DRAFT]\n${storyContent}` : storyContent,
          category: storyCategory || "General",
          type: "Story",
          coverUrl: thumbnailUrl,
          tags: storyTags
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || res.statusText);
      }

      const responseData = await res.json();
      if (isDraft) {
        router.push("/profile");
      } else {
        router.push(`/storys/${responseData.id}`);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      if (err.message && err.message.includes("Authors record missing")) {
        setShowCreateAuthorBtn(true);
      } else {
        setShowCreateAuthorBtn(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlogSubmit = async (
    blogTitle: string,
    blogBanner: File | null,
    blogContent: string,
    isDraft: boolean = false
  ) => {
    setErrorMessage("");

    if (!blogTitle.trim()) {
      setErrorMessage("Please enter a title before saving.");
      return;
    }

    if (!isDraft && !blogContent.trim()) {
      setErrorMessage("Please write some content before publishing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Authentication required. Please log in.");
      
      const authorProfile = await getCurrentAuthor();
      const userId = authorProfile.user.id;

      let bannerUrl = "";
      if (blogBanner) {
        const ext = blogBanner.name.split(".").pop();
        const imgPath = `${userId}/${Date.now()}-blog.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(imgPath, blogBanner);
        
        if (uploadError) throw new Error("Banner Upload Failed: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from("story-images")
          .getPublicUrl(imgPath);
        bannerUrl = publicUrl;
      }

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: blogTitle,
          description: blogContent.replace(/<[^>]*>?/gm, '').substring(0, 160) + "...",
          content: isDraft ? `[DRAFT]\n${blogContent}` : blogContent,
          category: "Blog",
          type: "Blog",
          coverUrl: bannerUrl,
          tags: []
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || res.statusText);
      }

      const responseData = await res.json();
      if (isDraft) {
        router.push("/profile");
      } else {
        router.push(`/blogs/${responseData.id}`);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      if (err.message && err.message.includes("Authors record missing")) {
        setShowCreateAuthorBtn(true);
      } else {
        setShowCreateAuthorBtn(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-white pb-20">
      <div className="unified-axis max-w-4xl pt-4">
        <AnimatePresence mode="wait">
          {step === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-h1 tracking-ultra-tight uppercase mb-4 md:mb-8">Share your story</h1>
              <p className="text-zinc-500 font-medium text-lg md:text-xl mb-12 md:mb-20 italic">What kind of masterpiece are you bringing to the world today?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TypeCard 
                  title="Book" 
                  description="Publish full-length manuscripts and novels. Complete PDF support." 
                  icon={<Book size={32} />} 
                  onClick={() => handleTypeSelect("Book")} 
                />
                <TypeCard 
                  title="Blog" 
                  description="Share personal thoughts, quick updates, and engaging moments." 
                  icon={<Layout size={32} />} 
                  onClick={() => handleTypeSelect("Blog")} 
                />
                <TypeCard 
                  title="Story" 
                  description="Craft in-depth narratives, professional insights, and deep analysis." 
                  icon={<FileText size={32} />} 
                  onClick={() => handleTypeSelect("Story")} 
                />
                <TypeCard 
                  title="Magazine" 
                  description="Curate visual collections, serial issues, and editorial pieces." 
                  icon={<Library size={32} />} 
                  onClick={() => {}} 
                  disabled={true}
                />
              </div>
            </motion.div>
          )}

          {step === "form" && selectedType && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
              {selectedType !== "Blog" && (
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black mb-6 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Selection
                </button>
              )}
              
              {selectedType === "Book" && (
                <BookUploadUI 
                  onSubmit={handleBookSubmit}
                  onSaveDraft={async () => {
                    setIsSubmitting(true);
                    try {
                      await saveToDatabase({ type: "Book", title, description, category, content: "", coverFile, pdfFile }, false);
                    } finally { setIsSubmitting(false); }
                  }}
                  title={title} setTitle={setTitle}
                  category={category} setCategory={setCategory}
                  description={description} setDescription={setDescription}
                  onCoverChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  onPdfChange={(e: any) => setPdfFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                  showCreateAuthorBtn={showCreateAuthorBtn}
                  onCreateAuthor={handleCreateAuthor}
                  draftStatus={draftStatus}
                  lastSaved={lastSaved}
                />
              )}

              {selectedType === "Story" && (
                <StoryEditorUI 
                  onSaveDraft={async () => {
                    setIsSubmitting(true);
                    try {
                      await saveToDatabase({ type: "Story", title, category, tags: [], coverFile, content: content }, false);
                    } finally { setIsSubmitting(false); }
                  }}
                  onPublish={async () => {
                    setIsSubmitting(true);
                    try {
                      const id = await saveToDatabase({ type: "Story", title, category, tags: [], coverFile, content: content }, true);
                      setCreatedId(id); setStep("success");
                    } catch (e: any) { setErrorMessage(e.message); }
                    finally { setIsSubmitting(false); }
                  }}
                  title={title} setTitle={setTitle}
                  category={category} setCategory={setCategory}
                  tags={tags} setTags={setTags}
                  content={content} setContent={setContent}
                  onThumbnailChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                  draftStatus={draftStatus} lastSaved={lastSaved}
                />
              )}

              {selectedType === "Blog" && (
                <BlogEditorUI 
                  onBack={handleBack}
                  onSaveDraft={async () => {
                    setIsSubmitting(true);
                    try {
                      await saveToDatabase({ type: "Blog", title, category, content: content, coverFile }, false);
                    } finally { setIsSubmitting(false); }
                  }}
                  onPublish={async () => {
                    setIsSubmitting(true);
                    try {
                      const id = await saveToDatabase({ type: "Blog", title, category, content: content, coverFile }, true);
                      setCreatedId(id); setStep("success");
                    } catch (e: any) { setErrorMessage(e.message); }
                    finally { setIsSubmitting(false); }
                  }}
                  title={title} setTitle={setTitle}
                  content={content} setContent={setContent}
                  onBannerChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting} errorMessage={errorMessage}
                  draftStatus={draftStatus} lastSaved={lastSaved}
                />
              )}

              {selectedType === "Magazine" && (
                <div className="space-y-12">
                  <h2 className="text-4xl font-heading font-black tracking-tighter uppercase mb-6">
                    Publish your <span className="text-zinc-300">Magazine</span>
                  </h2>
                  <div className="p-10 bg-zinc-50 border border-zinc-100 rounded-sm">
                    <p className="text-sm font-medium leading-relaxed text-zinc-500 italic">
                      Magazine uploads are currently disabled. Please contact the administrator.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-12 rounded-full">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h2 className="text-6xl font-heading font-black uppercase tracking-tight mb-8">Masterpiece Initialized</h2>
              <p className="text-zinc-500 font-medium italic text-xl mb-16 max-w-xl mx-auto">
                {selectedType === "Book" 
                  ? "Your book is being processed and will be available in the Marketplace shortly."
                  : `Your ${selectedType?.toLowerCase()} has been created. Let's start writing!`}
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {selectedType === "Book" ? (
                  <>
                    <button 
                      onClick={() => router.push("/marketplace")}
                      className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Go to Marketplace
                    </button>
                    <button 
                      onClick={() => setStep("selection")}
                      className="px-12 py-5 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      Share Another Story
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => router.push("/profile")}
                      className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      View in Profile
                    </button>
                    <button 
                      onClick={() => setStep("selection")}
                      className="px-12 py-5 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      Write Another
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <WritePageContent />
    </Suspense>
  );
}

function TypeCard({ title, description, icon, onClick, disabled }: any) {
  return (
    <button 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group p-12 bg-zinc-50 border border-zinc-100 rounded-sm text-left transition-all relative ${
        disabled 
          ? "opacity-70 cursor-not-allowed grayscale" 
          : "hover:bg-black hover:text-white hover:shadow-2xl hover:scale-[1.02]"
      }`}
    >
      {disabled && (
        <div className="absolute top-8 right-8 bg-zinc-200 text-zinc-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
          Soon
        </div>
      )}
      <div className={`w-16 h-16 border border-zinc-200 flex items-center justify-center mb-8 transition-all ${
        disabled ? "" : "group-hover:border-white/20 group-hover:bg-white/10"
      }`}>
        {icon}
      </div>
      <h3 className="text-3xl font-heading font-black uppercase tracking-tight mb-4 flex items-center gap-4">
        {title}
      </h3>
      <p className={`text-sm font-medium italic leading-relaxed ${
        disabled ? "text-zinc-400" : "text-zinc-400 group-hover:text-zinc-300"
      }`}>{description}</p>
    </button>
  );
}

function InputField({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</label>
      <input 
        type="text"
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-zinc-300 p-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400 text-zinc-950"
      />
    </div>
  );
}

function CategoryInputField({ label, placeholder, value, onChange }: any) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const CATEGORY_SUGGESTIONS = [
    "Technology",
    "Fiction",
    "Education",
    "Mystery",
    "Sci-Fi",
    "Thriller",
    "Biography",
    "Poetry",
    "Culture",
    "Insight",
    "Love",
    "Comedy",
    "History"
  ];

  const filtered = CATEGORY_SUGGESTIONS.filter(item => 
    item.toLowerCase().includes(value.toLowerCase()) &&
    value.trim() !== ""
  );

  return (
    <div className="space-y-4 relative">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
      <div className="relative">
        <input 
          type="text"
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="w-full bg-white border border-zinc-300 p-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400 text-zinc-950"
        />
        
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 left-0 right-0 top-full bg-white border border-zinc-100 shadow-2xl p-2 mt-2 max-h-48 overflow-y-auto rounded-sm">
            {filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all rounded-sm cursor-pointer border-0 bg-transparent block"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCategoryInputField({ label, placeholder, value, onChange }: any) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const CATEGORY_SUGGESTIONS = [
    "Love Stories",
    "Comic",
    "Rom-Com",
    "Inspirations",
    "Experiences",
    "Confessions",
    "Fiction",
    "Non-Fiction"
  ];

  const filtered = CATEGORY_SUGGESTIONS.filter(item => 
    item.toLowerCase().includes(value.toLowerCase()) &&
    value.trim() !== ""
  );

  return (
    <div className="flex flex-col gap-2 flex-grow min-w-[200px] relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      <div className="relative">
        <input 
          type="text"
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none border border-zinc-300 p-4 w-full focus:border-zinc-950 transition-colors placeholder:text-zinc-400 text-zinc-950"
        />
        
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 left-0 right-0 top-full bg-white border border-zinc-100 shadow-2xl p-2 mt-2 max-h-48 overflow-y-auto rounded-sm">
            {filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all rounded-sm cursor-pointer border-0 bg-transparent block"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TextAreaField({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</label>
      <textarea 
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full bg-white border border-zinc-300 p-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400 text-zinc-950 resize-none"
      />
    </div>
  );
}

function FileUploadField({ label, description, accept, icon, onChange, compact }: any) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</label>
      <div 
        className={`relative ${compact ? 'h-32' : 'aspect-video'} bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer transition-all group overflow-hidden hover:border-zinc-950 hover:bg-zinc-100 outline-none`}
      >
        <input 
          type="file" 
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileName(file.name);
              if (file.type.startsWith("image/")) {
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                }
                const newUrl = URL.createObjectURL(file);
                setPreviewUrl(newUrl);
              } else {
                setPreviewUrl(null);
              }
            } else {
              setFileName("");
              setPreviewUrl(null);
            }
            onChange(e);
          }}
        />
        {fileName ? (
          previewUrl ? (
            <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-black">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                <CheckCircle2 size={24} className="mb-2 text-white" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center truncate max-w-full">{fileName}</p>
                <p className="text-[8px] font-medium uppercase tracking-widest text-zinc-300 mt-1">Click to change file</p>
              </div>
            </div>
          ) : (
            <div className="text-center z-10 pointer-events-none">
              {accept === ".pdf" ? (
                <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-100 flex flex-col items-center justify-center mx-auto mb-4 rounded-sm shadow-sm relative group-hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black tracking-tighter">PDF</span>
                  <FileText size={20} className="mt-1" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4 rounded-full">
                  <CheckCircle2 size={20} />
                </div>
              )}
              <p className="text-xs font-black uppercase tracking-widest px-4 truncate max-w-[250px]">{fileName}</p>
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest mt-2">Ready to upload • Click to change file</p>
            </div>
          )
        ) : (
          <div className="text-center z-10 pointer-events-none">
            <div className="w-12 h-12 border border-zinc-200 flex items-center justify-center mx-auto mb-4 group-hover:bg-zinc-950 group-hover:text-white transition-all bg-white">
              {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">Click to Upload</p>
            <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-[0.2em]">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookUploadUI({ 
  onSubmit,
  onSaveDraft,
  title, setTitle, 
  category, setCategory, 
  description, setDescription, 
  onCoverChange, onPdfChange, 
  isSubmitting, errorMessage,
  showCreateAuthorBtn, onCreateAuthor,
  draftStatus, lastSaved
}: any) {
  return (
    <div className="space-y-12 bg-white p-6 md:p-8 border border-zinc-100 rounded-sm">
      <h2 className="text-4xl font-heading font-black tracking-tighter uppercase mb-6">
        Publish your <span className="text-zinc-300">Book</span>
      </h2>
      
      {errorMessage && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500 flex flex-col items-start gap-4">
          <p>{errorMessage}</p>
          {showCreateAuthorBtn && (
            <button 
              type="button"
              onClick={onCreateAuthor}
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Auto-Create Author Profile
            </button>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <InputField label="Book Title" placeholder="The title of your manuscript..." value={title} onChange={setTitle} />
            <CategoryInputField label="Category" placeholder="e.g. Fiction, Education, Technology..." value={category} onChange={setCategory} />
            <TextAreaField label="Synopsis" placeholder="A brief summary of your work..." value={description} onChange={setDescription} />
          </div>
          
          <div className="space-y-8">
            <FileUploadField 
              label="Cover Image" 
              description="Recommended: 3:4 aspect ratio. Grayscale suggested." 
              accept="image/*"
              icon={<ImageIcon size={24} />}
              onChange={onCoverChange}
            />
            
            <FileUploadField 
              label="PDF Manuscript" 
              description="Upload your full book in PDF format for direct reading." 
              accept=".pdf"
              icon={<FileText size={24} />}
              onChange={onPdfChange}
            />
          </div>
        </div>

        <div className="flex justify-center pt-8 items-center gap-6">
          <DraftStatusIndicator status={draftStatus} lastSaved={lastSaved} />
          <button 
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-6 bg-white text-zinc-955 border border-zinc-300 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-zinc-50 transition-all flex items-center justify-center gap-4 disabled:opacity-50 rounded-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Draft"}
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-20 py-6 bg-black text-white font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 rounded-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publish to Writersthing"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StoryEditorUI({ 
  onSaveDraft,
  onPublish, 
  title, setTitle, 
  category, setCategory,
  tags, setTags,
  onThumbnailChange,
  content, setContent,
  isSubmitting, errorMessage,
  draftStatus, lastSaved
}: any) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] px-4 py-12 md:py-24 text-zinc-900 font-serif">
      <div className="max-w-[700px] mx-auto">
        <div className="space-y-10">
          
          {errorMessage && (
            <div className="p-4 bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs font-mono uppercase tracking-widest flex items-center gap-3">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          <div className="space-y-6 border-b border-zinc-200 pb-10">
            <input 
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-300 bg-transparent outline-none transition-all leading-tight border-none focus:ring-0"
              required
            />
            
            <input 
              type="text"
              placeholder="Category (e.g. Fiction, Fantasy, Romance)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm font-bold tracking-widest uppercase text-zinc-600 placeholder:text-zinc-300 bg-transparent outline-none transition-all border-none focus:ring-0"
            />
            
            <div className="pt-4">
              <FileUploadField 
                label="Story Cover Image" 
                description="Optional: Thumbnail for your story" 
                accept="image/*"
                icon={<ImageIcon size={24} />}
                onChange={onThumbnailChange}
                compact={true}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="prose prose-zinc max-w-none">
              <RichTextEditor content={content} onChange={setContent} placeholder="Write your story..." />
            </div>
          </div>

          <div className="pt-16 pb-12 flex items-center gap-6 justify-start">
            <DraftStatusIndicator status={draftStatus} lastSaved={lastSaved} />
            <button 
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="px-8 py-3 bg-white text-zinc-900 border border-zinc-900 font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save as Draft"}
            </button>
            <button 
              type="button"
              onClick={onPublish}
              disabled={isSubmitting}
              className="px-8 py-3 bg-zinc-900 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publish Story"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function BlogEditorUI({ 
  onBack,
  onSaveDraft,
  onPublish, 
  title, setTitle, 
  content, setContent,
  onBannerChange, 
  isSubmitting, errorMessage,
  draftStatus, lastSaved
}: any) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6 border-b border-zinc-100 mb-8 px-4 md:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} /> Back to Selection
        </button>

        <div className="flex items-center gap-4">
          <DraftStatusIndicator status={draftStatus} lastSaved={lastSaved} />
          
          <button 
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-6 py-3 border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-sm ${isPreview ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-50'}`}
          >
            <Eye size={14} /> {isPreview ? 'Exit Preview' : 'Preview'}
          </button>
          
          <button 
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white text-zinc-950 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Feather size={14} />} 
            Save Draft
          </button>
          
          <button 
            type="button"
            onClick={onPublish}
            disabled={isSubmitting}
            className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
            Publish Blog
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-8">
        {/* Main Editor Column */}
        <div className="space-y-10">
          <div className="flex items-center gap-4 text-zinc-400 border-b border-zinc-100 pb-4">
            <Sparkles size={16} className="text-zinc-950" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-950">Blog Studio</span>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500">
              {errorMessage}
            </div>
          )}

          {isPreview ? (
            <div className="py-8 space-y-8 animate-in fade-in duration-500">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-950 leading-tight">
                {title || "Untitled Blog"}
              </h1>
              {title && (
                <div className="w-24 h-1 bg-zinc-950 rounded-full" />
              )}
              {content ? (
                <div 
                  className="prose prose-zinc max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-md"
                  dangerouslySetInnerHTML={{ __html: content }} 
                />
              ) : (
                <p className="text-zinc-500 italic">No content written yet.</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 animate-in fade-in duration-300">
                {/* Blog Title */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">Blog Title</label>
                  <div className="relative h-[calc(100%-2rem)]">
                    <textarea 
                      placeholder="Write a compelling title for your blog..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                      className="w-full h-full text-2xl md:text-4xl font-black tracking-tight text-zinc-950 placeholder:text-zinc-400 bg-white border border-zinc-200 p-6 md:p-8 outline-none transition-all focus:border-zinc-950 rounded-sm resize-none"
                      required
                    />
                    <span className="absolute right-6 bottom-6 text-[10px] font-black text-zinc-300 bg-white/80 px-2 py-1">
                      {title.length}/120
                    </span>
                  </div>
                </div>

                {/* Blog Banner Image */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">Blog Banner Image</label>
                  <div className="h-[calc(100%-2rem)]">
                    <FileUploadField 
                      label=""
                      description="JPG/PNG (Max 5MB)" 
                      accept="image/*"
                      icon={<ImageIcon size={24} className="text-blue-500" />}
                      onChange={onBannerChange}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 animate-in fade-in duration-300">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 flex items-center gap-2">
                  Content
                </label>
                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <RichTextEditor content={content} onChange={setContent} placeholder="Start writing your story..." />
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  );
}
