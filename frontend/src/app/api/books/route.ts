import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ensureAuthorProfile } from "@/lib/author";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Next.js POST /api/books - Received payload:", body);

    const { 
      title, 
      content, 
      description,
      price, 
      coverImage, 
      language, 
      genre, 
      pdfUrl, 
      authorId 
    } = body;

    if (!title || !content) {
      console.warn("Next.js POST /api/books - Missing required title or content fields");
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Ensure author profile exists
    try {
      await ensureAuthorProfile(supabase, authorId);
    } catch (authorError: any) {
      console.error("Next.js POST /api/books - Author profile error:", authorError.message);
      return NextResponse.json({ error: authorError.message }, { status: 400 });
    }

    // Insert into Supabase books table
    const insertPayload = {
      title,
      description: description || content.substring(0, 160),
      category: genre || "Fiction",
      cover_url: coverImage || "",
      pdf_path: pdfUrl || "", // Store the storage path
      price: price || 99,
      author_id: authorId,
      status: "Published",
    };
    
    console.log("Next.js POST /api/books - Submitting insert to Supabase 'books' table:", insertPayload);

    const { data, error } = await supabase
      .from("books")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Next.js POST /api/books - Supabase RLS or database error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Next.js POST /api/books - Successfully created book in Supabase:", data[0]);

    return NextResponse.json({ message: "Book published successfully", book: data[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*, authors:author_id(*, users:user_id(name))")
      .eq("status", "Published")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch books error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
