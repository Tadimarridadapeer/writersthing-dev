import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id } = await params;
    let resolvedUserId = id;

    // First try finding the user by users.id
    let userRes = await supabase.from("users").select("id, name, email, avatar_url, bio").eq("id", id).maybeSingle();
    
    // If not found, try finding by authors.id
    if (!userRes.data) {
      const authorRes = await supabase.from("authors").select("user_id").eq("id", id).maybeSingle();
      if (authorRes.data?.user_id) {
        resolvedUserId = authorRes.data.user_id;
        userRes = await supabase.from("users").select("id, name, email, avatar_url, bio").eq("id", resolvedUserId).maybeSingle();
      }
    }

    // If still not found, try founding_writers.id
    if (!userRes.data) {
      const founderRes = await supabase.from("founding_writers").select("*").eq("id", id).maybeSingle();
      if (founderRes.data) {
        return NextResponse.json({
          user: {
            id: founderRes.data.id,
            name: founderRes.data.full_name,
            email: founderRes.data.email_address,
            bio: "Official Founding Writer at Writer's Thing.",
            avatar_url: "",
            available_for_hire: true
          },
          resolvedUserId: null // means no real user
        });
      }
    }

    if (!userRes.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: userRes.data,
      resolvedUserId: resolvedUserId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
