"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface AccordionItem {
  question: string;
  answer: React.ReactNode;
}

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border-b border-zinc-200">
            <button
              onClick={() => toggle(index)}
              className="w-full py-8 flex items-center justify-between text-left focus:outline-none group"
            >
              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-black pr-8">
                {item.question}
              </h3>
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:border-black group-hover:text-black transition-colors bg-white z-10">
                {isOpen ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-8 text-lg text-zinc-600 leading-relaxed max-w-3xl font-medium" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
