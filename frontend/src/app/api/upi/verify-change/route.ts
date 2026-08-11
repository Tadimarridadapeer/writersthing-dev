import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendUpiChangeNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { userId, email, otpCode } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (!userId || !email || !otpCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find the latest unused OTP for this user
    const { data: otpRecords, error: otpFetchError } = await supabaseAdmin
      .from("upi_otps")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .eq("purpose", "change")
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

    // 3. Get current active UPI
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("active_upi_id")
      .eq("id", userId)
      .single();

    // 4. Create pending request (24 hour hold)
    const activateAfter = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    const deviceInfo = req.headers.get("user-agent") || "unknown";

    const { error: requestError } = await supabaseAdmin
      .from("upi_change_requests")
      .insert({
        user_id: userId,
        old_upi_id: user?.active_upi_id || null,
        new_upi_id: otpRecord.new_upi_id,
        status: "pending",
        activate_after: activateAfter.toISOString(),
        ip_address: ipAddress,
        device_info: deviceInfo
      });

    if (requestError) {
      console.error("Failed to create change request:", requestError);
      return NextResponse.json({ error: "Failed to create change request" }, { status: 500 });
    }

    // 5. Mark OTP as used
    await supabaseAdmin.from("upi_otps").update({ used: true }).eq("id", otpRecord.id);

    // 6. Log audit trail
    await supabaseAdmin.from("upi_audit_logs").insert({
      user_id: userId,
      action: "request_change",
      previous_upi: user?.active_upi_id || null,
      new_upi: otpRecord.new_upi_id,
      status: "pending",
      ip_address: ipAddress,
      device_info: deviceInfo
    });

    // 7. Send Security Notification Email
    await sendUpiChangeNotification(
      email, 
      user?.active_upi_id || null, 
      otpRecord.new_upi_id, 
      ipAddress, 
      deviceInfo
    );

    return NextResponse.json({ success: true, message: "UPI change request created successfully" });
  } catch (error: any) {
    console.error("UPI Verify Change error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
