import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  // Optional: Add authorization header check to ensure only authorized clients/cron can hit this
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find all pending requests where activate_after <= NOW()
    const { data: requests, error: fetchError } = await supabase
      .from("upi_change_requests")
      .select("*")
      .eq("status", "pending")
      .lte("activate_after", new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ success: true, message: "No pending requests to process" });
    }

    let processedCount = 0;

    for (const request of requests) {
      // 2. Update user profile
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          active_upi_id: request.new_upi_id,
          last_upi_change_at: new Date().toISOString()
        })
        .eq("id", request.user_id);

      if (userUpdateError) {
        console.error(`Failed to update user ${request.user_id}:`, userUpdateError);
        continue;
      }

      // 3. Update request status
      await supabase
        .from("upi_change_requests")
        .update({ status: "completed" })
        .eq("id", request.id);

      // 4. Log audit trail
      await supabase.from("upi_audit_logs").insert({
        user_id: request.user_id,
        action: "activated",
        previous_upi: request.old_upi_id,
        new_upi: request.new_upi_id,
        status: "completed",
        ip_address: "system",
        device_info: "cron"
      });

      processedCount++;
    }

    return NextResponse.json({ success: true, message: `Processed ${processedCount} UPI change requests` });
  } catch (error: any) {
    console.error("UPI Cron processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
