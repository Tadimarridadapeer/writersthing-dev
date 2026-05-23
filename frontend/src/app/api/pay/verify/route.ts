import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { 
      orderId, // renamed from razorpay_order_id in frontend to match
      paymentId, 
      signature 
    } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

    // 1. Verify Signature
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Update Order status in Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({ 
        razorpay_payment_id: paymentId, 
        status: "Success" 
      })
      .eq("razorpay_order_id", orderId)
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: "Order not found or update failed" }, { status: 404 });
    }

    // 3. Add to User Library
    const { error: libError } = await supabase
      .from("library")
      .insert([
        {
          user_id: order.user_id,
          book_id: order.book_id,
          progress: 0,
        },
      ]);

    if (libError) {
      console.error("Library update error:", libError.message);
      // Even if library update fails, payment was successful
    }

    // 4. Update Book Sales Count
    const { data: book } = await supabase
      .from("books")
      .select("sales_count")
      .eq("id", order.book_id)
      .single();
    
    if (book) {
      await supabase
        .from("books")
        .update({ sales_count: (book.sales_count || 0) + 1 })
        .eq("id", order.book_id);
    }

    return NextResponse.json({
      message: "Payment verified and access granted",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
