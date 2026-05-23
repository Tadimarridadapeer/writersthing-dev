"use client";

import { motion } from "framer-motion";
import { Users, Star, Award, TrendingUp, Search, ArrowRight, Feather } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function AuthorsPage() {
  const authors = [
    {
      name: "Tadimarri Dadapeer",
      role: "Philosophy & Digital Ethics",
      works: 45,
      followers: "12.4K",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
      featured: true
    },
    {
      name: "Elena Vance",
      role: "Contemporary Fiction",
      works: 12,
      followers: "8.1K",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Marcus Thorne",
      role: "Sci-Fi & Cyberpunk",
      works: 28,
      followers: "15.9K",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Sarah Jenkins",
      role: "Psychological Thrillers",
      works: 8,
      followers: "4.2K",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <main className="pt-40 pb-40">
        <div className="unified-axis">
          {/* Authors Header */}
          <header className="mb-32 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-8">The Community</p>
              <h1 className="text-7xl lg:text-9xl font-heading font-black tracking-ultra-tight uppercase leading-[0.85] mb-12">
                Top <br /> Authors
              </h1>
              <p className="text-xl font-medium leading-relaxed italic text-zinc-500">
                Discover the voices shaping the future of digital literature. From regional masters to global thinkers.
              </p>
            </div>
            
            <div className="flex flex-col gap-6 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Find an author..."
                  className="w-full md:w-80 bg-zinc-50 border border-zinc-100 rounded-sm py-5 pl-14 pr-8 outline-none focus:border-black transition-all font-bold text-[10px] uppercase tracking-widest"
                />
              </div>
              <Link 
                href="/signup?role=Author"
                className="px-10 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl rounded-sm flex items-center justify-center gap-3"
              >
                <Feather size={14} /> Join as Author
              </Link>
            </div>
          </header>

          {/* Featured Author Card */}
          <section className="mb-32">
             {authors.filter(a => a.featured).map(author => (
               <div key={author.name} className="relative group overflow-hidden bg-black text-white rounded-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-12 md:p-24 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-12 text-yellow-500">
                        <Award size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Author of the Month</span>
                      </div>
                      <h2 className="text-5xl md:text-7xl font-heading font-black uppercase tracking-tighter mb-8 leading-none">
                        {author.name}
                      </h2>
                      <p className="text-xl text-zinc-400 font-medium italic mb-12">"{author.role}"</p>
                      <div className="flex gap-12 mb-16">
                        <div>
                          <p className="text-4xl font-heading font-black">{author.works}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Works</p>
                        </div>
                        <div>
                          <p className="text-4xl font-heading font-black">{author.followers}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Followers</p>
                        </div>
                      </div>
                      <Link href={`/authors/${author.name.toLowerCase().replace(/ /g, '-')}`} className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] hover:gap-6 transition-all">
                        View Portfolio <ArrowRight size={14} />
                      </Link>
                    </div>
                    <div className="aspect-square lg:aspect-auto overflow-hidden">
                       <img 
                        src={author.image} 
                        alt={author.name} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                       />
                    </div>
                  </div>
               </div>
             ))}
          </section>

          {/* Author Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {authors.filter(a => !a.featured).map((author, index) => (
              <motion.div 
                key={author.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-50 border border-zinc-100 p-10 rounded-sm hover:border-black transition-all group"
              >
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg">
                    <img src={author.image} alt={author.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-black uppercase leading-none mb-2">{author.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{author.role}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Community Rank</p>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                  </div>
                  <button className="w-12 h-12 bg-white border border-zinc-100 flex items-center justify-center rounded-full group-hover:bg-black group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Join CTA */}
          <section className="mt-40 text-center py-32 bg-zinc-50 border border-zinc-100 rounded-sm">
             <Users className="mx-auto mb-10 text-zinc-200" size={60} />
             <h2 className="text-4xl font-heading font-black uppercase tracking-tight mb-6">Want to be featured?</h2>
             <p className="text-zinc-500 font-medium italic text-lg mb-12 max-w-xl mx-auto">
                Join our elite network of writers and start building your legacy today. 90% royalties, deep analytics, and direct reader connection.
             </p>
             <Link 
              href="/signup?role=Author"
              className="px-16 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl inline-block"
            >
              Apply as Creator
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
