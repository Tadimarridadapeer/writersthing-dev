import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendHireRequestEmail } from "@/lib/email";

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
    const { 
      writer_id, 
      full_name, 
      email_address, 
      project_category, 
      project_summary, 
      phone_number, 
      budget_min, 
      budget_max, 
      expected_deadline 
    } = body;

    if (!writer_id || !full_name || !email_address || !project_category || !project_summary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert into hire_requests
    const { data: requestData, error: insertError } = await supabase
      .from("hire_requests")
      .insert({
        sender_id: user.id,
        writer_id,
        full_name,
        email_address,
        project_category,
        project_summary,
        phone_number: phone_number || null,
        budget_min: budget_min ? parseFloat(budget_min) : null,
        budget_max: budget_max ? parseFloat(budget_max) : null,
        expected_deadline: expected_deadline || null,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch writer details for the email using Service Role Key (bypasses RLS)
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let writerEmail = null;
    let writerName = "Writer";

    const { data: userData } = await adminSupabase
      .from("users")
      .select("name, email")
      .eq("id", writer_id)
      .maybeSingle();

    if (userData && userData.email) {
      writerEmail = userData.email;
      writerName = userData.name || writerName;
    } else {
      // Fallback to check if it's a founding_writers ID
      const { data: founderData } = await adminSupabase
        .from("founding_writers")
        .select("full_name, email_address")
        .eq("id", writer_id)
        .maybeSingle();
        
      if (founderData && founderData.email_address) {
        writerEmail = founderData.email_address;
        writerName = founderData.full_name || writerName;
      }
    }

    if (writerEmail) {
      // Send notification email to writer
      try {
        const res = await sendHireRequestEmail(
          writerEmail,
          writerName,
          full_name || "A Client",
          project_category,
          project_summary
        );
        if (!res.success) console.error("Failed to send hire request email:", res.error);
      } catch (emailErr) {
        console.error("Hire request email exception:", emailErr);
      }
    }

    return NextResponse.json({ success: true, data: requestData }, { status: 201 });
  } catch (error: any) {
    console.error("Submit hire request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
