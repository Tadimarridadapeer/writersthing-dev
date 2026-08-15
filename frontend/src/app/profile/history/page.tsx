import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, PlayCircle, BookOpen, Feather } from "lucide-react";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

async function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export default async function HistoryPage() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Reading Progress
  const { data: progressData } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false });

  const progressList = progressData || [];
  
  // We need to fetch the titles/covers for these content IDs.
  // We'll batch them by type
  const bookIds = progressList.filter(p => p.content_type === 'book').map(p => p.content_id);
  const blogIds = progressList.filter(p => p.content_type === 'blog').map(p => p.content_id);
  const storyIds = progressList.filter(p => p.content_type === 'story').map(p => p.content_id);

  const [books, blogs, stories] = await Promise.all([
    bookIds.length > 0 ? supabase.from("books").select("id, title, cover_url, category").in("id", bookIds) : { data: [] },
    blogIds.length > 0 ? supabase.from("blogs").select("id, title, banner_url, category").in("id", blogIds) : { data: [] },
    storyIds.length > 0 ? supabase.from("stories").select("id, title, cover_image, category").in("id", storyIds) : { data: [] }
  ]);

  const booksMap = new Map((books.data || []).map(b => [b.id, { ...b, cover: b.cover_url }]));
  const blogsMap = new Map((blogs.data || []).map(b => [b.id, { ...b, cover: b.banner_url }]));
  const storiesMap = new Map((stories.data || []).map(b => [b.id, { ...b, cover: b.cover_image }]));

  const enrichedProgress = progressList.map(p => {
    let metadata: any = {};
    if (p.content_type === 'book') metadata = booksMap.get(p.content_id);
    if (p.content_type === 'blog') metadata = blogsMap.get(p.content_id);
    if (p.content_type === 'story') metadata = storiesMap.get(p.content_id);

    return {
      ...p,
      title: metadata?.title || "Unknown Content",
      cover: metadata?.cover,
      category: metadata?.category,
      link: p.content_type === 'book' ? `/read/pdf?id=${p.content_id}` : `/${p.content_type}s/${p.content_id}`
    };
  });

  const inProgress = enrichedProgress.filter(p => !p.completed && p.progress_percentage > 0);
  const completed = enrichedProgress.filter(p => p.completed);

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16 font-serif">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">Reading History</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-12 border-b border-zinc-200 pb-6">
          Track your journey across Writer's Thing
        </p>

        {enrichedProgress.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 shadow-sm rounded-sm">
            <BookOpen size={48} className="mx-auto text-zinc-300 mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Your library is empty</h3>
            <p className="text-zinc-500 mb-8">You haven't read anything yet. Start exploring the platform!</p>
            <Link href="/" className="px-8 py-3 bg-zinc-900 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors">
              Explore
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* IN PROGRESS */}
            {inProgress.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                  <PlayCircle size={24} className="text-amber-500" /> In Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgress.map(p => (
                    <Link href={p.link} key={p.id} className="group block bg-white border border-zinc-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 bg-amber-500 transition-all" style={{ width: `${p.progress_percentage}%` }} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-sm">
                          {p.content_type}
                        </span>
                        <span className="text-zinc-400 font-mono text-[10px] tracking-widest uppercase">
                          {p.progress_percentage}%
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-2 min-h-[56px] group-hover:text-amber-700 transition-colors">
                        {p.title}
                      </h3>
                      
                      <p className="text-sm text-zinc-500 mb-6 font-mono tracking-tight">
                        {p.category || "General"}
                      </p>

                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tracking-widest border-t border-zinc-100 pt-4">
                        <span>Read: {Math.round(p.reading_time_seconds / 60)}m</span>
                        <span className="flex items-center gap-1.5 text-zinc-900 group-hover:text-amber-600 transition-colors">
                          Resume <PlayCircle size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* COMPLETED */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-500" /> Completed
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completed.map(p => (
                    <Link href={p.link} key={p.id} className="group block bg-white border border-zinc-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 bg-emerald-500 w-full" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-sm">
                          {p.content_type}
                        </span>
                        <span className="text-emerald-600 font-mono text-[10px] tracking-widest uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Done
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-2 min-h-[56px] group-hover:text-emerald-700 transition-colors">
                        {p.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tracking-widest border-t border-zinc-100 pt-4 mt-8">
                        <span>Time: {Math.round(p.reading_time_seconds / 60)}m</span>
                        <span className="flex items-center gap-1.5 text-zinc-500 group-hover:text-emerald-600 transition-colors">
                          Restart <PlayCircle size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
