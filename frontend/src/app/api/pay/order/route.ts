import { NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // 1. Authenticate User via Supabase
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const { bookId, amount } = await req.json();

    // 2. Create Razorpay Order
    const options = {
      amount: (amount || 99) * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 3. Save Pending Transaction in Supabase
    const { error: dbError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: user.id,
          book_id: bookId,
          amount: amount || 99,
          razorpay_order_id: order.id,
          status: "Pending",
        },
      ]);

    if (dbError) {
      console.error("Order save error:", dbError.message);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
