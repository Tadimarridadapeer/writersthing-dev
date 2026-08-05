import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("content_id") || searchParams.get("post_id") || searchParams.get("id");

    if (!contentId) {
      return NextResponse.json({ error: "content_id or post_id is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();

    // Query comments with user details join
    const { data: commentsData, error } = await supabaseServer
      .from("comments")
      .select("*, users:user_id(name, avatar_url)")
      .or(`content_id.eq.${contentId},post_id.eq.${contentId}`)
      .order("created_at", { ascending: true });

    if (error) {
      // Fallback query if OR clause or join encounters schema cache lag
      const { data: fallbackComments, error: fallbackErr } = await supabaseServer
        .from("comments")
        .select("*")
        .or(`content_id.eq.${contentId},post_id.eq.${contentId}`)
        .order("created_at", { ascending: true });

      if (fallbackErr) throw fallbackErr;

      const userIds = (fallbackComments || []).map(c => c.user_id).filter(Boolean);
      let usersMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabaseServer
          .from("users")
          .select("id, name, avatar_url")
          .in("id", userIds);
        usersData?.forEach(u => { usersMap[u.id] = u; });
      }

      const formatted = (fallbackComments || []).map(c => ({
        ...c,
        users: usersMap[c.user_id] || { name: "Reader", avatar_url: null }
      }));

      return NextResponse.json({ comments: formatted });
    }

    return NextResponse.json({ comments: commentsData || [] });

  } catch (err: any) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      content_type = "story",
      content_id,
      post_id,
      comment_text,
      rating,
      user_id: payloadUserId
    } = body;

    const targetId = content_id || post_id;
    if (!targetId) {
      return NextResponse.json({ error: "content_id or post_id is required" }, { status: 400 });
    }

    if (!comment_text && !rating) {
      return NextResponse.json({ error: "Comment text or rating is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();

    const activeUserId = user?.id || payloadUserId;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // Prepare insert record handling both legacy post_id and content_id fields
    const insertPayload: any = {
      user_id: activeUserId,
      content_type: content_type || "story",
      comment_text: comment_text?.trim() || null,
      rating: rating > 0 ? rating : null
    };

    if (targetId) {
      insertPayload.content_id = targetId;
      insertPayload.post_id = targetId;
    }

    // Try server client insert first
    let { data: newComment, error: insertError } = await supabaseServer
      .from("comments")
      .insert(insertPayload)
      .select("*, users:user_id(name, avatar_url)")
      .single();

    if (insertError) {
      console.warn("Server client insert error, attempting fallback insert:", insertError.message);
      
      // Fallback insert via client SDK
      const { data: fbComment, error: fbError } = await supabase
        .from("comments")
        .insert(insertPayload)
        .select("*")
        .single();

      if (fbError) throw fbError;
      newComment = fbComment;
    }

    // Ensure users details are attached to response
    if (newComment && !newComment.users) {
      const { data: userData } = await supabaseServer
        .from("users")
        .select("name, avatar_url")
        .eq("id", activeUserId)
        .maybeSingle();
      
      newComment.users = userData || { name: "Reader", avatar_url: null };
    }

    return NextResponse.json({
      success: true,
      comment: newComment
    });

  } catch (err: any) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: err.message || "Failed to post comment" }, { status: 500 });
  }
}
