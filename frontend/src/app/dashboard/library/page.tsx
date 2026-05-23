"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Link from "next/link";
import { BookOpen, Download, Star, Search, Clock, ChevronRight } from "lucide-react";

export default function LibraryPage() {
  const books = [
    { id: 1, title: "The Art of Minimalism", author: "Sarah Jenkins", cover: "bg-zinc-900", progress: 85, category: "Design" },
    { id: 2, title: "Quantum Ethics", author: "Dr. Aris Thorne", cover: "bg-black", progress: 30, category: "Science" },
    { id: 3, title: "Modern Scribes", author: "Aarav Sharma", cover: "bg-zinc-800", progress: 100, category: "Culture" },
    { id: 4, title: "Beyond the Horizon", author: "Elena Rossi", cover: "bg-zinc-700", progress: 0, category: "Fiction" },
    { id: 5, title: "Digital Stoicism", author: "Marcus Digital", cover: "bg-zinc-950", progress: 12, category: "Philosophy" },
    { id: 6, title: "The Silent Echo", author: "Julian Vane", cover: "bg-zinc-900", progress: 45, category: "Mystery" },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Personal Collection</p>
            <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase">Library</h1>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input 
              type="text" 
              placeholder="Search your library..."
              className="w-full bg-white border border-zinc-100 rounded-sm py-3 pl-12 pr-4 text-xs font-medium outline-none focus:border-black transition-all shadow-sm"
            />
          </div>
        </header>

        {/* Categories Bar */}
        <div className="flex gap-8 mb-12 pb-4 border-b border-zinc-100">
          {["All Titles", "In Progress", "Finished", "Wishlist"].map((cat, i) => (
            <button 
              key={cat} 
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? "text-black border-b-2 border-black pb-4 -mb-4.5" : "text-zinc-300 hover:text-black"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {books.map((book) => (
            <div key={book.id} className="group cursor-pointer">
              <div className="flex gap-6 p-6 bg-white border border-zinc-100 rounded-sm shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500">
                {/* Book Cover Mockup */}
                <div className={`w-32 h-44 ${book.cover} flex-shrink-0 relative overflow-hidden shadow-2xl rounded-sm`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    <p className="text-[6px] font-black uppercase tracking-widest text-zinc-400 mb-1">{book.category}</p>
                    <h5 className="text-[10px] font-black uppercase text-white leading-tight">{book.title}</h5>
                  </div>
                </div>

                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-sm">{book.category}</span>
                      <button className="text-zinc-200 hover:text-yellow-500 transition-colors"><Star size={14} /></button>
                    </div>
                    <h3 className="text-xl font-heading font-black uppercase tracking-tight leading-none mb-2">{book.title}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">by {book.author}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className="text-zinc-400">{book.progress}% Complete</span>
                        <Clock size={10} className="text-zinc-300" />
                      </div>
                      <div className="w-full bg-zinc-50 h-1 rounded-full overflow-hidden">
                        <div className="bg-black h-full transition-all duration-1000" style={{ width: `${book.progress}%` }} />
                      </div>
                    </div>
                    
                    <button className="w-full flex items-center justify-between py-3 px-4 bg-zinc-50 hover:bg-black hover:text-white transition-all rounded-sm">
                      <span className="text-[9px] font-black uppercase tracking-widest">{book.progress === 100 ? "Re-read" : "Continue Reading"}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State / Explore More */}
        <div className="mt-20 p-20 border-2 border-dashed border-zinc-100 rounded-sm flex flex-col items-center justify-center text-center">
          <BookOpen size={48} className="text-zinc-100 mb-8" />
          <h2 className="text-3xl font-heading font-black uppercase tracking-tighter mb-4">Expand Your Horizon</h2>
          <p className="text-zinc-400 font-medium italic max-w-md mb-10">Discover thousands of new manuscripts from emerging writers in our marketplace.</p>
          <Link href="/marketplace" className="px-12 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl">
            Explore Marketplace
          </Link>
        </div>
      </main>
    </div>
  );
}
