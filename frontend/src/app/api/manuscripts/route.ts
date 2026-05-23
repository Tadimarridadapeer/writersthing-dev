import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Book from "@/models/Book";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate User
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded || decoded.role !== "Author") {
      return NextResponse.json({ message: "Only authors can create manuscripts" }, { status: 403 });
    }

    const { title, description, category } = await req.json();

    // 2. Create Blank Manuscript
    const book = await Book.create({
      title: title || "Untitled Manuscript",
      description: description || "An upcoming literary masterpiece.",
      content: "", // Initial empty content
      author: decoded.id,
      category: category || "Uncategorized",
      isPublished: false,
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    console.error("Manuscript creation error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create manuscript" },
      { status: 500 }
    );
  }
}
