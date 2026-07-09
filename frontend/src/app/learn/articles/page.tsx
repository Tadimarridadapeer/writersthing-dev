"use client";
import { useState, useEffect } from "react";
import LearnLayout from "@/components/LearnLayout";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/stories?type=Blog");
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch blogs error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <LearnLayout title="Latest Articles" readingTime="1 min read">
      <p className="mb-12 text-zinc-600">
        Our editorial team regularly publishes deep dives into the craft and business of writing. 
        Browse our latest insights below.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-zinc-300" />
        </div>
      ) : articles.length > 0 ? (
        <div className="flex flex-col gap-8">
          {articles.map((article) => (
            <Link key={article.id} href={`/blogs/${article.id}`} className="block">
              <div className="group border-b border-zinc-100 pb-8 last:border-0 cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-sm text-zinc-600">
                    {(article.category || "Blog").split(" - ").pop()}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-2xl font-bold group-hover:underline text-black decoration-2 underline-offset-4">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 italic font-medium">No articles published yet.</p>
      )}
    </LearnLayout>
  );
}
