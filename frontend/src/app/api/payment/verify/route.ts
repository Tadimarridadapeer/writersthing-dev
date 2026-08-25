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
      const { data, error } = await supabaseAdmin
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
      const response = await supabaseAdmin.from("payments").insert(paymentInsertData).select().single();
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

    // QUERY 4: insert purchases and author_earnings
    if (orderItemsToInsert.length > 0) {
      const purchasesToInsert = [];
      const earningsToInsert = [];
      
      for (const item of orderItemsToInsert) {
        purchasesToInsert.push({
          buyer_id: userId,
          book_id: item.book_id,
          order_id: razorpay_order_id,
          payment_id: paymentRecord.id,
          amount: item.amount,
          currency: "INR",
          status: "COMPLETED"
        });
      }
      
      console.log("STEP A: Inserting Purchases");
      let insertedPurchases: any[] = [];
      try {
        const response = await supabaseAdmin.from("purchases").insert(purchasesToInsert).select();
        const { data, error } = response;
        if (error) {
          console.error("Purchases insert error (table may not exist yet):", error.message);
        } else {
           insertedPurchases = data || [];
        }
      } catch (error) {
        console.error("Purchases insertion failed", error);
      }
      
      for (const item of orderItemsToInsert) {
        const purchase = insertedPurchases.find(p => p.book_id === item.book_id);
        if (purchase) {
          // author_earnings.author_id references authors(user_id), so resolve user_id from authors.id
          const { data: authorRec } = await supabaseAdmin.from('authors').select('user_id').eq('id', item.author_id).single();
          const resolvedAuthorUserId = authorRec?.user_id || item.author_id;
          earningsToInsert.push({
            author_id: resolvedAuthorUserId,
            book_id: item.book_id,
            purchase_id: purchase.id,
            gross_amount: item.amount,
            platform_fee: item.commission_amount,
            net_amount: item.writer_amount,
            status: "RECORDED"
          });
        }
      }
      
      if (earningsToInsert.length > 0) {
        console.log("STEP A: Inserting Author Earnings");
        try {
          const { error } = await supabaseAdmin.from("author_earnings").insert(earningsToInsert);
          if (error) {
            console.error("Earnings insert error (table may not exist yet):", error.message);
          }
        } catch (error) {
          console.error("Earnings insertion failed", error);
        }
      }

      // QUERY 5: Update balance and sales_count directly
      for (const item of orderItemsToInsert) {
        try {
          const { data: authorData } = await supabaseAdmin.from('authors').select('available_balance').eq('id', item.author_id).single();
          if (authorData) {
            const newBalance = Number(authorData.available_balance || 0) + Number(item.writer_amount);
            await supabaseAdmin.from('authors').update({ available_balance: newBalance }).eq('id', item.author_id);
          }
          
          const { data: bookData } = await supabaseAdmin.from('books').select('sales_count').eq('id', item.book_id).single();
          if (bookData) {
            const newSales = Number(bookData.sales_count || 0) + 1;
            await supabaseAdmin.from('books').update({ sales_count: newSales }).eq('id', item.book_id);
          }
        } catch (error) {
          console.error("Update execution failed", error);
        }
      }
    }

    // QUERY 6: insert library
    if (libraryInserts.length > 0) {
      console.log("STEP A: Upserting Library");
      try {
        const response = await supabaseAdmin
          .from("library")
          .upsert(libraryInserts, { onConflict: 'user_id,book_id' });
        const { error } = response;
        if (error) {
          console.error("Library upsert error:", error);
        }
      } catch (error) {
        console.error("Library upsert failed", error);
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
              
              // QUERY 8: resolve author's user_id and select writer
              console.log("STEP A: Looking up writer for book author_id:", book.author_id);
              // book.author_id is authors.id, need to resolve to users.id first
              const { data: authorRecord } = await supabaseAdmin.from('authors').select('user_id').eq('id', book.author_id).single();
              const writerUserId = authorRecord?.user_id || book.author_id;
              const { data: writer, error: writerError } = await supabaseAdmin.from('users').select('email, name').eq('id', writerUserId).single();
              if (writerError) {
                console.error("Writer lookup error:", writerError.message);
              }

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
