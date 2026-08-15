import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayCircle, Clock, BookOpen, Feather } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export function ContinueReadingSection() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/reading-progress');
        if (res.ok) {
          const { data } = await res.json();
          if (isMounted && data) {
            // We need to fetch titles/covers for these
            // For simplicity, we just filter unfinished ones
            const inProgress = data.filter((d: any) => !d.completed && d.progress_percentage > 0).slice(0, 3);
            
            // To get titles/covers, we can either do it in the API or fetch here.
            // But we didn't enrich in the API. 
            // Since this is a client component, let's just do a quick supabase fetch if we have them.
            // Or better, let's update the API to enrich them if requested, or just do it here.
            
            // Note: The API /api/reading-progress doesn't enrich. 
            // To avoid complexity here, I will leave it empty if we don't enrich, but the user requested: Cover, Title, Author, Progress Bar...
            // Let's rely on a minimal client-side Supabase query
            
            if (inProgress.length === 0) {
              setProgressData([]);
              setLoading(false);
              return;
            }

            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
            
            const bookIds = inProgress.filter((p:any) => p.content_type === 'book').map((p:any) => p.content_id);
            const storyIds = inProgress.filter((p:any) => p.content_type === 'story').map((p:any) => p.content_id);
            const blogIds = inProgress.filter((p:any) => p.content_type === 'blog').map((p:any) => p.content_id);

            const [books, blogs, stories] = await Promise.all([
              bookIds.length > 0 ? supabase.from("books").select("id, title, cover_url, author_id, authors(name)").in("id", bookIds) : { data: [] },
              blogIds.length > 0 ? supabase.from("blogs").select("id, title, banner_url, author_id, authors(name)").in("id", blogIds) : { data: [] },
              storyIds.length > 0 ? supabase.from("stories").select("id, title, cover_image, author_id, authors(name)").in("id", storyIds) : { data: [] }
            ]);

            const booksMap = new Map((books.data || []).map(b => [b.id, { ...b, cover: b.cover_url, author: Array.isArray(b.authors) ? (b.authors[0] as any)?.name : (b.authors as any)?.name }]));
            const blogsMap = new Map((blogs.data || []).map(b => [b.id, { ...b, cover: b.banner_url, author: Array.isArray(b.authors) ? (b.authors[0] as any)?.name : (b.authors as any)?.name }]));
            const storiesMap = new Map((stories.data || []).map(b => [b.id, { ...b, cover: b.cover_image, author: Array.isArray(b.authors) ? (b.authors[0] as any)?.name : (b.authors as any)?.name }]));

            const enriched = inProgress.map((p: any) => {
              let meta: any = {};
              if (p.content_type === 'book') meta = booksMap.get(p.content_id);
              if (p.content_type === 'blog') meta = blogsMap.get(p.content_id);
              if (p.content_type === 'story') meta = storiesMap.get(p.content_id);

              return {
                ...p,
                title: meta?.title || "Unknown",
                cover: meta?.cover,
                author: meta?.author || "Unknown Author",
                link: p.content_type === 'book' ? `/read/pdf?id=${p.content_id}` : `/${p.content_type}s/${p.content_id}`
              };
            });

            setProgressData(enriched);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  if (loading || progressData.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-heading text-zinc-900 flex items-center gap-2">
          <PlayCircle size={20} className="text-amber-500" /> Continue Reading
        </h2>
        <Link href="/profile/history" className="text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-black">
          View History →
        </Link>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
        {progressData.map((item) => (
          <div key={item.id} className="min-w-[280px] max-w-[320px] shrink-0 border border-zinc-200 bg-white p-4 rounded-sm flex gap-4 hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-amber-500 transition-all" style={{ width: `${item.progress_percentage}%` }} />
            
            <div className="w-16 h-20 shrink-0 bg-zinc-100 border border-zinc-200 relative overflow-hidden flex items-center justify-center text-zinc-300">
              {item.cover ? (
                <OptimizedImage src={item.cover} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen size={24} />
              )}
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                {item.content_type}
              </span>
              <h3 className="font-bold text-sm text-zinc-900 truncate group-hover:text-amber-700 transition-colors">
                {item.title}
              </h3>
              <span className="text-xs text-zinc-500 truncate mb-3">
                by {item.author}
              </span>
              
              <div className="mt-auto flex items-center justify-between w-full">
                <span className="text-[10px] font-mono font-bold text-amber-600">
                  {item.progress_percentage}%
                </span>
                <Link 
                  href={item.link} 
                  className="px-3 py-1 bg-zinc-900 text-white text-[10px] uppercase font-mono tracking-widest hover:bg-zinc-800 rounded-sm flex items-center gap-1"
                >
                  Resume
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
