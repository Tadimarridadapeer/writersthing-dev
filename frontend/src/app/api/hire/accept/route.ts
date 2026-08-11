import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendHireRequestAcceptedEmail } from "@/lib/email";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { request_id } = body;

    if (!request_id) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    // Verify ownership and update status
    const { data: hireReq, error: fetchError } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("id", request_id)
      .eq("writer_id", user.id)
      .single();

    if (fetchError || !hireReq) {
      return NextResponse.json({ error: "Request not found or unauthorized" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update({ status: 'Accepted', updated_at: new Date().toISOString() })
      .eq("id", request_id);

    if (updateError) {
      throw updateError;
    }

    // Fetch writer and client details
    const { data: writerData } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", hireReq.writer_id)
      .single();

    // Now send emails sharing contact details to both parties
    if (writerData && writerData.email) {
      // 1. Send email to writer with client details
      await sendHireRequestAcceptedEmail(
        writerData.email,
        true,
        hireReq.full_name,
        hireReq.email_address,
        hireReq.phone_number,
        hireReq.project_category
      );
      
      // 2. Send email to client with writer details
      await sendHireRequestAcceptedEmail(
        hireReq.email_address,
        false,
        writerData.name || 'Your Writer',
        writerData.email,
        null, // Writers don't have phone numbers in users table yet, or we don't expose it
        hireReq.project_category
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Accept hire request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
