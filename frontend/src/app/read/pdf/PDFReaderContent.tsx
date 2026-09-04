"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import Link from "next/link";
import { ReviewSection } from "@/components/ReviewSection";
import { OptimizedImage } from "@/components/OptimizedImage";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFReaderContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  // Try to get bookId from query string (?id=...) OR route parameter (/read/[id] or /read/[bookId])
  const bookId = searchParams.get("id") || (params?.id as string) || (params?.bookId as string);
  const title = searchParams.get("title") || "Digital Manuscript";

  console.log("=== READER DEBUG ===");
  console.log("Route Params:", params);
  console.log("Search Params ID:", searchParams.get("id"));
  console.log("Resolved bookId:", bookId);
  console.log("====================");
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerHeight, setContainerHeight] = useState<number>(800);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [bookMeta, setBookMeta] = useState<any>(null);
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);

  useEffect(() => {
    if (!bookId) return;
    const fetchMeta = async () => {
      const { data } = await supabase.from('books').select('*, authors:author_id(*, users!authors_user_id_fkey(name))').eq('id', bookId).maybeSingle();
      if (data) {
        setBookMeta(data);
        if (data.category) {
          const { data: related } = await supabase.from('books')
            .select('id, title, cover_url, cover_image, authors:author_id(*, users!authors_user_id_fkey(name))')
            .eq('category', data.category)
            .neq('id', bookId)
            .limit(4);
          if (related) setRelatedBooks(related);
        }
      }
    };
    fetchMeta();
  }, [bookId]);

  useEffect(() => {
    const updateDimensions = () => {
      setContainerHeight(window.innerHeight - 140);
      setContainerWidth(Math.min(window.innerWidth - 48, 800)); // Allow 24px padding on each side, max 800px width
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const fetchAccess = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push(`/login?redirect=${encodeURIComponent(`/read/pdf?id=${bookId}`)}`);
        return;
      }

      if (!bookId) {
        setError("Missing Book ID");
        setLoading(false);
        return;
      }

      try {
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        if (parsedUser?.id) {
          headers["x-user-id"] = parsedUser.id;
        }

        const res = await fetch(`/api/books/${bookId}/download`, {
          headers
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Server returned invalid response format. Status: ${res.status}`);
        }

        const data = await res.json();

        if (res.ok) {
          setPdfUrl(data.url);
        } else {
          const debugInfo = data.debug_error ? ` | Debug: ${JSON.stringify(data.debug_error)} | ID: ${data.debug_id}` : "";
          setError((data.message || "Failed to load manuscript") + debugInfo);
        }
      } catch (err: any) {
        console.error("PDF Fetch Error:", err);
        setError(`System error: ${err.message}`);
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
                height={containerWidth < 768 ? undefined : containerHeight}
                width={containerWidth < 768 ? containerWidth : undefined}
                className="bg-white"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              
              
            </Document>

            {/* Floating Controls - Fixed to the viewport instead of the book */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#2c2c2e]/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl z-50 border border-white/10 text-[9px]">
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
          </div>
        )}
      </main>

      {/* Community Features Toggle */}
      {!isFullscreen && bookId && bookMeta && (
        <div className="bg-zinc-50 text-zinc-900 border-t border-zinc-200 flex flex-col items-center">
          {!showCommunity ? (
            <div className="py-16 w-full text-center">
              <button 
                onClick={() => setShowCommunity(true)}
                className="px-8 py-3 bg-white border border-zinc-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 rounded-xl transition-all"
              >
                Show Community & Reviews
              </button>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto py-16 px-8 relative">
              <button 
                onClick={() => setShowCommunity(false)}
                className="absolute top-8 right-8 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-800 transition-colors"
              >
                Hide Community
              </button>
              <ReviewSection contentId={bookId} contentType="book" authorId={bookMeta.author_id} />
              
              {relatedBooks.length > 0 && (
                <div className="mt-16 pt-8 border-t border-zinc-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">You May Also Like</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {relatedBooks.map(b => (
                      <Link key={b.id} href={`/book/${b.id}`} className="group block">
                        <div className="w-full aspect-[3/4.5] bg-zinc-100 rounded-sm overflow-hidden mb-3 grayscale group-hover:grayscale-0 transition-all shadow-sm group-hover:shadow-md border border-zinc-200">
                          <OptimizedImage 
                            src={b.cover_url || b.cover_image || "/placeholder-cover.jpg"} 
                            alt={b.title} 
                            variant="book-cover"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <h4 className="font-heading font-bold text-sm uppercase tracking-tight leading-tight line-clamp-2 mb-1">{b.title}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">by {Array.isArray(b.authors) ? b.authors[0]?.name || b.authors[0]?.users?.name : b.authors?.name || b.authors?.users?.name || "Unknown Author"}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtle Overlay Branding */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-10 z-[100]">
        <span className="text-4xl font-heading font-black italic tracking-tighter uppercase">Writersthing</span>
      </div>
    </div>
  );
}
