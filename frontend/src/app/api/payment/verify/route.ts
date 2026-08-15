import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendPaymentSuccessEmail, sendPurchaseReceipt, sendWriterSaleNotification } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
    );

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") || "",
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("===== AUTH DEBUG =====");
    console.log("User:", user);
    console.log("User ID:", user?.id);
    console.log("Auth Error:", authError);
    console.log("======================");

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

    // QUERY 1: idempotency check
    console.log("STEP A");
    console.log({ payment_id: razorpay_payment_id });
    console.log(userId);
    console.log(projectId);
    console.log(razorpay_payment_id);
    console.log(razorpay_order_id);
    console.log(amount);
    console.log("Executing query...");
    let existingPayment;
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("id")
        .eq("payment_id", razorpay_payment_id)
        .single();
      
      if (error && error.code !== "PGRST116") {
        console.error(error.message);
        console.error(error.details);
        console.error(error.hint);
        console.error(error.code);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      existingPayment = data;
      console.log("Query successful");
    } catch (error) {
      console.error(error);
      throw error;
    }

    if (existingPayment) {
      return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    const itemsToProcess = cartItems || (projectId ? [{ id: projectId }] : []);
    
    let totalVerifiedAmount = 0;
    const orderItemsToInsert = [];
    const libraryInserts = [];
    let books: any[] = [];

    if (itemsToProcess.length > 0) {
      const bookIds = itemsToProcess.map((i: any) => i.id);

      // QUERY 2: fetch books
      console.log("STEP A");
      console.log({ bookIds });
      console.log(userId);
      console.log(projectId);
      console.log(razorpay_payment_id);
      console.log(razorpay_order_id);
      console.log(amount);
      console.log("Executing query...");
      try {
        const { data, error } = await supabase
          .from("books")
          .select("id, title, price, author_id")
          .in("id", bookIds);

        if (error) {
          console.error(error.message);
          console.error(error.details);
          console.error(error.hint);
          console.error(error.code);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        books = data || [];
        console.log("Query successful");
      } catch (error) {
        console.error(error);
        throw error;
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

    const finalAmount = totalVerifiedAmount > 0 ? totalVerifiedAmount : Number(amount);
    const totalCommission = finalAmount * 0.10;
    const totalWriterAmount = finalAmount * 0.90;

    // QUERY 3: insert payments
    const paymentInsertData = {
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
    };

    console.log("STEP A");
    console.log(paymentInsertData);
    console.log(userId);
    console.log(projectId);
    console.log(razorpay_payment_id);
    console.log(razorpay_order_id);
    console.log(amount);
    console.log("Executing query...");
    let paymentRecord;
    try {
      const response = await supabase.from("payments").insert(paymentInsertData).select().single();
      const { data, error } = response;
      if (error) {
        console.error(error.message);
        console.error(error.details);
        console.error(error.hint);
        console.error(error.code);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        console.log(response);
      }
      paymentRecord = data;
      console.log("Query successful");
    } catch (error) {
      console.error(error);
      throw error;
    }

    // QUERY 4: insert order_items
    if (orderItemsToInsert.length > 0) {
      const splitsWithPaymentId = orderItemsToInsert.map(item => ({
        ...item,
        payment_id: paymentRecord?.id
      }));
      
      console.log("STEP A");
      console.log(splitsWithPaymentId);
      console.log(userId);
      console.log(projectId);
      console.log(razorpay_payment_id);
      console.log(razorpay_order_id);
      console.log(amount);
      console.log("Executing query...");
      try {
        const response = await supabase.from("order_items").insert(splitsWithPaymentId);
        const { error } = response;
        if (error) {
          console.error(error.message);
          console.error(error.details);
          console.error(error.hint);
          console.error(error.code);
        }
        if (!error && !response.data) {
          console.log(response);
        }
        console.log("Query successful");
      } catch (error) {
        console.error(error);
        throw error;
      }

      // QUERY 5: rpc increment_author_balance
      for (const item of orderItemsToInsert) {
        const rpcData = {
          author_uuid: item.author_id,
          amount_to_add: item.writer_amount
        };
        console.log("STEP A");
        console.log(rpcData);
        console.log(userId);
        console.log(projectId);
        console.log(razorpay_payment_id);
        console.log(razorpay_order_id);
        console.log(amount);
        console.log("Executing query...");
        try {
          const { error } = await supabase.rpc('increment_author_balance', rpcData);
          if (error) {
            console.error(error.message);
            console.error(error.details);
            console.error(error.hint);
            console.error(error.code);
          }
          console.log("Query successful");
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    }

    // QUERY 6: insert library
    if (libraryInserts.length > 0) {
      console.log("STEP A");
      console.log(libraryInserts);
      console.log(userId);
      console.log(projectId);
      console.log(razorpay_payment_id);
      console.log(razorpay_order_id);
      console.log(amount);
      console.log("Executing query...");
      try {
        const response = await supabase
          .from("library")
          .upsert(libraryInserts, { onConflict: 'user_id,book_id' });
        const { error } = response;
        if (error) {
          console.error(error.message);
          console.error(error.details);
          console.error(error.hint);
          console.error(error.code);
        }
        if (!error && !response.data) {
          console.log(response);
        }
        console.log("Query successful");
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

    // 7. Send Emails (Awaited to prevent serverless suspension)
    await (async () => {
      try {
        // QUERY 7: select buyer
        console.log("STEP A");
        console.log({ select: 'email, name', eq: userId });
        console.log(userId);
        console.log(projectId);
        console.log(razorpay_payment_id);
        console.log(razorpay_order_id);
        console.log(amount);
        console.log("Executing query...");
        const { data: buyer, error: buyerError } = await supabaseAdmin.from('users').select('email, name').eq('id', userId).single();
        if (buyerError) {
          console.error(buyerError.message);
          console.error(buyerError.details);
          console.error(buyerError.hint);
          console.error(buyerError.code);
        }
        console.log("Query successful");

        if (buyer?.email) {
          await sendPaymentSuccessEmail(buyer.email, finalAmount.toString());

          if (books && books.length > 0) {
            for (const book of books) {
              await sendPurchaseReceipt(buyer.email, book.title || 'Your Book', book.price?.toString() || '0');
              
              // QUERY 8: select writer
              console.log("STEP A");
              console.log({ select: 'email, name', eq: book.author_id });
              console.log(userId);
              console.log(projectId);
              console.log(razorpay_payment_id);
              console.log(razorpay_order_id);
              console.log(amount);
              console.log("Executing query...");
              const { data: writer, error: writerError } = await supabaseAdmin.from('users').select('email, name').eq('id', book.author_id).single();
              if (writerError) {
                console.error(writerError.message);
                console.error(writerError.details);
                console.error(writerError.hint);
                console.error(writerError.code);
              }
              console.log("Query successful");

              if (writer?.email) {
                await sendWriterSaleNotification(writer.email, writer.name || 'Writer', book.title || 'A Book', book.price?.toString() || '0');
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to send post-payment emails:", err);
      }
    })();

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment due to unexpected server error" },
      { status: 500 }
    );
  }
}
