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
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type ContentType = "Book" | "Blog" | "Article" | "Magazine";

function WritePageContent() {
  const [step, setStep] = useState<"selection" | "form" | "success">("selection");
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      const typeMap: Record<string, ContentType> = {
        "book": "Book",
        "blog": "Blog",
        "article": "Article",
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
    setTags("");
    setCoverFile(null);
    setPdfFile(null);
    setErrorMessage("");
    setStep("form");
  };

  const handleBack = () => {
    setStep("selection");
    setSelectedType(null);
    router.replace("/write");
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const { data: { user } } = await supabase.auth.getUser();

      let coverUrl = "";
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `${user?.id}/${Date.now()}-cover.${coverExt}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile);
        
        if (coverError) throw new Error("Cover Upload Failed: " + coverError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from("covers")
          .getPublicUrl(coverPath);
        coverUrl = publicUrl;
      }

      let pdfPath = "";
      if (pdfFile) {
        pdfPath = `${user?.id}/${Date.now()}-manuscript.pdf`;
        const { error: pdfError } = await supabase.storage
          .from("books")
          .upload(pdfPath, pdfFile);
        
        if (pdfError) throw new Error("Manuscript Upload Failed: " + pdfError.message);
      }

      const finalCategory = category ? `Book - ${category}` : "Book";

      const res = await fetch("http://localhost:5000/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          description: description,
          genre: finalCategory,
          price: 99,
          coverImage: coverUrl,
          pdfUrl: pdfPath,
          authorId: user?.id
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || res.statusText);
      }

      const { book } = await res.json();
      setCreatedId(book.id);
      setStep("success");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArticleSubmit = async (
    articleTitle: string,
    articleCategory: string,
    articleTags: string[],
    articleThumbnail: File | null
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Authentication required. Please log in.");
      const { data: { user } } = await supabase.auth.getUser();

      let thumbnailUrl = "";
      if (articleThumbnail) {
        const ext = articleThumbnail.name.split(".").pop();
        const imgPath = `${user?.id}/${Date.now()}-article.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(imgPath, articleThumbnail);
        
        if (uploadError) throw new Error("Thumbnail Upload Failed: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from("article-images")
          .getPublicUrl(imgPath);
        thumbnailUrl = publicUrl;
      }

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: articleTitle,
          description: "",
          category: articleCategory || "General",
          type: "Article",
          coverUrl: thumbnailUrl,
          tags: articleTags
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || res.statusText);
      }

      const responseData = await res.json();
      setCreatedId(responseData.id);
      setStep("success");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlogSubmit = async (
    blogTitle: string,
    blogBanner: File | null
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Authentication required. Please log in.");
      const { data: { user } } = await supabase.auth.getUser();

      let bannerUrl = "";
      if (blogBanner) {
        const ext = blogBanner.name.split(".").pop();
        const imgPath = `${user?.id}/${Date.now()}-blog.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(imgPath, blogBanner);
        
        if (uploadError) throw new Error("Banner Upload Failed: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from("blog-images")
          .getPublicUrl(imgPath);
        bannerUrl = publicUrl;
      }

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: blogTitle,
          description: "",
          category: "Blog",
          type: "Blog",
          coverUrl: bannerUrl
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || res.statusText);
      }

      const responseData = await res.json();
      setCreatedId(responseData.id);
      setStep("success");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-white pb-20">
      <Navbar />
      <div className="unified-axis max-w-4xl pt-32">
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
                  description="A full-length manuscript or novel. Supports PDF format." 
                  icon={<Book size={32} />} 
                  onClick={() => handleTypeSelect("Book")} 
                />
                <TypeCard 
                  title="Blog" 
                  description="Personal stories, thoughts, and quick updates." 
                  icon={<Layout size={32} />} 
                  onClick={() => handleTypeSelect("Blog")} 
                />
                <TypeCard 
                  title="Article" 
                  description="Professional insights, deep dives, and analysis." 
                  icon={<FileText size={32} />} 
                  onClick={() => handleTypeSelect("Article")} 
                />
                <TypeCard 
                  title="Magazine" 
                  description="Curated collections, visual stories, and issues." 
                  icon={<Library size={32} />} 
                  onClick={() => handleTypeSelect("Magazine")} 
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
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black mb-12 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Selection
              </button>
              
              {selectedType === "Book" && (
                <BookUploadUI 
                  onSubmit={handleBookSubmit}
                  title={title} setTitle={setTitle}
                  category={category} setCategory={setCategory}
                  description={description} setDescription={setDescription}
                  onCoverChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  onPdfChange={(e: any) => setPdfFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                />
              )}

              {selectedType === "Article" && (
                <ArticleEditorUI 
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const tagArr = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t !== "");
                    handleArticleSubmit(title, category, tagArr, coverFile);
                  }}
                  title={title} setTitle={setTitle}
                  category={category} setCategory={setCategory}
                  tags={tags} setTags={setTags}
                  onThumbnailChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                />
              )}

              {selectedType === "Blog" && (
                <BlogEditorUI 
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    handleBlogSubmit(title, coverFile);
                  }}
                  title={title} setTitle={setTitle}
                  onBannerChange={(e: any) => setCoverFile(e.target.files?.[0] || null)}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                />
              )}

              {selectedType === "Magazine" && (
                <div className="space-y-12">
                  <h2 className="text-4xl font-heading font-black tracking-tighter uppercase mb-12">
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
                  <button 
                    onClick={() => router.push(`/write/${createdId}`)}
                    className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    Open Live Editor
                  </button>
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

function TypeCard({ title, description, icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="group p-12 bg-zinc-50 border border-zinc-100 rounded-sm text-left transition-all hover:bg-black hover:text-white hover:shadow-2xl hover:scale-[1.02]"
    >
      <div className="w-16 h-16 border border-zinc-200 flex items-center justify-center mb-8 transition-all group-hover:border-white/20 group-hover:bg-white/10">
        {icon}
      </div>
      <h3 className="text-3xl font-heading font-black uppercase tracking-tight mb-4">{title}</h3>
      <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 italic leading-relaxed">{description}</p>
    </button>
  );
}

function InputField({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
      <input 
        type="text"
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-zinc-100 p-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-black transition-all placeholder:text-zinc-200"
      />
    </div>
  );
}

function TextAreaField({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
      <textarea 
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full bg-white border border-zinc-100 p-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-black transition-all placeholder:text-zinc-200 resize-none"
      />
    </div>
  );
}

function FileUploadField({ label, description, accept, icon, onChange }: any) {
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
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
      <div className="relative aspect-video bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:border-black hover:bg-zinc-100 transition-all group overflow-hidden">
        <input 
          type="file" 
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileName(file.name);
              if (file.type.startsWith("image/")) {
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
                <p className="text-[8px] font-medium uppercase tracking-widest text-zinc-300 mt-1">Click to change</p>
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
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest mt-2">Ready to upload • Click to change</p>
            </div>
          )
        ) : (
          <div className="text-center z-10 pointer-events-none">
            <div className="w-12 h-12 border border-zinc-200 flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-all">
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
  title, setTitle, 
  category, setCategory, 
  description, setDescription, 
  onCoverChange, onPdfChange, 
  isSubmitting, errorMessage 
}: any) {
  return (
    <div className="space-y-12 bg-white p-8 md:p-12 border border-zinc-100 rounded-sm">
      <h2 className="text-4xl font-heading font-black tracking-tighter uppercase mb-12">
        Publish your <span className="text-zinc-300">Book</span>
      </h2>
      
      {errorMessage && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500">
          {errorMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <InputField label="Book Title" placeholder="The title of your manuscript..." value={title} onChange={setTitle} />
            <InputField label="Category" placeholder="e.g. Fiction, Education, Technology..." value={category} onChange={setCategory} />
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

        <div className="flex justify-center pt-8">
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

function ArticleEditorUI({ 
  onSubmit, 
  title, setTitle, 
  category, setCategory, 
  tags, setTags,
  onThumbnailChange, 
  isSubmitting, errorMessage 
}: any) {
  return (
    <div className="min-h-[70vh] bg-white p-8 md:p-12 border border-zinc-100 rounded-sm">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-16">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-zinc-300 mb-8">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Article Mode</span>
            <div className="h-px flex-grow bg-zinc-100" />
          </div>

          {errorMessage && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500">
              {errorMessage}
            </div>
          )}

          <input 
            type="text"
            placeholder="Article Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-5xl md:text-7xl font-heading font-black tracking-ultra-tight uppercase outline-none placeholder:text-zinc-100 transition-all leading-tight border-b border-zinc-100 pb-4"
            required
          />
        </div>

        <div className="flex flex-wrap gap-8 items-center py-10 border-b border-zinc-100">
          <div className="flex flex-col gap-2 flex-grow min-w-[200px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</label>
            <input 
              type="text"
              placeholder="e.g. Technology, Culture, Insight"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none border border-zinc-100 p-4 w-full focus:border-black transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2 flex-grow min-w-[200px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tags (comma-separated)</label>
            <input 
              type="text"
              placeholder="e.g. guide, swift, tutorial"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none border border-zinc-100 p-4 w-full focus:border-black transition-colors"
            />
          </div>
        </div>

        <FileUploadField 
          label="Article Thumbnail" 
          description="Optional: Image to represent article feed card" 
          accept="image/*"
          icon={<ImageIcon size={24} />}
          onChange={onThumbnailChange}
        />

        <div className="flex items-center justify-between pt-12 border-t border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
              <Feather size={16} className="text-zinc-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Ready to write your article?
            </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !title}
            className="px-12 py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.4em] hover:scale-110 transition-all shadow-2xl flex items-center gap-4 disabled:opacity-20 rounded-sm group"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                Start Writing <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className="p-10 bg-zinc-50 border border-zinc-100 rounded-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">The Experience</p>
          <p className="text-sm font-medium leading-relaxed text-zinc-500 italic">
            You are entering our distraction-free Manuscript Studio. Your article will be saved in the database, and you can edit or publish it live.
          </p>
        </div>
      </form>
    </div>
  );
}

function BlogEditorUI({ 
  onSubmit, 
  title, setTitle, 
  onBannerChange, 
  isSubmitting, errorMessage 
}: any) {
  return (
    <div className="min-h-[70vh] bg-white p-8 md:p-12 border border-zinc-100 rounded-sm">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-16">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-zinc-300 mb-8">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Blog Mode</span>
            <div className="h-px flex-grow bg-zinc-100" />
          </div>

          {errorMessage && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500">
              {errorMessage}
            </div>
          )}

          <input 
            type="text"
            placeholder="Blog Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-5xl md:text-7xl font-heading font-black tracking-ultra-tight uppercase outline-none placeholder:text-zinc-100 transition-all leading-tight border-b border-zinc-100 pb-4"
            required
          />
        </div>

        <FileUploadField 
          label="Blog Banner Image" 
          description="Optional: Hero banner for blog post header" 
          accept="image/*"
          icon={<ImageIcon size={24} />}
          onChange={onBannerChange}
        />

        <div className="flex items-center justify-between pt-12 border-t border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
              <Feather size={16} className="text-zinc-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Ready to write your story?
            </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !title}
            className="px-12 py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.4em] hover:scale-110 transition-all shadow-2xl flex items-center gap-4 disabled:opacity-20 rounded-sm group"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                Start Writing <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className="p-10 bg-zinc-50 border border-zinc-100 rounded-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">The Experience</p>
          <p className="text-sm font-medium leading-relaxed text-zinc-500 italic">
            You are entering our distraction-free Manuscript Studio. Your blog post will be saved and published only when you are ready.
          </p>
        </div>
      </form>
    </div>
  );
}
