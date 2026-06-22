"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { ArrowLeft, Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getApiUrl } from "@/lib/config";

function PDFReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("id");
  const title = searchParams.get("title") || "Digital Manuscript";
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccess = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push(`/login?redirect=/read/pdf?id=${bookId}`);
        return;
      }

      if (!bookId) {
        setError("Missing Book ID");
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const res = await fetch(getApiUrl(`/api/books/read/${bookId}`), {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (res.ok) {
          setPdfUrl(data.url);
        } else {
          setError(data.message || "Failed to load manuscript");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, [bookId]);

  return (
    <div className={`min-h-screen bg-zinc-900 text-white flex flex-col ${isFullscreen ? "fixed inset-0 z-[200]" : ""}`}>
      {/* Reader Header */}
      <nav className="h-20 bg-black border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Exit Reader
          </button>
          <div className="h-6 w-px bg-white/5" />
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">{title}</h1>
            <p className="text-[8px] font-medium text-zinc-600 uppercase tracking-widest">Digital Manuscript No. 01</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-3 text-zinc-500 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <a 
            href={pdfUrl || undefined} 
            download
            className="flex items-center gap-3 px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm"
          >
            <Download size={14} /> Download PDF
          </a>
        </div>
      </nav>

      {/* Main PDF Canvas */}
      <main className="flex-grow relative bg-zinc-950 flex items-center justify-center p-8 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 z-10">
            <Loader2 size={32} className="animate-spin text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Loading Manuscript...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 z-10 p-12 text-center">
            <p className="text-xl font-heading font-black text-red-500 uppercase tracking-tighter mb-4">{error}</p>
            <button onClick={() => router.back()} className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Go Back</button>
          </div>
        )}
        
        {pdfUrl && (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-sm"
            onLoad={() => setLoading(false)}
          />
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl px-8 py-4 rounded-full border border-white/5">
          <button className="p-2 text-zinc-500 hover:text-white"><ChevronLeft size={20} /></button>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-widest px-4 text-zinc-400">
            Page <span className="text-white">01</span> / 48
          </span>
          <div className="h-6 w-px bg-white/10" />
          <button className="p-2 text-zinc-500 hover:text-white"><ChevronRight size={20} /></button>
        </div>
      </main>

      {/* Subtle Overlay Branding */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-10">
        <span className="text-4xl font-heading font-black italic tracking-tighter uppercase">Writersthing</span>
      </div>
    </div>
  );
}

export default function PDFReaderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
      <PDFReaderContent />
    </Suspense>
  );
}
