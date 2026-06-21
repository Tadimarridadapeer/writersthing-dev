"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User, Share2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function BlogPost() {
  const params = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
  }, [params.id]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/manuscripts/${params.id}`);
      const data = await res.json();
      setBlog(data);
    } catch (err) {
      console.error("Fetch blog error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-200" size={48} /></div>;
  if (!blog) return <div className="h-screen flex items-center justify-center italic text-zinc-400">Story not found</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-6 pb-24">
        <article className="unified-axis max-w-3xl">
          <Link href="/blogs" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all mb-16">
            <ArrowLeft size={14} />
            Back to Blogs
          </Link>

          <header className="mb-20">
            <span className="inline-block px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest mb-10">{blog.category}</span>
            <h1 className="text-6xl font-heading font-black tracking-tighter uppercase mb-10 leading-[0.95]">
              {blog.title}
            </h1>
            <div className="flex items-center justify-between py-8 border-y border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center rounded-full">
                  <User size={20} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">{blog.author || "Writersthing Author"}</p>
                  <p className="text-xs text-zinc-400 font-medium italic">
                    {blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString() : "Draft"}
                  </p>
                </div>
              </div>
              <button className="p-4 border border-zinc-100 hover:bg-black hover:text-white transition-all">
                <Share2 size={18} />
              </button>
            </div>
          </header>

          <div className="prose prose-zinc max-w-none">
            {blog.content.split('\n').map((para: string, i: number) => (
              <p key={i} className="text-xl font-medium leading-relaxed text-zinc-600 italic mb-8">
                {para.trim()}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
