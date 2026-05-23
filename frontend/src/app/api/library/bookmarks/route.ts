import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate User
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { bookId, bookmarkId } = await req.json();

    // 2. Add bookmark to the library item
    const user = await User.findOneAndUpdate(
      { _id: decoded.id, "library.book": bookId },
      { $addToSet: { "library.$.bookmarks": bookmarkId } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "Book not found in library" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bookmark added successfully" });
  } catch (error: any) {
    console.error("Bookmark add error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to add bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { bookId, bookmarkId } = await req.json();

    // Remove bookmark
    const user = await User.findOneAndUpdate(
      { _id: decoded.id, "library.book": bookId },
      { $pull: { "library.$.bookmarks": bookmarkId } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "Book not found in library" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bookmark removed successfully" });
  } catch (error: any) {
    console.error("Bookmark removal error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}
