import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { authValidators } from "@/lib/validators/auth.validator";
import { createApiResponse, createApiError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const { session_id, password } = await req.json();

    if (!session_id || !password) {
      return createApiError("Session ID and new password are required");
    }

    if (!authValidators.isStrongPassword(password)) {
      return createApiError("Password does not meet strength requirements");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return createApiError("Server configuration error. Please contact support.", 500);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch the OTP record by session_id
    const { data: record, error: fetchError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();

    if (fetchError || !record) {
      return createApiError("Invalid session. Please request a new reset link.", 404);
    }

    if (!record.verified) {
      return createApiError("OTP has not been verified.", 403);
    }

    if (record.used) {
      return createApiError("This session has already been used.", 400);
    }

    // Get the user ID from the email via the users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", record.email)
      .maybeSingle();
    
    if (userError || !user) {
      return createApiError("User not found in the system.", 404);
    }

    // Call Supabase Auth Admin API to update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password
    });

    if (updateError) {
      // Very basic check if same password error is thrown by Supabase
      if (updateError.message.includes("different from the old password") || updateError.message.includes("same password")) {
         return createApiError("New password must be different from the old password.", 400);
      }
      return createApiError(updateError.message || "Failed to update password", 500);
    }

    // Mark session as used
    await supabaseAdmin
      .from("password_reset_otps")
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq("id", record.id);

    // Optional: Call cleanup function (if RPC is available) or let cron handle it
    // await supabaseAdmin.rpc("cleanup_expired_otps");

    return createApiResponse(true, "Password changed successfully.");

  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return createApiError(error.message || "Internal server error", 500);
  }
}
