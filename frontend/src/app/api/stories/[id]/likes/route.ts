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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // Fetch all likes for this story along with user information
    const { data: likesData, error: likesError } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url, email)")
      .eq("content_id", storyId)
      .order("created_at", { ascending: false });

    if (likesError) {
      // Fallback query without user join if relation issue occurs
      const { data: fallbackLikes, error: fallbackError } = await supabaseServer
        .from("likes")
        .select("id, created_at, user_id")
        .eq("content_id", storyId)
        .order("created_at", { ascending: false });

      if (fallbackError) {
        throw fallbackError;
      }

      // Fetch user details manually for fallback
      const userIds = fallbackLikes?.map(l => l.user_id) || [];
      let usersMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabaseServer
          .from("users")
          .select("id, name, avatar_url")
          .in("id", userIds);
          
        usersData?.forEach(u => {
          usersMap[u.id] = u;
        });
      }

      const likedUsers = (fallbackLikes || []).map(l => ({
        id: l.user_id,
        name: usersMap[l.user_id]?.name || "Anonymous User",
        avatar_url: usersMap[l.user_id]?.avatar_url || null,
        liked_at: l.created_at
      }));

      const isLiked = user ? likedUsers.some(u => u.id === user.id) : false;

      return NextResponse.json({
        storyId,
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
      storyId,
      likesCount: likedUsers.length,
      isLiked,
      likedUsers
    });

  } catch (error: any) {
    console.error("GET story likes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch likes" }, { status: 500 });
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

    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if like already exists
    const { data: existingLike } = await supabaseServer
      .from("likes")
      .select("id")
      .eq("content_id", storyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      // Remove like (unlike)
      const { error: deleteError } = await supabaseServer
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) throw deleteError;
    } else {
      // Insert like
      const { error: insertError } = await supabaseServer
        .from("likes")
        .insert({
          content_type: "story",
          content_id: storyId,
          user_id: user.id
        });

      if (insertError) throw insertError;
    }

    // Return updated likes list
    const { data: likesData } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .eq("content_id", storyId)
      .order("created_at", { ascending: false });

    const likedUsers = (likesData || []).map((item: any) => {
      const userInfo = Array.isArray(item.users) ? item.users[0] : item.users;
      return {
        id: item.user_id,
        name: userInfo?.name || "Reader",
        avatar_url: userInfo?.avatar_url || null,
        liked_at: item.created_at
      };
    });

    const isLiked = likedUsers.some(u => u.id === user.id);

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: likedUsers.length,
      likedUsers
    });

  } catch (error: any) {
    console.error("POST story likes error:", error);
    return NextResponse.json({ error: error.message || "Failed to toggle like" }, { status: 500 });
  }
}
