"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { ensureAuthorProfile } from "@/lib/author";
import { signInWithGoogle } from "@/lib/auth-oauth";

export default function SignupPage() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  
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
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email address");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: "Reader",
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
        
        // 3. Set local storage user for fallback
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          name: formData.name,
          email: formData.email,
          role: "Reader",
        }));

        const searchParams = new URLSearchParams(window.location.search);
        // Force onboarding for new signups
        const redirectTo = "/onboarding";
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
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-heading font-bold tracking-tight uppercase leading-[0.9] mb-4 xl:mb-6">
              Unshackle <br /> Your <br /> Narrative.
            </h1>
            <p className="text-sm xl:text-base 2xl:text-lg text-zinc-400 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-8">
              "Every great author started as a reader with a dream. Join a network where your identity as a creator is celebrated, and your work is protected as a permanent digital legacy."
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-zinc-500 rounded-full" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Publish Globally</p>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-zinc-500 rounded-full" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Retain 100% Rights</p>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-zinc-500 rounded-full" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Connect with Readers</p>
           </div>
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
            <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight uppercase mb-3">Create Account</h1>
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-white text-zinc-900 border border-zinc-200 py-4 px-6 text-xs font-black uppercase tracking-widest hover:border-black hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm mb-6 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-grow bg-zinc-100" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Or Email</span>
            <div className="h-px flex-grow bg-zinc-100" />
          </div>

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
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-10 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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


