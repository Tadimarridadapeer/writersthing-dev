"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/Navbar";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, BookOpen } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, loading, updateQuantity, removeFromCart, clearCart, cartCount, cartSubtotal } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const shipping = 0.00;
  const tax = 0.00;
  const grandTotal = cartSubtotal + shipping + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      const storedUser = localStorage.getItem("user");
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      if (!userObj) {
        alert("Please login to checkout");
        setCheckingOut(false);
        router.push("/auth");
        return;
      }

      // 1. Create order on backend
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 2. Open Razorpay Checkout (Requires dynamic import or existing util)
      const { openRazorpayCheckout } = await import("@/lib/razorpay");

      openRazorpayCheckout({
        orderId: orderData.order_id,
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "Writer's Thing",
        description: "Cart Checkout",
        prefill: {
          name: userObj.name || "Customer",
          email: userObj.email || "",
        },
        onSuccess: async (response: any) => {
          try {
            // 3. Verify on backend
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userObj.id,
                amount: grandTotal,
                cartItems: cart.map(i => ({ id: i.book_id || i.id })) // Pass all items to unlock
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

            // 4. Success handling
            await clearCart();
            setOrderComplete(true);
          } catch (err: unknown) {
            console.error("Verification error:", err);
            alert(err instanceof Error ? err.message : "Payment verification failed");
          }
        },
        onError: (err) => {
          console.error("Razorpay Error:", err);
          alert("Payment failed or cancelled.");
        },
      });

    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to complete checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-8 pb-20">
        <div className="unified-axis">
          {/* Header */}
          <div className="flex items-center justify-between py-6 border-b border-zinc-100 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                <Link href="/marketplace" className="hover:text-black transition-colors flex items-center gap-1">
                  <ArrowLeft size={12} /> Marketplace
                </Link>
                <span>/</span>
                <span className="text-zinc-900">Cart</span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight">
                Shopping Cart ({cartCount})
              </h1>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-600 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            )}
          </div>

          {/* Order Completed Modal */}
          {orderComplete ? (
            <div className="max-w-xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-black text-white mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="font-heading font-black text-3xl uppercase tracking-tight text-zinc-900">
                Order Confirmed!
              </h2>
              <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto leading-relaxed">
                Thank you for your purchase! Your books and manuscripts have been added to your Library.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link
                  href="/profile"
                  className="px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  <BookOpen size={16} /> View My Library
                </Link>
                <Link
                  href="/marketplace"
                  className="px-8 py-3.5 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 size={32} className="animate-spin text-zinc-400 mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading your cart...</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-20 text-center space-y-6 max-w-md mx-auto border border-dashed border-zinc-200 rounded-2xl p-10">
              <div className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl uppercase tracking-tight text-zinc-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Explore books, technical guides, and stories in our repository.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
              >
                Browse Marketplace <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Cart Items List */}
              <div className="lg:col-span-8 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-5 group"
                  >
                    {/* Cover Image */}
                    <div className="w-20 h-28 shrink-0 bg-zinc-200 rounded-xl overflow-hidden shadow-sm relative">
                      <OptimizedImage
                        src={item.cover_url || "/placeholder-cover.jpg"}
                        alt={item.title}
                        variant="book-cover"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-grow min-w-0 space-y-1">
                      <h3 className="font-heading font-bold text-lg text-zinc-900 uppercase tracking-tight line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                        by {item.author_name || "Author"}
                      </p>
                      <p className="text-sm font-black text-zinc-900 pt-1">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 bg-white rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all"
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-xs font-black text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all"
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal Item Price */}
                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-black text-zinc-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-6 sticky top-24">
                <h3 className="font-heading font-black text-xl uppercase tracking-tight text-zinc-900 pb-3 border-b border-zinc-200">
                  Order Summary
                </h3>

                <div className="space-y-3 text-xs text-zinc-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-zinc-900">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping / Delivery</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span className="font-bold text-zinc-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-zinc-200 flex justify-between text-sm font-black text-zinc-900">
                    <span>Total</span>
                    <span className="text-lg">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing Order...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-[10px] text-zinc-400 font-medium text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-zinc-500" />
                  <span>Secure 256-Bit SSL Encrypted Checkout</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
