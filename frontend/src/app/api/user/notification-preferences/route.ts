import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseServer() {
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

export async function GET() {
  try {
    const supabaseServer = getSupabaseServer();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select("like_emails_enabled, comment_emails_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      // If columns don't exist yet, fallback to true
      if (error.code === '42703') {
        return NextResponse.json({ like_emails_enabled: true, comment_emails_enabled: true });
      }
      throw error;
    }

    return NextResponse.json({
      like_emails_enabled: data.like_emails_enabled ?? true,
      comment_emails_enabled: data.comment_emails_enabled ?? true,
    });
  } catch (error: any) {
    console.error("GET /api/user/notification-preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { like_emails_enabled, comment_emails_enabled } = body;

    const updates: any = {};
    if (typeof like_emails_enabled === 'boolean') updates.like_emails_enabled = like_emails_enabled;
    if (typeof comment_emails_enabled === 'boolean') updates.comment_emails_enabled = comment_emails_enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
       // If columns don't exist yet
       if (error.code === '42703') {
         return NextResponse.json({ error: "Database migration required. Please run the SQL migration." }, { status: 400 });
       }
       throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/user/notification-preferences error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
