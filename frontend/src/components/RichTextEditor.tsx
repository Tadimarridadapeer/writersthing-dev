"use client";

import { useState, useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2, Strikethrough, Type } from "lucide-react";

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
  { id: "impact", name: "Impact", style: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif" }
];

export default function RichTextEditor({ content, onChange, placeholder = "Start writing your story..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
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

  return (
    <div className="border border-zinc-200 rounded-sm bg-white overflow-hidden flex flex-col md:flex-row">
      <div className="flex md:flex-col flex-wrap items-center md:items-center gap-1 p-2 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50 md:w-14 shrink-0">
        <div className="relative w-full flex justify-center" ref={fontDropdownRef}>
          <button 
            type="button" 
            onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)} 
            className={`p-2 rounded text-zinc-650 transition-all flex items-center justify-center w-10 h-10 border ${isFontDropdownOpen ? 'bg-black border-black text-white' : 'hover:bg-zinc-200 border-transparent hover:border-zinc-300'}`}
            title="Select Font Style"
          >
            <Type size={16} />
          </button>

          {isFontDropdownOpen && (
            <div className="absolute left-full top-0 ml-2 z-50 bg-white border border-zinc-200 shadow-2xl rounded-sm py-2 w-52 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-left-2 duration-150">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 px-4 py-1.5 border-b border-zinc-100 mb-1">Select Typeface</p>
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    execCommand("fontName", font.id);
                    setIsFontDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 text-xs transition-colors flex flex-col cursor-pointer border-0 bg-transparent text-zinc-800 hover:text-black font-semibold"
                  style={{ fontFamily: font.style }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hidden md:block w-full h-px bg-zinc-300 my-1" />
        <button type="button" onClick={() => execCommand("formatBlock", "H1")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Heading 1"><Heading1 size={16} /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "H2")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Heading 2"><Heading2 size={16} /></button>
        <div className="w-px h-5 md:w-6 md:h-px bg-zinc-300 mx-1 md:mx-auto md:my-1" />
        <button type="button" onClick={() => execCommand("bold")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand("italic")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Italic"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand("underline")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Underline"><Underline size={16} /></button>
        <button type="button" onClick={() => execCommand("strikeThrough")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Strikethrough"><Strikethrough size={16} /></button>
        <div className="w-px h-5 md:w-6 md:h-px bg-zinc-300 mx-1 md:mx-auto md:my-1" />
        <button type="button" onClick={() => execCommand("insertUnorderedList")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Bullet List"><List size={16} /></button>
        <button type="button" onClick={() => execCommand("insertOrderedList")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} className="p-2 hover:bg-zinc-200 rounded text-zinc-650 transition-colors" title="Quote"><Quote size={16} /></button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        className="p-6 md:p-8 min-h-[400px] prose prose-zinc max-w-none focus:outline-none flex-grow"
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
        font[face="inter"] { font-family: var(--font-inter), sans-serif; }
        font[face="outfit"] { font-family: var(--font-outfit), sans-serif; }
        font[face="arial"] { font-family: Arial, sans-serif; }
        font[face="calibri"] { font-family: Calibri, Candara, Segoe, sans-serif; }
        font[face="helvetica"] { font-family: Helvetica Neue, Helvetica, Arial, sans-serif; }
        font[face="montserrat"] { font-family: Montserrat, sans-serif; }
        font[face="questrial"] { font-family: var(--font-questrial), sans-serif; }
        font[face="playfair"] { font-family: var(--font-playfair), serif; }
        font[face="eb-garamond"] { font-family: var(--font-eb-garamond), serif; }
        font[face="libre-baskerville"] { font-family: var(--font-libre-baskerville), serif; }
        font[face="bodoni-moda"] { font-family: var(--font-bodoni-moda), serif; }
        font[face="times-new-roman"] { font-family: Times New Roman, Times, serif; }
        font[face="georgia"] { font-family: Georgia, serif; }
        font[face="merriweather"] { font-family: Merriweather, serif; }
        font[face="courier-new"] { font-family: Courier New, Courier, monospace; }
        font[face="lucida-console"] { font-family: Lucida Console, Monaco, monospace; }
        font[face="impact"] { font-family: Impact, Haettenschweiler, Arial Narrow Bold, sans-serif; }
      `}} />
    </div>
  );
}
