"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center pt-24 pb-20 px-6">
      <div className="max-w-2xl text-center flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 mb-12"
        >
          <span className="text-2xl font-black uppercase tracking-widest">404</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          This page hasn't been <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>written yet.</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-zinc-600 max-w-xl mx-auto leading-relaxed mb-16 space-y-2"
          style={{ fontFamily: 'var(--font-libre-baskerville)' }}
        >
          <p>The chapter you're looking for doesn't exist.</p>
          <p>Let's get you back to the story.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/"
            className="w-full sm:w-auto px-10 py-5 bg-black text-white font-bold tracking-widest uppercase text-xs rounded-md hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-black outline-none"
          >
            <ArrowLeft size={16} /> Return Home
          </Link>
          
          <Link 
            href="/community"
            className="w-full sm:w-auto px-10 py-5 bg-white border border-zinc-200 text-black font-bold tracking-widest uppercase text-xs rounded-md hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-black outline-none"
          >
            <Users size={16} /> Explore Community
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
