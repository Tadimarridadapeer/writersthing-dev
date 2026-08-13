import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: author, error } = await supabaseAdmin
      .from("authors")
      .select("upi_id, last_upi_changed_at, upi_verified")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // Ignore no row error
      throw error;
    }

    return NextResponse.json(author || { upi_id: null, last_upi_changed_at: null, upi_verified: false }, { status: 200 });
  } catch (error: any) {
    console.error("UPI GET error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, upiId } = await req.json();

    if (!userId || !upiId) {
      return NextResponse.json({ message: "User ID and UPI ID are required" }, { status: 400 });
    }

    // Basic UPI validation
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return NextResponse.json({ message: "Invalid UPI ID format" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check last update time
    const { data: author, error: fetchError } = await supabaseAdmin
      .from("authors")
      .select("last_upi_changed_at")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (author?.last_upi_changed_at) {
      const lastUpdate = new Date(author.last_upi_changed_at);
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

      if (daysSinceUpdate < 30) {
        return NextResponse.json(
          { message: `You can only update your UPI ID once every 30 days. Next update allowed in ${Math.ceil(30 - daysSinceUpdate)} days.` },
          { status: 403 }
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("authors")
      .update({
        upi_id: upiId,
        last_upi_changed_at: new Date().toISOString(),
        upi_verified: false // Require re-verification (e.g. penny drop) if changed
      })
      .eq("user_id", userId);

    if (updateError) {
      // If author doesn't exist yet, we should create it
      const { error: insertError } = await supabaseAdmin
        .from("authors")
        .insert({
          user_id: userId,
          upi_id: upiId,
          last_upi_changed_at: new Date().toISOString(),
          upi_verified: false
        });
        
      if (insertError) throw insertError;
    }

    return NextResponse.json({ message: "UPI ID updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("UPI POST error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
