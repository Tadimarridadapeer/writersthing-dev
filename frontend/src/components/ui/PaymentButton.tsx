"use client";

import React, { useState } from "react";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps {
  amount: number; // Amount in rupees
  userId: string;
  projectId?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  className?: string;
  buttonText?: React.ReactNode;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  userId,
  projectId,
  customerName,
  customerEmail,
  customerContact,
  onSuccess,
  onError,
  className,
  buttonText = "Pay Now",
}) => {
  const defaultClasses = "relative inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonClasses = className || defaultClasses;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsSuccess(false);

    try {
      // 1. Create order on backend
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      openRazorpayCheckout({
        orderId: orderData.order_id,
        amount: orderData.amount, // already in paise from backend
        currency: orderData.currency,
        name: "Writer's Thing",
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerContact,
        },
        onSuccess: async (response: any) => {
          // 3. Verify payment on backend
          try {
            // Get session token directly to ensure backend auth works
            const { createBrowserClient } = await import("@supabase/ssr");
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
                amount,
                projectId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            setIsSuccess(true);
            setIsLoading(false);
            if (onSuccess) onSuccess();
          } catch (err: unknown) {
            console.error("Verification error:", err);
            setErrorMsg(err instanceof Error ? err.message : "Payment verification failed");
            setIsLoading(false);
            if (onError) onError(err);
          }
        },
        onError: (err: unknown) => {
          console.error("Payment failed:", err);
          setErrorMsg((err as { description?: string })?.description || "Payment failed or cancelled");
          setIsLoading(false);
          if (onError) onError(err);
        },
        onDismiss: () => {
          setIsLoading(false);
        },
      });
    } catch (err: unknown) {
      console.error("Order creation error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsLoading(false);
      if (onError) onError(err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePayment}
        disabled={isLoading || isSuccess}
        className={buttonClasses}
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        {!isLoading && !isSuccess && buttonText}
        {!isLoading && isSuccess && "Payment Successful"}
        {isLoading && "Processing..."}
      </button>
      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
    </div>
  );
};
