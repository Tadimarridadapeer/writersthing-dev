import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for secure backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      amount,
      projectId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment is valid. Calculate commissions.
    // Assuming amount passed here is in Rupees.
    const totalAmount = Number(amount);
    const platformCommission = totalAmount * 0.10; // 10%
    const writerAmount = totalAmount * 0.90; // 90%

    // Store in Supabase
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: totalAmount,
      currency: "INR",
      status: "SUCCESS",
      commission_amount: platformCommission,
      writer_amount: writerAmount,
      project_id: projectId || null,
      payout_status: "NOT_RELEASED",
    });

    if (insertError) {
      console.error("Error inserting payment record:", insertError);
      // We don't fail the verification response if DB insertion fails, but we log it. 
      // In production, consider queuing this for retry or returning a partial success.
      return NextResponse.json(
        { error: "Payment verified but failed to record in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
