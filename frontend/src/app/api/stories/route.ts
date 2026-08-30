import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureAuthorProfile } from "@/lib/author";
import ServerCache from "@/lib/cache";

function extractDescription(content: string) {
  if (!content) return "No synopsis available.";
  const plainText = content.replace(/<[^>]*>?/gm, '').trim();
  return plainText.length > 0 ? plainText.substring(0, 160) + "..." : "No synopsis available.";
}

import { getFallbackImage } from "@/lib/fallbacks";

function extractFirstImage(content: string, category: string, id: string, useFallback: boolean = true) {
  if (!content) return useFallback ? getFallbackImage(category, id) : null;
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : (useFallback ? getFallbackImage(category, id) : null);
}

import { createClient } from "@supabase/supabase-js";

function getTrueSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

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
      },
    }
  );
}

import { getPagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "Story";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const { from, to } = getPagination(page, limit);

    if (type === "Story") {
      let query = supabase
        .from("stories")
        .select("id, title, body, category, cover_image, created_at, author_id, authors:author_id(user_id, users!authors_user_id_fkey(name))")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (search) {
        const s = `%${search}%`;
        query = query.or(`title.ilike.${s},body.ilike.${s},category.ilike.${s}`);
      }
      if (category) {
        const categories = category.split(",").map(c => c.trim()).filter(Boolean);
        if (categories.length > 0) {
          query = query.in("category", categories);
        }
      }

      const { data, error } = await query.range(from, to);
      if (error) throw error;

      let hasMore = false;
      let returnData = data || [];
      if (returnData.length > limit) {
        hasMore = true;
        returnData = returnData.slice(0, limit);
      }

      const mappedData = returnData.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: "Story",
        description: extractDescription(item.body),
        category: item.category || "General",
        cover_url: item.cover_image || extractFirstImage(item.body, item.category || "General", item.id, false),
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author",
          user_id: item.authors?.user_id
        }
      }));

      return NextResponse.json({
        data: mappedData,
        hasMore,
        nextPage: hasMore ? page + 1 : null
      }, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
    } else {
      let query = supabase
        .from("blogs")
        .select("id, title, content, banner_url, created_at, author_id, authors:author_id(user_id, users!authors_user_id_fkey(name))")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (search) {
        const s = `%${search}%`;
        query = query.or(`title.ilike.${s},content.ilike.${s}`);
      }
      if (category) {
        const categories = category.split(",").map(c => c.trim()).filter(Boolean);
        if (categories.length > 0) {
          query = query.in("category", categories);
        }
      }

      const { data, error } = await query.range(from, to);
      if (error) throw error;

      let hasMore = false;
      let returnData = data || [];
      if (returnData.length > limit) {
        hasMore = true;
        returnData = returnData.slice(0, limit);
      }

      const mappedData = returnData.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: "Blog",
        description: extractDescription(item.content),
        category: "Blog",
        cover_url: item.banner_url || extractFirstImage(item.content, "Blog", item.id),
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author",
          user_id: item.authors?.user_id
        }
      }));

      return NextResponse.json({
        data: mappedData,
        hasMore,
        nextPage: hasMore ? page + 1 : null
      }, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
    }
  } catch (error: any) {
    console.error("Fetch stories error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    // Mock user for testing if not authenticated
    const userId = user?.id || "mock-user-123";

    // Ensure author profile exists
    const authorProfile = await ensureAuthorProfile(supabase, userId);

    const { title, description, content, category, type, coverUrl, cover_image: coverImageField, status } = await req.json();
    const resolvedCoverUrl = coverUrl || coverImageField || "";
    const supabaseAdmin = getTrueSupabaseAdmin();

    if (type === "Story") {
      const slug = title
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now()
        : "story-" + Date.now();

      const { data, error } = await supabaseAdmin
        .from("stories")
        .insert([
          {
            title,
            slug,
            body: content || description || "",
            category: category || "General",
            ...(resolvedCoverUrl ? { cover_image: resolvedCoverUrl } : {}),
            author_id: authorProfile.id,
            status: status || (req.headers.get("X-Publish") === "true" ? "Published" : "Draft")
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Invalidate stories cache
      ServerCache.clearStories();

      return NextResponse.json({ 
        message: `${type} published successfully!`, 
        id: data.id 
      }, { status: 201 });
    } else {
      // Blog
      const { data, error } = await supabaseAdmin
        .from("blogs")
        .insert([
          {
            title,
            content: content || description || "",
            ...(resolvedCoverUrl ? { banner_url: resolvedCoverUrl } : {}),
            author_id: authorProfile.id,
            status: status || (req.headers.get("X-Publish") === "true" ? "Published" : "Draft")
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Invalidate blogs cache
      ServerCache.clearBlogs();

      return NextResponse.json({ 
        message: `${type} published successfully!`, 
        id: data.id 
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Post story error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    // Mock user for testing if not authenticated
    const userId = user?.id || "mock-user-123";

    const authorProfile = await ensureAuthorProfile(supabase, userId);
    const { id, title, description, content, category, type, coverUrl, cover_image: coverImageField } = await req.json();
    const putCoverUrl = coverUrl || coverImageField || "";

    if (!id) {
      return NextResponse.json({ message: "ID is required for update" }, { status: 400 });
    }

    const isPublishing = req.headers.get("X-Publish") === "true";
    const supabaseAdmin = getTrueSupabaseAdmin();

    if (type === "Story") {
      const { data, error } = await supabaseAdmin
        .from("stories")
        .update({
          title,
          body: content || description || "",
          category: category || "General",
          ...(putCoverUrl ? { cover_image: putCoverUrl } : {}),
          ...(isPublishing ? { status: "Published" } : {})
        })
        .eq("id", id)
        .eq("author_id", authorProfile.id)
        .select()
        .single();

      if (error) throw error;
      ServerCache.clearStories();
      return NextResponse.json({ message: `${type} updated successfully!`, id: data.id }, { status: 200 });
    } else {
      // Blog
      const { data, error } = await supabaseAdmin
        .from("blogs")
        .update({
          title,
          content: content || description || "",
          ...(putCoverUrl ? { banner_url: putCoverUrl } : {}),
          ...(isPublishing ? { status: "Published" } : {})
        })
        .eq("id", id)
        .eq("author_id", authorProfile.id)
        .select()
        .single();

      if (error) throw error;
      ServerCache.clearBlogs();
      return NextResponse.json({ message: `${type} updated successfully!`, id: data.id }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Put story/blog error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
