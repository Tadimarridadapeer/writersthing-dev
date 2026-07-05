"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, User, Feather, Bookmark, Share2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/stories?type=Blog");
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch blogs error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="pt-6 md:pt-12 pb-12 md:pb-20">
        <div className="unified-axis">
          {/* Magazine Header */}
          <header className="mb-8 flex flex-col md:flex-row justify-between items-end gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-px bg-black" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">The Journal</span>
              </div>
              <div className="flex flex-col gap-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight uppercase leading-[0.9] mb-2">
                  Personal <br /> Blogs
                </h1>
                <p className="text-xl font-medium leading-relaxed italic text-zinc-500 max-w-xl">
                  A curated selection of personal narratives and fictional explorations from our global community of writers.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end text-right gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-2 block">Issue No. 01</span>
                <span className="text-sm font-black uppercase tracking-widest border-b-4 border-black pb-1">Spring 2026</span>
              </div>
              <Link 
                href="/write?type=blog"
                className="px-8 py-4 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm flex items-center gap-3"
              >
                <Feather size={14} /> Write Your Story
              </Link>
            </div>
          </header>

          {/* Featured Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-zinc-200" />
            </div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
              {blogs.map((blog, index) => (
                <motion.div 
                  key={blog.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col"
                >
                  <Link href={`/blogs/${blog.id}`} className="block">
                    <div className="aspect-[16/10] overflow-hidden mb-10 bg-zinc-100">
                      <img 
                        src={blog.cover_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800"} 
                        alt={blog.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 hover:scale-105"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-black text-white">{(blog.category || "Blog").split(" - ").pop()}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-heading font-black tracking-tighter uppercase mb-4 leading-tight group-hover:text-zinc-600 transition-colors line-clamp-3">
                      {blog.title}
                    </h2>

                    <p className="text-sm font-medium leading-relaxed text-zinc-500 mb-6 italic line-clamp-2">
                      "{blog.description}"
                    </p>

                    <div className="flex items-center justify-between pt-8 border-t border-zinc-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-[10px] font-black uppercase">
                          {blog.authors?.name?.[0] || "?"}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{blog.authors?.name || "Unknown"}</span>
                      </div>
                      <div className="flex gap-4">
                        <Bookmark size={14} className="text-zinc-300 hover:text-black transition-colors" />
                        <Share2 size={14} className="text-zinc-300 hover:text-black transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-y border-zinc-100">
              <p className="text-zinc-400 italic text-xl">No stories shared yet. Start the first issue today.</p>
            </div>
          )}

          {/* Premium CTA */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-48 border-t-8 border-black pt-20 flex flex-col lg:flex-row items-center justify-between gap-12"
          >
            <div className="relative z-10 w-full lg:w-1/2">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black uppercase tracking-tight mb-6 italic">Your Voice, Recognized.</h3>
              <p className="text-lg text-zinc-500 font-serif leading-relaxed mb-10">
                Sharing your story is the first step toward becoming a recognized author. Our community is waiting to hear your perspective.
              </p>
            </div>
            <Link 
              href="/write"
              className="px-16 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl flex items-center gap-6"
            >
              Start Writing <Feather size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
