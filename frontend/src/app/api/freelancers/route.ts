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
      },
    }
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();

    // Fetch users who have an accepted founding_writers record
    const { data, error } = await supabase
      .from("founding_writers")
      .select(`
        id,
        full_name,
        email_address,
        user_id,
        users:user_id (
          id,
          name,
          email,
          avatar_url,
          bio
        )
      `)
      .eq("status", "Accepted");

    if (error) {
      throw error;
    }

    // Map the response to a clean freelancer profile structure
    const freelancers = data.map((record: any) => {
      const user = record.users || {};
      return {
        id: user.id || record.user_id || record.id,
        name: user.name || record.full_name,
        email: user.email || record.email_address,
        avatar_url: user.avatar_url || "",
        bio: user.bio || "Official Founding Writer at Writer's Thing.",
        skills: ["Writing", "Editing", "Proofreading"], // Default skills since we don't have a skills column
      };
    });

    return NextResponse.json({ data: freelancers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch freelancers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
