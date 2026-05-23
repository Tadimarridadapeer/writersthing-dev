"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { User, Shield, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-zinc-200" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Synchronizing Session...</p>
      </div>
    );
  }

  if (!user) return null; // Middleware will handle redirect

  return (
    <div className="min-h-screen bg-white pt-40 pb-40">
      <div className="unified-axis max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Authenticated Session</span>
                <div className="h-px w-8 bg-zinc-200" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest italic">Live Connection</span>
              </div>
              <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase leading-none">Security Center</h1>
            </div>
            <button 
              onClick={signOut}
              className="px-10 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              <LogOut size={14} /> Terminate Session
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Profile Card */}
            <div className="p-10 bg-zinc-50 border border-zinc-100 rounded-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Digital Identity</p>
                  <p className="font-heading font-bold text-xl uppercase tracking-tight">{user.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">User ID</span>
                  <span className="text-[10px] font-mono font-medium text-zinc-500">{user.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Last Login</span>
                  <span className="text-[10px] font-medium text-zinc-500">{new Date(user.last_sign_in_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Session State Card */}
            <div className="p-10 bg-white border border-zinc-100 rounded-sm shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-zinc-100 text-black rounded-full flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Persistence Hash</p>
                  <p className="font-heading font-bold text-xl uppercase tracking-tight">Active Session</p>
                </div>
              </div>
              <div className="bg-zinc-900 p-6 rounded-sm">
                <pre className="text-[8px] font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify({
                    access_token: session?.access_token?.slice(0, 32) + "...",
                    expires_at: session?.expires_at,
                    refresh_token: "••••••••••••••••"
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-zinc-100 flex justify-center">
            <Link 
              href="/profile"
              className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all pb-1 border-b border-transparent hover:border-black"
            >
              Enter the Unified Hub ➔
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
