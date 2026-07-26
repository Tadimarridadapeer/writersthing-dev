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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { review_id, vote_type } = body;

    if (!review_id || !['helpful', 'not_helpful'].includes(vote_type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check existing vote
    const { data: existing } = await supabase
      .from("review_votes")
      .select("id, vote_type")
      .eq("review_id", review_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.vote_type === vote_type) {
        // User clicked the same vote type again -> remove the vote (toggle off)
        const { error } = await supabase
          .from("review_votes")
          .delete()
          .eq("id", existing.id);
        
        if (error) throw error;
        return NextResponse.json({ action: "removed", vote_type });
      } else {
        // User switched vote type
        const { error } = await supabase
          .from("review_votes")
          .update({ vote_type })
          .eq("id", existing.id);
          
        if (error) throw error;
        return NextResponse.json({ action: "switched", vote_type });
      }
    } else {
      // New vote
      const { error } = await supabase
        .from("review_votes")
        .insert({
          review_id,
          user_id: user.id,
          vote_type
        });
        
      if (error) throw error;
      return NextResponse.json({ action: "added", vote_type });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
