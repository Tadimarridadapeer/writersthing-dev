"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/config";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles,
  Feather, 
  Upload, 
  TrendingUp,
  Zap,
  ShieldCheck,
  Users,
  BookOpen,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  
  // Landing page exclusively
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/marketplace");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const booksRes = await fetch(getApiUrl("/api/books"));
        const booksData = await booksRes.json();
        // Just take top 4 for the landing page
        setBooks((booksData || []).slice(0, 4));
      } catch (err) {
        console.error("Landing feed fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col bg-white">
      {/* Dynamic Keyframes for seamless infinite marquee scrolling */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />

      {/* Hero Section styled as a perfect typographic blueprint sheet fitting exactly one viewport */}
      <section 
        className="relative w-full min-h-[calc(100vh-96px)] flex flex-col justify-between overflow-hidden bg-white select-none border-b border-zinc-100"
        style={{
          backgroundImage: "radial-gradient(circle, #f3f3f3 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      >
        {/* Massive Typographic Watermark Behind Heading */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden -z-10">
          <span className="text-[25vw] font-heading font-black text-zinc-50/70 leading-none tracking-tighter uppercase select-none pr-12">
            WRITERS
          </span>
        </div>

        {/* Corner Crop Marks for Premium Technical Blueprint feel */}
        <div className="absolute top-6 left-6 text-zinc-300 font-mono text-[9px] select-none tracking-widest pointer-events-none flex items-center gap-2">
          <span>+</span> <span>[WT_SYS_01]</span>
        </div>
        <div className="absolute top-6 right-6 text-zinc-300 font-mono text-[9px] select-none tracking-widest pointer-events-none text-right flex items-center gap-2 justify-end">
          <span>[SHEET_01/01]</span> <span>+</span>
        </div>
        <div className="absolute bottom-20 left-6 text-zinc-300 font-mono text-[9px] select-none tracking-widest pointer-events-none flex items-center gap-2">
          <span>+</span> <span>[STATUS: ACTIVE]</span>
        </div>
        <div className="absolute bottom-20 right-6 text-zinc-300 font-mono text-[9px] select-none tracking-widest pointer-events-none text-right flex items-center gap-2 justify-end">
          <span>[COMMISSION: 10%]</span> <span>+</span>
        </div>

        {/* Main Centered Typographic Hero Area */}
        <div className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 py-12">
          <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 flex flex-col items-center">
            
            {/* Animated Header Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full select-none"
            >
              <Sparkles size={12} className="text-zinc-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Unleash the Narrative</span>
            </motion.div>

            {/* Huge Typographic Heading */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[10vw] sm:text-[8vw] md:text-[6.5vw] lg:text-[5.5vw] xl:text-[5.2vw] font-heading font-black tracking-ultra-tight uppercase leading-[0.88] text-center select-none text-zinc-950"
            >
              Where <span className="serif italic font-normal text-primary/70 normal-case pr-2 grayscale hover:grayscale-0 transition-all duration-300 cursor-default">unknown</span> <br />
              writers become <br />
              <span className="bg-gradient-to-r from-primary to-secondary text-white px-6 md:px-10 py-1.5 md:py-3 inline-block rotate-[-1.5deg] transform shadow-xl shadow-indigo-500/20 mt-4 md:mt-2 font-black select-none leading-none rounded-2xl grayscale hover:grayscale-0 hover:rotate-0 transition-all duration-500 cursor-default">KNOWN.</span>
            </motion.h1>

            {/* Descriptive Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-sm md:text-base lg:text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto text-balance"
            >
              Pour your thoughts into a distraction-free manuscript editor, publish with a single click, and unlock books globally for a flat, honest rate of <strong className="text-primary font-extrabold">₹99</strong>. No subscriptions, just pure storytelling.
            </motion.p>

            {/* Core Interactive Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 w-full max-w-md sm:max-w-none"
            >
              <Link 
                href="/signup?role=Author" 
                className="w-full sm:w-auto px-10 md:px-14 py-4 md:py-5 button-premium text-white rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] shadow-[0_8px_24px_rgba(99,102,241,0.25)] flex items-center justify-center gap-4 group grayscale hover:grayscale-0 transition-all duration-500"
              >
                Start Writing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link 
                href="/signup?redirect=/explore" 
                className="w-full sm:w-auto px-10 md:px-14 py-4 md:py-5 bg-white text-zinc-700 border border-zinc-200 hover:border-primary/50 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-sm flex items-center justify-center"
              >
                Next
              </Link>
            </motion.div>

          </div>
        </div>

        {/* Scrolling Ticker Marquee of Live Books Archive at page bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full border-t border-zinc-100 bg-zinc-50/50 py-4 overflow-hidden relative select-none"
        >
          <div className="whitespace-nowrap flex gap-12 animate-marquee font-mono text-[9px] md:text-[10px] text-zinc-400 font-black uppercase tracking-widest">
            {[...Array(3)].map((_, groupIdx) => (
              <div key={groupIdx} className="flex gap-16 shrink-0">
                {books.length > 0 ? (
                  books.map((book) => (
                    <span key={`${groupIdx}-${book.id}`} className="flex items-center gap-2">
                      <span className="text-black font-black">◆</span>
                      <span>{book.title}</span>
                      <span className="text-zinc-300">BY</span>
                      <span className="text-zinc-800">{book.authors?.name || book.author?.name || "Dadapeer"}</span>
                      <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm">₹99</span>
                    </span>
                  ))
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="text-black font-black">◆</span>
                      <span>The Art of Prompt</span>
                      <span className="text-zinc-300">BY</span>
                      <span className="text-zinc-800">Tadimarri Dadapeer</span>
                      <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm">₹99</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-black font-black">◆</span>
                      <span>Unleash the Narrative</span>
                      <span className="text-zinc-300">BY</span>
                      <span className="text-zinc-800">Unknown Writer</span>
                      <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm">₹99</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-black font-black">◆</span>
                      <span>The Digital Manuscript</span>
                      <span className="text-zinc-300">BY</span>
                      <span className="text-zinc-800">Antigravity AI</span>
                      <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm">₹99</span>
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Trending Manuscripts */}
      <section id="explore" className="section-padding bg-zinc-50 border-b border-zinc-100">
        <div className="unified-axis text-center mb-24">
          <h2 className="text-h1 tracking-ultra-tight uppercase mb-6">Trending Manuscripts</h2>
          <p className="text-zinc-500 font-medium text-lg italic max-w-2xl mx-auto">The most read digital manuscripts this week. Pure content, zero distractions. All available for ₹99.</p>
        </div>
        
        <div className="unified-axis">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {loading ? (
              <div className="col-span-full text-center py-12 text-xs font-black uppercase tracking-widest text-zinc-350">
                Synchronizing Archive...
              </div>
            ) : books.length > 0 ? (
              books.map((book) => (
                <Link key={book.id} href={`/book/${book.id}`} className="group">
                  <div className="aspect-[2/3] bg-white rounded-3xl overflow-hidden relative mb-6 shadow-md border border-zinc-150/80 group-hover:translate-y-[-8px] group-hover:shadow-2xl group-hover:border-primary/20 transition-all duration-500">
                    <img src={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800"} alt={book.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-5 py-2.5 rounded-full">View Details</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">{book.category || book.genre || "Fiction"}</p>
                  <h3 className="text-xl font-heading font-black tracking-tight uppercase mb-1">{book.title}</h3>
                  <p className="text-sm font-medium text-zinc-400 italic">by {book.authors?.name || book.author?.name || "Unknown"}</p>
                </Link>
              ))
            ) : (
              <Link href="/marketplace" className="group">
                <div className="aspect-[2/3] bg-white rounded-3xl overflow-hidden relative mb-6 shadow-md border border-zinc-150/80 group-hover:translate-y-[-8px] group-hover:shadow-2xl group-hover:border-primary/20 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800" alt="The Art of Prompt" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-5 py-2.5 rounded-full">View Details</span>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Education Sector</p>
                <h3 className="text-xl font-heading font-black tracking-tight uppercase mb-1">The Art of Prompt</h3>
                <p className="text-sm font-medium text-zinc-400 italic">by Tadimarri Dadapeer</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white">
        <div className="unified-axis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-32">
            <ProcessItem 
              number="01" 
              title="Write" 
              icon={<Feather size={24} />}
              description="Pour your thoughts into our distraction-free manuscript editor. Focus only on the words that matter."
            />
            <ProcessItem 
              number="02" 
              title="Publish" 
              icon={<Upload size={24} />}
              description="One-click publishing to our global audience. Every ebook sold at a flat ₹99 rate."
            />
            <ProcessItem 
              number="03" 
              title="Earn" 
              icon={<TrendingUp size={24} />}
              description="Get paid directly by your fans. Minimal commissions, maximum creative freedom."
            />
          </div>
        </div>
      </section>

      {/* Pricing / Join Section */}
      <section id="pricing" className="py-12 md:py-20 bg-white overflow-hidden relative flex flex-col justify-center min-h-[90vh]">
        <div className="absolute inset-0 bg-zinc-50/50 -z-10" />
        <div className="unified-axis relative w-full">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white rounded-full mb-6">
                <Sparkles size={14} className="text-zinc-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Premium Membership</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-black tracking-ultra-tight text-black mb-10 uppercase leading-none">
                Ready to turn your <br /> manuscript into a legacy?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 max-w-4xl mx-auto text-left">
                <div className="p-6 md:p-8 border border-zinc-200 bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 md:mb-6 text-primary">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-lg md:text-xl font-heading font-bold uppercase mb-3 tracking-tighter text-zinc-900">Flat Pricing</h3>
                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">Every manuscript on the platform is priced at a fixed ₹99. No subscriptions, no hidden fees.</p>
                </div>

                <div className="p-6 md:p-8 border border-zinc-200 bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4 md:mb-6 text-secondary">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-lg md:text-xl font-heading font-bold uppercase mb-3 tracking-tighter text-zinc-900">Total Ownership</h3>
                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">Buy once, own forever. Access your library from any device, anytime, with our distraction-free reader.</p>
                </div>

                <div className="p-6 md:p-8 border border-zinc-200 bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 md:mb-6 text-accent">
                    <Users size={20} />
                  </div>
                  <h3 className="text-lg md:text-xl font-heading font-bold uppercase mb-3 tracking-tighter text-zinc-900">Author Direct</h3>
                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">We take a minimal commission. Most of your ₹99 goes directly into the author's pocket.</p>
                </div>
              </div>

              <Link 
                href="/signup" 
                className="inline-block px-16 py-6 button-premium text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-full shadow-[0_12px_40px_rgba(99,102,241,0.3)]"
              >
                Join Writersthing Pro
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryRow({ label }: { label: string }) {
  return (
    <Link href={`/marketplace?category=${label}`} className="flex justify-between items-center py-8 md:py-10 border-b border-zinc-100 group cursor-pointer">
      <span className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tighter text-zinc-200 group-hover:text-black transition-all duration-500 uppercase">
        {label}
      </span>
      <ArrowRight size={24} className="md:w-8 md:h-8 text-zinc-100 transition-all duration-500 group-hover:translate-x-2 group-hover:text-black" />
    </Link>
  );
}

function ProcessItem({ number, title, icon, description }: any) {
  return (
    <div className="flex flex-col gap-6 md:gap-10 group cursor-default grayscale hover:grayscale-0 transition-all duration-500">
      <div className="flex items-center gap-6">
        <span className="text-6xl font-heading font-black tracking-tighter text-zinc-800 group-hover:text-primary transition-all duration-500">
          {number}
        </span>
        <div className="p-4 border border-zinc-800 rounded-2xl bg-zinc-900/50 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-500">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-heading font-black tracking-tight uppercase mb-6">{title}</h3>
        <p className="text-zinc-400 font-medium leading-relaxed text-lg">{description}</p>
      </div>
    </div>
  );
}
