"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, 
  Send, 
  Settings, 
  Maximize2, 
  Minimize2,
  Type, 
  Eye, 
  MoreVertical,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ManuscriptType = "book" | "article" | "blog" | null;
type EditorMode = "edit" | "preview";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Core manuscript state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Loading manuscript...");
  const [manuscriptType, setManuscriptType] = useState<ManuscriptType>(null);
  const [manuscriptStatus, setManuscriptStatus] = useState("Draft");
  const [isDraft, setIsDraft] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [zenMode, setZenMode] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeOutlineIndex, setActiveOutlineIndex] = useState(0);
  
  // Track initial content for dirty-checking (prevents auto-save on mount)
  const [initialContent, setInitialContent] = useState("");
  const [initialTitle, setInitialTitle] = useState("");

  // Toast notification helper
  const showNotification = useCallback((message: string, type: "success" | "error") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 1. Fetch manuscript data on mount
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchManuscript = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/manuscripts/${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || "Failed to load manuscript");
        
        let rawContent = data.content || "";
        let cleanContent = rawContent;
        let draftFlag = false;

        // Check if content starts with the draft prefix
        if (rawContent.startsWith("[DRAFT]\n")) {
          cleanContent = rawContent.substring(8);
          draftFlag = true;
        } else if (rawContent === "[DRAFT]") {
          cleanContent = "";
          draftFlag = true;
        } else if (data.type !== "book" && !rawContent) {
          // Default all new non-book creations to drafts
          draftFlag = true;
        }

        setTitle(data.title);
        setContent(cleanContent);
        setIsDraft(draftFlag);
        setManuscriptType(data.type || null);
        setManuscriptStatus(draftFlag ? "Draft" : "Published");
        setInitialContent(cleanContent);
        setInitialTitle(data.title);
        if (data.updatedAt) setLastSaved(new Date(data.updatedAt));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchManuscript();
  }, [params]);

  // ═══════════════════════════════════════════════════════════
  // 2. Auto-save with 2-second debounce
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isLoading || error) return;
    // Skip if nothing has changed from what was loaded or if manual operation is running
    if (content === initialContent && title === initialTitle) return;
    if (saveStatus === "saving" || isPublishing) return;

    const saveTimeout = setTimeout(async () => {
      setSaveStatus("saving");
      
      // Abort any existing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { id } = await params;
        // Prepend draft tag if it is still in draft mode
        const contentToSave = isDraft ? `[DRAFT]\n${content}` : content;
        const res = await fetch(`/api/manuscripts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: contentToSave }),
          signal: controller.signal,
        });
        
        if (res.ok) {
          const data = await res.json();
          setLastSaved(new Date(data.updatedAt || Date.now()));
          setSaveStatus("saved");
          setInitialContent(content);
          setInitialTitle(title);
          setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
          setSaveStatus("error");
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Auto-save request was aborted.");
          return;
        }
        console.error("Auto-save failed:", err);
        setSaveStatus("error");
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 2000);

    saveTimeoutRef.current = saveTimeout;

    return () => {
      clearTimeout(saveTimeout);
      saveTimeoutRef.current = null;
    };
  }, [title, content, params, isLoading, error, initialContent, initialTitle, isDraft, saveStatus, isPublishing]);

  // Clean up any in-flight requests on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 3. Manual Save Draft
  // ═══════════════════════════════════════════════════════════
  const handleSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Abort any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSaveStatus("saving");
    try {
      const { id } = await params;
      const contentToSave = isDraft ? `[DRAFT]\n${content}` : content;
      const res = await fetch(`/api/manuscripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: contentToSave }),
        signal: controller.signal,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save");
      }
      
      const data = await res.json();
      setLastSaved(new Date(data.updatedAt || Date.now()));
      setSaveStatus("saved");
      setInitialContent(content);
      setInitialTitle(title);
      showNotification("Draft saved successfully!", "success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Manual save request was aborted.");
        return;
      }
      console.error("Manual save failed:", err);
      setSaveStatus("error");
      showNotification("Failed to save: " + err.message, "error");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [params, title, content, isDraft, showNotification]);

  // ═══════════════════════════════════════════════════════════
  // 4. Publish
  // ═══════════════════════════════════════════════════════════
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    
    const confirmMsg = manuscriptType === "book"
      ? "Are you sure you want to publish this book? It will become visible to all readers."
      : "Are you sure you want to publish? Your content will be saved and made public.";
    
    if (!window.confirm(confirmMsg)) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Abort any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsPublishing(true);
    try {
      const { id } = await params;
      // Publishing removes the draft prefix
      const payload: Record<string, any> = { title, content };
      
      // Only books have a database status field
      if (manuscriptType === "book") {
        payload.status = "Published";
      }
      
      const res = await fetch(`/api/manuscripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to publish");
      }
      
      // Synchronize initial content to current content to prevent subsequent auto-save triggers
      setInitialContent(content);
      setInitialTitle(title);
      setManuscriptStatus("Published");
      setIsDraft(false); // Disable draft prefix for future edits
      showNotification("Published successfully! Redirecting…", "success");
      
      setTimeout(() => {
        router.push("/dashboard?published=true");
      }, 1500);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Publish request was aborted.");
        return;
      }
      console.error("Publish failed:", err);
      showNotification("Failed to publish: " + err.message, "error");
    } finally {
      setIsPublishing(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [params, title, content, manuscriptType, isPublishing, router, showNotification]);

  // ═══════════════════════════════════════════════════════════
  // 4.5. Image Upload & Markdown Insertion
  // ═══════════════════════════════════════════════════════════
  const handleInsertImageClick = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Authentication required to upload images");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(path, file);

      if (uploadError) throw new Error("Image Upload Failed: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("article-images")
        .getPublicUrl(path);

      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;
      
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        setContent(before + imageMarkdown + after);
        
        // Return focus and place selection cursor after the inserted image markdown
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
        }, 100);
      } else {
        setContent(prev => prev + imageMarkdown);
      }

      showNotification("Image uploaded and inserted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showNotification("Failed to upload image: " + err.message, "error");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  }, [showNotification]);

  // ═══════════════════════════════════════════════════════════
  // 5. Parse dynamic outline from heading lines in content
  // ═══════════════════════════════════════════════════════════
  const outlineItems = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const items: { label: string; lineIndex: number; level: number }[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        items.push({ label: trimmed.substring(4), lineIndex: index, level: 3 });
      } else if (trimmed.startsWith("## ")) {
        items.push({ label: trimmed.substring(3), lineIndex: index, level: 2 });
      } else if (trimmed.startsWith("# ")) {
        items.push({ label: trimmed.substring(2), lineIndex: index, level: 1 });
      } else if (/^Chapter\s+\d+/i.test(trimmed)) {
        items.push({ label: trimmed, lineIndex: index, level: 1 });
      }
    });
    
    return items;
  }, [content]);

  // ═══════════════════════════════════════════════════════════
  // 6. Outline click → scroll textarea to that heading
  // ═══════════════════════════════════════════════════════════
  const handleOutlineClick = useCallback((lineIndex: number, outlineIdx: number) => {
    setActiveOutlineIndex(outlineIdx);
    
    // Switch to edit mode so the textarea is available
    if (editorMode !== "edit") setEditorMode("edit");
    
    // Use requestAnimationFrame to wait for mode switch render
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const lines = content.split("\n");
        
        // Calculate character offset of the target line
        let charIndex = 0;
        for (let i = 0; i < lineIndex && i < lines.length; i++) {
          charIndex += lines[i].length + 1; // +1 for newline
        }
        
        textarea.focus();
        textarea.setSelectionRange(charIndex, charIndex + (lines[lineIndex]?.length || 0));
        
        // Approximate scroll position (≈28px per line in text-xl leading-relaxed)
        const lineHeight = 28;
        textarea.scrollTop = Math.max(0, lineIndex * lineHeight - 100);
      }
    });
  }, [content, editorMode]);

  // ═══════════════════════════════════════════════════════════
  // 7. Add new section
  // ═══════════════════════════════════════════════════════════
  const handleAddSection = useCallback(() => {
    const sectionTitle = window.prompt("Enter section or chapter title:");
    if (!sectionTitle?.trim()) return;
    
    const newSection = `\n\n# ${sectionTitle.trim()}\n\n`;
    setContent(prev => prev + newSection);
    
    // Scroll textarea to the bottom where the new section was added
    setTimeout(() => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        textarea.scrollTop = textarea.scrollHeight;
      }
    }, 100);
  }, []);



  // ═══════════════════════════════════════════════════════════
  // Simple markdown → HTML renderer for preview mode
  // ═══════════════════════════════════════════════════════════
  const renderedPreview = useMemo(() => {
    if (!content) return "<p style='color:#d4d4d8;font-style:italic;'>No content to preview.</p>";
    
    const lines = content.split("\n");
    let html = "";
    let inParagraph = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === "") {
        if (inParagraph) { html += "</p>"; inParagraph = false; }
        continue;
      }
      
      if (trimmed.startsWith("### ")) {
        if (inParagraph) { html += "</p>"; inParagraph = false; }
        html += `<h3 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.75rem;letter-spacing:-0.01em;">${escapeHtml(trimmed.substring(4))}</h3>`;
      } else if (trimmed.startsWith("## ")) {
        if (inParagraph) { html += "</p>"; inParagraph = false; }
        html += `<h2 style="font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;letter-spacing:-0.02em;">${escapeHtml(trimmed.substring(3))}</h2>`;
      } else if (trimmed.startsWith("# ")) {
        if (inParagraph) { html += "</p>"; inParagraph = false; }
        html += `<h1 style="font-size:2rem;font-weight:800;margin:3rem 0 1.25rem;letter-spacing:-0.03em;">${escapeHtml(trimmed.substring(2))}</h1>`;
      } else {
        if (!inParagraph) {
          html += '<p style="font-size:1.125rem;line-height:1.8;margin:0.5rem 0;color:#27272a;">';
          inParagraph = true;
        } else {
          html += "<br/>";
        }
        let processed = escapeHtml(trimmed);
        // Replace markdown images: ![alt](url)
        processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:1.5rem 0;border-radius:0.375rem;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);display:block;" />');
        processed = processed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        processed = processed.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html += processed;
      }
    }
    
    if (inParagraph) html += "</p>";
    return html;
  }, [content]);

  // ═══════════════════════════════════════════════════════════
  // Keyboard shortcuts  (Ctrl+S = save)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // ═══════════════════════════════════════════════════════════
  // Loading / Error states
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
        <h1 className="text-2xl font-heading font-bold uppercase tracking-tight text-red-600">ERROR ACCESSING MANUSCRIPT</h1>
        <p className="text-zinc-500 font-medium">{error}</p>
        <Link href="/dashboard" className="px-8 py-3 bg-black text-white font-bold rounded-sm shadow-xl">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Status indicator text
  const getStatusText = () => {
    switch (saveStatus) {
      case "saving": return "Saving…";
      case "saved": return `Saved ${lastSaved?.toLocaleTimeString() || ""}`;
      case "error": return "Save failed";
      default: return lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "Not saved yet";
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col pt-0 bg-white text-zinc-900 transition-all duration-300">
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ─── Toast Notification ───────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-sm shadow-xl flex items-center gap-3 ${
              showToast.type === "success" ? "bg-black text-white" : "bg-red-600 text-white"
            }`}
          >
            {showToast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-bold">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Editor Header ────────────────────────────────── */}
      {!zenMode && (
        <div className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-sm text-zinc-900">
              <ChevronLeft size={20} />
            </Link>
            <div className="h-4 w-px bg-zinc-200 mx-1" />
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent font-heading font-bold text-lg outline-none border-b border-transparent focus:border-zinc-300 transition-all tracking-tight text-zinc-900"
            />
            {manuscriptType && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-400 px-2 py-1 rounded-sm">
                {manuscriptType} {isDraft ? "• Draft" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Save status indicator */}
            <span className={`text-[10px] font-black uppercase tracking-widest mr-2 flex items-center gap-2 ${
              saveStatus === "saving" ? "text-amber-500" : 
              saveStatus === "saved" ? "text-green-600" : 
              saveStatus === "error" ? "text-red-500" : 
              "text-zinc-500"
            }`}>
              {saveStatus === "saving" && <Loader2 size={12} className="animate-spin" />}
              {saveStatus === "saved" && <Check size={12} />}
              {saveStatus === "error" && <AlertCircle size={12} />}
              {getStatusText()}
            </span>

            {/* Save Draft */}
            <button 
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 px-4 py-2 border border-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all text-black bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>

            {/* Publish */}
            <button 
              onClick={handlePublish}
              disabled={isPublishing || manuscriptStatus === "Published"}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {manuscriptStatus === "Published" ? "Published" : "Publish"}
            </button>

            <button className="p-2 text-zinc-500 hover:text-black">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Editor Area ─────────────────────────────── */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Tools */}
        {!zenMode && (
          <div className="w-16 border-r border-zinc-100 flex flex-col items-center py-6 gap-6 shrink-0 bg-zinc-50">
            <ToolIcon
              icon={<Type size={20} />}
              active={editorMode === "edit"}
              onClick={() => setEditorMode("edit")}
              tooltip="Edit (write)"
            />
            <ToolIcon
              icon={<Eye size={20} />}
              active={editorMode === "preview"}
              onClick={() => setEditorMode("preview")}
              tooltip="Preview"
            />
            {editorMode === "edit" && (
              <ToolIcon
                icon={isUploadingImage ? <Loader2 className="animate-spin text-black" size={20} /> : <ImageIcon size={20} />}
                active={false}
                onClick={handleInsertImageClick}
                tooltip="Insert Image"
              />
            )}
            <ToolIcon
              icon={<Maximize2 size={20} />}
              active={false}
              onClick={() => setZenMode(true)}
              tooltip="Zen Mode"
            />
            <div className="mt-auto">
              <ToolIcon
                icon={<Settings size={20} />}
                active={false}
                onClick={() => showNotification("Settings coming soon!", "success")}
                tooltip="Settings"
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto bg-white px-6 py-12 md:px-24 relative">
          {/* Zen-mode exit button */}
          {zenMode && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              whileHover={{ opacity: 1 }}
              onClick={() => setZenMode(false)}
              className="fixed top-4 right-4 z-40 p-2 bg-black/10 hover:bg-black text-zinc-500 hover:text-white rounded-sm transition-all"
              title="Exit Zen Mode (Esc)"
            >
              <Minimize2 size={18} />
            </motion.button>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {editorMode === "edit" ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start your story here…"
                className="w-full min-h-[70vh] bg-transparent resize-none outline-none text-xl leading-relaxed font-body placeholder:text-zinc-300 text-zinc-900"
              />
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-[70vh] markdown-body"
                dangerouslySetInnerHTML={{ __html: renderedPreview }}
              />
            )}
          </motion.div>
        </div>

        {/* Outline Sidebar */}
        {!zenMode && (
          <div className="hidden xl:flex w-72 border-l border-zinc-100 flex-col p-6 shrink-0 bg-white">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 font-heading font-bold">
              Manuscript Outline
            </h2>
            <div className="space-y-3 overflow-y-auto flex-grow">
              {outlineItems.length > 0 ? (
                outlineItems.map((item, idx) => (
                  <OutlineItem
                    key={`${item.lineIndex}-${idx}`}
                    label={item.label}
                    level={item.level}
                    active={idx === activeOutlineIndex}
                    onClick={() => handleOutlineClick(item.lineIndex, idx)}
                  />
                ))
              ) : (
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  No headings found.<br />
                  Use <code className="bg-zinc-100 px-1 rounded text-zinc-500"># Heading</code> to create sections.
                </p>
              )}
              <div className="pt-4">
                <button 
                  onClick={handleAddSection}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black font-bold transition-colors"
                >
                  <PlusIcon size={14} />
                  Add Section
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper: HTML-escape for preview renderer
// ═══════════════════════════════════════════════════════════════
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════
function ToolIcon({ icon, active, onClick, tooltip }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; tooltip?: string }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={`p-3 transition-all rounded-sm ${active ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-100 hover:text-black"}`}
    >
      {icon}
    </button>
  );
}

function OutlineItem({ label, level, active, onClick }: { label: string; level: number; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 border rounded-sm text-xs font-bold transition-all cursor-pointer ${
        active 
          ? "border-black bg-zinc-50 text-black" 
          : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
      }`}
      style={{ paddingLeft: level > 1 ? `${(level - 1) * 12 + 12}px` : undefined }}
    >
      {label}
    </div>
  );
}

function PlusIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5v14"/>
    </svg>
  );
}
