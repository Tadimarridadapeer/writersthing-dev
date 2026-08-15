import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authValidators } from "@/lib/validators/auth.validator";
import { sendForgotPasswordEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email exists and format is valid
    if (!email || !authValidators.isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Need admin privileges to generate link
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call the official Supabase Auth admin method to generate the link without triggering their email
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${baseUrl}/reset-password`,
      }
    });

    if (error) {
      console.error("Supabase Reset Password Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status || 400 }
      );
    }

    // Now send the link via our centralized Resend email service
    if (data?.properties?.action_link) {
      try {
        await sendForgotPasswordEmail(email, data.properties.action_link);
      } catch (error) {
        console.error("Forgot password email failed", error);
      }
    }

    return NextResponse.json(
      { success: true, message: "Password reset email sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to send password reset email." },
      { status: 500 }
    );
  }
}
