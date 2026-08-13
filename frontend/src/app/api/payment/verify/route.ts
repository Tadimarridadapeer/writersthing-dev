import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for secure backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      amount,
      projectId,
      cartItems
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 1. Idempotency Check: Prevent duplicate payments
    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("payment_id", razorpay_payment_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected for new payments
      console.error("Error checking existing payment:", checkError);
      return NextResponse.json(
        { error: "Database error during duplicate check" },
        { status: 500 }
      );
    }

    if (existingPayment) {
      // Payment already processed (e.g., webhook and client both fired)
      return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    // Payment is valid and new.

    // 2. Determine if it's a multi-item cart or single item
    const itemsToProcess = cartItems || (projectId ? [{ id: projectId }] : []);
    
    let totalVerifiedAmount = 0;
    const orderItemsToInsert = [];
    const libraryInserts = [];

    // 3. Fetch verified book prices and authors from DB
    if (itemsToProcess.length > 0) {
      const bookIds = itemsToProcess.map((i: any) => i.id);
      const { data: books, error: booksError } = await supabaseAdmin
        .from("books")
        .select("id, price, author_id")
        .in("id", bookIds);

      if (booksError || !books) {
        console.error("Error fetching books for verification:", booksError);
        return NextResponse.json({ error: "Failed to verify book details" }, { status: 500 });
      }

      for (const book of books) {
        const bookPrice = Number(book.price || 0);
        totalVerifiedAmount += bookPrice;
        
        const comm = bookPrice * 0.10;
        const writerCut = bookPrice * 0.90;

        orderItemsToInsert.push({
          book_id: book.id,
          author_id: book.author_id,
          amount: bookPrice,
          commission_amount: comm,
          writer_amount: writerCut,
          payout_status: "NOT_RELEASED"
        });

        libraryInserts.push({
          user_id: userId,
          book_id: book.id,
          progress: 0,
          last_read: new Date().toISOString()
        });
      }
    }

    // Use passed amount as fallback if no items (e.g. donations/subscriptions later)
    const finalAmount = totalVerifiedAmount > 0 ? totalVerifiedAmount : Number(amount);
    const totalCommission = finalAmount * 0.10;
    const totalWriterAmount = finalAmount * 0.90;

    // 4. Store parent transaction in Supabase Payments table
    const { data: paymentRecord, error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: finalAmount,
      currency: "INR",
      status: "SUCCESS",
      commission_amount: totalCommission,
      writer_amount: totalWriterAmount,
      project_id: projectId || null,
      payout_status: "NOT_RELEASED",
    }).select().single();

    if (insertError || !paymentRecord) {
      console.error("Error inserting payment record:", insertError);
      return NextResponse.json(
        { error: "Payment verified but failed to record in database" },
        { status: 500 }
      );
    }

    // 5. Store individual author splits in order_items and update wallets
    if (orderItemsToInsert.length > 0) {
      const splitsWithPaymentId = orderItemsToInsert.map(item => ({
        ...item,
        payment_id: paymentRecord.id
      }));
      
      const { error: splitError } = await supabaseAdmin.from("order_items").insert(splitsWithPaymentId);
      if (splitError) {
        console.error("Error inserting order_items (commission splits):", splitError);
      }

      // Update the available_balance for each author
      for (const item of orderItemsToInsert) {
        const { error: walletError } = await supabaseAdmin.rpc('increment_author_balance', {
          author_uuid: item.author_id,
          amount_to_add: item.writer_amount
        });
        if (walletError) {
          console.error(`Error updating wallet for author ${item.author_id}:`, walletError);
        }
      }
    }

    // 6. Book Unlocking: Add to user's library
    if (libraryInserts.length > 0) {
      const { error: libraryError } = await supabaseAdmin
        .from("library")
        .upsert(libraryInserts, { onConflict: 'user_id,book_id' });

      if (libraryError) {
        console.error("Error adding books to library:", libraryError);
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment due to unexpected server error" },
      { status: 500 }
    );
  }
}

