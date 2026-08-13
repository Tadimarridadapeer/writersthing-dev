"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Dynamically import the PDFReaderContent component with SSR disabled
// This prevents the "DOMMatrix is not defined" error because react-pdf 
// requires browser APIs (like DOMMatrix, window) that don't exist in Node.js
const PDFReaderContent = dynamic(() => import("./PDFReaderContent"), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
      <Loader2 size={32} className="animate-spin text-zinc-500" />
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Loading Reader Interface...</p>
    </div>
  )
});

export default function PDFReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    }>
      <PDFReaderContent />
    </Suspense>
  );
}
