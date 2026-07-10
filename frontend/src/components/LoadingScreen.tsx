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
            <div className="relative inline-block">
              {/* Invisible placeholder to reserve the layout space and prevent shifting */}
              <div className="text-4xl md:text-6xl font-[family-name:var(--font-bodoni-moda)] tracking-tight text-black invisible select-none pb-4">
                Writer's Thing
              </div>
              
              {/* Visible animated container */}
              <div 
                className="absolute top-0 left-0 bottom-0 overflow-hidden whitespace-nowrap border-r-2 md:border-r-[3px] border-black text-4xl md:text-6xl font-[family-name:var(--font-bodoni-moda)] tracking-tight text-black pb-4"
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-0 left-0 bottom-0 overflow-hidden whitespace-nowrap text-4xl md:text-6xl font-[family-name:var(--font-bodoni-moda)] tracking-tight text-black pb-4"
                style={{ width: `${progress}%` }}
              >
                Writer's Thing
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

