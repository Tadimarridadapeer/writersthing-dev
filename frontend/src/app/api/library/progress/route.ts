import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate User
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded: any = token ? verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { bookId, progress } = await req.json();

    if (progress < 0 || progress > 100) {
      return NextResponse.json({ message: "Invalid progress value" }, { status: 400 });
    }

    // 2. Find and Update the library item
    const user = await User.findOneAndUpdate(
      { _id: decoded.id, "library.book": bookId },
      { 
        $set: { 
          "library.$.progress": progress,
          "library.$.lastRead": new Date()
        } 
      },
      { new: true }
    );

    if (!user) {
      // If book not in library, add it (simulating purchase/access logic)
      await User.findByIdAndUpdate(decoded.id, {
        $push: {
          library: {
            book: bookId,
            progress: progress,
            lastRead: new Date(),
          }
        }
      });
    }

    return NextResponse.json({ message: "Progress updated successfully" });
  } catch (error: any) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}
