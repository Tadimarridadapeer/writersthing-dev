"use client";

import { useState, useEffect, useRef } from "react";
import { PenTool, Plus, X, Trash2, ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
}

export default function QuickNoteWidget({ embedded = false }: { embedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const storageKey = user ? `wt_quick_notes_${user.id}` : "wt_quick_notes_anonymous";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {}
    } else {
      setNotes([]);
    }

    if (embedded) return; // no click-outside for embedded mode

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [storageKey, embedded]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(storageKey, JSON.stringify(newNotes));
    
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "",
      text: "",
      date: new Date().toISOString()
    };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const updateActiveNote = (field: string, value: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    saveNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  // Embedded mode: render content directly without button/dropdown wrapper
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {activeNote ? (
          <div className="flex flex-col h-full bg-[#FCFBF7]">
            <div className="flex items-center justify-between p-3 border-b border-zinc-100 bg-white">
              <button 
                onClick={() => setActiveNote(null)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                onClick={() => {}}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-widest ${isSaving ? 'text-emerald-600 bg-emerald-50' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'}`}
              >
                <Save size={14} />
                {isSaving ? "Saved" : "Save"}
              </button>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-3">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateActiveNote("title", e.target.value)}
                placeholder="Note title..."
                className="text-lg font-serif font-bold text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300"
              />
              <textarea
                value={activeNote.text}
                onChange={(e) => updateActiveNote("text", e.target.value)}
                placeholder="Jot down a dream, an idea, or a story fragment..."
                className="flex-1 text-sm text-zinc-700 leading-relaxed font-serif bg-transparent border-none outline-none resize-none placeholder:text-zinc-300"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">Your Notes</span>
              <button 
                onClick={createNote}
                className="p-1.5 hover:bg-zinc-100 rounded-sm transition-colors text-zinc-900"
                title="New Note"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {notes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                  <PenTool size={32} strokeWidth={1} className="mb-4 text-zinc-200" />
                  <p className="text-xs font-bold uppercase tracking-widest mb-2">No notes yet</p>
                  <p className="text-[10px] leading-relaxed">Capture quick ideas and dreams here before you lose them.</p>
                  <button onClick={createNote} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-black underline">Start writing</button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {notes.map(note => (
                    <div 
                      key={note.id}
                      onClick={() => setActiveNote(note)}
                      className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-sm cursor-pointer group border border-transparent hover:border-zinc-100 transition-colors"
                    >
                      <div className="flex flex-col gap-1 overflow-hidden pr-4">
                        <span className="text-sm font-bold text-zinc-900 truncate font-serif">
                          {note.title || "Untitled Note"}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {note.text || "Empty..."}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => deleteNote(note.id, e)}
                        className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden md:flex items-center gap-1.5 px-4 py-2 border border-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all bg-white ${isOpen ? 'bg-black text-white' : 'text-black'}`}
        title="Quick Notes"
      >
        <PenTool size={12} /> Quick Note
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-[340px] h-[480px] bg-white border border-zinc-200 shadow-xl rounded-md flex flex-col z-[100] overflow-hidden"
          >
            {activeNote ? (
              // Note Editor View
              <div className="flex flex-col h-full bg-[#FCFBF7]">
                <div className="flex items-center justify-between p-3 border-b border-zinc-100 bg-white">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveNote(null)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { /* It auto-saves, but give them a manual click too */ }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-widest ${isSaving ? 'text-emerald-600 bg-emerald-50' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'}`}
                      title="Save Note"
                    >
                      <Save size={14} />
                      {isSaving ? "Saved" : "Save"}
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-zinc-100 rounded-sm transition-colors text-zinc-400 hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote("title", e.target.value)}
                    placeholder="Note title..."
                    className="text-lg font-serif font-bold text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300"
                  />
                  <textarea
                    value={activeNote.text}
                    onChange={(e) => updateActiveNote("text", e.target.value)}
                    placeholder="Jot down a dream, an idea, or a story fragment..."
                    className="flex-1 text-sm text-zinc-700 leading-relaxed font-serif bg-transparent border-none outline-none resize-none placeholder:text-zinc-300"
                  />
                </div>
              </div>
            ) : (
              // Notes List View
              <div className="flex flex-col h-full bg-white">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">Quick Notes</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={createNote}
                      className="p-1.5 hover:bg-zinc-100 rounded-sm transition-colors text-zinc-900"
                      title="New Note"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 hover:bg-zinc-100 rounded-sm transition-colors text-zinc-400 hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                      <PenTool size={32} strokeWidth={1} className="mb-4 text-zinc-200" />
                      <p className="text-xs font-bold uppercase tracking-widest mb-2">No notes yet</p>
                      <p className="text-[10px] leading-relaxed">Capture quick ideas and dreams here before you lose them.</p>
                      <button onClick={createNote} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-black underline">Start writing</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {notes.map(note => (
                        <div 
                          key={note.id}
                          onClick={() => setActiveNote(note)}
                          className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-sm cursor-pointer group border border-transparent hover:border-zinc-100 transition-colors"
                        >
                          <div className="flex flex-col gap-1 overflow-hidden pr-4">
                            <span className="text-sm font-bold text-zinc-900 truncate font-serif">
                              {note.title || "Untitled Note"}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate">
                              {note.text || "Empty..."}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => deleteNote(note.id, e)}
                            className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
