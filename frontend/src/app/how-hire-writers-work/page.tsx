"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Mail, 
  MessageCircle,
  Briefcase
} from "lucide-react";

export default function HowHireWritersWorkPage() {
  return (
    <div className="bg-zinc-50/30 min-h-screen font-outfit text-zinc-900 pb-20">
      <div className="unified-axis max-w-5xl pt-10">
        
        {/* Breadcrumb Header */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-black transition-all group mb-12"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 md:p-12 shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50/50 -z-10 rounded-bl-full" />
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-tight text-zinc-900 mb-4">
              How Hiring Writers Works
            </h1>
            <p className="text-lg text-zinc-500 font-serif leading-relaxed">
              Writersthing connects you directly with top-tier storytellers, copywriters, and content creators. 
              Our streamlined process ensures you find the perfect voice for your project securely and efficiently.
            </p>
          </div>
        </div>

        {/* Step-by-Step Flow */}
        <div className="mb-16">
          <h2 className="text-xl font-heading font-black uppercase tracking-tight text-zinc-900 mb-8 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-500" /> The Hiring Process
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-100 p-8 rounded-2xl relative shadow-sm hover:border-black transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-black text-white flex items-center justify-center rounded-full font-bold">1</div>
              <MessageCircle size={32} className="text-zinc-300 mb-6" />
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Submit a Request</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Found a writer you like? Click "Hire Writer" and submit your project details, including category, summary, and budget. Your contact info stays private initially.
              </p>
            </div>

            <div className="bg-white border border-zinc-100 p-8 rounded-2xl relative shadow-sm hover:border-black transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-black text-white flex items-center justify-center rounded-full font-bold">2</div>
              <Mail size={32} className="text-zinc-300 mb-6" />
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Writer Review</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The writer receives a professional email outlining your project. They can review your requirements and decide if it's a good fit for their schedule.
              </p>
            </div>

            <div className="bg-white border border-zinc-100 p-8 rounded-2xl relative shadow-sm hover:border-black transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-black text-white flex items-center justify-center rounded-full font-bold">3</div>
              <Sparkles size={32} className="text-zinc-300 mb-6" />
              <h3 className="text-lg font-bold text-zinc-900 mb-3">Connect & Collaborate</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Once the writer accepts, both parties instantly receive each other's contact details via email to discuss the project further and begin collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility Section */}
        <div className="bg-zinc-900 text-white rounded-3xl p-8 md:p-12 shadow-xl mb-12">
          <h2 className="text-2xl md:text-3xl font-heading font-black uppercase tracking-tight mb-8">
            Who Can You Hire?
          </h2>
          <p className="text-zinc-400 font-serif leading-relaxed max-w-3xl mb-12">
            To maintain high quality, we only allow eligible writers to accept freelance requests. 
            A writer becomes eligible if they meet <strong className="text-white">any</strong> of the following criteria:
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Automatic Eligibility */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Automatic Eligibility</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Star className="text-amber-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-white">Founding Writers</h4>
                    <p className="text-sm text-zinc-400 mt-1">Our earliest, hand-picked members.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-white">Verified Writers</h4>
                    <p className="text-sm text-zinc-400 mt-1">Authors whose identity and portfolio have been vetted.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-white">Available for Hire</h4>
                    <p className="text-sm text-zinc-400 mt-1">Writers who explicitly toggle on their professional services.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Performance Based */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Performance Based</h3>
              <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-indigo-400" size={20} />
                  <h4 className="font-bold text-white">High Achieving Authors</h4>
                </div>
                <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                  Writers who consistently deliver great content automatically unlock the ability to be hired.
                </p>
                <ul className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-zinc-300">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Rating ≥ 4.5</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Followers ≥ 100</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Works ≥ 5</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Reads ≥ 5,000</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-6">Ready to find your writer?</h2>
          <Link 
            href="/#hire-writers" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-zinc-800 hover:scale-105 transition-all shadow-lg"
          >
            <Sparkles size={18} />
            Explore Available Writers
          </Link>
        </div>

      </div>
    </div>
  );
}
