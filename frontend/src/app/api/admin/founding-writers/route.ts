import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendFounderInviteEmail } from "@/lib/email";

// Helper for admin client
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
    const supabase = getAdminSupabase();
    
    // Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Assuming simple authorization validation would happen via middleware, 
    // but here we just fetch all founding writers since this is an admin route.

    const { data, error } = await supabase
      .from("founding_writers")
      .select("*")
      .order("invited_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Generate founder number (e.g., #0012)
    const { count } = await supabase
      .from("founding_writers")
      .select("*", { count: "exact", head: true });
      
    const currentCount = count || 0;
    
    // Check limit
    if (currentCount >= 100) {
      return NextResponse.json({ error: "Founding Writers program is full (100 max)." }, { status: 400 });
    }

    const founder_number = `#${String(currentCount + 1).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("founding_writers")
      .insert({
        name,
        email_address: email.toLowerCase(),
        founder_number,
        status: "pending",
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "This email has already been invited." }, { status: 400 });
      }
      throw error;
    }

    try {
      await sendFounderInviteEmail(email, name);
    } catch (error) {
      console.error("Founder invite email exception:", error);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("founding_writers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
