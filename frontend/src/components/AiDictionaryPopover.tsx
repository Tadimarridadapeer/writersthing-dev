import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Sparkles, Loader2, Book } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Definition {
  word: string;
  partOfSpeech: string;
  definition: string;
  contextDefinition?: string | null;
  synonyms?: string[];
  example?: string | null;
  phonetic?: string;
  source?: string;
}

interface PopoverProps {
  isOpen: boolean;
  position: { x: number; y: number };
  loading: boolean;
  error: string | null;
  definition: Definition | null;
  onClose: () => void;
}

export default function AiDictionaryPopover({ isOpen, position, loading, error, definition, onClose }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to prevent immediate close on the same click that opened it
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 50);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine popover position to prevent off-screen rendering
  let top = position.y + 20; // Default below the word
  let left = position.x;

  if (typeof window !== 'undefined') {
    const popoverWidth = 320;
    const popoverHeight = 350; // Max estimated height
    
    // Adjust horizontal
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 20;
    }
    if (left < 20) left = 20;

    // Adjust vertical
    if (top + popoverHeight > window.innerHeight + window.scrollY) {
      top = position.y - popoverHeight - 20;
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute z-50 w-[320px] bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden flex flex-col font-outfit"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black text-white p-4 flex justify-between items-start">
          <div>
            <h4 className="text-xl font-heading font-black tracking-tight flex items-center gap-2">
              {definition?.word || "Dictionary"}
              {definition?.source && definition.source !== "FreeDictionaryAPI" && (
                <Sparkles size={14} className="text-amber-400" />
              )}
            </h4>
            {definition?.phonetic && (
              <p className="text-zinc-400 text-xs font-serif italic flex items-center gap-1 mt-1">
                {definition.phonetic}
                <button 
                  className="hover:text-white transition-colors cursor-not-allowed opacity-50"
                  title="Pronunciation audio not available in basic provider"
                >
                  <Volume2 size={12} />
                </button>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[350px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-4">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Consulting Lexicon...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-zinc-500 text-sm italic border border-dashed border-zinc-200 bg-zinc-50 rounded-sm">
              {error}
            </div>
          ) : definition ? (
            <div className="space-y-5 text-sm text-zinc-800">
              
              <div>
                <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded-sm mb-2">
                  {definition.partOfSpeech || "Unknown"}
                </span>
                <p className="font-serif leading-relaxed text-zinc-900">
                  {definition.definition}
                </p>
              </div>

              {definition.contextDefinition && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-sm">
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={10} /> Contextual Meaning
                  </h5>
                  <p className="font-serif text-amber-900 text-sm leading-relaxed">
                    {definition.contextDefinition}
                  </p>
                </div>
              )}

              {definition.example && (
                <div>
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Example</h5>
                  <p className="font-serif italic text-zinc-600 pl-3 border-l-2 border-zinc-200">
                    "{definition.example}"
                  </p>
                </div>
              )}

              {definition.synonyms && definition.synonyms.length > 0 && (
                <div>
                  <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Synonyms</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {definition.synonyms.map((syn, idx) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-50 border border-zinc-100 text-zinc-600 text-[10px] font-medium rounded-sm">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-2 flex items-center gap-1.5">
          <Book size={10} className="text-zinc-400" />
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
             {definition?.source === "FreeDictionaryAPI" ? "Standard Dictionary" : (definition?.source || "AI Dictionary")}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
