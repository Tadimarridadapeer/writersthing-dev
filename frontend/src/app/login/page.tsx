"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { ensureAuthorProfile } from "@/lib/author";

export default function LoginPage() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRedirectUrl(searchParams.get("redirect") || "");
  }, []);

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

        try {
          await ensureAuthorProfile(supabase, data.user.id);
        } catch (authorError) {
          console.error("Failed to ensure author profile on login:", authorError);
        }

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
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side: Brand Story / Hook */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-1/2 bg-black text-white p-10 xl:p-16 2xl:p-20 flex-col justify-between relative overflow-hidden"
      >
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-8 xl:mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.5em] text-zinc-500">Writersthing</h2>
          </Link>
          
          <div className="max-w-xl">
            <h1 className="text-5xl xl:text-7xl 2xl:text-8xl font-heading font-black tracking-ultra-tight uppercase leading-[0.85] mb-6 xl:mb-8">
              Where Stories <br /> Find Their <br /> Legacy.
            </h1>
            <p className="text-sm xl:text-base 2xl:text-lg text-zinc-400 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-8">
              "We believe that every manuscript deserves a stage. Writersthing isn't just a marketplace; it's a sanctuary for the written word, connecting unknown voices with global readers."
            </p>
          </div>
        </div>


        <div className="relative z-10">
           <div className="flex -space-x-4 mb-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-black bg-zinc-800 overflow-hidden grayscale">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-4 border-black bg-zinc-900 flex items-center justify-center text-[8px] font-black">
                +12K
              </div>
           </div>
           <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Joined by creators worldwide</p>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-zinc-900 rounded-full blur-[120px] opacity-50" />
      </motion.div>

      {/* Right Side: Login Form */}
      <main className="flex-grow flex items-center justify-center p-6 lg:p-12 xl:p-16 bg-[#FDFDFD] lg:h-screen lg:overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md my-auto flex flex-col justify-center"
        >
          <header className="mb-8">
            <div className="lg:hidden mb-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Writersthing</h2>
            </div>
            <h1 className="text-4xl xl:text-5xl font-heading font-black tracking-ultra-tight uppercase mb-3">Welcome Back</h1>
            <p className="text-zinc-500 text-sm font-medium italic">Enter your email and password to access your account.</p>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Password</label>
                <Link href="/forgot" className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-black transition-colors">Recover</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-zinc-50 flex flex-col items-center gap-4 w-full">
            <p className="text-zinc-400 text-xs font-medium italic mb-2">
              New to Writersthing?
            </p>
            <Link 
              href={redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup"} 
              className="w-full py-4 bg-zinc-50 hover:bg-black border border-zinc-100 hover:border-black text-black hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group relative overflow-hidden rounded-sm shadow-sm"
            >
              <span>Create an Account</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
