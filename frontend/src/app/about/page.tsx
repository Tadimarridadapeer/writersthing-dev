"use client";

import { motion } from "framer-motion";
import { Feather, Users, Zap, BarChart3, Globe, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-40">
        {/* Hero Section */}
        <section className="unified-axis mb-32">
          <div className="max-w-4xl">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-8"
            >
              The Mission of Writersthing
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-8xl font-heading font-black tracking-ultra-tight uppercase leading-[0.9] mb-12"
            >
              Where Unknown <br />
              Writers Become <br />
              <span className="text-zinc-200">Iconic Voices.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-500 text-2xl font-medium leading-relaxed max-w-2xl italic"
            >
              Writersthing is a premium ecosystem designed to bridge the gap between hidden talent and the global stage. We aren't just a platform; we are an analytical engine for the literary world.
            </motion.p>
          </div>
        </section>

        {/* What We Are Doing */}
        <section className="unified-axis mb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-heading font-black tracking-tight uppercase">What We Are Doing Here</h2>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  We are building a decentralized literary meritocracy. In the traditional publishing world, great voices are often silenced by gatekeepers. Here, the only thing that matters is the strength of your words. 
                </p>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  By integrating advanced analysis tools and direct creator-to-reader pathways, we ensure that every manuscript uploaded is given the attention it deserves.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-8 bg-zinc-50 rounded-sm border border-zinc-100 hover:border-black transition-all group">
                  <BarChart3 className="mb-6 text-zinc-400 group-hover:text-black transition-colors" size={32} />
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">Deep Analysis</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">We provide authors with reader engagement metrics and content analysis to help refine their craft.</p>
                </div>
                <div className="p-8 bg-black text-white rounded-sm shadow-2xl group">
                  <ShieldCheck className="mb-6 text-zinc-500 group-hover:text-white transition-colors" size={32} />
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">Integrity First</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed italic">Once published, content is permanently archived to protect the integrity of the platform and reader ownership.</p>
                </div>
              </div>
            </div>
            
            <div className="relative aspect-square">
               <div className="absolute inset-0 bg-zinc-100 rounded-sm overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200" 
                    alt="Writing Atmosphere" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  />
               </div>
               <div className="absolute -bottom-10 -right-10 bg-white p-12 border border-zinc-100 shadow-2xl hidden md:block">
                  <p className="text-5xl font-heading font-black tracking-tighter">100%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Creator Focused</p>
               </div>
            </div>
          </div>
        </section>

        {/* Building the Future */}
        <section className="bg-zinc-950 text-white py-40 overflow-hidden">
          <div className="unified-axis relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-8">Architecting Excellence</p>
                <h2 className="text-5xl md:text-7xl font-heading font-black tracking-tighter uppercase mb-12 leading-none">
                  Building the Next <br />
                  <span className="text-zinc-700">Era of Publishing.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <div className="w-12 h-1 bg-white mb-6" />
                      <h4 className="text-lg font-bold uppercase tracking-tight">Marketplace Logic</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">A seamless transaction engine where readers can support authors directly, ensuring 90% of revenue goes to the creator.</p>
                   </div>
                   <div className="space-y-4">
                      <div className="w-12 h-1 bg-zinc-800 mb-6" />
                      <h4 className="text-lg font-bold uppercase tracking-tight">Community Synthesis</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">Connecting writers from across India and the globe, supporting regional languages like Hindi, Telugu, and Tamil alongside English.</p>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="p-10 border border-zinc-800 rounded-sm bg-zinc-900/50 backdrop-blur-xl">
                  <Zap className="text-yellow-500 mb-8" size={40} />
                  <h3 className="text-xl font-heading font-black uppercase mb-4">Start Writing</h3>
                  <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Join thousands of unknown writers who are turning their manuscripts into a legacy.</p>
                  <Link 
                    href="/write"
                    className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] hover:gap-6 transition-all"
                  >
                    Launch Composer <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="unified-axis py-40 text-center">
          <h2 className="text-6xl font-heading font-black tracking-ultra-tight uppercase mb-12">Ready to become known?</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <Link 
              href="/marketplace" 
              className="px-12 py-5 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm w-full md:w-auto"
            >
              Explore Works
            </Link>
            <Link 
              href="/signup" 
              className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl rounded-sm w-full md:w-auto"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="square" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
