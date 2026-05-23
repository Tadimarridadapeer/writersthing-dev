import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Insert into Supabase books table
    const { data, error } = await supabase
      .from("books")
      .insert([
        {
          title,
          description: description || content.substring(0, 160),
          category: genre || "Fiction",
          cover_url: coverImage || "",
          pdf_path: pdfUrl || "", // Store the storage path
          price: price || 99,
          author_id: authorId,
          status: "Published",
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
      .select("*, authors:author_id(name)")
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
