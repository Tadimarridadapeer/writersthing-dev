"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { ensureAuthorProfile } from "@/lib/author";

export default function SignupPage() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState("");
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRedirectUrl(searchParams.get("redirect") || "");
  }, []);

  const [formData, setFormData] = useState({
    name: "",
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Sync to public.users table
        const { error: dbError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            name: formData.name,
            email: formData.email,
          }
        ]);
        
        if (dbError) {
          console.error("DB Sync error:", dbError.message);
        } else {
          console.log("DB Sync success: User profile created.");
        }

        // 2b. Sync to public.authors table via helper
        try {
          await ensureAuthorProfile(supabase, data.user.id);
          console.log("Author Sync success: Author profile ensured.");
        } catch (authorError: any) {
          console.error("Author Sync error:", authorError.message);
        }
        
        // 3. Set local storage user for fallback
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          name: formData.name,
          email: formData.email,
        }));

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
      {/* Left Side: Community Hook */}
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
              Unshackle <br /> Your <br /> Narrative.
            </h1>
            <p className="text-sm xl:text-base 2xl:text-lg text-zinc-400 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-8">
              "Every great author started as a reader with a dream. Join a network where your identity as a creator is celebrated, and your work is protected as a permanent digital legacy."
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
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-zinc-900 rounded-full blur-[120px] opacity-30" />
      </motion.div>

      {/* Right Side: Signup Form */}
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
            <h1 className="text-4xl xl:text-5xl font-heading font-black tracking-ultra-tight uppercase mb-3">Create Account</h1>
            <p className="text-zinc-500 text-sm font-medium italic">Fill in your details to create your creator profile.</p>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name</label>
              <div className="relative group">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Password</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                  placeholder="Create a secure password"
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
              {loading ? "Initializing..." : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-zinc-50 flex flex-col items-center gap-4 w-full">
            <p className="text-zinc-400 text-xs font-medium italic mb-2">
              Already have an account?
            </p>
            <Link 
              href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"} 
              className="w-full py-4 bg-zinc-50 hover:bg-black border border-zinc-100 hover:border-black text-black hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group relative overflow-hidden rounded-sm shadow-sm"
            >
              <span>Sign In to your Account</span>
              <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}


