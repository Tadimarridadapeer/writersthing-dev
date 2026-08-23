import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json({ error: "Email and userId are required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase admin credentials");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if user is in founding_writers and Invited
    const { data: founderData, error: founderError } = await supabaseAdmin
      .from("founding_writers")
      .select("founder_number, status")
      .eq("email_address", email)
      .single();

    if (founderError || !founderData) {
      // Auto-provision if they are a verified writer in the users table
      const { data: userRecord } = await supabaseAdmin.from('users').select('is_verified_writer, name').eq('id', userId).single();
      if (userRecord && userRecord.is_verified_writer) {
        const { data: allFounders } = await supabaseAdmin.from('founding_writers').select('founder_number');
        let currentCount = 0;
        if (allFounders && allFounders.length > 0) {
           currentCount = Math.max(...allFounders.map(f => f.founder_number).filter(n => typeof n === 'number'));
        }
        if (currentCount < 0 || !isFinite(currentCount)) currentCount = allFounders?.length || 0;
        
        const newFounderNumber = currentCount + 1;
        
        await supabaseAdmin.from('founding_writers').insert({
          full_name: userRecord.name,
          email_address: email,
          status: 'Accepted',
          user_id: userId,
          founder_number: newFounderNumber,
          accepted_at: new Date().toISOString()
        });
        
        await supabaseAdmin.from("user_badges").upsert({
          user_id: userId,
          badge_type: "founding_writer",
          badge_number: newFounderNumber,
        }, { onConflict: "user_id, badge_type" });
        
        return NextResponse.json({ 
          isFounder: true, 
          founderNumber: newFounderNumber, 
          justAccepted: true 
        });
      }

      return NextResponse.json({ isFounder: false });
    }

    // If already accepted, we don't need to show the welcome modal again
    if (founderData.status === "Accepted") {
      return NextResponse.json({ 
        isFounder: true, 
        founderNumber: founderData.founder_number, 
        justAccepted: false 
      });
    }

    if (founderData.status === "Invited") {
      // 2. Update status to Accepted
      await supabaseAdmin
        .from("founding_writers")
        .update({ status: "Accepted" })
        .eq("email_address", email);

      // 3. Add to user_badges so it's globally visible
      await supabaseAdmin
        .from("user_badges")
        .upsert({
          user_id: userId,
          badge_type: "founding_writer",
          badge_number: founderData.founder_number,
        }, { onConflict: "user_id, badge_type" });

      return NextResponse.json({ 
        isFounder: true, 
        founderNumber: founderData.founder_number, 
        justAccepted: true 
      });
    }

    return NextResponse.json({ isFounder: false });
  } catch (error: any) {
    console.error("Error syncing founding writer status:", error);
    return NextResponse.json({ error: "Failed to sync status" }, { status: 500 });
  }
}
