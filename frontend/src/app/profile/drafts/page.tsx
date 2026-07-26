import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, Edit3, Trash2, Copy, Send, Book, Feather } from "lucide-react";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

function calculateStats(text: string) {
  if (!text) return { words: 0, time: 0 };
  const plainText = text.replace(/<[^>]*>?/gm, '');
  const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const time = Math.max(1, Math.ceil(words / 200));
  return { words, time };
}

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

export default async function DraftsPage() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get Author Profile
  const { data: authorData } = await supabase
    .from("authors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!authorData) {
    redirect("/profile");
  }

  // Fetch Drafts
  const [booksRes, blogsRes, storiesRes] = await Promise.all([
    supabase.from("books").select("id, title, category, created_at, updated_at, description").eq("author_id", authorData.id).eq("status", "Draft").order("updated_at", { ascending: false }),
    supabase.from("blogs").select("id, title, category, created_at, content").eq("author_id", authorData.id).eq("status", "Draft").order("created_at", { ascending: false }),
    supabase.from("stories").select("id, title, category, created_at, body").eq("author_id", authorData.id).eq("status", "Draft").order("created_at", { ascending: false }),
  ]);

  const drafts: any[] = [];

  (booksRes.data || []).forEach(b => {
    const stats = calculateStats(b.description || "");
    drafts.push({ ...b, _type: "Book", _words: stats.words, _time: stats.time, _last_saved: b.updated_at || b.created_at });
  });

  (blogsRes.data || []).forEach(b => {
    const stats = calculateStats(b.content || "");
    drafts.push({ ...b, _type: "Blog", _words: stats.words, _time: stats.time, _last_saved: b.created_at });
  });

  (storiesRes.data || []).forEach(s => {
    const stats = calculateStats(s.body || "");
    drafts.push({ ...s, _type: "Story", _words: stats.words, _time: stats.time, _last_saved: s.created_at });
  });

  // Sort all drafts by last saved descending
  drafts.sort((a, b) => new Date(b._last_saved).getTime() - new Date(a._last_saved).getTime());

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16 font-serif">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">My Drafts</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-12 border-b border-zinc-200 pb-6">
          Unpublished works in progress
        </p>

        {drafts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 shadow-sm rounded-sm">
            <Feather size={48} className="mx-auto text-zinc-300 mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No drafts found</h3>
            <p className="text-zinc-500 mb-8">You don't have any saved drafts at the moment.</p>
            <Link href="/write" className="px-8 py-3 bg-zinc-900 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors">
              Start Writing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div key={`${draft._type}-${draft.id}`} className="bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all p-6 group flex flex-col rounded-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-sm">
                    {draft._type}
                  </span>
                  <span className="text-amber-600 bg-amber-50 px-2 py-1 text-[10px] uppercase font-bold tracking-widest">
                    Draft
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-2 min-h-[56px] group-hover:text-amber-700 transition-colors">
                  {draft.title || "Untitled"}
                </h3>
                
                <p className="text-sm text-zinc-500 mb-6 font-mono tracking-tight">
                  {draft.category || "General"}
                </p>

                <div className="flex items-center gap-4 text-xs text-zinc-400 mb-8 pb-6 border-b border-zinc-100 font-mono uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><FileText size={14} /> {draft._words}w</div>
                  <div className="flex items-center gap-1.5"><Clock size={14} /> {draft._time}m</div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="text-[10px] text-zinc-400 font-mono tracking-widest text-center">
                    Last Saved: {new Date(draft._last_saved).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      href={`/editor?type=${draft._type.toLowerCase()}&id=${draft.id}`}
                      className="px-4 py-2 bg-zinc-900 text-white border border-zinc-900 text-center font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                      <Edit3 size={14} className="inline mr-2" /> Edit
                    </Link>
                    <button 
                      className="px-4 py-2 bg-white text-zinc-900 border border-zinc-300 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-colors cursor-not-allowed opacity-50"
                      title="Duplicate coming soon"
                    >
                      <Copy size={14} className="inline mr-2" /> Dup
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 font-mono text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors cursor-not-allowed opacity-50"
                      title="Delete requires confirmation UI"
                    >
                      <Trash2 size={14} className="inline mr-2" /> Delete
                    </button>
                    <Link 
                      href={`/editor?type=${draft._type.toLowerCase()}&id=${draft.id}`}
                      className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 font-mono text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors text-center"
                    >
                      <Send size={14} className="inline mr-2" /> Publish
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
