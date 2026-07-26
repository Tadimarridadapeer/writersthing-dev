const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/app/profile/page.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Add import
if (!content.includes('useBookmarks')) {
  content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { useBookmarks } from "@/hooks/useBookmarks";');
}

// 2. Initialize hook
if (!content.includes('const { bookmarks, lists, toggleBookmark, fetchListsAndBookmarks } = useBookmarks();')) {
  content = content.replace('const { user, loading: authLoading } = useAuth();', 'const { user, loading: authLoading } = useAuth();\n  const { bookmarks, lists, toggleBookmark, fetchListsAndBookmarks } = useBookmarks();');
}

// 3. Replace the Bookmarks activeSection
const bookmarkSectionRegex = /\{activeSection === "Bookmarks" && \([\s\S]*?(?=\{activeSection === "Likes")/m;

const newBookmarksUI = `{activeSection === "Bookmarks" && (
  <div className="space-y-12">
    {/* Statistics */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        { label: "Total Bookmarks", count: bookmarks.length },
        { label: "Read Later", count: bookmarks.filter(b => b.reading_lists?.name === "Read Later").length },
        { label: "Currently Reading", count: bookmarks.filter(b => b.reading_lists?.name === "Currently Reading").length },
        { label: "Favorites", count: bookmarks.filter(b => b.reading_lists?.name === "Favorites").length },
        { label: "Finished", count: bookmarks.filter(b => b.reading_lists?.name === "Finished Reading").length }
      ].map(stat => (
        <div key={stat.label} className="bg-zinc-50 border border-zinc-100 p-4 flex flex-col items-center justify-center rounded-sm">
          <span className="text-2xl font-black text-black">{stat.count}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</span>
        </div>
      ))}
    </div>

    {lists.map(list => {
      const listBookmarks = bookmarks.filter(b => b.list_id === list.id);
      if (listBookmarks.length === 0) return null;

      return (
        <div key={list.id} className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight border-b border-zinc-100 pb-2">{list.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {listBookmarks.map(item => {
              // We don't have full details joined natively in this simplified view unless fetched.
              // We'll just render a skeleton or simple card since full enrichment requires backend changes.
              // Assuming bookmarks are enriched via API similar to saves... 
              // Wait, the API doesn't enrich content details yet.
              // Let's create a generic view.
              const isBook = item.content_type === "book";
              const isStory = item.content_type === "story";
              const isBlog = item.content_type === "blog";
              let badge = isBook ? "BOOK" : isStory ? "STORY" : "BLOG";
              let link = isBook ? \`/read/\${item.content_id}\` : isStory ? \`/stories/\${item.content_id}\` : \`/blogs/\${item.content_id}\`;

              return (
                <div key={item.id} className="group flex gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-sm hover:border-black transition-all">
                  <div className="w-24 h-32 flex-shrink-0 bg-zinc-200 shadow-lg grayscale group-hover:grayscale-0 transition-all overflow-hidden relative flex items-center justify-center">
                    <Bookmark className="text-zinc-400" />
                    <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-black tracking-widest">{badge}</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm mb-1 uppercase tracking-tight leading-none line-clamp-2">Content ID: {item.content_id.split('-')[0]}...</h3>
                    </div>
                    <div className="flex gap-2">
                      <Link href={link} className="flex-grow block text-center py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                        Read Now
                      </Link>
                      <button 
                        onClick={async (e) => { e.preventDefault(); await toggleBookmark(item.content_type, item.content_id); }}
                        className="px-3 bg-amber-50 border border-amber-200 rounded-sm text-amber-600 hover:text-red-600 transition-all"
                        title="Remove bookmark"
                      >
                        <Bookmark size={14} className="fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}

    {bookmarks.length === 0 && (
      <div className="py-20 text-center bg-zinc-50 border border-zinc-100 rounded-sm border-dashed flex flex-col items-center justify-center p-12">
        <p className="text-zinc-400 font-medium italic mb-8">
          You haven't bookmarked anything yet.
        </p>
        <Link href="/marketplace" className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">Browse Content</Link>
      </div>
    )}
  </div>
)}
`;

content = content.replace(bookmarkSectionRegex, newBookmarksUI);
fs.writeFileSync(p, content, 'utf8');
console.log('Profile updated');
