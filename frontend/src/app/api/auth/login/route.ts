import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
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
      console.warn("User data fetch error:", userError.message);
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
    console.error("Login error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
