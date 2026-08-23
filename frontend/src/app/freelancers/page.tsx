"use client";

import { useState, useEffect, Suspense } from "react";
import { Loader2, Mail, CheckCircle2, Award } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function FreelancersContent() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await fetch("/api/freelancers");
        if (res.ok) {
          const data = await res.json();
          setFreelancers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch freelancers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6 shadow-sm">
            <Award size={14} className="text-amber-400" />
            Official Freelancers
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black tracking-tighter mb-6 text-zinc-900 leading-tight">
            Hire Our Elite <br/><span className="text-zinc-400 italic font-serif font-light">Founding Writers</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 font-medium leading-relaxed">
            Partner with the trusted, verified writers who helped build Writer's Thing. 
            Available now for freelance commissions, editing, and ghostwriting.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <Loader2 className="animate-spin text-zinc-300" size={40} />
          </div>
        ) : freelancers.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-zinc-100 shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
              <Award className="text-zinc-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No Freelancers Available</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              We currently don't have any official founding writers available for freelance work. Please check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {freelancers.map((freelancer, idx) => (
              <motion.div 
                key={freelancer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                className="bg-white rounded-[24px] border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col"
              >
                {/* Profile Header */}
                <div className="p-8 pb-6 flex flex-col items-center text-center relative">
                  {/* Verified Badge */}
                  <div className="absolute top-6 right-6 text-amber-500 flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <CheckCircle2 size={12} className="fill-amber-500 text-amber-50" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Verified</span>
                  </div>

                  <div className="w-28 h-28 mb-5 rounded-full overflow-hidden border-4 border-white shadow-lg relative group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={freelancer.avatar_url} 
                      alt={freelancer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-zinc-900 mb-1">{freelancer.name}</h3>
                </div>

                {/* Bio & Skills */}
                <div className="px-8 pb-8 flex-1 flex flex-col">
                  <p className="text-sm text-zinc-600 mb-6 leading-relaxed flex-1 line-clamp-3">
                    {freelancer.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {freelancer.skills.map((skill: string) => (
                      <span key={skill} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Hire Button */}
                  <Link 
                    href={`/authors/${freelancer.id}`}
                    className="w-full py-4 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors hover:shadow-lg hover:-translate-y-0.5 transform duration-300"
                  >
                    <Mail size={16} />
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FreelancersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>}>
      <FreelancersContent />
    </Suspense>
  );
}
