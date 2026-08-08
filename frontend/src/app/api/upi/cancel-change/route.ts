import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find pending request
    const { data: requests, error: fetchError } = await supabase
      .from("upi_change_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (fetchError || !requests || requests.length === 0) {
      return NextResponse.json({ error: "No pending UPI change request found" }, { status: 404 });
    }

    const request = requests[0];

    // 2. Mark request as cancelled
    const { error: cancelError } = await supabase
      .from("upi_change_requests")
      .update({ status: "cancelled" })
      .eq("id", request.id);

    if (cancelError) {
      return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
    }

    // 3. Log audit trail
    await supabase.from("upi_audit_logs").insert({
      user_id: userId,
      action: "cancelled",
      previous_upi: request.old_upi_id,
      new_upi: request.new_upi_id,
      status: "cancelled",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      device_info: req.headers.get("user-agent") || "unknown"
    });

    return NextResponse.json({ success: true, message: "UPI change request cancelled successfully" });
  } catch (error: any) {
    console.error("UPI Cancel Change error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
