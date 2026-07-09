import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

function getSupabaseAdmin() {
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    // Retrieve the user session if available, but do not reject immediately
    const { data: { user } } = await supabase.auth.getUser();

    const { id } = await params;

    // Run lookups in parallel to minimize database connection overhead and roundtrips
    const [bookRes, storyRes, blogRes] = await Promise.all([
      supabase.from("books").select("*").eq("id", id).maybeSingle(),
      supabase.from("stories").select("*, authors:author_id(user_id, users:user_id(name))").eq("id", id).maybeSingle(),
      supabase.from("blogs").select("*, authors:author_id(user_id, users:user_id(name))").eq("id", id).maybeSingle()
    ]);

    // Check books first (requires the viewer to be the author)
    if (bookRes.data) {
      const book = bookRes.data;
      if (!user || book.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      let content = "";
      if (book.pdf_path && book.pdf_path.endsWith(".txt")) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("books")
          .download(book.pdf_path);
        
        if (fileData) {
          content = await fileData.text();
        }
      }

      return NextResponse.json({
        title: book.title,
        content,
        updatedAt: book.updated_at,
        type: "book",
        status: book.status || "Draft"
      });
    }

    // Check stories (publicly readable)
    if (storyRes.data) {
      const story = storyRes.data;
      return NextResponse.json({
        title: story.title,
        content: story.content || "",
        updatedAt: story.created_at,
        category: story.category || "General",
        author: story.authors?.users?.name || story.authors?.name || "Writersthing Author",
        authorId: story.author_id,
        type: "story",
        cover_url: story.thumbnail_url
      });
    }

    // Check blogs (publicly readable)
    if (blogRes.data) {
      const blog = blogRes.data;
      return NextResponse.json({
        title: blog.title,
        content: blog.content || "",
        updatedAt: blog.created_at,
        category: blog.category || "General",
        author: blog.authors?.users?.name || blog.authors?.name || "Writersthing Author",
        authorId: blog.author_id,
        type: "blog",
        cover_url: blog.banner_url
      });
    }

    return NextResponse.json({ message: "Manuscript not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Manuscript fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch manuscript" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await params;
    const body = await req.json();
    const { title, content, status } = body;
    console.log("[API MANUSCRIPTS PATCH] Payload:", { id, title, contentLength: content ? content.length : 0, contentPreview: content ? content.substring(0, 100) : "", status });

    // Determine which table this manuscript belongs to (parallel lookup using admin client)
    const [bookRes, storyRes, blogRes] = await Promise.all([
      supabaseAdmin.from("books").select("id, author_id, pdf_path").eq("id", id).maybeSingle(),
      supabaseAdmin.from("stories").select("id, author_id").eq("id", id).maybeSingle(),
      supabaseAdmin.from("blogs").select("id, author_id").eq("id", id).maybeSingle()
    ]);

    const now = new Date().toISOString();

    // ── Handle Books ──────────────────────────────────────────
    if (bookRes.data) {
      const book = bookRes.data;

      // Books store author_id = users.id, so explicit check is reliable
      if (book.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      // Upload content to Supabase Storage as a .txt file
      if (content !== undefined) {
        let txtPath = book.pdf_path;
        if (!txtPath || !txtPath.endsWith(".txt")) {
          txtPath = `${user.id}/${id}-manuscript.txt`;
        }

        const blob = new Blob([content], { type: "text/plain" });
        const { error: uploadError } = await supabaseAdmin.storage
          .from("books")
          .upload(txtPath, blob, { upsert: true });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { message: "Failed to save content: " + uploadError.message },
            { status: 500 }
          );
        }

        // Persist the txt path if it was newly created
        if (txtPath !== book.pdf_path) {
          await supabaseAdmin.from("books").update({ pdf_path: txtPath }).eq("id", id);
        }
      }

      // Update book metadata (title, status, updated_at)
      const updateData: Record<string, any> = { updated_at: now };
      if (title !== undefined) updateData.title = title;
      if (status !== undefined) updateData.status = status;

      const { error: updateError } = await supabaseAdmin
        .from("books")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      return NextResponse.json({
        message: "Book saved successfully",
        type: "book",
        updatedAt: now
      });
    }

    // ── Handle Stories ───────────────────────────────────────
    if (storyRes.data) {
      const story = storyRes.data;

      // Explicit author authorization check
      const { data: authorData } = await supabaseAdmin
        .from("authors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!authorData || story.author_id !== authorData.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("stories")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Invalidate stories cache
      ServerCache.clearStories();

      return NextResponse.json({
        message: "Story saved successfully",
        type: "story",
        updatedAt: now
      });
    }

    // ── Handle Blogs ──────────────────────────────────────────
    if (blogRes.data) {
      const blog = blogRes.data;

      // Explicit author authorization check
      const { data: authorData } = await supabaseAdmin
        .from("authors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!authorData || blog.author_id !== authorData.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("blogs")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Invalidate blogs cache
      ServerCache.clearBlogs();

      return NextResponse.json({
        message: "Blog saved successfully",
        type: "blog",
        updatedAt: now
      });
    }

    return NextResponse.json({ message: "Manuscript not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Manuscript update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update manuscript" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await params;

    // Determine which table this manuscript belongs to
    const [bookRes, storyRes, blogRes] = await Promise.all([
      supabaseAdmin.from("books").select("id, author_id, pdf_path").eq("id", id).maybeSingle(),
      supabaseAdmin.from("stories").select("id, author_id").eq("id", id).maybeSingle(),
      supabaseAdmin.from("blogs").select("id, author_id").eq("id", id).maybeSingle()
    ]);

    // Handle Books
    if (bookRes.data) {
      if (bookRes.data.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      
      const { error } = await supabaseAdmin.from("books").delete().eq("id", id);
      if (error) throw error;
      
      if (bookRes.data.pdf_path) {
        await supabaseAdmin.storage.from("books").remove([bookRes.data.pdf_path]);
      }
      return NextResponse.json({ message: "Book deleted successfully" });
    }

    // Handle Stories
    if (storyRes.data) {
      const { data: authorData } = await supabaseAdmin.from("authors").select("id").eq("user_id", user.id).maybeSingle();
      if (!authorData || storyRes.data.author_id !== authorData.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      
      const { error } = await supabaseAdmin.from("stories").delete().eq("id", id);
      if (error) throw error;
      ServerCache.clearStories();
      return NextResponse.json({ message: "Story deleted successfully" });
    }

    // Handle Blogs
    if (blogRes.data) {
      const { data: authorData } = await supabaseAdmin.from("authors").select("id").eq("user_id", user.id).maybeSingle();
      if (!authorData || blogRes.data.author_id !== authorData.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      
      const { error } = await supabaseAdmin.from("blogs").delete().eq("id", id);
      if (error) throw error;
      ServerCache.clearBlogs();
      return NextResponse.json({ message: "Blog deleted successfully" });
    }

    return NextResponse.json({ message: "Manuscript not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Manuscript delete error:", error);
    return NextResponse.json({ message: error.message || "Failed to delete manuscript" }, { status: 500 });
  }
}
