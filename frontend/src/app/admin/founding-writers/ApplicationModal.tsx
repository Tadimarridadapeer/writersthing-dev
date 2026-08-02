"use client";

import { motion } from "framer-motion";
import { X, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

export default function ApplicationModal({ app, onClose, onApprove, onReject }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div>
            <h2 className="text-2xl font-heading font-black">{app.full_name}</h2>
            <p className="text-zinc-500 text-sm">{app.email} • {app.city}, {app.country}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-grow space-y-8 bg-white">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoBlock label="Writer Type" value={app.writer_type} />
            <InfoBlock label="Experience" value={app.experience} />
            <InfoBlock label="Genres" value={app.genres?.join(", ") || "None specified"} />
            <InfoBlock label="Published Before?" value={app.published_before ? "Yes" : "No"} />
          </div>

          <div className="space-y-6 pt-6 border-t border-zinc-100">
            <LongTextBlock label="About" value={app.about} />
            <LongTextBlock label="Portfolio Link" value={app.portfolio_link} isLink />
            <LongTextBlock label="Why Founding Writer?" value={app.reason} />
            <LongTextBlock label="Expectations" value={app.expectations} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-100">
            <CheckboxBlock label="Provide Feedback" checked={app.provide_feedback} />
            <CheckboxBlock label="Join Community" checked={app.join_community} />
            <InfoBlock label="Source" value={app.source} />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div className="text-xs text-zinc-400">
            Submitted: {new Date(app.created_at).toLocaleString()}
          </div>
          <div className="flex gap-3">
            <button 
              className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <MessageSquare size={16} /> Request Info
            </button>
            
            {app.status === 'Pending' && (
              <>
                <button 
                  onClick={() => onReject(app.id)}
                  className="px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button 
                  onClick={() => onApprove(app.id)}
                  className="px-6 py-3 bg-black text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
              </>
            )}
            
            {app.status !== 'Pending' && (
              <div className="px-6 py-3 bg-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                Already {app.status}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="font-medium text-zinc-900">{value || "—"}</p>
    </div>
  );
}

function LongTextBlock({ label, value, isLink = false }: { label: string, value: string, isLink?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
          {value || "—"}
        </a>
      ) : (
        <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{value || "—"}</p>
      )}
    </div>
  );
}

function CheckboxBlock({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? <CheckCircle2 className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
