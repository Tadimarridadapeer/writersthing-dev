"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
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
        
        if (dbError) console.error("DB Sync error:", dbError.message);
        
        // 3. Set local storage user for fallback
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          name: formData.name,
          email: formData.email,
        }));

        router.push("/profile");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side: Community Hook */}
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
              Unshackle <br /> Your <br /> Narrative.
            </h1>
            <p className="text-xl text-zinc-400 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-8">
              "Every great author started as a reader with a dream. Join a network where your identity as a creator is celebrated, and your work is protected as a permanent digital legacy."
            </p>
          </div>
        </div>

        <div className="relative z-10">
           <div className="flex -space-x-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-zinc-800 overflow-hidden grayscale">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-black bg-zinc-900 flex items-center justify-center text-[10px] font-black">
                +12K
              </div>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Joined by creators worldwide</p>
        </div>

        {/* Decorative background element */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-zinc-900 rounded-full blur-[120px] opacity-30" />
      </motion.div>

      {/* Right Side: Signup Form */}
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
            <h1 className="text-5xl font-heading font-black tracking-ultra-tight uppercase mb-4">Create Account</h1>
            <p className="text-zinc-500 font-medium italic">Begin your journey into the global repository.</p>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Legal Name</label>
              <div className="relative group">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-4 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-lg placeholder:text-zinc-200"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent border-b border-zinc-100 py-4 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-lg placeholder:text-zinc-200"
                  placeholder="Create password"
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
              {loading ? "Initializing..." : "Create Repository"}
              <ArrowRight size={16} />
            </button>
          </form>

          <footer className="mt-16 pt-12 border-t border-zinc-50 flex flex-col items-center gap-6">
            <p className="text-zinc-400 text-sm font-medium italic">
              Already part of the network?
            </p>
            <Link 
              href="/login" 
              className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-black"
            >
              Sign In to your Account
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


