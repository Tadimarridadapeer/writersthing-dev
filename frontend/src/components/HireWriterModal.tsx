import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2 } from 'lucide-react';

interface HireWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  writerId: string;
  writerName: string;
}

export default function HireWriterModal({ isOpen, onClose, writerId, writerName }: HireWriterModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    projectCategory: '',
    budgetMin: '',
    budgetMax: '',
    expectedDeadline: '',
    projectSummary: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writer_id: writerId,
          full_name: formData.fullName,
          email_address: formData.emailAddress,
          phone_number: formData.phoneNumber,
          project_category: formData.projectCategory,
          budget_min: formData.budgetMin,
          budget_max: formData.budgetMax,
          expected_deadline: formData.expectedDeadline,
          project_summary: formData.projectSummary
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-100">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900" style={{ fontFamily: 'var(--font-outfit)' }}>Work with {writerName}</h2>
              <p className="text-zinc-500 text-sm mt-1">Submit a project request to collaborate.</p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-grow">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle size={64} className="text-green-500 mb-6" />
                <h3 className="text-2xl font-black tracking-tight text-zinc-900 mb-2">Request Sent</h3>
                <p className="text-zinc-500 max-w-md">Your request has been shared with {writerName}. They will review the details and contact you directly through email.</p>
                <button
                  onClick={onClose}
                  className="mt-8 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="emailAddress"
                      required
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Project Category *</label>
                    <select
                      name="projectCategory"
                      required
                      value={formData.projectCategory}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                    >
                      <option value="">Select a category</option>
                      <option value="Ghost Writing">Ghost Writing</option>
                      <option value="Editing">Editing</option>
                      <option value="Copywriting">Copywriting</option>
                      <option value="Translation">Translation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Min Budget (₹)</label>
                    <input
                      type="number"
                      name="budgetMin"
                      value={formData.budgetMin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Max Budget (₹)</label>
                    <input
                      type="number"
                      name="budgetMax"
                      value={formData.budgetMax}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Expected Deadline</label>
                    <input
                      type="text"
                      name="expectedDeadline"
                      value={formData.expectedDeadline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all"
                      placeholder="2 Weeks / Sep 15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Project Summary *</label>
                  <textarea
                    name="projectSummary"
                    required
                    value={formData.projectSummary}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-0 outline-none transition-all resize-none"
                    placeholder="Briefly describe your project, goals, and requirements..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
