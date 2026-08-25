import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Securely retrieve the author's saved UPI ID from the database
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('available_balance, user_id, upi_id')
      .eq('user_id', user.id)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
    }

    const upi_id = author.upi_id;
    if (!upi_id) {
      return NextResponse.json({ error: "No UPI ID configured. Please configure your payout details first." }, { status: 400 });
    }

    if (author.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
    }

    // 1. Lock balance & create processing record
    const newAvailable = Number(author.available_balance) - Number(amount);
    
    const { error: updateError } = await supabaseAdmin
      .from('authors')
      .update({ available_balance: newAvailable })
      .eq('user_id', user.id);
      
    if (updateError) {
      return NextResponse.json({ error: "Failed to lock balance" }, { status: 500 });
    }

    const { data: withdrawal, error: insertError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        author_id: user.id,
        amount,
        upi_id,
        status: 'Processing' // Initial status before Razorpay confirms processing
      })
      .select()
      .single();

    if (insertError || !withdrawal) {
      await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 });
    }

    const razorpayAuth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    if (!process.env.RAZORPAYX_ACCOUNT_NUMBER) {
      await supabaseAdmin.from('withdrawals').update({ status: 'Failed', failure_reason: 'Missing RazorpayX Account Number configuration' }).eq('id', withdrawal.id);
      await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
      return NextResponse.json({ 
        error: "Configuration Error: RazorpayX Account Number (RAZORPAYX_ACCOUNT_NUMBER) is not configured in the environment." 
      }, { status: 501 });
    }

    // 2. Get or Create Razorpay Contact
    const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${razorpayAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.user_metadata?.name || user.email || 'Author',
        email: user.email,
        reference_id: user.id,
        type: 'vendor'
      })
    });
    
    const contactData = await contactRes.json();
    if (!contactRes.ok && contactData.error?.code !== 'BAD_REQUEST_ERROR') {
      // It returns BAD_REQUEST if reference_id already exists sometimes, but Razorpay actually supports idempotent contact creation if details match.
      // If it fails because reference_id exists, we'd need to GET it. Let's handle both.
    }
    
    let contactId = contactData.id;
    if (!contactId && contactData.error?.description?.includes('reference_id already exists')) {
      // Find the contact
      const getContactRes = await fetch(`https://api.razorpay.com/v1/contacts?reference_id=${user.id}`, {
        headers: { 'Authorization': `Basic ${razorpayAuth}` }
      });
      const getContactData = await getContactRes.json();
      if (getContactData.items && getContactData.items.length > 0) {
        contactId = getContactData.items[0].id;
      }
    }

    if (!contactId) {
      await supabaseAdmin.from('withdrawals').update({ status: 'Failed', failure_reason: 'Failed to create or resolve Razorpay Contact' }).eq('id', withdrawal.id);
      await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
      return NextResponse.json({ error: "Failed to resolve payout contact." }, { status: 500 });
    }

    // 3. Get or Create Razorpay Fund Account
    let fundAccountId = null;
    const fundAccsRes = await fetch(`https://api.razorpay.com/v1/fund_accounts?contact_id=${contactId}`, {
      headers: { 'Authorization': `Basic ${razorpayAuth}` }
    });
    const fundAccsData = await fundAccsRes.json();
    
    if (fundAccsData.items && fundAccsData.items.length > 0) {
      const match = fundAccsData.items.find((fa: any) => fa.account_type === 'vpa' && fa.vpa.address === upi_id && fa.active);
      if (match) fundAccountId = match.id;
    }

    if (!fundAccountId) {
      const createFaRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${razorpayAuth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          account_type: 'vpa',
          vpa: { address: upi_id }
        })
      });
      const createFaData = await createFaRes.json();
      if (!createFaRes.ok) {
        await supabaseAdmin.from('withdrawals').update({ status: 'Failed', failure_reason: createFaData.error?.description || 'Failed to create Fund Account' }).eq('id', withdrawal.id);
        await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
        return NextResponse.json({ error: `Failed to create fund account: ${createFaData.error?.description}` }, { status: 400 });
      }
      fundAccountId = createFaData.id;
    }

    // 4. Initiate RazorpayX Payout
    const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
        fund_account_id: fundAccountId,
        amount: amount * 100, // paise
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        reference_id: withdrawal.id
      })
    });

    const payoutResult = await payoutResponse.json();

    if (!payoutResponse.ok) {
      await supabaseAdmin.from('withdrawals').update({ 
        status: 'Failed', 
        failure_reason: payoutResult.error?.description || 'Razorpay Payout API rejected the request.'
      }).eq('id', withdrawal.id);
      
      await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
      
      return NextResponse.json({ 
        error: `Razorpay Integration Error: ${payoutResult.error?.description || 'Failed to process payout via Razorpay.'}`
      }, { status: 400 });
    }

    // 5. Update based on Razorpay's returned status (usually 'processing' or 'queued')
    // We do NOT mark it as 'Completed' unless Razorpay says 'processed'.
    const razorpayStatus = payoutResult.status; // e.g. processing, processed, queued, rejected
    let internalStatus = 'Processing';
    if (razorpayStatus === 'processed') internalStatus = 'Completed';
    else if (razorpayStatus === 'rejected' || razorpayStatus === 'reversed') internalStatus = 'Failed';
    else if (razorpayStatus === 'queued') internalStatus = 'Pending';
    
    await supabaseAdmin
      .from('withdrawals')
      .update({ 
        status: internalStatus, 
        razorpay_payout_id: payoutResult.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id);
      
    // If it instantly failed on Razorpay's end despite returning 200 (rare but possible), revert the balance
    if (internalStatus === 'Failed') {
      await supabaseAdmin.from('authors').update({ available_balance: author.available_balance }).eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, message: "Withdrawal processed", status: internalStatus });

  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: "Unexpected error occurred during withdrawal processing" }, { status: 500 });
  }
}
