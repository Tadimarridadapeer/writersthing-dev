"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface FoundingWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  founderNumber: number;
}

export default function FoundingWriterModal({ isOpen, onClose, founderNumber }: FoundingWriterModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
          >
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 mb-6 relative">
                <img 
                  src="/Badget/founding_badget.png" 
                  alt="Founding Writer Badge" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase mb-2">
                Welcome to Writer's Thing
              </h2>
              <p className="text-sm font-medium text-amber-600 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                Congratulations!
              </p>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 w-full mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 relative z-10">
                  You are Founding Writer
                </p>
                <p className="text-5xl font-mono font-black text-zinc-900 tracking-tighter relative z-10">
                  #{String(founderNumber).padStart(3, '0')}
                </p>
              </div>

              <p className="text-sm text-zinc-600 mb-8 leading-relaxed">
                Thank you for being one of the first 100 authors to join our platform. 
                Your founding status is now permanently secured and your exclusive badge 
                will be displayed across the community.
              </p>

              <button
                onClick={onClose}
                className="w-full bg-black text-white rounded-lg py-4 px-6 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Continue to Platform
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
