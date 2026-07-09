"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PenTool, BookOpen, Layout, Globe, MessageSquare, Briefcase, Zap, Cpu, Archive, Library } from "lucide-react";

export default function LearnHubPage() {
  const categories = [
    { icon: <PenTool />, title: "Writing Fundamentals", path: "/learn/writing-fundamentals", desc: "Finding your style, building habits, and overcoming blocks." },
    { icon: <Library />, title: "Storytelling", path: "/learn/storytelling", desc: "Structure, plot, and emotional resonance." },
    { icon: <BookOpen />, title: "Character Development", path: "/learn/characters", desc: "Psychology, arcs, and dialogue." },
    { icon: <Globe />, title: "World Building", path: "/learn/world-building", desc: "Settings, magic systems, and culture." },
    { icon: <Briefcase />, title: "Publishing Guide", path: "/learn/publishing", desc: "Self-publishing, copyright, and pricing." },
    { icon: <Zap />, title: "Marketing for Authors", path: "/learn/marketing", desc: "Audience building, launches, and branding." },
    { icon: <Cpu />, title: "AI for Writers", path: "/learn/ai", desc: "Responsible use, brainstorming, and editing." },
    { icon: <Archive />, title: "Writing Resources", path: "/learn/resources", desc: "Templates, checklists, and planning sheets." },
    { icon: <BookOpen />, title: "Recommended Reading", path: "/learn/books", desc: "Curated lists of essential books." },
    { icon: <MessageSquare />, title: "Latest Articles", path: "/learn/articles", desc: "Tips, inspiration, and publishing insights." }
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Great writers never stop <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>learning.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-libre-baskerville)' }}
        >
          Master storytelling, publishing, creativity, and the business of writing—all in one place.
        </motion.p>
      </section>

      {/* Categories Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-100">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <Link key={i} href={cat.path} className="block">
              <div className="h-full p-10 border border-zinc-200 rounded-xl hover:border-black hover:shadow-xl transition-all group bg-zinc-50/30 hover:bg-white flex flex-col">
                <div className="w-16 h-16 bg-white border border-zinc-200 rounded-full flex items-center justify-center mb-8 text-zinc-600 group-hover:text-black group-hover:border-black transition-colors">
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:underline">{cat.title}</h3>
                <p className="text-zinc-600 leading-relaxed flex-grow">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
