"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TranslationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  originalLanguage: string;
}

export default function TranslationDrawer({ isOpen, onClose, contentId, originalLanguage }: TranslationDrawerProps) {
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTranslations = async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("content_id", contentId);
      
      if (!error && data) {
        setTranslations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTranslations();
    }
  }, [isOpen, contentId]);

  const targetLangs = ['hi', 'es', 'fr', 'de']; // Example core languages that are processed by default

  const available = translations.filter(t => t.status === 'completed');
  const failed = translations.filter(t => t.status === 'error');
  // For processing, we simulate it if it's missing from the DB but in our target list
  const processing = targetLangs.filter(lang => !translations.find(t => t.language_code === lang) && lang !== originalLanguage);
  
  const totalLangs = targetLangs.length;
  const progressPercent = Math.round((available.length / totalLangs) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[201] border-l border-zinc-200 flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-heading font-black uppercase tracking-tight text-zinc-900">Translation Status</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Borderless Reading Engine</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-sm text-zinc-400 hover:text-black transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Overall Progress</span>
                  <span className="text-sm font-bold text-black">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 text-right">
                  Estimated time remaining: ~2 mins
                </p>
              </div>

              {/* Lists */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                    <CheckCircle size={12} className="text-black" /> Available ({available.length})
                  </h4>
                  <div className="space-y-2">
                    {available.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-zinc-50 border border-zinc-100 rounded-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">{t.language_code}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1">Ready</span>
                      </div>
                    ))}
                    {available.length === 0 && <p className="text-[10px] text-zinc-400 italic">None yet</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                    <Clock size={12} className="text-black" /> Processing ({processing.length})
                  </h4>
                  <div className="space-y-2">
                    {processing.map(lang => (
                      <div key={lang} className="flex justify-between items-center p-3 border border-zinc-100 rounded-sm border-dashed">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{lang}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 animate-pulse">Translating...</span>
                      </div>
                    ))}
                    {processing.length === 0 && <p className="text-[10px] text-zinc-400 italic">None processing</p>}
                  </div>
                </div>

                {failed.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                      <AlertCircle size={12} className="text-red-500" /> Failed ({failed.length})
                    </h4>
                    <div className="space-y-2">
                      {failed.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-sm">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-800">{t.language_code}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Failed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50">
              <button 
                onClick={fetchTranslations}
                disabled={loading}
                className="w-full py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh Status
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
