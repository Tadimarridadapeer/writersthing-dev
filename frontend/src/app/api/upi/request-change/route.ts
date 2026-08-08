import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendUpiOtpEmail } from "@/lib/email";

// Simple 6 digit OTP generator
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(req: Request) {
  try {
    const { userId, email, password, newUpiId } = await req.json();

    if (!userId || !email || !password || !newUpiId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify User Password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 2. Fetch User Profile to check cooldown and existing requests
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("active_upi_id, last_upi_change_at")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 3. Enforce 30-day cooldown
    if (user.last_upi_change_at) {
      const lastChange = new Date(user.last_upi_change_at);
      const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange < 30) {
        return NextResponse.json({ 
          error: `You can only change your UPI ID once every 30 days. Please try again in ${Math.ceil(30 - daysSinceChange)} days.` 
        }, { status: 403 });
      }
    }

    // 4. Check for existing pending requests
    const { data: pendingRequests } = await supabase
      .from("upi_change_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json({ error: "You already have a pending UPI change request." }, { status: 400 });
    }

    // 5. Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 6. Store OTP
    const { error: otpError } = await supabase
      .from("upi_otps")
      .insert({
        user_id: userId,
        email: email,
        otp_code: otpCode,
        purpose: "change",
        new_upi_id: newUpiId,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Failed to store OTP:", otpError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // 7. Send Email
    await sendUpiOtpEmail(email, otpCode, "change");

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (error: any) {
    console.error("UPI Request Change error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
