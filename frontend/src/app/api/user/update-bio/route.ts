import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          const cookieStore = await cookies();
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        async remove(name: string, options: any) {
          const cookieStore = await cookies();
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, bio } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "You can only edit your own bio" }, { status: 403 });
    }

    const { error } = await supabase
      .from("users")
      .update({ bio })
      .eq("id", userId);

    if (error) {
      console.error("Failed to update bio:", error);
      if (error.code === '42703') { // undefined_column
        return NextResponse.json({ error: "The 'bio' column does not exist in the database. Please run the database migration." }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to update bio" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Bio updated successfully" });
  } catch (error: any) {
    console.error("Bio Update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
