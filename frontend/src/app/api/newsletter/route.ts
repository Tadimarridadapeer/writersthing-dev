import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendNewsletterWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Insert into database
    const { error: dbError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert([{ email }]);

    // If it's a unique constraint violation, they are already subscribed, which is fine
    if (dbError && dbError.code !== '23505') {
      console.error('Database error when subscribing to newsletter:', dbError);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Send welcome email only if it was a new subscription
    if (!dbError) {
      await sendNewsletterWelcomeEmail(email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
