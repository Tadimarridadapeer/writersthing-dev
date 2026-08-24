import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    
    // Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace("Bearer ", "").trim();
    // Verify admin
    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get ALL users
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id");

    if (usersError || !allUsers) {
      throw new Error("Failed to fetch users");
    }

    // Insert a notification for every user
    const notifications = allUsers.map(u => ({
      user_id: u.id,
      actor_id: user.id, // Admin sending it
      type: "system_message",
      target_type: "broadcast",
      target_id: "broadcast",
      is_read: false,
      metadata: { text: message }
    }));

    // Batch insert in chunks to avoid overwhelming Postgres if there are many users
    const chunkSize = 500;
    for (let i = 0; i < notifications.length; i += chunkSize) {
      const chunk = notifications.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(chunk);
      
      if (insertError) {
        console.error("Batch insert error:", insertError);
        throw new Error("Failed to insert some notifications");
      }
    }

    return NextResponse.json({ success: true, broadcastCount: notifications.length });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
