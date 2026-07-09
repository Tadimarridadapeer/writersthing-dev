import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authValidators } from "@/lib/validators/auth.validator";

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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call the official Supabase Auth method
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) {
      console.error("Supabase Reset Password Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status || 400 }
      );
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
