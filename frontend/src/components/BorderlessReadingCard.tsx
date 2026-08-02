"use client";

import { Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import TranslationDrawer from "./TranslationDrawer";

interface BorderlessReadingCardProps {
  contentId: string;
  originalLanguage: string;
  isDarkMode?: boolean;
}

export default function BorderlessReadingCard({ contentId, originalLanguage, isDarkMode }: BorderlessReadingCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A hardcoded count for demo purposes based on requirements, 
  // but typically fetched from parent or own hook.
  const totalLanguages = 50;
  const processing = 4;
  const ready = 12;

  return (
    <>
      <div className={`mt-12 mb-16 p-6 md:p-8 rounded-sm border ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100"} flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-sm ${isDarkMode ? "bg-black text-white" : "bg-white text-black border border-zinc-200 shadow-sm"}`}>
            <Globe size={20} />
          </div>
          <div>
            <h4 className="font-heading font-black text-lg uppercase tracking-tight mb-1">Borderless Reading</h4>
            <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-500"} leading-relaxed max-w-md`}>
              This content is written in <span className="font-bold uppercase">{originalLanguage}</span>. It is currently available in {ready} languages and actively translating to {processing} more.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-200/20 pt-6 md:pt-0 md:pl-8">
          <div className="flex gap-6">
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} mb-1`}>Available</p>
              <p className="font-heading font-bold text-xl">{ready}</p>
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} mb-1`}>Processing</p>
              <p className="font-heading font-bold text-xl text-amber-500">{processing}</p>
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} mb-1`}>Total</p>
              <p className="font-heading font-bold text-xl">{totalLanguages}</p>
            </div>
          </div>
          <button 
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center justify-center p-3 rounded-full hover:scale-110 transition-transform ${isDarkMode ? "bg-zinc-800 text-white" : "bg-zinc-200 text-black"}`}
            title="View All Languages"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <TranslationDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        contentId={contentId} 
        originalLanguage={originalLanguage}
      />
    </>
  );
}
