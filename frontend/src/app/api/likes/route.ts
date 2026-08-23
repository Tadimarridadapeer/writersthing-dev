import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { emailService } from "@/services/email.service";


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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("content_id") || searchParams.get("id");
    const paramUserId = searchParams.get("user_id");

    if (!rawId) {
      return NextResponse.json({ error: "content_id is required" }, { status: 400 });
    }

    const validUuid = toValidUUID(rawId);
    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || paramUserId;

    const { data: likesData, error: likesError } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .in("content_id", [rawId, validUuid])
      .order("created_at", { ascending: false });

    if (likesError) {
      const { data: fallbackLikes, error: fallbackErr } = await supabaseServer
        .from("likes")
        .select("id, created_at, user_id")
        .in("content_id", [rawId, validUuid])
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
        contentId: rawId,
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
      contentId: rawId,
      likesCount: likedUsers.length,
      isLiked,
      likedUsers
    });

  } catch (err: any) {
    console.error("GET /api/likes error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to fetch likes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { content_id, user_id: payloadUserId, content_type = "article" } = body;

    if (!content_id) {
      return NextResponse.json({ error: "content_id is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || payloadUserId;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const validUuid = toValidUUID(content_id);

    const { data: existingLike } = await supabaseServer
      .from("likes")
      .select("id")
      .in("content_id", [content_id, validUuid])
      .eq("user_id", activeUserId)
      .maybeSingle();

    if (existingLike) {
      await supabaseServer.from("likes").delete().eq("id", existingLike.id);
    } else {
      const insertPayload = {
        user_id: activeUserId,
        content_type: content_type || "article",
        content_id: validUuid
      };

      const { error: insertErr } = await supabaseServer.from("likes").insert(insertPayload);
      if (insertErr) {
        console.warn("Primary like insert error, trying client insert fallback:", insertErr.message);
        await supabase.from("likes").insert(insertPayload);
      }
      
      // Handle Like Notification
      try {
        // Find content details (try articles, stories, blogs, manuscripts, books)
        const tablesToTry = ['articles', 'stories', 'blogs', 'manuscripts', 'books'];
        let contentInfo = null;
        for (const table of tablesToTry) {
          const { data } = await supabaseServer.from(table).select('title, user_id, author_id').eq('id', validUuid).maybeSingle();
          if (data) {
            contentInfo = { ...data, table };
            break;
          }
        }

        if (contentInfo) {
          const authorId = contentInfo.user_id || contentInfo.author_id;
          
          if (authorId && authorId !== activeUserId) {
            // Get Author settings and details
            const { data: authorData } = await supabaseServer
              .from('users')
              .select('id, name, email, like_emails_enabled')
              .eq('id', authorId)
              .maybeSingle();

            if (authorData) {
              // Create DB notification (this handles uniqueness through SQL constraints)
              const { data: notifData, error: notifError } = await supabaseServer
                .from('notifications')
                .insert({
                  user_id: authorId,
                  actor_id: activeUserId,
                  target_id: validUuid,
                  target_type: content_type,
                  type: 'new_like',
                  is_read: false,
                  metadata: {
                    title: contentInfo.title || "A post"
                  }
                })
                .select('id')
                .maybeSingle();
              
              // Only send email if a new notification was successfully created (prevents duplicates)
              // and if author has emails enabled
              if (!notifError && notifData && authorData.like_emails_enabled !== false && authorData.email) {
                // Get Reader details
                const { data: readerData } = await supabaseServer
                  .from('users')
                  .select('name')
                  .eq('id', activeUserId)
                  .maybeSingle();
                
                const activeUserName = readerData?.name || 'A reader';
                const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/read/${validUuid}`;
                
                // Do not await this so it can run in background, but wrap in try/catch
                emailService.sendLikeNotificationEmail(
                  authorData.email,
                  authorData.name,
                  activeUserName,
                  contentInfo.title || 'A story',
                  storyUrl
                ).catch(e => console.error("Like email error:", e));
              }
            }
          }
        }
      } catch (notifErr) {
        console.error("Error processing like notification:", notifErr);
      }
    }

    const { data: likesData } = await supabaseServer
      .from("likes")
      .select("id, created_at, user_id, users:user_id(id, name, avatar_url)")
      .in("content_id", [content_id, validUuid])
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
    console.error("POST /api/likes error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to toggle like" }, { status: 500 });
  }
}
