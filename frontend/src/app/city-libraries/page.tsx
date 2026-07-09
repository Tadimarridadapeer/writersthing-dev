"use client";

import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CityLibrariesPage() {
  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <Breadcrumbs />
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-zinc-50 mb-12"
        >
          <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Coming Soon</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Stories deserve a home beyond the <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>screen.</span>
        </motion.h1>
      </section>

      {/* Vision Content */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <div className="flex justify-center mb-16">
          <div className="w-24 h-24 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400">
            <Landmark size={40} strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-12 text-xl md:text-2xl leading-relaxed font-medium text-zinc-700 text-center" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
          <p className="text-black font-bold">
            Writer&apos;s Thing is quietly building something special.
          </p>
          
          <p>
            Our vision is to create private Writer&apos;s Thing Libraries across major metropolitan cities in India and beyond.
          </p>
          
          <p>
            These libraries will become spaces where writers, readers, and storytellers can meet, read, discuss books, attend launches, workshops, and community events.
          </p>

          <p className="text-black font-bold">
            We&apos;re not ready to reveal everything yet.
          </p>

          <p className="italic text-zinc-500 mt-16 text-lg">
            More details will be announced soon.
          </p>
        </div>
      </section>
      
    </div>
  );
}
