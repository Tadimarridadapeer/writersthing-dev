"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ArrowLeft, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Writing Fundamentals", path: "/learn/writing-fundamentals" },
  { name: "Storytelling", path: "/learn/storytelling" },
  { name: "Character Development", path: "/learn/characters" },
  { name: "World Building", path: "/learn/world-building" },
  { name: "Publishing Guide", path: "/learn/publishing" },
  { name: "Marketing for Authors", path: "/learn/marketing" },
  { name: "AI for Writers", path: "/learn/ai" },
  { name: "Writing Resources", path: "/learn/resources" },
  { name: "Recommended Reading", path: "/learn/books" },
  { name: "Latest Articles", path: "/learn/articles" }
];

export default function LearnLayout({ 
  children, 
  title, 
  readingTime = "5 min read" 
}: { 
  children: React.ReactNode; 
  title: string;
  readingTime?: string;
}) {
  const pathname = usePathname();
  const currentIndex = CATEGORIES.findIndex(c => c.path === pathname);
  const prevCategory = currentIndex > 0 ? CATEGORIES[currentIndex - 1] : null;
  const nextCategory = currentIndex < CATEGORIES.length - 1 ? CATEGORIES[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-32">
            <Link href="/learn" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black mb-12 transition-colors">
              <ArrowLeft size={14} /> Back to Hub
            </Link>
            
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex flex-col gap-3">
              Learning Categories
              <div className="w-4 h-[1px] bg-black" />
            </h4>
            
            <ul className="flex flex-col gap-4">
              {CATEGORIES.map((cat) => (
                <li key={cat.path}>
                  <Link 
                    href={cat.path} 
                    className={`text-sm font-medium transition-colors block ${
                      pathname === cat.path 
                        ? "text-black font-bold" 
                        : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 lg:border-l lg:border-zinc-100 lg:pl-16 min-h-screen">
          
          {/* Mobile Breadcrumb */}
          <div className="lg:hidden mb-8">
            <Link href="/learn" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
              <ArrowLeft size={14} /> Back to Hub
            </Link>
          </div>

          <article>
            <header className="mb-16">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
                <span>Learn</span>
                <ChevronRight size={12} />
                <span>{title}</span>
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8 leading-tight"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {title}
              </motion.h1>
              
              <div className="flex items-center justify-between border-y border-zinc-100 py-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{readingTime}</span>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </header>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg prose-zinc max-w-none"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              {children}
            </motion.div>

          </article>

          {/* Prev/Next Navigation */}
          <div className="mt-24 pt-12 border-t border-zinc-100 grid grid-cols-2 gap-8">
            {prevCategory ? (
              <Link href={prevCategory.path} className="group flex flex-col gap-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors flex items-center gap-1">
                  <ArrowLeft size={12} /> Previous
                </span>
                <span className="font-bold text-lg group-hover:underline">{prevCategory.name}</span>
              </Link>
            ) : <div />}
            
            {nextCategory ? (
              <Link href={nextCategory.path} className="group flex flex-col gap-2 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors flex items-center justify-end gap-1">
                  Next <ArrowRight size={12} />
                </span>
                <span className="font-bold text-lg group-hover:underline">{nextCategory.name}</span>
              </Link>
            ) : <div />}
          </div>
        </main>

      </div>
    </div>
  );
}
