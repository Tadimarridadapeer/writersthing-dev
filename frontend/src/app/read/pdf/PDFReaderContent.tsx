"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFReaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get("id");
  const title = searchParams.get("title") || "Digital Manuscript";
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerHeight, setContainerHeight] = useState<number>(800);

  useEffect(() => {
    const updateHeight = () => setContainerHeight(window.innerHeight - 140);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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

        const res = await fetch(`/api/books/${bookId}/download`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (res.ok) {
          setPdfUrl(data.url);
        } else {
          const debugInfo = data.debug_error ? ` | Debug: ${JSON.stringify(data.debug_error)} | ID: ${data.debug_id}` : "";
          setError((data.message || "Failed to load manuscript") + debugInfo);
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
          <div className="relative h-full flex justify-center overflow-auto items-start pt-8 pb-16">
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setLoading(false);
              }}
              className="shadow-2xl flex justify-center relative"
              loading={null}
            >
              <Page 
                pageNumber={pageNumber} 
                height={containerHeight}
                className="bg-white"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              
              {/* Floating Controls - Inside the Page container */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#2c2c2e]/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl z-50 border border-white/10 text-[9px]">
                <button 
                  className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="h-4 w-px bg-white/10" />
                <span className="font-black uppercase tracking-widest px-2 text-zinc-400 min-w-[100px] text-center">
                  Page <span className="text-white">{pageNumber.toString().padStart(2, '0')}</span> / {numPages ? numPages.toString().padStart(2, '0') : '--'}
                </span>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPageNumber(prev => numPages ? Math.min(prev + 1, numPages) : prev + 1)}
                  disabled={numPages ? pageNumber >= numPages : true}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </Document>
          </div>
        )}
      </main>

      {/* Subtle Overlay Branding */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-10">
        <span className="text-4xl font-heading font-black italic tracking-tighter uppercase">Writersthing</span>
      </div>
    </div>
  );
}
