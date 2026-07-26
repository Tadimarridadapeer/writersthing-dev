import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { withObservability } from "@/lib/api-logger";

export const POST = withObservability(async (req: Request) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Supabase Auth Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.security("Login failed: Invalid credentials", { email, error: error.message });
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json({ message: "Login failed" }, { status: 500 });
    }

    // Get user details from public.users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      logger.warn("User data fetch error", { error: userError.message });
    }

    const response = NextResponse.json(
      {
        message: "Logged in successfully",
        user: { 
          id: user.id, 
          name: userData?.name || user.user_metadata?.name || "User", 
          email: user.email, 
          role: userData?.role || user.user_metadata?.role || "Reader" 
        },
      },
      { status: 200 }
    );

    // Set cookie for server components
    response.cookies.set("token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    logger.error("Login error", { error: error.message });
    throw error; // Let withObservability handle the generic 500
  }
}, "/api/auth/login");
