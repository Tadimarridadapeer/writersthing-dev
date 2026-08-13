import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin for backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// We need a securely authenticated cron endpoint or a secret to prevent unauthorized execution.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    // Basic shared secret check for CRON execution
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_cron_secret'}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch pending withdrawals that need auto-approval (created before EOD)
    // To simplify for this MVP, we fetch all 'Pending' withdrawals. 
    // In strict production, you'd filter by `created_at < END_OF_DAY`.
    const { data: pendingWithdrawals, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('status', 'Pending');

    if (fetchError) {
      console.error("Failed to fetch pending withdrawals:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      return NextResponse.json({ success: true, message: "No pending withdrawals to auto-approve" });
    }

    const results = [];

    // 2. Loop through and execute Razorpay Payouts
    for (const withdrawal of pendingWithdrawals) {
      try {
        // --- RAZORPAYX PAYOUT LOGIC ---
        // Note: To use this in production, you must have RazorpayX enabled and 
        // the correct API keys. This is a mockup of the actual call.
        const razorpayAuth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        
        // Step A: Create a contact or fund account if you haven't (RazorpayX requires a Fund Account ID usually).
        // Since the prompt requires "Money Sent to Writer" to their UPI, we assume UPI is valid.
        // For standard implementation, we mock the RazorpayX Payout API call since it requires
        // verified business accounts.
        
        /* 
        const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${razorpayAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, // Your RazorpayX Account
            fund_account_id: withdrawal.upi_id, // Mapped to actual Fund Account ID in production
            amount: withdrawal.amount * 100, // Amount in paise
            currency: 'INR',
            mode: 'UPI',
            purpose: 'payout',
            reference_id: withdrawal.id
          })
        });
        
        const payoutResult = await payoutResponse.json();
        if (!payoutResponse.ok) throw new Error(payoutResult.error?.description || 'Payout failed');
        */

        // For this backend integration, we will mark it as success to simulate the auto-debit working
        // as RazorpayX sandbox requires manual fund loads.
        const simulatedPayoutId = `pout_sim_${Math.floor(Math.random() * 100000000)}`;

        // Step B: Mark as Completed
        await supabaseAdmin
          .from('withdrawals')
          .update({ 
            status: 'Completed', 
            razorpay_payout_id: simulatedPayoutId,
            updated_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        results.push({ id: withdrawal.id, status: 'Completed', payout_id: simulatedPayoutId });

      } catch (err: any) {
        console.error(`Auto-approve failed for withdrawal ${withdrawal.id}:`, err);
        
        // If payout fails, mark it as Failed and refund the wallet
        await supabaseAdmin
          .from('withdrawals')
          .update({ 
            status: 'Failed',
            failure_reason: err.message || 'RazorpayX API Error',
            updated_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        // Refund available_balance
        // In real production, use RPC to safely increment.
        const { data: author } = await supabaseAdmin.from('authors').select('available_balance').eq('user_id', withdrawal.author_id).single();
        if (author) {
          await supabaseAdmin.from('authors').update({
            available_balance: Number(author.available_balance) + Number(withdrawal.amount)
          }).eq('user_id', withdrawal.author_id);
        }

        results.push({ id: withdrawal.id, status: 'Failed', error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("Error in auto-approve cron:", error);
    return NextResponse.json({ error: "Unexpected error occurred" }, { status: 500 });
  }
}
