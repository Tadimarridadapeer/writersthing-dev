"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Feather, 
  Upload, 
  TrendingUp,
  Sparkles,
  Zap,
  ShieldCheck,
  Users
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col pt-12 overflow-hidden bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="unified-axis w-full max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-300">Writersthing</span>
              </div>
              
              <h1 className="text-hero tracking-ultra-tight mb-8 md:mb-12 text-balance uppercase leading-[1.05]">
                A platform where <br className="hidden md:block" />
                <span className="serif italic font-normal text-zinc-300 normal-case">unknown</span> writers <br className="hidden md:block" />
                become known.
              </h1>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
                <Link 
                  href="/signup?role=Author" 
                  className="w-full sm:w-auto px-10 md:px-14 py-5 md:py-6 bg-black text-white rounded-sm font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  Start Writing <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/marketplace" 
                  className="w-full sm:w-auto px-10 md:px-14 py-5 md:py-6 bg-zinc-50 text-black rounded-sm font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:bg-zinc-100 transition-all flex items-center justify-center"
                >
                  Start Reading
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Manuscripts */}
      <section id="explore" className="section-padding bg-zinc-50 border-y border-zinc-100">
        <div className="unified-axis text-center mb-24">
          <h2 className="text-h1 tracking-ultra-tight uppercase mb-6">Trending Manuscripts</h2>
          <p className="text-zinc-500 font-medium text-lg italic max-w-2xl mx-auto">The most read digital manuscripts this week. Pure content, zero distractions. All available for ₹99.</p>
        </div>
        
        <div className="unified-axis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <Link href="/manuscripts/the-art-of-prompt" className="group">
            <div className="aspect-[3/4.5] bg-zinc-100 overflow-hidden relative mb-8 shadow-2xl group-hover:translate-y-[-10px] transition-all duration-500">
              <img src="/the-art-of-prompt.png" alt="The Art of Prompt" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-4 py-2">View Details</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">Education Sector</p>
            <h3 className="text-xl font-heading font-black tracking-tight uppercase mb-1">The Art of Prompt</h3>
            <p className="text-sm font-medium text-zinc-400 italic">by Tadimarri Dadapeer</p>
          </Link>
        </div>
        </div>
      </section>

      {/* Story Categories Section */}
      <section id="categories" className="py-40 bg-white">
        <div className="unified-axis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start">
            <div className="sticky top-40">
              <h2 className="text-h1 tracking-ultra-tight mb-8 md:mb-10 uppercase leading-none">
                What's your <br />
                <span className="italic serif font-normal text-zinc-300">story?</span>
              </h2>
              <p className="text-zinc-500 font-medium text-xl max-w-md mb-14 leading-relaxed">
                Browse through thousands of genres curated by our editorial team. Find your voice in our library for just ₹99 per book.
              </p>
              <Link href="/marketplace" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] group">
                <span className="border-b-2 border-black pb-1 group-hover:opacity-60 transition-all">Explore Marketplace</span>
                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-col border-t border-zinc-100">
              {['Love', 'Comedy', 'Education', 'Mystery', 'Fiction', 'History', 'Sci-Fi', 'Thriller', 'Biography', 'Poetry'].map((cat) => (
                <CategoryRow key={cat} label={cat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-black text-white">
        <div className="unified-axis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-32">
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
      <section id="pricing" className="section-padding bg-white overflow-hidden relative">
        <div className="absolute inset-0 bg-zinc-50/50 -z-10" />
        <div className="unified-axis relative">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white rounded-full mb-12">
                <Sparkles size={14} className="text-zinc-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Premium Membership</span>
              </div>
              
              <h2 className="text-h1 tracking-ultra-tight text-black mb-16 uppercase">
                Ready to turn your <br /> manuscript <br /> into a legacy?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24 max-w-4xl mx-auto text-left">
                <div className="p-8 border border-zinc-100 bg-zinc-50/50 rounded-sm">
                  <div className="w-12 h-12 bg-black flex items-center justify-center mb-6">
                    <Zap size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold uppercase mb-4 tracking-tighter">Flat Pricing</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">Every manuscript on the platform is priced at a fixed ₹99. No subscriptions, no hidden fees.</p>
                </div>

                <div className="p-8 border border-zinc-100 bg-zinc-50/50 rounded-sm">
                  <div className="w-12 h-12 bg-black flex items-center justify-center mb-6">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold uppercase mb-4 tracking-tighter">Total Ownership</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">Buy once, own forever. Access your library from any device, anytime, with our distraction-free reader.</p>
                </div>

                <div className="p-8 border border-zinc-100 bg-zinc-50/50 rounded-sm">
                  <div className="w-12 h-12 bg-black flex items-center justify-center mb-6">
                    <Users size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold uppercase mb-4 tracking-tighter">Author Direct</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">We take a minimal commission. Most of your ₹99 goes directly into the author's pocket.</p>
                </div>
              </div>

              <Link 
                href="/signup" 
                className="inline-block px-20 py-10 bg-black text-white font-black text-[11px] uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
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

function AuthorCard({ name, genre, image }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative aspect-[3/4] bg-zinc-100 overflow-hidden shadow-xl rounded-sm"
    >
      <img 
        src={image} 
        alt={name} 
        className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        <h3 className="text-xl font-heading font-black tracking-tighter leading-tight mb-2 text-white">{name}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{genre}</p>
      </div>
    </motion.div>
  );
}

function BookGridCard({ title, author, image }: any) {
  return (
    <div className="group text-left cursor-pointer">
      <div className="aspect-[3/4.5] bg-zinc-100 overflow-hidden mb-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all duration-700">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
        />
      </div>
      <h3 className="text-xl font-heading font-black tracking-tighter leading-tight mb-2 uppercase">{title}</h3>
      <p className="text-sm font-medium text-zinc-400 italic">by {author}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest border border-black px-2 py-0.5">₹99</span>
      </div>
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
    <div className="flex flex-col gap-10 group">
      <div className="flex items-center gap-6">
        <span className="text-6xl font-heading font-black tracking-tighter text-zinc-800 group-hover:text-white transition-all duration-500">
          {number}
        </span>
        <div className="p-4 border border-zinc-800 transition-all duration-500 group-hover:border-white">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-heading font-black tracking-tight uppercase mb-6">{title}</h3>
        <p className="text-zinc-500 font-medium leading-relaxed text-lg">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-sm">
        {icon}
      </div>
      <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">{text}</span>
    </div>
  );
}

