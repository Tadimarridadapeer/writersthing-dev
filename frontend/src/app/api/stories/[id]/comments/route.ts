import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

function toValidUUID(id: string): string {
  if (!id) return "00000000-0000-4000-8000-000000000000";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const hex = Buffer.from(String(id)).toString("hex").padEnd(12, "0").slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const uuid = toValidUUID(storyId);
    const supabaseServer = getSupabaseServer();

    const { data: commentsData, error } = await supabaseServer
      .from("comments")
      .select("*, users:user_id(name, avatar_url)")
      .in("content_id", [storyId, uuid])
      .order("created_at", { ascending: true });

    if (error) {
      const { data: fallbackComments, error: fallbackErr } = await supabaseServer
        .from("comments")
        .select("*")
        .in("content_id", [storyId, uuid])
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
    console.error("GET story comments error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to fetch story comments" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { comment_text, rating, user_id: payloadUserId } = body;

    if (!comment_text && !rating) {
      return NextResponse.json({ error: "Comment text or rating is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();

    const activeUserId = user?.id || payloadUserId;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const uuid = toValidUUID(storyId);

    let insertPayload: any = {
      user_id: activeUserId,
      content_type: "article",
      content_id: uuid,
      comment_text: comment_text?.trim() || null,
      rating: rating > 0 ? rating : null
    };

    let { data: newComment, error: insertError } = await supabaseServer
      .from("comments")
      .insert(insertPayload)
      .select("*, users:user_id(name, avatar_url)")
      .single();

    if (insertError) {
      console.warn("Primary story insert error, trying fallback content_type 'blog':", insertError.message);
      insertPayload.content_type = "blog";

      const { data: fbComment, error: fbError } = await supabaseServer
        .from("comments")
        .insert(insertPayload)
        .select("*, users:user_id(name, avatar_url)")
        .single();

      if (fbError) throw fbError;
      newComment = fbComment;
    }

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
    console.error("POST story comment error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to post comment" }, { status: 500 });
  }
}
