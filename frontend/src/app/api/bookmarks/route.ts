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

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    const contentType = searchParams.get('contentType');

    let query = supabase
      .from("bookmarks")
      .select(`
        *,
        reading_lists!inner(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (listId) {
      query = query.eq('list_id', listId);
    }
    
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Bookmarks fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Bookmarks GET exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, content_type, content_id, list_id, content_ids, target_list_id } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Single item toggle (Bookmark button)
    if (action === "toggle") {
      if (!content_type || !content_id) {
        return NextResponse.json({ error: "Missing content identifiers" }, { status: 400 });
      }

      // Check if it already exists
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_type", content_type)
        .eq("content_id", content_id)
        .maybeSingle();

      if (existing) {
        // Remove it
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", existing.id);
          
        if (error) throw error;
        return NextResponse.json({ message: "Bookmark removed", status: "removed" });
      } else {
        // Add it to "Read Later" by default if list_id is not provided
        let targetList = list_id;
        if (!targetList) {
          const { data: defaultList } = await supabase
            .from("reading_lists")
            .select("id")
            .eq("user_id", user.id)
            .eq("name", "Read Later")
            .single();
            
          targetList = defaultList?.id;
        }

        if (!targetList) {
           return NextResponse.json({ error: "Read Later list not found" }, { status: 500 });
        }

        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            list_id: targetList,
            content_type,
            content_id
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ message: "Saved to Read Later", status: "added", data });
      }
    }

    // Move single item to a specific list (Currently Reading, Finished Reading, etc)
    if (action === "move") {
      if (!content_type || !content_id || !target_list_id) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      // Supabase UPSERT based on the unique constraint (user_id, content_type, content_id)
      const { data, error } = await supabase
        .from("bookmarks")
        .upsert({
          user_id: user.id,
          list_id: target_list_id,
          content_type,
          content_id,
          created_at: new Date().toISOString()
        }, { onConflict: "user_id,content_type,content_id" })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: "Bookmark moved", status: "moved", data });
    }

    // Bulk Delete
    if (action === "delete_bulk") {
      if (!content_ids || !Array.isArray(content_ids) || content_ids.length === 0) {
        return NextResponse.json({ error: "Missing content_ids array" }, { status: 400 });
      }

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .in("content_id", content_ids);

      if (error) throw error;
      return NextResponse.json({ message: "Bookmarks deleted", status: "success" });
    }

    // Bulk Move
    if (action === "move_bulk") {
      if (!content_ids || !Array.isArray(content_ids) || content_ids.length === 0 || !target_list_id) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      // In PostgREST, to update multiple rows to a single value, we use an update with an in() filter.
      const { error } = await supabase
        .from("bookmarks")
        .update({ list_id: target_list_id })
        .eq("user_id", user.id)
        .in("content_id", content_ids);

      if (error) throw error;
      return NextResponse.json({ message: "Bookmarks moved", status: "success" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Bookmarks POST exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
