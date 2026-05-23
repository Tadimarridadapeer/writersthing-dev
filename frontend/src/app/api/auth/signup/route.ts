import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Supabase Auth Signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || "Reader",
        },
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const user = data.user;

    if (!user) {
      return NextResponse.json({ message: "Signup failed" }, { status: 500 });
    }

    // Sync with public.users table
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: user.id,
        name,
        email,
        role: role || "Reader",
      },
    ]);

    if (dbError) {
      console.error("Database sync error:", dbError.message);
    }

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user.id, name, email, role: role || "Reader" },
      },
      { status: 201 }
    );

    // Supabase handles session, but we can still set a cookie if needed for server components
    if (data.session) {
      response.cookies.set("token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
