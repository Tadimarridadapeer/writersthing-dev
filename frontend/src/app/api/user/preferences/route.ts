import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
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
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const [interestsRes, contentTypesRes, goalsRes] = await Promise.all([
      supabase.from("user_preferences").select("interest").eq("user_id", user.id),
      supabase.from("user_content_preferences").select("content_type").eq("user_id", user.id),
      supabase.from("user_goals").select("goal").eq("user_id", user.id)
    ]);

    const interests = interestsRes.data?.map(row => row.interest) || [];
    const contentTypes = contentTypesRes.data?.map(row => row.content_type) || [];
    const goals = goalsRes.data?.map(row => row.goal) || [];

    return NextResponse.json({ interests, contentTypes, goals }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch user preferences error:", error);
    return NextResponse.json({ message: error.message || "Failed to fetch preferences" }, { status: 500 });
  }
}
