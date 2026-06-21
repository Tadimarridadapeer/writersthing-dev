"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, User, Bookmark, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function ArticlePost() {
  const params = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/manuscripts/${params.id}`);
      const data = await res.json();
      setArticle(data);
    } catch (err) {
      console.error("Fetch article error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-200" size={48} /></div>;
  if (!article) return <div className="h-screen flex items-center justify-center italic text-zinc-400">Article not found</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-6 pb-24">
        <article className="unified-axis max-w-3xl">
          <Link href="/articles" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all mb-16">
            <ArrowLeft size={14} />
            Back to Articles
          </Link>

          <header className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Article / {article.category}</span>
              <div className="h-px w-8 bg-zinc-200" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-heading font-black tracking-tighter uppercase mb-12 leading-[0.95]">
              {article.title}
            </h1>
            <div className="flex items-center justify-between py-10 border-y border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black flex items-center justify-center rounded-full">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">{article.author || "Writersthing Author"}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                    {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : "Draft"}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-3 px-6 py-3 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                <Bookmark size={14} /> Save Reference
              </button>
            </div>
          </header>

          <div className="prose prose-zinc max-w-none">
            {article.content.split('\n').map((para: string, i: number) => (
              <p key={i} className="text-lg font-medium leading-relaxed text-zinc-600 mb-8">
                {para.trim()}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
