"use client";

import { useState, useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2, Strikethrough, Type, Image as ImageIcon, Plus, Link as LinkIcon, Trash2, RefreshCw } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONTS = [
  { id: "inter", name: "Inter", style: "var(--font-inter), sans-serif" },
  { id: "outfit", name: "Outfit", style: "var(--font-outfit), sans-serif" },
  { id: "arial", name: "Arial", style: "Arial, sans-serif" },
  { id: "calibri", name: "Calibri", style: "Calibri, Candara, Segoe, sans-serif" },
  { id: "helvetica", name: "Helvetica", style: "Helvetica Neue, Helvetica, Arial, sans-serif" },
  { id: "montserrat", name: "Montserrat", style: "Montserrat, sans-serif" },
  { id: "questrial", name: "Questrial", style: "var(--font-questrial), sans-serif" },
  { id: "playfair", name: "Playfair Display", style: "var(--font-playfair), serif" },
  { id: "eb-garamond", name: "Garamond", style: "var(--font-eb-garamond), serif" },
  { id: "libre-baskerville", name: "Baskerville", style: "var(--font-libre-baskerville), serif" },
  { id: "bodoni-moda", name: "Bodoni Moda", style: "var(--font-bodoni-moda), serif" },
  { id: "times-new-roman", name: "Times New Roman", style: "Times New Roman, Times, serif" },
  { id: "georgia", name: "Georgia", style: "Georgia, serif" },
  { id: "merriweather", name: "Merriweather", style: "Merriweather, serif" },
  { id: "courier-new", name: "Courier New", style: "Courier New, Courier, monospace" },
  { id: "lucida-console", name: "Lucida Console", style: "Lucida Console, Monaco, monospace" },
  { id: "impact", name: "Impact", style: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif" },
  { id: "comic-sans-ms", name: "Comic Sans MS", style: "Comic Sans MS, cursive, sans-serif" },
  { id: "trebuchet-ms", name: "Trebuchet MS", style: "Trebuchet MS, sans-serif" },
  { id: "verdana", name: "Verdana", style: "Verdana, sans-serif" },
  { id: "tahoma", name: "Tahoma", style: "Tahoma, sans-serif" },
  { id: "palatino", name: "Palatino", style: "Palatino Linotype, Book Antiqua, Palatino, serif" },
  { id: "garamond", name: "Garamond", style: "Garamond, serif" },
  { id: "bookman", name: "Bookman", style: "Bookman Old Style, serif" },
  { id: "avenir", name: "Avenir", style: "Avenir, sans-serif" },
  { id: "futura", name: "Futura", style: "Futura, sans-serif" },
  { id: "optima", name: "Optima", style: "Optima, sans-serif" }
];

const FONT_SIZES = [
  { id: "1", name: "Small" },
  { id: "3", name: "Normal" },
  { id: "4", name: "Large" },
  { id: "5", name: "Extra Large" },
  { id: "6", name: "Huge" },
  { id: "7", name: "Giant" },
];

export default function RichTextEditor({ content, onChange, placeholder = "Start writing your story..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  const [floatingPos, setFloatingPos] = useState<{ top: number, visible: boolean }>({ top: 0, visible: false });
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [formatMenuPos, setFormatMenuPos] = useState<{ top: number, left: number, visible: boolean }>({ top: 0, left: 0, visible: false });
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageMenuPos, setImageMenuPos] = useState({ top: 0, left: 0, visible: false });

  const updateFloatingMenu = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setFloatingPos(prev => ({ ...prev, visible: false }));
      setIsFloatingMenuOpen(false);
      setFormatMenuPos(prev => ({ ...prev, visible: false }));
      setImageMenuPos(prev => ({ ...prev, visible: false }));
      setSelectedImage(null);
      return;
    }
    
    let isInEditor = false;
    let curr: Node | null = sel.anchorNode;
    while (curr) {
      if (curr === editorRef.current) { isInEditor = true; break; }
      curr = curr.parentNode;
    }

    if (!isInEditor) {
      setFloatingPos(prev => ({ ...prev, visible: false }));
      setIsFloatingMenuOpen(false);
      setFormatMenuPos(prev => ({ ...prev, visible: false }));
      return;
    }

    const range = sel.getRangeAt(0);
    const containerRect = editorRef.current!.parentElement!.getBoundingClientRect();

    if (!sel.isCollapsed) {
      // Text is selected! Show the floating format toolbar
      const rect = range.getBoundingClientRect();
      const top = rect.top - containerRect.top - 48; 
      const left = rect.left - containerRect.left + (rect.width / 2);
      
      setFormatMenuPos({ top, left, visible: true });
      
      setFloatingPos(prev => ({ ...prev, visible: false }));
      setIsFloatingMenuOpen(false);
      return;
    } else {
      setFormatMenuPos(prev => ({ ...prev, visible: false }));
    }

    let node = sel.anchorNode as HTMLElement;
    if (node.nodeType === 3) node = node.parentElement as HTMLElement;

    // Drill up to the block level element (child of editorRef, or editorRef itself)
    let blockNode = node;
    while (blockNode && blockNode.parentElement !== editorRef.current && blockNode !== editorRef.current) {
      blockNode = blockNode.parentElement as HTMLElement;
    }

    // Check if the current line/block is empty
    const text = blockNode?.textContent?.trim() || "";
    if (text.length === 0 && blockNode?.tagName !== 'IMG' && blockNode?.tagName !== 'HR') {
      let rect = range.getBoundingClientRect();
      
      // If range rect is 0 (e.g. empty div with br), fallback to blockNode rect
      if (rect.height === 0 || rect.top === 0) {
        rect = blockNode.getBoundingClientRect();
      }
      
      const top = rect.top - containerRect.top + (rect.height / 2) - 16; 
      
      setFloatingPos({ top, visible: true });
    } else {
      setFloatingPos(prev => ({ ...prev, visible: false }));
      setIsFloatingMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", updateFloatingMenu);
    return () => document.removeEventListener("selectionchange", updateFloatingMenu);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "BlogImage");

        const res = await fetch("/api/stories/upload-cover", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          execCommand("insertImage", data.publicUrl);
        } else {
          console.error("Failed to upload image");
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    e.target.value = '';
    setIsFloatingMenuOpen(false);
  };

  const handleImageReplace = async (e: React.ChangeEvent<HTMLInputElement>, imgElement: HTMLImageElement) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "BlogImage");

        const res = await fetch("/api/stories/upload-cover", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          imgElement.src = data.publicUrl;
          handleChange();
          setImageMenuPos(prev => ({ ...prev, visible: false }));
          setSelectedImage(null);
        } else {
          console.error("Failed to replace image");
        }
      } catch (error) {
        console.error("Replace error:", error);
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      const rect = img.getBoundingClientRect();
      const containerRect = editorRef.current!.parentElement!.getBoundingClientRect();
      
      setImageMenuPos({
        top: rect.top - containerRect.top - 48,
        left: rect.left - containerRect.left + (rect.width / 2),
        visible: true
      });
      
      // hide other menus
      setFormatMenuPos(prev => ({ ...prev, visible: false }));
      setFloatingPos(prev => ({ ...prev, visible: false }));
      setIsFloatingMenuOpen(false);
    } else {
      setImageMenuPos(prev => ({ ...prev, visible: false }));
      setSelectedImage(null);
    }
  };

  return (
    <div className="bg-white overflow-visible flex flex-col group relative">
      
      {/* Floating Format Menu (Appears on text selection) */}
      {formatMenuPos.visible && (
        <div 
          className="absolute z-50 flex items-center gap-1 py-1.5 px-2 bg-zinc-900 shadow-xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
          style={{ top: formatMenuPos.top, left: formatMenuPos.left, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="relative flex justify-center" ref={fontDropdownRef}>
            <button type="button" onClick={() => { setIsFontDropdownOpen(!isFontDropdownOpen); setIsSizeDropdownOpen(false); }} className={`px-2 h-7 rounded text-zinc-300 hover:text-white transition-all flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${isFontDropdownOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800'}`} title="Select Font Style">Font</button>
            {isFontDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-50 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl py-2 w-48 max-h-64 overflow-y-auto custom-scrollbar">
                {FONTS.map((font) => (
                  <button key={font.id} type="button" onClick={(e) => { e.preventDefault(); execCommand("fontName", font.id); setIsFontDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm transition-colors text-zinc-300 hover:text-white block" style={{ fontFamily: font.style }}>{font.name}</button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative flex justify-center" ref={sizeDropdownRef}>
            <button type="button" onClick={() => { setIsSizeDropdownOpen(!isSizeDropdownOpen); setIsFontDropdownOpen(false); }} className={`px-2 h-7 rounded text-zinc-300 hover:text-white transition-all flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${isSizeDropdownOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800'}`} title="Select Font Size">Size</button>
            {isSizeDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-50 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl py-2 w-32 max-h-64 overflow-y-auto custom-scrollbar">
                {FONT_SIZES.map((size) => (
                  <button key={size.id} type="button" onClick={(e) => { e.preventDefault(); execCommand("fontSize", size.id); setIsSizeDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm transition-colors text-zinc-300 hover:text-white block font-medium">{size.name}</button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <button type="button" onClick={(e) => { e.preventDefault(); execCommand("bold"); }} className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="Bold"><Bold size={13} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); execCommand("italic"); }} className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="Italic"><Italic size={13} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); execCommand("underline"); }} className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="Underline"><Underline size={13} /></button>
          
          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <button type="button" onClick={(e) => { 
            e.preventDefault(); 
            const url = window.prompt("Enter link URL:");
            if (url) {
              const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
              execCommand("createLink", finalUrl);
            }
          }} className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="Link"><LinkIcon size={13} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); execCommand("formatBlock", "BLOCKQUOTE"); }} className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors" title="Quote"><Quote size={13} /></button>
          <label className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer" title="Insert Image">
            <ImageIcon size={13} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      )}

      {/* Floating Image Menu (Appears when clicking an image) */}
      {imageMenuPos.visible && selectedImage && (
        <div 
          className="absolute z-50 flex items-center gap-1 py-1.5 px-2 bg-zinc-900 shadow-xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
          style={{ top: imageMenuPos.top, left: imageMenuPos.left, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button 
            type="button" 
            onClick={() => {
              selectedImage.remove();
              setSelectedImage(null);
              setImageMenuPos(prev => ({ ...prev, visible: false }));
              handleChange();
            }} 
            className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-red-400 hover:bg-zinc-800 transition-colors" 
            title="Delete Image"
          >
            <Trash2 size={13} />
          </button>
          
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          
          <label className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer" title="Replace Image">
            <RefreshCw size={13} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              handleImageReplace(e, selectedImage);
            }} />
          </label>
        </div>
      )}
      {/* Floating Add Menu (Medium Style) */}
      {floatingPos.visible && (
        <div 
          className="absolute -left-14 flex items-center z-10 transition-all duration-200 ease-out"
          style={{ top: floatingPos.top }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button 
            type="button"
            onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${isFloatingMenuOpen ? 'rotate-45 border-zinc-900 text-zinc-900' : 'border-zinc-300 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800'}`}
          >
            <Plus size={18} strokeWidth={1} />
          </button>
          
          <div className="w-px h-8 bg-zinc-200 ml-4 mr-4" />
          
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isFloatingMenuOpen ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4 pointer-events-none'}`}>
            <label className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors bg-white shadow-sm cursor-pointer" title="Insert Image">
              <ImageIcon size={14} strokeWidth={1.5} />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand("insertUnorderedList"); setIsFloatingMenuOpen(false); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors bg-white shadow-sm" title="Bullet List"><List size={14} strokeWidth={1.5} /></button>
            <button type="button" onClick={(e) => { e.preventDefault(); execCommand("insertOrderedList"); setIsFloatingMenuOpen(false); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors bg-white shadow-sm" title="Numbered List"><ListOrdered size={14} strokeWidth={1.5} /></button>
          </div>
        </div>
      )}

      {/* Optional Static Toolbar (as requested) */}
      <div 
        className="flex flex-wrap items-center gap-2 mb-6 pt-6 border-t border-zinc-100 w-full"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("formatBlock", "H1"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm font-bold text-[10px]" title="Heading 1">H1</button>
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("formatBlock", "H2"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm font-bold text-[10px]" title="Heading 2">H2</button>
        
        <div className="w-px h-5 bg-zinc-200 mx-2" />
        
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("bold"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm font-serif font-bold text-sm" title="Bold">B</button>
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("italic"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm font-serif italic text-sm" title="Italic">I</button>
        <button type="button" onClick={(e) => { 
          e.preventDefault(); 
          const url = window.prompt("Enter link URL:");
          if (url) {
            const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            execCommand("createLink", finalUrl);
          }
        }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm" title="Link"><LinkIcon size={12} strokeWidth={2} /></button>
        
        <div className="w-px h-5 bg-zinc-200 mx-2" />
        
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("insertUnorderedList"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm" title="Bullet List"><List size={12} strokeWidth={2} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("insertOrderedList"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm" title="Numbered List"><ListOrdered size={12} strokeWidth={2} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); execCommand("formatBlock", "BLOCKQUOTE"); }} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm" title="Quote"><Quote size={12} strokeWidth={2} /></button>
        
        <div className="w-px h-5 bg-zinc-200 mx-2" />
        
        <label className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800 transition-colors bg-white shadow-sm cursor-pointer" title="Insert Image">
          <ImageIcon size={12} strokeWidth={2} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onClick={handleEditorClick}
        onInput={handleChange}
        onBlur={handleChange}
        className="min-h-[400px] prose prose-zinc prose-lg max-w-none focus:outline-none flex-grow outline-none border-none"
        data-placeholder={placeholder}
        style={{
          '--tw-prose-body': '#18181b',
        } as React.CSSProperties}
      />
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a1a1aa;
          font-style: italic;
          cursor: text;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .prose blockquote {
          font-size: 1.5rem;
          font-style: italic;
          color: #3f3f46;
          border-left: 4px solid #18181b;
          padding-left: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
          font-weight: 500;
        }
        .prose img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 2rem auto;
          border-radius: 0.5rem;
        }
        ${FONTS.map(f => `font[face="${f.id}"] { font-family: ${f.style}; }`).join('\n        ')}
      `}} />
    </div>
  );
}
