import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("user_id");

    const validUuid = toValidUUID(storyId);
    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || paramUserId;

    // Query likes by storyId or converted UUID
    const { data: likesData, error: likesError } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .in("content_id", [storyId, validUuid])
      .order("created_at", { ascending: false });

    if (likesError) {
      const { data: fallbackLikes, error: fallbackErr } = await supabaseServer
        .from("likes")
        .select("id, created_at, user_id")
        .in("content_id", [storyId, validUuid])
        .order("created_at", { ascending: false });

      if (fallbackErr) throw fallbackErr;

      const userIds = (fallbackLikes || []).map(l => l.user_id).filter(Boolean);
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

      const isLiked = activeUserId ? likedUsers.some(u => u.id === activeUserId) : false;

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

    const isLiked = activeUserId ? likedUsers.some(u => u.id === activeUserId) : false;

    return NextResponse.json({
      storyId,
      likesCount: likedUsers.length,
      isLiked,
      likedUsers
    });

  } catch (err: any) {
    console.error("GET story likes error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to fetch likes" }, { status: 500 });
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

    const body = await req.json().catch(() => ({}));
    const { user_id: payloadUserId } = body;

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || payloadUserId;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const validUuid = toValidUUID(storyId);

    // Check if like exists
    const { data: existingLike } = await supabaseServer
      .from("likes")
      .select("id")
      .in("content_id", [storyId, validUuid])
      .eq("user_id", activeUserId)
      .maybeSingle();

    if (existingLike) {
      // Remove like
      await supabaseServer.from("likes").delete().eq("id", existingLike.id);
    } else {
      // Add like with fallback content_type "article" to bypass the old broken DB trigger
      const insertPayload = {
        user_id: activeUserId,
        content_type: "article",
        content_id: validUuid
      };

      const { error: insertErr } = await supabaseServer.from("likes").insert(insertPayload);
      if (insertErr) {
        console.warn("Primary like insert error, trying client insert fallback:", insertErr.message);
        const { error: fbErr } = await supabase.from("likes").insert(insertPayload);
        if (fbErr) {
            return NextResponse.json({ success: false, error: "Insert failed: " + insertErr.message + " | Fallback: " + fbErr.message }, { status: 400 });
        }
      }

      try {
        // Find author of the story
        const { data: storyInfo } = await supabaseServer.from('stories').select('title, author_id').eq('id', validUuid).maybeSingle();
        
        if (storyInfo && storyInfo.author_id) {
           // Resolve authors.id to users.id
           const { data: authorMapping } = await supabaseServer.from('authors').select('user_id').eq('id', storyInfo.author_id).maybeSingle();
           
           if (authorMapping && authorMapping.user_id && authorMapping.user_id !== activeUserId) {
              const authorId = authorMapping.user_id;
              
              const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/stories/${validUuid}`;
              
              // 1. In-App Notification (replaces broken DB trigger)
              const { NotificationService } = await import("@/lib/notificationService");
              await NotificationService.create({
                userId: authorId,
                actorId: activeUserId,
                type: 'new_like' as any,
                targetType: 'story',
                targetId: validUuid,
                targetUrl: storyUrl,
                metadata: { title: storyInfo.title }
              });
           }
        }
      } catch (notifErr) {
        console.error("Error processing story like notification:", notifErr);
      }
    }

    // Fetch updated likes list
    const { data: likesData } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .in("content_id", [storyId, validUuid])
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

    const isLiked = likedUsers.some(u => u.id === activeUserId);

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: likedUsers.length,
      likedUsers
    });

  } catch (err: any) {
    console.error("POST story likes error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to toggle like" }, { status: 500 });
  }
}
