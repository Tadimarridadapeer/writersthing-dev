import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendHireRequestNotificationEmail } from "@/lib/email";

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

    // Fetch writer details for the email
    const { data: writerData } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", writer_id)
      .single();

    if (writerData && writerData.email) {
      // Send notification email to writer
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const acceptUrl = `${baseUrl}/dashboard/requests/${requestData.id}`;
      
      await sendHireRequestNotificationEmail(
        writerData.email,
        writerData.name || 'Writer',
        full_name,
        project_category,
        budget_min ? parseFloat(budget_min) : null,
        budget_max ? parseFloat(budget_max) : null,
        expected_deadline || 'Not specified',
        project_summary,
        acceptUrl
      );
    }

    return NextResponse.json({ success: true, data: requestData }, { status: 201 });
  } catch (error: any) {
    console.error("Submit hire request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
