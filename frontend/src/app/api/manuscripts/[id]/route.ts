import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Try finding in books table
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (book) {
      if (book.author_id !== user.id) {
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
        updatedAt: book.updated_at
      });
    }

    // 2. Try finding in articles table
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (article) {
      if (article.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      return NextResponse.json({
        title: article.title,
        content: article.content || "",
        updatedAt: article.updated_at
      });
    }

    // 3. Try finding in blogs table
    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (blog) {
      if (blog.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      return NextResponse.json({
        title: blog.title,
        content: blog.content || "",
        updatedAt: blog.updated_at
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

    const { title, content } = await req.json();
    const { id } = await params;

    // 1. Try finding in books table
    const { data: book } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (book) {
      if (book.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      let pdf_path = book.pdf_path;
      
      // Save content to storage if it's not a PDF (we use .txt for live editor)
      if (!pdf_path || !pdf_path.endsWith(".pdf")) {
        pdf_path = pdf_path || `${user.id}/${id}-content.txt`;
        const blob = new Blob([content], { type: "text/plain" });
        const file = new File([blob], "content.txt", { type: "text/plain" });
        
        const { error: uploadError } = await supabase.storage
          .from("books")
          .upload(pdf_path, file, { upsert: true });
          
        if (uploadError) {
          throw new Error("Failed to save content to storage: " + uploadError.message);
        }
      }

      const { data: updatedBook, error: updateError } = await supabase
        .from("books")
        .update({ 
          title, 
          pdf_path,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        title: updatedBook.title,
        content,
        updatedAt: updatedBook.updated_at
      });
    }

    // 2. Try finding in articles table
    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (article) {
      if (article.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      const { data: updatedArticle, error: updateError } = await supabase
        .from("articles")
        .update({ 
          title, 
          content,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        title: updatedArticle.title,
        content: updatedArticle.content || "",
        updatedAt: updatedArticle.updated_at
      });
    }

    // 3. Try finding in blogs table
    const { data: blog } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (blog) {
      if (blog.author_id !== user.id) {
        return NextResponse.json({ message: "Unauthorized access to this manuscript" }, { status: 403 });
      }

      const { data: updatedBlog, error: updateError } = await supabase
        .from("blogs")
        .update({ 
          title, 
          content,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        title: updatedBlog.title,
        content: updatedBlog.content || "",
        updatedAt: updatedBlog.updated_at
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
