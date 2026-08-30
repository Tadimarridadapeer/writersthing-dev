import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
    const rawId = searchParams.get("content_id") || searchParams.get("post_id") || searchParams.get("id");

    if (!rawId) {
      return NextResponse.json({ error: "content_id or post_id is required" }, { status: 400 });
    }

    const uuid = toValidUUID(rawId);
    const supabaseServer = getSupabaseServer();

    // Query comments matching either rawId or converted UUID
    const { data: commentsData, error } = await supabaseServer
      .from("comments")
      .select("*, users:user_id(name, avatar_url)")
      .in("content_id", [rawId, uuid])
      .order("created_at", { ascending: true });

    if (error) {
      // Fallback query without table joins if schema cache lags
      const { data: fallbackComments, error: fallbackErr } = await supabaseServer
        .from("comments")
        .select("*")
        .in("content_id", [rawId, uuid])
        .order("created_at", { ascending: true });

      if (fallbackErr) throw fallbackErr;

      const userIds = (fallbackComments || []).map(c => c.user_id).filter(Boolean);
      const usersMap: Record<string, any> = {};

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
    console.error("GET /api/comments error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      content_type = "article",
      content_id,
      post_id,
      comment_text,
      rating,
      user_id: payloadUserId
    } = body;

    const rawId = content_id || post_id;
    if (!rawId) {
      return NextResponse.json({ error: "content_id is required" }, { status: 400 });
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

    const uuid = toValidUUID(rawId);

    // Attempt insertion with requested content_type first
    const insertPayload: any = {
      user_id: activeUserId,
      content_type: content_type || "article",
      content_id: uuid,
      comment_text: comment_text?.trim() || null,
      rating: rating > 0 ? rating : null
    };

    let { data: newComment, error: insertError } = await supabaseServer
      .from("comments")
      .insert(insertPayload)
      .select("*, users:user_id(name, avatar_url)")
      .single();

    // If check constraint fails for 'story', retry with 'article' or 'blog'
    if (insertError) {
      console.warn("Primary insert error, retrying with fallback content_type 'article':", insertError.message);
      
      insertPayload.content_type = "article";
      const { data: fbComment, error: fbError } = await supabaseServer
        .from("comments")
        .insert(insertPayload)
        .select("*, users:user_id(name, avatar_url)")
        .single();

      if (fbError) {
        console.warn("Secondary insert error, retrying with fallback content_type 'blog':", fbError.message);
        insertPayload.content_type = "blog";
        const { data: blogComment, error: blogError } = await supabaseServer
          .from("comments")
          .insert(insertPayload)
          .select("*, users:user_id(name, avatar_url)")
          .single();

        if (blogError) throw blogError;
        newComment = blogComment;
      } else {
        newComment = fbComment;
      }
    }

    // Attach user profile details if missing
    if (newComment && !newComment.users) {
      const { data: userData } = await supabaseServer
        .from("users")
        .select("name, avatar_url")
        .eq("id", activeUserId)
        .maybeSingle();
      
      newComment.users = userData || { name: "Reader", avatar_url: null };
    }

    // Handle Comment Notification Email
    try {
      if (newComment && newComment.id) {
        // Find content details
        const tablesToTry = ['articles', 'stories', 'blogs', 'manuscripts', 'books'];
        let contentInfo = null;
        for (const table of tablesToTry) {
          const { data } = await supabaseServer.from(table).select('title, user_id, author_id').eq('id', uuid).maybeSingle();
          if (data) {
            contentInfo = { ...data, table };
            break;
          }
        }

        if (contentInfo) {
          let authorId = contentInfo.user_id || contentInfo.author_id;
          
          // Resolve authors.id to users.id if necessary (for books, stories, blogs)
          if (['books', 'stories', 'blogs'].includes(contentInfo.table) && contentInfo.author_id) {
             const { data: authorMapping } = await supabaseServer.from('authors').select('user_id').eq('id', contentInfo.author_id).maybeSingle();
             if (authorMapping && authorMapping.user_id) {
                 authorId = authorMapping.user_id;
             }
          }
          
          if (authorId && authorId !== activeUserId) {
            // Get Author settings and details
            const { data: authorData } = await supabaseServer
              .from('users')
              .select('id, name, email, comment_emails_enabled')
              .eq('id', authorId)
              .maybeSingle();

            if (authorData && authorData.comment_emails_enabled !== false && authorData.email) {
                const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/read/${uuid}`;
                const commentTextSafe = comment_text?.trim() || "Rated your story.";
                
                // Do not await this so it can run in background, but wrap in try/catch
                emailService.sendCommentNotificationEmail(
                  authorData.email,
                  authorData.name,
                  newComment.users?.name || 'A reader',
                  contentInfo.title || 'A story',
                  commentTextSafe,
                  storyUrl
                ).catch(e => console.error("Email send failed:", e));
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("Error processing comment notification:", notifErr);
    }


    return NextResponse.json({
      success: true,
      comment: newComment
    });

  } catch (err: any) {
    console.error("POST /api/comments error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to post comment" }, { status: 500 });
  }
}
