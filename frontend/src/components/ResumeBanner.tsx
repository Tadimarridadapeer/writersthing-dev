import { useState, useEffect } from 'react';
import { PlayCircle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeBannerProps {
  initialData: any;
  onResume: () => void;
}

export function ResumeBanner({ initialData, onResume }: ResumeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if there's meaningful progress to resume
    if (initialData && initialData.progress_percentage > 0) {
      // Don't show if they are already at 0 scroll and progress is small?
      // Actually always show it if they have progress.
      // Small timeout to let initial page render finish.
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, [initialData]);

  if (!visible || !initialData) return null;

  const isCompleted = initialData.completed || initialData.progress_percentage >= 95;
  const timeRemainingText = isCompleted ? "Completed" : `Est. remaining`;
  const lastReadDate = new Date(initialData.updated_at || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] bg-zinc-950 text-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 font-sans border border-zinc-800"
        >
          <div className="flex justify-between items-center text-xs font-mono tracking-wider text-zinc-400">
            <span>Last Read: {lastReadDate}</span>
            <span>{initialData.progress_percentage}% {isCompleted ? 'Done' : ''}</span>
          </div>
          
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${initialData.progress_percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              {isCompleted ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} />}
              <span>{timeRemainingText}</span>
            </div>
            
            <button
              onClick={() => {
                onResume();
                setVisible(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors"
            >
              {isCompleted ? (
                <><RefreshCw size={14} /> Restart</>
              ) : (
                <><PlayCircle size={14} /> Resume</>
              )}
            </button>
          </div>
          
          <button 
            onClick={() => setVisible(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-700"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
