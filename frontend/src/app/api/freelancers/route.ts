import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    // Use service role key to bypass RLS since the users table might not be readable to anon users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch users who have an accepted founding_writers record
    const { data, error } = await supabase
      .from("founding_writers")
      .select(`
        id,
        full_name,
        email_address,
        user_id,
        users:user_id (
          id,
          name,
          email,
          avatar_url,
          bio
        )
      `)
      .eq("status", "Accepted");

    if (error) {
      throw error;
    }

    // Map the response to a clean freelancer profile structure
    const freelancers = data.map((record: any) => {
      // In Supabase JS, one-to-one could return object or array depending on schema. 
      // Handle both cases just in case.
      const userObj = Array.isArray(record.users) ? record.users[0] : record.users;
      const user = userObj || {};
      
      return {
        id: user.id || record.user_id || record.id,
        name: user.name || record.full_name,
        email: user.email || record.email_address,
        avatar_url: user.avatar_url || "",
        bio: user.bio || "Official Founding Writer at Writer's Thing.",
        skills: ["Writing", "Editing", "Proofreading"], // Default skills since we don't have a skills column
      };
    });

    return NextResponse.json({ data: freelancers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch freelancers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
