import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { otpService } from "@/lib/otp/otp.service";
import { authValidators } from "@/lib/validators/auth.validator";
import { createApiResponse, createApiError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const { session_id, otp } = await req.json();

    if (!session_id || !otp || !authValidators.isValidOTP(otp)) {
      return createApiError("Valid session ID and 6-digit OTP are required");
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch the OTP record by session_id
    const { data: record, error: fetchError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();

    if (fetchError || !record) {
      return createApiError("Invalid session. Please request a new code.", 404);
    }

    if (record.used) {
      return createApiError("This code has already been used.", 400);
    }

    if (record.attempts >= 5) {
      return createApiError("Maximum attempts reached. Please request a new code.", 429);
    }

    const now = Date.now();
    const expiresAt = new Date(record.expires_at).getTime();

    if (now > expiresAt) {
      return createApiError("OTP expired", 400); // UI checks exactly for "OTP expired" message to show proper UX
    }

    // Verify OTP Hash
    const isValid = await otpService.verifyOTP(otp, record.otp_hash);

    if (!isValid) {
      // Increment attempts
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      return createApiError("Invalid OTP", 400);
    }

    // Mark as verified
    await supabaseAdmin
      .from("password_reset_otps")
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq("id", record.id);

    return createApiResponse(true, "OTP verified successfully");

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return createApiError(error.message || "Internal server error", 500);
  }
}
