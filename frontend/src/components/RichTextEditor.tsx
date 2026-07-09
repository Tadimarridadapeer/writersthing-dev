"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2, Strikethrough } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = "Start writing your story..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

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
        <button type="button" onClick={() => execCommand("formatBlock", "H1")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Heading 1"><Heading1 size={16} /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "H2")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Heading 2"><Heading2 size={16} /></button>
        <div className="w-px h-5 md:w-6 md:h-px bg-zinc-300 mx-1 md:mx-auto md:my-1" />
        <button type="button" onClick={() => execCommand("bold")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand("italic")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Italic"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand("underline")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Underline"><Underline size={16} /></button>
        <button type="button" onClick={() => execCommand("strikeThrough")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Strikethrough"><Strikethrough size={16} /></button>
        <div className="w-px h-5 md:w-6 md:h-px bg-zinc-300 mx-1 md:mx-auto md:my-1" />
        <button type="button" onClick={() => execCommand("insertUnorderedList")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Bullet List"><List size={16} /></button>
        <button type="button" onClick={() => execCommand("insertOrderedList")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} className="p-2 hover:bg-zinc-200 rounded text-zinc-600 transition-colors" title="Quote"><Quote size={16} /></button>
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
      `}} />
    </div>
  );
}
