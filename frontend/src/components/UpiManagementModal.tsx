import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ShieldAlert, Lock, Mail } from "lucide-react";

type ModalMode = 'setup' | 'change';

interface Props {
  isOpen: boolean;
  mode: ModalMode;
  userEmail: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpiManagementModal({ isOpen, mode, userEmail, userId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Info/Password, 2: OTP
  const [newUpi, setNewUpi] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!newUpi.trim() || !upiRegex.test(newUpi.trim())) {
      setError("Invalid UPI ID format");
      return;
    }

    if (mode === 'change' && !password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'setup' ? "/api/upi/setup" : "/api/upi/request-change";
      const body = mode === 'setup' 
        ? { userId, email: userEmail, newUpiId: newUpi.trim() }
        : { userId, email: userEmail, password, newUpiId: newUpi.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate request");

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'setup' ? "/api/upi/verify-setup" : "/api/upi/verify-change";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail, otpCode: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl p-8 rounded-sm z-10"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
              {mode === 'setup' ? 'Setup Payout UPI' : 'Request UPI Change'}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {mode === 'setup' 
                ? 'Enter your UPI ID to receive royalty payouts. We will verify it via email.'
                : 'For security, changing your UPI requires password verification, email OTP, and a 24-hour hold.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3 rounded-sm">
              <ShieldAlert className="text-red-500 mt-0.5" size={16} />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-450 block mb-2">New UPI ID</label>
                <input 
                  type="text"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value.toLowerCase())}
                  placeholder="yourname@bank"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-black p-4 text-xs font-bold tracking-widest outline-none transition-all placeholder:text-zinc-300 text-zinc-900 rounded-sm"
                  required
                />
              </div>

              {mode === 'change' && (
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-450 block mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Verify your password"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-black p-4 pl-12 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 text-zinc-900 rounded-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 rounded-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} />
                </div>
                <p className="text-sm font-bold text-zinc-900">Enter Verification Code</p>
                <p className="text-xs text-zinc-500 mt-1">We sent a 6-digit code to {userEmail}</p>
              </div>

              <div>
                <input 
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-black p-4 text-center text-xl tracking-[1em] font-black outline-none transition-all placeholder:text-zinc-300 text-zinc-900 rounded-sm"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 rounded-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Submit'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
