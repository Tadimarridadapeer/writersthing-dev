"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error("Failed to send");
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="mb-12">
          <Breadcrumbs />
          <div className="mt-6">
            <BackButton />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Column */}
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Get In <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>Touch.</span>
            </motion.h1>
            
            <p className="text-lg text-zinc-600 mb-12 max-w-md leading-relaxed" style={{ fontFamily: 'var(--font-libre-baskerville)' }}>
              Whether you have a question about publishing, need help with your account, or just want to say hello—we're here for you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-black flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Email</h3>
                  <a href="mailto:thewritersthing@gmail.com" className="text-zinc-600 hover:text-black transition-colors underline-offset-4 hover:underline">
                    thewritersthing@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-black flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Office</h3>
                  <p className="text-zinc-600">
                    Writer's Thing HQ<br />
                    Bangalore, Karnataka, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-8 md:p-12 relative overflow-hidden h-full">
              {status === "idle" || status === "loading" || status === "error" ? (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10 flex flex-col h-full justify-center">
                  
                  {status === "error" && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-md flex items-center gap-3 text-sm font-medium">
                      <AlertCircle size={16} />
                      Something went wrong. Please try again later or contact us directly at thewritersthing@gmail.com
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Name</label>
                    <input name="name" required type="text" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-all" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                    <input name="email" required type="email" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Message</label>
                    <textarea name="message" required rows={5} className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-all resize-none" />
                  </div>

                  <button 
                    type="submit" 
                    disabled={status === "loading"}
                    className="w-full py-5 bg-black text-white font-bold tracking-widest uppercase text-sm rounded-md hover:bg-zinc-800 transition-colors mt-4 flex items-center justify-center disabled:opacity-70"
                  >
                    {status === "loading" ? <Loader2 size={20} className="animate-spin" /> : "Send Message"}
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center h-full relative z-10 py-12"
                >
                  <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white mb-8">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Message Sent.
                  </h3>
                  <div className="space-y-2 text-zinc-600 font-medium">
                    <p>Thank you for reaching out.</p>
                    <p>Our team will get back to you shortly.</p>
                  </div>
                  <button 
                    onClick={() => setStatus("idle")}
                    className="mt-12 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
