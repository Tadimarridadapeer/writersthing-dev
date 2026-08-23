import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NotificationService } from "@/lib/notificationService";

export const dynamic = "force-dynamic";

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

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filterType = searchParams.get("type"); // e.g., 'all', 'unread', or a specific type
    const includeArchived = searchParams.get("archived") === 'true';

    let query = supabase
      .from("notifications")
      .select("*, actor:actor_id(id, name, avatar_url)", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    if (filterType && filterType !== 'all') {
      if (filterType === 'unread') {
        query = query.eq("is_read", false);
      } else {
        query = query.eq("type", filterType);
      }
    }

    const { data, count, error } = await query;

    if (error) throw error;
    
    // Also fetch unread count efficiently
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .eq("is_archived", false);

    return NextResponse.json({ data: data || [], count, unreadCount: unreadCount || 0 });
  } catch (err: any) {
    console.error("Notifications GET Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, notification_id, notification_ids } = body;

    let query = supabase.from("notifications").update({});

    if (action === 'mark_read') {
      query = supabase.from("notifications").update({ is_read: true });
    } else if (action === 'mark_unread') {
      query = supabase.from("notifications").update({ is_read: false });
    } else if (action === 'archive') {
      query = supabase.from("notifications").update({ is_archived: true, archived_at: new Date().toISOString() });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Apply to specific ID, an array of IDs, or ALL notifications for this user
    query = query.eq("user_id", user.id);
    
    if (notification_id) {
      query = query.eq("id", notification_id);
    } else if (notification_ids && Array.isArray(notification_ids)) {
      query = query.in("id", notification_ids);
    } else if (action === 'mark_read') {
      // Mark all read implicitly if no ids provided
      query = query.eq("is_read", false);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { notification_id, notification_ids, delete_all } = body;

    let query = supabase.from("notifications").delete().eq("user_id", user.id);

    if (notification_id) {
      query = query.eq("id", notification_id);
    } else if (notification_ids && Array.isArray(notification_ids)) {
      query = query.in("id", notification_ids);
    } else if (!delete_all) {
      return NextResponse.json({ error: "Specify IDs or delete_all" }, { status: 400 });
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { user_id, type, target_id, target_type } = body;
    
    if (!user_id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    await NotificationService.create({
      userId: user_id,
      actorId: user.id,
      type,
      targetId: target_id,
      targetType: target_type
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
