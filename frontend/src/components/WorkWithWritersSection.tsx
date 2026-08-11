"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import HireWriterModal from './HireWriterModal';

export default function WorkWithWritersSection() {
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWriter, setSelectedWriter] = useState<any>(null);

  useEffect(() => {
    async function fetchWriters() {
      try {
        const res = await fetch('/api/hire/writers');
        if (res.ok) {
          const data = await res.json();
          setWriters(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch writers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWriters();
  }, []);

  if (loading) return null; // Or a loading skeleton
  if (writers.length === 0) return null; // Don't show section if no writers

  return (
    <section className="relative w-full py-32 bg-zinc-50 border-t border-black/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-outfit)' }}>
            ✨ Work With Writers
          </h2>
          <p className="mt-4 text-zinc-500 max-w-2xl mx-auto text-lg" style={{ fontFamily: 'var(--font-libre-baskerville)' }}>
            Collaborate with our elite founding and verified writers for your next big project. 
            From ghostwriting to translations, find the perfect voice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {writers.map((writer, idx) => (
            <motion.div 
              key={writer.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-zinc-200 hover:shadow-xl transition-all flex flex-col group"
            >
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src={writer.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"} 
                  alt={writer.name}
                  className="w-16 h-16 rounded-full object-cover border border-zinc-100"
                />
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight text-zinc-900">{writer.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {writer.is_founding_writer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-700 border border-amber-300 bg-amber-50 rounded">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        Founding Writer
                      </span>
                    )}
                    {writer.is_verified_writer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-700 border border-blue-300 bg-blue-50 rounded">
                        <ShieldCheck size={10} className="text-blue-500" />
                        Verified Writer
                      </span>
                    )}
                    {writer.available_for_hire && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-300 bg-emerald-50 rounded">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        Available for Hire
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-zinc-600 text-sm mb-6 line-clamp-3" style={{ fontFamily: 'var(--font-libre-baskerville)' }}>
                {writer.bio || "A passionate writer ready to bring your ideas to life."}
              </p>

              {writer.services && writer.services.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-2">Professional Services</h4>
                  <ul className="space-y-2">
                    {writer.services.slice(0, 3).map((service: any) => (
                      <li key={service.id} className="flex justify-between items-center text-sm font-medium">
                        <span className="text-zinc-700">{service.service}</span>
                        <span className="text-zinc-400 text-xs">From ₹{service.starting_price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto pt-6 flex gap-3">
                <Link 
                  href={`/authors/${writer.id}`}
                  className="flex-1 py-3 text-center border border-zinc-200 text-xs font-black uppercase tracking-widest hover:border-black transition-colors rounded-none"
                >
                  Profile
                </Link>
                <button 
                  onClick={() => setSelectedWriter(writer)}
                  className="flex-[2] py-3 text-center bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors rounded-none flex items-center justify-center gap-2"
                >
                  ✨ Hire Writer
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedWriter && (
        <HireWriterModal 
          isOpen={!!selectedWriter}
          onClose={() => setSelectedWriter(null)}
          writerId={selectedWriter.id}
          writerName={selectedWriter.name}
        />
      )}
    </section>
  );
}
