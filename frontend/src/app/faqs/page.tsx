"use client";

import { motion } from "framer-motion";
import Accordion from "@/components/Accordion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function FAQsPage() {
  const faqs = [
    {
      question: "What is Writer's Thing?",
      answer: "Writer's Thing is an independent publishing ecosystem designed to give writers absolute control over their work. It's a place to learn, connect, and ultimately publish your stories directly to readers without traditional gatekeepers."
    },
    {
      question: "Is Writer's Thing free to use?",
      answer: "Yes, joining the community, reading, and using our writing tools are entirely free. We only charge a flat publishing fee when you decide to distribute a book."
    },
    {
      question: "How do I publish my story?",
      answer: "Once you have an account, you can access the Editor from your dashboard. From there, you can either write directly in our web editor or upload a completed PDF manuscript."
    },
    {
      question: "Can I publish books, blogs, and stories?",
      answer: "Absolutely. We support long-form PDF books, serial stories, and short-form blogs. You can choose the format that best fits your narrative."
    },
    {
      question: "Who owns the copyright to my work?",
      answer: "The author always owns their work. You retain 100% of your copyright. We simply provide the platform for distribution."
    },
    {
      question: "How much does publishing cost?",
      answer: "We charge a flat ₹99 Publishing Fee per book. There are no recurring subscriptions or hidden costs."
    },
    {
      question: "Can I earn money from my books?",
      answer: "Yes. You keep a significant percentage of the royalties from every book sold on our marketplace, transferred directly to your registered bank account."
    },
    {
      question: "Can I edit my story after publishing?",
      answer: "For blogs and serialized stories, you can edit the text at any time. For PDF books, you can upload a revised manuscript which will replace the old version."
    },
    {
      question: "Will my work be reviewed before publishing?",
      answer: "We employ a light moderation system to ensure content adheres to our community guidelines (e.g., no hate speech), but we do not act as editorial gatekeepers. You have creative freedom."
    },
    {
      question: "How do I contact Writer's Thing?",
      answer: (
        <>
          You can reach our support team directly at <a href="mailto:thewritersthing@gmail.com" className="underline hover:text-black transition-colors">thewritersthing@gmail.com</a> or message us via the WhatsApp Community.
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 mb-12">
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
          Frequently Asked <span className="italic font-normal lowercase text-zinc-500" style={{ fontFamily: 'var(--font-eb-garamond)' }}>Questions.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-libre-baskerville)' }}
        >
          Everything you need to know about Writer&apos;s Thing.
        </motion.p>
      </section>

      {/* Accordion Section */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <Accordion items={faqs} />
      </section>
      
      {/* Bottom CTA */}
      <section className="py-32 px-6 text-center border-t border-zinc-100">
        <h2 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
          Didn't find your answer?
        </h2>
        <p className="text-zinc-600 mb-8 font-medium">
          Reach us anytime at <a href="mailto:thewritersthing@gmail.com" className="text-black font-bold hover:underline underline-offset-4 transition-all">thewritersthing@gmail.com</a>
        </p>
        <Link 
          href="/contact"
          className="inline-flex px-10 py-5 bg-black text-white font-bold tracking-widest uppercase text-xs rounded-md hover:bg-zinc-800 transition-colors items-center gap-3"
        >
          Contact Us <ChevronRight size={16} />
        </Link>
      </section>

    </div>
  );
}
