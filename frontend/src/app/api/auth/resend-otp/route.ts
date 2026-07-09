import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { emailService } from "@/lib/email/email.service";
import { otpService } from "@/lib/otp/otp.service";
import { createApiResponse, createApiError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return createApiError("Valid session ID is required");
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch the old record to get the email
    const { data: record, error: fetchError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("email, created_at, used")
      .eq("session_id", session_id)
      .maybeSingle();

    if (fetchError || !record) {
      return createApiError("Invalid session. Please restart the process.", 404);
    }

    if (record.used) {
      return createApiError("This session has already been used.", 400);
    }

    const now = Date.now();
    const createdAt = new Date(record.created_at).getTime();

    // Enforce 60-second cooldown
    if (now - createdAt < 60000) {
      return createApiError("Please wait 60 seconds before requesting another code.", 429);
    }

    // Invalidate old OTP
    await supabaseAdmin
      .from("password_reset_otps")
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq("session_id", session_id);

    // Generate new OTP
    const otp = otpService.generateOTP();
    const otpHash = await otpService.hashOTP(otp);
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();

    // Create new session record
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("password_reset_otps")
      .insert({
        email: record.email,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
        used: false
      })
      .select("session_id")
      .single();

    if (insertError) {
      return createApiError("Failed to generate new OTP", 500);
    }

    // Send email
    await emailService.sendOTP(record.email, otp);

    return createApiResponse(true, "New verification code sent successfully", {
      session_id: insertData.session_id
    });

  } catch (error: any) {
    console.error("Resend OTP Error:", error);
    return createApiError(error.message || "Internal server error", 500);
  }
}
