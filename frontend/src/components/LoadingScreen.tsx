"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  const [text, setText] = useState("");
  const fullText = "writersthing";
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    // Total 2000ms for 12 characters -> ~150ms per char
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        // Small delay to let the user see the full word before opening
        setTimeout(() => setIsComplete(true), 300);
      }
    }, 130); 

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[1000] bg-white flex items-center justify-center overflow-hidden"
        >
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <motion.h1 
                className="text-6xl md:text-8xl font-black tracking-tighter lowercase flex items-center"
                style={{ 
                  fontFamily: "'Questrial', sans-serif",
                  letterSpacing: "-0.08em",
                  fontWeight: 900
                }}
              >
                {text}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                  className="w-2 h-16 md:h-20 bg-black ml-1 inline-block"
                />
              </motion.h1>
            </div>
            
            {/* Minimalist Bauhaus Loading Icon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 text-zinc-300"
            >
              <Loader2 className="animate-spin" size={16} />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Initializing Archive</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

