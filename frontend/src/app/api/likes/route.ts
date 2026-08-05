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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("content_id") || searchParams.get("id");

    if (!contentId) {
      return NextResponse.json({ error: "content_id parameter is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // Fetch likes with joined user information
    const { data: likesData, error } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback query if join fails
      const { data: fallbackLikes, error: fallbackErr } = await supabaseServer
        .from("likes")
        .select("id, created_at, user_id")
        .eq("content_id", contentId)
        .order("created_at", { ascending: false });

      if (fallbackErr) throw fallbackErr;

      const userIds = fallbackLikes?.map(l => l.user_id) || [];
      let usersMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabaseServer
          .from("users")
          .select("id, name, avatar_url")
          .in("id", userIds);
        usersData?.forEach(u => { usersMap[u.id] = u; });
      }

      const likedUsers = (fallbackLikes || []).map(l => ({
        id: l.user_id,
        name: usersMap[l.user_id]?.name || "Reader",
        avatar_url: usersMap[l.user_id]?.avatar_url || null,
        liked_at: l.created_at
      }));

      const isLiked = user ? likedUsers.some(u => u.id === user.id) : false;

      return NextResponse.json({
        contentId,
        likesCount: likedUsers.length,
        isLiked,
        likedUsers
      });
    }

    const likedUsers = (likesData || []).map((item: any) => {
      const userInfo = Array.isArray(item.users) ? item.users[0] : item.users;
      return {
        id: item.user_id,
        name: userInfo?.name || "Reader",
        avatar_url: userInfo?.avatar_url || null,
        liked_at: item.created_at
      };
    });

    const isLiked = user ? likedUsers.some(u => u.id === user.id) : false;

    return NextResponse.json({
      contentId,
      likesCount: likedUsers.length,
      isLiked,
      likedUsers
    });

  } catch (err: any) {
    console.error("GET /api/likes error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch likes" }, { status: 500 });
  }
}
