"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Supabase Auth Login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Fetch User Profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        // 3. Persist Session Info
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata.name || "User",
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Give the browser a moment to flush cookies before redirecting
        await new Promise(r => setTimeout(r, 500));

        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirect") || "/profile";
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side: Brand Story / Hook */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-1/2 bg-black text-white p-24 flex-col justify-between relative overflow-hidden"
      >
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-24">
            <h2 className="text-sm font-black uppercase tracking-[0.5em] text-zinc-500">Writersthing</h2>
          </Link>
          
          <div className="max-w-xl">
            <h1 className="text-8xl font-heading font-black tracking-ultra-tight uppercase leading-[0.85] mb-12">
              Where Stories <br /> Find Their <br /> Legacy.
            </h1>
            <p className="text-xl text-zinc-400 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-8">
              "We believe that every manuscript deserves a stage. Writersthing isn't just a marketplace; it's a sanctuary for the written word, connecting unknown voices with global readers."
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-12 items-end">
          <div>
            <p className="text-4xl font-heading font-black">4.5K+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Authors</p>
          </div>
          <div>
            <p className="text-4xl font-heading font-black">120K</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Monthly Readers</p>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-zinc-900 rounded-full blur-[120px] opacity-50" />
      </motion.div>

      {/* Right Side: Login Form */}
      <main className="flex-grow flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[#FDFDFD]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <header className="mb-12">
            <div className="lg:hidden mb-8">
               <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Writersthing</h2>
            </div>
            <h1 className="text-5xl font-heading font-black tracking-ultra-tight uppercase mb-4">Welcome Back</h1>
            <p className="text-zinc-500 font-medium italic">Enter your credentials to access your sanctuary.</p>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Digital Identity</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-4 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-lg placeholder:text-zinc-200"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Secret Key</label>
                <Link href="/forgot" className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-black transition-colors">Recover</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-4 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-lg placeholder:text-zinc-200"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Repository"}
              <ArrowRight size={16} />
            </button>
          </form>

          <footer className="mt-16 pt-12 border-t border-zinc-50 flex flex-col items-center gap-6">
            <p className="text-zinc-400 text-sm font-medium italic">
              New to the platform?
            </p>
            <Link 
              href="/signup" 
              className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-black"
            >
              Request Access / Create Account
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <ArrowRight size={14} />
              </div>
            </Link>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
