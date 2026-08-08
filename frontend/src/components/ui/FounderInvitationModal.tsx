"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X, Check } from "lucide-react";
import Image from "next/image";

export default function FounderInvitationModal() {
  const [invite, setInvite] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only check once per session when component mounts and token is available
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    
    setToken(storedToken);

    const checkInvitation = async () => {
      try {
        const res = await fetch("/api/user/invitation", {
          headers: { "authorization": `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const { invite } = await res.json();
          if (invite && invite.status === 'pending') {
            setInvite(invite);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to check invitation", err);
      }
    };

    checkInvitation();
  }, []);

  const handleAction = async (action: 'accept' | 'decline') => {
    if (!invite || !token) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/user/invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action, invite_id: invite.id })
      });

      if (res.ok) {
        setIsOpen(false);
        // Dispatch an event so other components (like notifications or profile) can update
        window.dispatchEvent(new CustomEvent('founder_invite_processed', { detail: action }));
      } else {
        alert("Failed to process invitation. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden"
          >
            {/* Dark mode support logic (though using standard colors here) */}
            <div className="bg-black text-white p-8 text-center relative overflow-hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-24 -right-24 text-zinc-800 opacity-20 pointer-events-none"
              >
                <Sparkles size={200} />
              </motion.div>
              
              <h2 className="text-2xl font-heading font-black tracking-tight mb-2 relative z-10">🎉 You're Invited!</h2>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest relative z-10">
                Writersthing Founding Writer Program
              </p>
            </div>
            
            <div className="p-8 text-center bg-[#FDFDFD]">
              <p className="text-zinc-600 font-medium mb-8 leading-relaxed">
                Writersthing has invited you to become one of our exclusive Founding Writers.
              </p>
              
              <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-sm mb-8 inline-block shadow-inner w-full max-w-[200px] mx-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Reserved Number</p>
                <p className="text-4xl font-heading font-black tracking-tighter">{invite.founder_number}</p>
              </div>

              <p className="text-sm font-bold text-zinc-800 mb-6">
                Would you like to accept this invitation?
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleAction('accept')}
                  disabled={isProcessing}
                  className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Accept Invitation
                </button>
                <button 
                  onClick={() => handleAction('decline')}
                  disabled={isProcessing}
                  className="w-full py-4 bg-white text-zinc-500 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-red-500 hover:border-red-200 transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={16} /> Decline
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
