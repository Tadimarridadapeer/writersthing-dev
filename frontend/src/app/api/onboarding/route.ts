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

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { interests, contentTypes, goals } = await req.json();

    // 1. Delete existing preferences to handle re-onboarding / updates
    await supabase.from("user_preferences").delete().eq("user_id", user.id);
    await supabase.from("user_content_preferences").delete().eq("user_id", user.id);
    await supabase.from("user_goals").delete().eq("user_id", user.id);

    // 2. Insert new preferences
    if (interests && interests.length > 0) {
      const interestsData = interests.map((interest: string) => ({ user_id: user.id, interest }));
      const { error } = await supabase.from("user_preferences").insert(interestsData);
      if (error) throw error;
    }

    if (contentTypes && contentTypes.length > 0) {
      const contentData = contentTypes.map((type: string) => ({ user_id: user.id, content_type: type }));
      const { error } = await supabase.from("user_content_preferences").insert(contentData);
      if (error) throw error;
    }

    if (goals && goals.length > 0) {
      const goalsData = goals.map((goal: string) => ({ user_id: user.id, goal }));
      const { error } = await supabase.from("user_goals").insert(goalsData);
      if (error) throw error;
    }

    // 3. Mark onboarding as completed
    const { error: userError } = await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (userError) throw userError;

    return NextResponse.json({ message: "Onboarding completed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ message: error.message || "Failed to save preferences" }, { status: 500 });
  }
}
