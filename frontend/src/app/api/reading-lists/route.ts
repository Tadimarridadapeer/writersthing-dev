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

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("reading_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Reading lists fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch reading lists" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Reading lists GET exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid list name" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reading_lists")
      .insert({
        user_id: user.id,
        name: name.trim(),
        is_default: false
      })
      .select()
      .single();

    if (error) {
      console.error("Reading list create error:", error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: "A list with this name already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create reading list" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Reading list POST exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
