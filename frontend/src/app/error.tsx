"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="max-w-md w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 p-12 rounded-sm shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-500/10 rounded-bl-full -z-10" />
        
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto mb-8 rounded-full">
          <AlertCircle size={32} strokeWidth={1.5} />
        </div>
        
        <h2 className="text-3xl font-heading font-black tracking-tight uppercase mb-4 text-zinc-900 dark:text-white">
          We Hit a Snag
        </h2>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium mb-10">
          Something unexpected happened while loading this page. Our team has been automatically notified and is looking into it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          
          <Link 
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={14} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
