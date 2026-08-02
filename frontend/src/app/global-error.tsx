"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight font-heading">
            System Failure
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            A critical error has occurred. Our engineering team has been notified automatically.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-left text-xs text-red-200 mt-4 overflow-auto">
            <p className="font-bold">Error Details (Debug Mode):</p>
            <p>{error?.message || "No error message provided."}</p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => reset()}
              className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-xl"
            >
              Restart Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
