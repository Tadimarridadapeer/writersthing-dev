"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CareersPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/careers", {
        method: "POST",
        body: formData // sending as multipart/form-data
      });
      
      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Breadcrumbs />
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Help shape the future of <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>storytelling.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-libre-baskerville)' }}
        >
          We&apos;re looking for passionate writers who believe stories can inspire, educate, and entertain readers around the world.
        </motion.p>
      </section>

      {/* Job Listing */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-zinc-100">
        <div className="grid lg:grid-cols-12 gap-16">
          
          {/* Job Details */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                Creative Writer
              </h2>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span className="px-3 py-1 bg-zinc-50 rounded-sm">Remote</span>
                <span className="px-3 py-1 bg-zinc-50 rounded-sm">Open to Freshers</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Category</h3>
              <ul className="flex flex-wrap gap-2">
                {["Writing", "Storytelling", "Articles", "Blogs", "Books"].map((cat) => (
                  <li key={cat} className="px-4 py-2 border border-zinc-200 rounded-full text-sm font-medium text-zinc-600">{cat}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Responsibilities</h3>
              <ul className="space-y-3 text-zinc-600">
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Write original stories</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Write blogs and articles</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Collaborate with editors</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Publish content on Writer&apos;s Thing</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Participate in community events</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Maintain writing quality</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Requirements</h3>
              <ul className="space-y-3 text-zinc-600">
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Excellent writing skills</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Creativity</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Storytelling ability</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Passion for books</li>
                <li className="flex items-start gap-3"><ChevronRight size={16} className="mt-1 flex-shrink-0" /> Basic communication skills</li>
              </ul>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-8 md:p-12 relative overflow-hidden">
              
              {status === "idle" || status === "loading" || status === "error" ? (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-8" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Submit Application
                  </h3>
                  
                  {status === "error" && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-md flex items-center gap-3 text-sm font-medium mb-6">
                      <AlertCircle size={16} />
                      Something went wrong. Please try again later or contact us at thewritersthing@gmail.com
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                      <input name="name" required type="text" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                      <input name="email" required type="email" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mobile Number</label>
                      <input name="mobile" required type="tel" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current City</label>
                      <input name="city" required type="text" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Portfolio Website (Optional)</label>
                    <input name="portfolio" type="url" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Google Drive / Writing Samples Link</label>
                    <input name="driveLink" required type="url" className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resume Upload</label>
                    <div className="w-full bg-white border border-zinc-200 border-dashed p-6 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors group relative overflow-hidden">
                      <UploadCloud size={24} className="text-zinc-400 group-hover:text-black mb-2 transition-colors relative z-0" />
                      <span className="text-sm font-medium text-zinc-600 group-hover:text-black relative z-0">Click to upload PDF</span>
                      <input name="resume" required type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tell us about yourself</label>
                    <textarea name="about" required rows={4} className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Why do you want to join Writer&apos;s Thing?</label>
                    <textarea name="why" required rows={4} className="w-full bg-white border border-zinc-200 p-4 rounded-md focus-visible:ring-2 focus-visible:ring-black outline-none transition-colors resize-none" />
                  </div>

                  <button 
                    type="submit" 
                    disabled={status === "loading"}
                    className="w-full py-5 bg-black text-white font-bold tracking-widest uppercase text-sm rounded-md hover:bg-zinc-800 transition-colors mt-8 flex items-center justify-center disabled:opacity-70"
                  >
                    {status === "loading" ? <Loader2 size={20} className="animate-spin" /> : "Submit Application"}
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-20 relative z-10"
                >
                  <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white mb-8">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                    Application Submitted Successfully.
                  </h3>
                  <div className="space-y-2 text-zinc-600 font-medium">
                    <p>Thank you for applying.</p>
                    <p>Our editorial team will carefully review your application.</p>
                    <p>If your profile matches our requirements, we&apos;ll contact you soon.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </section>
      
    </div>
  );
}
