import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureAuthorProfile } from "@/lib/author";
import ServerCache from "@/lib/cache";

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

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "Article";
    const now = Date.now();

    if (type === "Article") {
      const { data, error } = await supabase
        .from("articles")
        .select("*, authors:author_id(user_id, users:user_id(name))")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out drafts
      const publishedArticles = data ? data.filter((item: any) => 
        item.content && !item.content.startsWith("[DRAFT]")
      ) : [];

      // Map to frontend-friendly schema (flattening author name and using cover_url)
      const mappedData = publishedArticles.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.content ? item.content.substring(0, 160) + "..." : "No synopsis available.",
        category: item.category || "General",
        cover_url: item.thumbnail_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800",
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author"
        }
      }));

      return NextResponse.json(mappedData);
    } else {
      // Blog
      const { data, error } = await supabase
        .from("blogs")
        .select("*, authors:author_id(user_id, users:user_id(name))")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out drafts
      const publishedBlogs = data ? data.filter((item: any) => 
        item.content && !item.content.startsWith("[DRAFT]")
      ) : [];

      const mappedData = publishedBlogs.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.content ? item.content.substring(0, 160) + "..." : "No synopsis available.",
        category: "Blog",
        cover_url: item.banner_url || "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=800",
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author"
        }
      }));
      return NextResponse.json(mappedData);
    }
  } catch (error: any) {
    console.error("Fetch articles error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // Ensure author profile exists
    const authorProfile = await ensureAuthorProfile(supabase, user.id);

    const { title, description, category, type, coverUrl, tags } = await req.json();

    if (type === "Article") {
      const { data, error } = await supabase
        .from("articles")
        .insert([
          {
            title,
            content: description || "", // Initially use description as content or keep empty
            category: category || "General",
            thumbnail_url: coverUrl || "",
            tags: tags || [],
            author_id: authorProfile.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Invalidate articles cache
      ServerCache.clearArticles();

      return NextResponse.json({ 
        message: `${type} published successfully!`, 
        id: data.id 
      }, { status: 201 });
    } else {
      // Blog
      const { data, error } = await supabase
        .from("blogs")
        .insert([
          {
            title,
            content: description || "", // Initially use description as content or keep empty
            banner_url: coverUrl || "",
            author_id: authorProfile.id
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
    console.error("Post article error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
