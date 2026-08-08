import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use admin client to safely check and link invites via email, bypassing RLS
const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    
    // Create standard client to verify user
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const supabaseAdmin = getAdminSupabase();

    // Find any pending invitations for this user's email
    const { data: invite, error } = await supabaseAdmin
      .from("founding_writers")
      .select("*")
      .eq("email_address", user.email)
      .eq("status", "pending")
      .maybeSingle();

    if (error) throw error;
    
    if (invite) {
      // 1. Link user_id if not linked
      if (invite.user_id !== user.id) {
        await supabaseAdmin.from("founding_writers").update({ user_id: user.id }).eq("id", invite.id);
      }

      // 2. Ensure a notification exists
      const { data: notifCheck } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "founder_invite")
        .maybeSingle();

      if (!notifCheck) {
        await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "founder_invite",
          content: "Writersthing invited you to become a Founding Writer.",
          target_url: "/profile",
          is_read: false
        });
      }
    }

    return NextResponse.json({ invite });
  } catch (error: any) {
    console.error("GET invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, invite_id } = body; // action: 'accept' or 'decline'

    if (!action || !invite_id) {
      return NextResponse.json({ error: "Action and invite_id required" }, { status: 400 });
    }

    // Verify user
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const supabaseAdmin = getAdminSupabase();

    // Verify invite belongs to user
    const { data: invite, error: fetchErr } = await supabaseAdmin
      .from("founding_writers")
      .select("*")
      .eq("id", invite_id)
      .eq("email_address", user.email)
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invitation already processed" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    if (action === "accept") {
      await supabaseAdmin
        .from("founding_writers")
        .update({ status: "accepted", accepted_at: timestamp })
        .eq("id", invite_id);

      // Add founder badge to user
      await supabaseAdmin
        .from("user_badges")
        .upsert({
          user_id: user.id,
          badge_type: "founding_writer",
          badge_number: invite.founder_number
        }, { onConflict: "user_id, badge_type" });

    } else if (action === "decline") {
      await supabaseAdmin
        .from("founding_writers")
        .update({ status: "declined", declined_at: timestamp })
        .eq("id", invite_id);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Mark the notification as read
    await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("type", "founder_invite");

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error("POST invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
