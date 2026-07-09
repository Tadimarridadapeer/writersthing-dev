"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password rules
  const rules = [
    { id: "length", text: "At least 8 characters", check: (p: string) => p.length >= 8 },
    { id: "uppercase", text: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
    { id: "lowercase", text: "One lowercase letter", check: (p: string) => /[a-z]/.test(p) },
    { id: "number", text: "One number", check: (p: string) => /[0-9]/.test(p) },
    { id: "special", text: "One special character", check: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const allRulesPassed = rules.every((r) => r.check(password)) && password === confirmPassword && password !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allRulesPassed) {
      setError("Please ensure your password meets all requirements and matches.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // MOCK API CALL for UI testing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate success
      setSuccess(true);
    } catch (err: any) {
      // Mock Error Handling UI Placeholders:
      // if (err.message === "Expired") setError("Reset link has expired. Please request a new one.");
      // if (err.message === "Invalid") setError("Invalid reset link.");
      // if (err.message === "Weak password") setError("Password is too weak.");
      setError("Network error. Please try again later.");
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
          className="w-full max-w-md bg-white p-8 sm:p-10 border border-zinc-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
          <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight uppercase mb-4">Password Updated Successfully</h1>
          <p className="text-zinc-500 text-sm font-medium italic leading-relaxed mb-10">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-md inline-block"
          >
            Go to Login
          </Link>
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
        <header className="mb-8">
          <h1 className="text-3xl xl:text-4xl font-heading font-bold tracking-tight uppercase mb-4">Create New Password</h1>
          <p className="text-zinc-500 text-sm font-medium italic leading-relaxed">
            Please enter your new password below.
          </p>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-500 text-left"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-10 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 focus:outline-none flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full bg-transparent border-b border-zinc-100 py-3 pl-8 pr-10 outline-none focus:border-black transition-all font-medium text-base placeholder:text-zinc-200"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 focus:outline-none flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Password Requirements</h3>
            {rules.map((rule) => {
              const passed = rule.check(password);
              return (
                <div key={rule.id} className="flex items-center gap-3">
                  {passed ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <XCircle size={14} className="text-zinc-300" />
                  )}
                  <span className={`text-xs font-medium ${passed ? "text-green-600" : "text-zinc-500"}`}>
                    {rule.text}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-3 pt-2">
               {password && password === confirmPassword ? (
                  <CheckCircle2 size={14} className="text-green-500" />
               ) : (
                  <XCircle size={14} className="text-zinc-300" />
               )}
               <span className={`text-xs font-medium ${password && password === confirmPassword ? "text-green-600" : "text-zinc-500"}`}>
                 Passwords match
               </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !allRulesPassed}
              className="w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Updating...
                 </>
              ) : "Update Password"}
            </button>
            <Link
              href="/login"
              className="w-full bg-transparent text-zinc-500 border border-zinc-200 text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-50 transition-all text-center block"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
