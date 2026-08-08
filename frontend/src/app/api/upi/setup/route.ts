import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendUpiOtpEmail } from "@/lib/email";

// Simple 6 digit OTP generator
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(req: Request) {
  try {
    const { userId, email, newUpiId } = await req.json();

    if (!userId || !email || !newUpiId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verify user doesn't already have an active UPI
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("active_upi_id, is_upi_verified")
      .eq("id", userId)
      .single();
      
    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.active_upi_id && user.is_upi_verified) {
      return NextResponse.json({ error: "UPI ID is already setup. Use the change request flow." }, { status: 400 });
    }

    // 2. Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Store OTP in DB
    const { error: otpError } = await supabaseAdmin
      .from("upi_otps")
      .insert({
        user_id: userId,
        email: email,
        otp_code: otpCode,
        purpose: "setup",
        new_upi_id: newUpiId,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Failed to store OTP:", otpError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // 4. Send Email
    await sendUpiOtpEmail(email, otpCode, "setup");

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (error: any) {
    console.error("UPI Setup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
