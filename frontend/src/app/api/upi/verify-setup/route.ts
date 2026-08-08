import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, email, otpCode } = await req.json();

    if (!userId || !email || !otpCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find the latest unused OTP for this user
    const { data: otpRecords, error: otpFetchError } = await supabase
      .from("upi_otps")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .eq("purpose", "setup")
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpFetchError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const otpRecord = otpRecords[0];

    // 2. Validate OTP and expiry
    if (otpRecord.otp_code !== otpCode) {
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // 3. Update user profile with active UPI
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        active_upi_id: otpRecord.new_upi_id,
        is_upi_verified: true,
        last_upi_change_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (userUpdateError) {
      console.error("Failed to update user UPI:", userUpdateError);
      return NextResponse.json({ error: "Failed to setup UPI ID" }, { status: 500 });
    }

    // 4. Mark OTP as used
    await supabase.from("upi_otps").update({ used: true }).eq("id", otpRecord.id);

    // 5. Log audit trail
    await supabase.from("upi_audit_logs").insert({
      user_id: userId,
      action: "setup",
      new_upi: otpRecord.new_upi_id,
      status: "completed",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      device_info: req.headers.get("user-agent") || "unknown"
    });

    return NextResponse.json({ success: true, message: "UPI ID verified and saved successfully" });
  } catch (error: any) {
    console.error("UPI Verify Setup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
