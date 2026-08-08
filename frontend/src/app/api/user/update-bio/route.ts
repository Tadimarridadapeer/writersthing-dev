import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId, bio } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (bio && bio.length > 5000) {
      return NextResponse.json({ error: "Bio is too long" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("users")
      .update({ bio })
      .eq("id", userId);

    if (error) {
      console.error("Failed to update bio:", error);
      // If the column doesn't exist, we might get a specific error code.
      if (error.code === '42703') { // undefined_column
        return NextResponse.json({ error: "The 'bio' column does not exist in the database. Please run the database migration." }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to update bio" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Bio updated successfully" });
  } catch (error: any) {
    console.error("Bio Update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
