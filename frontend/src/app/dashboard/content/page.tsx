"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ContentPage() {
  const [activeType, setActiveType] = useState("All");
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchAllContent = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setErrorMessage("Authentication required. Please log in.");
          return;
        }

        // 1. Fetch Books
        const { data: books, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("author_id", user.id);

        if (booksError) throw booksError;

        // 2. Fetch Articles
        const { data: articles, error: articlesError } = await supabase
          .from("articles")
          .select("*")
          .eq("author_id", user.id);

        if (articlesError) {
          console.warn("Articles fetch warning (might not exist yet):", articlesError);
        }

        // 3. Fetch Blogs
        const { data: blogs, error: blogsError } = await supabase
          .from("blogs")
          .select("*")
          .eq("author_id", user.id);

        if (blogsError) {
          console.warn("Blogs fetch warning (might not exist yet):", blogsError);
        }

        // Standardize and merge
        const standardizedBooks = (books || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          type: "Book",
          category: b.category || "Novel",
          status: b.status || "Draft",
          date: b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          views: `${b.sales_count || 0}`,
          revenue: `₹${((b.price || 99) * (b.sales_count || 0)).toLocaleString()}`,
          rawDate: b.created_at
        }));

        const standardizedArticles = (articles || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          type: "Article",
          category: a.category || "Insight",
          status: "Published", // Articles are published on creation
          date: a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          views: "0",
          revenue: "₹0",
          rawDate: a.created_at
        }));

        const standardizedBlogs = (blogs || []).map((bl: any) => ({
          id: bl.id,
          title: bl.title,
          type: "Blog",
          category: "Personal",
          status: "Published",
          date: bl.created_at ? new Date(bl.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
          views: "0",
          revenue: "₹0",
          rawDate: bl.created_at
        }));

        const merged = [...standardizedBooks, ...standardizedArticles, ...standardizedBlogs].sort((a: any, b: any) => {
          return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
        });

        setContents(merged);
      } catch (err: any) {
        console.error("Failed to load content repository:", err);
        setErrorMessage(err.message || "Failed to load content.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to permanently delete this ${type.toLowerCase()}? This action cannot be undone.`)) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      let error;
      if (type === "Book") {
        const { error: dbError } = await supabase
          .from("books")
          .delete()
          .eq("id", id);
        error = dbError;
      } else if (type === "Article") {
        const { error: dbError } = await supabase
          .from("articles")
          .delete()
          .eq("id", id);
        error = dbError;
      } else if (type === "Blog") {
        const { error: dbError } = await supabase
          .from("blogs")
          .delete()
          .eq("id", id);
        error = dbError;
      }

      if (error) throw error;

      // Optimistically update list
      setContents(prev => prev.filter(item => item.id !== id));
      setSuccessMessage(`Successfully deleted your ${type.toLowerCase()}!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Failed to delete content:", err);
      setErrorMessage(`Delete failed: ${err.message}`);
    }
  };

  const filteredContents = contents.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeType === "All") return true;
    if (activeType === "Ebooks") return item.type === "Book";
    if (activeType === "Articles") return item.type === "Article";
    if (activeType === "Drafts") return item.status === "Draft";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Content Repository</p>
            <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase">My Publications</h1>
          </div>
          <Link 
            href="/write"
            className="flex items-center gap-3 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            <Plus size={16} /> New Manuscript
          </Link>
        </header>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-sm text-red-600 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-8 p-4 bg-zinc-900 border border-zinc-900 rounded-sm text-white text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-white" /> {successMessage}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="flex bg-zinc-100 p-1 rounded-sm w-full md:w-auto">
            {["All", "Ebooks", "Articles", "Drafts"].map((type) => (
              <button 
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-grow md:flex-initial px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeType === type ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-black"}`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
              <input 
                type="text" 
                placeholder="Search manuscripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-sm py-3 pl-12 pr-4 text-xs font-medium outline-none focus:border-black transition-all text-zinc-900"
              />
            </div>
            <button className="p-3 bg-white border border-zinc-200 rounded-sm text-zinc-400 hover:text-black hover:border-black transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Content Table / Loader */}
        {loading ? (
          <div className="bg-white border border-zinc-100 rounded-sm py-24 flex flex-col items-center justify-center gap-4 shadow-sm">
            <Loader2 className="animate-spin text-zinc-400" size={40} />
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Loading Repository...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-sm py-24 px-6 text-center shadow-sm">
            <BookOpen className="text-zinc-300 mx-auto mb-6" size={48} />
            <h3 className="font-heading font-black text-xl uppercase mb-2">No Content Found</h3>
            <p className="text-zinc-500 font-medium max-w-sm mx-auto mb-8 text-sm italic">
              {searchQuery ? "No matches found for your search criteria. Try refining your keyword." : "You haven't uploaded any masterpieces yet. Share your stories with the world."}
            </p>
            {!searchQuery && (
              <Link 
                href="/write" 
                className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:opacity-85 transition-all shadow-xl"
              >
                Create First Draft
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Title & Category</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Performance</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Modified</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredContents.map((item) => (
                  <tr key={item.id} className="group hover:bg-zinc-50/80 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-zinc-50 border border-zinc-200 rounded-sm flex items-center justify-center text-[10px] font-black uppercase text-zinc-400">
                          {item.type === "Book" ? "PDF" : "TXT"}
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-lg tracking-tight mb-1 text-zinc-900">{item.title}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.type} • {item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-8">
                      <div className="flex gap-8 text-zinc-900">
                        <div>
                          <p className="text-xs font-black">{item.views}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Reads</p>
                        </div>
                        <div>
                          <p className="text-xs font-black">{item.revenue}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Revenue</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.date}</p>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/write/${item.id}`}
                          className="p-2.5 rounded-sm border border-transparent hover:bg-white hover:border-zinc-200 text-zinc-400 hover:text-black transition-all"
                          title="Edit Manuscript"
                        >
                          <Edit3 size={16} />
                        </Link>
                        
                        <Link 
                          href={item.type === "Book" ? `/book/${item.id}` : item.type === "Article" ? `/articles/${item.id}` : `/blogs/${item.id}`}
                          className="p-2.5 rounded-sm border border-transparent hover:bg-white hover:border-zinc-200 text-zinc-400 hover:text-black transition-all"
                          title="View Live"
                        >
                          <Eye size={16} />
                        </Link>

                        <button 
                          onClick={() => handleDelete(item.id, item.type)}
                          className="p-2.5 rounded-sm border border-transparent hover:bg-red-50 hover:border-red-100 text-zinc-400 hover:text-red-500 transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    Published: "bg-green-50 text-green-600 border-green-100",
    Review: "bg-orange-50 text-orange-600 border-orange-100",
    Draft: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  const icons: any = {
    Published: <CheckCircle2 size={12} />,
    Review: <Clock size={12} />,
    Draft: <AlertCircle size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
      {icons[status] || <AlertCircle size={12} />}
      {status}
    </span>
  );
}
