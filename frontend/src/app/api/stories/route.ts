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

function extractFirstImage(content: string, defaultImage: string) {
  if (!content) return defaultImage;
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : defaultImage;
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

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "Story";
    const now = Date.now();

    if (type === "Story") {
      const { data, error } = await supabase
        .from("stories")
        .select("*, authors:author_id(user_id, users:user_id(name))")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out drafts
      const publishedStories = data ? data.filter((item: any) => 
        item.content && !item.content.startsWith("[DRAFT]")
      ) : [];

      // Map to frontend-friendly schema (flattening author name and using cover_url)
      const mappedData = publishedStories.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: extractDescription(item.content),
        category: item.category || "General",
        cover_url: item.thumbnail_url || extractFirstImage(item.content, "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800"),
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author",
          user_id: item.authors?.user_id
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
        description: extractDescription(item.content),
        category: "Blog",
        cover_url: item.banner_url || extractFirstImage(item.content, "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=800"),
        created_at: item.created_at,
        authors: {
          name: item.authors?.users?.name || "Unknown Author",
          user_id: item.authors?.user_id
        }
      }));
      return NextResponse.json(mappedData);
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

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // Ensure author profile exists
    const authorProfile = await ensureAuthorProfile(supabase, user.id);

    const { title, description, content, category, type, coverUrl, tags } = await req.json();

    if (type === "Story") {
      const { data, error } = await supabase
        .from("stories")
        .insert([
          {
            title,
            content: content || description || "", // Initially use content
            category: category || "General",
            thumbnail_url: coverUrl || "",
            tags: tags || [],
            author_id: authorProfile.id
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
      const { data, error } = await supabase
        .from("blogs")
        .insert([
          {
            title,
            content: content || description || "", // Initially use content
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
    console.error("Post story error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
