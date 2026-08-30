"use client";
import { useEffect, useRef, useState } from "react";
import AiDictionaryPopover from "./AiDictionaryPopover";

const COMMON_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there",
  "their", "what", "so", "up", "out", "if", "about", "who", "get",
  "which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well",
  "way", "even", "new", "want", "because", "any", "these", "give", "day",
  "most", "us", "are", "is", "was", "were", "been", "has", "had", "did",
  "does", "doing", "very", "much", "many", "such", "why", "where",
  "again", "off", "through", "before", "more", "down", "should", "always"
]);

interface DictionaryWrapperProps {
  children: React.ReactNode;
}

export default function DictionaryWrapper({ children }: DictionaryWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [definition, setDefinition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if they are clicking inside the popover itself
      const target = e.target as HTMLElement;
      if (target.closest('.dictionary-popover')) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      
      // If no text is selected, try to get the word under cursor if it was a double click
      // Alternatively, let's just rely on standard text selection for better control
      if (selectedText.length === 0) {
        // We only show popover on actual text selection or double click word selection
        return;
      }

      // Check if it's a single word
      if (selectedText.split(/\s+/).length > 1) {
        return; // Phrase selected, ignore for dictionary
      }

      // Clean the word
      const cleanWord = selectedText.toLowerCase().replace(/[^a-z-]/g, '');

      // Smart Rules: Ignore common words, numbers, short words
      if (
        cleanWord.length <= 3 || 
        COMMON_WORDS.has(cleanWord) || 
        !isNaN(Number(cleanWord))
      ) {
        return;
      }

      // Valid advanced word found. Get coordinates.
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPopoverPosition({
        x: rect.left + (rect.width / 2) + window.scrollX,
        y: rect.bottom + window.scrollY,
      });
      
      fetchDictionary(cleanWord);
    };

    // Use touchend for mobile
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('touchend', handleMouseUp as any);
    }

    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('touchend', handleMouseUp as any);
      }
    };
  }, []);

  const fetchDictionary = async (word: string) => {
    setPopoverOpen(true);
    setLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not find a definition for this word.");
      } else {
        setDefinition(data);
      }
    } catch (err) {
      setError("Failed to connect to the dictionary service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className="dictionary-wrapper-container relative">
        {children}
      </div>

      <div className="dictionary-popover relative z-50">
        <AiDictionaryPopover
          isOpen={popoverOpen}
          position={popoverPosition}
          loading={loading}
          error={error}
          definition={definition}
          onClose={() => setPopoverOpen(false)}
        />
      </div>
    </>
  );
}
