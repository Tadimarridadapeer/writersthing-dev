"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, ArrowRight, Loader2, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getApiUrl } from "@/lib/config";
import { supabase } from "@/lib/supabase";

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const bookId = searchParams.get("id");

  const manuscript = {
    id: "the-art-of-prompt",
    title: "THE ART OF PROMPT",
    price: 99,
  };

  const initializePayment = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(getApiUrl("/api/pay/order"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`
        },
        body: JSON.stringify({ bookId, amount: manuscript.price }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: data.amount,
        currency: data.currency,
        name: "Writersthing",
        description: manuscript.title,
        order_id: data.id || data.orderId, // Handle both standard Express backend and next route response formats
        handler: async function (response: any) {
          // Verify payment on backend
          const verifyRes = await fetch(getApiUrl("/api/pay/verify"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.id || data.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            router.push("/dashboard?status=success");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="pt-12 pb-20">
        <div className="unified-axis max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-zinc-100 p-12 shadow-2xl rounded-sm"
          >
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-8">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-heading font-black uppercase tracking-tight mb-4">Secure Checkout</h1>
              <p className="text-zinc-500 font-medium">Finalize your purchase to unlock the manuscript.</p>
            </div>

            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center py-6 border-b border-zinc-50">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Item</span>
                <span className="text-sm font-bold uppercase">{manuscript.title}</span>
              </div>
              <div className="flex justify-between items-center py-6 border-b border-zinc-50">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Type</span>
                <span className="text-sm font-bold uppercase text-zinc-500">Digital E-Book</span>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Total</span>
                <span className="text-3xl font-heading font-black tracking-tighter">₹{manuscript.price}</span>
              </div>
            </div>

            <button
              onClick={initializePayment}
              disabled={loading}
              className="w-full bg-black text-white py-6 font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-4"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Proceed to Payment <CreditCard size={18} />
                </>
              )}
            </button>

            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Zap size={16} className="text-zinc-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Instant Access</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={16} className="text-zinc-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Secure Payment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-zinc-200" size={48} /></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
