"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/marketplace");
    }
  }, [user, authLoading, router]);

  return (
    <div className="flex flex-col w-full selection:bg-zinc-900 selection:text-white font-sans overflow-hidden">
      
      {/* =========================================
          CHAPTER 1: THE SPARK (Hero)
          ========================================= */}
      <section className="relative w-full h-[calc(100vh-80px)] flex flex-col justify-center items-center bg-white text-black px-6 overflow-hidden">
        {/* Dot Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
        
        {/* Corner Accents */}
        <div className="absolute top-6 left-6 text-[10px] font-mono text-zinc-400 flex items-center gap-2 tracking-widest hidden md:flex">
          <span>+</span>
          <span>[WT_SYS_01]</span>
        </div>
        <div className="absolute top-6 right-6 text-[10px] font-mono text-zinc-400 flex items-center gap-2 tracking-widest hidden md:flex">
          <span>[SHEET_01/01]</span>
          <span>+</span>
        </div>
        <div className="absolute bottom-6 left-6 text-[10px] font-mono text-zinc-400 flex items-center gap-2 tracking-widest hidden md:flex">
          <span>+</span>
          <span>[STATUS: ACTIVE]</span>
        </div>
        <div className="absolute bottom-6 right-6 text-[10px] font-mono text-zinc-400 flex items-center gap-2 tracking-widest hidden md:flex">
          <span>[COMMISSION: 10%]</span>
          <span>+</span>
        </div>

        {/* Top Pill Badge */}
        <div className="absolute top-12 left-12 md:left-24 z-10 hidden md:block">
          <div className="px-5 py-2 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
            <span className="text-zinc-400">✨</span> PROLOGUE
          </div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center mt-4">
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-0 md:space-y-1"
          >
            {/* Line 1 */}
            <div className="flex flex-wrap justify-center items-baseline gap-3 md:gap-4 text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] leading-[1.1] text-[#0f172a]">
              <span className="font-black tracking-tight" style={{ fontFamily: 'var(--font-outfit)' }}>WHERE</span>
              <span className="italic font-normal text-zinc-400 lowercase text-[2.5rem] sm:text-[3rem] md:text-[4rem] lg:text-[5rem]" style={{ fontFamily: 'var(--font-eb-garamond)' }}>unknown</span>
            </div>
            
            {/* Line 2 */}
            <div className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] leading-[1.1] text-[#0f172a] font-black tracking-tight uppercase" style={{ fontFamily: 'var(--font-outfit)' }}>
              WRITERS BECOME
            </div>

            {/* Line 3 (Rotated Badge) */}
            <div className="mt-3 md:mt-5 transform -rotate-2 hover:-rotate-1 transition-transform duration-500">
              <div className="bg-[#111111] text-white px-6 py-2 md:px-10 md:py-3 rounded-xl md:rounded-3xl shadow-xl border-b-4 border-black/20">
                <span className="text-[1.5rem] sm:text-[2rem] md:text-[3rem] lg:text-[3.5rem] leading-none font-black tracking-tight uppercase block pt-1 md:pt-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                  KNOWN.
                </span>
              </div>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="text-[15px] md:text-[16px] text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto mt-6 md:mt-8 px-4"
            style={{ fontFamily: 'var(--font-libre-baskerville)' }}
          >
            A publishing platform for storytellers, authors, and writers who believe every great story deserves to be read.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-6 md:pt-8 flex flex-col sm:flex-row justify-center items-center gap-4 px-6"
          >
            <Link 
              href="/login" 
              className="px-10 py-4 bg-black text-white hover:bg-zinc-900 transition-colors duration-300 uppercase tracking-[0.2em] text-xs font-semibold rounded-none w-full sm:w-auto text-center"
            >
              Start Writing
            </Link>
            <Link 
              href="/marketplace" 
              className="px-10 py-4 bg-white text-black border border-zinc-200 hover:border-black transition-colors duration-300 uppercase tracking-[0.2em] text-xs font-semibold rounded-none w-full sm:w-auto text-center"
            >
              Explore Stories
            </Link>
          </motion.div>
        </div>
      </section>

      {/* =========================================
          CHAPTER 2: THE QUIET ROOM
          ========================================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center bg-white text-black px-6 py-32 border-b border-black">
        <div className="absolute top-12 left-12 md:left-24 opacity-30 text-xs font-mono tracking-[0.3em] uppercase">
          Chapter One
        </div>

        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif italic font-light tracking-tight leading-tight">
              We built a quiet room <br /> for your mind.
            </h2>
            <p className="text-lg md:text-xl text-zinc-500 font-light leading-relaxed max-w-md">
              No complex formatting menus. No distracting pop-ups. No noise. Just you, the blank page, and the purity of your words. 
            </p>
          </motion.div>

          {/* Minimalist Editor Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full aspect-[3/4] md:aspect-square bg-zinc-50 border border-zinc-200 shadow-2xl p-10 md:p-16 flex flex-col relative"
          >
            <div className="w-full flex justify-between items-center mb-16 border-b border-zinc-200 pb-4">
              <span className="text-xs font-serif italic text-zinc-400">Writersthing</span>
              <span className="text-xs font-mono text-zinc-300 uppercase tracking-widest">Draft 01</span>
            </div>
            
            <h3 className="text-2xl md:text-4xl font-serif mb-8 text-black">The First Draft</h3>
            
            <div className="space-y-5 w-full max-w-sm">
              <div className="w-full h-[1px] bg-zinc-300" />
              <div className="w-[90%] h-[1px] bg-zinc-300" />
              <div className="w-[95%] h-[1px] bg-zinc-300" />
              <div className="w-[60%] h-[1px] bg-zinc-300" />
            </div>

            <div className="absolute bottom-10 right-12 opacity-10 font-serif italic text-8xl">W</div>
          </motion.div>

        </div>
      </section>

      {/* =========================================
          CHAPTER 3: THE STAGE
          ========================================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center bg-white text-black px-6 py-32 border-b border-black">
        <div className="absolute top-12 left-12 md:left-24 opacity-30 text-xs font-mono tracking-[0.3em] uppercase">
          Chapter Two
        </div>

        <div className="max-w-6xl w-full mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif italic font-light tracking-tight leading-tight mb-6">
              And a global stage <br /> for your voice.
            </h2>
            <p className="text-lg text-zinc-500 font-light max-w-xl mx-auto">
              Stories demand to be heard. We provide the vessel to carry your narrative to readers worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-black">
            
            {/* Books */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.1 }}
              className="border-b md:border-b-0 md:border-r border-black p-12 md:p-16 flex flex-col justify-between group hover:bg-black hover:text-white transition-colors duration-700 min-h-[400px]"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.4em] mb-12 opacity-50">01 / The Epic</div>
              <div>
                <h3 className="text-3xl font-serif italic mb-6">Books</h3>
                <p className="font-light text-sm leading-relaxed opacity-70">
                  Upload your completed manuscript. We format, distribute, and sell it globally for a flat, accessible rate. Your opus, preserved.
                </p>
              </div>
            </motion.div>

            {/* Stories */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="border-b md:border-b-0 md:border-r border-black p-12 md:p-16 flex flex-col justify-between group hover:bg-black hover:text-white transition-colors duration-700 min-h-[400px]"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.4em] mb-12 opacity-50">02 / The Serial</div>
              <div>
                <h3 className="text-3xl font-serif italic mb-6">Stories</h3>
                <p className="font-light text-sm leading-relaxed opacity-70">
                  Write serialized fiction or poetry natively. Release chapter by chapter. Keep your audience captivated week after week.
                </p>
              </div>
            </motion.div>

            {/* Blogs */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="p-12 md:p-16 flex flex-col justify-between group hover:bg-black hover:text-white transition-colors duration-700 min-h-[400px]"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.4em] mb-12 opacity-50">03 / The Insight</div>
              <div>
                <h3 className="text-3xl font-serif italic mb-6">Blogs</h3>
                <p className="font-light text-sm leading-relaxed opacity-70">
                  Share your daily musings, essays, and insights. Build a loyal following through raw, unfiltered, consistent thought.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =========================================
          CHAPTER 4: THE PLEDGE (Pricing)
          ========================================= */}
      <section id="pricing" className="relative w-full min-h-screen flex flex-col justify-center items-center bg-white text-black px-6 py-32">
        <div className="absolute top-12 left-12 md:left-24 opacity-30 text-xs font-mono tracking-[0.3em] uppercase">
          Epilogue
        </div>

        <div className="max-w-4xl w-full mx-auto text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="w-16 h-[1px] bg-black mx-auto mb-16" />
            
            <h2 className="text-4xl md:text-6xl font-serif italic font-light tracking-tight leading-tight mb-16">
              Keep your copyright. <br />
              Keep your royalties. <br />
              Keep writing.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-20 text-left">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-black pb-4">Flat Pricing</h3>
              <p className="text-zinc-600 font-light text-sm leading-relaxed pt-2">
                Every manuscript on the platform is priced at a fixed ₹99. No subscriptions, no hidden fees. Just honest economics between you and your reader.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-black pb-4">Total Ownership</h3>
              <p className="text-zinc-600 font-light text-sm leading-relaxed pt-2">
                Buy once, own forever. Readers access their library from any device, anytime, through our beautifully distraction-free reader interface.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-black pb-4">Author Direct</h3>
              <p className="text-zinc-600 font-light text-sm leading-relaxed pt-2">
                We take a minimal commission. The vast majority of your ₹99 goes directly into your pocket, exactly where it belongs.
              </p>
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <Link 
              href="/signup" 
              className="inline-block px-12 py-5 bg-black text-white hover:bg-zinc-800 transition-colors duration-500 uppercase tracking-[0.3em] text-xs font-semibold rounded-none"
            >
              Join Writersthing Pro
            </Link>
          </motion.div>

        </div>
      </section>

    </div>
  );
}
