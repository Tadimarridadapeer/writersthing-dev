"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, 
  Settings, 
  Menu,
  Bell,
  Moon,
  Sun,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Highlighter,
  MessageSquare,
  Download
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ReaderPage() {
  const [progress, setProgress] = useState(45);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const params = useParams();
  const id = params?.id;
  const isArtOfPrompt = id === "the-art-of-prompt";

  const bookData = isArtOfPrompt ? {
    title: "THE ART OF PROMPT",
    author: "TADIMARRI DADAPEER",
    intro: "Why This Book Matters",
    content: `Today, students have access to powerful AI tools that can answer almost anything. But most students still struggle—not because information is unavailable, but because they don’t know how to ask the right questions.

That is where The Art of Prompt makes a difference.

This book is not just about using AI. It is about learning a skill that will stay valuable for life: the ability to think clearly and ask better questions.`,
    toc: ["Introduction", "Why This Book Matters", "What You Will Learn", "Practical Learning System", "Interactive Tools"],
    authorBio: "Tadimari Dadapeer is an educational visionary exploring the frontier of AI-assisted learning. He focuses on empowering students with the cognitive tools needed to navigate the digital age responsibly and effectively."
  } : {
    title: "The Alchemist of Neo-Tokyo",
    author: "Elena Vance",
    intro: "The Neon Gate",
    content: "The rain in Neo-Tokyo didn't just fall; it stained. It was a cocktail of heavy metals and neon light, washing over the carbon-fiber skyscrapers of the Shinjuku district. Kaito pulled his collar up, the sensors in his coat humming as they filtered the toxicity from the air.",
    toc: ["Introduction", "Chapter 4: The Neon Gate", "Chapter 5: Digital Ghosts", "Chapter 6: Final Protocol"],
    authorBio: "Elena Vance is a speculative fiction writer exploring the intersection of human consciousness and emerging technologies. Her work has been featured in The Manuscript Review and Wired Digital."
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black text-white" : "bg-[#FCFCFC] text-black"} transition-colors duration-500`}>
      {/* Top Navigation */}
      <header className={`fixed top-0 left-0 w-full h-20 border-b ${isDarkMode ? "border-zinc-900 bg-black" : "border-zinc-100 bg-white"} z-50 px-12 flex items-center justify-between`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading font-black text-2xl uppercase tracking-tighter italic">Writersthing</Link>
          <div className="h-6 w-px bg-zinc-200" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">READING:</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{bookData.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            <div className="w-32 h-1 bg-zinc-100 relative rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-black transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{progress}% READ</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-zinc-50 rounded-sm">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Bell size={18} className="text-zinc-400 cursor-pointer" />
            <div className="w-8 h-8 bg-zinc-100 rounded-sm overflow-hidden grayscale">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100" alt="User" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex pt-20">
        {/* Left Sidebar */}
        <aside className={`w-80 h-[calc(100vh-80px)] sticky top-20 p-12 border-r ${isDarkMode ? "border-zinc-900" : "border-zinc-100"}`}>
          <div className="mb-16">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">Table of Contents</h3>
            <nav className="space-y-4">
              {bookData.toc.map((item, i) => (
                <TOCLink key={i} title={item} active={i === 1} />
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">Reading Tools</h3>
            <div className="space-y-4">
              <ToolLink icon={<Bookmark size={16} />} label="Add Bookmark" hasArrow />
              <ToolLink icon={<Highlighter size={16} />} label="Highlights (12)" hasArrow />
              <ToolLink icon={<MessageSquare size={16} />} label="Reader Comments" count={42} />
              {isArtOfPrompt && <ToolLink icon={<Download size={16} />} label="Download E-Book" hasArrow />}
            </div>
          </div>
        </aside>

        {/* Reading Area */}
        <main className="flex-grow py-32 px-48 max-w-5xl">
          <article className="prose prose-zinc max-w-none">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6">Chapter One</p>
            <h1 className="text-8xl font-heading font-black tracking-ultra-tight uppercase mb-12 leading-none">{bookData.intro}</h1>
            
            <div className="flex items-center gap-6 mb-20 border-b border-zinc-100 pb-12">
              <div className="w-10 h-10 bg-zinc-100 rounded-sm overflow-hidden grayscale">
                <img src={isArtOfPrompt ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"} alt={bookData.author} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">{bookData.author}</p>
                <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest mt-1">Published 02 May 2026 • 15 Min Read</p>
              </div>
            </div>

            <div className={`space-y-10 text-xl leading-[1.8] font-body ${isDarkMode ? "text-zinc-300" : "text-zinc-800"} tracking-tight`}>
              <p className="first-letter:text-8xl first-letter:font-heading first-letter:font-black first-letter:float-left first-letter:mr-6 first-letter:leading-none">
                {bookData.content.split('\n')[0]}
              </p>
              
              {bookData.content.split('\n').filter(p => p.trim() !== "").slice(1).map((p, i) => (
                <p key={i}>{p}</p>
              ))}

              <blockquote className={`border-l-4 ${isDarkMode ? "border-white" : "border-black"} pl-12 py-8 my-20 italic text-4xl font-serif text-zinc-400 leading-tight`}>
                {isArtOfPrompt ? "Master the way you ask. Shape the way you learn." : '"The truth is never written in ink anymore. It\'s written in light, and light can be turned off."'}
              </blockquote>

              {!isArtOfPrompt && (
                <p>
                  He reached the gate—a shimmer of electromagnetic distortion that separated the residential sectors from the server farms. It was known as the Neon Gate, a threshold where biology ended and pure data began. To cross it was to surrender your history for a chance at immortality.
                </p>
              )}
            </div>

            <div className={`mt-40 p-20 ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100"} rounded-sm border flex items-center gap-12`}>
              <div className="w-32 h-32 bg-zinc-200 flex-shrink-0 grayscale rounded-sm overflow-hidden">
                <img src={isArtOfPrompt ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} alt={bookData.author} />
              </div>
              <div className="flex-grow">
                <h3 className="text-3xl font-heading font-black tracking-tight uppercase mb-4">{bookData.author}</h3>
                <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8">
                  {bookData.authorBio}
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105">Support Author</button>
                  <button className="px-8 py-3 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Follow Updates</button>
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

function TOCLink({ title, active }: any) {
  return (
    <div className={`flex items-center justify-between group cursor-pointer transition-colors ${active ? "text-black dark:text-white" : "text-zinc-400 hover:text-black dark:hover:text-white"}`}>
      <span className={`text-xs font-bold ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>{active ? `• ${title}` : title}</span>
      {active && <div className="h-0.5 w-8 bg-current" />}
    </div>
  );
}

function ToolLink({ icon, label, hasArrow, count }: any) {
  return (
    <div className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-all cursor-pointer group rounded-sm bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center gap-4 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {hasArrow && <ChevronRight size={14} className="text-zinc-200 group-hover:translate-x-1 transition-all" />}
      {count && <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>}
    </div>
  );
}
