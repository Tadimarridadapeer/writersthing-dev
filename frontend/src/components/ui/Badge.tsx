"use client";

import { motion } from "framer-motion";

interface BadgeProps {
  type: 'founding_writer' | string;
  number?: number;
  className?: string;
}

export default function Badge({ type, number, className = "" }: BadgeProps) {
  if (type !== 'founding_writer') return null; // Fallback for future badges

  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      {/* Monochrome Metallic Badge Design */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center justify-center bg-gradient-to-br from-zinc-800 via-black to-zinc-900 border border-zinc-700/50 shadow-md text-white rounded-full px-3 py-1 gap-2 cursor-default overflow-hidden relative"
      >
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        
        <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-90">Founding Writer</span>
        
        {number && (
          <div className="flex items-center justify-center bg-white/10 rounded-full px-2 py-0.5 ml-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-300">
              #{number.toString().padStart(3, '0')}
            </span>
          </div>
        )}
      </motion.div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none">
        <div className="bg-black text-white text-[10px] font-medium tracking-wide py-2 px-3 rounded-md shadow-xl text-center">
          Founding Writer • One of the First 100 Members of Writer's Thing
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      </div>
    </div>
  );
}
