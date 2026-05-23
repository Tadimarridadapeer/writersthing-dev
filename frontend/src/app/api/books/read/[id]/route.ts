import { NextResponse } from "next/server";
import { supabase, getSignedUrl } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    // 1. Authenticate User
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // 2. Check Ownership/Access in Library
    const { data: access, error: accessError } = await supabase
      .from("library")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single();

    // Check if user is the author of the book (they should always have access)
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("pdf_path, author_id")
      .eq("id", bookId)
      .single();

    if (!book) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    const isAuthor = book.author_id === user.id;

    if (!access && !isAuthor) {
      return NextResponse.json({ message: "Access denied. Please purchase the book." }, { status: 403 });
    }

    if (!book.pdf_path) {
      return NextResponse.json({ message: "PDF manuscript not found for this book." }, { status: 404 });
    }

    // 3. Generate Signed URL
    const signedUrl = await getSignedUrl(book.pdf_path, "pdfs");

    if (!signedUrl) {
      return NextResponse.json({ message: "Failed to generate access link" }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error("Reader access error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
