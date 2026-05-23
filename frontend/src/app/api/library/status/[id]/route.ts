import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // 1. Authenticate User
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Find User and specific library item
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const libraryItem = user.library.find((item: any) => item.book.toString() === id);

    if (!libraryItem) {
      // If book isn't in library, return default 0 progress
      return NextResponse.json({
        progress: 0,
        bookmarks: [],
        isInLibrary: false,
      });
    }

    return NextResponse.json({
      progress: libraryItem.progress,
      bookmarks: libraryItem.bookmarks,
      isInLibrary: true,
      lastRead: libraryItem.lastRead,
    });
  } catch (error: any) {
    console.error("Library status fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}
