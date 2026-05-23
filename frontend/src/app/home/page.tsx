"use client";

import { motion } from "framer-motion";
import { 
  Search, 
  Bell, 
  User, 
  Bookmark, 
  Clock, 
  MoreVertical,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function ReaderHomePage() {
  const categories = ["All Stories", "Philosophy", "Cyberpunk", "Visual Arts", "Poetry"];

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-12 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <span className="font-heading font-black text-2xl uppercase tracking-tighter italic">Writersthing</span>
          <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <Link href="/home" className="text-black">Explore</Link>
            <Link href="/categories" className="hover:text-black transition-colors">Categories</Link>
            <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <button className="bg-black text-white px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg">Become an Author</button>
          <Bell size={20} className="text-zinc-400 cursor-pointer hover:text-black transition-colors" />
          <div className="w-10 h-10 bg-zinc-100 rounded-sm overflow-hidden border border-zinc-200">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100" alt="Profile" className="w-full h-full object-cover grayscale" />
          </div>
        </div>
      </nav>

      <div className="unified-axis py-16">
        <header className="mb-16">
          <h1 className="text-h1 tracking-ultra-tight uppercase">Welcome back, Julian</h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mt-4">The Digital Manuscript • June 12, 2026</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            {/* Continue Reading Section */}
            <section className="mb-20">
              <div className="flex justify-between items-end mb-10">
                <h2 className="text-2xl font-heading font-black tracking-tight uppercase">Continue Reading</h2>
                <Link href="/library" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">View All</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ReadingProgressCard 
                  title="The Architect of Echoes" 
                  category="NOVELLA" 
                  progress={74} 
                  timeLeft="12 mins left"
                  image="https://images.unsplash.com/photo-1512820790803-73c7e6e9b3b9?q=80&w=400"
                />
                <ReadingProgressCard 
                  title="Post-Digital Solitude" 
                  category="ESSAY" 
                  progress={21} 
                  timeLeft="45 mins left"
                  image="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400"
                />
                <ReadingProgressCard 
                  title="Living Between the Lines" 
                  category="BIOGRAPHY" 
                  progress={92} 
                  timeLeft="2 mins left"
                  image="https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=400"
                />
              </div>
            </section>

            {/* Personalized Feed Section */}
            <section>
              <div className="flex flex-wrap gap-4 mb-12">
                {categories.map((cat, i) => (
                  <button 
                    key={cat} 
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? "bg-black text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-black"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-16">
                <FeedItem 
                  tag="FEATURED" 
                  time="8 MIN READ" 
                  title="The Silence of Digital Cities" 
                  author="ELENA VANCE"
                  description="Exploring the psychological impact of hyper-connectivity in the modern urban landscape and why we crave the unplugged..."
                  image="https://images.unsplash.com/photo-1449156059431-787c5d7139b8?q=80&w=800"
                />
                <FeedItem 
                  tag="TRENDING" 
                  time="15 MIN READ" 
                  title="Ink as a Living Interface" 
                  author="MARCUS THORNE"
                  description="Why physical writing instruments are making a comeback in the silicon age. A deep dive into the haptics of creation."
                  image="https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=800"
                />
                <FeedItem 
                  tag="NEW RELEASE" 
                  time="22 MIN READ" 
                  title="The Ghost Writer's Paradigm" 
                  author="SANA K."
                  description="A speculative fiction piece about AI that develops its own existential dread while writing memoirs for humans."
                  image="https://images.unsplash.com/photo-1492052722242-2554d0e99e3a?q=80&w=800"
                />
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            <div className="bg-white border border-zinc-100 p-10 rounded-sm shadow-sm">
              <h3 className="text-xl font-heading font-black tracking-tight uppercase mb-8">Your Library</h3>
              
              <div className="flex border-b border-zinc-100 mb-8">
                <button className="flex-grow pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-black text-black">Purchased</button>
                <button className="flex-grow pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-black transition-colors">Saved</button>
              </div>

              <div className="space-y-6">
                <LibraryItem title="The Weight of Words" meta="ANTHOLOGY • 2024" image="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=100" />
                <LibraryItem title="Neon Manuscripts" meta="SCI-FI • 2023" image="https://images.unsplash.com/photo-1614850523296-62c0af47596a?q=80&w=100" />
                <LibraryItem title="Modern Myths" meta="NON-FICTION • 2024" image="https://images.unsplash.com/photo-1512820790803-73c7e6e9b3b9?q=80&w=100" />
              </div>

              <button className="w-full mt-10 py-4 border border-zinc-100 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Go to Full Library</button>
            </div>

            <div className="bg-black text-white p-10 rounded-sm shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-6">Recommended Creator</p>
                <h3 className="text-3xl font-heading font-black tracking-tight uppercase mb-4">Arthur Penhaligon</h3>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                  The master of quiet horror and Victorian gothic tales joins Writersthing this week.
                </p>
                <button className="w-full bg-white text-black py-4 font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">Follow Author</button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -z-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadingProgressCard({ title, category, progress, timeLeft, image }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-video bg-zinc-200 mb-6 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{category}</p>
      <h3 className="font-heading font-black text-lg tracking-tight uppercase leading-none mb-6">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>{progress}% Complete</span>
          <span>{timeLeft}</span>
        </div>
        <div className="h-1 bg-zinc-200 w-full overflow-hidden">
          <div className="h-full bg-black transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function FeedItem({ tag, time, title, author, description, image }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 group cursor-pointer">
      <div className="md:col-span-4 aspect-[4/3] bg-zinc-200 overflow-hidden shadow-sm">
        <img src={image} alt={title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
      </div>
      <div className="md:col-span-8 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">{tag}</span>
          <span className="text-zinc-300">•</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{time}</span>
        </div>
        <h3 className="text-4xl font-heading font-black tracking-tight uppercase mb-4 leading-none group-hover:underline underline-offset-8 decoration-zinc-200">{title}</h3>
        <p className="text-zinc-500 font-medium text-lg leading-relaxed mb-6 line-clamp-2">{description}</p>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden grayscale">
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=50" alt={author} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{author}</span>
        </div>
      </div>
    </div>
  );
}

function LibraryItem({ title, meta, image }: any) {
  return (
    <div className="flex items-center gap-6 group cursor-pointer">
      <div className="w-12 h-16 bg-zinc-100 overflow-hidden shadow-sm flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-heading font-bold uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{meta}</p>
      </div>
      <button className="text-zinc-300 hover:text-black transition-colors">
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
