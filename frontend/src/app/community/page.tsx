"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, MessageCircle, PenTool, Star, Users, Calendar, Megaphone } from "lucide-react";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Breadcrumbs />
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          A place where writers and readers <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>connect.</span>
        </motion.h1>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-100">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: <MessageCircle size={32} />, title: "Community Feed", desc: "Engage in deep conversations about writing, publishing, and reading." },
            { icon: <Star size={32} />, title: "Featured Writers", desc: "Every week we highlight an exceptional storyteller from our community." },
            { icon: <PenTool size={32} />, title: "Monthly Writing Challenges", desc: "Push your limits with our themed writing challenges and prompts." },
            { icon: <Users size={32} />, title: "Writer Spotlights", desc: "In-depth interviews and Q&As with independent authors." },
            { icon: <MessageCircle size={32} />, title: "WhatsApp Community", desc: "Fast-paced discussions, immediate feedback, and daily accountability." },
            { icon: <Calendar size={32} />, title: "Upcoming Community Events", desc: "Join our virtual and physical writing workshops and meetups." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-2">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center bg-zinc-50">
        <Link 
          href="/signup"
          className="inline-flex px-12 py-6 bg-black text-white font-bold tracking-widest uppercase text-sm rounded-md hover:bg-zinc-800 transition-colors items-center gap-3"
        >
          Join the Community <ChevronRight size={18} />
        </Link>
      </section>
      
    </div>
  );
}
