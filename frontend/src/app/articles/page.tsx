"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, User, ShieldCheck, Download, Feather, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles?type=Article");
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch articles error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-12 pb-20">
        <div className="unified-axis">
          {/* Professional Header */}
          <header className="mb-32">
            <div className="flex items-center gap-6 mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">The Repository</span>
              <div className="h-px flex-grow bg-zinc-100" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-end">
              <h1 className="text-7xl lg:text-9xl font-heading font-black tracking-ultra-tight uppercase leading-[0.85]">
                Expert <br /> Insights
              </h1>
              <div className="max-w-md">
                <p className="text-xl font-medium leading-relaxed italic text-zinc-500 mb-10">
                  Technical guides, industry analysis, and craft mastery. Elevating the standard of independent publishing.
                </p>
                <div className="flex gap-4">
                  <div className="px-6 py-3 border border-zinc-200 text-[10px] font-black uppercase tracking-widest">500+ Articles</div>
                  <Link 
                    href="/write?type=article"
                    className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl rounded-sm flex items-center gap-2"
                  >
                    <Feather size={14} /> Contribute
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Minimalist Article List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-zinc-200" />
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-1">
              {articles.map((article, index) => (
                <motion.div 
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group border-b border-zinc-100 py-16 hover:bg-zinc-50/50 transition-all px-8 -mx-8"
                >
                  <Link href={`/articles/${article.id}`} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-3">
                      <div className="aspect-[4/3] bg-zinc-100 overflow-hidden rounded-sm">
                        <img 
                          src={article.cover_url || "https://images.unsplash.com/photo-1457369804593-50c4113ef53c?auto=format&fit=crop&q=80&w=800"} 
                          alt={article.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-7">
                      <div className="flex items-center gap-6 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{(article.category || "Article").split(" - ").pop()}</span>
                        <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="text-4xl lg:text-5xl font-heading font-black tracking-tighter uppercase mb-6 group-hover:translate-x-4 transition-transform duration-500">
                        {article.title}
                      </h2>

                      <p className="text-lg font-medium leading-relaxed text-zinc-500 italic max-w-2xl line-clamp-2">
                        {article.description}
                      </p>
                    </div>

                    <div className="lg:col-span-2 flex justify-end">
                      <div className="w-16 h-16 border border-zinc-200 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ArrowRight size={24} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-y border-zinc-100">
              <p className="text-zinc-400 italic text-xl">No articles published yet. Be the first to share your insights.</p>
            </div>
          )}

          {/* Expert CTA */}
          <div className="mt-48 p-20 bg-black text-white relative overflow-hidden rounded-sm">
            <div className="absolute top-0 right-0 p-12 text-zinc-800">
              <ShieldCheck size={120} strokeWidth={1} />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-5xl font-heading font-black uppercase tracking-tight mb-8">Share Your Expertise</h3>
              <p className="text-xl font-medium italic text-zinc-400 mb-12">
                Join our editorial community. Professional insights help build the foundation for a more transparent publishing industry.
              </p>
              <Link 
                href="/write"
                className="inline-flex items-center gap-6 px-12 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl"
              >
                Submit Article <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
