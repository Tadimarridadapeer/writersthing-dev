"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  Send, 
  Settings, 
  Maximize2, 
  Type, 
  Eye, 
  MoreVertical,
  ChevronLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Loading manuscript...");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch data on mount
  useEffect(() => {
    const fetchManuscript = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/manuscripts/${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || "Failed to load manuscript");
        
        setTitle(data.title);
        setContent(data.content);
        if (data.updatedAt) setLastSaved(new Date(data.updatedAt));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchManuscript();
  }, [params]);

  // 2. Auto-save with debounce
  useEffect(() => {
    if (isLoading || error) return;

    const saveTimeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        const { id } = await params;
        const res = await fetch(`/api/manuscripts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        
        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(saveTimeout);
  }, [title, content, params, isLoading, error]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-zinc-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-black gap-6">
        <h1 className="text-2xl font-heading font-bold uppercase tracking-tight text-red-600">ERROR ACCESSING MANUSCRIPT</h1>
        <p className="text-zinc-500 font-medium">{error}</p>
        <Link href="/dashboard" className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-sm shadow-xl">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pt-0">
      {/* Editor Header */}
      <div className="h-16 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-sm">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent font-heading font-bold text-lg outline-none border-b border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 transition-all tracking-tight"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">
            {isSaving ? "Auto-saving..." : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}
          </span>
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-black dark:border-white font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all shadow-lg">
            <Send size={14} />
            Publish
          </button>
          <button className="p-2">
            <MoreVertical size={20} className="text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Tools */}
        <div className="w-16 border-r border-zinc-100 dark:border-zinc-900 flex flex-col items-center py-6 gap-6 shrink-0 bg-zinc-50 dark:bg-zinc-950">
          <ToolIcon icon={<Type size={20} />} active />
          <ToolIcon icon={<Eye size={20} />} />
          <ToolIcon icon={<Maximize2 size={20} />} />
          <div className="mt-auto">
            <ToolIcon icon={<Settings size={20} />} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto bg-white dark:bg-black px-6 py-12 md:px-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start your story here..."
              className="w-full min-h-[70vh] bg-transparent resize-none outline-none text-xl leading-relaxed font-body placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
            />
          </motion.div>
        </div>

        {/* Outline Sidebar */}
        <div className="hidden xl:flex w-72 border-l border-zinc-100 dark:border-zinc-900 flex-col p-6 shrink-0">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 font-heading font-bold">Manuscript Outline</h2>
          <div className="space-y-4">
            <OutlineItem label="Chapter 1: The First Breath" active />
            <OutlineItem label="Chapter 2: Subconscious Drift" />
            <OutlineItem label="Chapter 3: The Shadow Market" />
            <div className="pt-4">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black font-bold">
                <Plus size={14} />
                Add Section
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolIcon({ icon, active }: any) {
  return (
    <button className={`p-3 transition-all rounded-sm ${active ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}>
      {icon}
    </button>
  );
}

function OutlineItem({ label, active }: any) {
  return (
    <div className={`p-3 border rounded-sm text-xs font-bold transition-all cursor-pointer ${active ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
      {label}
    </div>
  );
}

function Plus({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14M12 5v14"/></svg>
}

