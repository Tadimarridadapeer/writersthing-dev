"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset link.");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFDFD]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-8 sm:p-10 border border-zinc-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Send className="text-blue-500" size={28} />
          </div>
          
          <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight uppercase mb-4">Check Your Email</h1>
          <p className="text-zinc-500 text-sm font-medium italic leading-relaxed mb-8">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </p>
          
          <Link
            href="/login"
            className="w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-md inline-block mb-4"
          >
            Back to Login
          </Link>

          <button
            type="button"
            className="w-full bg-transparent text-zinc-500 border border-zinc-200 text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-50 transition-all cursor-not-allowed opacity-50"
            disabled
          >
            Resend Email
          </button>

          <p className="text-zinc-400 text-xs mt-6 font-medium">
            Didn't receive the email? Check your spam or junk folder.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFDFD]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 sm:p-10 border border-zinc-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center"
      >
        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8 w-full">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight uppercase mb-4">Forgot your password?</h1>
          <p className="text-zinc-500 text-sm font-medium italic leading-relaxed">
            Enter your registered email address. We'll send you a secure password reset link.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-4 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Sending...
               </>
            ) : "Send Reset Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
