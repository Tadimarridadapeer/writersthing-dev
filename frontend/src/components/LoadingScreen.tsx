"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < 100) {
        current += Math.random() * 12 + 6; // random steps to feel like organic typing
        if (current > 100) current = 100;
        setProgress(current);
      } else {
        clearInterval(interval);
        // Small delay to let the user see the full logo before closing
        setTimeout(() => setIsComplete(true), 400);
      }
    }, 120); 

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1000] bg-white flex items-center justify-center overflow-hidden"
        >
          <div className="flex flex-col items-center gap-12">
            
            <div className="relative inline-flex items-center">
              {/* The underlying logo image */}
              <img 
                src="/logo.png" 
                alt="Writersthing Logo" 
                className="h-16 md:h-24 w-auto object-contain grayscale" 
              />
              
              {/* Cover mask that shrinks to reveal the image from left to right */}
              <div 
                className="absolute top-0 right-0 bottom-0 bg-white z-10 flex items-center"
                style={{ width: `${100 - progress}%` }}
              >
                {/* The cursor is attached to the left edge of the cover mask */}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                  className="w-1.5 md:w-2 h-12 md:h-16 bg-black -ml-1"
                />
              </div>
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

